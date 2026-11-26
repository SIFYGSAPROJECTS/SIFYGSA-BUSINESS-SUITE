import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionTokenService } from '../services/session-token.service';
import {
  ErrorAutorizacion,
  NOMBRE_COOKIE_SESION,
  type PayloadSesion,
} from '../types/erp.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionTokenService: SessionTokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: PayloadSesion }>();

    const cookieToken = request.cookies?.[NOMBRE_COOKIE_SESION] as string | undefined;
    const authHeader = request.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : undefined;

    const token = cookieToken || bearerToken;
    const verificacion = await this.sessionTokenService.verificarTokenSesion(token);

    if (!verificacion.valida || !verificacion.sesion) {
      const mensaje =
        verificacion.motivoInvalidez === 'inactividad_expirada'
          ? 'Tu sesión expiró por inactividad. Inicia sesión nuevamente.'
          : 'Sesión expirada o no autenticada. Inicia sesión nuevamente.';
      throw new ErrorAutorizacion(mensaje, 401);
    }

    request.user = verificacion.sesion;
    return true;
  }
}
