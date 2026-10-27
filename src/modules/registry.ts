import type { AccionPermiso, IdModulo, MatrizPermisos, RolUsuario } from '@/config/types';
import { MATRIZ_PERMISOS_POR_DEFECTO, tienePermiso } from '@/lib/permissions';

export type IconoModulo = 'shield' | 'crm' | 'requisiciones' | 'rrhh' | 'dashboard';

export interface SubItemModulo {
  id: string;
  nombre: string;
  nombreEn: string;
  vista: string;
  accionRequerida: AccionPermiso;
}

export interface DefinicionModulo {
  id: IdModulo;
  nombre: string;
  nombreEn: string;
  descripcion: string;
  ruta: `/${IdModulo}`;
  icono: IconoModulo;
  accionMinima: AccionPermiso;
  colorAcento: 'brand' | 'amber' | 'emerald' | 'cyan';
  subItems: SubItemModulo[];
}

export const REGISTRO_MODULOS: readonly DefinicionModulo[] = [
  {
    id: 'admin',
    nombre: 'Administración',
    nombreEn: 'Administration',
    descripcion: 'Panel ejecutivo, gestión de usuarios, matriz de roles/permisos y auditoría de seguridad.',
    ruta: '/admin',
    icono: 'shield',
    accionMinima: 'ver',
    colorAcento: 'brand',
    subItems: [
      { id: 'resumen', nombre: 'Panel & Usuarios', nombreEn: 'Dashboard & Users', vista: 'resumen', accionRequerida: 'ver' },
      { id: 'permisos', nombre: 'Roles y Permisos', nombreEn: 'Roles & Permissions', vista: 'permisos', accionRequerida: 'ver' },
      { id: 'auditoria', nombre: 'Bitácora Auditoría', nombreEn: 'Audit Log', vista: 'auditoria', accionRequerida: 'ver' },
    ],
  },
  {
    id: 'crm',
    nombre: 'CRM & Ventas',
    nombreEn: 'CRM & Sales',
    descripcion: 'Oportunidades comerciales, actividades Kanban & Gantt y reportes de pipeline.',
    ruta: '/crm',
    icono: 'crm',
    accionMinima: 'ver',
    colorAcento: 'brand',
    subItems: [
      {
        id: 'crm-opportunities',
        nombre: 'Oportunidades',
        nombreEn: 'Opportunities',
        vista: 'crm-opportunities',
        accionRequerida: 'ver',
      },
      {
        id: 'crm-kanban',
        nombre: 'Actividades (Kanban & Gantt)',
        nombreEn: 'Activities (Kanban & Gantt)',
        vista: 'crm-kanban',
        accionRequerida: 'ver',
      },
      {
        id: 'crm-avanzado',
        nombre: 'Reportes & Pipeline',
        nombreEn: 'Reports & Pipeline',
        vista: 'crm-avanzado',
        accionRequerida: 'ver',
      },
    ],
  },
  {
    id: 'requisiciones',
    nombre: 'Requisiciones',
    nombreEn: 'Requisitions',
    descripcion: 'Creación y seguimiento de requisiciones abiertas a todo el personal, con aprobación multinivel por rol y monto.',
    ruta: '/requisiciones',
    icono: 'requisiciones',
    accionMinima: 'ver_propias',
    colorAcento: 'amber',
    subItems: [
      {
        id: 'compras-nueva',
        nombre: 'Nueva requisición',
        nombreEn: 'New Requisition',
        vista: 'compras-nueva',
        accionRequerida: 'crear',
      },
      {
        id: 'compras-mis-requisiciones',
        nombre: 'Mis requisiciones',
        nombreEn: 'My Requisitions',
        vista: 'compras-mis-requisiciones',
        accionRequerida: 'ver_propias',
      },
      {
        id: 'compras-requisicion',
        nombre: 'Requisición',
        nombreEn: 'Requisition',
        vista: 'compras-requisicion',
        accionRequerida: 'ver',
      },
      {
        id: 'compras-aprobaciones',
        nombre: 'Revisión, Aprobación y Atención',
        nombreEn: 'Review, Approval & Fulfillment',
        vista: 'compras-aprobaciones',
        accionRequerida: 'aprobar',
      },
    ],
  },
  {
    id: 'rrhh',
    nombre: 'Recursos Humanos',
    nombreEn: 'Human Resources',
    descripcion: 'Expediente de empleados, puestos y áreas, asistencia, vacaciones/permisos, incidencias y nómina.',
    ruta: '/rrhh',
    icono: 'rrhh',
    accionMinima: 'ver',
    colorAcento: 'emerald',
    subItems: [
      { id: 'rh-directorio', nombre: 'Directorio de Personal', nombreEn: 'Staff Directory', vista: 'rh-directorio', accionRequerida: 'ver' },
      { id: 'rh-expedientes', nombre: 'Expedientes Digitales', nombreEn: 'Digital Records', vista: 'rh-expedientes', accionRequerida: 'ver' },
      { id: 'rh-organigrama', nombre: 'Organigrama y Puestos', nombreEn: 'Org Chart & Positions', vista: 'rh-organigrama', accionRequerida: 'ver' },
      { id: 'rh-asistencia', nombre: 'Control de Asistencias', nombreEn: 'Attendance Tracking', vista: 'rh-asistencia', accionRequerida: 'ver' },
      { id: 'rh-incidencias', nombre: 'Incidencias & Faltas', nombreEn: 'Incidents & Absences', vista: 'rh-incidencias', accionRequerida: 'ver' },
      { id: 'rh-vacaciones', nombre: 'Vacaciones y Permisos', nombreEn: 'Vacations & Leaves', vista: 'rh-vacaciones', accionRequerida: 'ver' },
      { id: 'rh-contratos', nombre: 'Políticas y Contratos', nombreEn: 'Policies & Contracts', vista: 'rh-contratos', accionRequerida: 'ver' },
    ],
  },
] as const;

export function obtenerModuloPorId(id: IdModulo): DefinicionModulo | undefined {
  return REGISTRO_MODULOS.find((m) => m.id === id);
}

export function obtenerModuloPorRuta(pathname: string): DefinicionModulo | undefined {
  return REGISTRO_MODULOS.find(
    (m) => pathname === m.ruta || pathname.startsWith(`${m.ruta}/`)
  );
}

export function obtenerModulosPermitidosParaUsuario(
  rol: RolUsuario,
  modulosUsuario?: IdModulo[],
  matriz: MatrizPermisos = MATRIZ_PERMISOS_POR_DEFECTO
): DefinicionModulo[] {
  return REGISTRO_MODULOS.filter((mod) =>
    tienePermiso(rol, mod.id, mod.accionMinima, modulosUsuario, matriz)
  );
}

export function obtenerSubItemsPermitidosModulo(
  idModulo: IdModulo,
  rol: RolUsuario,
  modulosUsuario?: IdModulo[],
  matriz: MatrizPermisos = MATRIZ_PERMISOS_POR_DEFECTO
): SubItemModulo[] {
  const modulo = obtenerModuloPorId(idModulo);
  if (!modulo) return [];
  return modulo.subItems.filter((sub) =>
    tienePermiso(rol, idModulo, sub.accionRequerida, modulosUsuario, matriz)
  );
}

export function obtenerRutaInicialParaUsuario(
  rol: RolUsuario,
  _modulosUsuario?: IdModulo[],
  _matriz: MatrizPermisos = MATRIZ_PERMISOS_POR_DEFECTO
): string {
  void _modulosUsuario;
  void _matriz;
  if (rol === 'rrhh') {
    return '/rrhh';
  }
  return '/';
}
