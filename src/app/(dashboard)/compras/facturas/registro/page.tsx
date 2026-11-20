import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import RegistroFacturaProveedorPage from '@/modules/compras/pages/RegistroFacturaProveedorPage';

export default async function PaginaRegistroFacturaProveedor() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Cargando Registro de Factura de Proveedor...</div>}>
      <RegistroFacturaProveedorPage />
    </Suspense>
  );
}

