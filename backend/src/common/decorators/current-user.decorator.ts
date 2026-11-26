import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PayloadSesion } from '../types/erp.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PayloadSesion => {
    const request = ctx.switchToHttp().getRequest<{ user?: PayloadSesion }>();
    return request.user as PayloadSesion;
  }
);
