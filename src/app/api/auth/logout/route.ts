import { NextResponse } from 'next/server';
import { registrarAccionUsuario } from '@/lib/audit';
import { NOMBRE_COOKIE_SESION, obtenerSesionActual } from '@/lib/auth';

export async function POST() {
  const sesion = await obtenerSesionActual();
  if (sesion) {
    await registrarAccionUsuario({
      usuarioId: sesion.sub,
      usuarioNombre: sesion.nombre,
      rol: sesion.rol,
      modulo: 'auth',
      tipoEvento: 'cierre_sesion',
      entidad: 'Sesión JWT',
      entidadId: sesion.sub,
      detalle: 'Cierre de sesión de usuario.',
    });
  }

  const respuesta = NextResponse.json({
    exito: true,
    mensaje: 'Sesión cerrada exitosamente.',
  });

  respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
  return respuesta;
}
