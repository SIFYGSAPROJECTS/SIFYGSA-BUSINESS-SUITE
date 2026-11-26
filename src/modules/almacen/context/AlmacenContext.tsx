'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import type {
  AdjuntoMantenimiento,
  Articulo,
  BitacoraMantenimientoItem,
  RecepcionIR03Documento,
  ValeSalidaSA,
  DevolucionAlmacen,
  MonitorCalibracionItem,
  MantenimientoArticulo,
  MovimientoAlmacen,
} from '../types';
import { MOCK_ARTICULOS, MOCK_MOVIMIENTOS } from '../data/mock-data';

export interface BitacoraAlmacenItem {
  id: string;
  fechaHora: string;
  usuario: string;
  folioDocumento: string;
  accion: 'creacion' | 'edicion' | 'inhabilitacion' | 'recepcion' | 'salida' | 'devolucion' | 'eliminacion';
  campoModificado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivo?: string;
}

interface AlmacenState {
  articulos: Articulo[];
  recepciones: RecepcionIR03Documento[];
  valesSalida: ValeSalidaSA[];
  devoluciones: DevolucionAlmacen[];
  mantenimientos: MantenimientoArticulo[];
  bitacoraMantenimiento: BitacoraMantenimientoItem[];
  movimientos: MovimientoAlmacen[];
  bitacora: BitacoraAlmacenItem[];
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
}

type AlmacenAction =
  | { type: 'CARGAR_ESTADO_INICIAL'; payload: Partial<AlmacenState> }
  | { type: 'REGISTRAR_ARTICULO'; payload: Articulo }
  | { type: 'ACTUALIZAR_ARTICULO'; payload: Articulo }
  | { type: 'TOGGLE_ESTATUS_ARTICULO'; payload: { sku: string; nuevoEstatus: 'Activo' | 'Inactivo'; usuario: string; motivo?: string } }
  | { type: 'CREAR_RECEPCION_IR03'; payload: RecepcionIR03Documento }
  | { type: 'ELIMINAR_RECEPCION_IR03'; payload: { folio: string; motivoAuditoria: string; usuario: string } }
  | { type: 'CREAR_VALE_SALIDA_SA'; payload: ValeSalidaSA }
  | { type: 'REGISTRAR_DEVOLUCION'; payload: DevolucionAlmacen }
  | { type: 'ENVIAR_A_MANTENIMIENTO'; payload: MantenimientoArticulo }
  | {
      type: 'COMPLETAR_MANTENIMIENTO_REINGRESO';
      payload: {
        id: string;
        fechaRetornoReal: string;
        costoMantenimiento: number;
        observacionesResolucion: string;
        usuario: string;
        trabajoRealizado?: string;
        refaccionesUsadas?: string;
        estatusResultante?: 'Al día' | 'Requiere seguimiento' | 'Baja Definitiva';
        adjuntos?: AdjuntoMantenimiento[];
      };
    }
  | { type: 'REPROGRAMAR_MANTENIMIENTO'; payload: { id: string; nuevaFecha: string; usuario: string } }
  | { type: 'DAR_DE_BAJA_MANTENIMIENTO'; payload: { id: string; motivo: string; usuario: string } }
  | { type: 'REGISTRAR_LOG_AUDITORIA'; payload: BitacoraAlmacenItem }
  | { type: 'SET_TOAST'; payload: { message: string; type: 'success' | 'info' | 'warning' | 'error' } }
  | { type: 'CLEAR_TOAST' };

const STORAGE_KEY_ALMACEN_STORE = 'sifygsa_almacen_suite_store_v1';

const MANTENIMIENTOS_INICIALES: MantenimientoArticulo[] = [
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
    costoEstimado: 4850.0,
    costoMantenimiento: 4850.0,
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
    costoEstimado: 3200.0,
    costoMantenimiento: 3200.0,
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
    costoEstimado: 1500.0,
    costoMantenimiento: 1500.0,
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
    costoEstimado: 1800.0,
    diagnosticoFalla: 'Verificación trimestral de respuesta UV/IR y prueba funcional en banco.',
    usuarioRegistro: 'Ing. Mateo Gómez',
  },
];

const BITACORA_MANTENIMIENTO_INICIAL: BitacoraMantenimientoItem[] = [
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
    costoFinal: 1500.0,
    responsable: 'Taller Electrónico SIFYGSA CDMX',
    usuario: 'Ing. Mateo Gómez',
    estatusResultante: 'Al día',
  },
];

// Datos iniciales enriquecidos con las reglas de negocio reales
const ARTICULOS_INICIALES: Articulo[] = MOCK_ARTICULOS.map((art) => ({
  ...art,
  descripcionCorta: art.descripcionCorta || art.nombre,
  marca: art.marca || 'SIFYGSA Industrial',
  modelo: art.modelo || 'STD-2026',
  unidadMedida: (art.unidadMedida as any) || (art.unidadBase === 'Servicio' ? 'Servicio' : 'Pieza'),
  precioReferenciaMXN: art.precioReferenciaMXN || art.precioUnitario || 1500,
  requiereSerieUnica: art.categoria === 'Equipos de Medición' || art.custodia === 'Equipo Sujeto a Calibración',
  estatus: 'Activo',
  clasificacionCustodia:
    art.custodia === 'Consumible'
      ? 'Consumible'
      : art.custodia === 'Equipo Sujeto a Calibración'
      ? 'Equipo Sujeto a Calibración / Mantenimiento'
      : 'Herramienta Retornable (Activo)',
  seriesRegistradas:
    art.sku === 'DET-UVIR-FLAME-01'
      ? ['SN-X3301-881', 'SN-X3301-882', 'SN-X3301-883', 'SN-X3301-884']
      : art.sku === 'GAS-CAL-CH4-50'
      ? ['LOT-CAL-2024-11B']
      : [],
}));

