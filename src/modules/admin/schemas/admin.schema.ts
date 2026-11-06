import { z } from 'zod';
import {
  esquemaAccionPermiso,
  esquemaEstadoUsuario,
  esquemaIdModulo,
  esquemaRolUsuario,
  esquemaZonaComercial,
} from '@/config/types';

export const esquemaCrearUsuario = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  usuario: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, puntos y guiones'),
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: esquemaRolUsuario,
  zona: esquemaZonaComercial.optional(),
  departamento: z.string().trim().optional(),
  modulosPermitidos: z.array(esquemaIdModulo).min(1, 'Selecciona al menos un módulo'),
});

export type EntradaCrearUsuario = z.infer<typeof esquemaCrearUsuario>;

export const esquemaEditarUsuario = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().trim().email('Correo electrónico inválido'),
  rol: esquemaRolUsuario,
  zona: esquemaZonaComercial.optional(),
  departamento: z.string().trim().optional(),
  estado: esquemaEstadoUsuario,
  modulosPermitidos: z.array(esquemaIdModulo).min(1, 'Selecciona al menos un módulo'),
});

export type EntradaEditarUsuario = z.infer<typeof esquemaEditarUsuario>;

export const esquemaRestablecerPassword = z.object({
  nuevaPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

export type EntradaRestablecerPassword = z.infer<typeof esquemaRestablecerPassword>;

export const esquemaActualizarMatrizPermisos = z.object({
  matriz: z.record(
    esquemaRolUsuario,
    z.record(esquemaIdModulo, z.array(esquemaAccionPermiso))
  ),
});

export type EntradaActualizarMatrizPermisos = z.infer<typeof esquemaActualizarMatrizPermisos>;
