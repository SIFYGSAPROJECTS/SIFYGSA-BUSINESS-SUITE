import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('[SFG Error Handler]:', err);
  return res.status(500).json({
    success: false,
    message: err.message || 'Error interno del servidor en SFG Business Suite',
  });
};