const RECEPCIONES_INICIALES: RecepcionIR03Documento[] = [
  {
    id: 'rec-001',
    folio: 'IR03-2024-0089',
    ordenCompraFolio: 'PO-2026-0173',
    contratoProyecto: 'SFG-C259-TAM',
    proveedor: 'Five Peaks México SA de CV',
    rfcProveedor: 'FPM130918MPA',
    remisionFactura: 'FAC-GMX-99421',
    fecha: '2026-11-12',
    almacenistaResponsable: 'Ing. Mateo Gómez (Jefe Almacén)',
    ubicacionDestinoGeneral: 'SFG-C259-TAM (Tenaris Tamsa)',
    estatus: 'Parcial',
    notasGenerales: 'Recepción física en andén norte conforme a especificación técnica de OC PO-2026-0173.',
    partidas: [
      {
        id: 'p-1',
        sku: 'SRV-SAN-001',
        descripcion: 'Servicio de baño portátil para Tenaris Tamsa',
        cantidadSolicitadaPO: 1,
        cantidadFacturada: 1,
        cantidadRecibidaFisica: 1,
        stockDisponibleAlmacenPrincipal: 0,
        unidad: 'Servicio',
        ubicacionProyectoDestino: 'SFG-C259-TAM (Tenaris Tamsa)',
        observaciones: 'Instalado en frente maniobras puerta 4.',
        estadoPartida: 'Completo',
      },
      {
        id: 'p-2',
        sku: 'DET-UVIR-FLAME-01',
        descripcion: 'Detector Óptico de Flama UV/IR Multispectrum Det-Tronics',
        cantidadSolicitadaPO: 10,
        cantidadFacturada: 10,
        cantidadRecibidaFisica: 8,
        stockDisponibleAlmacenPrincipal: 12,
        unidad: 'Pieza',
        ubicacionProyectoDestino: 'SFG-C259-TAM (Tenaris Tamsa)',
        numerosSerie: ['SN-X3301-881', 'SN-X3301-882', 'SN-X3301-883', 'SN-X3301-884'],
        observaciones: 'Pendiente entrega de 2 piezas por embarque foráneo.',
        estadoPartida: 'Parcial',
      },
    ],
  },
];

const VALES_SALIDA_INICIALES: ValeSalidaSA[] = [
  {
    id: 'sa-001',
    folio: 'SA-2026-0142',
    contratoProyectoDestino: 'SFG-C307-LAG',
    solicitudMaterialFolio: 'SM-2026-088',
    fechaSalida: '2026-11-14',
    responsableRecibe: 'Ing. Fernando Ruiz',
    cargoArea: 'Residencia de Obra Laguna Verde',
    numeroEmpleado: 'EMP-0412',
    almacenistaDespacho: 'Mateo Gómez',
    firmadoFisico: true,
    estatus: 'Despachado',
    observaciones: 'Herramientas y equipos sujetos a retorno al finalizar la etapa de montaje.',
    partidas: [
      {
        id: 'psa-1',
        sku: 'DET-UVIR-FLAME-01',
        descripcion: 'Detector Óptico de Flama UV/IR Multispectrum',
        cantidad: 2,
        unidad: 'Pieza',
        custodia: 'Equipo Sujeto a Calibración / Mantenimiento',
        numerosSerie: ['SN-X3301-881', 'SN-X3301-882'],
        ubicacionOrigen: 'Almacén Principal',
        notas: 'Calibración vigente hasta 2027-02-15',
      },
    ],
  },
];

const DEVOLUCIONES_INICIALES: DevolucionAlmacen[] = [
  {
    id: 'dev-001',
    folio: 'DEV-2026-0045',
    valeSalidaOrigenFolio: 'SA-2026-0142',
    contratoProyectoOrigen: 'SFG-C307-LAG',
    fechaDevolucion: '2026-11-15',
    responsableEntrega: 'Ing. Fernando Ruiz',
    almacenistaReceptor: 'Mateo Gómez',
    motivoDevolucion: 'Reingreso de multímetro y material sobrante de tubería.',
    estatus: 'Completada',
    items: [
      {
        id: 'dev-item-1',
        sku: 'TUB-COND-1-ALUM',
        descripcion: 'Tubo Conduit Aluminio 1 pulgada Cédula 40',
        cantidadDevuelta: 4,
        unidad: 'Tramo',
        tipoItem: 'sobrante_consumible',
        estadoFisico: 'Excelente',
        nuevoDestino: 'Almacén Principal',
        notas: 'Tramos enteros de 3m reintegrados al stock disponible.',
      },
    ],
  },
];

const BITACORA_INICIAL: BitacoraAlmacenItem[] = [
  {
    id: 'log-001',
    fechaHora: '2026-11-12 11:30:00',
    usuario: 'Mateo Gómez',
    folioDocumento: 'IR03-2024-0089',
    accion: 'recepcion',
    campoModificado: 'Recepción física parcial',
    valorAnterior: 'Pendiente',
    valorNuevo: '8 piezas recibidas de 10 solicitadas',
    motivo: 'Entrega parcial del proveedor Five Peaks México',
  },
];

