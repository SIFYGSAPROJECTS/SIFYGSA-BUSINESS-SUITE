import { Router, Request, Response } from 'express';

const router = Router();

// Endpoint de Inicio de Sesión
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos.',
    });
  }

  // Simulación de autenticación exitosa
  return res.status(200).json({
    success: true,
    message: 'Autenticación exitosa',
    user: {
      id: 'usr_001',
      name: 'Carlos Mendoza',
      email: username.includes('@') ? username : `${username}@sifygsa.com`,
      role: 'ADMIN',
      permissions: ['CRM_FULL', 'RH_FULL', 'SETTINGS_MANAGE'],
    },
    token: 'mock-jwt-token-sfg-business-suite',
  });
});

// Endpoint para verificar sesión
router.get('/me', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    user: {
      id: 'usr_001',
      name: 'Carlos Mendoza',
      email: 'admin@sifygsa.com',
      role: 'ADMIN',
    },
  });
});

export default router;
