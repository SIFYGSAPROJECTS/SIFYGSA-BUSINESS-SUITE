import { Router, Request, Response } from 'express';

const router = Router();

// Obtener resumen y métricas del módulo CRM
router.get('/metrics', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      activeClients: 1248,
      pipelineValue: 4850000,
      closeRate: 34.6,
      currency: 'MXN',
    },
  });
});

// Listar oportunidades comerciales
router.get('/opportunities', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: [
      {
        id: 'opp_1',
        company: 'Grupo Industrial Regio',
        contact: 'Ing. Ricardo Morales',
        stage: 'Negociación Final',
        estimatedValue: 850000,
        probability: 0.8,
      },
      {
        id: 'opp_2',
        company: 'Logística y Distribución del Bajío',
        contact: 'Lic. Claudia Silva',
        stage: 'Propuesta Enviada',
        estimatedValue: 420000,
        probability: 0.6,
      },
      {
        id: 'opp_3',
        company: 'Constructora y Urbanizadora Peninsular',
        contact: 'Arq. Fernando Ruiz',
        stage: 'Calificación',
        estimatedValue: 1200000,
        probability: 0.4,
      },
    ],
  });
});

export default router;
