import type { Db, Document } from 'mongodb';

export const COLECCION_BITACORA_GENERAL = 'bitacora_general';
export const COLECCION_BITACORA_CRM_PROMESAS = 'bitacora_crm_promesas';

/**
 * Validación $jsonSchema para la Colección 1: bitacora_general
 * Corresponde a: Panel de Administración General -> Bitácora de Auditoría
 * (Incluye inicios/cierres de sesión, alta de productos en Almacén, permisos, etc.)
 */
export const VALIDADOR_BITACORA_GENERAL: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'id',
      'fecha',
      'usuarioId',
      'usuarioNombre',
      'rol',
      'modulo',
      'tipoEvento',
      'entidad',
      'detalle',
    ],
    properties: {
      id: {
        bsonType: 'string',
        description: 'Folio único del evento de auditoría general',
      },
      fecha: {
        bsonType: 'string',
        description: 'Fecha y hora en formato ISO 8601 con zona horaria de México (-06:00)',
      },
      fechaLegible: {
        bsonType: 'string',
        description: 'Fecha y hora legible en formato México (ej. 25/11/2026, 09:06:15 a.m.)',
      },
      usuarioId: {
        bsonType: 'string',
        description: 'ID del trabajador proveniente de PostgreSQL',
      },
      usuarioNombre: {
        bsonType: 'string',
        description: 'Nombre completo del trabajador que ejecutó la acción',
      },
      rol: {
        bsonType: 'string',
        enum: ['administrador', 'gerente', 'vendedor', 'rrhh', 'requisiciones'],
        description: 'Rol del trabajador en el sistema',
      },
      modulo: {
        bsonType: 'string',
        enum: ['auth', 'admin', 'crm', 'requisiciones', 'compras', 'rrhh', 'almacen'],
        description: 'Módulo donde se originó la acción',
      },
      tipoEvento: {
        bsonType: 'string',
        enum: [
          'inicio_sesion',
          'cierre_sesion',
          'intento_fallido',
          'creacion',
          'actualizacion',
          'eliminacion',
          'aprobacion',
          'rechazo',
          'exportacion',
          'cambio_permisos',
        ],
        description: 'Tipo de acción registrada en la bitácora general',
      },
      entidad: {
        bsonType: 'string',
        description: 'Entidad afectada (ej. Sesión JWT, Artículo de Almacén, Oportunidad)',
      },
      entidadId: {
        bsonType: 'string',
        description: 'Folio o SKU de la entidad afectada (ej. usr_admin, SKU-9367, OPP-2026-041)',
      },
      detalle: {
        bsonType: 'string',
        description: 'Descripción legible del movimiento',
      },
      ip: {
        bsonType: 'string',
        description: 'Dirección IP opcional del cliente',
      },
    },
  },
};

/**
 * Validación $jsonSchema para la Colección 2: bitacora_crm_promesas
 * Corresponde a: CRM -> Detalle de Promesa / Oportunidad -> Checador de Movimientos
 */
export const VALIDADOR_BITACORA_CRM_PROMESAS: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'id',
      'folio',
      'fecha',
      'horaEtiqueta',
      'autor',
      'iniciales',
      'tipo',
      'texto',
    ],
    properties: {
      id: {
        bsonType: 'string',
        description: 'ID único del movimiento en el checador CRM',
      },
      folio: {
        bsonType: 'string',
        description: 'Folio de la promesa u oportunidad comercial (ej. OPP-2026-041)',
      },
      nombrePromesa: {
        bsonType: 'string',
        description: 'Nombre / título de la promesa u oportunidad comercial',
      },
      clientePromesa: {
        bsonType: 'string',
        description: 'Nombre del cliente industrial vinculado a la promesa',
      },
      fecha: {
        bsonType: 'string',
        description: 'Fecha y hora exacta ISO 8601 con zona horaria de México (-06:00)',
      },
      fechaLegible: {
        bsonType: 'string',
        description: 'Fecha y hora legible en formato México (ej. 25/11/2026, 09:06:15 a.m.)',
      },
      horaEtiqueta: {
        bsonType: 'string',
        description: 'Hora formateada visible en tarjeta (ej. 10:15 a.m.)',
      },
      usuarioId: {
        bsonType: 'string',
        description: 'ID del trabajador en PostgreSQL que realizó el cambio',
      },
      autor: {
        bsonType: 'string',
        description: 'Nombre del responsable o SIFYGSA Bot',
      },
      iniciales: {
        bsonType: 'string',
        description: 'Iniciales para el avatar circular (ej. CR, BOT)',
      },
      rolEtiqueta: {
        bsonType: 'string',
        description: 'Cargo o etiqueta de rol (ej. Director Comercial & CRM)',
      },
      tipo: {
        bsonType: 'string',
        enum: ['movement', 'modification', 'note', 'message', 'activity', 'system'],
        description: 'Categoría del registro (MOVIMIENTO, MODIFICACIÓN, NOTA, BITÁCORA)',
      },
      titulo: {
        bsonType: 'string',
        description: 'Título corto del movimiento (ej. Verificación de Alcance Técnico)',
      },
      campoEtiqueta: {
        bsonType: 'string',
        description: 'Nombre del campo modificado (ej. Estado Operativo, Ingreso Esperado)',
      },
      valorAnterior: {
        bsonType: 'string',
        description: 'Valor previo antes de la modificación',
      },
      valorNuevo: {
        bsonType: 'string',
        description: 'Nuevo valor asignado tras la modificación',
      },
      texto: {
        bsonType: 'string',
        description: 'Observación de auditoría, nota o justificación del movimiento',
      },
      esBot: {
        bsonType: 'bool',
        description: 'Indica si fue generado por auditoría automática',
      },
    },
  },
};

