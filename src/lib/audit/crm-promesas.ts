import { z } from 'zod';
import {
  COLECCION_BITACORA_CRM_PROMESAS,
  asegurarColeccionesEnCaliente,
} from '@/lib/mongodb/bitacoras.schema';
import { estaMongoConfigurado, obtenerBdBitacoras } from '@/lib/mongodb/client';
import {
  formatearFechaLegibleMx,
  formatearHoraMx,
  formatearIsoMexico,
} from '@/lib/mongodb/fecha-mx';
import { actualizarJsonSeguro, leerJsonSeguro } from '@/lib/storage/json-storage';

export const TIPOS_MOVIMIENTO_CRM = [
  'movement',
  'modification',
  'note',
  'message',
  'activity',
  'system',
] as const;

export type TipoMovimientoCrm = (typeof TIPOS_MOVIMIENTO_CRM)[number];

export const esquemaRegistroBitacoraPromesa = z.object({
  id: z.string(),
  folio: z.string().min(1),
  nombrePromesa: z.string().optional(),
  clientePromesa: z.string().optional(),
  fecha: z.string(),
  fechaLegible: z.string().optional(),
  horaEtiqueta: z.string(),
  usuarioId: z.string().optional(),
  autor: z.string().min(1),
  iniciales: z.string().min(1),
  rolEtiqueta: z.string().optional(),
  tipo: z.enum(TIPOS_MOVIMIENTO_CRM),
  titulo: z.string().optional(),
  campoEtiqueta: z.string().optional(),
  valorAnterior: z.string().optional(),
  valorNuevo: z.string().optional(),
  texto: z.string().min(1),
  esBot: z.boolean().optional(),
});

export type RegistroBitacoraPromesa = z.infer<typeof esquemaRegistroBitacoraPromesa>;

const ARCHIVO_FALLBACK_CRM_PROMESAS = 'bitacora-crm-promesas.json';

function limpiarUndefined<T extends Record<string, unknown>>(obj: T): T {
  const copia: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(obj)) {
    if (valor !== undefined) {
      copia[clave] = valor;
    }
  }
  return copia as T;
}

export async function listarBitacoraPorFolio(
  folio: string
): Promise<{ registros: RegistroBitacoraPromesa[]; origen: 'mongodb' | 'json' }> {
  if (estaMongoConfigurado()) {
    try {
      const db = await obtenerBdBitacoras();
      await asegurarColeccionesEnCaliente(db);
      const docs = await db
        .collection<RegistroBitacoraPromesa>(COLECCION_BITACORA_CRM_PROMESAS)
        .find({ folio }, { projection: { _id: 0 } })
        .sort({ fecha: -1 })
        .limit(200)
        .toArray();
      return { registros: docs, origen: 'mongodb' };
    } catch (err) {
      console.warn('[listarBitacoraPorFolio] Error consultando MongoDB:', err);
    }
  }

  const todos = await leerJsonSeguro<RegistroBitacoraPromesa[]>(
    ARCHIVO_FALLBACK_CRM_PROMESAS,
    []
  );
  return {
    registros: todos.filter((r) => r.folio === folio),
    origen: 'json',
  };
}

export async function registrarMovimientoPromesaCrm(
  entrada: Omit<RegistroBitacoraPromesa, 'id' | 'fecha' | 'horaEtiqueta'> & {
    id?: string;
    fecha?: string;
    horaEtiqueta?: string;
  }
): Promise<{ registro: RegistroBitacoraPromesa; origen: 'mongodb' | 'json' }> {
  const ahora = new Date();
  const registro = limpiarUndefined<RegistroBitacoraPromesa>({
    id: entrada.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    folio: entrada.folio,
    nombrePromesa: entrada.nombrePromesa,
    clientePromesa: entrada.clientePromesa,
    fecha: entrada.fecha ? formatearIsoMexico(entrada.fecha) : formatearIsoMexico(ahora),
    fechaLegible: entrada.fecha
      ? formatearFechaLegibleMx(entrada.fecha)
      : formatearFechaLegibleMx(ahora),
    horaEtiqueta: entrada.horaEtiqueta || formatearHoraMx(ahora),
    usuarioId: entrada.usuarioId,
    autor: entrada.autor,
    iniciales: entrada.iniciales,
    rolEtiqueta: entrada.rolEtiqueta,
    tipo: entrada.tipo,
    titulo: entrada.titulo,
    campoEtiqueta: entrada.campoEtiqueta,
    valorAnterior: entrada.valorAnterior,
    valorNuevo: entrada.valorNuevo,
    texto: entrada.texto,
    esBot: entrada.esBot,
  });

  if (estaMongoConfigurado()) {
    try {
      const db = await obtenerBdBitacoras();
      await asegurarColeccionesEnCaliente(db);
      await db
        .collection(COLECCION_BITACORA_CRM_PROMESAS)
        .insertOne({ ...registro });
      return { registro, origen: 'mongodb' };
    } catch (err) {
      console.warn('[registrarMovimientoPromesaCrm] Error insertando en MongoDB:', err);
    }
  }

  await actualizarJsonSeguro<RegistroBitacoraPromesa[]>(
    ARCHIVO_FALLBACK_CRM_PROMESAS,
    [],
    (actual) => [registro, ...actual].slice(0, 2000)
  );

  return { registro, origen: 'json' };
}
