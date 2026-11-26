import { Injectable, Logger } from '@nestjs/common';
import type { Filter } from 'mongodb';
import {
  formatearFechaLegibleMx,
  formatearHoraMx,
  formatearIsoMexico,
} from '../../common/utils/fecha-mx';
import type {
  EventoAuditoria,
  IdModulo,
  RolUsuario,
  TipoEventoAuditoria,
} from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import {
  COLECCION_BITACORA_CRM_PROMESAS,
  COLECCION_BITACORA_GENERAL,
  MongoService,
} from '../../database/mongo.service';

export const TIPOS_MOVIMIENTO_CRM = [
  'movement',
  'modification',
  'note',
  'message',
  'activity',
  'system',
] as const;

export type TipoMovimientoCrm = (typeof TIPOS_MOVIMIENTO_CRM)[number];

export interface RegistroBitacoraPromesa {
  id: string;
  folio: string;
  nombrePromesa?: string;
  clientePromesa?: string;
  fecha: string;
  fechaLegible?: string;
  horaEtiqueta: string;
  usuarioId?: string;
  autor: string;
  iniciales: string;
  rolEtiqueta?: string;
  tipo: TipoMovimientoCrm;
  titulo?: string;
  campoEtiqueta?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  texto: string;
  esBot?: boolean;
}

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

function limpiarUndefined<T extends object>(obj: T): T {
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) limpio[k] = v;
  }
  return limpio as T;
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly mongo: MongoService,
    private readonly jsonStorage: JsonStorageService
  ) {}

  async registrarEventoGeneral(
    entrada: Omit<EventoAuditoria, 'id' | 'fecha' | 'fechaLegible'>
  ): Promise<EventoAuditoria> {
    const ahora = new Date();
    const evento = limpiarUndefined<EventoAuditoria>({
      ...entrada,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fecha: formatearIsoMexico(ahora),
      fechaLegible: formatearFechaLegibleMx(ahora),
    });

    if (this.mongo.estaConfigurado()) {
      try {
        const db = await this.mongo.obtenerBdBitacoras();
        await db.collection(COLECCION_BITACORA_GENERAL).insertOne({ ...evento });
        return evento;
      } catch (err) {
        this.logger.warn(
          `Error insertando en MongoDB (bitacora_general), usando respaldo JSON: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    await this.jsonStorage.actualizarJson<EventoAuditoria[]>(
      'auditoria.json',
      [],
      (registros) => [evento, ...registros].slice(0, 2000)
    );
    return evento;
  }

  async registrarAccionSegura(params: {
    usuarioId: string;
    usuarioNombre: string;
    rol: RolUsuario;
    modulo: IdModulo | 'auth';
    tipoEvento: TipoEventoAuditoria;
    entidad: string;
    entidadId?: string;
    detalle: string;
    ip?: string;
  }): Promise<void> {
    try {
      await this.registrarEventoGeneral(params);
    } catch {
      // No interrumpir operación si falla auditoría
    }
  }

  async consultarAuditoria(filtros: FiltrosAuditoria = {}): Promise<{
    eventos: EventoAuditoria[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
    origen: 'mongodb' | 'json';
  }> {
    const pagina = Math.max(1, filtros.pagina ?? 1);
    const limite = Math.max(1, Math.min(100, filtros.limite ?? 12));

    if (this.mongo.estaConfigurado()) {
      try {
        const db = await this.mongo.obtenerBdBitacoras();
        const col = db.collection<EventoAuditoria>(COLECCION_BITACORA_GENERAL);

        const query: Filter<EventoAuditoria> = {};
        if (filtros.modulo && filtros.modulo !== 'todos') {
          query.modulo = filtros.modulo;
        }
        if (filtros.tipoEvento && filtros.tipoEvento !== 'todos') {
          query.tipoEvento = filtros.tipoEvento;
        }
        if (filtros.usuario) {
          query.usuarioNombre = {
            $regex: escaparRegex(filtros.usuario),
            $options: 'i',
          };
        }
        if (filtros.fechaDesde || filtros.fechaHasta) {
          const rango: Record<string, string> = {};
          if (filtros.fechaDesde) rango.$gte = filtros.fechaDesde;
          if (filtros.fechaHasta) rango.$lte = `${filtros.fechaHasta}T23:59:59-06:00`;
          query.fecha = rango as unknown as string;
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

        return {
          eventos,
          total,
          pagina,
          limite,
          totalPaginas: Math.max(1, Math.ceil(total / limite)),
          origen: 'mongodb',
        };
      } catch (err) {
        this.logger.warn(
          `Error consultando MongoDB (bitacora_general), usando JSON: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const todos = await this.jsonStorage.leerJson<EventoAuditoria[]>('auditoria.json', []);
    const filtrados = todos.filter((ev) => {
      if (filtros.modulo && filtros.modulo !== 'todos' && ev.modulo !== filtros.modulo) {
        return false;
      }
      if (
        filtros.tipoEvento &&
        filtros.tipoEvento !== 'todos' &&
        ev.tipoEvento !== filtros.tipoEvento
      ) {
        return false;
      }
      if (
        filtros.usuario &&
        !ev.usuarioNombre.toLowerCase().includes(filtros.usuario.toLowerCase())
      ) {
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
    const inicio = (pagina - 1) * limite;
    return {
      eventos: filtrados.slice(inicio, inicio + limite),
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
      origen: 'json',
    };
  }

  async listarBitacoraPromesaPorFolio(
    folio: string
  ): Promise<{ registros: RegistroBitacoraPromesa[]; origen: 'mongodb' | 'json' }> {
    if (this.mongo.estaConfigurado()) {
      try {
        const db = await this.mongo.obtenerBdBitacoras();
        const docs = await db
          .collection<RegistroBitacoraPromesa>(COLECCION_BITACORA_CRM_PROMESAS)
          .find({ folio }, { projection: { _id: 0 } })
          .sort({ fecha: -1 })
          .limit(200)
          .toArray();
        return { registros: docs, origen: 'mongodb' };
      } catch (err) {
        this.logger.warn(
          `Error consultando MongoDB (bitacora_crm_promesas): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const todos = await this.jsonStorage.leerJson<RegistroBitacoraPromesa[]>(
      'bitacora-crm-promesas.json',
      []
    );
    return {
      registros: todos.filter((r) => r.folio === folio),
      origen: 'json',
    };
  }

  async registrarMovimientoPromesaCrm(
    entrada: Omit<RegistroBitacoraPromesa, 'id' | 'fecha' | 'fechaLegible' | 'horaEtiqueta'> & {
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

    if (this.mongo.estaConfigurado()) {
      try {
        const db = await this.mongo.obtenerBdBitacoras();
        await db.collection(COLECCION_BITACORA_CRM_PROMESAS).insertOne({ ...registro });
        return { registro, origen: 'mongodb' };
      } catch (err) {
        this.logger.warn(
          `Error insertando en MongoDB (bitacora_crm_promesas): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    await this.jsonStorage.actualizarJson<RegistroBitacoraPromesa[]>(
      'bitacora-crm-promesas.json',
      [],
      (actual) => [registro, ...actual].slice(0, 2000)
    );
    return { registro, origen: 'json' };
  }
}
