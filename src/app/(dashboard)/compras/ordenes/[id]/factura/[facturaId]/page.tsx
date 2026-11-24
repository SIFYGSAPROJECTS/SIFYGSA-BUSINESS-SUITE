import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import RegistroFacturaProveedorPage from '@/modules/compras/pages/RegistroFacturaProveedorPage';

export default async function PaginaEditarFacturaOrden({
  params,
}: {
  params: Promise<{ id: string; facturaId: string }>;
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  const { facturaId } = await params;

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Cargando Editor de Factura...</div>}>
      <RegistroFacturaProveedorPage facturaIdProp={decodeURIComponent(facturaId)} />
    </Suspense>
  );
}
