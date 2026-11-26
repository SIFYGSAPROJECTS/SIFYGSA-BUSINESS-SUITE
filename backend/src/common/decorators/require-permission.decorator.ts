import { SetMetadata } from '@nestjs/common';
import type { AccionPermiso, IdModulo } from '../types/erp.types';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export interface PermisoRequeridoMeta {
  modulo: IdModulo;
  accion: AccionPermiso;
}

export const RequirePermission = (modulo: IdModulo, accion: AccionPermiso) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, { modulo, accion } satisfies PermisoRequeridoMeta);
