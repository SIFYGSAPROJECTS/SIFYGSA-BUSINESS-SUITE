import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { AutorizacionOrdenesPage } from '@/modules/compras/pages/AutorizacionOrdenesPage';

export default async function PaginaAutorizacionOrdenes() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Autorización de Órdenes...</div>}>
      <AutorizacionOrdenesPage />
    </Suspense>
  );
}
