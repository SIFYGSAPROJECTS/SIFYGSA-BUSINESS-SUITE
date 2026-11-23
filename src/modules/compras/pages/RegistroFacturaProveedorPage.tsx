'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { FormWizardFooter } from '../components/FormWizardFooter';
import { useCompras } from '../context/ComprasContext';
import {
  obtenerOrdenesCompra,
  guardarFacturaProveedor,
} from '../data/mock-data';
import type { FacturaProveedor, OrdenCompra, DocumentoAdjunto } from '../types';
import '../compras.css';

// ── PASOS NORMATIVOS DEL ASISTENTE DE FACTURAS (4 ETAPAS) ──
const FACTURA_STEPS: StepItem[] = [
  { id: 1, number: 1, title: 'Orden de compra', description: 'Orden de compra ligada' },
  { id: 2, number: 2, title: 'Información de la factura', description: 'Referencia, vencimiento y cuenta' },
  { id: 3, number: 3, title: 'Archivos adjuntos', description: 'Carga de archivos PDF, XML o comprobantes' },
  { id: 4, number: 4, title: 'Revisión y confirmación', description: 'Resumen y guardado final' },
];

// Catálogo de Carpetas Normativas
const CARPETAS_CATALOGO = [
  'Facturas Compras 2026',
  'Comprobantes Fiscales SAT',
  'Expedientes Proveedores',
  'CFDI 4.0 XML & PDF',
  'Pólizas y Descargos',
];

// Catálogo de Cuentas Contables
const CUENTAS_CONTABLES = [
  { valor: '2110-0010-0000-0000 PROVEEDORES MXN', label: '2110-0010-0000-0000 PROVEEDORES MXN', moneda: 'MXN' },
  { valor: '2110-0020-0000-0000 PROVEEDORES EXTRANJEROS (USD)', label: '2110-0020-0000-0000 PROVEEDORES EXTRANJEROS (USD)', moneda: 'USD' },
  { valor: '2110-0030-0000-0000 PROVEEDORES RETENCIONES FISCALES', label: '2110-0030-0000-0000 PROVEEDORES RETENCIONES FISCALES', moneda: 'TODAS' },
  { valor: '2110-0040-0000-0000 PROVEEDORES FLETES Y EMBARQUES', label: '2110-0040-0000-0000 PROVEEDORES FLETES Y EMBARQUES', moneda: 'TODAS' },
  { valor: '2110-0050-0000-0000 PROVEEDORES SUBCONTRATISTAS EN OBRA', label: '2110-0050-0000-0000 PROVEEDORES SUBCONTRATISTAS EN OBRA', moneda: 'TODAS' },
];

export interface ArchivoItemFactura {
  id: string;
  nombre: string;
  tamano: number;
  tipo: string;
  carpeta: string;
  fechaSubida: string;
  url?: string;
}

export interface FacturaProgramadaItem {
  id: string;
  ordenCompraFolio: string;
  referenciaNo: string;
  proveedorNombre: string;
  proveedorRfc: string;
  fechaVencimiento: string;
  cuenta: string;
  moneda: string;
  importe: number;
  estado: 'Por vencer' | 'Vencida' | 'Programada para pago' | 'Anulada';
}

export const RegistroFacturaProveedorPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ocParam = searchParams.get('oc');
  const archivosParam = searchParams.get('archivos'); // Archivos marcados como 'Factura' desde ODC
  const vistaQuery = searchParams.get('vista');

  const {
    ordenes: ordenesContext,
    guardarFactura: guardarFacturaContext,
    anularFactura: anularFacturaContext,
    mostrarToast,
  } = useCompras();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── MODO PRINCIPAL: ASISTENTE DE REGISTRO vs FACTURAS PROGRAMADAS ──
  const [tabPrincipal, setTabPrincipal] = useState<'registro' | 'programadas'>(
    vistaQuery === 'programadas' ? 'programadas' : 'registro'
  );

  // Catálogo de Órdenes disponibles
  const [ordenes] = useState<OrdenCompra[]>(() =>
    ordenesContext.length > 0 ? ordenesContext : obtenerOrdenesCompra()
  );

  // ── ESTADO DEL STEPPER (4 PASOS) ──
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errorSteps, setErrorSteps] = useState<number[]>([]);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // ── PASO 1: ORDEN DE COMPRA ──
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompra | null>(() => {
    if (!ocParam) return ordenes[0] || null;
    const buscado = ocParam.trim().toLowerCase();
    return ordenes.find(
      (o) => o.folio.toLowerCase() === buscado || o.id.toLowerCase() === buscado
    ) || ordenes[0] || null;
  });

  const [busquedaOrden, setBusquedaOrden] = useState('');
  const [isBuscandoOrden, setIsBuscandoOrden] = useState(false);

  // ── PASO 2: INFORMACIÓN DE LA FACTURA ──
  const [referenciaNo, setReferenciaNo] = useState(
    () => `FAC-2026-${Math.floor(1000 + Math.random() * 8999)}`
  );

  const [fechaEmision, setFechaEmision] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Cuenta contable preasignada según divisa de la orden
  const [cuentaContable, setCuentaContable] = useState(() => {
    const isUsd = (ordenSeleccionada?.moneda || '').toUpperCase() === 'USD';
    return isUsd
      ? '2110-0020-0000-0000 PROVEEDORES EXTRANJEROS (USD)'
      : '2110-0010-0000-0000 PROVEEDORES MXN';
  });

  // Re-asignar automáticamente la cuenta si cambia la orden de compra y su moneda
  useEffect(() => {
    if (ordenSeleccionada) {
      const isUsd = ordenSeleccionada.moneda === 'USD';
      setCuentaContable(
        isUsd
          ? '2110-0020-0000-0000 PROVEEDORES EXTRANJEROS (USD)'
          : '2110-0010-0000-0000 PROVEEDORES MXN'
      );
    }
  }, [ordenSeleccionada]);

  // Atajos rápidos para fecha de vencimiento
  const aplicarAtajoVencimiento = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    setFechaVencimiento(d.toISOString().split('T')[0]);
  };

  // Sección colapsable "Datos fiscales (CFDI 4.0)" (cerrada por defecto)
  const [isDatosFiscalesOpen, setIsDatosFiscalesOpen] = useState(false);
  const [uuidFiscal, setUuidFiscal] = useState('4A2B89D1-7C34-49E1-88F2-51E9C8921BA0');
  const [rfcEmisor, setRfcEmisor] = useState(() => ordenSeleccionada?.proveedorRfc || 'FPM130918MPA');
  const [rfcReceptor, setRfcReceptor] = useState('SFG120301ABC');
  const [razonSocialEmisor, setRazonSocialEmisor] = useState(
    () => ordenSeleccionada?.proveedorNombre || 'FIVE PEAKS MÉXICO SA DE CV'
  );
  const [regimenFiscal, setRegimenFiscal] = useState('601 - General de Ley Personas Morales');
  const [metodoPago, setMetodoPago] = useState('PPD - Pago en parcialidades o diferido');
  const [formaPago, setFormaPago] = useState('03 - Transferencia electrónica de fondos');
  const [usoCfdi, setUsoCfdi] = useState('G03 - Gastos en general');
  const [observaciones, setObservaciones] = useState(
    'Recepción y vinculación de factura fiscal CFDI 4.0 a orden de compra autorizada.'
  );

  // Actualizar datos del proveedor si cambia la orden
  useEffect(() => {
    if (ordenSeleccionada) {
      setRfcEmisor(ordenSeleccionada.proveedorRfc || 'FPM130918MPA');
      setRazonSocialEmisor(ordenSeleccionada.proveedorNombre || 'PROVEEDOR SIFYGSA');
    }
  }, [ordenSeleccionada]);

  // ── PASO 3: ARCHIVOS ADJUNTOS ──
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<string>('Facturas Compras 2026');
  const [archivoPendiente, setArchivoPendiente] = useState<File | null>(null);
  const [archivosLista, setArchivosLista] = useState<ArchivoItemFactura[]>(() => {
    const list: ArchivoItemFactura[] = [];
    // Si viene precargado desde query param de la ODC
    if (archivosParam) {
      const nombres = decodeURIComponent(archivosParam).split(',');
      nombres.forEach((nom, i) => {
        if (nom.trim()) {
          list.push({
            id: `init-arch-${i}`,
            nombre: nom.trim(),
            tamano: 184520,
            tipo: nom.toLowerCase().endsWith('.xml') ? 'text/xml' : 'application/pdf',
            carpeta: 'Facturas Compras 2026',
            fechaSubida: new Date().toLocaleDateString('es-MX'),
          });
        }
      });
    }
    // Si la lista está vacía, incluir archivo PDF de factura predeterminado de la ODC
    if (list.length === 0) {
      list.push({
        id: 'arch-default-1',
        nombre: `Factura_${ordenSeleccionada?.folio || 'PO-2026-0174'}_CFDI.pdf`,
        tamano: 245800,
        tipo: 'application/pdf',
        carpeta: 'Facturas Compras 2026',
        fechaSubida: new Date().toLocaleDateString('es-MX'),
      });
    }
    return list;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [archivoPrevisualizar, setArchivoPrevisualizar] = useState<ArchivoItemFactura | null>(null);

  // ── PASO 4: REVISIÓN Y CONFIRMACIÓN ──
  const [isSaving, setIsSaving] = useState(false);
  const [facturaGuardadaExito, setFacturaGuardadaExito] = useState(false);
  const [isDialogCancelarOpen, setIsDialogCancelarOpen] = useState(false);

  // ── PANTALLA: FACTURAS PROGRAMADAS (MOCK REALISTA POR PROVEEDOR) ──
  const [filtroProveedorProgramadas, setFiltroProveedorProgramadas] = useState('');
  const [proveedorSeleccionadoProgramadas, setProveedorSeleccionadoProgramadas] = useState(
    'FIVE PEAKS MÉXICO SA DE CV'
  );

  const [facturasProgramadas, setFacturasProgramadas] = useState<FacturaProgramadaItem[]>([
    {
      id: 'FP-01',
      ordenCompraFolio: 'PO-2026-0173',
      referenciaNo: 'FAC-2026-8910',
      proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
      proveedorRfc: 'FPM130918MPA',
      fechaVencimiento: '2026-11-25',
      cuenta: '2110-0010-0000-0000 PROVEEDORES MXN',
      moneda: 'MXN',
      importe: 4118.0,
      estado: 'Por vencer',
    },
    {
      id: 'FP-02',
      ordenCompraFolio: 'PO-2026-0174',
      referenciaNo: 'FAC-2026-8941',
      proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
      proveedorRfc: 'FPM130918MPA',
      fechaVencimiento: '2026-12-03',
      cuenta: '2110-0010-0000-0000 PROVEEDORES MXN',
      moneda: 'MXN',
      importe: 14088.21,
      estado: 'Programada para pago',
    },
    {
      id: 'FP-03',
      ordenCompraFolio: 'PO10926',
      referenciaNo: 'FAC-2026-4412',
      proveedorNombre: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE',
      proveedorRfc: 'MIN090211QT9',
      fechaVencimiento: '2026-03-18',
      cuenta: '2110-0010-0000-0000 PROVEEDORES MXN',
      moneda: 'MXN',
      importe: 70992.0,
      estado: 'Vencida',
    },
    {
      id: 'FP-04',
      ordenCompraFolio: 'PO-2026-0115',
      referenciaNo: 'FAC-2026-3021',
      proveedorNombre: 'YAK ADVENTURE S.A. DE C.V.',
      proveedorRfc: 'YAD140828TY2',
      fechaVencimiento: '2026-04-22',
      cuenta: '2110-0010-0000-0000 PROVEEDORES MXN',
      moneda: 'MXN',
      importe: 74240.0,
      estado: 'Programada para pago',
    },
  ]);

  // Modal para anulación de factura
  const [facturaAAnular, setFacturaAAnular] = useState<FacturaProgramadaItem | null>(null);

  // ── FILTRO EN VIVO DE ÓRDENES (PASO 1) ──
  const ordenesFiltradas = useMemo(() => {
    if (!busquedaOrden.trim()) return ordenes.slice(0, 8);
    const q = busquedaOrden.toLowerCase();
    return ordenes.filter(
      (o) =>
        o.folio.toLowerCase().includes(q) ||
        o.proveedorNombre.toLowerCase().includes(q) ||
        o.proveedorRfc.toLowerCase().includes(q) ||
        (o.almacenDestino && o.almacenDestino.toLowerCase().includes(q))
    );
  }, [ordenes, busquedaOrden]);

  // ── MANEJADORES DE NAVEGACIÓN Y VALIDACIÓN DEL STEPPER ──
  const obtenerEstadoValidacionPaso = (paso: number): { valido: boolean; camposFaltantes: string[] } => {
    const faltantes: string[] = [];
    if (paso === 1) {
      if (!ordenSeleccionada) {
        faltantes.push('Orden de Compra vinculada');
      }
    } else if (paso === 2) {
      if (!referenciaNo.trim()) {
        faltantes.push('Referencia No. de Factura');
      }
      if (!fechaVencimiento.trim()) {
        faltantes.push('Fecha de Vencimiento');
      }
      if (!cuentaContable.trim()) {
        faltantes.push('Cuenta Contable');
      }
    } else if (paso === 3) {
      if (!carpetaSeleccionada.trim()) {
        faltantes.push('Carpeta de destino');
      }
      if (archivosLista.length === 0) {
        faltantes.push('Al menos un archivo comprobante (PDF/XML)');
      }
    }
    return { valido: faltantes.length === 0, camposFaltantes: faltantes };
  };

  const estadoPasoActual = useMemo(() => {
    return obtenerEstadoValidacionPaso(currentStep);
  }, [currentStep, ordenSeleccionada, referenciaNo, fechaVencimiento, cuentaContable, carpetaSeleccionada, archivosLista]);

  const handleContinuar = () => {
    if (!estadoPasoActual.valido) {
      setErrorValidacion(`Faltan ${estadoPasoActual.camposFaltantes.length} campos obligatorios para continuar: ${estadoPasoActual.camposFaltantes.join(', ')}`);
      if (!errorSteps.includes(currentStep)) {
        setErrorSteps((prev) => [...prev, currentStep]);
      }
      return;
    }

    // Quitar de error si estaba
    setErrorSteps((prev) => prev.filter((s) => s !== currentStep));
    setErrorValidacion(null);

    // Agregar a completados
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAtras = () => {
    setErrorValidacion(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNum: number) => {
    if (isCompletedAll) return;
    if (completedSteps.includes(stepNum) || stepNum === currentStep) {
      setErrorValidacion(null);
      setCurrentStep(stepNum);
    }
  };

  // ── GESTIÓN DE ARCHIVOS (PASO 3) ──
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'xml', 'jpg', 'jpeg', 'png'];

    if (!ext || !validExts.includes(ext)) {
      mostrarToast('Formato no permitido. Solo se aceptan PDF, XML, JPG o PNG.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('El archivo supera el límite de 10 MB permitido.', 'error');
      return;
    }

    setArchivoPendiente(file);
  };

  const handleAgregarArchivo = () => {
    if (!archivoPendiente) {
      mostrarToast('Selecciona o arrastra un archivo primero para agregarlo.', 'warning');
      return;
    }
    if (!carpetaSeleccionada) {
      mostrarToast('Selecciona una carpeta normativa.', 'warning');
      return;
    }

    const nuevoItem: ArchivoItemFactura = {
      id: `arch-${Date.now()}`,
      nombre: archivoPendiente.name,
      tamano: archivoPendiente.size,
      tipo: archivoPendiente.type || 'application/octet-stream',
      carpeta: carpetaSeleccionada,
      fechaSubida: new Date().toLocaleDateString('es-MX'),
    };

    setArchivosLista((prev) => [...prev, nuevoItem]);
    setArchivoPendiente(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    mostrarToast(`Archivo "${nuevoItem.nombre}" agregado a ${carpetaSeleccionada}.`, 'success');
  };

  const handleEliminarArchivo = (id: string) => {
    setArchivosLista((prev) => prev.filter((a) => a.id !== id));
    mostrarToast('Archivo eliminado de la lista.', 'info');
  };

  // ── GUARDADO FINAL DE LA FACTURA (PASO 4) ──
  const handleGuardarFactura = () => {
    if (!ordenSeleccionada) {
      mostrarToast('Error: no hay orden de compra ligada.', 'error');
      return;
    }

    setIsSaving(true);

    const docPrincipal: DocumentoAdjunto = {
      id: archivosLista[0]?.id || `doc-${Date.now()}`,
      nombre: archivosLista[0]?.nombre || `Factura_${referenciaNo}.pdf`,
      tamano: archivosLista[0]?.tamano || 150000,
      tipo: archivosLista[0]?.tipo || 'application/pdf',
      fechaSubida: new Date().toISOString(),
    };

    const nuevaFacturaProveedor: FacturaProveedor = {
      id: referenciaNo,
      folio: referenciaNo,
      uuidFiscal: uuidFiscal.trim().toUpperCase(),
      ordenCompraId: ordenSeleccionada.id,
      ordenCompraFolio: ordenSeleccionada.folio,
      proveedorId: ordenSeleccionada.proveedorId,
      proveedorNombre: ordenSeleccionada.proveedorNombre,
      proveedorRfc: ordenSeleccionada.proveedorRfc,
      fechaEmision,
      fechaVencimiento,
      moneda: ordenSeleccionada.moneda,
      subtotal: ordenSeleccionada.subtotal,
      iva: ordenSeleccionada.iva,
      descuento: ordenSeleccionada.descuento || 0,
      total: ordenSeleccionada.total,
      estatus: 'abierta',
      xmlArchivo: archivosLista.find((a) => a.nombre.endsWith('.xml'))?.nombre,
      pdfArchivo: archivosLista.find((a) => a.nombre.endsWith('.pdf'))?.nombre,
      documentoPrincipal: docPrincipal,
      documentosAdjuntos: archivosLista.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        tamano: a.tamano,
        tipo: a.tipo,
        fechaSubida: new Date().toISOString(),
      })),
      usoCfdi,
      cuentaGasto: cuentaContable,
      observaciones,
    };

    // Guardar en almacenamiento mock
    guardarFacturaProveedor(nuevaFacturaProveedor);

    // Guardar en contexto
    guardarFacturaContext({
      id: referenciaNo,
      ocId: ordenSeleccionada.folio,
      uuid: uuidFiscal,
      folio: referenciaNo,
      proveedor: ordenSeleccionada.proveedorNombre,
      rfcEmisor: rfcEmisor,
      rfcReceptor: rfcReceptor,
      fechaEmision,
      fechaVencimiento,
      moneda: (ordenSeleccionada.moneda as 'MXN' | 'USD') || 'MXN',
      tipoCambio: 1,
      subtotal: ordenSeleccionada.subtotal,
      iva: ordenSeleccionada.iva,
      total: ordenSeleccionada.total,
      conceptos: [],
      estado: 'abierta',
      cuentaContable: cuentaContable,
      usoCfdi: usoCfdi,
      regimenEmisor: regimenFiscal,
    });

    // Agregar también a facturas programadas
    const nuevaProg: FacturaProgramadaItem = {
      id: `FP-${Date.now()}`,
      ordenCompraFolio: ordenSeleccionada.folio,
      referenciaNo,
      proveedorNombre: ordenSeleccionada.proveedorNombre,
      proveedorRfc: ordenSeleccionada.proveedorRfc,
      fechaVencimiento,
      cuenta: cuentaContable,
      moneda: ordenSeleccionada.moneda,
      importe: ordenSeleccionada.total,
      estado: 'Programada para pago',
    };
    setFacturasProgramadas((prev) => [nuevaProg, ...prev]);

    setTimeout(() => {
      setIsSaving(false);
      setFacturaGuardadaExito(true);
      setCompletedSteps([1, 2, 3, 4]);
      setIsCompletedAll(true);
      mostrarToast(
        `Factura ${referenciaNo} registrada y vinculada a la orden ${ordenSeleccionada.folio}.`,
        'success'
      );
    }, 600);
  };

  // ── ANULACIÓN DE FACTURA (MODAL + TOAST + BADGE ROJO) ──
  const confirmarAnularFactura = () => {
    if (!facturaAAnular) return;
    const { id, ordenCompraFolio, referenciaNo: refNo } = facturaAAnular;

    anularFacturaContext(id, ordenCompraFolio);

    setFacturasProgramadas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, estado: 'Anulada' } : f))
    );

    mostrarToast(`Recepción de factura ${refNo} anulada exitosamente.`, 'warning');
    setFacturaAAnular(null);
  };

  // ── RESUMEN PARA FACTURAS PROGRAMADAS DEL PROVEEDOR ──
  const facturasDelProveedor = useMemo(() => {
    const provBuscado = proveedorSeleccionadoProgramadas.toLowerCase();
    return facturasProgramadas
      .filter((f) => f.proveedorNombre.toLowerCase().includes(provBuscado))
      .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
  }, [facturasProgramadas, proveedorSeleccionadoProgramadas]);

  const saldoPendienteProveedor = useMemo(() => {
    return facturasDelProveedor
      .filter((f) => f.estado !== 'Anulada')
      .reduce((acc, curr) => acc + curr.importe, 0);
  }, [facturasDelProveedor]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-6 pb-28 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── BARRA SUPERIOR & BREADCRUMB ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/compras" className="hover:text-primary transition-colors">
              Compras
            </Link>
            <span>/</span>
            <Link href="/compras/facturas" className="hover:text-primary transition-colors">
              Facturas
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {tabPrincipal === 'registro' ? 'Registro de Factura de Proveedor' : 'Facturas Programadas'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {tabPrincipal === 'registro' ? 'Recepción y Registro de Facturas' : 'Facturas Programadas de Proveedores'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              CFDI 4.0 SAT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión fiscal centralizada, validación de comprobantes XML/PDF y programación de pagos a tesorería.
          </p>
        </div>

        {/* Selector de Pestañas Superiores */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTabPrincipal('registro')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tabPrincipal === 'registro'
              ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined text-[17px]">receipt_long</span>
            Registrar Factura
          </button>
          <button
            type="button"
            onClick={() => setTabPrincipal('programadas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tabPrincipal === 'programadas'
              ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined text-[17px]">event_note</span>
            Facturas Programadas
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
              {facturasProgramadas.filter((f) => f.estado !== 'Anulada').length}
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          VISTA 1: ASISTENTE POR PASOS (4 ETAPAS) DE REGISTRO DE FACTURA
          ══════════════════════════════════════════════════════════════════════════ */}
      {tabPrincipal === 'registro' && (
        <div className="space-y-6">
          {/* STEPPER COMPARTIDO (NORMATIVO) */}
          <Stepper
            steps={FACTURA_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            errorSteps={errorSteps}
            isCompletedAll={isCompletedAll}
            isCurrentStepValid={estadoPasoActual.valido}
            onStepClick={(step) => {
              if (step > currentStep && !estadoPasoActual.valido) {
                setErrorValidacion(`Faltan ${estadoPasoActual.camposFaltantes.length} campos obligatorios para continuar: ${estadoPasoActual.camposFaltantes.join(', ')}`);
                return;
              }
              handleStepClick(step);
            }}
            isReadOnly={facturaGuardadaExito}
            successBannerText={
              facturaGuardadaExito
                ? `Factura registrada exitosamente con el folio ${referenciaNo} para la orden ${ordenSeleccionada?.folio}.`
                : undefined
            }
          />

          {/* Banner de Error de Validación */}
          {errorValidacion && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-[19px] text-red-600 flex-shrink-0">error</span>
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              PASO 1 – ORDEN DE COMPRA LIGADA
              ─────────────────────────────────────────────────────────────────── */}
          {currentStep === 1 && !facturaGuardadaExito && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">shopping_cart</span>
                    Paso 1: Vincular Orden de Compra
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verifica la orden de compra que ampara la recepción de este comprobante fiscal.
                  </p>
                </div>

                {ordenSeleccionada && (
                  <button
                    type="button"
                    onClick={() => setIsBuscandoOrden(!isBuscandoOrden)}
                    className="cp-btn cp-btn-secondary text-xs self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    {isBuscandoOrden ? 'Cerrar buscador' : 'Cambiar orden de compra'}
                  </button>
                )}
              </div>

              {/* Buscador en vivo de Órdenes */}
              {(isBuscandoOrden || !ordenSeleccionada) && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Buscar orden de compra por Folio, Proveedor, RFC o Proyecto:
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-primary"
                      placeholder="Ej. PO-2026-0174, Five Peaks, MIN090211..."
                      value={busquedaOrden}
                      onChange={(e) => setBusquedaOrden(e.target.value)}
                    />
                  </div>

                  {/* Resultados del buscador */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pt-1">
                    {ordenesFiltradas.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          setOrdenSeleccionada(ord);
                          setIsBuscandoOrden(false);
                          mostrarToast(`Orden ${ord.folio} seleccionada.`, 'info');
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${ordenSeleccionada?.id === ord.id
                          ? 'bg-blue-50/80 dark:bg-blue-950/50 border-primary shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{ord.folio}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {ord.estatus}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {ord.proveedorNombre} ({ord.proveedorRfc})
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-slate-900 dark:text-slate-100">
                            ${ord.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {ord.moneda}
                          </div>
                          <div className="text-[10px] text-slate-400">{ord.fechaEmision}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarjeta de Orden de Compra Seleccionada (Solo Lectura con Badge "Ligada a la orden") */}
              {ordenSeleccionada ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-950/20 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[24px]">description</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Orden de compra seleccionada
                        </span>
                        <span className="text-lg font-black text-primary">{ordenSeleccionada.folio}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="material-symbols-outlined text-[14px]">link</span>
                        Ligada a la orden
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                        {ordenSeleccionada.estatus}
                      </span>
                    </div>
                  </div>

                  {/* Bloques de Datos de la Orden */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Proveedor Adjudicado</span>
                      <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 truncate" title={ordenSeleccionada.proveedorNombre}>
                        {ordenSeleccionada.proveedorNombre}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">RFC: {ordenSeleccionada.proveedorRfc}</div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Monto Total de la Orden</span>
                      <div className="text-sm font-black text-primary mt-1">
                        ${ordenSeleccionada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {ordenSeleccionada.moneda}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        IVA incluido (${ordenSeleccionada.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })})
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Fechas & Logística</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        Emisión: {ordenSeleccionada.fechaEmision}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Entrega: {ordenSeleccionada.fechaEntrega}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Destino / Proyecto</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate" title={ordenSeleccionada.almacenDestino}>
                        {ordenSeleccionada.almacenDestino}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        Condición: {ordenSeleccionada.condicionPago || 'Crédito 30 días'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinuar}
                      className="cp-btn cp-btn-primary"
                    >
                      <span>Registrar factura proveedor</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">find_in_page</span>
                  <p className="text-xs text-slate-500">Selecciona una orden de compra activa para continuar.</p>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              PASO 2 – INFORMACIÓN DE LA FACTURA
              ─────────────────────────────────────────────────────────────────── */}
          {currentStep === 2 && !facturaGuardadaExito && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                  Paso 2: Información de la Factura
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Captura el folio de referencia, fecha de vencimiento y asignación contable normativa.
                </p>
              </div>

              {/* Grid Principal de 2 Columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Referencia No. * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Referencia No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-primary"
                    placeholder="Ej. FAC-2026-8941"
                    value={referenciaNo}
                    onChange={(e) => setReferenciaNo(e.target.value)}
                  />
                  <span className="block text-[11px] text-slate-400">
                    Número de serie y folio de la factura emitido por el proveedor.
                  </span>
                </div>

                {/* 2. Fecha de Vencimiento * con Atajos Rápidos */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Fecha de vencimiento <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Atajos rápidos:</span>
                  </div>

                  <input
                    type="date"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-primary"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />

                  {/* Pastillas de atajos rápidos */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => aplicarAtajoVencimiento(0)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Contado
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoVencimiento(15)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      15 días
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoVencimiento(30)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors"
                    >
                      30 días
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoVencimiento(60)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      60 días
                    </button>
                  </div>
                </div>

                {/* 3. Cuenta * (Menú desplegable obligatorio preasignado) */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cuenta <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-none focus:border-primary"
                    value={cuentaContable}
                    onChange={(e) => setCuentaContable(e.target.value)}
                  >
                    {CUENTAS_CONTABLES.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0 mt-0.5">
                      info
                    </span>
                    <span>
                      Cuenta contable preasignada automáticamente según la divisa de la orden de compra (
                      <strong>{ordenSeleccionada?.moneda || 'MXN'}</strong>). Puedes modificarla si aplica una cuenta especial.
                    </span>
                  </div>
                </div>

                {/* Fecha de Emisión y Moneda */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fecha de Emisión</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-primary"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Moneda & Monto Total</label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-between">
                    <span>${ordenSeleccionada?.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</span>
                    <span className="text-primary font-black">{ordenSeleccionada?.moneda || 'MXN'}</span>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notas y Observaciones
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-primary"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas internas o aclaraciones del comprobante fiscal..."
                  />
                </div>
              </div>

              {/* SECCIÓN COLAPSABLE: DATOS FISCALES (CFDI 4.0) (CERRADA POR DEFECTO) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsDatosFiscalesOpen(!isDatosFiscalesOpen)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Datos fiscales (CFDI 4.0)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        UUID, RFC emisor/receptor, método y forma de pago (Opcional para registro contable)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {isDatosFiscalesOpen ? 'Ocultar' : 'Mostrar campos'}
                    </span>
                    <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${isDatosFiscalesOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </button>

                {isDatosFiscalesOpen && (
                  <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-200/50">
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Validación automática contra Constancia de Situación Fiscal (CSF) y timbrado SAT 32-D.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          mostrarToast('Datos fiscales verificados con éxito contra el padrón SAT.', 'success');
                        }}
                        className="cp-btn cp-btn-secondary text-[11px] self-start sm:self-auto"
                      >
                        <span className="material-symbols-outlined text-[15px]">sync</span>
                        Validar SAT CFDI 4.0
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {/* UUID */}
                      <div className="lg:col-span-2 space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">UUID Folio Fiscal SAT</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                            value={uuidFiscal}
                            onChange={(e) => setUuidFiscal(e.target.value)}
                          />
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                            title="Copiar UUID"
                            onClick={() => {
                              navigator.clipboard?.writeText(uuidFiscal);
                              mostrarToast('UUID copiado al portapapeles', 'info');
                            }}
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                      </div>

                      {/* RFC Emisor */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">RFC Emisor (Proveedor)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                          value={rfcEmisor}
                          onChange={(e) => setRfcEmisor(e.target.value)}
                        />
                      </div>

                      {/* Razón Social Emisor */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Razón Social Emisor</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          value={razonSocialEmisor}
                          onChange={(e) => setRazonSocialEmisor(e.target.value)}
                        />
                      </div>

                      {/* RFC Receptor */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">RFC Receptor (SIFYGSA)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                          value={rfcReceptor}
                          onChange={(e) => setRfcReceptor(e.target.value)}
                        />
                      </div>

                      {/* Método de pago */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Método de Pago</label>
                        <select
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          value={metodoPago}
                          onChange={(e) => setMetodoPago(e.target.value)}
                        >
                          <option value="PPD - Pago en parcialidades o diferido">PPD - Pago en parcialidades o diferido</option>
                          <option value="PUE - Pago en una sola exhibición">PUE - Pago en una sola exhibición</option>
                        </select>
                      </div>

                      {/* Forma de pago */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Forma de Pago</label>
                        <select
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          value={formaPago}
                          onChange={(e) => setFormaPago(e.target.value)}
                        >
                          <option value="03 - Transferencia electrónica de fondos">03 - Transferencia electrónica de fondos</option>
                          <option value="01 - Efectivo">01 - Efectivo</option>
                          <option value="02 - Cheque nominativo">02 - Cheque nominativo</option>
                          <option value="99 - Por definir">99 - Por definir</option>
                        </select>
                      </div>

                      {/* Régimen Fiscal */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Régimen Fiscal Emisor</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          value={regimenFiscal}
                          onChange={(e) => setRegimenFiscal(e.target.value)}
                        />
                      </div>

                      {/* Uso de CFDI */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 dark:text-slate-400">Uso de CFDI</label>
                        <select
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          value={usoCfdi}
                          onChange={(e) => setUsoCfdi(e.target.value)}
                        >
                          <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                          <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                          <option value="I04 - Equipo de cómputo y accesorios">I04 - Equipo de cómputo y accesorios</option>
                          <option value="CP01 - Pagos">CP01 - Pagos</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              PASO 3 – ARCHIVOS ADJUNTOS
              ─────────────────────────────────────────────────────────────────── */}
          {currentStep === 3 && !facturaGuardadaExito && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">attach_file</span>
                  Paso 3: Archivos Adjuntos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecciona la carpeta normativa y adjunta los comprobantes fiscales (PDF, XML, JPG, PNG - máx. 10 MB).
                </p>
              </div>

              {/* 1. Selección de Carpeta * */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Carpeta de Almacenamiento <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-primary"
                  value={carpetaSeleccionada}
                  onChange={(e) => setCarpetaSeleccionada(e.target.value)}
                >
                  {CARPETAS_CATALOGO.map((carp) => (
                    <option key={carp} value={carp}>
                      {carp}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Zona de arrastrar y soltar (Drag & Drop) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all ${isDragging
                  ? 'border-primary bg-blue-50/50 dark:bg-blue-950/40 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xml,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />

                <span className="material-symbols-outlined text-4xl text-primary/80 mb-2">
                  cloud_upload
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Arrastra aquí los archivos de la factura o selecciónalos de tu equipo
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Formatos admitidos: <strong>PDF, XML, JPG, PNG</strong>. Tamaño máximo por archivo: <strong>10 MB</strong>.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cp-btn cp-btn-secondary text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    Explorar equipo
                  </button>

                  {archivoPendiente && (
                    <button
                      type="button"
                      onClick={handleAgregarArchivo}
                      className="cp-btn cp-btn-primary text-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Agregar "{archivoPendiente.name}"
                    </button>
                  )}
                </div>

                {archivoPendiente && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 text-xs font-semibold text-blue-800 dark:text-blue-200">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Listo para agregar: {archivoPendiente.name} ({(archivoPendiente.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* 3. Lista de Archivos Adjuntos Agregados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Archivos vinculados a la factura ({archivosLista.length}):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Carpeta activa: <strong>{carpetaSeleccionada}</strong>
                  </span>
                </div>

                {archivosLista.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400">
                    Aún no se han agregado archivos. Sube al menos un PDF o XML para continuar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivosLista.map((archivo) => {
                      const isXml = archivo.nombre.toLowerCase().endsWith('.xml');
                      const isPdf = archivo.nombre.toLowerCase().endsWith('.pdf');

                      return (
                        <div
                          key={archivo.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${isXml
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : isPdf
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                }`}
                            >
                              {isXml ? 'XML' : isPdf ? 'PDF' : 'IMG'}
                            </span>

                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{archivo.nombre}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{(archivo.tamano / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span className="text-primary font-semibold">{archivo.carpeta}</span>
                                <span>•</span>
                                <span>{archivo.fechaSubida}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setArchivoPrevisualizar(archivo);
                                mostrarToast(`Previsualizando ${archivo.nombre}`, 'info');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              title="Previsualizar archivo"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarArchivo(archivo.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Eliminar archivo"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              PASO 4 – REVISIÓN Y CONFIRMACIÓN
              ─────────────────────────────────────────────────────────────────── */}
          {currentStep === 4 && !facturaGuardadaExito && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">fact_check</span>
                  Paso 4: Revisión y Confirmación
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verifica cada bloque antes de asentar contablemente la factura en el sistema.
                </p>
              </div>

              {/* Tarjeta de Resumen con 4 Bloques y Botones de Edición */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bloque 1: Orden de Compra Ligada */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[17px]">shopping_cart</span>
                      Orden de Compra Ligada
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Folio ODC:</span>
                      <span className="font-bold text-primary">{ordenSeleccionada?.folio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proveedor:</span>
                      <span className="font-bold truncate max-w-[180px]">{ordenSeleccionada?.proveedorNombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Importe Total:</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        ${ordenSeleccionada?.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {ordenSeleccionada?.moneda}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Almacén Destino:</span>
                      <span className="truncate max-w-[180px]">{ordenSeleccionada?.almacenDestino}</span>
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Datos de la Factura */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[17px]">receipt</span>
                      Datos de la Factura
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referencia No.:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{referenciaNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vencimiento:</span>
                      <span className="font-bold text-primary">{fechaVencimiento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Emisión:</span>
                      <span>{fechaEmision}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cuenta:</span>
                      <span className="font-mono text-[11px] truncate max-w-[190px]">{cuentaContable}</span>
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Datos Fiscales (CFDI 4.0) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[17px]">verified</span>
                      Datos Fiscales (CFDI 4.0)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDatosFiscalesOpen(true);
                        setCurrentStep(2);
                      }}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">UUID SAT:</span>
                      <span className="font-mono text-[10px] truncate max-w-[180px]">{uuidFiscal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RFC Emisor:</span>
                      <span className="font-mono font-bold">{rfcEmisor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Método / Uso:</span>
                      <span>{metodoPago.split(' ')[0]} / {usoCfdi.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Bloque 4: Archivos Adjuntos */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[17px]">folder_zip</span>
                      Archivos Adjuntos ({archivosLista.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                  </div>

                  <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
                    {archivosLista.map((a) => (
                      <div key={a.id} className="flex justify-between text-[11px]">
                        <span className="truncate max-w-[190px]">{a.nombre}</span>
                        <span className="text-slate-400">{(a.tamano / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              ESTADO POST-GUARDADO EXITOSO (BANNER VERDE & 3 ACCIONES NORMATIVAS)
              ─────────────────────────────────────────────────────────────────── */}
          {facturaGuardadaExito && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="material-symbols-outlined text-4xl">verified</span>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Registro Concluido al 100%
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  Factura registrada exitosamente con el folio {referenciaNo} para la orden {ordenSeleccionada?.folio}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
                  La póliza contable de pasivo ha sido generada bajo la cuenta <strong>{cuentaContable}</strong> con vencimiento el <strong>{fechaVencimiento}</strong>.
                </p>
              </div>

              {/* Tarjeta de Resumen Rápido Post-guardado */}
              <div className="max-w-2xl mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Folio Fiscal</span>
                  <div className="font-black text-primary mt-0.5">{referenciaNo}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Orden Ligada</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{ordenSeleccionada?.folio}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Monto Total</span>
                  <div className="font-black text-emerald-600 mt-0.5">
                    ${ordenSeleccionada?.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {ordenSeleccionada?.moneda}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estatus</span>
                  <div className="font-bold text-blue-600 mt-0.5">Programada</div>
                </div>
              </div>

              {/* TRES BOTONES DE ACCIÓN POST-GUARDADO SEGÚN ESPECIFICACIÓN */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                {/* 1. Ver facturas pendientes del proveedor */}
                <button
                  type="button"
                  onClick={() => {
                    if (ordenSeleccionada) {
                      setProveedorSeleccionadoProgramadas(ordenSeleccionada.proveedorNombre);
                    }
                    setTabPrincipal('programadas');
                  }}
                  className="cp-btn cp-btn-secondary w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">event_note</span>
                  Ver facturas pendientes del proveedor
                </button>

                {/* 2. Volver a la orden de compra (Paso 5 Concluido) */}
                <button
                  type="button"
                  onClick={() => {
                    const ocFolio = ordenSeleccionada?.folio || 'PO-2026-0174';
                    router.push(
                      `/compras/ordenes/nueva?facturaRegistrada=true&facturaFolio=${encodeURIComponent(
                        referenciaNo
                      )}&oc=${encodeURIComponent(ocFolio)}`
                    );
                  }}
                  className="cp-btn cp-btn-primary w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                  Volver a la orden de compra
                </button>

                {/* 3. Ir a Compras */}
                <button
                  type="button"
                  onClick={() => router.push('/compras')}
                  className="cp-btn cp-btn-secondary w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">home</span>
                  Ir a Compras
                </button>
              </div>
            </div>
          )}

          {/* ── BARRA INFERIOR FIJA REUTILIZABLE DE NAVEGACIÓN (NORMATIVO) ── */}
          {!facturaGuardadaExito && (
            <FormWizardFooter
              currentStep={currentStep}
              totalSteps={4}
              isValid={estadoPasoActual.valido}
              missingFields={estadoPasoActual.camposFaltantes}
              onContinue={currentStep < 4 ? handleContinuar : handleGuardarFactura}
              onPrevious={handleAtras}
              onCancel={() => setIsDialogCancelarOpen(true)}
              continueText="Continuar"
              finalText={isSaving ? 'Asentando contablemente...' : 'Guardar factura'}
              continueIcon="chevron_right"
              finalIcon="check_circle"
              onInvalidClick={() => {
                setErrorValidacion(`Faltan ${estadoPasoActual.camposFaltantes.length} campos obligatorios para continuar: ${estadoPasoActual.camposFaltantes.join(', ')}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              helperText="Completa los campos obligatorios (*) para continuar"
              cancelText="Cancelar"
              showCancel={true}
              isLastStep={currentStep === 4}
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          VISTA 2: FACTURAS PROGRAMADAS (TABLA, BUSCADOR POR PROVEEDOR Y ANULACIÓN)
          ══════════════════════════════════════════════════════════════════════════ */}
      {tabPrincipal === 'programadas' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Barra de Filtro y Búsqueda de Proveedor */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                  Programación de Facturas por Vencimiento
                </h3>
                <p className="text-xs text-slate-500">
                  Monitoreo de pasivos por pagar, control de flujo y calendarización de tesorería.
                </p>
              </div>

              {/* Botón para regresar al asistente */}
              <button
                type="button"
                onClick={() => setTabPrincipal('registro')}
                className="cp-btn cp-btn-primary text-xs self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Registrar nueva factura
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Filtrar por nombre de Proveedor o RFC:
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                    placeholder="Buscar proveedor ej. FIVE PEAKS, MANGUERAS..."
                    value={filtroProveedorProgramadas}
                    onChange={(e) => {
                      setFiltroProveedorProgramadas(e.target.value);
                      setProveedorSeleccionadoProgramadas(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Proveedor seleccionado:
                </label>
                <select
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                  value={proveedorSeleccionadoProgramadas}
                  onChange={(e) => setProveedorSeleccionadoProgramadas(e.target.value)}
                >
                  <option value="FIVE PEAKS MÉXICO SA DE CV">FIVE PEAKS MÉXICO SA DE CV (FPM130918MPA)</option>
                  <option value="MANGUERAS E INSTRUMENTACIÓN DEL NORTE">MANGUERAS E INSTRUMENTACIÓN DEL NORTE</option>
                  <option value="YAK ADVENTURE S.A. DE C.V.">YAK ADVENTURE S.A. DE C.V.</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bloque Resumen del Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Proveedor / RFC</span>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
                {proveedorSeleccionadoProgramadas}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {facturasDelProveedor[0]?.proveedorRfc || 'FPM130918MPA'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Pendiente Total</span>
              <div className="text-base font-black text-primary mt-1">
                ${saldoPendienteProveedor.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Por liquidar a proveedor</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total de Facturas Programadas</span>
              <div className="text-base font-black text-emerald-600 mt-1">
                {facturasDelProveedor.filter((f) => f.estado !== 'Anulada').length} Facturas activas
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ordenadas por fecha más próxima</div>
            </div>
          </div>

          {/* Tabla de Facturas Pendientes (Ordenada por Vencimiento) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Facturas Pendientes del Proveedor
              </h4>
              <span className="text-xs text-slate-400">
                {facturasDelProveedor.length} comprobantes encontrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="px-4 py-3">Orden de Compra</th>
                    <th className="px-4 py-3">Referencia No.</th>
                    <th className="px-4 py-3">Fecha Vencimiento</th>
                    <th className="px-4 py-3">Cuenta Contable</th>
                    <th className="px-4 py-3">Moneda</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {facturasDelProveedor.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                        No hay facturas programadas para este proveedor o criterio de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    facturasDelProveedor.map((f) => {
                      let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (f.estado === 'Vencida') {
                        badgeColor = 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200';
                      } else if (f.estado === 'Programada para pago') {
                        badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
                      } else if (f.estado === 'Anulada') {
                        badgeColor = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border-red-300 font-bold';
                      }

                      return (
                        <tr
                          key={f.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${f.estado === 'Anulada' ? 'opacity-60 bg-red-50/20' : ''
                            }`}
                        >
                          <td className="px-4 py-3 font-bold text-primary">{f.ordenCompraFolio}</td>
                          <td className="px-4 py-3 font-mono font-semibold">{f.referenciaNo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {f.fechaVencimiento}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                            {f.cuenta}
                          </td>
                          <td className="px-4 py-3 font-bold">{f.moneda}</td>
                          <td className="px-4 py-3 font-black text-right text-slate-900 dark:text-slate-100">
                            ${f.importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border font-semibold ${badgeColor}`}
                            >
                              {f.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {f.estado !== 'Anulada' && (
                                <button
                                  type="button"
                                  onClick={() => setFacturaAAnular(f)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title="Anular recepción de factura"
                                >
                                  Anular
                                </button>
                              )}
                              <Link
                                href={`/compras/ordenes/${encodeURIComponent(f.ordenCompraFolio)}`}
                                className="p-1 rounded text-slate-400 hover:text-primary"
                                title="Ver orden de compra"
                              >
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMACIÓN DE ANULACIÓN DE RECEPCIÓN DE FACTURA ── */}
      {facturaAAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ¿Anular recepción de factura?
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                ¿Desea anular la recepción de la factura <strong>{facturaAAnular.referenciaNo}</strong> vinculada a la orden{' '}
                <strong>{facturaAAnular.ordenCompraFolio}</strong>?
              </p>
              <div className="p-3 mt-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 text-left">
                Esta acción cancelará los asientos en la cuenta por pagar y el estado pasará a <strong>"Anulada"</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFacturaAAnular(null)}
                className="cp-btn cp-btn-secondary text-xs"
              >
                Conservar factura
              </button>
              <button
                type="button"
                onClick={confirmarAnularFactura}
                className="cp-btn text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Sí, anular recepción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CANCELAR ASISTENTE ── */}
      {isDialogCancelarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ¿Salir sin guardar factura?
            </h3>
            <p className="text-xs text-slate-500">
              Se perderán los datos capturados en el asistente. ¿Deseas regresar al módulo de compras?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDialogCancelarOpen(false)}
                className="cp-btn cp-btn-secondary text-xs"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={() => router.push('/compras')}
                className="cp-btn text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVISUALIZAR ARCHIVO ── */}
      {archivoPrevisualizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[320px]">
                {archivoPrevisualizar.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setArchivoPrevisualizar(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-5xl text-primary mb-2">description</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Archivo listo en carpeta: {archivoPrevisualizar.carpeta}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {(archivoPrevisualizar.tamano / 1024).toFixed(1)} KB • {archivoPrevisualizar.tipo}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setArchivoPrevisualizar(null)}
                className="cp-btn cp-btn-secondary text-xs"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroFacturaProveedorPage;
