import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import { MenuPrincipalAlmacenPage } from '@/modules/almacen/pages/MenuPrincipalAlmacenPage';

export default async function PaginaAlmacenRoot() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'almacen', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Almacen');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Almacén SIFYGSA...</div>}>
      <MenuPrincipalAlmacenPage />
    </Suspense>
  );
}
