import type { RolUsuario } from '@/config/types';
import { NIVELES_APROBACION_MONTO } from '../constants';
import type { AlertaPendienteRequisicion, Requisicion } from '../types';

export function obtenerAlertasPendientesPorRol(
  requisiciones: Requisicion[],
  rol: RolUsuario
): AlertaPendienteRequisicion[] {
  const alertas: AlertaPendienteRequisicion[] = [];

  for (const req of requisiciones) {
    if (req.estado === 'solicitud' || req.estado === 'revision') {
      const rolesRevisor: RolUsuario[] = ['requisiciones', 'gerente', 'administrador'];
      if (rolesRevisor.includes(rol)) {
        alertas.push({
          requisicionId: req.id,
          folio: req.folio,
          solicitante: req.solicitante,
          area: req.area,
          estado: req.estado,
          total: req.total,
          accionRequerida:
            req.estado === 'solicitud'
              ? 'Pasar a Revisión Técnica'
              : 'Enviar a Aprobación Presupuestal',
          rolesNotificados: rolesRevisor,
        });
      }
    } else if (req.estado === 'aprobacion') {
      const infoNivel =
        NIVELES_APROBACION_MONTO.find((n) => n.nivel === req.nivelAprobacionRequerido) ??
        NIVELES_APROBACION_MONTO[2];

      if (infoNivel.rolesAutorizados.includes(rol)) {
        alertas.push({
          requisicionId: req.id,
          folio: req.folio,
          solicitante: req.solicitante,
          area: req.area,
          estado: req.estado,
          total: req.total,
          accionRequerida: `Aprobar (${infoNivel.etiqueta})`,
          rolesNotificados: infoNivel.rolesAutorizados,
        });
      }
    } else if (req.estado === 'atencion') {
      const rolesAtencion: RolUsuario[] = ['requisiciones', 'administrador'];
      if (rolesAtencion.includes(rol)) {
        alertas.push({
          requisicionId: req.id,
          folio: req.folio,
          solicitante: req.solicitante,
          area: req.area,
          estado: req.estado,
          total: req.total,
          accionRequerida: 'Confirmar Recepción y Cierre de Requisición',
          rolesNotificados: rolesAtencion,
        });
      }
    }
  }

  return alertas;
}
