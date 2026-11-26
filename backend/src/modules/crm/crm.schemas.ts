import { z } from 'zod';
import { esquemaZonaComercial } from '../../common/types/erp.types';

export const ETAPAS_OPORTUNIDAD = [
  'prospecto',
  'contacto',
  'propuesta',
  'negociacion',
  'ganado',
  'perdido',
] as const;

export type EtapaOportunidad = (typeof ETAPAS_OPORTUNIDAD)[number];

export const PROBABILIDAD_POR_ETAPA: Record<EtapaOportunidad, number> = {
  prospecto: 15,
  contacto: 35,
  propuesta: 60,
  negociacion: 80,
  ganado: 100,
  perdido: 0,
};

export const TIPOS_ACTIVIDAD_CRM = ['tarea', 'llamada', 'cita', 'recordatorio'] as const;
export type TipoActividadCrm = (typeof TIPOS_ACTIVIDAD_CRM)[number];

export const PRIORIDADES_CRM = ['alta', 'media', 'baja'] as const;
export const ESTADOS_ACTIVIDAD_CRM = ['pendiente', 'completada', 'vencida'] as const;
export type EstadoActividadCrm = (typeof ESTADOS_ACTIVIDAD_CRM)[number];

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
  etapa: z.enum(ETAPAS_OPORTUNIDAD),
  montoEstimado: z.number().nonnegative('El monto no puede ser negativo'),
  moneda: z.enum(['MXN', 'USD']).default('MXN'),
  probabilidad: z.number().min(0).max(100),
  fechaCierreEsperada: z.string().min(8),
  periodo: z.string().min(6),
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

export const esquemaInteraccionCliente = z.object({
  id: z.string().min(1),
  fecha: z.string(),
  tipo: z.enum(TIPOS_ACTIVIDAD_CRM),
  autor: z.string().min(2),
  resumen: z.string().trim().min(3, 'El resumen de interacción es obligatorio'),
});

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

export const esquemaActividadCrm = z.object({
  id: z.string().min(1),
  tipo: z.enum(TIPOS_ACTIVIDAD_CRM),
  titulo: z.string().trim().min(3, 'El título de la actividad es obligatorio'),
  descripcion: z.string().trim().default(''),
  oportunidadFolio: z.string().optional(),
  clienteNombre: z.string().trim().min(2),
  responsable: z.string().trim().min(2),
  fechaLimite: z.string().min(8),
  prioridad: z.enum(PRIORIDADES_CRM),
  estado: z.enum(ESTADOS_ACTIVIDAD_CRM),
});

export type ActividadCrm = z.infer<typeof esquemaActividadCrm>;

export const esquemaCrearActividadCrm = esquemaActividadCrm.omit({ id: true });

export interface DatosCrm {
  oportunidades: OportunidadCrm[];
  clientes: ClienteCrm[];
  actividades: ActividadCrm[];
}
