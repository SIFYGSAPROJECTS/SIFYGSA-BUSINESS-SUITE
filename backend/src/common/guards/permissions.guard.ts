import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonStorageService } from '../../database/json-storage.service';
import {
  MATRIZ_PERMISOS_POR_DEFECTO,
  tienePermiso,
} from '../constants/permissions.matrix';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  REQUIRED_PERMISSION_KEY,
  type PermisoRequeridoMeta,
} from '../decorators/require-permission.decorator';
import {
  ErrorAutorizacion,
  type MatrizPermisos,
  type PayloadSesion,
} from '../types/erp.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jsonStorage: JsonStorageService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const permiso = this.reflector.getAllAndOverride<PermisoRequeridoMeta>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!permiso) return true;

    const request = context.switchToHttp().getRequest<{ user?: PayloadSesion }>();
    const sesion = request.user;
    if (!sesion) {
      throw new ErrorAutorizacion('No autenticado.', 401);
    }

    const matriz = await this.jsonStorage.leerJson<MatrizPermisos>(
      'roles-permisos.json',
      MATRIZ_PERMISOS_POR_DEFECTO
    );

    const permitido = tienePermiso(
      sesion.rol,
      permiso.modulo,
      permiso.accion,
      sesion.modulosPermitidos,
      matriz
    );

    if (!permitido) {
      throw new ErrorAutorizacion(
        `Tu rol (${sesion.rol}) no tiene permiso para "${permiso.accion}" en el módulo "${permiso.modulo}".`,
        403
      );
    }

    return true;
  }
}
