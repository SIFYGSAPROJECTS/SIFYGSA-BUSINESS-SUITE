import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { OrdenesPorActualizarPage } from '@/modules/compras/pages/OrdenesPorActualizarPage';

export default async function PaginaOrdenesPorActualizar() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Órdenes por Actualizar...</div>}>
      <OrdenesPorActualizarPage />
    </Suspense>
  );
}
