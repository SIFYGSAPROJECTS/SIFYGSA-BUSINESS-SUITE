import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import NuevoProveedorPage from '@/modules/compras/pages/NuevoProveedorPage';

export default async function PaginaNuevoProveedor() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Alta de Proveedor...</div>}>
      <NuevoProveedorPage />
    </Suspense>
  );
}