function almacenReducer(state: AlmacenState, action: AlmacenAction): AlmacenState {
  switch (action.type) {
    case 'CARGAR_ESTADO_INICIAL':
      return {
        ...state,
        ...action.payload,
      };

    case 'REGISTRAR_ARTICULO': {
      const art = action.payload;
      const existe = state.articulos.some(
        (a) => a.sku.toLowerCase() === art.sku.toLowerCase()
      );
      if (existe) {
        return {
          ...state,
          toast: {
            message: `El código SKU ${art.sku} ya existe en el catálogo.`,
            type: 'error',
          },
        };
      }
      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario: 'Gerente de Almacén',
        folioDocumento: art.sku,
        accion: 'creacion',
        campoModificado: 'Alta de Artículo',
        valorAnterior: '-',
        valorNuevo: `${art.sku} - ${art.descripcionCorta}`,
      };
      return {
        ...state,
        articulos: [art, ...state.articulos],
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Artículo ${art.sku} registrado exitosamente en el catálogo maestro.`,
          type: 'success',
        },
      };
    }

    case 'ACTUALIZAR_ARTICULO': {
      const art = action.payload;
      const anterior = state.articulos.find((a) => a.id === art.id || a.sku === art.sku);
      const articulos = state.articulos.map((a) =>
        a.id === art.id || a.sku === art.sku ? art : a
      );
      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario: 'Gerente de Almacén',
        folioDocumento: art.sku,
        accion: 'edicion',
        campoModificado: 'Datos técnicos de artículo',
        valorAnterior: anterior?.descripcionCorta || '-',
        valorNuevo: art.descripcionCorta,
      };
      return {
        ...state,
        articulos,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Artículo ${art.sku} actualizado correctamente.`,
          type: 'success',
        },
      };
    }

    case 'TOGGLE_ESTATUS_ARTICULO': {
      const { sku, nuevoEstatus, usuario, motivo } = action.payload;
      const articulos = state.articulos.map((a) =>
        a.sku.toLowerCase() === sku.toLowerCase() ? { ...a, estatus: nuevoEstatus } : a
      );
      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        folioDocumento: sku,
        accion: 'inhabilitacion',
        campoModificado: 'Estatus Artículo',
        valorAnterior: nuevoEstatus === 'Activo' ? 'Inactivo' : 'Activo',
        valorNuevo: nuevoEstatus,
        motivo: motivo || (nuevoEstatus === 'Inactivo' ? 'Marcado como obsoleto por almacén' : 'Reactivado en catálogo'),
      };
      return {
        ...state,
        articulos,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Artículo ${sku} marcado como ${nuevoEstatus}.`,
          type: 'info',
        },
      };
    }

    case 'CREAR_RECEPCION_IR03': {
      const rec = action.payload;
      const recepciones = [rec, ...state.recepciones.filter((r) => r.folio !== rec.folio)];
      
      // Actualizar existencias en almacén para partidas recibidas y registrar en Kárdex
      const articulosActualizados = state.articulos.map((art) => {
        const partida = rec.partidas.find(
          (p) => p.sku.toLowerCase() === art.sku.toLowerCase()
        );
        if (partida && partida.cantidadRecibidaFisica > 0) {
          const nuevasSeries = partida.numerosSerie
            ? Array.from(new Set([...(art.seriesRegistradas || []), ...partida.numerosSerie]))
            : art.seriesRegistradas;
          const nuevoStockDisponible = art.stockDisponible + partida.cantidadRecibidaFisica;
          const nuevoStockTotal = art.stockTotal + partida.cantidadRecibidaFisica;
          const nuevoEstado = nuevoStockDisponible > art.stockMinimo ? 'Disponible' : art.estado;

          return {
            ...art,
            stockTotal: nuevoStockTotal,
            stockDisponible: nuevoStockDisponible,
            seriesRegistradas: nuevasSeries,
            estado: nuevoEstado,
          };
        }
        return art;
      });

      // Movimientos de Kárdex generados
      const nuevosMovimientos: MovimientoAlmacen[] = rec.partidas
        .filter((p) => p.cantidadRecibidaFisica > 0)
        .map((p, idx) => ({
          id: `mov-ir03-${Date.now()}-${idx}`,
          folio: rec.folio,
          tipo: 'Entrada IR03',
          fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
          articuloSku: p.sku,
          articuloNombre: p.descripcion,
          cantidad: p.cantidadRecibidaFisica,
          almacen: rec.ubicacionDestinoGeneral || 'Almacén Principal',
          ubicacion: p.ubicacionProyectoDestino || rec.ubicacionDestinoGeneral,
          referenciaDoc: rec.ordenCompraFolio,
          responsable: rec.almacenistaResponsable,
          frenteTrabajo: rec.contratoProyecto,
          estado: 'Completado',
        }));

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario: rec.almacenistaResponsable,
        folioDocumento: rec.folio,
        accion: 'recepcion',
        campoModificado: `Entrada IR03 contra OC ${rec.ordenCompraFolio}`,
        valorAnterior: 'Pendiente de descarga',
        valorNuevo: `${rec.partidas.length} partidas recibidas`,
        motivo: rec.notasGenerales || 'Entrada física en andén',
      };

      return {
        ...state,
        recepciones,
        articulos: articulosActualizados,
        movimientos: [...nuevosMovimientos, ...state.movimientos],
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Recepción ${rec.folio} registrada exitosamente contra orden ${rec.ordenCompraFolio}. Stock incrementado.`,
          type: 'success',
        },
      };
    }

    case 'ELIMINAR_RECEPCION_IR03': {
      const { folio, motivoAuditoria, usuario } = action.payload;
      const recAnterior = state.recepciones.find((r) => r.folio === folio);
      if (!recAnterior) return state;

      // Descontar inventario de la recepción errónea
      const articulosActualizados = state.articulos.map((art) => {
        const partida = recAnterior.partidas.find(
          (p) => p.sku.toLowerCase() === art.sku.toLowerCase()
        );
        if (partida && partida.cantidadRecibidaFisica > 0) {
          return {
            ...art,
            stockTotal: Math.max(0, art.stockTotal - partida.cantidadRecibidaFisica),
            stockDisponible: Math.max(0, art.stockDisponible - partida.cantidadRecibidaFisica),
          };
        }
        return art;
      });

      const recepciones = state.recepciones.map((r) =>
        r.folio === folio
          ? {
              ...r,
              estatus: 'Eliminada' as const,
              motivoEliminacion: motivoAuditoria,
              usuarioEliminacion: usuario,
              fechaEliminacion: new Date().toLocaleString('es-MX'),
            }
          : r
      );

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        folioDocumento: folio,
        accion: 'eliminacion',
        campoModificado: 'Cancelación de Recepción IR03',
        valorAnterior: 'Activa en Kárdex',
        valorNuevo: 'Eliminada / Reversa de Stock',
        motivo: motivoAuditoria,
      };

      return {
        ...state,
        recepciones,
        articulos: articulosActualizados,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Recepción ${folio} anulada y registrada en bitácora de auditoría.`,
          type: 'warning',
        },
      };
    }

    case 'CREAR_VALE_SALIDA_SA': {
      const vale = action.payload;

      // Validación estricta de stock disponible y bloqueo por mantenimiento correctivo para cada partida
      for (const partida of vale.partidas) {
        const art = state.articulos.find((a) => a.sku.toLowerCase() === partida.sku.toLowerCase());
        if (art?.noDisponiblePorMantenimiento) {
          return {
            ...state,
            toast: {
              message: `Artículo bloqueado: ${art.sku} está marcado como "No disponible" por mantenimiento correctivo.`,
              type: 'error',
            },
          };
        }
        if (art && art.stockDisponible < partida.cantidad) {
          return {
            ...state,
            toast: {
              message: `Error de existencias: El artículo ${art.sku} (${art.descripcionCorta || art.nombre}) solo dispone de ${art.stockDisponible} unidades. No es posible autorizar la salida de ${partida.cantidad}.`,
              type: 'error',
            },
          };
        }
      }

      const valesSalida = [vale, ...state.valesSalida];

      // Descontar stock disponible y mover a stockProyecto
      const articulosActualizados = state.articulos.map((art) => {
        const partida = vale.partidas.find(
          (p) => p.sku.toLowerCase() === art.sku.toLowerCase()
        );
        if (partida) {
          const nuevoDisponible = Math.max(0, art.stockDisponible - partida.cantidad);
          const nuevoEstado = nuevoDisponible === 0 ? 'Crítico' : nuevoDisponible <= art.stockMinimo ? 'Stock Bajo' : art.estado;
          return {
            ...art,
            stockDisponible: nuevoDisponible,
            stockProyecto: art.stockProyecto + partida.cantidad,
            estado: nuevoEstado,
          };
        }
        return art;
      });

      // Movimientos de Kárdex generados por salida
      const nuevosMovimientos: MovimientoAlmacen[] = vale.partidas.map((p, idx) => ({
        id: `mov-sa-${Date.now()}-${idx}`,
        folio: vale.folio,
        tipo: 'Salida a Proyecto',
        fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
        articuloSku: p.sku,
        articuloNombre: p.descripcion,
        cantidad: p.cantidad,
        almacen: 'Almacén Principal',
        ubicacion: vale.contratoProyectoDestino,
        referenciaDoc: vale.solicitudMaterialFolio || vale.folio,
        responsable: vale.responsableRecibe,
        frenteTrabajo: vale.contratoProyectoDestino,
        estado: 'Completado',
      }));

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario: vale.almacenistaDespacho,
        folioDocumento: vale.folio,
        accion: 'salida',
        campoModificado: `Despacho a proyecto ${vale.contratoProyectoDestino}`,
        valorAnterior: 'En Almacén Principal',
        valorNuevo: `Despachado a ${vale.responsableRecibe}`,
        motivo: vale.observaciones || 'Vale de salida a obra',
      };

      return {
        ...state,
        valesSalida,
        articulos: articulosActualizados,
        movimientos: [...nuevosMovimientos, ...state.movimientos],
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Vale de Salida ${vale.folio} emitido para ${vale.contratoProyectoDestino}. Stock actualizado correctamente.`,
          type: 'success',
        },
      };
    }

    case 'ENVIAR_A_MANTENIMIENTO': {
      const mant = action.payload;
      const esSoloProgramado = mant.estado === 'Programado' && mant.procesoSiguiente !== 'Almacén';
      const art = state.articulos.find(
        (a) => a.id === mant.articuloId || a.sku.toLowerCase() === mant.articuloSku.toLowerCase()
      );

      if (!esSoloProgramado && art && art.stockDisponible < mant.cantidad && mant.procesoSiguiente !== 'Almacén') {
        return {
          ...state,
          toast: {
            message: `Error de stock: ${art.sku} solo cuenta con ${art.stockDisponible} unidades disponibles.`,
            type: 'error',
          },
        };
      }

      const articulosActualizados = state.articulos.map((a) => {
        if (a.id === mant.articuloId || a.sku.toLowerCase() === mant.articuloSku.toLowerCase()) {
          if (esSoloProgramado) {
            return mant.bloquearDisponibilidad
              ? { ...a, noDisponiblePorMantenimiento: true }
              : a;
          }
          const cantDeduct = Math.min(a.stockDisponible, mant.cantidad);
          const nuevoDisponible = Math.max(0, a.stockDisponible - cantDeduct);
          const nuevoMantenimiento = a.stockMantenimiento + cantDeduct;
          const bloquear = mant.procesoSiguiente === 'Almacén' || Boolean(mant.bloquearDisponibilidad);
          const nuevoEstado =
            nuevoDisponible === 0 || bloquear
              ? 'Mantenimiento'
              : nuevoDisponible <= a.stockMinimo
              ? 'Stock Bajo'
              : a.estado;
          return {
            ...a,
            stockDisponible: nuevoDisponible,
            stockMantenimiento: nuevoMantenimiento,
            enMantenimiento: true,
            noDisponiblePorMantenimiento: bloquear || a.noDisponiblePorMantenimiento,
            estado: nuevoEstado,
          };
        }
        return a;
      });

      const nuevoMovimiento: MovimientoAlmacen = {
        id: `mov-mnt-${Date.now()}`,
        folio: mant.folio,
        tipo: 'Envío a Calibración',
        fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
        articuloSku: mant.articuloSku,
        articuloNombre: mant.articuloNombre,
        cantidad: mant.cantidad,
        almacen: mant.ubicacionActual || mant.almacenId || 'Almacén Principal',
        ubicacion: mant.ubicacionMantenimiento || mant.responsableOProveedor,
        referenciaDoc: mant.folio,
        responsable: mant.responsableOProveedor || mant.usuarioRegistro,
        estado: esSoloProgramado ? 'Pendiente' : 'En Tránsito',
      };

      const nuevoBitacoraMant: BitacoraMantenimientoItem = {
        id: `bm-${Date.now()}`,
        mantenimientoId: mant.id,
        folio: mant.folio,
        articuloId: mant.articuloId,
        articuloSku: mant.articuloSku,
        articuloNombre: mant.articuloNombre,
        fecha: mant.fechaEnvio,
        tipoEvento: 'programacion',
        tipoMantenimiento: mant.tipoMantenimiento,
        descripcion: `${esSoloProgramado ? 'Programación' : 'Envío a servicio'} (${mant.frecuencia || 'Única'}): ${mant.diagnosticoFalla}`,
        costoFinal: mant.costoEstimado ?? mant.costoMantenimiento,
        responsable: mant.responsableOProveedor,
        usuario: mant.usuarioRegistro,
        estatusResultante: mant.estado,
      };

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario: mant.usuarioRegistro,
        folioDocumento: mant.folio,
        accion: 'salida',
        campoModificado: `Mantenimiento (${mant.tipoMantenimiento})`,
        valorAnterior: 'Disponible en Almacén',
        valorNuevo: `Taller/Laboratorio: ${mant.responsableOProveedor}`,
        motivo: mant.diagnosticoFalla,
      };

      return {
        ...state,
        mantenimientos: [mant, ...state.mantenimientos],
        bitacoraMantenimiento: [nuevoBitacoraMant, ...state.bitacoraMantenimiento],
        articulos: articulosActualizados,
        movimientos: esSoloProgramado ? state.movimientos : [nuevoMovimiento, ...state.movimientos],
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: esSoloProgramado
            ? `Mantenimiento ${mant.folio} programado para ${mant.fechaProgramada || mant.fechaEstimadaRetorno}.`
            : `Mantenimiento ${mant.folio} registrado. Se enviaron ${mant.cantidad} unidades a ${mant.responsableOProveedor}.`,
          type: 'success',
        },
      };
    }

    case 'COMPLETAR_MANTENIMIENTO_REINGRESO': {
      const {
        id,
        fechaRetornoReal,
        costoMantenimiento,
        observacionesResolucion,
        usuario,
        trabajoRealizado,
        refaccionesUsadas,
        estatusResultante = 'Al día',
        adjuntos = [],
      } = action.payload;
      const mant = state.mantenimientos.find((m) => m.id === id);
      if (!mant) return state;

      const estadoFinal =
        estatusResultante === 'Baja Definitiva'
          ? ('Baja Definitiva / Irreparable' as const)
          : ('Completado / Listo para Reingreso' as const);

      const estabaEnTaller =
        mant.estado === 'En Proceso' || mant.estado === 'Pendiente / En Diagnóstico';

      const mantenimientosActualizados = state.mantenimientos.map((m) =>
        m.id === id
          ? {
              ...m,
              estado: estadoFinal,
              fechaRetornoReal,
              ultimaFecha: fechaRetornoReal,
              costoMantenimiento,
              observacionesResolucion,
              trabajoRealizado: trabajoRealizado || m.trabajoRealizado,
              refaccionesUsadas: refaccionesUsadas || m.refaccionesUsadas,
              estatusResultante,
              adjuntos: [...(m.adjuntos ?? []), ...adjuntos],
            }
          : m
      );

      // Si es recurrente, programar automáticamente el siguiente servicio
      let siguienteProgramado: MantenimientoArticulo | null = null;
      if (
        estatusResultante !== 'Baja Definitiva' &&
        mant.frecuencia &&
        mant.frecuencia !== 'Única' &&
        mant.frecuencia !== 'Por horas / uso'
      ) {
        const base = new Date(`${fechaRetornoReal}T12:00:00`);
        if (!Number.isNaN(base.getTime())) {
          const meses =
            mant.frecuencia === 'Mensual'
              ? 1
              : mant.frecuencia === 'Trimestral'
              ? 3
              : mant.frecuencia === 'Semestral'
              ? 6
              : 12;
          base.setMonth(base.getMonth() + meses);
          const prox = base.toISOString().slice(0, 10);
          siguienteProgramado = {
            ...mant,
            id: `mnt-next-${Date.now()}`,
            folio: `MNT-2026-${String(mantenimientosActualizados.length + 1).padStart(4, '0')}`,
            estado: 'Programado',
            fechaEnvio: fechaRetornoReal,
            fechaProgramada: prox,
            fechaEstimadaRetorno: prox,
            ultimaFecha: fechaRetornoReal,
            fechaRetornoReal: undefined,
            bloquearDisponibilidad: false,
            diagnosticoFalla: `Servicio recurrente (${mant.frecuencia}) programado automáticamente tras ${mant.folio}.`,
            usuarioRegistro: usuario,
          };
        }
      }

      const mantenimientos = siguienteProgramado
        ? [siguienteProgramado, ...mantenimientosActualizados]
        : mantenimientosActualizados;

      const sigueBloqueado = mantenimientos.some(
        (m) =>
          m.articuloSku.toLowerCase() === mant.articuloSku.toLowerCase() &&
          m.bloquearDisponibilidad &&
          (m.estado === 'En Proceso' || m.estado === 'Pendiente / En Diagnóstico')
      );

      const articulosActualizados = state.articulos.map((a) => {
        if (a.id === mant.articuloId || a.sku.toLowerCase() === mant.articuloSku.toLowerCase()) {
          if (estatusResultante === 'Baja Definitiva') {
            return {
              ...a,
              stockMantenimiento: estabaEnTaller
                ? Math.max(0, a.stockMantenimiento - mant.cantidad)
                : a.stockMantenimiento,
              stockTotal: Math.max(0, a.stockTotal - mant.cantidad),
              noDisponiblePorMantenimiento: sigueBloqueado,
            };
          }
          const nuevoMantenimiento = estabaEnTaller
            ? Math.max(0, a.stockMantenimiento - mant.cantidad)
            : a.stockMantenimiento;
          const nuevoDisponible = estabaEnTaller
            ? a.stockDisponible + mant.cantidad
            : a.stockDisponible;
          return {
            ...a,
            stockMantenimiento: nuevoMantenimiento,
            stockDisponible: nuevoDisponible,
            enMantenimiento: nuevoMantenimiento > 0,
            noDisponiblePorMantenimiento: sigueBloqueado,
            estado: sigueBloqueado ? ('Mantenimiento' as const) : ('Disponible' as const),
          };
        }
        return a;
      });

      const nuevoMovimiento: MovimientoAlmacen = {
        id: `mov-reing-${Date.now()}`,
        folio: mant.folio,
        tipo: 'Devolución',
        fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
        articuloSku: mant.articuloSku,
        articuloNombre: mant.articuloNombre,
        cantidad: mant.cantidad,
        almacen: 'Almacén Principal',
        ubicacion: 'Andén Central',
        referenciaDoc: mant.folio,
        responsable: usuario,
        estado: 'Completado',
      };

      const nuevoBitacoraMant: BitacoraMantenimientoItem = {
        id: `bm-${Date.now()}`,
        mantenimientoId: mant.id,
        folio: mant.folio,
        articuloId: mant.articuloId,
        articuloSku: mant.articuloSku,
        articuloNombre: mant.articuloNombre,
        fecha: fechaRetornoReal,
        tipoEvento: estatusResultante === 'Baja Definitiva' ? 'baja' : 'ejecucion',
        tipoMantenimiento: mant.tipoMantenimiento,
        descripcion: observacionesResolucion || 'Ejecución de mantenimiento registrada.',
        trabajoRealizado,
        refaccionesUsadas,
        costoFinal: costoMantenimiento,
        responsable: mant.responsableOProveedor,
        usuario,
        estatusResultante,
      };

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        folioDocumento: mant.folio,
        accion: 'recepcion',
        campoModificado: 'Ejecución de Mantenimiento',
        valorAnterior: mant.estado,
        valorNuevo: estatusResultante,
        motivo: observacionesResolucion || 'Mantenimiento finalizado exitosamente.',
      };

      return {
        ...state,
        mantenimientos,
        bitacoraMantenimiento: [nuevoBitacoraMant, ...state.bitacoraMantenimiento],
        articulos: articulosActualizados,
        movimientos: [nuevoMovimiento, ...state.movimientos],
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Ejecución ${mant.folio} registrada (${estatusResultante}).${siguienteProgramado ? ` Próximo servicio: ${siguienteProgramado.fechaProgramada}.` : ''}`,
          type: 'success',
        },
      };
    }

    case 'REPROGRAMAR_MANTENIMIENTO': {
      const { id, nuevaFecha, usuario } = action.payload;
      const mant = state.mantenimientos.find((m) => m.id === id);
      if (!mant) return state;

      const mantenimientos = state.mantenimientos.map((m) =>
        m.id === id
          ? {
              ...m,
              fechaProgramada: nuevaFecha,
              fechaEstimadaRetorno: nuevaFecha,
            }
          : m
      );

      const nuevoBitacoraMant: BitacoraMantenimientoItem = {
        id: `bm-${Date.now()}`,
        mantenimientoId: mant.id,
        folio: mant.folio,
        articuloId: mant.articuloId,
        articuloSku: mant.articuloSku,
        articuloNombre: mant.articuloNombre,
        fecha: new Date().toISOString().slice(0, 10),
        tipoEvento: 'reprogramacion',
        tipoMantenimiento: mant.tipoMantenimiento,
        descripcion: `Fecha reprogramada de ${mant.fechaProgramada || mant.fechaEstimadaRetorno} a ${nuevaFecha}.`,
        responsable: mant.responsableOProveedor,
        usuario,
        estatusResultante: mant.estado,
      };

      return {
        ...state,
        mantenimientos,
        bitacoraMantenimiento: [nuevoBitacoraMant, ...state.bitacoraMantenimiento],
        toast: {
          message: `Mantenimiento ${mant.folio} reprogramado para el ${nuevaFecha}.`,
          type: 'info',
        },
      };
    }

    case 'DAR_DE_BAJA_MANTENIMIENTO': {
      const { id, motivo, usuario } = action.payload;
      const mant = state.mantenimientos.find((m) => m.id === id);
      if (!mant) return state;

      const mantenimientos = state.mantenimientos.map((m) =>
        m.id === id
          ? {
              ...m,
              estado: 'Baja Definitiva / Irreparable' as const,
              observacionesResolucion: `BAJA DEFINITIVA: ${motivo}`,
              fechaRetornoReal: new Date().toISOString().slice(0, 10),
            }
          : m
      );

      const articulosActualizados = state.articulos.map((a) => {
        if (a.id === mant.articuloId || a.sku.toLowerCase() === mant.articuloSku.toLowerCase()) {
          return {
            ...a,
            stockMantenimiento: Math.max(0, a.stockMantenimiento - mant.cantidad),
            stockTotal: Math.max(0, a.stockTotal - mant.cantidad),
          };
        }
        return a;
      });

      const nuevoMovimiento: MovimientoAlmacen = {
        id: `mov-baja-${Date.now()}`,
        folio: mant.folio,
        tipo: 'Ajuste',
        fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
        articuloSku: mant.articuloSku,
        articuloNombre: mant.articuloNombre,
        cantidad: mant.cantidad,
        almacen: 'Almacén Principal',
        ubicacion: 'Área de Merma / Baja',
        referenciaDoc: mant.folio,
        responsable: usuario,
        estado: 'Completado',
      };

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        folioDocumento: mant.folio,
        accion: 'inhabilitacion',
        campoModificado: 'Baja Definitiva de Activo Irreparable',
        valorAnterior: 'En Mantenimiento',
        valorNuevo: 'Baja de Activo / Merma',
        motivo,
      };

      return {
        ...state,
        mantenimientos,
        articulos: articulosActualizados,
        movimientos: [nuevoMovimiento, ...state.movimientos],
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Mantenimiento ${mant.folio} dado de baja definitiva. Inventario total descontado.`,
          type: 'warning',
        },
      };
    }

    case 'REGISTRAR_DEVOLUCION': {
      const dev = action.payload;
      const devoluciones = [dev, ...state.devoluciones];

      // Reintegrar stock a disponible si está en buen estado
      const articulosActualizados = state.articulos.map((art) => {
        const itemDev = dev.items.find(
          (i) => i.sku.toLowerCase() === art.sku.toLowerCase()
        );
        if (itemDev) {
          const aDisponible =
            itemDev.nuevoDestino === 'Almacén Principal' ? itemDev.cantidadDevuelta : 0;
          const aMantenimiento =
            itemDev.nuevoDestino === 'En Mantenimiento / Calibración'
              ? itemDev.cantidadDevuelta
              : 0;

          return {
            ...art,
            stockProyecto: Math.max(0, art.stockProyecto - itemDev.cantidadDevuelta),
            stockDisponible: art.stockDisponible + aDisponible,
            stockMantenimiento: art.stockMantenimiento + aMantenimiento,
          };
        }
        return art;
      });

      const nuevoLog: BitacoraAlmacenItem = {
        id: `log-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario: dev.almacenistaReceptor,
        folioDocumento: dev.folio,
        accion: 'devolucion',
        campoModificado: `Retorno de obra desde ${dev.contratoProyectoOrigen}`,
        valorAnterior: 'En Proyecto',
        valorNuevo: 'Reintegrado a Almacén / Mantenimiento',
        motivo: dev.motivoDevolucion,
      };

      return {
        ...state,
        devoluciones,
        articulos: articulosActualizados,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Devolución ${dev.folio} registrada exitosamente.`,
          type: 'success',
        },
      };
    }

    case 'REGISTRAR_LOG_AUDITORIA':
      return {
        ...state,
        bitacora: [action.payload, ...state.bitacora],
      };

    case 'SET_TOAST':
      return {
        ...state,
        toast: action.payload,
      };

    case 'CLEAR_TOAST':
      return {
        ...state,
        toast: null,
      };

    default:
      return state;
  }
}

