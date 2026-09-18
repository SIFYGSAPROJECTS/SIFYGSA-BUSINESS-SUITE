import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import crmRoutes from './modules/crm/crm.routes.js';
import rhRoutes from './modules/rh/rh.routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

export const createApp = () => {
  const app = express();

  // Middlewares globales
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'UP',
      system: 'SFG Business Suite Monolith API',
      timestamp: new Date().toISOString(),
    });
  });

  // Registro de Módulos de Negocio (Monolito Modular)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/crm', crmRoutes);
  app.use('/api/v1/rh', rhRoutes);

  // Manejo de errores
  app.use(errorHandler);

  return app;
};
