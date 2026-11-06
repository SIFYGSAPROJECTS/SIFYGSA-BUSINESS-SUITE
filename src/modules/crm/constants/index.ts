export const ETAPAS_OPORTUNIDAD = [
  'prospecto',
  'contacto',
  'propuesta',
  'negociacion',
  'ganado',
  'perdido',
] as const;

export type EtapaOportunidad = (typeof ETAPAS_OPORTUNIDAD)[number];

export const ETIQUETAS_ETAPAS: Record<EtapaOportunidad, string> = {
  prospecto: 'Prospecto',
  contacto: 'Contacto',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

export const COLORES_ETAPAS: Record<EtapaOportunidad, string> = {
  prospecto: '#6B7280',
  contacto: '#0891B2',
  propuesta: '#2563EB',
  negociacion: '#D97706',
  ganado: '#16A34A',
  perdido: '#DC2626',
};

export const PROBABILIDAD_POR_ETAPA: Record<EtapaOportunidad, number> = {
  prospecto: 15,
  contacto: 35,
  propuesta: 60,
  negociacion: 80,
  ganado: 100,
  perdido: 0,
};

export const TIPOS_ACTIVIDAD_CRM = [
  'tarea',
  'llamada',
  'cita',
  'recordatorio',
] as const;

export type TipoActividadCrm = (typeof TIPOS_ACTIVIDAD_CRM)[number];

export const ETIQUETAS_TIPO_ACTIVIDAD: Record<TipoActividadCrm, string> = {
  tarea: 'Tarea',
  llamada: 'Llamada',
  cita: 'Cita / Reunión',
  recordatorio: 'Recordatorio',
};

export const PRIORIDADES_CRM = ['alta', 'media', 'baja'] as const;
export type PrioridadCrm = (typeof PRIORIDADES_CRM)[number];

export const ESTADOS_ACTIVIDAD_CRM = ['pendiente', 'completada', 'vencida'] as const;
export type EstadoActividadCrm = (typeof ESTADOS_ACTIVIDAD_CRM)[number];

export const VENDEDORES_DISPONIBLES = [
  'Diego Ramírez Vega',
  'Ana Lucía Torres',
  'Carlos Mendoza',
  'Laura Sánchez',
] as const;
