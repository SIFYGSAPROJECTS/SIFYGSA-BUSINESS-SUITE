import type {
  AccionPermiso,
  IdModulo,
  MatrizPermisos,
  RolUsuario,
} from '@/config/types';

/**
 * Matriz centralizada tipada: Rol -> Módulo -> Acciones permitidas.
 * Todos los roles autenticados cuentan con acceso a Requisiciones con 'ver_propias' y 'crear'.
 * La revisión, aprobación, atención, cierre, vista global ('ver') y exportación se restringen por rol.
 */
export const MATRIZ_PERMISOS_POR_DEFECTO: MatrizPermisos = {
  administrador: {
    admin: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    crm: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    requisiciones: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    rrhh: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
  },
  gerente: {
    admin: [],
    crm: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
    requisiciones: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    rrhh: ['ver'],
  },
  vendedor: {
    admin: [],
    crm: ['ver', 'ver_propias', 'crear', 'editar', 'exportar'],
    requisiciones: ['ver_propias', 'crear'],
    rrhh: [],
  },
  rrhh: {
    admin: [],
    crm: [],
    requisiciones: ['ver_propias', 'crear'],
    rrhh: ['ver', 'ver_propias', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
  },
  requisiciones: {
    admin: [],
    crm: ['ver'],
    requisiciones: ['ver', 'ver_propias', 'crear', 'editar', 'aprobar', 'exportar'],
    rrhh: [],
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

  // Requisiciones está abierto a cualquier usuario con sesión iniciada para crear y ver las propias
  if (modulo === 'requisiciones' && (accion === 'ver_propias' || accion === 'crear')) {
    const permisosRequisiciones = matriz[rol]?.requisiciones ?? ['ver_propias', 'crear'];
    return (
      permisosRequisiciones.includes(accion) ||
      permisosRequisiciones.includes('ver')
    );
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

export function puedeAccederModulo(
  rol: RolUsuario,
  modulo: IdModulo,
  modulosPermitidosUsuario?: IdModulo[],
  matriz: MatrizPermisos = MATRIZ_PERMISOS_POR_DEFECTO
): boolean {
  return (
    tienePermiso(rol, modulo, 'ver', modulosPermitidosUsuario, matriz) ||
    tienePermiso(rol, modulo, 'ver_propias', modulosPermitidosUsuario, matriz)
  );
}

export function obtenerModulosPorDefectoRol(
  rol: RolUsuario,
  matriz: MatrizPermisos = MATRIZ_PERMISOS_POR_DEFECTO
): IdModulo[] {
  const entrada = matriz[rol];
  if (!entrada) return [];
  return (Object.keys(entrada) as IdModulo[]).filter(
    (mod) => entrada[mod].includes('ver') || entrada[mod].includes('ver_propias')
  );
}
