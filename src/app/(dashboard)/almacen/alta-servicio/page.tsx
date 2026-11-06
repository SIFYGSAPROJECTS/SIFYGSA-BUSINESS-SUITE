import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import AltaServicioNoInventariablePage from '@/modules/almacen/pages/AltaServicioNoInventariablePage';

export default async function PaginaAltaServicio() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'almacen', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Almacen');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Alta de Servicio...</div>}>
      <AltaServicioNoInventariablePage />
    </Suspense>
  );
}

