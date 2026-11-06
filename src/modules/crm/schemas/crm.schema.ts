import { z } from 'zod';
import { esquemaZonaComercial } from '@/config/types';
import {
  ESTADOS_ACTIVIDAD_CRM,
  ETAPAS_OPORTUNIDAD,
  PRIORIDADES_CRM,
  TIPOS_ACTIVIDAD_CRM,
} from '../constants';

export const esquemaEtapaOportunidad = z.enum(ETAPAS_OPORTUNIDAD);
export const esquemaTipoActividadCrm = z.enum(TIPOS_ACTIVIDAD_CRM);
export const esquemaPrioridadCrm = z.enum(PRIORIDADES_CRM);
export const esquemaEstadoActividadCrm = z.enum(ESTADOS_ACTIVIDAD_CRM);

export const esquemaOportunidadCrm = z.object({
  id: z.string().min(1),
  folio: z.string().min(3),
  titulo: z.string().trim().min(3, 'El título es obligatorio'),
  clienteId: z.string().min(1),
  clienteNombre: z.string().trim().min(2, 'El nombre del cliente es obligatorio'),
  contactoNombre: z.string().trim().min(2, 'El contacto es obligatorio'),
  contactoEmail: z.string().trim().email('Correo de contacto inválido'),
  vendedor: z.string().trim().min(2, 'Asigna un vendedor'),
  zona: esquemaZonaComercial,
  etapa: esquemaEtapaOportunidad,
  montoEstimado: z.number().nonnegative('El monto no puede ser negativo'),
  moneda: z.enum(['MXN', 'USD']).default('MXN'),
  probabilidad: z.number().min(0).max(100),
  fechaCierreEsperada: z.string().min(8),
  periodo: z.string().min(6), // YYYY-MM
  etiquetas: z.array(z.string().trim()),
  notas: z.string().default(''),
  actualizadoEn: z.string(),
});

export type OportunidadCrm = z.infer<typeof esquemaOportunidadCrm>;

export const esquemaCrearOportunidad = esquemaOportunidadCrm.omit({
  id: true,
  folio: true,
  actualizadoEn: true,
});

export type EntradaCrearOportunidad = z.infer<typeof esquemaCrearOportunidad>;

export const esquemaInteraccionCliente = z.object({
  id: z.string().min(1),
  fecha: z.string(),
  tipo: esquemaTipoActividadCrm,
  autor: z.string().min(2),
  resumen: z.string().trim().min(3, 'El resumen de interacción es obligatorio'),
});

export type InteraccionCliente = z.infer<typeof esquemaInteraccionCliente>;

export const esquemaClienteCrm = z.object({
  id: z.string().min(1),
  empresa: z.string().trim().min(2, 'El nombre de la empresa es obligatorio'),
  rfc: z.string().trim().min(10, 'RFC inválido'),
  contactoPrincipal: z.string().trim().min(2),
  cargoContacto: z.string().trim().default('Contacto Comercial'),
  email: z.string().trim().email('Correo inválido'),
  telefono: z.string().trim().min(7),
  zona: esquemaZonaComercial,
  industria: z.string().trim().min(2),
  estatus: z.enum(['activo', 'prospecto', 'inactivo']),
  vendedorAsignado: z.string().trim().min(2),
  etiquetas: z.array(z.string()),
  interacciones: z.array(esquemaInteraccionCliente),
});

export type ClienteCrm = z.infer<typeof esquemaClienteCrm>;

export const esquemaCrearCliente = esquemaClienteCrm.omit({
  id: true,
  interacciones: true,
});

export type EntradaCrearCliente = z.infer<typeof esquemaCrearCliente>;

export const esquemaActividadCrm = z.object({
  id: z.string().min(1),
  tipo: esquemaTipoActividadCrm,
  titulo: z.string().trim().min(3, 'El título de la actividad es obligatorio'),
  descripcion: z.string().trim().default(''),
  oportunidadFolio: z.string().optional(),
  clienteNombre: z.string().trim().min(2),
  responsable: z.string().trim().min(2),
  fechaLimite: z.string().min(8),
  prioridad: esquemaPrioridadCrm,
  estado: esquemaEstadoActividadCrm,
});

export type ActividadCrm = z.infer<typeof esquemaActividadCrm>;

export const esquemaCrearActividadCrm = esquemaActividadCrm.omit({ id: true });
export type EntradaCrearActividadCrm = z.infer<typeof esquemaCrearActividadCrm>;

export const esquemaDatosCrm = z.object({
  oportunidades: z.array(esquemaOportunidadCrm),
  clientes: z.array(esquemaClienteCrm),
  actividades: z.array(esquemaActividadCrm),
});

export type DatosCrm = z.infer<typeof esquemaDatosCrm>;
