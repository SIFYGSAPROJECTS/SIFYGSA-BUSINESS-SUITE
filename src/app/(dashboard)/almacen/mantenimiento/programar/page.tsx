import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo, tienePermiso } from '@/lib/permissions';
import ProgramarMantenimientoPage from '@/modules/almacen/pages/ProgramarMantenimientoPage';

export default async function PaginaProgramarMantenimiento() {
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

  if (!puedeGestionar) {
    redirect('/almacen/mantenimiento');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Programación de Mantenimiento...</div>}>
      <ProgramarMantenimientoPage usuarioActual={sesion.nombre} />
    </Suspense>
  );
}
