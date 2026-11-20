import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import NuevaOrdenCompraPage from '@/modules/compras/pages/NuevaOrdenCompraPage';

export default async function PaginaNuevaOrdenCompra() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Nueva Orden de Compra...</div>}>
      <NuevaOrdenCompraPage />
    </Suspense>
  );
}

