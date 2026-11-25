import type { Filter } from 'mongodb';
import {
  TIPOS_EVENTO_AUDITORIA,
  esquemaEventoAuditoria,
  type EventoAuditoria,
  type IdModulo,
  type RolUsuario,
  type TipoEventoAuditoria,
} from '@/config/types';
import {
  COLECCION_BITACORA_GENERAL,
  asegurarColeccionesEnCaliente,
} from '@/lib/mongodb/bitacoras.schema';
import { estaMongoConfigurado, obtenerBdBitacoras } from '@/lib/mongodb/client';
import { formatearFechaLegibleMx, formatearIsoMexico } from '@/lib/mongodb/fecha-mx';
import { actualizarJsonSeguro, leerJsonSeguro } from '@/lib/storage/json-storage';

export { TIPOS_EVENTO_AUDITORIA, esquemaEventoAuditoria, type EventoAuditoria, type TipoEventoAuditoria };

export interface FiltrosAuditoria {
  busqueda?: string;
  modulo?: IdModulo | 'auth' | 'todos';
  tipoEvento?: TipoEventoAuditoria | 'todos';
  usuario?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  limite?: number;
}

const ARCHIVO_AUDITORIA = 'auditoria.json';
const MAXIMO_REGISTROS_AUDITORIA = 2000;

const AUDITORIA_INICIAL: EventoAuditoria[] = [
  {
    id: 'aud_001',
    fecha: '2026-10-27T08:15:00.000Z',
    usuarioId: 'usr_admin',
    usuarioNombre: 'Carlos Mendoza',
    rol: 'administrador',
    modulo: 'auth',
    tipoEvento: 'inicio_sesion',
    entidad: 'Sesión JWT',
    detalle: 'Inicio de sesión exitoso en el panel de Administración General.',
    ip: '192.168.1.10',
  },
  {
    id: 'aud_002',
    fecha: '2026-10-27T08:30:00.000Z',
    usuarioId: 'usr_gerente',
    usuarioNombre: 'Ana Lucía Torres',
    rol: 'gerente',
    modulo: 'crm',
    tipoEvento: 'actualizacion',
    entidad: 'Oportunidad',
    entidadId: 'OPP-2026-001',
    detalle: 'Avance de etapa a Negociación en oportunidad Pemex Refinación ($1,250,000 MXN).',
    ip: '192.168.1.24',
  },
  {
    id: 'aud_003',
    fecha: '2026-10-27T09:05:00.000Z',
    usuarioId: 'usr_requisiciones',
    usuarioNombre: 'Pablo Vázquez Culebro',
    rol: 'requisiciones',
    modulo: 'requisiciones',
    tipoEvento: 'aprobacion',
    entidad: 'Requisición',
    entidadId: 'REQ-2026-0045',
    detalle: 'Revisión técnica aprobada para suministro de detectores H2S SIL-3.',
    ip: '192.168.1.41',
  },
  {
    id: 'aud_004',
    fecha: '2026-10-27T09:20:00.000Z',
    usuarioId: 'usr_rrhh',
    usuarioNombre: 'Mariana Garza',
    rol: 'rrhh',
    modulo: 'rrhh',
    tipoEvento: 'aprobacion',
    entidad: 'Vacaciones',
    entidadId: 'vac_001',
    detalle: 'Solicitud de vacaciones aprobada para Sofía Paredes (10 días).',
    ip: '192.168.1.55',
  },
];

function limpiarCamposUndefined<T extends Record<string, unknown>>(obj: T): T {
  const resultado: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      resultado[k] = v;
    }
  }
  return resultado as T;
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function registrarEventoAuditoria(
  entrada: Omit<EventoAuditoria, 'id' | 'fecha'>
): Promise<EventoAuditoria> {
  const ahora = new Date();
  const fechaMx = formatearIsoMexico(ahora);
  const fechaLegible = formatearFechaLegibleMx(ahora);

  const nuevoEvento = limpiarCamposUndefined<EventoAuditoria & { fechaLegible?: string }>({
    ...entrada,
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fecha: fechaMx,
    fechaLegible,
  });

  if (estaMongoConfigurado()) {
    try {
      const db = await obtenerBdBitacoras();
      await asegurarColeccionesEnCaliente(db);
      await db.collection(COLECCION_BITACORA_GENERAL).insertOne({ ...nuevoEvento });
      return nuevoEvento;
    } catch (err) {
      console.warn('[registrarEventoAuditoria] Error guardando en MongoDB Atlas, usando respaldo local:', err);
    }
  }

  try {
    await actualizarJsonSeguro<EventoAuditoria[]>(
      ARCHIVO_AUDITORIA,
      AUDITORIA_INICIAL,
      (registros) => [nuevoEvento, ...registros].slice(0, MAXIMO_REGISTROS_AUDITORIA)
    );
  } catch (err) {
    console.warn('[registrarEventoAuditoria] No se pudo persistir auditoría en almacenamiento:', err);
  }

  return nuevoEvento;
}

