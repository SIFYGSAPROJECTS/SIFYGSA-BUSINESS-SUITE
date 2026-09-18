import { Router, Request, Response } from 'express';

const router = Router();

// Métricas de Capital Humano
router.get('/metrics', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      totalEmployees: 342,
      attendancePercentage: 97.4,
      pendingRequests: 14,
    },
  });
});

// Directorio de Colaboradores
router.get('/employees', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: [
      {
        id: 'emp_1',
        name: 'Mariana Garza',
        email: 'mariana.garza@sifygsa.com',
        department: 'Operaciones & Logística',
        position: 'Coordinadora de Operaciones',
        status: 'Activo',
      },
      {
        id: 'emp_2',
        name: 'Alejandro Lozano',
        email: 'alejandro.l@sifygsa.com',
        department: 'Tecnología & Sistemas',
        position: 'Líder de Desarrollo',
        status: 'Activo',
      },
      {
        id: 'emp_3',
        name: 'Sofía Paredes',
        email: 'sofia.p@sifygsa.com',
        department: 'Administración & Finanzas',
        position: 'Analista Contable Senior',
        status: 'Vacaciones',
      },
    ],
  });
});

export default router;
