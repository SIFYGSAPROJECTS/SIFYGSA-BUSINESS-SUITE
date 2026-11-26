import { z } from 'zod';

export const ROLES_USUARIO = [
  'administrador',
  'gerente',
  'vendedor',
  'rrhh',
  'requisiciones',
] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number];

export const NOMBRES_ROLES: Record<RolUsuario, string> = {
  administrador: 'Administrador General',
  gerente: 'Gerente de Zona / Comercial',
  vendedor: 'Ejecutivo de Ventas',
  rrhh: 'Capital Humano (RRHH)',
  requisiciones: 'Compras y Requisiciones',
};

export const IDS_MODULOS = [
  'admin',
  'crm',
  'requisiciones',
  'rrhh',
  'almacen',
  'compras',
  'autorizacion-ordenes',
] as const;

export type IdModulo = (typeof IDS_MODULOS)[number];

export const ACCIONES_PERMISO = [
  'ver',
  'ver_propias',
  'crear',
  'editar',
  'eliminar',
  'aprobar',
  'exportar',
] as const;

export type AccionPermiso = (typeof ACCIONES_PERMISO)[number];

export const ESTADOS_USUARIO = ['activo', 'inactivo'] as const;
export type EstadoUsuario = (typeof ESTADOS_USUARIO)[number];

export const ZONAS_COMERCIALES = [
  'Norte',
  'Bajío',
  'Centro',
  'Sur',
  'Istmo',
  'Península',
] as const;
export type ZonaComercial = (typeof ZONAS_COMERCIALES)[number];

export const esquemaRolUsuario = z.enum(ROLES_USUARIO);
export const esquemaIdModulo = z.enum(IDS_MODULOS);
export const esquemaAccionPermiso = z.enum(ACCIONES_PERMISO);
export const esquemaEstadoUsuario = z.enum(ESTADOS_USUARIO);
export const esquemaZonaComercial = z.enum(ZONAS_COMERCIALES);

export const esquemaUsuario = z.object({
  id: z.string().min(1),
  nombre: z.string().min(2),
  usuario: z.string().min(3),
  email: z.string().email(),
  passwordHash: z.string().min(10),
  rol: esquemaRolUsuario,
  zona: esquemaZonaComercial.optional(),
  departamento: z.string().optional(),
  estado: esquemaEstadoUsuario,
  modulosPermitidos: z.array(esquemaIdModulo),
  fechaCreacion: z.string(),
  ultimoAcceso: z.string().nullable(),
});

export type Usuario = z.infer<typeof esquemaUsuario>;
export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;
export type PermisosPorModulo = Record<IdModulo, AccionPermiso[]>;
export type MatrizPermisos = Record<RolUsuario, PermisosPorModulo>;

export const TIPOS_EVENTO_AUDITORIA = [
  'inicio_sesion',
  'cierre_sesion',
  'intento_fallido',
  'creacion',
  'actualizacion',
  'eliminacion',
  'aprobacion',
  'rechazo',
  'exportacion',
  'cambio_permisos',
] as const;

export type TipoEventoAuditoria = (typeof TIPOS_EVENTO_AUDITORIA)[number];

export const esquemaEventoAuditoria = z.object({
  id: z.string(),
  fecha: z.string(),
  fechaLegible: z.string().optional(),
  usuarioId: z.string(),
  usuarioNombre: z.string(),
  rol: esquemaRolUsuario,
  modulo: z.union([esquemaIdModulo, z.literal('auth')]),
  tipoEvento: z.enum(TIPOS_EVENTO_AUDITORIA),
  entidad: z.string(),
  entidadId: z.string().optional(),
  detalle: z.string(),
  ip: z.string().optional(),
});

export type EventoAuditoria = z.infer<typeof esquemaEventoAuditoria>;

export const NOMBRE_COOKIE_SESION = 'sfg_erp_session';
export const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;
export const INACTIVIDAD_MAXIMA_MS = 30 * 60 * 1000;

export const esquemaPayloadSesion = z.object({
  sub: z.string(),
  usuario: z.string(),
  nombre: z.string(),
  email: z.string(),
  rol: esquemaRolUsuario,
  zona: esquemaZonaComercial.optional(),
  departamento: z.string().optional(),
  modulosPermitidos: z.array(esquemaIdModulo),
  ultimaActividad: z.number(),
});

export type PayloadSesion = z.infer<typeof esquemaPayloadSesion>;

export class ErrorAutorizacion extends Error {
  public readonly codigoEstado: number;

  constructor(mensaje: string, codigoEstado: number = 403) {
    super(mensaje);
    this.name = 'ErrorAutorizacion';
    this.codigoEstado = codigoEstado;
  }
}

export interface RespuestaApi<T = unknown> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  error?: string;
  detalles?: string[];
}
