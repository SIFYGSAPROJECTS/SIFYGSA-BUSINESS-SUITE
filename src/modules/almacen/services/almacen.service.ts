import {
  actualizarJsonSeguro,
  leerJsonSeguro,
} from '@/lib/storage/json-storage';
import type {
  AdjuntoMantenimiento,
  Articulo,
  BitacoraMantenimientoItem,
  DatosAlmacenBd,
  FrecuenciaMantenimiento,
  MantenimientoArticulo,
  MovimientoAlmacen,
} from '../types';
import {
  ALMACENES,
  MOCK_ARTICULOS,
  MOCK_MOVIMIENTOS,
  MOCK_ORDEN_COMPRA_PO51,
} from '../data/mock-data';

const ARCHIVO_DATOS_ALMACEN = 'almacen.json';

const MANTENIMIENTOS_SEMILLA: MantenimientoArticulo[] = [
  {
    id: 'mnt-001',
    folio: 'MNT-2026-0001',
    articuloId: 'art-3',
    articuloSku: 'FLUKE-87V-IND',
    articuloNombre: 'Multímetro Industrial TRMS de Alta Precisión',
    categoria: 'Equipos de Medición',
    ubicacion: 'Nave 2 - Metrología',
    cantidad: 2,
    almacenId: 'nave2',
    tipoMantenimiento: 'Calibración / Revisión',
    estado: 'En Proceso',
    frecuencia: 'Anual',
    fechaEnvio: '2026-11-08',
    fechaProgramada: '2026-11-22',
    fechaEstimadaRetorno: '2026-11-22',
    ultimaFecha: '2025-11-22',
    responsableOProveedor: 'Laboratorio de Metrología Acreditado EMA (CENAM)',
    costoEstimado: 4850,
    costoMantenimiento: 4850,
    diagnosticoFalla: 'Calibración anual preventiva y verificación de escala analógica de 4-20mA.',
    observacionesResolucion: 'En proceso de emisión de carta de trazabilidad e incertidumbre.',
    usuarioRegistro: 'Ing. Mateo Gómez',
  },
  {
    id: 'mnt-002',
    folio: 'MNT-2026-0002',
    articuloId: 'art-6',
    articuloSku: 'TORQ-SNAPON-12',
    articuloNombre: 'Torquímetro Digital de Precisión 1/2" Snap-on',
    categoria: 'Herramientas',
    ubicacion: 'Nave 2 - Herramienta Especial',
    cantidad: 1,
    almacenId: 'nave2',
    tipoMantenimiento: 'Correctivo',
    estado: 'Pendiente / En Diagnóstico',
    frecuencia: 'Única',
    fechaEnvio: '2026-11-10',
    fechaProgramada: '2026-11-15',
    fechaEstimadaRetorno: '2026-11-15',
    ultimaFecha: '2026-05-10',
    responsableOProveedor: 'Taller Especializado Snap-on México',
    costoEstimado: 3200,
    costoMantenimiento: 3200,
    diagnosticoFalla: 'Desviación en lectura superior al 6% de tolerancia y trinquete trabado.',
    bloquearDisponibilidad: true,
    usuarioRegistro: 'Ing. Mateo Gómez',
  },
  {
    id: 'mnt-003',
    folio: 'MNT-2026-0003',
    articuloId: 'art-1',
    articuloSku: 'DET-UVIR-FLAME-01',
    articuloNombre: 'Detector Óptico de Flama UV/IR Industrial',
    categoria: 'Instrumentación',
    ubicacion: 'Almacén Principal - Estante A1',
    cantidad: 1,
    almacenId: 'principal',
    tipoMantenimiento: 'Preventivo',
    estado: 'Completado / Listo para Reingreso',
    frecuencia: 'Semestral',
    fechaEnvio: '2026-11-02',
    fechaProgramada: '2026-11-12',
    fechaEstimadaRetorno: '2026-11-12',
    ultimaFecha: '2026-11-12',
    fechaRetornoReal: '2026-11-12',
    responsableOProveedor: 'Taller Electrónico SIFYGSA CDMX',
    costoEstimado: 1500,
    costoMantenimiento: 1500,
    diagnosticoFalla: 'Limpieza óptica de cristal de zafiro y prueba de disparo con lámpara de prueba.',
    trabajoRealizado: 'Descontaminación ultrasónica de lente y calibración de sensibilidad UV/IR.',
    refaccionesUsadas: 'Kit de empaques Viton y gel sílice',
    observacionesResolucion: 'Óptica descontaminada y sensor probado al 100%. Aprobado para reingreso a inventario disponible.',
    estatusResultante: 'Al día',
    usuarioRegistro: 'Ing. Mateo Gómez',
  },
  {
    id: 'mnt-004',
    folio: 'MNT-2026-0004',
    articuloId: 'art-1',
    articuloSku: 'DET-UVIR-FLAME-01',
    articuloNombre: 'Detector Óptico de Flama UV/IR Industrial',
    categoria: 'Instrumentación',
    ubicacion: 'Almacén Principal - Estante A1',
    cantidad: 1,
    almacenId: 'principal',
    tipoMantenimiento: 'Preventivo',
    estado: 'Programado',
    frecuencia: 'Trimestral',
    fechaEnvio: '2026-11-25',
    fechaProgramada: '2026-12-10',
    fechaEstimadaRetorno: '2026-12-10',
    ultimaFecha: '2026-11-12',
    responsableOProveedor: 'Taller Electrónico SIFYGSA CDMX',
    costoEstimado: 1800,
    diagnosticoFalla: 'Verificación trimestral de respuesta UV/IR y prueba funcional en banco.',
    usuarioRegistro: 'Ing. Mateo Gómez',
  },
];

