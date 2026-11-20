import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import DashboardOrdenesCompraPage from '@/modules/compras/pages/DashboardOrdenesCompraPage';

export default async function PaginaDashboardOrdenesCompra() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Órdenes de Compra...</div>}>
      <DashboardOrdenesCompraPage />
    </Suspense>
  );
}

