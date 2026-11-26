import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { ErrorAutorizacion } from '../types/erp.types';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ErrorAutorizacion) {
      response.status(exception.codigoEstado).json({
        exito: false,
        error: exception.message,
      });
      return;
    }

    if (exception instanceof ZodError) {
      const detalles = exception.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      response.status(HttpStatus.BAD_REQUEST).json({
        exito: false,
        error: detalles[0] ?? 'Datos de entrada inválidos',
        detalles,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'exito' in body) {
        response.status(status).json(body);
        return;
      }
      const message =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body !== null && 'message' in body
          ? Array.isArray((body as { message: unknown }).message)
            ? String((body as { message: unknown[] }).message[0])
            : String((body as { message: unknown }).message)
          : exception.message;

      response.status(status).json({
        exito: false,
        error: message,
      });
      return;
    }

    const mensaje =
      exception instanceof Error ? exception.message : 'Error interno del servidor';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      exito: false,
      error: mensaje,
    });
  }
}
