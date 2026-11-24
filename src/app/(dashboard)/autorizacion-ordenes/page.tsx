import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { tienePermiso } from '@/lib/permissions';
import { AutorizacionOrdenesPage } from '@/modules/compras/pages/AutorizacionOrdenesPage';

export default async function PaginaAutorizacionOrdenesModulo() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!tienePermiso(sesion.rol, 'autorizacion-ordenes', 'aprobar', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Autorizaci%C3%B3n+de+%C3%93rdenes+de+Compra');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Mesa de Validación...</div>}>
      <AutorizacionOrdenesPage />
    </Suspense>
  );
}
