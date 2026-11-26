'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  OrdenCompra,
  Proveedor,
  FacturaProveedor,
  DocumentoAdjunto,
  StickyNote,
  RegistroAuditoria,
  MonedaDivisa,
  EstatusOrdenCompra,
} from '../types';
import type { FacturaData } from '../services/facturas';
import { ORDENES_COMPRA_INICIALES, PROVEEDORES_INICIALES } from '../data/mock-data';

interface ComprasState {
  ordenes: OrdenCompra[];
  proveedores: Proveedor[];
  facturas: FacturaData[];
  repositorioArchivos: Array<{
    id: string;
    nombre: string;
    folioReferencia: string;
    fechaSubida: string;
    tamanoKb: number;
    tipoMime: string;
    url: string;
  }>;
  bitacora: RegistroAuditoria[];
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
}

type ComprasAction =
  | { type: 'CARGAR_ESTADO_INICIAL'; payload: Partial<ComprasState> }
  | { type: 'GUARDAR_FACTURA'; payload: FacturaData }
  | { type: 'ANULAR_FACTURA'; payload: { facturaId: string; ocId: string } }
  | { type: 'ACTUALIZAR_ORDEN'; payload: OrdenCompra }
  | { type: 'AGREGAR_ORDEN'; payload: OrdenCompra }
  | { type: 'CAMBIAR_MONEDA_ORDEN'; payload: { folioPO: string; nuevaMoneda: MonedaDivisa; nuevoTipoCambio?: number; usuario: string } }
  | { type: 'CAMBIAR_ESTATUS_ORDEN'; payload: { folioPO: string; nuevoEstatus: EstatusOrdenCompra; motivo?: string; usuario: string } }
  | { type: 'REGISTRAR_COMPROBANTE_PAGO'; payload: { folioPO: string; facturaFolio?: string; comprobanteNombre: string; comprobanteUrl: string; monto: number; usuario: string } }
  | { type: 'AGREGAR_STICKY_NOTE'; payload: { folioPO: string; note: Omit<StickyNote, 'id' | 'fechaHora' | 'enterado'> } }
  | { type: 'MARCAR_STICKY_ENTERADO'; payload: { folioPO: string; noteId: string; usuario: string } }
  | { type: 'GUARDAR_PROVEEDOR'; payload: { proveedor: Proveedor; usuario: string; notificarAdmin?: boolean } }
  | { type: 'INACTIVAR_PROVEEDOR'; payload: { proveedorId: string; motivo: string; usuario: string } }
  | { type: 'VINCULAR_ARCHIVO_REPOSITORIO'; payload: { folioPO: string; archivoId: string } }
  | { type: 'SET_TOAST'; payload: { message: string; type: 'success' | 'info' | 'warning' | 'error' } }
  | { type: 'CLEAR_TOAST' };

const STORAGE_KEY_COMPRAS_STORE = 'sifygsa_compras_suite_store_v2';

const FACTURAS_DEMO_INICIALES: FacturaData[] = [
  {
    id: 'fac-po10926-demo',
    ocId: 'PO-2026-0173',
    uuid: '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
    folio: 'FAC-2026-8910',
    proveedor: 'Five Peaks México SA de CV',
    rfcEmisor: 'FPM130918MPA',
    rfcReceptor: 'SFG180425ABC',
    fechaEmision: '2026-10-27',
    fechaVencimiento: '2026-11-26',
    moneda: 'MXN',
    tipoCambio: 1.0,
    subtotal: 3550.0,
    iva: 568.0,
    total: 4118.0,
    conceptos: [
      {
        descripcion:
          'Servicio de baño portátil para Tenaris Tamsa - Ref: SFG-C259-LVT-RQ-127/26',
        cantidad: 1,
        unidad: 'Servicio',
        valorUnitario: 3550.0,
        importe: 3550.0,
        claveProdServ: '76111500',
        noIdentificacion: 'SRV-SAN-001',
      },
    ],
    xmlNombre: 'FAC_FPM130918MPA_PO0173.xml',
    pdfNombre: 'FAC_FPM130918MPA_PO0173.pdf',
    estado: 'abierta',
    regimenEmisor: '601',
    usoCfdi: 'G03',
    notaCondiciones: 'PO-2026-0173 - Crédito 30 días',
    subsidiaria: 'SIFYGSA Fire & Gas S.A. de C.V.',
    periodoContable: 'nov 2026',
    adReqContrato: 'SFG-C259-LVT-RQ-127/26',
    reqContrato: 'SFG-C259-LVT-RQ-127/26',
    noOrdenCompra: 'PO-2026-0173',
    estadoAprobacion: 'Aprobado',
    tipoOperacion: 'Prestación de Servicios Profesionales',
    autocompletadoDesdeXml: true,
  },
];

