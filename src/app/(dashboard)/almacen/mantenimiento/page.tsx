import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import MantenimientoArticulosPage from '@/modules/almacen/pages/MantenimientoArticulosPage';

export default async function PaginaAlmacenMantenimiento() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'almacen', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Almacen');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Control de Mantenimiento SIFYGSA...</div>}>
      <MantenimientoArticulosPage />
    </Suspense>
  );
}

