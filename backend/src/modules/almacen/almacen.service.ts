import { Injectable } from '@nestjs/common';
import type { PayloadSesion } from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import { AuditService } from '../audit/audit.service';

export interface ArticuloAlmacen {
  id: string;
  sku: string;
  nombre: string;
  descripcionCorta?: string;
  categoria?: string;
  stockTotal: number;
  stockDisponible: number;
  stockProyecto: number;
  stockMantenimiento?: number;
  stockMinimo?: number;
  fechaRegistro: string;
}

export type EntradaArticuloAlmacen = Omit<ArticuloAlmacen, 'id' | 'fechaRegistro'> &
  Record<string, unknown>;

export interface MovimientoAlmacen {
  id: string;
  folio: string;
  tipo: string;
  fecha: string;
  articuloSku: string;
  articuloNombre: string;
  cantidad: number;
  almacen?: string;
  ubicacion?: string;
  referenciaDoc?: string;
  responsable?: string;
  frenteTrabajo?: string;
  estado?: string;
}

export type EntradaMovimientoAlmacen = Omit<MovimientoAlmacen, 'id' | 'fecha'> &
  Record<string, unknown>;

export interface DatosAlmacenBd {
  almacenes: unknown[];
  articulos: ArticuloAlmacen[];
  movimientos: MovimientoAlmacen[];
  ordenCompraPO51?: unknown;
}

const ARCHIVO_ALMACEN = 'almacen.json';
const DEFECTO_ALMACEN: DatosAlmacenBd = {
  almacenes: [],
  articulos: [],
  movimientos: [],
};

@Injectable()
export class AlmacenService {
  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly auditService: AuditService
  ) {}

  async obtenerDatos(): Promise<DatosAlmacenBd> {
    return this.jsonStorage.leerJson<DatosAlmacenBd>(ARCHIVO_ALMACEN, DEFECTO_ALMACEN);
  }

  async listarArticulos(): Promise<ArticuloAlmacen[]> {
    const datos = await this.obtenerDatos();
    return datos.articulos;
  }

  async registrarArticulo(
    nuevo: EntradaArticuloAlmacen,
    actor: PayloadSesion
  ): Promise<ArticuloAlmacen> {
    const creado: ArticuloAlmacen = {
      ...nuevo,
      id: `art-${Date.now()}`,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    await this.jsonStorage.actualizarJson<DatosAlmacenBd>(
      ARCHIVO_ALMACEN,
      DEFECTO_ALMACEN,
      (actual) => ({
        ...actual,
        articulos: [creado, ...actual.articulos],
      })
    );

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'almacen',
      tipoEvento: 'creacion',
      entidad: 'Producto / Artículo de Almacén',
      entidadId: creado.sku,
      detalle: `Alta de nuevo producto en catálogo maestro: ${creado.sku} - ${creado.nombre || creado.descripcionCorta || ''}`,
    });

    return creado;
  }

  async listarMovimientos(): Promise<MovimientoAlmacen[]> {
    const datos = await this.obtenerDatos();
    return datos.movimientos;
  }

  async registrarMovimiento(
    movimiento: EntradaMovimientoAlmacen,
    actor: PayloadSesion
  ): Promise<MovimientoAlmacen> {
    const creado: MovimientoAlmacen = {
      ...movimiento,
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    await this.jsonStorage.actualizarJson<DatosAlmacenBd>(
      ARCHIVO_ALMACEN,
      DEFECTO_ALMACEN,
      (actual) => {
        const articulosActualizados = actual.articulos.map((art) => {
          if (art.sku !== creado.articuloSku) return art;

          if (creado.tipo === 'Entrada IR03') {
            return {
              ...art,
              stockTotal: (art.stockTotal || 0) + creado.cantidad,
              stockDisponible: (art.stockDisponible || 0) + creado.cantidad,
            };
          }
          if (creado.tipo === 'Salida a Proyecto') {
            return {
              ...art,
              stockDisponible: Math.max(0, (art.stockDisponible || 0) - creado.cantidad),
              stockProyecto: (art.stockProyecto || 0) + creado.cantidad,
            };
          }
          return art;
        });

        return {
          ...actual,
          articulos: articulosActualizados,
          movimientos: [creado, ...actual.movimientos],
        };
      }
    );

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'almacen',
      tipoEvento: 'creacion',
      entidad: 'Movimiento de Almacén',
      entidadId: creado.folio || creado.id,
      detalle: `Movimiento ${creado.tipo} (${creado.cantidad}) para artículo ${creado.articuloSku}.`,
    });

    return creado;
  }
}