export async function consultarAuditoria(filtros: FiltrosAuditoria = {}): Promise<{
  eventos: EventoAuditoria[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  origen: 'mongodb' | 'json';
}> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const limite = Math.max(1, Math.min(100, filtros.limite ?? 12));

  if (estaMongoConfigurado()) {
    try {
      const db = await obtenerBdBitacoras();
      await asegurarColeccionesEnCaliente(db);
      const col = db.collection<EventoAuditoria>(COLECCION_BITACORA_GENERAL);

      const query: Filter<EventoAuditoria> = {};
      if (filtros.modulo && filtros.modulo !== 'todos') {
        query.modulo = filtros.modulo;
      }
      if (filtros.tipoEvento && filtros.tipoEvento !== 'todos') {
        query.tipoEvento = filtros.tipoEvento;
      }
      if (filtros.usuario) {
        query.usuarioNombre = { $regex: escaparRegex(filtros.usuario), $options: 'i' };
      }
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const rangoFecha: Record<string, string> = {};
        if (filtros.fechaDesde) rangoFecha.$gte = filtros.fechaDesde;
        if (filtros.fechaHasta) rangoFecha.$lte = `${filtros.fechaHasta}T23:59:59.999Z`;
        query.fecha = rangoFecha as unknown as string;
      }
      if (filtros.busqueda) {
        const rx = { $regex: escaparRegex(filtros.busqueda), $options: 'i' };
        query.$or = [
          { detalle: rx },
          { entidad: rx },
          { usuarioNombre: rx },
          { entidadId: rx },
        ];
      }

      const [total, eventos] = await Promise.all([
        col.countDocuments(query),
        col
          .find(query, { projection: { _id: 0 } })
          .sort({ fecha: -1 })
          .skip((pagina - 1) * limite)
          .limit(limite)
          .toArray(),
      ]);

      const totalPaginas = Math.max(1, Math.ceil(total / limite));
      return { eventos, total, pagina, limite, totalPaginas, origen: 'mongodb' };
    } catch (err) {
      console.warn('[consultarAuditoria] Error consultando MongoDB Atlas, usando respaldo local:', err);
    }
  }

  const todos = await leerJsonSeguro<EventoAuditoria[]>(ARCHIVO_AUDITORIA, AUDITORIA_INICIAL);

  const filtrados = todos.filter((ev) => {
    if (filtros.modulo && filtros.modulo !== 'todos' && ev.modulo !== filtros.modulo) {
      return false;
    }
    if (filtros.tipoEvento && filtros.tipoEvento !== 'todos' && ev.tipoEvento !== filtros.tipoEvento) {
      return false;
    }
    if (filtros.usuario && !ev.usuarioNombre.toLowerCase().includes(filtros.usuario.toLowerCase())) {
      return false;
    }
    if (filtros.fechaDesde && ev.fecha < filtros.fechaDesde) {
      return false;
    }
    if (filtros.fechaHasta && ev.fecha > `${filtros.fechaHasta}T23:59:59.999Z`) {
      return false;
    }
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      const coincide =
        ev.detalle.toLowerCase().includes(q) ||
        ev.entidad.toLowerCase().includes(q) ||
        ev.usuarioNombre.toLowerCase().includes(q) ||
        (ev.entidadId?.toLowerCase().includes(q) ?? false);
      if (!coincide) return false;
    }
    return true;
  });

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const inicio = (pagina - 1) * limite;
  const eventos = filtrados.slice(inicio, inicio + limite);

  return { eventos, total, pagina, limite, totalPaginas, origen: 'json' };
}

export async function registrarAccionUsuario(params: {
  usuarioId: string;
  usuarioNombre: string;
  rol: RolUsuario;
  modulo: IdModulo | 'auth';
  tipoEvento: TipoEventoAuditoria;
  entidad: string;
  entidadId?: string;
  detalle: string;
}): Promise<void> {
  try {
    await registrarEventoAuditoria(params);
  } catch {
    // Evitar interrumpir flujo operativo si la bitácora falla
  }
}
