import type { AccionPermiso, IdModulo, MatrizPermisos, RolUsuario } from '@/config/types';
import { MATRIZ_PERMISOS_POR_DEFECTO, tienePermiso } from '@/lib/permissions';

export type IconoModulo = 'shield' | 'crm' | 'requisiciones' | 'rrhh' | 'dashboard' | 'almacen';

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
    descripcion: 'Padrón de personal, alta técnica, vacaciones, formatos SGI, departamentos, cumpleaños y días festivos.',
    ruta: '/rrhh',
    icono: 'rrhh',
    accionMinima: 'ver',
    colorAcento: 'emerald',
    subItems: [
      { id: 'rrhh-panel', nombre: 'Menú Principal', nombreEn: 'Main Menu', vista: 'rrhh-panel', accionRequerida: 'ver' },
      { id: 'rrhh-alta', nombre: 'Alta de Empleado', nombreEn: 'New Employee', vista: 'rrhh-alta', accionRequerida: 'ver' },
      { id: 'rrhh-catalogos', nombre: 'Catálogo Personal', nombreEn: 'Staff Catalog', vista: 'rrhh-catalogos', accionRequerida: 'ver' },
      { id: 'rrhh-vacaciones', nombre: 'Vacaciones', nombreEn: 'Vacations', vista: 'rrhh-vacaciones', accionRequerida: 'ver' },
      { id: 'rrhh-formatos', nombre: 'Formatos SGI', nombreEn: 'SGI Formats', vista: 'rrhh-formatos', accionRequerida: 'ver' },
      { id: 'rrhh-departamentos', nombre: 'Departamentos', nombreEn: 'Departments', vista: 'rrhh-departamentos', accionRequerida: 'ver' },
      { id: 'rrhh-cumpleanos', nombre: 'Cumpleaños', nombreEn: 'Birthdays', vista: 'rrhh-cumpleanos', accionRequerida: 'ver' },
      { id: 'rrhh-festivos', nombre: 'Días Festivos', nombreEn: 'Holidays', vista: 'rrhh-festivos', accionRequerida: 'ver' },
    ],
  },
  {
    id: 'almacen',
    nombre: 'Almacén & SGA',
    nombreEn: 'Warehouse & SGA',
    descripcion: 'Gestión integral de almacén: entradas IR03, salidas a obra, inventario físico y catálogo maestro.',
    ruta: '/almacen',
    icono: 'almacen',
    accionMinima: 'ver',
    colorAcento: 'amber',
    subItems: [
      { id: 'almacen-dashboard', nombre: 'Dashboard General', nombreEn: 'Warehouse Dashboard', vista: '', accionRequerida: 'ver' },
      { id: 'almacen-alta-articulo', nombre: 'Alta de Artículos', nombreEn: 'New Item', vista: 'alta-articulo', accionRequerida: 'crear' },
      { id: 'almacen-recepcion-ir03', nombre: 'Entradas (IR03)', nombreEn: 'Inbound IR03', vista: 'recepcion-ir03', accionRequerida: 'crear' },
      { id: 'almacen-salida', nombre: 'Salidas de Almacén (SA)', nombreEn: 'Outbound SA', vista: 'salida', accionRequerida: 'crear' },
      { id: 'almacen-alta-servicio', nombre: 'Alta de Servicios', nombreEn: 'New Service', vista: 'alta-servicio', accionRequerida: 'crear' },
      { id: 'almacen-asignaciones', nombre: 'Asignaciones a Proyectos', nombreEn: 'Project Assignments', vista: 'asignaciones', accionRequerida: 'ver' },
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
