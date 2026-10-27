import { SignJWT, jwtVerify } from 'jose';
import {
  esquemaIdModulo,
  esquemaRolUsuario,
  esquemaZonaComercial,
  type IdModulo,
  type RolUsuario,
  type ZonaComercial,
} from '@/config/types';
import { z } from 'zod';

export const NOMBRE_COOKIE_SESION = 'sfg_erp_session';
export const DURACION_SESION_SEGUNDOS = 8 * 60 * 60; // 8 horas
export const INACTIVIDAD_MAXIMA_MS = 30 * 60 * 1000; // 30 minutos de inactividad

export const esquemaPayloadSesion = z.object({
  sub: z.string(),
  usuario: z.string(),
  nombre: z.string(),
  email: z.string(),
  rol: esquemaRolUsuario,
  zona: esquemaZonaComercial.optional(),
  departamento: z.string().optional(),
  modulosPermitidos: z.array(esquemaIdModulo),
  ultimaActividad: z.number(),
});

export type PayloadSesion = z.infer<typeof esquemaPayloadSesion>;

function obtenerSecretoJwt(): Uint8Array {
  const secreto =
    process.env.AUTH_SECRET ??
    'sifygsa_erp_super_secret_jwt_key_2026_production_grade_min32chars';
  return new TextEncoder().encode(secreto);
}

export async function firmarTokenSesion(
  datos: Omit<PayloadSesion, 'ultimaActividad'> & { ultimaActividad?: number }
): Promise<string> {
  const ahoraMs = datos.ultimaActividad ?? Date.now();
  const payload: PayloadSesion = {
    ...datos,
    ultimaActividad: ahoraMs,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(datos.sub)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
    .sign(obtenerSecretoJwt());
}

export interface ResultadoVerificacionSesion {
  valida: boolean;
  sesion?: PayloadSesion;
  motivoInvalidez?: 'token_invalido' | 'inactividad_expirada';
}

export async function verificarTokenSesion(
  token: string | undefined | null
): Promise<ResultadoVerificacionSesion> {
  if (!token) {
    return { valida: false, motivoInvalidez: 'token_invalido' };
  }

  try {
    const { payload } = await jwtVerify(token, obtenerSecretoJwt(), {
      algorithms: ['HS256'],
    });

    const validado = esquemaPayloadSesion.safeParse(payload);
    if (!validado.success) {
      return { valida: false, motivoInvalidez: 'token_invalido' };
    }

    const inactividadMaxMinutos = Number(process.env.SESSION_INACTIVITY_MINUTES ?? '30');
    const limiteInactividadMs =
      Number.isFinite(inactividadMaxMinutos) && inactividadMaxMinutos > 0
        ? inactividadMaxMinutos * 60 * 1000
        : INACTIVIDAD_MAXIMA_MS;

    if (Date.now() - validado.data.ultimaActividad > limiteInactividadMs) {
      return { valida: false, motivoInvalidez: 'inactividad_expirada' };
    }

    return { valida: true, sesion: validado.data };
  } catch {
    return { valida: false, motivoInvalidez: 'token_invalido' };
  }
}

export function construirOpcionesCookie(maxAgeSegundos: number = DURACION_SESION_SEGUNDOS) {
  return {
    name: NOMBRE_COOKIE_SESION,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSegundos,
  };
}

export type DatosUsuarioSesion = {
  id: string;
  usuario: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  zona?: ZonaComercial;
  departamento?: string;
  modulosPermitidos: IdModulo[];
};
