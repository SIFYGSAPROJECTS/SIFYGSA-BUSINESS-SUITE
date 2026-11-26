import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import DetalleOrdenCompraPage from '@/modules/compras/pages/DetalleOrdenCompraPage';

export default async function PaginaDetalleOrdenCompra() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Cargando Detalle de Orden de Compra...</div>}>
      <DetalleOrdenCompraPage />
    </Suspense>
  );
}
