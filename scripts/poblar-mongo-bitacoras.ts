import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import type { EventoAuditoria } from '../src/config/types';
import type { RegistroBitacoraPromesa } from '../src/lib/audit/crm-promesas';
import {
  asegurarColeccionesBitacoras,
  COLECCION_BITACORA_CRM_PROMESAS,
  COLECCION_BITACORA_GENERAL,
} from '../src/lib/mongodb/bitacoras.schema';

function cargarEnvLocal() {
  for (const archivo of ['.env.local', '.env']) {
    const rutaEnv = path.resolve(process.cwd(), archivo);
    if (!fs.existsSync(rutaEnv)) continue;
    const contenido = fs.readFileSync(rutaEnv, 'utf-8');
    for (const linea of contenido.split(/\r?\n/)) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith('#')) continue;
      const idx = limpia.indexOf('=');
      if (idx === -1) continue;
      const clave = limpia.slice(0, idx).trim();
      let valor = limpia.slice(idx + 1).trim();
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1);
      }
      if (!process.env[clave]) {
        process.env[clave] = valor;
      }
    }
  }
}

const REGISTROS_INICIALES_CRM_PROMESAS: RegistroBitacoraPromesa[] = [
  {
    id: 'log-init-0',
    folio: 'OPP-2026-041',
    fecha: '2026-11-24T16:15:00.000Z',
    horaEtiqueta: '10:15 a.m.',
    usuarioId: 'usr_admin',
    autor: 'Ing. Carlos Rodríguez',
    iniciales: 'CR',
    rolEtiqueta: 'Director Comercial & CRM',
    tipo: 'movement',
    titulo: 'Verificación de Alcance Técnico',
    campoEtiqueta: 'Estado Operativo',
    valorAnterior: 'Borrador inicial',
    valorNuevo: 'Prospección inicial (10%)',
    texto: 'Se validó con CFE Generación VI el listado de detectores H2S en Refinería Dos Bocas.',
  },
  {
    id: 'log-1',
    folio: 'OPP-2026-041',
    fecha: '2026-11-24T15:06:00.000Z',
    horaEtiqueta: '9:06 a.m.',
    autor: 'SIFYGSA Bot',
    iniciales: 'BOT',
    rolEtiqueta: 'Auditoría Automática',
    tipo: 'system',
    titulo: 'Registro en Checador de Movimientos',
    texto:
      'Trazabilidad activa: cualquier cambio de etapa, monto, responsable o datos técnicos queda registrado con usuario y hora.',
    esBot: true,
  },
  {
    id: 'log-2',
    folio: 'OPP-2026-041',
    fecha: '2026-11-24T15:04:00.000Z',
    horaEtiqueta: '9:04 a.m.',
    usuarioId: 'usr_vendedor',
    autor: 'Ivan Alexei Gamboa Bernal',
    iniciales: 'IA',
    rolEtiqueta: 'Ingeniería de Ventas',
    tipo: 'system',
    texto: 'Lead / oportunidad comercial creada en el flujo industrial SIFYGSA.',
  },
  {
    id: 'log-088-1',
    folio: 'OPP-2026-088',
    fecha: '2026-11-24T14:40:00.000Z',
    horaEtiqueta: '8:40 a.m.',
    usuarioId: 'usr_gerente',
    autor: 'Ana Lucía Torres',
    iniciales: 'AT',
    rolEtiqueta: 'Gerente de Zona / Comercial',
    tipo: 'modification',
    titulo: 'Actualización de Etapa Comercial',
    campoEtiqueta: 'Etapa de Flujo',
    valorAnterior: 'Prospección inicial',
    valorNuevo: 'Calificación técnica (35%)',
    texto: 'Revisión DTI completada con Pemex Exploración y Producción (Complejo Cactus).',
  },
  {
    id: 'log-105-1',
    folio: 'OPP-2026-105',
    fecha: '2026-11-24T14:10:00.000Z',
    horaEtiqueta: '8:10 a.m.',
    usuarioId: 'usr_admin',
    autor: 'Carlos Mendoza',
    iniciales: 'CM',
    rolEtiqueta: 'Administrador General',
    tipo: 'modification',
    titulo: 'Ajuste de Propuesta Económica',
    campoEtiqueta: 'Ingreso Esperado (MXN)',
    valorAnterior: '$6,400,000 MXN',
    valorNuevo: '$6,800,000 MXN',
    texto:
      'Se incorporó partida de certificación NFPA 72 en sistema de detección de gas y fuego Planta Minatitlán (ICA Fluor Daniel).',
  },
];

async function main() {
  cargarEnvLocal();

  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_BITACORAS_DB?.trim() || 'BitacoraSifigsa';

  if (!uri) {
    console.error('[ERROR] Falta MONGODB_URI en .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    await asegurarColeccionesBitacoras(db);

    const colecciones = await db.listCollections({}, { nameOnly: true }).toArray();
    console.log(
      'Colecciones reales en Atlas:',
      colecciones.map((c) => c.name).join(', ')
    );

    // 1. Poblar bitacora_general desde data/auditoria.json
    const rutaAuditoria = path.resolve(process.cwd(), 'data', 'auditoria.json');
    let eventosGenerales: EventoAuditoria[] = [];
    if (fs.existsSync(rutaAuditoria)) {
      const raw = fs.readFileSync(rutaAuditoria, 'utf-8');
      const parsed = JSON.parse(raw) as EventoAuditoria[];
      if (Array.isArray(parsed)) {
        eventosGenerales = parsed;
      }
    }

    if (eventosGenerales.length > 0) {
      const opsGeneral = eventosGenerales.map((ev) => {
        const doc: Record<string, unknown> = {
          id: ev.id,
          fecha: ev.fecha,
          usuarioId: ev.usuarioId,
          usuarioNombre: ev.usuarioNombre,
          rol: ev.rol,
          modulo: ev.modulo,
          tipoEvento: ev.tipoEvento,
          entidad: ev.entidad,
          detalle: ev.detalle,
        };
        if (ev.entidadId) doc.entidadId = ev.entidadId;
        if (ev.ip) doc.ip = ev.ip;

        return {
          updateOne: {
            filter: { id: ev.id },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        };
      });

      await db
        .collection(COLECCION_BITACORA_GENERAL)
        .bulkWrite(opsGeneral, { ordered: false });
    }

    // 2. Poblar bitacora_crm_promesas con movimientos iniciales de promesas CRM
    const opsPromesas = REGISTROS_INICIALES_CRM_PROMESAS.map((reg) => ({
      updateOne: {
        filter: { id: reg.id },
        update: { $setOnInsert: { ...reg } },
        upsert: true,
      },
    }));

    await db
      .collection(COLECCION_BITACORA_CRM_PROMESAS)
      .bulkWrite(opsPromesas, { ordered: false });

    const totalGeneral = await db.collection(COLECCION_BITACORA_GENERAL).countDocuments();
    const totalPromesas = await db
      .collection(COLECCION_BITACORA_CRM_PROMESAS)
      .countDocuments();

    console.log('\n============================================================');
    console.log(' CONTENIDO CARGADO EN MONGODB ATLAS (BitacoraSifigsa)');
    console.log('============================================================');
    console.log(`• ${COLECCION_BITACORA_GENERAL}      : ${totalGeneral} documentos`);
    console.log(`• ${COLECCION_BITACORA_CRM_PROMESAS} : ${totalPromesas} documentos`);
    console.log('============================================================\n');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('[ERROR] Falló la carga de colecciones:', err);
  process.exit(1);
});