interface AlmacenContextType {
  articulos: Articulo[];
  articulosActivos: Articulo[];
  recepciones: RecepcionIR03Documento[];
  valesSalida: ValeSalidaSA[];
  devoluciones: DevolucionAlmacen[];
  mantenimientos: MantenimientoArticulo[];
  bitacoraMantenimiento: BitacoraMantenimientoItem[];
  movimientos: MovimientoAlmacen[];
  bitacora: BitacoraAlmacenItem[];
  monitorCalibracion: MonitorCalibracionItem[];
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  registrarArticulo: (art: Articulo) => void;
  actualizarArticulo: (art: Articulo) => void;
  toggleEstatusArticulo: (sku: string, nuevoEstatus: 'Activo' | 'Inactivo', usuario: string, motivo?: string) => void;
  validarSerieUnica: (serie: string, excludeSku?: string) => { valida: boolean; mensaje?: string };
  crearRecepcionIR03: (rec: RecepcionIR03Documento) => void;
  eliminarRecepcionIR03: (folio: string, motivoAuditoria: string, usuario: string) => void;
  crearValeSalidaSA: (vale: ValeSalidaSA) => void;
  registrarDevolucion: (dev: DevolucionAlmacen) => void;
  enviarAMantenimiento: (mant: MantenimientoArticulo) => void;
  completarMantenimientoReingreso: (
    id: string,
    fechaRetornoReal: string,
    costoMantenimiento: number,
    observacionesResolucion: string,
    usuario: string,
    extra?: {
      trabajoRealizado?: string;
      refaccionesUsadas?: string;
      estatusResultante?: 'Al día' | 'Requiere seguimiento' | 'Baja Definitiva';
      adjuntos?: AdjuntoMantenimiento[];
    }
  ) => void;
  reprogramarMantenimiento: (id: string, nuevaFecha: string, usuario: string) => void;
  darDeBajaMantenimiento: (id: string, motivo: string, usuario: string) => void;
  mostrarToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  cerrarToast: () => void;
}

