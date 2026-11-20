import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import { MenuPrincipalComprasPage } from '@/modules/compras/pages/MenuPrincipalComprasPage';

export default async function PaginaComprasRoot() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'compras', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Compras+%26+Adquisiciones');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Compras...</div>}>
      <MenuPrincipalComprasPage />
    </Suspense>
  );
}
