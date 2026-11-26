import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import GestionFacturasProveedorPage from '@/modules/compras/pages/GestionFacturasProveedorPage';

export default async function PaginaGestionFacturas() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Cargando Gestión de Facturas de Proveedor...</div>}>
      <GestionFacturasProveedorPage />
    </Suspense>
  );
}

