import { z } from 'zod';
import { esquemaRolUsuario } from '@/config/types';
import {
  AREAS_OPERATIVAS,
  ESTADOS_REQUISICION,
  PRESUPUESTO_MAXIMO_POR_AREA,
  PRIORIDADES_REQUISICION,
} from '../constants';

export const esquemaPartidaRequisicion = z.object({
  id: z.string().min(1),
  codigoArticulo: z.string().trim().min(2, 'Código de artículo requerido'),
  nombreProveedor: z.string().optional(),
  codigoProveedor: z.string().optional(),
  disponible: z.number().optional(),
  detalleInventario: z.string().optional(),
  descripcion: z.string().trim().min(3, 'Descripción de partida requerida'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().trim().min(1, 'La unidad es requerida'),
  precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0'),
  subtotal: z.number().nonnegative(),
  clienteTrabajo: z.string().optional(),
  activityCode: z.string().optional(),
  fechaRecibo: z.string().optional(),
});

export type PartidaRequisicion = z.infer<typeof esquemaPartidaRequisicion>;

export const esquemaCambioHistorialRequisicion = z.object({
  id: z.string().min(1),
  fecha: z.string(),
  estadoAnterior: z.enum(ESTADOS_REQUISICION).nullable(),
  estadoNuevo: z.enum(ESTADOS_REQUISICION),
  usuarioNombre: z.string().min(2),
  rolUsuario: esquemaRolUsuario,
  comentario: z.string().min(2),
});

export type CambioHistorialRequisicion = z.infer<typeof esquemaCambioHistorialRequisicion>;

export const esquemaNotaSistemaRequisicion = z.object({
  id: z.string().min(1),
  fecha: z.string(),
  usuarioNombre: z.string().min(2),
  rolUsuario: esquemaRolUsuario,
  contexto: z.string().default('UI — Formulario SIFYGSA Requisición'),
  tipoOperacion: z.enum([
    'Creación',
    'Modificación',
    'Cambio de Estado',
    'Aprobación',
    'Cancelación',
  ]),
  campo: z.string().min(1),
  valorAnterior: z.string(),
  valorNuevo: z.string(),
});

export type NotaSistemaRequisicion = z.infer<typeof esquemaNotaSistemaRequisicion>;

export const esquemaRequisicion = z.object({
  id: z.string().min(1),
  folio: z.string().min(3),
  contrato: z.string().trim().min(2),
  tipoCompra: z.string().optional(),
  subsidiaria: z.string().optional(),
  departamento: z.string().optional(),
  ubicacionAlmacen: z.string().optional(),
  comprador: z.string().optional(),
  lugarEntrega: z.string().optional(),
  estadoDocumento: z.string().optional(),
  solicitanteId: z.string().optional(),
  solicitante: z.string().trim().min(3, 'El solicitante es obligatorio'),
  area: z.enum(AREAS_OPERATIVAS),
  descripcion: z.string().trim().optional(),
  prioridad: z.enum(PRIORIDADES_REQUISICION),
  estado: z.enum(ESTADOS_REQUISICION),
  justificacion: z.string().trim().min(5, 'Describe la justificación operativa'),
  fechaCreacion: z.string(),
  fechaRequerida: z.string().min(8),
  partidas: z.array(esquemaPartidaRequisicion).min(1, 'Agrega al menos una partida'),
  subtotal: z.number().nonnegative(),
  iva: z.number().nonnegative(),
  total: z.number().positive(),
  nivelAprobacionRequerido: z.enum([
    'nivel_1_compras',
    'nivel_2_gerencia',
    'nivel_3_direccion',
  ]),
  historial: z.array(esquemaCambioHistorialRequisicion),
  bitacoraNetSuite: z.array(esquemaNotaSistemaRequisicion).optional(),
});

export type Requisicion = z.infer<typeof esquemaRequisicion>;

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
    area: z.enum(AREAS_OPERATIVAS, {
      message: 'Selecciona un área operativa válida',
    }),
    descripcion: z
      .string()
      .trim()
      .min(3, 'La descripción o lugar de entrega es requerida')
      .optional(),
    prioridad: z.enum(PRIORIDADES_REQUISICION, {
      message: 'Selecciona una prioridad válida',
    }),
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

export type EntradaCrearRequisicion = z.infer<typeof esquemaCrearRequisicion>;

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

export type EntradaActualizarRequisicion = z.infer<typeof esquemaActualizarRequisicion>;

export const esquemaTransicionRequisicion = z.object({
  nuevoEstado: z.enum(ESTADOS_REQUISICION),
  comentario: z.string().trim().min(3, 'Agrega un comentario de trazabilidad (mín. 3 caracteres)'),
});

export type EntradaTransicionRequisicion = z.infer<typeof esquemaTransicionRequisicion>;