let coleccionesVerificadas = false;

export async function asegurarColeccionesBitacoras(db: Db): Promise<{
  creadas: string[];
  actualizadas: string[];
}> {
  const existentes = await db.listCollections({}, { nameOnly: true }).toArray();
  const nombresExistentes = new Set(existentes.map((c) => c.name));
  const creadas: string[] = [];
  const actualizadas: string[] = [];

  // 1. Colección bitacora_general
  if (!nombresExistentes.has(COLECCION_BITACORA_GENERAL)) {
    await db.createCollection(COLECCION_BITACORA_GENERAL, {
      validator: VALIDADOR_BITACORA_GENERAL,
      validationLevel: 'strict',
      validationAction: 'error',
    });
    creadas.push(COLECCION_BITACORA_GENERAL);
  } else {
    await db.command({
      collMod: COLECCION_BITACORA_GENERAL,
      validator: VALIDADOR_BITACORA_GENERAL,
      validationLevel: 'strict',
      validationAction: 'error',
    });
    actualizadas.push(COLECCION_BITACORA_GENERAL);
  }

  await db.collection(COLECCION_BITACORA_GENERAL).createIndexes([
    { key: { fecha: -1 }, name: 'idx_fecha_desc' },
    { key: { modulo: 1, fecha: -1 }, name: 'idx_modulo_fecha' },
    { key: { tipoEvento: 1, fecha: -1 }, name: 'idx_tipoEvento_fecha' },
    { key: { usuarioId: 1, fecha: -1 }, name: 'idx_usuarioId_fecha' },
    { key: { id: 1 }, name: 'idx_id_unico', unique: true },
  ]);

  // 2. Colección bitacora_crm_promesas
  if (!nombresExistentes.has(COLECCION_BITACORA_CRM_PROMESAS)) {
    await db.createCollection(COLECCION_BITACORA_CRM_PROMESAS, {
      validator: VALIDADOR_BITACORA_CRM_PROMESAS,
      validationLevel: 'strict',
      validationAction: 'error',
    });
    creadas.push(COLECCION_BITACORA_CRM_PROMESAS);
  } else {
    await db.command({
      collMod: COLECCION_BITACORA_CRM_PROMESAS,
      validator: VALIDADOR_BITACORA_CRM_PROMESAS,
      validationLevel: 'strict',
      validationAction: 'error',
    });
    actualizadas.push(COLECCION_BITACORA_CRM_PROMESAS);
  }

  await db.collection(COLECCION_BITACORA_CRM_PROMESAS).createIndexes([
    { key: { folio: 1, fecha: -1 }, name: 'idx_folio_fecha_desc' },
    { key: { folio: 1, tipo: 1, fecha: -1 }, name: 'idx_folio_tipo_fecha' },
    { key: { usuarioId: 1, fecha: -1 }, name: 'idx_promesa_usuario_fecha' },
    { key: { id: 1 }, name: 'idx_promesa_id_unico', unique: true },
  ]);

  coleccionesVerificadas = true;
  return { creadas, actualizadas };
}

export async function asegurarColeccionesEnCaliente(db: Db): Promise<void> {
  if (coleccionesVerificadas) return;
  try {
    await asegurarColeccionesBitacoras(db);
  } catch {
    // Si el usuario de Atlas no tiene permisos de collMod, continuar con inserción normal
    coleccionesVerificadas = true;
  }
}
