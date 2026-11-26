import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import { EditarOrdenFacturasPage } from '@/modules/compras/pages/EditarOrdenFacturasPage';

export default async function PaginaEditarOrdenFacturas() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'compras', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Compras+%26+Adquisiciones');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Editar Orden de Compra / Facturas...</div>}>
      <EditarOrdenFacturasPage />
    </Suspense>
  );
}
