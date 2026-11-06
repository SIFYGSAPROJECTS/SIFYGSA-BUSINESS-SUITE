import type {
  AccionPermiso,
  IdModulo,
  MatrizPermisos,
  RolUsuario,
} from '@/config/types';
import { escribirJsonSeguro, leerJsonSeguro } from '@/lib/storage/json-storage';
import { MATRIZ_PERMISOS_POR_DEFECTO, tienePermiso } from './matrix';

const ARCHIVO_PERMISOS = 'roles-permisos.json';

export async function obtenerMatrizPermisos(): Promise<MatrizPermisos> {
  return leerJsonSeguro<MatrizPermisos>(ARCHIVO_PERMISOS, MATRIZ_PERMISOS_POR_DEFECTO);
}

export async function guardarMatrizPermisos(matriz: MatrizPermisos): Promise<MatrizPermisos> {
  // Garantizar que el administrador siempre conserve acceso completo a todos los módulos
  const matrizSegura: MatrizPermisos = {
    ...matriz,
    administrador: MATRIZ_PERMISOS_POR_DEFECTO.administrador,
  };
  await escribirJsonSeguro<MatrizPermisos>(ARCHIVO_PERMISOS, matrizSegura);
  return matrizSegura;
}

export async function verificarPermisoServidor(
  rol: RolUsuario,
  modulo: IdModulo,
  accion: AccionPermiso,
  modulosPermitidosUsuario?: IdModulo[]
): Promise<boolean> {
  const matriz = await obtenerMatrizPermisos();
  return tienePermiso(rol, modulo, accion, modulosPermitidosUsuario, matriz);
}
