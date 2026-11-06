import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import { obtenerDatosRrhhSegurosPorRol } from '@/modules/rrhh/services/rrhh.service';
import { ContenedorRrhhCliente } from '@/modules/rrhh/components/ContenedorRrhhCliente';

export default async function PaginaModuloRrhh() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'rrhh', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Recursos+Humanos');
  }

  const datos = await obtenerDatosRrhhSegurosPorRol(sesion.rol);

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando módulo RRHH...</div>}>
      <ContenedorRrhhCliente
        datosIniciales={datos}
        rolUsuario={sesion.rol}
        nombreUsuario={sesion.nombre}
        emailUsuario={sesion.email}
      />
    </Suspense>
  );
}
