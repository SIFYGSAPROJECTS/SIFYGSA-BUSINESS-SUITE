import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import DashboardProveedoresPage from '@/modules/compras/pages/DashboardProveedoresPage';

export default async function PaginaDashboardProveedores() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Gestión de Proveedores...</div>}>
      <DashboardProveedoresPage />
    </Suspense>
  );
}

