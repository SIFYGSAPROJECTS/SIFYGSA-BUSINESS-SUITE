import { NextResponse, type NextRequest } from 'next/server';
import {
  NOMBRE_COOKIE_SESION,
  construirOpcionesCookie,
  firmarTokenSesion,
  verificarTokenSesion,
} from '@/lib/auth/session';
import { puedeAccederModulo } from '@/lib/permissions/matrix';
import {
  obtenerModuloPorRuta,
  obtenerRutaInicialParaUsuario,
} from '@/modules/registry';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos, recursos públicos y rutas de API de autenticación
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const verificacion = await verificarTokenSesion(token);

  // Si intenta entrar a /login teniendo sesión activa, enviarlo a su módulo inicial
  if (pathname === '/login') {
    if (verificacion.valida && verificacion.sesion) {
      const destino = obtenerRutaInicialParaUsuario(
        verificacion.sesion.rol,
        verificacion.sesion.modulosPermitidos
      );
      return NextResponse.redirect(new URL(destino, request.url));
    }
    return NextResponse.next();
  }

  // Protección de endpoints API (excepto /api/auth)
  if (pathname.startsWith('/api/')) {
    if (!verificacion.valida || !verificacion.sesion) {
      return NextResponse.json(
        {
          exito: false,
          error:
            verificacion.motivoInvalidez === 'inactividad_expirada'
              ? 'Tu sesión expiró por inactividad. Inicia sesión nuevamente.'
              : 'No autenticado.',
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Si no hay sesión válida en cualquier ruta protegida, redirigir a /login
  if (!verificacion.valida || !verificacion.sesion) {
    const urlLogin = new URL('/login', request.url);
    if (verificacion.motivoInvalidez === 'inactividad_expirada') {
      urlLogin.searchParams.set('motivo', 'inactividad');
    }
    const respuesta = NextResponse.redirect(urlLogin);
    respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
    return respuesta;
  }

  const sesion = verificacion.sesion;

  // Verificar permisos de acceso al módulo solicitado
  const moduloSolicitado = obtenerModuloPorRuta(pathname);
  if (moduloSolicitado) {
    const tieneAcceso = puedeAccederModulo(
      sesion.rol,
      moduloSolicitado.id,
      sesion.modulosPermitidos
    );

    if (!tieneAcceso) {
      const urlSinAcceso = new URL('/sin-acceso', request.url);
      urlSinAcceso.searchParams.set('modulo', moduloSolicitado.nombre);
      return NextResponse.redirect(urlSinAcceso);
    }
  }

  // Renovar marca de actividad de sesión (expiración deslizante por inactividad)
  const respuesta = NextResponse.next();
  const nuevoToken = await firmarTokenSesion({
    ...sesion,
    ultimaActividad: Date.now(),
  });
  respuesta.cookies.set(NOMBRE_COOKIE_SESION, nuevoToken, construirOpcionesCookie());

  return respuesta;
}

export default middleware;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
