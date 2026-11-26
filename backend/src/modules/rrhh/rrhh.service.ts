import { Injectable } from '@nestjs/common';
import type { PayloadSesion, RolUsuario } from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import { AuditService } from '../audit/audit.service';
import {
  esquemaCrearAsistenciaRrhh,
  esquemaCrearEmpleadoRrhh,
  esquemaCrearIncidenciaRrhh,
  esquemaCrearVacacionesPermiso,
  puedeVerDatosSensiblesRrhh,
  type AsistenciaRrhh,
  type DatosRrhh,
  type EmpleadoRrhh,
  type EstadoSolicitudRrhh,
  type IncidenciaRrhh,
  type VacacionesPermisoRrhh,
} from './rrhh.schemas';

const ARCHIVO_RRHH = 'rrhh.json';
const DEFECTO_RRHH: DatosRrhh = {
  empleados: [],
  puestos: [],
  asistencias: [],
  vacacionesPermisos: [],
  incidencias: [],
  nomina: [],
};

@Injectable()
export class RrhhService {
  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly auditService: AuditService
  ) {}

  redactarEmpleadoSegunRol(empleado: EmpleadoRrhh, rol: RolUsuario) {
    if (puedeVerDatosSensiblesRrhh(rol)) {
      return empleado;
    }
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

  async obtenerDatosSegurosPorRol(rol: RolUsuario) {
    const todo = await this.jsonStorage.leerJson<DatosRrhh>(ARCHIVO_RRHH, DEFECTO_RRHH);
    const autorizadoSensibles = puedeVerDatosSensiblesRrhh(rol);
    return {
      incluyeDatosSensibles: autorizadoSensibles,
      empleados: todo.empleados.map((e) => this.redactarEmpleadoSegunRol(e, rol)),
      puestos: todo.puestos,
      asistencias: todo.asistencias,
      vacacionesPermisos: todo.vacacionesPermisos,
      incidencias: todo.incidencias,
      nomina: autorizadoSensibles ? todo.nomina : [],
    };
  }

  async crearEmpleado(entrada: unknown, actor: PayloadSesion) {
    const validado = esquemaCrearEmpleadoRrhh.parse(entrada);
    const todo = await this.jsonStorage.leerJson<DatosRrhh>(ARCHIVO_RRHH, DEFECTO_RRHH);

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

    await this.jsonStorage.escribirJson<DatosRrhh>(ARCHIVO_RRHH, {
      ...todo,
      empleados: [nuevo, ...todo.empleados],
    });

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'rrhh',
      tipoEvento: 'creacion',
      entidad: 'Empleado',
      entidadId: nuevo.numeroEmpleado,
      detalle: `Alta en expediente de colaborador ${nuevo.nombre} (${nuevo.puesto}).`,
    });

    return this.redactarEmpleadoSegunRol(nuevo, actor.rol);
  }

  async registrarAsistencia(entrada: unknown, actor: PayloadSesion): Promise<AsistenciaRrhh> {
    const validado = esquemaCrearAsistenciaRrhh.parse(entrada);
    const nueva: AsistenciaRrhh = { ...validado, id: `asi_${Date.now()}` };

    await this.jsonStorage.actualizarJson<DatosRrhh>(ARCHIVO_RRHH, DEFECTO_RRHH, (todo) => ({
      ...todo,
      asistencias: [nueva, ...todo.asistencias],
    }));

    await this.auditService.registrarAccionSegura({
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

  async crearSolicitudVacaciones(
    entrada: unknown,
    actor: PayloadSesion
  ): Promise<VacacionesPermisoRrhh> {
    const validado = esquemaCrearVacacionesPermiso.parse(entrada);
    const nueva: VacacionesPermisoRrhh = {
      ...validado,
      id: `vac_${Date.now()}`,
      estado: 'pendiente',
    };

    await this.jsonStorage.actualizarJson<DatosRrhh>(ARCHIVO_RRHH, DEFECTO_RRHH, (todo) => ({
      ...todo,
      vacacionesPermisos: [nueva, ...todo.vacacionesPermisos],
    }));

    await this.auditService.registrarAccionSegura({
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

  async dictaminarVacaciones(
    id: string,
    nuevoEstado: EstadoSolicitudRrhh,
    actor: PayloadSesion
  ): Promise<VacacionesPermisoRrhh> {
    let actualizada: VacacionesPermisoRrhh | null = null;

    await this.jsonStorage.actualizarJson<DatosRrhh>(ARCHIVO_RRHH, DEFECTO_RRHH, (todo) => ({
      ...todo,
      vacacionesPermisos: todo.vacacionesPermisos.map((v) => {
        if (v.id === id) {
          actualizada = { ...v, estado: nuevoEstado, aprobadoPor: actor.nombre };
          return actualizada;
        }
        return v;
      }),
    }));

    if (!actualizada) {
      throw new Error('Solicitud no encontrada.');
    }

    const final = actualizada as VacacionesPermisoRrhh;
    await this.auditService.registrarAccionSegura({
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

  async registrarIncidencia(entrada: unknown, actor: PayloadSesion): Promise<IncidenciaRrhh> {
    const validado = esquemaCrearIncidenciaRrhh.parse(entrada);
    const nueva: IncidenciaRrhh = {
      ...validado,
      id: `inc_${Date.now()}`,
      atendida: false,
    };

    await this.jsonStorage.actualizarJson<DatosRrhh>(ARCHIVO_RRHH, DEFECTO_RRHH, (todo) => ({
      ...todo,
      incidencias: [nueva, ...todo.incidencias],
    }));

    await this.auditService.registrarAccionSegura({
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
}