const AlmacenContext = createContext<AlmacenContextType | undefined>(undefined);

export const AlmacenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(almacenReducer, {
    articulos: ARTICULOS_INICIALES,
    recepciones: RECEPCIONES_INICIALES,
    valesSalida: VALES_SALIDA_INICIALES,
    devoluciones: DEVOLUCIONES_INICIALES,
    mantenimientos: MANTENIMIENTOS_INICIALES,
    bitacoraMantenimiento: BITACORA_MANTENIMIENTO_INICIAL,
    movimientos: MOCK_MOVIMIENTOS,
    bitacora: BITACORA_INICIAL,
    toast: null,
  });

  // Cargar de localStorage y sincronizar con API de mantenimiento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ALMACEN_STORE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.articulos)) {
            dispatch({ type: 'CARGAR_ESTADO_INICIAL', payload: parsed });
          }
        }
      } catch (err) {
        console.error('Error al cargar AlmacenContext:', err);
      }

      fetch('/api/almacen/mantenimiento')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.exito && json.datos) {
            dispatch({
              type: 'CARGAR_ESTADO_INICIAL',
              payload: {
                mantenimientos: json.datos.mantenimientos,
                bitacoraMantenimiento: json.datos.bitacoraMantenimiento,
              },
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  // Persistir a localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY_ALMACEN_STORE,
          JSON.stringify({
            articulos: state.articulos,
            recepciones: state.recepciones,
            valesSalida: state.valesSalida,
            devoluciones: state.devoluciones,
            mantenimientos: state.mantenimientos,
            bitacoraMantenimiento: state.bitacoraMantenimiento,
            movimientos: state.movimientos,
            bitacora: state.bitacora,
          })
        );
      } catch (err) {
        console.error('Error al persistir AlmacenContext:', err);
      }
    }
  }, [
    state.articulos,
    state.recepciones,
    state.valesSalida,
    state.devoluciones,
    state.mantenimientos,
    state.bitacoraMantenimiento,
    state.movimientos,
    state.bitacora,
  ]);

  // Lista de artículos activos para operadores / solicitantes
  const articulosActivos = useMemo(() => {
    return state.articulos.filter((a) => a.estatus !== 'Inactivo');
  }, [state.articulos]);

  // Monitor de Calibración
  const monitorCalibracion = useMemo<MonitorCalibracionItem[]>(() => {
    const hoy = new Date();
    const items: MonitorCalibracionItem[] = [];

    state.articulos.forEach((art) => {
      if (
        art.categoria === 'Equipos de Medición' ||
        art.custodia === 'Equipo Sujeto a Calibración' ||
        art.clasificacionCustodia === 'Equipo Sujeto a Calibración / Mantenimiento'
      ) {
        const series = art.seriesRegistradas && art.seriesRegistradas.length > 0
          ? art.seriesRegistradas
          : [`SN-${art.sku}-001`];

        series.forEach((sn) => {
          const fechaVenc = art.calibracionVencimiento || '2027-02-15';
          const fechaVencDate = new Date(fechaVenc);
          const diffMs = fechaVencDate.getTime() - hoy.getTime();
          const diasParaVencimiento = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          let estatusCalibracion: 'Vigente' | 'Próximo a Vencer' | 'Vencido' = 'Vigente';
          if (diasParaVencimiento <= 0) {
            estatusCalibracion = 'Vencido';
          } else if (diasParaVencimiento <= 30) {
            estatusCalibracion = 'Próximo a Vencer';
          }

          items.push({
            id: `calib-${art.sku}-${sn}`,
            sku: art.sku,
            nombreEquipo: art.descripcionCorta || art.nombre,
            marca: art.marca,
            modelo: art.modelo,
            numeroSerie: sn,
            ubicacionActual: art.stockProyecto > 0 ? 'En Frente de Obra' : 'Almacén Principal',
            custodiaResponsable: art.stockProyecto > 0 ? 'Residencia de Obra' : 'Bodega Central',
            fechaUltimaCalibracion: '2026-02-15',
            fechaVencimientoCalibracion: fechaVenc,
            diasParaVencimiento,
            estatusCalibracion,
            bloqueadoParaSalida: diasParaVencimiento <= 0,
            certificadoPdfUrl: `/certificados/${art.sku}-${sn}.pdf`,
          });
        });
      }
    });

    return items;
  }, [state.articulos]);

  const validarSerieUnica = (serie: string, excludeSku?: string): { valida: boolean; mensaje?: string } => {
    const serieNorm = serie.trim().toUpperCase();
    if (!serieNorm) return { valida: false, mensaje: 'El número de serie no puede estar vacío.' };

    for (const art of state.articulos) {
      if (excludeSku && art.sku.toLowerCase() === excludeSku.toLowerCase()) continue;
      if (art.seriesRegistradas && art.seriesRegistradas.some((s) => s.toUpperCase() === serieNorm)) {
        return {
          valida: false,
          mensaje: `El número de serie "${serieNorm}" ya está registrado en el artículo ${art.sku} (${art.descripcionCorta}). No se permiten duplicados.`,
        };
      }
    }
    return { valida: true };
  };

  const registrarArticulo = (art: Articulo) => {
    dispatch({ type: 'REGISTRAR_ARTICULO', payload: art });
    void fetch('/api/admin/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo: 'almacen',
        tipoEvento: 'creacion',
        entidad: 'Producto / Artículo de Almacén',
        entidadId: art.sku,
        detalle: `Alta de nuevo producto en almacén: ${art.sku} - ${art.descripcionCorta || art.nombre}`,
      }),
    }).catch(() => {});
  };

  const actualizarArticulo = (art: Articulo) => {
    dispatch({ type: 'ACTUALIZAR_ARTICULO', payload: art });
    void fetch('/api/admin/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo: 'almacen',
        tipoEvento: 'actualizacion',
        entidad: 'Producto / Artículo de Almacén',
        entidadId: art.sku,
        detalle: `Actualización de datos técnicos del producto: ${art.sku} - ${art.descripcionCorta || art.nombre}`,
      }),
    }).catch(() => {});
  };

  const toggleEstatusArticulo = (
    sku: string,
    nuevoEstatus: 'Activo' | 'Inactivo',
    usuario: string,
    motivo?: string
  ) => {
    dispatch({
      type: 'TOGGLE_ESTATUS_ARTICULO',
      payload: { sku, nuevoEstatus, usuario, motivo },
    });
  };

  const crearRecepcionIR03 = (rec: RecepcionIR03Documento) => {
    dispatch({ type: 'CREAR_RECEPCION_IR03', payload: rec });
  };

  const eliminarRecepcionIR03 = (folio: string, motivoAuditoria: string, usuario: string) => {
    dispatch({
      type: 'ELIMINAR_RECEPCION_IR03',
      payload: { folio, motivoAuditoria, usuario },
    });
  };

  const crearValeSalidaSA = (vale: ValeSalidaSA) => {
    dispatch({ type: 'CREAR_VALE_SALIDA_SA', payload: vale });
  };

  const registrarDevolucion = (dev: DevolucionAlmacen) => {
    dispatch({ type: 'REGISTRAR_DEVOLUCION', payload: dev });
  };

  const enviarAMantenimiento = (mant: MantenimientoArticulo) => {
    dispatch({ type: 'ENVIAR_A_MANTENIMIENTO', payload: mant });
    void fetch('/api/almacen/mantenimiento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mant),
    }).catch(() => {});
  };

  const completarMantenimientoReingreso = (
    id: string,
    fechaRetornoReal: string,
    costoMantenimiento: number,
    observacionesResolucion: string,
    usuario: string,
    extra?: {
      trabajoRealizado?: string;
      refaccionesUsadas?: string;
      estatusResultante?: 'Al día' | 'Requiere seguimiento' | 'Baja Definitiva';
      adjuntos?: AdjuntoMantenimiento[];
    }
  ) => {
    dispatch({
      type: 'COMPLETAR_MANTENIMIENTO_REINGRESO',
      payload: {
        id,
        fechaRetornoReal,
        costoMantenimiento,
        observacionesResolucion,
        usuario,
        ...extra,
      },
    });
    void fetch('/api/almacen/mantenimiento', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        fechaRetornoReal,
        costoMantenimiento,
        observacionesResolucion,
        trabajoRealizado: extra?.trabajoRealizado ?? '',
        refaccionesUsadas: extra?.refaccionesUsadas ?? '',
        estatusResultante: extra?.estatusResultante ?? 'Al día',
        adjuntos: extra?.adjuntos,
      }),
    }).catch(() => {});
  };

  const reprogramarMantenimiento = (id: string, nuevaFecha: string, usuario: string) => {
    dispatch({ type: 'REPROGRAMAR_MANTENIMIENTO', payload: { id, nuevaFecha, usuario } });
  };

  const darDeBajaMantenimiento = (id: string, motivo: string, usuario: string) => {
    dispatch({
      type: 'DAR_DE_BAJA_MANTENIMIENTO',
      payload: { id, motivo, usuario },
    });
  };

  const mostrarToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    dispatch({ type: 'SET_TOAST', payload: { message, type } });
  };

  const cerrarToast = () => {
    dispatch({ type: 'CLEAR_TOAST' });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_TOAST' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  return (
    <AlmacenContext.Provider
      value={{
        articulos: state.articulos,
        articulosActivos,
        recepciones: state.recepciones,
        valesSalida: state.valesSalida,
        devoluciones: state.devoluciones,
        mantenimientos: state.mantenimientos,
        bitacoraMantenimiento: state.bitacoraMantenimiento,
        movimientos: state.movimientos,
        bitacora: state.bitacora,
        monitorCalibracion,
        toast: state.toast,
        registrarArticulo,
        actualizarArticulo,
        toggleEstatusArticulo,
        validarSerieUnica,
        crearRecepcionIR03,
        eliminarRecepcionIR03,
        crearValeSalidaSA,
        registrarDevolucion,
        enviarAMantenimiento,
        completarMantenimientoReingreso,
        reprogramarMantenimiento,
        darDeBajaMantenimiento,
        mostrarToast,
        cerrarToast,
      }}
    >
      {children}
    </AlmacenContext.Provider>
  );
};

export const useAlmacen = () => {
  const context = useContext(AlmacenContext);
  if (!context) {
    throw new Error('useAlmacen debe ser utilizado dentro de un AlmacenProvider');
  }
  return context;
};

