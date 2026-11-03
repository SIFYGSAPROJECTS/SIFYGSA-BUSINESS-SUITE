import {
  actualizarJsonSeguro,
  leerJsonSeguro,
} from '@/lib/storage/json-storage';
import type {
  Articulo,
  DatosAlmacenBd,
  MovimientoAlmacen,
} from '../types';
import {
  ALMACENES,
  MOCK_ARTICULOS,
  MOCK_MOVIMIENTOS,
  MOCK_ORDEN_COMPRA_PO51,
} from '../data/mock-data';

const ARCHIVO_DATOS_ALMACEN = 'almacen.json';

const DATOS_ALMACEN_POR_DEFECTO: DatosAlmacenBd = {
  almacenes: ALMACENES,
  articulos: MOCK_ARTICULOS,
  movimientos: MOCK_MOVIMIENTOS,
  ordenCompraPO51: MOCK_ORDEN_COMPRA_PO51,
};

export async function obtenerDatosAlmacen(): Promise<DatosAlmacenBd> {
  return leerJsonSeguro<DatosAlmacenBd>(
    ARCHIVO_DATOS_ALMACEN,
    DATOS_ALMACEN_POR_DEFECTO
  );
}

export async function listarArticulosAlmacen(): Promise<Articulo[]> {
  const datos = await obtenerDatosAlmacen();
  return datos.articulos;
}

export async function obtenerArticuloPorSku(sku: string): Promise<Articulo | undefined> {
  const articulos = await listarArticulosAlmacen();
  return articulos.find((a) => a.sku.toLowerCase() === sku.toLowerCase());
}

export async function listarMovimientosAlmacen(): Promise<MovimientoAlmacen[]> {
  const datos = await obtenerDatosAlmacen();
  return datos.movimientos;
}

export async function registrarArticuloAlmacen(
  nuevoArticulo: Omit<Articulo, 'id' | 'fechaRegistro'>
): Promise<Articulo> {
  const articuloCreado: Articulo = {
    ...nuevoArticulo,
    id: `art-${Date.now()}`,
    fechaRegistro: new Date().toISOString().split('T')[0],
  };

  await actualizarJsonSeguro(
    ARCHIVO_DATOS_ALMACEN,
    DATOS_ALMACEN_POR_DEFECTO,
    (actual) => ({
      ...actual,
      articulos: [articuloCreado, ...actual.articulos],
    })
  );

  return articuloCreado;
}

export async function registrarMovimientoAlmacen(
  movimiento: Omit<MovimientoAlmacen, 'id' | 'fecha'>
): Promise<MovimientoAlmacen> {
  const creado: MovimientoAlmacen = {
    ...movimiento,
    id: `mov-${Date.now()}`,
    fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };

  await actualizarJsonSeguro(
    ARCHIVO_DATOS_ALMACEN,
    DATOS_ALMACEN_POR_DEFECTO,
    (actual) => {
      // Ajustar existencias si aplica
      const articulosActualizados = actual.articulos.map((art) => {
        if (art.sku !== creado.articuloSku) return art;

        if (creado.tipo === 'Entrada IR03') {
          return {
            ...art,
            stockTotal: art.stockTotal + creado.cantidad,
            stockDisponible: art.stockDisponible + creado.cantidad,
          };
        } else if (creado.tipo === 'Salida a Proyecto') {
          const nuevaDisponible = Math.max(0, art.stockDisponible - creado.cantidad);
          return {
            ...art,
            stockDisponible: nuevaDisponible,
            stockProyecto: art.stockProyecto + creado.cantidad,
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

  return creado;
}

