import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { tienePermiso } from '@/lib/permissions';

export default async function PaginaAutorizarOrdenesRedirect() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!tienePermiso(sesion.rol, 'autorizacion-ordenes', 'aprobar', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Autorizaci%C3%B3n+de+%C3%93rdenes+de+Compra');
  }

  redirect('/autorizacion-ordenes');
}
