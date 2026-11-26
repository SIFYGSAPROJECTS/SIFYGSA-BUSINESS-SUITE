import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo, tienePermiso } from '@/lib/permissions';
import MantenimientoArticulosPage from '@/modules/almacen/pages/MantenimientoArticulosPage';

export default async function PaginaAlmacenMantenimiento() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'almacen', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Almacen');
  }

  const puedeGestionar =
    tienePermiso(sesion.rol, 'almacen', 'crear', sesion.modulosPermitidos) ||
    tienePermiso(sesion.rol, 'almacen', 'editar', sesion.modulosPermitidos);

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Control de Mantenimiento SIFYGSA...</div>}>
      <MantenimientoArticulosPage
        puedeGestionar={puedeGestionar}
        usuarioActual={sesion.nombre}
      />
    </Suspense>
  );
}
