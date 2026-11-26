import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { AccionPermiso, IdModulo, RespuestaApi } from '@/config/types';
import { verificarPermisoServidor } from '@/lib/permissions/server';
import {
  NOMBRE_COOKIE_SESION,
  verificarTokenSesion,
  type PayloadSesion,
} from './session';

export const esquemaCredencialesLogin = z.object({
  identificador: z
    .string()
    .trim()
    .min(3, 'Ingresa tu usuario o correo electrónico corporativo'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type CredencialesLogin = z.infer<typeof esquemaCredencialesLogin>;

export async function obtenerSesionActual(): Promise<PayloadSesion | null> {
  const almacenCookies = await cookies();
  const token = almacenCookies.get(NOMBRE_COOKIE_SESION)?.value;
  const resultado = await verificarTokenSesion(token);
  return resultado.valida && resultado.sesion ? resultado.sesion : null;
}

export class ErrorAutorizacion extends Error {
  public readonly codigoEstado: number;

  constructor(mensaje: string, codigoEstado: number = 403) {
    super(mensaje);
    this.name = 'ErrorAutorizacion';
    this.codigoEstado = codigoEstado;
  }
}

export async function exigirSesion(): Promise<PayloadSesion> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    throw new ErrorAutorizacion('Sesión expirada o no autenticada. Inicia sesión nuevamente.', 401);
  }
  return sesion;
}

export async function exigirPermiso(
  modulo: IdModulo,
  accion: AccionPermiso
): Promise<PayloadSesion> {
  const sesion = await exigirSesion();
  const permitido = await verificarPermisoServidor(
    sesion.rol,
    modulo,
    accion,
    sesion.modulosPermitidos
  );

  if (!permitido) {
    throw new ErrorAutorizacion(
      `Tu rol (${sesion.rol}) no tiene permiso para "${accion}" en el módulo "${modulo}".`,
      403
    );
  }

  return sesion;
}

export function manejarErrorApi(error: unknown): NextResponse<RespuestaApi<never>> {
  if (error instanceof ErrorAutorizacion) {
    return NextResponse.json(
      { exito: false, error: error.message },
      { status: error.codigoEstado }
    );
  }

  if (error instanceof z.ZodError) {
    const detalles = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return NextResponse.json(
      {
        exito: false,
        error: detalles[0] ?? 'Datos de entrada inválidos',
        detalles,
      },
      { status: 400 }
    );
  }

  const mensaje =
    error instanceof Error ? error.message : 'Error interno del servidor';
  return NextResponse.json({ exito: false, error: mensaje }, { status: 500 });
}

export {
  NOMBRE_COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
  INACTIVIDAD_MAXIMA_MS,
  firmarTokenSesion,
  verificarTokenSesion,
  construirOpcionesCookie,
  type PayloadSesion,
} from './session';
export { hashearPassword, verificarPassword } from './password';
export {
  verificarEstadoBloqueo,
  registrarIntentoFallido,
  limpiarIntentosFallidos,
} from './rate-limit';
