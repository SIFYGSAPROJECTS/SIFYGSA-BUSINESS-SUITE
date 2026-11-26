import { z } from 'zod';
import type { RolUsuario } from '../../common/types/erp.types';

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

export const ESTADOS_EMPLEADO = ['activo', 'vacaciones', 'incapacidad', 'baja'] as const;

export const CERTIFICACIONES_SEGURIDAD = [
  'DC-3 Vigente SIL-3',
  'DC-3 Vigente',
  'Por Renovar DC-3',
  'Administrativo',
] as const;

export const TIPOS_VACACIONES_PERMISO = [
  'vacaciones',
  'permiso_personal',
  'incapacidad_medica',
  'dia_economico',
] as const;

export const ESTADOS_SOLICITUD_RRHH = ['pendiente', 'aprobada', 'rechazada'] as const;
export type EstadoSolicitudRrhh = (typeof ESTADOS_SOLICITUD_RRHH)[number];

export const TIPOS_INCIDENCIA_RRHH = [
  'retardo',
  'falta_injustificada',
  'vencimiento_dc3',
  'incidente_seguridad_epp',
  'reconocimiento_desempeno',
] as const;

export function puedeVerDatosSensiblesRrhh(rol: RolUsuario): boolean {
  return ROLES_AUTORIZADOS_DATOS_SENSIBLES.includes(rol);
}

export const esquemaEmpleadoRrhh = z.object({
  id: z.string().min(1),
  numeroEmpleado: z.string().min(3),
  nombre: z.string().trim().min(3, 'El nombre es obligatorio'),
  email: z.string().trim().email('Correo inválido'),
  telefono: z.string().trim().min(7),
  area: z.string().trim().min(2),
  puesto: z.string().trim().min(2),
  sede: z.enum(SEDES_RRHH),
  fechaIngreso: z.string().min(8),
  estado: z.enum(ESTADOS_EMPLEADO),
  certificacionStps: z.enum(CERTIFICACIONES_SEGURIDAD),
  salarioMensual: z.number().positive('El salario debe ser positivo'),
  rfc: z.string().trim().min(10, 'RFC inválido'),
  nss: z.string().trim().min(8, 'NSS inválido'),
  cuentaClabe: z.string().trim().min(10, 'CLABE inválida'),
  contactoEmergencia: z.string().trim().min(3),
});

export type EmpleadoRrhh = z.infer<typeof esquemaEmpleadoRrhh>;
export const esquemaCrearEmpleadoRrhh = esquemaEmpleadoRrhh.omit({
  id: true,
  numeroEmpleado: true,
});

export const esquemaAsistenciaRrhh = z.object({
  id: z.string().min(1),
  empleadoId: z.string().min(1),
  empleadoNombre: z.string().min(2),
  fecha: z.string().min(8),
  horaEntrada: z.string(),
  horaSalida: z.string(),
  horasTrabajadas: z.number().nonnegative(),
  estatus: z.enum(['presente', 'retardo', 'justificado', 'ausente']),
  sede: z.enum(SEDES_RRHH),
});

export type AsistenciaRrhh = z.infer<typeof esquemaAsistenciaRrhh>;
export const esquemaCrearAsistenciaRrhh = esquemaAsistenciaRrhh.omit({ id: true });

export const esquemaVacacionesPermisoRrhh = z.object({
  id: z.string().min(1),
  empleadoId: z.string().min(1),
  empleadoNombre: z.string().min(2),
  tipo: z.enum(TIPOS_VACACIONES_PERMISO),
  fechaInicio: z.string().min(8),
  fechaFin: z.string().min(8),
  dias: z.number().int().positive(),
  motivo: z.string().trim().min(4, 'Indica el motivo de la solicitud'),
  estado: z.enum(ESTADOS_SOLICITUD_RRHH),
  aprobadoPor: z.string().optional(),
});

export type VacacionesPermisoRrhh = z.infer<typeof esquemaVacacionesPermisoRrhh>;
export const esquemaCrearVacacionesPermiso = esquemaVacacionesPermisoRrhh.omit({
  id: true,
  estado: true,
  aprobadoPor: true,
});

export const esquemaIncidenciaRrhh = z.object({
  id: z.string().min(1),
  empleadoId: z.string().min(1),
  empleadoNombre: z.string().min(2),
  fecha: z.string().min(8),
  tipo: z.enum(TIPOS_INCIDENCIA_RRHH),
  severidad: z.enum(['alta', 'media', 'baja']),
  descripcion: z.string().trim().min(5, 'Describe la incidencia'),
  atendida: z.boolean(),
});

export type IncidenciaRrhh = z.infer<typeof esquemaIncidenciaRrhh>;
export const esquemaCrearIncidenciaRrhh = esquemaIncidenciaRrhh.omit({
  id: true,
  atendida: true,
});

export interface DatosRrhh {
  empleados: EmpleadoRrhh[];
  puestos: unknown[];
  asistencias: AsistenciaRrhh[];
  vacacionesPermisos: VacacionesPermisoRrhh[];
  incidencias: IncidenciaRrhh[];
  nomina: unknown[];
}
