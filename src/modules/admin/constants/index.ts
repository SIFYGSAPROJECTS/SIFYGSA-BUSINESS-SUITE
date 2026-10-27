import type { AccionPermiso, IdModulo, TipoEventoAuditoria } from '@/config/types';

export const ETIQUETAS_MODULOS: Record<IdModulo, string> = {
  admin: 'Administración',
  crm: 'CRM & Ventas',
  requisiciones: 'Requisiciones',
  rrhh: 'Recursos Humanos',
};

export const ETIQUETAS_ACCIONES: Record<AccionPermiso, string> = {
  ver: 'Ver todas',
  ver_propias: 'Ver propias',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  aprobar: 'Aprobar',
  exportar: 'Exportar',
};

export const ETIQUETAS_EVENTOS_AUDITORIA: Record<TipoEventoAuditoria, string> = {
  inicio_sesion: 'Inicio de sesión',
  cierre_sesion: 'Cierre de sesión',
  intento_fallido: 'Intento fallido',
  creacion: 'Creación',
  actualizacion: 'Actualización',
  eliminacion: 'Eliminación',
  aprobacion: 'Aprobación',
  rechazo: 'Rechazo',
  exportacion: 'Exportación',
  cambio_permisos: 'Cambio de permisos',
};
