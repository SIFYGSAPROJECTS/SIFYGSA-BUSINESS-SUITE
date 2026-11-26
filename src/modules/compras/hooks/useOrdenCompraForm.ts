'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  UBICACIONES_CATALOG,
  SUBSIDIARIAS_CATALOG,
  APROBADORES_CATALOG,
  COMPRADORES_CATALOG,
  MONEDAS_CATALOG,
  PROVEEDORES_OC_CATALOG,
  LUGARES_ENTREGA_CATALOG,
  USOS_CFDI_CATALOG,
  METODOS_PAGO_CATALOG,
  FORMAS_PAGO_CATALOG,
  PARTIDAS_INICIALES_OC,
  type PartidaOrdenForm,
} from '../data/orden-compra-catalog';
import { parseCfdiXml, SAMPLE_CFDI_40_XML } from '../services/facturas';
import type { TipoOrdenCompra } from '../types';

export interface ArchivoAdjuntoOC {
  id: string;
  nombre: string;
  tamanio: string;
  tipo: string;
  fecha: string;
}

export interface FacturaVinculadaForm {
  id: string;
  uuid: string;
  serie?: string;
  folio: string;
  fechaEmision: string;
  rfcEmisor: string;
  proveedor: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  xmlNombre?: string;
  pdfNombre?: string;
  xmlContenido?: string;
  estadoSat: 'Vigente' | 'Pendiente' | 'Cancelado';
  coincidenciaMonto: 'exacta' | 'parcial' | 'diferencia';
  conceptos?: Array<{
    descripcion: string;
    cantidad: number;
    unidad?: string;
    valorUnitario: number;
    importe: number;
    claveProdServ?: string;
    noIdentificacion?: string;
  }>;
}


export interface UseOrdenCompraFormReturn {
  step: number;
  maxSteps: number;
  // Tipo de Orden de Compra
  tipoOrden: TipoOrdenCompra;
  setTipoOrden: (val: TipoOrdenCompra) => void;
  contratoProyecto: string;
  setContratoProyecto: (val: string) => void;
  referenciaServicioExtraordinario: string;
  setReferenciaServicioExtraordinario: (val: string) => void;
  // Step 1
  folioOC: string;
  folioReservado: string;
  fechaEmision: string;
  setFechaEmision: (val: string) => void;
  ubicacion: string;
  setUbicacion: (val: string) => void;
  subsidiaria: string;
  setSubsidiaria: (val: string) => void;
  comprador: string;
  setComprador: (val: string) => void;
  aprobador: string;
  setAprobador: (val: string) => void;
  moneda: string;
  setMoneda: (val: string) => void;
  tipoCambio: string;
  setTipoCambio: (val: string) => void;
  nota: string;
  setNota: (val: string) => void;
  // Step 2
  proveedor: string;
  setProveedor: (val: string, opt?: any) => void;
  rfc: string;
  setRfc: (val: string) => void;
  condicionPago: string;
  setCondicionPago: (val: string) => void;
  fechaEntrega: string;
  setFechaEntrega: (val: string) => void;
  lugarEntrega: string;
  setLugarEntrega: (val: string) => void;
  referenciaCotizacion: string;
  setReferenciaCotizacion: (val: string) => void;
  // Step 3
  items: PartidaOrdenForm[];
  toggleItem: (id: string, on: boolean) => void;
  updateItem: (id: string, patch: Partial<PartidaOrdenForm>) => void;
  deleteItem: (id: string) => void;
  addItem: (item: PartidaOrdenForm) => void;
  // Step 4
  usoCfdi: string;
  setUsoCfdi: (val: string) => void;
  metodoPago: string;
  setMetodoPago: (val: string) => void;
  formaPago: string;
  setFormaPago: (val: string) => void;
  exigirFactura: boolean;
  setExigirFactura: (val: boolean) => void;
  // Facturas Vinculadas (CFDI 4.0)
  facturasVinculadas: FacturaVinculadaForm[];
  vincularFacturaXml: (xmlTexto: string, nombreArchivo?: string) => boolean;
  vincularFacturaDemo: () => void;
  desvincularFactura: (id: string) => void;
  adjuntarPdfFactura: (facturaId: string, file: File) => void;
  // Archivos Adjuntos / Expediente
  archivos: ArchivoAdjuntoOC[];
  agregarArchivos: (archivosNuevos: FileList | File[]) => void;
  eliminarArchivo: (id: string) => void;
  // Calculations
  subtotal: number;
  iva: number;
  retenciones: number;
  total: number;
  includedCount: number;
  totalCount: number;
  // Controls
  goToStep: (n: number) => void;
  nextStep: (onSuccessEmit?: () => void) => boolean;
  prevStep: () => void;
  saveDraft: () => void;
  autosaveText: string;
  // Toast
  toast: { show: boolean; message: string; type: 'success' | 'error' | 'info'; icon?: string };
  showToast: (msg: string, type?: 'success' | 'error' | 'info', icon?: string) => void;
  hideToast: () => void;
}