const REPOSITORIO_ARCHIVOS_INICIAL = [
  {
    id: 'repo-001',
    nombre: 'FAC_FPM130918MPA_PO0173.pdf',
    folioReferencia: 'FAC-2026-8910',
    fechaSubida: '2026-11-10',
    tamanoKb: 345,
    tipoMime: 'application/pdf',
    url: '/documentos/FAC_FPM130918MPA_PO0173.pdf',
  },
  {
    id: 'repo-002',
    nombre: 'COMPROBANTE_PAGO_BBVA_PO0173.pdf',
    folioReferencia: 'PO-2026-0173',
    fechaSubida: '2026-11-12',
    tamanoKb: 182,
    tipoMime: 'application/pdf',
    url: '/documentos/COMPROBANTE_PAGO_BBVA_PO0173.pdf',
  },
  {
    id: 'repo-003',
    nombre: 'CSF_FIVE_PEAKS_2026.pdf',
    folioReferencia: 'PRV-00105',
    fechaSubida: '2026-03-01',
    tamanoKb: 512,
    tipoMime: 'application/pdf',
    url: '/documentos/CSF_FIVE_PEAKS_2026.pdf',
  },
];

// Enriquecer proveedores con historial financiero y cuentas bancarias
const PROVEEDORES_COMPLETOS: Proveedor[] = PROVEEDORES_INICIALES.map((prv) => ({
  ...prv,
  moneda: prv.moneda as MonedaDivisa,
  monedaPrincipal: prv.moneda as MonedaDivisa,
  monedasSecundarias: prv.moneda === 'MXN' ? ['USD'] : ['MXN'],
  cuentasBancarias: prv.cuentasBancarias || [
    {
      id: `cta-${prv.id}-1`,
      banco: prv.banco || 'BBVA México',
      cuenta: prv.cuenta || '0123456789',
      clabe: prv.clabe || '012905001234567890',
      titular: prv.razonSocial,
      moneda: prv.moneda as MonedaDivisa,
      esPrincipal: true,
      estatus: 'activa',
    },
  ],
  facturasHistorial: prv.facturasHistorial || (prv.id === 'PRV-00105' ? [
    {
      id: 'f-hist-1',
      folio: 'FAC-2026-8910',
      uuidFiscal: '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
      ordenCompraFolio: 'PO-2026-0173',
      fechaEmision: '2026-10-27',
      fechaVencimiento: '2026-11-26',
      condicionPago: 'credito_30',
      montoTotal: 4118.0,
      moneda: 'MXN',
      estatus: 'abierta',
    },
    {
      id: 'f-hist-2',
      folio: 'FAC-2026-7812',
      uuidFiscal: '91BC3310-819A-40F1-AA72-91823901BF88',
      ordenCompraFolio: 'PO-2026-0155',
      fechaEmision: '2026-09-15',
      fechaVencimiento: '2026-10-15',
      condicionPago: 'credito_30',
      montoTotal: 7250.0,
      moneda: 'MXN',
      estatus: 'pagada',
      comprobantePagoUrl: '/comprobantes/SPEI-BBVA-9182.pdf',
      comprobantePagoNombre: 'SPEI-BBVA-9182.pdf',
    },
  ] : []),
}));

