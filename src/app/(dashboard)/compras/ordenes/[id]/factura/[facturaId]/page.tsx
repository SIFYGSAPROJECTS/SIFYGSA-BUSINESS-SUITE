import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import GestionFacturasProveedorPage from '@/modules/compras/pages/GestionFacturasProveedorPage';

export default async function PaginaVerFacturaOrden() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Cargando Detalle de Factura...</div>}>
      <GestionFacturasProveedorPage modo="ver" />
    </Suspense>
  );
}