const BITACORA_SEMILLA: BitacoraMantenimientoItem[] = [
  {
    id: 'bm-001',
    mantenimientoId: 'mnt-003',
    folio: 'MNT-2026-0003',
    articuloId: 'art-1',
    articuloSku: 'DET-UVIR-FLAME-01',
    articuloNombre: 'Detector Óptico de Flama UV/IR Industrial',
    fecha: '2026-11-12',
    tipoEvento: 'ejecucion',
    tipoMantenimiento: 'Preventivo',
    descripcion: 'Servicio preventivo completado y reingreso a kárdex.',
    trabajoRealizado: 'Descontaminación ultrasónica de lente y calibración de sensibilidad UV/IR.',
    refaccionesUsadas: 'Kit de empaques Viton y gel sílice',
    costoFinal: 1500,
    responsable: 'Taller Electrónico SIFYGSA CDMX',
    usuario: 'Ing. Mateo Gómez',
    estatusResultante: 'Al día',
  },
];

const DATOS_ALMACEN_POR_DEFECTO: DatosAlmacenBd = {
  almacenes: ALMACENES,
  articulos: MOCK_ARTICULOS,
  movimientos: MOCK_MOVIMIENTOS,
  ordenCompraPO51: MOCK_ORDEN_COMPRA_PO51,
  mantenimientos: MANTENIMIENTOS_SEMILLA,
  bitacoraMantenimiento: BITACORA_SEMILLA,
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

function calcularProximaFechaPorFrecuencia(
  fechaBase: string,
  frecuencia?: FrecuenciaMantenimiento
): string | null {
  if (!frecuencia || frecuencia === 'Única' || frecuencia === 'Por horas / uso') {
    return null;
  }
  const fecha = new Date(`${fechaBase}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return null;
  const meses =
    frecuencia === 'Mensual'
      ? 1
      : frecuencia === 'Trimestral'
      ? 3
      : frecuencia === 'Semestral'
      ? 6
      : 12;
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toISOString().slice(0, 10);
}

export async function listarMantenimientosAlmacen(): Promise<{
  mantenimientos: MantenimientoArticulo[];
  bitacoraMantenimiento: BitacoraMantenimientoItem[];
}> {
  const datos = await obtenerDatosAlmacen();
  return {
    mantenimientos: datos.mantenimientos ?? MANTENIMIENTOS_SEMILLA,
    bitacoraMantenimiento: datos.bitacoraMantenimiento ?? BITACORA_SEMILLA,
  };
}

export async function programarMantenimientoAlmacen(
  nuevo: MantenimientoArticulo
): Promise<{
  mantenimiento: MantenimientoArticulo;
  bitacoraItem: BitacoraMantenimientoItem;
}> {
  const bitacoraItem: BitacoraMantenimientoItem = {
    id: `bm-${Date.now()}`,
    mantenimientoId: nuevo.id,
    folio: nuevo.folio,
    articuloId: nuevo.articuloId,
    articuloSku: nuevo.articuloSku,
    articuloNombre: nuevo.articuloNombre,
    fecha: nuevo.fechaEnvio,
    tipoEvento: 'programacion',
    tipoMantenimiento: nuevo.tipoMantenimiento,
    descripcion: `Programación (${nuevo.frecuencia || 'Única'}): ${nuevo.diagnosticoFalla}`,
    costoFinal: nuevo.costoEstimado ?? nuevo.costoMantenimiento,
    responsable: nuevo.responsableOProveedor,
    usuario: nuevo.usuarioRegistro,
    estatusResultante: nuevo.estado,
  };

  await actualizarJsonSeguro(
    ARCHIVO_DATOS_ALMACEN,
    DATOS_ALMACEN_POR_DEFECTO,
    (actual) => {
      const listaMant = actual.mantenimientos ?? MANTENIMIENTOS_SEMILLA;
      const listaBitacora = actual.bitacoraMantenimiento ?? BITACORA_SEMILLA;
      const articulosActualizados = actual.articulos.map((art) => {
        if (art.sku.toLowerCase() !== nuevo.articuloSku.toLowerCase()) return art;
        const esProcesoAlmacen =
          nuevo.procesoSiguiente === 'Almacén' ||
          nuevo.estado === 'En Proceso' ||
          nuevo.estado === 'Pendiente / En Diagnóstico';
        if (esProcesoAlmacen) {
          const bloquear = nuevo.procesoSiguiente === 'Almacén' || Boolean(nuevo.bloquearDisponibilidad);
          return {
            ...art,
            stockDisponible: Math.max(0, art.stockDisponible - nuevo.cantidad),
            stockMantenimiento: (art.stockMantenimiento || 0) + nuevo.cantidad,
            noDisponiblePorMantenimiento: bloquear || art.noDisponiblePorMantenimiento,
            enMantenimiento: true,
            estado: bloquear ? ('Mantenimiento' as const) : art.estado,
          };
        }
        return art;
      });

      const movimientosActualizados =
        nuevo.procesoSiguiente === 'Almacén'
          ? [
              {
                id: `mov-mnt-${Date.now()}`,
                folio: nuevo.folio,
                tipo: 'Envío a Calibración' as const,
                fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
                articuloSku: nuevo.articuloSku,
                articuloNombre: nuevo.articuloNombre,
                cantidad: nuevo.cantidad,
                almacen: nuevo.ubicacionActual || nuevo.almacenId || 'Almacén Principal',
                ubicacion: nuevo.ubicacionMantenimiento || nuevo.responsableOProveedor,
                referenciaDoc: nuevo.folio,
                responsable: nuevo.responsableOProveedor,
                estado: 'En Tránsito' as const,
              },
              ...actual.movimientos,
            ]
          : actual.movimientos;

      return {
        ...actual,
        articulos: articulosActualizados,
        movimientos: movimientosActualizados,
        mantenimientos: [nuevo, ...listaMant],
        bitacoraMantenimiento: [bitacoraItem, ...listaBitacora],
      };
    }
  );

  return { mantenimiento: nuevo, bitacoraItem };
}

export async function registrarEjecucionMantenimientoAlmacen(params: {
  id: string;
  fechaRetornoReal: string;
  trabajoRealizado: string;
  refaccionesUsadas: string;
  costoMantenimiento: number;
  observacionesResolucion: string;
  estatusResultante: 'Al día' | 'Requiere seguimiento' | 'Baja Definitiva';
  adjuntos?: AdjuntoMantenimiento[];
  usuario: string;
}): Promise<MantenimientoArticulo | null> {
  let actualizado: MantenimientoArticulo | null = null;

  await actualizarJsonSeguro(
    ARCHIVO_DATOS_ALMACEN,
    DATOS_ALMACEN_POR_DEFECTO,
    (actual) => {
      const listaMant = actual.mantenimientos ?? MANTENIMIENTOS_SEMILLA;
      const listaBitacora = actual.bitacoraMantenimiento ?? BITACORA_SEMILLA;
      const objetivo = listaMant.find((m) => m.id === params.id);
      if (!objetivo) return actual;

      const estadoFinal =
        params.estatusResultante === 'Baja Definitiva'
          ? ('Baja Definitiva / Irreparable' as const)
          : ('Completado / Listo para Reingreso' as const);

      const adjuntosCombinados = [
        ...(objetivo.adjuntos ?? []),
        ...(params.adjuntos ?? []),
      ];

      actualizado = {
        ...objetivo,
        estado: estadoFinal,
        fechaRetornoReal: params.fechaRetornoReal,
        ultimaFecha: params.fechaRetornoReal,
        trabajoRealizado: params.trabajoRealizado,
        refaccionesUsadas: params.refaccionesUsadas,
        costoMantenimiento: params.costoMantenimiento,
        observacionesResolucion: params.observacionesResolucion,
        estatusResultante: params.estatusResultante,
        adjuntos: adjuntosCombinados,
      };

      const proximaFecha =
        params.estatusResultante !== 'Baja Definitiva'
          ? calcularProximaFechaPorFrecuencia(params.fechaRetornoReal, objetivo.frecuencia)
          : null;

      const siguienteProgramado: MantenimientoArticulo | null = proximaFecha
        ? {
            id: `mnt-next-${Date.now()}`,
            folio: `MNT-2026-${String(listaMant.length + 1).padStart(4, '0')}`,
            articuloId: objetivo.articuloId,
            articuloSku: objetivo.articuloSku,
            articuloNombre: objetivo.articuloNombre,
            categoria: objetivo.categoria,
            ubicacion: objetivo.ubicacion,
            cantidad: objetivo.cantidad,
            almacenId: objetivo.almacenId,
            tipoMantenimiento: objetivo.tipoMantenimiento,
            estado: 'Programado',
            frecuencia: objetivo.frecuencia,
            fechaEnvio: params.fechaRetornoReal,
            fechaProgramada: proximaFecha,
            fechaEstimadaRetorno: proximaFecha,
            ultimaFecha: params.fechaRetornoReal,
            responsableOProveedor: objetivo.responsableOProveedor,
            costoEstimado: objetivo.costoEstimado ?? params.costoMantenimiento,
            diagnosticoFalla: `Servicio recurrente (${objetivo.frecuencia}) generado automáticamente tras ${objetivo.folio}.`,
            usuarioRegistro: params.usuario,
          }
        : null;

      const nuevosMantenimientos = listaMant.map((m) =>
        m.id === params.id ? (actualizado as MantenimientoArticulo) : m
      );
      if (siguienteProgramado) {
        nuevosMantenimientos.unshift(siguienteProgramado);
      }

      const sigueBloqueado = nuevosMantenimientos.some(
        (m) =>
          m.articuloSku.toLowerCase() === objetivo.articuloSku.toLowerCase() &&
          m.bloquearDisponibilidad &&
          (m.estado === 'En Proceso' || m.estado === 'Pendiente / En Diagnóstico')
      );

      const articulosActualizados = actual.articulos.map((art) => {
        if (art.sku.toLowerCase() !== objetivo.articuloSku.toLowerCase()) return art;
        const estabaEnTaller =
          objetivo.estado === 'En Proceso' || objetivo.estado === 'Pendiente / En Diagnóstico';
        if (params.estatusResultante === 'Baja Definitiva') {
          return {
            ...art,
            stockMantenimiento: estabaEnTaller
              ? Math.max(0, art.stockMantenimiento - objetivo.cantidad)
              : art.stockMantenimiento,
            stockTotal: Math.max(0, art.stockTotal - objetivo.cantidad),
            noDisponiblePorMantenimiento: sigueBloqueado,
          };
        }
        return {
          ...art,
          stockMantenimiento: estabaEnTaller
            ? Math.max(0, art.stockMantenimiento - objetivo.cantidad)
            : art.stockMantenimiento,
          stockDisponible: estabaEnTaller
            ? art.stockDisponible + objetivo.cantidad
            : art.stockDisponible,
          noDisponiblePorMantenimiento: sigueBloqueado,
          estado: sigueBloqueado ? ('Mantenimiento' as const) : ('Disponible' as const),
        };
      });

      const bitacoraItem: BitacoraMantenimientoItem = {
        id: `bm-${Date.now()}`,
        mantenimientoId: objetivo.id,
        folio: objetivo.folio,
        articuloId: objetivo.articuloId,
        articuloSku: objetivo.articuloSku,
        articuloNombre: objetivo.articuloNombre,
        fecha: params.fechaRetornoReal,
        tipoEvento: params.estatusResultante === 'Baja Definitiva' ? 'baja' : 'ejecucion',
        tipoMantenimiento: objetivo.tipoMantenimiento,
        descripcion: params.observacionesResolucion || 'Ejecución de mantenimiento registrada.',
        trabajoRealizado: params.trabajoRealizado,
        refaccionesUsadas: params.refaccionesUsadas,
        costoFinal: params.costoMantenimiento,
        responsable: objetivo.responsableOProveedor,
        usuario: params.usuario,
        estatusResultante: params.estatusResultante,
      };

      return {
        ...actual,
        articulos: articulosActualizados,
        mantenimientos: nuevosMantenimientos,
        bitacoraMantenimiento: [bitacoraItem, ...listaBitacora],
      };
    }
  );

  return actualizado;
}

