import { NextRequest, NextResponse } from 'next/server';
import {
  NOMBRE_COOKIE_SESION,
  construirOpcionesCookie,
  esquemaCredencialesLogin,
  firmarTokenSesion,
  manejarErrorApi,
} from '@/lib/auth';
import { autenticarUsuario } from '@/modules/admin/services/admin.service';
import { obtenerRutaInicialParaUsuario } from '@/modules/registry';

export async function POST(request: NextRequest) {
  try {
    const cuerpo = (await request.json()) as unknown;
    const credenciales = esquemaCredencialesLogin.parse(cuerpo);

    const resultado = await autenticarUsuario(
      credenciales.identificador,
      credenciales.password
    );

    if (!resultado.exito || !resultado.usuario) {
      return NextResponse.json(
        {
          exito: false,
          error: resultado.error ?? 'Credenciales inválidas.',
        },
        { status: resultado.bloqueado ? 429 : 401 }
      );
    }

    const usr = resultado.usuario;
    const token = await firmarTokenSesion({
      sub: usr.id,
      usuario: usr.usuario,
      nombre: usr.nombre,
      email: usr.email,
      rol: usr.rol,
      zona: usr.zona,
      departamento: usr.departamento,
      modulosPermitidos: usr.modulosPermitidos,
    });

    const rutaDestino = obtenerRutaInicialParaUsuario(
      usr.rol,
      usr.modulosPermitidos
    );

    const respuesta = NextResponse.json({
      exito: true,
      mensaje: 'Autenticación exitosa',
      datos: {
        usuario: usr,
        rutaDestino,
      },
    });

    respuesta.cookies.set(
      NOMBRE_COOKIE_SESION,
      token,
      construirOpcionesCookie()
    );

    return respuesta;
  } catch (error) {
    return manejarErrorApi(error);
  }
}
