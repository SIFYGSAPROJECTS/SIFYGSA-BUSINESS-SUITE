import type {
  AccionPermiso,
  IdModulo,
  MatrizPermisos,
  RolUsuario,
} from '../types/erp.types';

export const MATRIZ_PERMISOS_POR_DEFECTO: MatrizPermisos = {
  administrador: {
    admin: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    crm: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    requisiciones: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    rrhh: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    almacen: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    compras: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    'autorizacion-ordenes': ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
  },
  gerente: {
    admin: [],
    crm: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    requisiciones: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    rrhh: ['ver'],
    almacen: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    compras: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    'autorizacion-ordenes': ['ver', 'ver_propias', 'aprobar', 'exportar'],
  },
  vendedor: {
    admin: [],
    crm: ['ver', 'ver_propias', 'crear', 'editar', 'exportar'],
    requisiciones: ['ver_propias', 'crear'],
    rrhh: [],
    almacen: ['ver'],
    compras: ['ver'],
    'autorizacion-ordenes': [],
  },
  rrhh: {
    admin: [],
    crm: [],
    requisiciones: ['ver_propias', 'crear'],
    rrhh: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    almacen: [],
    compras: [],
    'autorizacion-ordenes': [],
  },
  requisiciones: {
    admin: [],
    crm: ['ver'],
    requisiciones: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    rrhh: [],
    almacen: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    compras: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    'autorizacion-ordenes': [],
  },
};

export function tienePermiso(
  rol: RolUsuario,
  modulo: IdModulo,
  accion: AccionPermiso,
  modulosPermitidosUsuario?: IdModulo[],
  matriz: MatrizPermisos = MATRIZ_PERMISOS_POR_DEFECTO
): boolean {
  if (rol === 'administrador') {
    return true;
  }

  if (modulo === 'requisiciones' && (accion === 'ver_propias' || accion === 'crear')) {
    const permisosRequisiciones = matriz[rol]?.requisiciones ?? ['ver_propias', 'crear'];
    return (
      permisosRequisiciones.includes(accion) ||
      permisosRequisiciones.includes('ver')
    );
  }

  if (modulo === 'autorizacion-ordenes') {
    const permisosAutorizacion = matriz[rol]?.['autorizacion-ordenes'] ?? [];
    if (accion === 'ver_propias' && permisosAutorizacion.includes('ver')) {
      return true;
    }
    return permisosAutorizacion.includes(accion);
  }

  if (modulosPermitidosUsuario && !modulosPermitidosUsuario.includes(modulo)) {
    return false;
  }

  const permisosModulo = matriz[rol]?.[modulo] ?? [];
  if (accion === 'ver_propias' && permisosModulo.includes('ver')) {
    return true;
  }
  return permisosModulo.includes(accion);
}

export function obtenerRutaInicialParaUsuario(
  rol: RolUsuario,
  modulosUsuario?: IdModulo[]
): string {
  if (rol === 'rrhh') {
    return '/rrhh';
  }
  if (
    modulosUsuario &&
    modulosUsuario.includes('compras') &&
    !modulosUsuario.includes('crm') &&
    !modulosUsuario.includes('almacen') &&
    rol !== 'administrador'
  ) {
    return '/compras';
  }
  if (
    modulosUsuario &&
    modulosUsuario.includes('almacen') &&
    !modulosUsuario.includes('crm') &&
    rol !== 'administrador'
  ) {
    return '/almacen';
  }
  if (
    rol === 'requisiciones' &&
    modulosUsuario?.includes('compras') &&
    !modulosUsuario?.includes('admin')
  ) {
    return '/compras';
  }
  if (
    rol === 'requisiciones' &&
    modulosUsuario?.includes('almacen') &&
    !modulosUsuario?.includes('admin')
  ) {
    return '/almacen';
  }
  return '/';
}
