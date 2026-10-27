import { z } from 'zod';
import {
  CERTIFICACIONES_SEGURIDAD,
  ESTADOS_EMPLEADO,
  ESTADOS_SOLICITUD_RRHH,
  SEDES_RRHH,
  TIPOS_INCIDENCIA_RRHH,
  TIPOS_VACACIONES_PERMISO,
} from '../constants';

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
  // Datos sensibles protegidos en servidor (solo roles 'administrador' y 'rrhh')
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

export type EntradaCrearEmpleadoRrhh = z.infer<typeof esquemaCrearEmpleadoRrhh>;

export const esquemaPuestoAreaRrhh = z.object({
  id: z.string().min(1),
  area: z.string().min(2),
  puesto: z.string().min(2),
  nivelJerarquico: z.enum(['Operativo', 'Supervisión', 'Coordinación', 'Dirección']),
  plazasAutorizadas: z.number().int().positive(),
  plazasOcupadas: z.number().int().nonnegative(),
  requiereSil3: z.boolean(),
});

export type PuestoAreaRrhh = z.infer<typeof esquemaPuestoAreaRrhh>;

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
export type EntradaCrearAsistenciaRrhh = z.infer<typeof esquemaCrearAsistenciaRrhh>;

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

export type EntradaCrearVacacionesPermiso = z.infer<typeof esquemaCrearVacacionesPermiso>;

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

export type EntradaCrearIncidenciaRrhh = z.infer<typeof esquemaCrearIncidenciaRrhh>;

export const esquemaNominaRrhh = z.object({
  id: z.string().min(1),
  empleadoId: z.string().min(1),
  empleadoNombre: z.string().min(2),
  periodo: z.string().min(6),
  sueldoBase: z.number().nonnegative(),
  bonoCampo: z.number().nonnegative(),
  deduccionesIsrImss: z.number().nonnegative(),
  netoPagar: z.number().nonnegative(),
  estatus: z.enum(['pendiente', 'dispersada']),
  fechaPago: z.string(),
});

export type NominaRrhh = z.infer<typeof esquemaNominaRrhh>;

export const esquemaDatosRrhh = z.object({
  empleados: z.array(esquemaEmpleadoRrhh),
  puestos: z.array(esquemaPuestoAreaRrhh),
  asistencias: z.array(esquemaAsistenciaRrhh),
  vacacionesPermisos: z.array(esquemaVacacionesPermisoRrhh),
  incidencias: z.array(esquemaIncidenciaRrhh),
  nomina: z.array(esquemaNominaRrhh),
});

export type DatosRrhh = z.infer<typeof esquemaDatosRrhh>;
