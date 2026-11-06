import type {
  AsistenciaRrhh,
  DatosRrhh,
  EmpleadoRrhh,
  EntradaCrearAsistenciaRrhh,
  EntradaCrearEmpleadoRrhh,
  EntradaCrearIncidenciaRrhh,
  EntradaCrearVacacionesPermiso,
  IncidenciaRrhh,
  NominaRrhh,
  PuestoAreaRrhh,
  VacacionesPermisoRrhh,
} from '../schemas/rrhh.schema';

/**
 * Tipo de empleado seguro para el cliente: los campos sensibles son opcionales
 * y el servidor los elimina por completo cuando el rol no está autorizado.
 */
export type EmpleadoSeguroCliente = Omit<
  EmpleadoRrhh,
  'salarioMensual' | 'rfc' | 'nss' | 'cuentaClabe' | 'contactoEmergencia'
> & {
  salarioMensual?: number;
  rfc?: string;
  nss?: string;
  cuentaClabe?: string;
  contactoEmergencia?: string;
};

export interface DatosRrhhCliente {
  incluyeDatosSensibles: boolean;
  empleados: EmpleadoSeguroCliente[];
  puestos: PuestoAreaRrhh[];
  asistencias: AsistenciaRrhh[];
  vacacionesPermisos: VacacionesPermisoRrhh[];
  incidencias: IncidenciaRrhh[];
  nomina: NominaRrhh[];
}

export interface IRepositorioRrhh {
  obtenerTodo(): Promise<DatosRrhh>;
  guardarTodo(datos: DatosRrhh): Promise<void>;
}

export type {
  DatosRrhh,
  EmpleadoRrhh,
  PuestoAreaRrhh,
  AsistenciaRrhh,
  VacacionesPermisoRrhh,
  IncidenciaRrhh,
  NominaRrhh,
  EntradaCrearEmpleadoRrhh,
  EntradaCrearAsistenciaRrhh,
  EntradaCrearVacacionesPermiso,
  EntradaCrearIncidenciaRrhh,
};
