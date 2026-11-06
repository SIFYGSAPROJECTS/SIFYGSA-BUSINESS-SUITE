import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { consultarAuditoria } from '@/lib/audit';
import { obtenerSesionActual } from '@/lib/auth';
import { verificarPermisoServidor } from '@/lib/permissions/server';
import {
  listarUsuariosPublicos,
  obtenerMatrizRolesPermisos,
} from '@/modules/admin/services/admin.service';
import { PanelAdminCliente } from '@/modules/admin/components/PanelAdminCliente';
import { obtenerDatosCrm } from '@/modules/crm/services/crm.service';
import { listarRequisiciones } from '@/modules/requisiciones/services/requisiciones.service';
import { obtenerDatosRrhhSegurosPorRol } from '@/modules/rrhh/services/rrhh.service';

export default async function PaginaAdmin() {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect('/login');

  const permitido = await verificarPermisoServidor(
    sesion.rol,
    'admin',
    'ver',
    sesion.modulosPermitidos
  );
  if (!permitido) {
    redirect('/sin-acceso?modulo=Administración');
  }

  const [usuarios, matriz, auditoria, crm, requisiciones, rrhh] = await Promise.all([
    listarUsuariosPublicos(),
    obtenerMatrizRolesPermisos(),
    consultarAuditoria({ pagina: 1, limite: 10 }),
    obtenerDatosCrm(),
    listarRequisiciones(),
    obtenerDatosRrhhSegurosPorRol(sesion.rol),
  ]);

  const indicadores = {
    usuariosActivos: usuarios.filter((u) => u.estado === 'activo').length,
    usuariosTotales: usuarios.length,
    oportunidadesActivas: crm.oportunidades.filter(
      (o) => o.etapa !== 'ganado' && o.etapa !== 'perdido'
    ).length,
    valorPipelineCrm: crm.oportunidades
      .filter((o) => o.etapa !== 'ganado' && o.etapa !== 'perdido')
      .reduce((s, o) => s + o.montoEstimado, 0),
    requisicionesPendientes: requisiciones.filter(
      (r) => r.estado !== 'cierre' && r.estado !== 'rechazada'
    ).length,
    montoRequisicionesMes: requisiciones.reduce((s, r) => s + r.total, 0),
    empleadosActivos: rrhh.empleados.filter((e) => e.estado === 'activo').length,
    solicitudesRrhhPendientes: rrhh.vacacionesPermisos.filter(
      (v) => v.estado === 'pendiente'
    ).length,
    eventosAuditoriaHoy: auditoria.total,
  };

  return (
    <Suspense fallback={<div>Cargando Panel de Administración...</div>}>
      <PanelAdminCliente
        indicadores={indicadores}
        usuariosIniciales={usuarios}
        matrizInicial={matriz}
        eventosAuditoriaIniciales={auditoria.eventos}
        totalAuditoriaInicial={auditoria.total}
      />
    </Suspense>
  );
}
