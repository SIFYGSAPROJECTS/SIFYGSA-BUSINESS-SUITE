import type { RolUsuario } from '@/config/types';

export const ESTADOS_REQUISICION = [
  'solicitud',
  'revision',
  'aprobacion',
  'atencion',
  'cierre',
  'rechazada',
  'cancelada',
] as const;

export type EstadoRequisicion = (typeof ESTADOS_REQUISICION)[number];

export const ETIQUETAS_ESTADO_REQUISICION: Record<EstadoRequisicion, string> = {
  solicitud: '1. Solicitud',
  revision: '2. En Revisión',
  aprobacion: '3. Aprobación por Nivel',
  atencion: '4. En Atención (OC)',
  cierre: '5. Cerrada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export const LIMITE_REQUISICIONES_POR_HORA = 8;

export const AREAS_OPERATIVAS = [
  'Instrumentación & Fire/Gas',
  'Operaciones & Logística',
  'Tecnología & Sistemas',
  'Capital Humano',
  'Dirección Comercial',
] as const;

export type AreaOperativa = (typeof AREAS_OPERATIVAS)[number];

export const PRESUPUESTO_MAXIMO_POR_AREA: Record<AreaOperativa, number> = {
  'Instrumentación & Fire/Gas': 1500000,
  'Operaciones & Logística': 800000,
  'Tecnología & Sistemas': 600000,
  'Capital Humano': 250000,
  'Dirección Comercial': 450000,
};

export const PRIORIDADES_REQUISICION = ['critica', 'alta', 'normal', 'baja'] as const;
export type PrioridadRequisicion = (typeof PRIORIDADES_REQUISICION)[number];

export const NIVELES_APROBACION_MONTO = [
  {
    nivel: 'nivel_1_compras',
    etiqueta: 'Nivel 1 — Compras (hasta $50,000 MXN)',
    montoMaximo: 50000,
    rolesAutorizados: ['requisiciones', 'gerente', 'administrador'] as RolUsuario[],
  },
  {
    nivel: 'nivel_2_gerencia',
    etiqueta: 'Nivel 2 — Gerencia ($50,001 a $250,000 MXN)',
    montoMaximo: 250000,
    rolesAutorizados: ['gerente', 'administrador'] as RolUsuario[],
  },
  {
    nivel: 'nivel_3_direccion',
    etiqueta: 'Nivel 3 — Dirección General (> $250,000 MXN)',
    montoMaximo: Number.POSITIVE_INFINITY,
    rolesAutorizados: ['administrador'] as RolUsuario[],
  },
] as const;

export type NivelAprobacionRequisicion = (typeof NIVELES_APROBACION_MONTO)[number]['nivel'];

export function determinarNivelAprobacion(montoTotal: number) {
  return (
    NIVELES_APROBACION_MONTO.find((n) => montoTotal <= n.montoMaximo) ??
    NIVELES_APROBACION_MONTO[2]
  );
}