// Enriquecer órdenes de compra iniciales con las nuevas reglas
const ORDENES_COMPLETAS: OrdenCompra[] = ORDENES_COMPRA_INICIALES.map((oc) => ({
  ...oc,
  tipoOrden: (oc as any).tipoOrden || (oc.folio === 'PO-2026-0173' ? 'normal' : 'directa'),
  contratoProyecto: (oc as any).contratoProyecto || 'SFG-C259-TAM (Tenaris Tamsa)',
  subsidiaria: oc.subsidiaria || 'SIFYGSA Fire & Gas S.A. de C.V.',
  moneda: oc.moneda as MonedaDivisa,
  estatus: (oc.estatus as any) === 'abierta' ? 'aprobada_supervisor' : oc.estatus,
  compradorId: (oc as any).compradorId || 'USR-COMP-01',
  compradorNombre: (oc as any).compradorNombre || 'Lic. Mariana Valdez (Compradora Senior)',
  precioUnitarioEstimado: (oc as any).tipoOrden === 'directa',
  referenciaServicioExtraordinario: (oc as any).referenciaServicioExtraordinario || 'Lote de tubería y fletes urgentes para frente de obra',
  notasSticky: (oc as any).notasSticky || [
    {
      id: 'note-01',
      texto: 'Recordatorio: Solicitar el CFDI 4.0 con el desglose de IVA y retención 4% fletes si incluye transporte.',
      autor: 'Lic. Mariana Valdez',
      rolAutor: 'Compradora Senior',
      dirigidaA: '@administracion',
      esPublica: true,
      fechaHora: '10/11/2026 09:30',
      color: 'amarilla',
      enterado: true,
      enteradoPor: 'Carlos Mendoza',
      fechaEnterado: '10/11/2026 10:15',
    },
  ],
  comprobantePagoUrl: (oc as any).comprobantePagoUrl || '/documentos/COMPROBANTE_PAGO_BBVA_PO0173.pdf',
  comprobantePagoNombre: (oc as any).comprobantePagoNombre || 'COMPROBANTE_PAGO_BBVA_PO0173.pdf',
  comprobantePagoFecha: (oc as any).comprobantePagoFecha || '2026-11-12',
  comprobantePagoMonto: (oc as any).comprobantePagoMonto || 4118.0,
  recepcionesIR03: (oc as any).recepcionesIR03 || [
    {
      id: 'rec-01',
      folioIR03: 'IR03-2024-0089',
      fechaRecepcion: '2026-11-12',
      cantidadRecibida: 8,
      totalPartidas: 10,
      estatus: 'Parcial',
      almacenista: 'Mateo Gómez',
    },
  ],
}));

