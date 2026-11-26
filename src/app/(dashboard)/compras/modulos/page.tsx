import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { HubModulosComprasPage } from '@/modules/compras/pages/HubModulosComprasPage';

export default async function PaginaHubModulosCompras() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Módulos de Compras...</div>}>
      <HubModulosComprasPage />
    </Suspense>
  );
}
