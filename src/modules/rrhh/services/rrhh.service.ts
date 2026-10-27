import type { RolUsuario } from '@/config/types';
import { registrarAccionUsuario } from '@/lib/audit';
import type { PayloadSesion } from '@/lib/auth';
import {
  puedeVerDatosSensiblesRrhh,
  type EstadoSolicitudRrhh,
} from '../constants';
import { repositorioRrhh } from '../repository/rrhh.repository';
import {
  esquemaCrearAsistenciaRrhh,
  esquemaCrearEmpleadoRrhh,
  esquemaCrearIncidenciaRrhh,
  esquemaCrearVacacionesPermiso,
} from '../schemas/rrhh.schema';
import type {
  AsistenciaRrhh,
  DatosRrhhCliente,
  EmpleadoRrhh,
  EmpleadoSeguroCliente,
  EntradaCrearAsistenciaRrhh,
  EntradaCrearEmpleadoRrhh,
  EntradaCrearIncidenciaRrhh,
  EntradaCrearVacacionesPermiso,
  IncidenciaRrhh,
  VacacionesPermisoRrhh,
} from '../types';

export function redactarEmpleadoSegunRol(
  empleado: EmpleadoRrhh,
  rol: RolUsuario
): EmpleadoSeguroCliente {
  if (puedeVerDatosSensiblesRrhh(rol)) {
    return empleado;
  }

  // Eliminación estricta en servidor: los datos sensibles jamás viajan al cliente
  const {
    salarioMensual: _s,
    rfc: _r,
    nss: _n,
    cuentaClabe: _c,
    contactoEmergencia: _e,
    ...publico
  } = empleado;
  void _s;
  void _r;
  void _n;
  void _c;
  void _e;
  return publico;
}

export async function obtenerDatosRrhhSegurosPorRol(
  rol: RolUsuario
): Promise<DatosRrhhCliente> {
  const todo = await repositorioRrhh.obtenerTodo();
  const autorizadoSensibles = puedeVerDatosSensiblesRrhh(rol);

  return {
    incluyeDatosSensibles: autorizadoSensibles,
    empleados: todo.empleados.map((e) => redactarEmpleadoSegunRol(e, rol)),
    puestos: todo.puestos,
    asistencias: todo.asistencias,
    vacacionesPermisos: todo.vacacionesPermisos,
    incidencias: todo.incidencias,
    nomina: autorizadoSensibles ? todo.nomina : [],
  };
}

export async function crearEmpleadoRrhh(
  entrada: EntradaCrearEmpleadoRrhh,
  actor: PayloadSesion
): Promise<EmpleadoSeguroCliente> {
  const validado = esquemaCrearEmpleadoRrhh.parse(entrada);
  const todo = await repositorioRrhh.obtenerTodo();

  const duplicado = todo.empleados.some(
    (e) =>
      e.email.toLowerCase() === validado.email.toLowerCase() ||
      e.rfc.toUpperCase() === validado.rfc.toUpperCase()
  );

  if (duplicado) {
    throw new Error('Ya existe un colaborador con ese correo electrónico o RFC.');
  }

  const nuevo: EmpleadoRrhh = {
    ...validado,
    id: `emp_${Date.now()}`,
    numeroEmpleado: `SFG-${String(todo.empleados.length + 1).padStart(4, '0')}`,
  };

  await repositorioRrhh.guardarTodo({
    ...todo,
    empleados: [nuevo, ...todo.empleados],
  });

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'rrhh',
    tipoEvento: 'creacion',
    entidad: 'Empleado',
    entidadId: nuevo.numeroEmpleado,
    detalle: `Alta en expediente de colaborador ${nuevo.nombre} (${nuevo.puesto}).`,
  });

  return redactarEmpleadoSegunRol(nuevo, actor.rol);
}

export async function registrarAsistenciaRrhh(
  entrada: EntradaCrearAsistenciaRrhh,
  actor: PayloadSesion
): Promise<AsistenciaRrhh> {
  const validado = esquemaCrearAsistenciaRrhh.parse(entrada);
  const todo = await repositorioRrhh.obtenerTodo();

  const nueva: AsistenciaRrhh = {
    ...validado,
    id: `asi_${Date.now()}`,
  };

  await repositorioRrhh.guardarTodo({
    ...todo,
    asistencias: [nueva, ...todo.asistencias],
  });

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'rrhh',
    tipoEvento: 'creacion',
    entidad: 'Asistencia',
    entidadId: nueva.id,
    detalle: `Registro de asistencia (${nueva.estatus}) para ${nueva.empleadoNombre}.`,
  });

  return nueva;
}

export async function crearSolicitudVacacionesPermiso(
  entrada: EntradaCrearVacacionesPermiso,
  actor: PayloadSesion
): Promise<VacacionesPermisoRrhh> {
  const validado = esquemaCrearVacacionesPermiso.parse(entrada);
  const todo = await repositorioRrhh.obtenerTodo();

  const nueva: VacacionesPermisoRrhh = {
    ...validado,
    id: `vac_${Date.now()}`,
    estado: 'pendiente',
  };

  await repositorioRrhh.guardarTodo({
    ...todo,
    vacacionesPermisos: [nueva, ...todo.vacacionesPermisos],
  });

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'rrhh',
    tipoEvento: 'creacion',
    entidad: 'Vacaciones/Permiso',
    entidadId: nueva.id,
    detalle: `Solicitud de ${nueva.tipo} (${nueva.dias} días) para ${nueva.empleadoNombre}.`,
  });

  return nueva;
}

export async function dictaminarVacacionesPermiso(
  id: string,
  nuevoEstado: EstadoSolicitudRrhh,
  actor: PayloadSesion
): Promise<VacacionesPermisoRrhh> {
  const todo = await repositorioRrhh.obtenerTodo();
  let actualizada: VacacionesPermisoRrhh | null = null;

  const lista = todo.vacacionesPermisos.map((v) => {
    if (v.id === id) {
      actualizada = {
        ...v,
        estado: nuevoEstado,
        aprobadoPor: actor.nombre,
      };
      return actualizada;
    }
    return v;
  });

  if (!actualizada) {
    throw new Error('Solicitud no encontrada.');
  }

  await repositorioRrhh.guardarTodo({
    ...todo,
    vacacionesPermisos: lista,
  });

  const final = actualizada as VacacionesPermisoRrhh;
  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'rrhh',
    tipoEvento: nuevoEstado === 'aprobada' ? 'aprobacion' : 'rechazo',
    entidad: 'Vacaciones/Permiso',
    entidadId: id,
    detalle: `Solicitud de ${final.empleadoNombre} dictaminada como ${nuevoEstado}.`,
  });

  return final;
}

export async function registrarIncidenciaRrhh(
  entrada: EntradaCrearIncidenciaRrhh,
  actor: PayloadSesion
): Promise<IncidenciaRrhh> {
  const validado = esquemaCrearIncidenciaRrhh.parse(entrada);
  const todo = await repositorioRrhh.obtenerTodo();

  const nueva: IncidenciaRrhh = {
    ...validado,
    id: `inc_${Date.now()}`,
    atendida: false,
  };

  await repositorioRrhh.guardarTodo({
    ...todo,
    incidencias: [nueva, ...todo.incidencias],
  });

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'rrhh',
    tipoEvento: 'creacion',
    entidad: 'Incidencia RRHH',
    entidadId: nueva.id,
    detalle: `Registro de incidencia (${nueva.tipo}) para ${nueva.empleadoNombre}.`,
  });

  return nueva;
}
