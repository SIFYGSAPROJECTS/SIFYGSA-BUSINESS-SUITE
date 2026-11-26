import { z } from 'zod';
import { esquemaRolUsuario, type RolUsuario } from '../../common/types/erp.types';

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

export function determinarNivelAprobacion(montoTotal: number) {
  return (
    NIVELES_APROBACION_MONTO.find((n) => montoTotal <= n.montoMaximo) ??
    NIVELES_APROBACION_MONTO[2]
  );
}

export const esquemaPartidaEntrada = z.object({
  codigoArticulo: z.string().trim().min(2, 'Código requerido (mín. 2 caracteres)'),
  nombreProveedor: z.string().optional(),
  codigoProveedor: z.string().optional(),
  disponible: z.number().optional(),
  detalleInventario: z.string().optional(),
  descripcion: z.string().trim().min(3, 'Descripción del artículo requerida'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().trim().min(1, 'Unidad requerida'),
  precioUnitario: z.number().positive('El monto unitario debe ser mayor a 0'),
  clienteTrabajo: z.string().optional(),
  activityCode: z.string().optional(),
  fechaRecibo: z.string().optional(),
});

export const esquemaCrearRequisicion = z
  .object({
    contrato: z.string().trim().min(3, 'Ingresa la clave de contrato o centro de costos'),
    tipoCompra: z.string().trim().optional(),
    subsidiaria: z.string().trim().optional(),
    departamento: z.string().trim().optional(),
    ubicacionAlmacen: z.string().trim().optional(),
    comprador: z.string().trim().optional(),
    lugarEntrega: z.string().trim().optional(),
    estadoDocumento: z.string().trim().optional(),
    solicitante: z.string().trim().optional(),
    area: z.enum(AREAS_OPERATIVAS, { message: 'Selecciona un área operativa válida' }),
    descripcion: z.string().trim().min(3).optional(),
    prioridad: z.enum(PRIORIDADES_REQUISICION, { message: 'Selecciona una prioridad válida' }),
    justificacion: z
      .string()
      .trim()
      .min(5, 'La nota o justificación debe tener al menos 5 caracteres'),
    fechaRequerida: z.string().min(8, 'Selecciona la fecha requerida'),
    partidas: z
      .array(esquemaPartidaEntrada)
      .min(1, 'La requisición debe incluir al menos un artículo'),
  })
  .superRefine((datos, ctx) => {
    const codigos = datos.partidas.map((p) => p.codigoArticulo.trim().toUpperCase());
    const duplicados = codigos.filter((c, idx) => codigos.indexOf(c) !== idx);
    if (duplicados.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['partidas'],
        message: `Partidas duplicadas detectadas con el código: ${duplicados[0]}`,
      });
    }

    const subtotal = datos.partidas.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);
    const totalConIva = subtotal * 1.16;
    const limiteArea = PRESUPUESTO_MAXIMO_POR_AREA[datos.area];

    if (totalConIva > limiteArea) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['area'],
        message: `El total ($${totalConIva.toLocaleString('es-MX')} MXN) excede el presupuesto máximo autorizado para ${datos.area} ($${limiteArea.toLocaleString('es-MX')} MXN).`,
      });
    }
  });

export const esquemaActualizarRequisicion = z.object({
  contrato: z.string().trim().min(2).optional(),
  tipoCompra: z.string().trim().optional(),
  subsidiaria: z.string().trim().optional(),
  departamento: z.string().trim().optional(),
  ubicacionAlmacen: z.string().trim().optional(),
  comprador: z.string().trim().optional(),
  lugarEntrega: z.string().trim().optional(),
  estadoDocumento: z.string().trim().optional(),
  area: z.enum(AREAS_OPERATIVAS).optional(),
  descripcion: z.string().trim().optional(),
  prioridad: z.enum(PRIORIDADES_REQUISICION).optional(),
  justificacion: z.string().trim().min(5).optional(),
  fechaRequerida: z.string().min(8).optional(),
  partidas: z.array(esquemaPartidaEntrada).min(1).optional(),
});

export const esquemaTransicionRequisicion = z.object({
  nuevoEstado: z.enum(ESTADOS_REQUISICION),
  comentario: z.string().trim().min(3, 'Agrega un comentario de trazabilidad (mín. 3 caracteres)'),
});

export interface NotaSistemaRequisicion {
  id: string;
  fecha: string;
  usuarioNombre: string;
  rolUsuario: RolUsuario;
  contexto: string;
  tipoOperacion: 'Creación' | 'Modificación' | 'Cambio de Estado' | 'Aprobación' | 'Cancelación';
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
}

export interface Requisicion {
  id: string;
  folio: string;
  contrato: string;
  tipoCompra?: string;
  subsidiaria?: string;
  departamento?: string;
  ubicacionAlmacen?: string;
  comprador?: string;
  lugarEntrega?: string;
  estadoDocumento?: string;
  solicitanteId?: string;
  solicitante: string;
  area: AreaOperativa;
  descripcion?: string;
  prioridad: (typeof PRIORIDADES_REQUISICION)[number];
  estado: EstadoRequisicion;
  justificacion: string;
  fechaCreacion: string;
  fechaRequerida: string;
  partidas: Array<
    z.infer<typeof esquemaPartidaEntrada> & { id: string; subtotal: number }
  >;
  subtotal: number;
  iva: number;
  total: number;
  nivelAprobacionRequerido: (typeof NIVELES_APROBACION_MONTO)[number]['nivel'];
  historial: Array<{
    id: string;
    fecha: string;
    estadoAnterior: EstadoRequisicion | null;
    estadoNuevo: EstadoRequisicion;
    usuarioNombre: string;
    rolUsuario: z.infer<typeof esquemaRolUsuario>;
    comentario: string;
  }>;
  bitacoraNetSuite?: NotaSistemaRequisicion[];
}
