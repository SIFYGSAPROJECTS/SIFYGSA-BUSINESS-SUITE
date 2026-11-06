import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import { listarRequisicionesParaUsuario } from '@/modules/requisiciones/services/requisiciones.service';
import { ContenedorRequisicionesCliente } from '@/modules/requisiciones/components/ContenedorRequisicionesCliente';

export default async function PaginaModuloRequisiciones() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'requisiciones', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Requisiciones');
  }

  const requisiciones = await listarRequisicionesParaUsuario(sesion);

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando módulo de Requisiciones...</div>}>
      <ContenedorRequisicionesCliente
        requisicionesIniciales={requisiciones}
        rolUsuario={sesion.rol}
        nombreUsuario={sesion.nombre}
        idUsuario={sesion.sub}
      />
    </Suspense>
  );
}
