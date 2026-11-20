import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { HubModulosProveedoresPage } from '@/modules/compras/pages/HubModulosProveedoresPage';

export default async function PaginaHubModulosComprasProveedores() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Módulos de Proveedores...</div>}>
      <HubModulosProveedoresPage />
    </Suspense>
  );
}