function comprasReducer(state: ComprasState, action: ComprasAction): ComprasState {
  switch (action.type) {
    case 'CARGAR_ESTADO_INICIAL':
      return {
        ...state,
        ...action.payload,
      };

    case 'GUARDAR_FACTURA': {
      const factura = action.payload;
      const facturasSin = state.facturas.filter(
        (f) => f.id !== factura.id && f.uuid !== factura.uuid
      );
      const facturasNuevas = [factura, ...facturasSin];

      // Actualizar Orden de Compra asociada al flujo: 'orden_completa_factura_abierta'
      const ordenesActualizadas = state.ordenes.map((oc) => {
        if (
          oc.folio.toLowerCase() === factura.ocId.toLowerCase() ||
          oc.id.toLowerCase() === factura.ocId.toLowerCase()
        ) {
          const facturaProveedorItem: FacturaProveedor = {
            id: factura.id,
            folio: factura.folio,
            uuidFiscal: factura.uuid,
            ordenCompraId: oc.id,
            ordenCompraFolio: oc.folio,
            proveedorId: oc.proveedorId,
            proveedorNombre: factura.proveedor,
            proveedorRfc: factura.rfcEmisor,
            fechaEmision: factura.fechaEmision,
            fechaVencimiento: factura.fechaVencimiento,
            moneda: factura.moneda as MonedaDivisa,
            tipoCambio: factura.tipoCambio,
            subtotal: factura.subtotal,
            iva: factura.iva,
            total: factura.total,
            estatus: 'abierta',
            xmlArchivo: factura.xmlNombre,
            pdfArchivo: factura.pdfNombre,
          };

          const facturasAdjuntasPrevias = oc.facturasAdjuntas || [];
          const facturasAdjuntas = [
            facturaProveedorItem,
            ...facturasAdjuntasPrevias.filter((f) => f.folio !== factura.folio),
          ];

          const montoFacturadoTotal = facturasAdjuntas.reduce((acc, f) => acc + f.total, 0);

          return {
            ...oc,
            tieneFactura: true,
            facturaId: factura.id,
            facturaFolio: factura.folio,
            facturaUuid: factura.uuid,
            facturasAdjuntas,
            montoFacturadoTotal,
            montoPendienteFacturar: Math.max(0, oc.total - montoFacturadoTotal),
            estatus: 'orden_completa_factura_abierta' as const,
          };
        }
        return oc;
      });

      return {
        ...state,
        facturas: facturasNuevas,
        ordenes: ordenesActualizadas,
        toast: {
          message: `Factura ${factura.folio} asociada exitosamente a la orden ${factura.ocId}. Estado: Orden Completa / Factura Abierta.`,
          type: 'success',
        },
      };
    }

    case 'ANULAR_FACTURA': {
      const { facturaId, ocId } = action.payload;
      const facturasActualizadas = state.facturas.map((f) => {
        if (f.id === facturaId || f.folio === facturaId) {
          return { ...f, estado: 'cancelada' as const };
        }
        return f;
      });

      const ordenesActualizadas = state.ordenes.map((oc) => {
        if (
          oc.folio.toLowerCase() === ocId.toLowerCase() ||
          oc.id.toLowerCase() === ocId.toLowerCase()
        ) {
          return {
            ...oc,
            tieneFactura: false,
            facturaId: undefined,
            facturaFolio: undefined,
            facturaUuid: undefined,
            estatus: 'aprobada_supervisor' as const,
          };
        }
        return oc;
      });

      return {
        ...state,
        facturas: facturasActualizadas,
        ordenes: ordenesActualizadas,
        toast: {
          message: `Factura anulada y desvinculada de la orden ${ocId}.`,
          type: 'info',
        },
      };
    }

    case 'ACTUALIZAR_ORDEN': {
      const orden = action.payload;
      const ordenes = state.ordenes.map((o) => (o.id === orden.id || o.folio === orden.folio ? orden : o));
      return {
        ...state,
        ordenes,
      };
    }

    case 'AGREGAR_ORDEN': {
      const orden = action.payload;
      const existe = state.ordenes.some((o) => o.id === orden.id || o.folio === orden.folio);
      const ordenes = existe
        ? state.ordenes.map((o) => (o.id === orden.id || o.folio === orden.folio ? orden : o))
        : [orden, ...state.ordenes];
      return {
        ...state,
        ordenes,
        toast: {
          message: `Orden de Compra ${orden.folio} (${orden.tipoOrden === 'directa' ? 'Directa' : 'Normal'}) emitida correctamente.`,
          type: 'success',
        },
      };
    }

    case 'CAMBIAR_MONEDA_ORDEN': {
      const { folioPO, nuevaMoneda, nuevoTipoCambio, usuario } = action.payload;
      const orden = state.ordenes.find((o) => o.folio === folioPO || o.id === folioPO);
      if (!orden) return state;

      const tc = nuevoTipoCambio || (nuevaMoneda === 'USD' ? 18.5 : nuevaMoneda === 'EUR' ? 20.1 : 1.0);
      const ordenes = state.ordenes.map((o) => {
        if (o.folio === folioPO || o.id === folioPO) {
          return {
            ...o,
            moneda: nuevaMoneda,
            tipoCambio: tc,
          };
        }
        return o;
      });

      const nuevoLog: RegistroAuditoria = {
        id: `aud-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        modulo: 'compras',
        folioDocumento: folioPO,
        accion: 'edicion',
        campoModificado: 'Moneda / Divisa de la Orden',
        valorAnterior: orden.moneda,
        valorNuevo: `${nuevaMoneda} (TC: ${tc})`,
        motivo: 'Ajuste comercial autorizado por cotización de proveedor en divisa alterna.',
      };

      return {
        ...state,
        ordenes,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Moneda de la orden ${folioPO} actualizada a ${nuevaMoneda} sin anular el flujo anterior.`,
          type: 'success',
        },
      };
    }

    case 'CAMBIAR_ESTATUS_ORDEN': {
      const { folioPO, nuevoEstatus, motivo, usuario } = action.payload;
      const orden = state.ordenes.find((o) => o.folio === folioPO || o.id === folioPO);
      if (!orden) return state;

      const ordenes = state.ordenes.map((o) =>
        o.folio === folioPO || o.id === folioPO ? { ...o, estatus: nuevoEstatus } : o
      );

      const nuevoLog: RegistroAuditoria = {
        id: `aud-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        modulo: 'compras',
        folioDocumento: folioPO,
        accion: 'edicion',
        campoModificado: 'Estatus de Orden de Compra',
        valorAnterior: orden.estatus,
        valorNuevo: nuevoEstatus,
        motivo,
      };

      return {
        ...state,
        ordenes,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Orden ${folioPO} actualizada a: ${nuevoEstatus}.`,
          type: 'info',
        },
      };
    }

    case 'REGISTRAR_COMPROBANTE_PAGO': {
      const { folioPO, facturaFolio, comprobanteNombre, comprobanteUrl, monto, usuario } = action.payload;
      const fecha = new Date().toISOString().slice(0, 10);

      const ordenes = state.ordenes.map((o) => {
        if (o.folio === folioPO || o.id === folioPO) {
          return {
            ...o,
            estatus: 'cerrada_factura_pagada' as const,
            comprobantePagoUrl: comprobanteUrl,
            comprobantePagoNombre: comprobanteNombre,
            comprobantePagoFecha: fecha,
            comprobantePagoMonto: monto,
          };
        }
        return o;
      });

      // Actualizar también en el historial del proveedor
      const orden = state.ordenes.find((o) => o.folio === folioPO || o.id === folioPO);
      const proveedores = state.proveedores.map((prv) => {
        if (orden && prv.id === orden.proveedorId) {
          const historial = (prv.facturasHistorial || []).map((fh) => {
            if (fh.ordenCompraFolio === folioPO || (facturaFolio && fh.folio === facturaFolio)) {
              return {
                ...fh,
                estatus: 'pagada' as const,
                comprobantePagoUrl: comprobanteUrl,
                comprobantePagoNombre: comprobanteNombre,
              };
            }
            return fh;
          });
          return { ...prv, facturasHistorial: historial };
        }
        return prv;
      });

      const nuevoLog: RegistroAuditoria = {
        id: `aud-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        modulo: 'compras',
        folioDocumento: folioPO,
        accion: 'pago',
        campoModificado: 'Comprobante de Pago Subido por Administración',
        valorAnterior: 'Pendiente de Pago',
        valorNuevo: `Cerrada / Pagada (${comprobanteNombre})`,
        motivo: `Dispersión bancaria registrada. Monto: $${monto.toLocaleString('es-MX')}`,
      };

      return {
        ...state,
        ordenes,
        proveedores,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Comprobante de pago registrado. Orden ${folioPO} pasa a estado Cerrada / Factura Pagada.`,
          type: 'success',
        },
      };
    }

    case 'AGREGAR_STICKY_NOTE': {
      const { folioPO, note } = action.payload;
      const nuevaNota: StickyNote = {
        ...note,
        id: `sn-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
        enterado: false,
      };

      const ordenes = state.ordenes.map((o) => {
        if (o.folio === folioPO || o.id === folioPO) {
          return {
            ...o,
            notasSticky: [nuevaNota, ...(o.notasSticky || [])],
          };
        }
        return o;
      });

      return {
        ...state,
        ordenes,
        toast: {
          message: `Nota interna agregada a la orden ${folioPO}.`,
          type: 'info',
        },
      };
    }

    case 'MARCAR_STICKY_ENTERADO': {
      const { folioPO, noteId, usuario } = action.payload;
      const fechaEnterado = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

      const ordenes = state.ordenes.map((o) => {
        if (o.folio === folioPO || o.id === folioPO) {
          const notasActualizadas = (o.notasSticky || []).map((n) =>
            n.id === noteId
              ? { ...n, enterado: true, enteradoPor: usuario, fechaEnterado }
              : n
          );
          return {
            ...o,
            notasSticky: notasActualizadas,
          };
        }
        return o;
      });

      return {
        ...state,
        ordenes,
        toast: {
          message: `Nota marcada como enterada por ${usuario}.`,
          type: 'success',
        },
      };
    }

    case 'GUARDAR_PROVEEDOR': {
      const { proveedor, usuario, notificarAdmin } = action.payload;
      const existe = state.proveedores.some(
        (p) => p.id === proveedor.id || p.rfc.toLowerCase() === proveedor.rfc.toLowerCase()
      );

      // Si existe, verificar que el RFC no haya cambiado
      if (existe) {
        const provActual = state.proveedores.find((p) => p.id === proveedor.id);
        if (provActual && provActual.rfc.toUpperCase() !== proveedor.rfc.toUpperCase()) {
          return {
            ...state,
            toast: {
              message: `El RFC no puede ser modificado. Para cambiar RFC o Razón Social, inhabilite al proveedor actual y cree uno nuevo.`,
              type: 'error',
            },
          };
        }
      }

      const proveedores = existe
        ? state.proveedores.map((p) => (p.id === proveedor.id ? proveedor : p))
        : [proveedor, ...state.proveedores];

      const nuevoLog: RegistroAuditoria = {
        id: `aud-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        modulo: 'compras',
        folioDocumento: proveedor.rfc,
        accion: existe ? 'edicion' : 'creacion',
        campoModificado: 'Expediente Proveedor',
        valorAnterior: existe ? 'Datos previos' : '-',
        valorNuevo: `${proveedor.razonSocial} (${proveedor.rfc})`,
        motivo: notificarAdmin ? 'Notificación enviada a Administración con expediente adjunto.' : 'Alta/Edición directa',
      };

      return {
        ...state,
        proveedores,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: notificarAdmin
            ? `Proveedor ${proveedor.razonSocial} guardado y expediente enviado a Administración.`
            : `Proveedor ${proveedor.razonSocial} guardado exitosamente.`,
          type: 'success',
        },
      };
    }

    case 'INACTIVAR_PROVEEDOR': {
      const { proveedorId, motivo, usuario } = action.payload;
      const prov = state.proveedores.find((p) => p.id === proveedorId);
      if (!prov) return state;

      // Candado de validación: No inhabilitar si tiene POs abiertas o pendientes de pago
      const ordenesPendientes = state.ordenes.filter(
        (o) =>
          o.proveedorId === proveedorId &&
          (o.estatus === 'pendiente_aprobacion' ||
            o.estatus === 'aprobada_supervisor' ||
            o.estatus === 'orden_completa_factura_abierta' ||
            o.estatus === 'abierta' ||
            o.estatus === 'pendiente' ||
            o.estatus === 'transito')
      );

      if (ordenesPendientes.length > 0) {
        return {
          ...state,
          toast: {
            message: `No se puede inhabilitar a ${prov.razonSocial}. Tiene ${ordenesPendientes.length} órdenes de compra abiertas o pendientes de pago (ej. ${ordenesPendientes[0].folio}).`,
            type: 'error',
          },
        };
      }

      const proveedores = state.proveedores.map((p) =>
        p.id === proveedorId ? { ...p, estatus: 'inactivo' as const } : p
      );

      const nuevoLog: RegistroAuditoria = {
        id: `aud-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-MX'),
        usuario,
        modulo: 'compras',
        folioDocumento: prov.rfc,
        accion: 'inhabilitacion',
        campoModificado: 'Estatus Proveedor',
        valorAnterior: prov.estatus,
        valorNuevo: 'inactivo',
        motivo,
      };

      return {
        ...state,
        proveedores,
        bitacora: [nuevoLog, ...state.bitacora],
        toast: {
          message: `Proveedor ${prov.razonSocial} inhabilitado correctamente.`,
          type: 'warning',
        },
      };
    }

    case 'VINCULAR_ARCHIVO_REPOSITORIO': {
      const { folioPO, archivoId } = action.payload;
      const archivo = state.repositorioArchivos.find((a) => a.id === archivoId);
      if (!archivo) return state;

      const ordenes = state.ordenes.map((o) => {
        if (o.folio === folioPO || o.id === folioPO) {
          const adjuntoItem: DocumentoAdjunto = {
            id: archivo.id,
            nombre: archivo.nombre,
            tamano: archivo.tamanoKb * 1024,
            tipo: archivo.tipoMime,
            url: archivo.url,
            fechaSubida: archivo.fechaSubida,
            folioReferencia: archivo.folioReferencia,
          };
          return {
            ...o,
            facturaFolio: archivo.folioReferencia,
            tieneFactura: true,
            facturasAdjuntas: [
              ...(o.facturasAdjuntas || []),
              {
                id: `fac-${Date.now()}`,
                folio: archivo.folioReferencia || `FAC-REPO-${archivo.id}`,
                uuidFiscal: 'VINCULADO-DESDE-REPOSITORIO',
                ordenCompraId: o.id,
                ordenCompraFolio: o.folio,
                proveedorId: o.proveedorId,
                proveedorNombre: o.proveedorNombre,
                proveedorRfc: o.proveedorRfc,
                fechaEmision: archivo.fechaSubida,
                fechaVencimiento: archivo.fechaSubida,
                moneda: o.moneda,
                subtotal: o.subtotal,
                iva: o.iva,
                total: o.total,
                estatus: 'abierta' as const,
                documentoPrincipal: adjuntoItem,
              },
            ],
          };
        }
        return o;
      });

      return {
        ...state,
        ordenes,
        toast: {
          message: `Archivo "${archivo.nombre}" vinculado a la orden ${folioPO}.`,
          type: 'success',
        },
      };
    }

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

interface ComprasContextType {
  ordenes: OrdenCompra[];
  proveedores: Proveedor[];
  facturas: FacturaData[];
  repositorioArchivos: Array<{
    id: string;
    nombre: string;
    folioReferencia: string;
    fechaSubida: string;
    tamanoKb: number;
    tipoMime: string;
    url: string;
  }>;
  bitacora: RegistroAuditoria[];
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  guardarFactura: (factura: FacturaData) => void;
  anularFactura: (facturaId: string, ocId: string) => void;
  actualizarOrden: (orden: OrdenCompra) => void;
  agregarOrden: (orden: OrdenCompra) => void;
  cambiarMonedaOrden: (folioPO: string, nuevaMoneda: MonedaDivisa, nuevoTipoCambio?: number, usuario?: string) => void;
  cambiarEstatusOrden: (folioPO: string, nuevoEstatus: EstatusOrdenCompra, motivo?: string, usuario?: string) => void;
  registrarComprobantePago: (folioPO: string, comprobanteNombre: string, comprobanteUrl: string, monto: number, facturaFolio?: string, usuario?: string) => void;
  agregarStickyNote: (folioPO: string, note: Omit<StickyNote, 'id' | 'fechaHora' | 'enterado'>) => void;
  marcarStickyEnterado: (folioPO: string, noteId: string, usuario: string) => void;
  guardarProveedor: (proveedor: Proveedor, usuario?: string, notificarAdmin?: boolean) => void;
  inactivarProveedor: (proveedorId: string, motivo: string, usuario?: string) => void;
  vincularArchivoRepositorio: (folioPO: string, archivoId: string) => void;
  mostrarToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  cerrarToast: () => void;
  getFacturaPorOC: (ocId: string) => FacturaData | undefined;
  ocTieneFactura: (ocId: string) => boolean;
  getOrden: (ocId: string) => OrdenCompra | undefined;
  getProveedor: (idOrRfc: string) => Proveedor | undefined;
}

export const ComprasContext = createContext<ComprasContextType | undefined>(undefined);

export const ComprasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(comprasReducer, {
    ordenes: ORDENES_COMPLETAS,
    proveedores: PROVEEDORES_COMPLETOS,
    facturas: FACTURAS_DEMO_INICIALES,
    repositorioArchivos: REPOSITORIO_ARCHIVOS_INICIAL,
    bitacora: [],
    toast: null,
  });

  // Cargar de localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_COMPRAS_STORE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.ordenes)) {
            dispatch({ type: 'CARGAR_ESTADO_INICIAL', payload: parsed });
          }
        }
      } catch (err) {
        console.error('Error al cargar ComprasContext:', err);
      }
    }
  }, []);

  // Persistir a localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY_COMPRAS_STORE,
          JSON.stringify({
            ordenes: state.ordenes,
            proveedores: state.proveedores,
            facturas: state.facturas,
            repositorioArchivos: state.repositorioArchivos,
            bitacora: state.bitacora,
          })
        );
      } catch (err) {
        console.error('Error al persistir ComprasContext:', err);
      }
    }
  }, [state.ordenes, state.proveedores, state.facturas, state.repositorioArchivos, state.bitacora]);

  const guardarFactura = (factura: FacturaData) => {
    dispatch({ type: 'GUARDAR_FACTURA', payload: factura });
  };

  const anularFactura = (facturaId: string, ocId: string) => {
    dispatch({ type: 'ANULAR_FACTURA', payload: { facturaId, ocId } });
  };

  const actualizarOrden = (orden: OrdenCompra) => {
    dispatch({ type: 'ACTUALIZAR_ORDEN', payload: orden });
  };

  const agregarOrden = (orden: OrdenCompra) => {
    dispatch({ type: 'AGREGAR_ORDEN', payload: orden });
  };

  const cambiarMonedaOrden = (folioPO: string, nuevaMoneda: MonedaDivisa, nuevoTipoCambio?: number, usuario = 'Comprador Senior') => {
    dispatch({
      type: 'CAMBIAR_MONEDA_ORDEN',
      payload: { folioPO, nuevaMoneda, nuevoTipoCambio, usuario },
    });
  };

  const cambiarEstatusOrden = (folioPO: string, nuevoEstatus: EstatusOrdenCompra, motivo?: string, usuario = 'Supervisor de Compras') => {
    dispatch({
      type: 'CAMBIAR_ESTATUS_ORDEN',
      payload: { folioPO, nuevoEstatus, motivo, usuario },
    });
  };

  const registrarComprobantePago = (
    folioPO: string,
    comprobanteNombre: string,
    comprobanteUrl: string,
    monto: number,
    facturaFolio?: string,
    usuario = 'Tesorería / Administración'
  ) => {
    dispatch({
      type: 'REGISTRAR_COMPROBANTE_PAGO',
      payload: { folioPO, facturaFolio, comprobanteNombre, comprobanteUrl, monto, usuario },
    });
  };

  const agregarStickyNote = (folioPO: string, note: Omit<StickyNote, 'id' | 'fechaHora' | 'enterado'>) => {
    dispatch({ type: 'AGREGAR_STICKY_NOTE', payload: { folioPO, note } });
  };

  const marcarStickyEnterado = (folioPO: string, noteId: string, usuario: string) => {
    dispatch({ type: 'MARCAR_STICKY_ENTERADO', payload: { folioPO, noteId, usuario } });
  };

  const guardarProveedor = (proveedor: Proveedor, usuario = 'Comprador', notificarAdmin = false) => {
    dispatch({ type: 'GUARDAR_PROVEEDOR', payload: { proveedor, usuario, notificarAdmin } });
  };

  const inactivarProveedor = (proveedorId: string, motivo: string, usuario = 'Gerente de Compras') => {
    dispatch({ type: 'INACTIVAR_PROVEEDOR', payload: { proveedorId, motivo, usuario } });
  };

  const vincularArchivoRepositorio = (folioPO: string, archivoId: string) => {
    dispatch({ type: 'VINCULAR_ARCHIVO_REPOSITORIO', payload: { folioPO, archivoId } });
  };

  const mostrarToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
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

  const getFacturaPorOC = (ocId: string) => {
    return state.facturas.find(
      (f) =>
        f.ocId.toLowerCase() === ocId.toLowerCase() ||
        f.noOrdenCompra?.toLowerCase() === ocId.toLowerCase()
    );
  };

  const ocTieneFactura = (ocId: string) => {
    return state.facturas.some(
      (f) =>
        (f.ocId.toLowerCase() === ocId.toLowerCase() ||
          f.noOrdenCompra?.toLowerCase() === ocId.toLowerCase()) &&
        f.estado !== 'cancelada'
    );
  };

  const getOrden = (ocId: string) => {
    return state.ordenes.find(
      (o) => o.folio.toLowerCase() === ocId.toLowerCase() || o.id.toLowerCase() === ocId.toLowerCase()
    );
  };

  const getProveedor = (idOrRfc: string) => {
    const norm = idOrRfc.trim().toLowerCase();
    return state.proveedores.find(
      (p) => p.id.toLowerCase() === norm || p.rfc.toLowerCase() === norm
    );
  };

  return (
    <ComprasContext.Provider
      value={{
        ordenes: state.ordenes,
        proveedores: state.proveedores,
        facturas: state.facturas,
        repositorioArchivos: state.repositorioArchivos,
        bitacora: state.bitacora,
        toast: state.toast,
        guardarFactura,
        anularFactura,
        actualizarOrden,
        agregarOrden,
        cambiarMonedaOrden,
        cambiarEstatusOrden,
        registrarComprobantePago,
        agregarStickyNote,
        marcarStickyEnterado,
        guardarProveedor,
        inactivarProveedor,
        vincularArchivoRepositorio,
        mostrarToast,
        cerrarToast,
        getFacturaPorOC,
        ocTieneFactura,
        getOrden,
        getProveedor,
      }}
    >
      {children}
    </ComprasContext.Provider>
  );
};

export const useCompras = () => {
  const context = useContext(ComprasContext);
  if (!context) {
    return {
      ordenes: ORDENES_COMPLETAS,
      proveedores: PROVEEDORES_COMPLETOS,
      facturas: FACTURAS_DEMO_INICIALES,
      repositorioArchivos: REPOSITORIO_ARCHIVOS_INICIAL,
      bitacora: [],
      toast: null,
      guardarFactura: () => {},
      anularFactura: () => {},
      actualizarOrden: () => {},
      agregarOrden: () => {},
      cambiarMonedaOrden: () => {},
      cambiarEstatusOrden: () => {},
      registrarComprobantePago: () => {},
      agregarStickyNote: () => {},
      marcarStickyEnterado: () => {},
      guardarProveedor: () => {},
      inactivarProveedor: () => {},
      vincularArchivoRepositorio: () => {},
      mostrarToast: () => {},
      cerrarToast: () => {},
      getFacturaPorOC: () => undefined,
      ocTieneFactura: () => false,
      getOrden: (ocId: string) => ORDENES_COMPLETAS.find((o) => o.folio === ocId || o.id === ocId),
      getProveedor: (idOrRfc: string) => PROVEEDORES_COMPLETOS.find((p) => p.id === idOrRfc || p.rfc === idOrRfc),
    } as unknown as ComprasContextType;
  }
  return context;
};
