import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import HubModulosArticulosPage from '@/modules/almacen/pages/HubModulosArticulosPage';

export default async function PaginaHubModulosArticulos() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'almacen', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Almacen');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Módulos de Artículos...</div>}>
      <HubModulosArticulosPage />
    </Suspense>
  );
}
