import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { OrdenesPendientesPage } from '@/modules/compras/pages/OrdenesPendientesPage';

export default async function PaginaOrdenesPendientes() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Órdenes Pendientes...</div>}>
      <OrdenesPendientesPage />
    </Suspense>
  );
}