export function useOrdenCompraForm(): UseOrdenCompraFormReturn {
  const [step, setStep] = useState(1);
  const maxSteps = 5;

  // Selector de Tipo de Orden: 'normal' vs 'directa'
  const [tipoOrden, setTipoOrdenState] = useState<TipoOrdenCompra>('normal');
  const [contratoProyecto, setContratoProyecto] = useState('SFG-C259-TAM (Tenaris Tamsa)');
  const [referenciaServicioExtraordinario, setReferenciaServicioExtraordinario] = useState(
    'Flete y maniobra urgente para lote de tubería'
  );

  // Step 1
  const [folioOC] = useState('SFG-C259-LVT-OC-127/26');
  const [folioReservado] = useState('P010926');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().slice(0, 10));
  const [ubicacion, setUbicacion] = useState(UBICACIONES_CATALOG[2]);
  const [subsidiaria, setSubsidiaria] = useState(SUBSIDIARIAS_CATALOG[0]);
  const [comprador, setComprador] = useState(COMPRADORES_CATALOG[0]);
  const [aprobador, setAprobador] = useState(APROBADORES_CATALOG[0]);
  const [moneda, setMoneda] = useState(MONEDAS_CATALOG[0]);
  const [tipoCambio, setTipoCambio] = useState('1.0000');
  const [nota, setNota] = useState(
    'P010926 - Condiciones de pago: crédito 30 días - Servicio de baño portátil para Tenaris Tamsa.'
  );

  // Step 2
  const [proveedor, setProveedorState] = useState(PROVEEDORES_OC_CATALOG[0].v);
  const [rfc, setRfc] = useState(PROVEEDORES_OC_CATALOG[0].rfc);
  const [condicionPago, setCondicionPago] = useState(PROVEEDORES_OC_CATALOG[0].pay);
  const [fechaEntrega, setFechaEntrega] = useState('2026-11-30');
  const [lugarEntrega, setLugarEntrega] = useState(LUGARES_ENTREGA_CATALOG[0]);
  const [referenciaCotizacion, setReferenciaCotizacion] = useState('Cotización técnica vigente');

  // Step 3: Partidas
  const [items, setItems] = useState<PartidaOrdenForm[]>(() =>
    PARTIDAS_INICIALES_OC.map((p) => ({ ...p }))
  );

  // Step 4
  const [usoCfdi, setUsoCfdi] = useState(USOS_CFDI_CATALOG[1]); // G03
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO_CATALOG[0]); // PPD
  const [formaPago, setFormaPago] = useState(FORMAS_PAGO_CATALOG[0]); // 03
  const [exigirFactura, setExigirFactura] = useState(true);

  // Facturas Vinculadas (CFDI 4.0)
  const [facturasVinculadas, setFacturasVinculadas] = useState<FacturaVinculadaForm[]>([]);

  // Archivos Adjuntos / Expediente de la OC
  const [archivos, setArchivos] = useState<ArchivoAdjuntoOC[]>([
    {
      id: 'doc-cotiz-01',
      nombre: 'Cotizacion_FivePeaks_Nov2026.pdf',
      tamanio: '1.4 MB',
      tipo: 'PDF',
      fecha: new Date().toISOString().slice(0, 10),
    },
  ]);

  // Indicator
  const [autosaveText, setAutosaveText] = useState('Guardado hace 1s');

  // Toast
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    icon?: string;
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info', icon?: string) => {
      setToast({ show: true, message, type, icon });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Al cambiar tipo de orden, hereda automáticamente o habilita campos libres
  const setTipoOrden = useCallback((tipo: TipoOrdenCompra) => {
    setTipoOrdenState(tipo);
    if (tipo === 'normal') {
      setContratoProyecto('SFG-C259-TAM (Tenaris Tamsa)');
      setUbicacion(UBICACIONES_CATALOG[2]);
      setItems((prev) =>
        prev.map((i) => ({
          ...i,
          esEstimado: false,
          maxCantidad: i.maxCantidad || i.q,
        }))
      );
    } else {
      // Directa
      setItems((prev) =>
        prev.map((i) => ({
          ...i,
          esEstimado: true,
          maxCantidad: undefined, // Sin tope rígido
        }))
      );
    }
  }, []);

  // Handlers para items
  const toggleItem = useCallback((id: string, on: boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, on } : item)));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PartidaOrdenForm>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast('Partida eliminada de la orden.', 'info', 'delete');
    },
    [showToast]
  );

  const addItem = useCallback((item: PartidaOrdenForm) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const setProveedor = useCallback((val: string, opt?: any) => {
    setProveedorState(val);
    if (opt?.rfc) setRfc(opt.rfc);
    if (opt?.pay) setCondicionPago(opt.pay);
  }, []);

  // Handlers para archivos adjuntos
  const agregarArchivos = useCallback((nuevos: FileList | File[]) => {
    const list = Array.from(nuevos);
    if (list.length === 0) return;

    const itemsToAdd: ArchivoAdjuntoOC[] = list.map((f, idx) => {
      const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      const sizeStr = f.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(f.size / 1024)} KB`;
      return {
        id: `file-${Date.now()}-${idx}`,
        nombre: f.name,
        tamanio: sizeStr,
        tipo: ext,
        fecha: new Date().toISOString().split('T')[0],
      };
    });

    setArchivos((prev) => [...prev, ...itemsToAdd]);
    showToast(`${list.length} archivo(s) adjuntado(s) exitosamente.`, 'success', 'attach_file');
  }, [showToast]);

  const eliminarArchivo = useCallback((id: string) => {
    setArchivos((prev) => prev.filter((a) => a.id !== id));
    showToast('Archivo eliminado del expediente.', 'info', 'delete');
  }, [showToast]);

  // Cálculos de importes automáticos por Tasa Fiscal de Partida
  const { subtotal, iva, retenciones, total, includedCount, totalCount } = useMemo(() => {
    const included = items.filter((i) => i.on);
    let sub = 0;
    let taxIva = 0;
    let retTotal = 0;

    included.forEach((item) => {
      const itemSub = (item.q || 0) * (item.p || 0);
      sub += itemSub;
      const tasa = item.tasaFiscal || 'IVA_16';

      if (tasa === 'IVA_16') {
        taxIva += itemSub * 0.16;
      } else if (tasa === 'RESICO_1_25') {
        taxIva += itemSub * 0.16;
        retTotal += itemSub * 0.0125; // 1.25% Retención ISR
      } else if (tasa === 'RET_IVA_4') {
        taxIva += itemSub * 0.16;
        retTotal += itemSub * 0.04; // 4% Retención IVA fletes
      } else if (tasa === 'RET_IVA_10_66') {
        taxIva += itemSub * 0.16;
        retTotal += itemSub * 0.1066 + itemSub * 0.10; // Retención IVA 10.66% + ISR 10%
      } else if (tasa === 'EXENTO') {
        // 0%
      }
    });

    const tot = sub + taxIva - retTotal;
    return {
      subtotal: sub,
      iva: taxIva,
      retenciones: retTotal,
      total: tot,
      includedCount: included.length,
      totalCount: items.length,
    };
  }, [items]);

  // Vincular Factura XML CFDI 4.0
  const vincularFacturaXml = useCallback(
    (xmlTexto: string, nombreArchivo = 'factura_cfdi40.xml'): boolean => {
      try {
        const parsed = parseCfdiXml(xmlTexto);
        if (!parsed.uuid && !parsed.folio) {
          showToast('El archivo XML no contiene una estructura CFDI 4.0 válida.', 'error');
          return false;
        }

        const sub = parsed.subtotal || 0;
        const tot = parsed.total || 0;
        const tax = parsed.iva || +(tot - sub).toFixed(2);

        const totalOdc = total;
        let coincidencia: 'exacta' | 'parcial' | 'diferencia' = 'diferencia';
        if (Math.abs(tot - totalOdc) < 0.5) {
          coincidencia = 'exacta';
        } else if (tot <= totalOdc) {
          coincidencia = 'parcial';
        }

        const nuevaFac: FacturaVinculadaForm = {
          id: `fac-${Date.now()}`,
          uuid: parsed.uuid || `4A2B89D1-${Date.now().toString(16).toUpperCase()}`,
          serie: 'FAC',
          folio: parsed.folio || `FAC-${Date.now().toString().slice(-5)}`,
          fechaEmision: parsed.fechaEmision || new Date().toISOString().split('T')[0],
          rfcEmisor: parsed.rfcEmisor || rfc || 'FPM130918MPA',
          proveedor: parsed.proveedor || proveedor || 'FIVE PEAKS MÉXICO SA DE CV',
          subtotal: sub,
          iva: tax,
          total: tot,
          moneda: parsed.moneda || 'MXN',
          xmlNombre: nombreArchivo,
          xmlContenido: xmlTexto,
          estadoSat: 'Vigente',
          coincidenciaMonto: coincidencia,
          conceptos: parsed.conceptos?.map((c) => ({
            descripcion: c.descripcion,
            cantidad: c.cantidad,
            unidad: c.unidad,
            valorUnitario: c.valorUnitario,
            importe: c.importe,
            claveProdServ: c.claveProdServ,
            noIdentificacion: c.noIdentificacion,
          })),
        };

        setFacturasVinculadas((prev) => {
          const filtradas = prev.filter((f) => f.uuid !== nuevaFac.uuid);
          return [nuevaFac, ...filtradas];
        });

        showToast(
          `Factura ${nuevaFac.folio} vinculada y validada en SAT exitosamente.`,
          'success',
          'receipt_long'
        );
        return true;
      } catch {
        showToast('Error al parsear el XML de la factura.', 'error');
        return false;
      }
    },
    [rfc, proveedor, total, showToast]
  );

  const vincularFacturaDemo = useCallback(() => {
    vincularFacturaXml(SAMPLE_CFDI_40_XML, 'CFDI40_FivePeaks_FAC-GMX-99421.xml');
  }, [vincularFacturaXml]);

  const desvincularFactura = useCallback((id: string) => {
    setFacturasVinculadas((prev) => prev.filter((f) => f.id !== id));
    showToast('Factura fiscal desvinculada de la orden.', 'info', 'remove_done');
  }, [showToast]);

  const adjuntarPdfFactura = useCallback((facturaId: string, file: File) => {
    setFacturasVinculadas((prev) =>
      prev.map((f) => (f.id === facturaId ? { ...f, pdfNombre: file.name } : f))
    );
    showToast(`PDF ${file.name} asociado a la factura fiscal.`, 'success', 'picture_as_pdf');
  }, [showToast]);

  const goToStep = useCallback((n: number) => {
    if (n >= 1 && n <= maxSteps) {
      setStep(n);
    }
  }, [maxSteps]);

  const nextStep = useCallback((onSuccessEmit?: () => void): boolean => {
    if (step === 1) {
      if (!aprobador.trim()) {
        showToast('Falta capturar el aprobador.', 'error');
        return false;
      }
    } else if (step === 2) {
      if (!proveedor.trim()) {
        showToast('Falta capturar el proveedor.', 'error');
        return false;
      }
      if (!lugarEntrega.trim()) {
        showToast('Falta capturar el lugar de entrega.', 'error');
        return false;
      }
    } else if (step === 3) {
      const hasIncluded = items.some((i) => i.on);
      if (!hasIncluded) {
        showToast('Incluye al menos una partida.', 'error');
        return false;
      }
    } else if (step === 5) {
      showToast('¡Orden emitida y enviada al flujo de autorización!', 'success', 'task_alt');
      if (onSuccessEmit) {
        onSuccessEmit();
      }
      return true;
    }

    if (step < maxSteps) {
      goToStep(step + 1);
      return true;
    }
    return false;
  }, [step, maxSteps, aprobador, proveedor, lugarEntrega, items, goToStep, showToast]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      goToStep(step - 1);
    }
  }, [step, goToStep]);

  const saveDraft = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString();
    showToast(`Borrador guardado a las ${timeStr}`, 'success', 'save');
    setAutosaveText('Guardado hace 1s');
  }, [showToast]);

  return {
    step,
    maxSteps,
    tipoOrden,
    setTipoOrden,
    contratoProyecto,
    setContratoProyecto,
    referenciaServicioExtraordinario,
    setReferenciaServicioExtraordinario,
    folioOC,
    folioReservado,
    fechaEmision,
    setFechaEmision,
    ubicacion,
    setUbicacion,
    subsidiaria,
    setSubsidiaria,
    comprador,
    setComprador,
    aprobador,
    setAprobador,
    moneda,
    setMoneda,
    tipoCambio,
    setTipoCambio,
    nota,
    setNota,
    proveedor,
    setProveedor,
    rfc,
    setRfc,
    condicionPago,
    setCondicionPago,
    fechaEntrega,
    setFechaEntrega,
    lugarEntrega,
    setLugarEntrega,
    referenciaCotizacion,
    setReferenciaCotizacion,
    items,
    toggleItem,
    updateItem,
    deleteItem,
    addItem,
    usoCfdi,
    setUsoCfdi,
    metodoPago,
    setMetodoPago,
    formaPago,
    setFormaPago,
    exigirFactura,
    setExigirFactura,
    facturasVinculadas,
    vincularFacturaXml,
    vincularFacturaDemo,
    desvincularFactura,
    adjuntarPdfFactura,
    archivos,
    agregarArchivos,
    eliminarArchivo,
    subtotal,
    iva,
    retenciones,
    total,
    includedCount,
    totalCount,
    goToStep,
    nextStep,
    prevStep,
    saveDraft,
    autosaveText,
    toast,
    showToast,
    hideToast,
  };
}
