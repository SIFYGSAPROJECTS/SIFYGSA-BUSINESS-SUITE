import type { RolUsuario } from '@/config/types';

export const ROLES_AUTORIZADOS_DATOS_SENSIBLES: readonly RolUsuario[] = [
  'administrador',
  'rrhh',
] as const;

export const SEDES_RRHH = [
  'Refinería Minatitlán',
  'Base Mapachapa',
  'Base Comalcalco',
  'Monterrey HQ',
] as const;

export type SedeRrhh = (typeof SEDES_RRHH)[number];

export const ESTADOS_EMPLEADO = [
  'activo',
  'vacaciones',
  'incapacidad',
  'baja',
] as const;

export type EstadoEmpleado = (typeof ESTADOS_EMPLEADO)[number];

export const CERTIFICACIONES_SEGURIDAD = [
  'DC-3 Vigente SIL-3',
  'DC-3 Vigente',
  'Por Renovar DC-3',
  'Administrativo',
] as const;

export type CertificacionSeguridad = (typeof CERTIFICACIONES_SEGURIDAD)[number];

export const TIPOS_VACACIONES_PERMISO = [
  'vacaciones',
  'permiso_personal',
  'incapacidad_medica',
  'dia_economico',
] as const;

export type TipoVacacionesPermiso = (typeof TIPOS_VACACIONES_PERMISO)[number];

export const ETIQUETAS_TIPO_PERMISO: Record<TipoVacacionesPermiso, string> = {
  vacaciones: 'Vacaciones',
  permiso_personal: 'Permiso Personal',
  incapacidad_medica: 'Incapacidad Médica',
  dia_economico: 'Día Económico',
};

export const ESTADOS_SOLICITUD_RRHH = ['pendiente', 'aprobada', 'rechazada'] as const;
export type EstadoSolicitudRrhh = (typeof ESTADOS_SOLICITUD_RRHH)[number];

export const TIPOS_INCIDENCIA_RRHH = [
  'retardo',
  'falta_injustificada',
  'vencimiento_dc3',
  'incidente_seguridad_epp',
  'reconocimiento_desempeno',
] as const;

export type TipoIncidenciaRrhh = (typeof TIPOS_INCIDENCIA_RRHH)[number];

export const ETIQUETAS_INCIDENCIA_RRHH: Record<TipoIncidenciaRrhh, string> = {
  retardo: 'Retardo',
  falta_injustificada: 'Falta Injustificada',
  vencimiento_dc3: 'Alerta Vencimiento DC-3 STPS',
  incidente_seguridad_epp: 'Incidencia EPP / Seguridad',
  reconocimiento_desempeno: 'Reconocimiento Operativo',
};

export function puedeVerDatosSensiblesRrhh(rol: RolUsuario): boolean {
  return ROLES_AUTORIZADOS_DATOS_SENSIBLES.includes(rol);
}
