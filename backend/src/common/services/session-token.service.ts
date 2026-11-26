import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import {
  DURACION_SESION_SEGUNDOS,
  INACTIVIDAD_MAXIMA_MS,
  NOMBRE_COOKIE_SESION,
  esquemaPayloadSesion,
  type PayloadSesion,
} from '../types/erp.types';

export interface ResultadoVerificacionSesion {
  valida: boolean;
  sesion?: PayloadSesion;
  motivoInvalidez?: 'token_invalido' | 'inactividad_expirada';
}

@Injectable()
export class SessionTokenService {
  private obtenerSecretoJwt(): Uint8Array {
    const secreto =
      process.env.AUTH_SECRET ||
      'sifygsa_erp_super_secret_jwt_key_2026_production_grade_min32chars';
    return new TextEncoder().encode(secreto);
  }

  async firmarTokenSesion(
    datos: Omit<PayloadSesion, 'ultimaActividad'> & { ultimaActividad?: number }
  ): Promise<string> {
    const payload: PayloadSesion = {
      ...datos,
      ultimaActividad: datos.ultimaActividad ?? Date.now(),
    };

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(datos.sub)
      .setIssuedAt()
      .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
      .sign(this.obtenerSecretoJwt());
  }

  async verificarTokenSesion(
    token: string | undefined | null
  ): Promise<ResultadoVerificacionSesion> {
    if (!token) {
      return { valida: false, motivoInvalidez: 'token_invalido' };
    }

    try {
      const { payload } = await jwtVerify(token, this.obtenerSecretoJwt(), {
        algorithms: ['HS256'],
      });

      const validado = esquemaPayloadSesion.safeParse(payload);
      if (!validado.success) {
        return { valida: false, motivoInvalidez: 'token_invalido' };
      }

      const inactividadMin = Number(process.env.SESSION_INACTIVITY_MINUTES ?? '30');
      const limiteMs =
        Number.isFinite(inactividadMin) && inactividadMin > 0
          ? inactividadMin * 60 * 1000
          : INACTIVIDAD_MAXIMA_MS;

      if (Date.now() - validado.data.ultimaActividad > limiteMs) {
        return { valida: false, motivoInvalidez: 'inactividad_expirada' };
      }

      return { valida: true, sesion: validado.data };
    } catch {
      return { valida: false, motivoInvalidez: 'token_invalido' };
    }
  }

  construirOpcionesCookie(maxAgeSegundos: number = DURACION_SESION_SEGUNDOS) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAgeSegundos * 1000, // Express cookie maxAge está en milisegundos
    };
  }

  get nombreCookie(): string {
    return NOMBRE_COOKIE_SESION;
  }
}
