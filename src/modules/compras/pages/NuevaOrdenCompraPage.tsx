'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompras } from '../context/ComprasContext';
import {
  ORDEN_COMPRA_STEPS,
  REQUISICION_MAESTRA_INFO,
  REQUISICION_MAESTRA_ITEMS,
} from '../data/ordenCompraSteps';
import {
  SUBSIDIARIAS_CATALOG,
  UBICACIONES_CATALOG,
  APROBADORES_CATALOG,
  COMPRADORES_CATALOG,
  MONEDAS_CATALOG,
  PROVEEDORES_OC_CATALOG,
  ARTICULOS_CATALOG,
  DEPARTAMENTOS_CATALOG,
  CLIENTES_TRABAJO_CATALOG,
  ACTIVITY_CODES_CATALOG,
  type PartidaOrdenForm,
} from '../data/orden-compra-catalog';
import type { OrdenCompra, MonedaDivisa } from '../types';
import WizardStepper from '../components/WizardStepper';
import { FormWizardFooter } from '../components/FormWizardFooter';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../orden-compra-wizard.css';

interface ArchivoAdjuntoLocal {
  id: string;
  nombre: string;
  tamano: number;
  tipo: string;
  tipoDocumento: 'Cotización del proveedor' | 'Factura' | 'Comprobante' | 'Otro';
  url?: string;
}

// 20 Columnas de la tabla de partidas estilo NetSuite
export type ColumnaNetSuiteKey =
  | 'numArticulo'
  | 'articulo'
  | 'proveedorNombre'
  | 'descripcion'
  | 'departamento'
  | 'disponible'
  | 'recibido'
  | 'facturado'
  | 'cantidad'
  | 'precioUnitario'
  | 'importe'
  | 'opciones'
  | 'impBruto'
  | 'cerrado'
  | 'fechaReciboPrevista'
  | 'importeImpuestos'
  | 'clienteTrabajo'
  | 'activityCode'
  | 'refDetallesImpuestos'
  | 'acciones';

interface ColumnaConfig {
  key: ColumnaNetSuiteKey;
  label: string;
  required?: boolean;
}

const TODAS_LAS_COLUMNAS: ColumnaConfig[] = [
  { key: 'numArticulo', label: 'N° artículo' },
  { key: 'articulo', label: 'Artículo *', required: true },
  { key: 'proveedorNombre', label: 'Nombre del proveedor' },
  { key: 'descripcion', label: 'Descripción *', required: true },
  { key: 'departamento', label: 'Departamento' },
  { key: 'disponible', label: 'Disponible' },
  { key: 'recibido', label: 'Recibido' },
  { key: 'facturado', label: 'Facturado' },
  { key: 'cantidad', label: 'Cantidad *', required: true },
  { key: 'precioUnitario', label: 'V. unitario *', required: true },
  { key: 'importe', label: 'Importe' },
  { key: 'opciones', label: 'Opciones' },
  { key: 'impBruto', label: 'Imp. bruto' },
  { key: 'cerrado', label: 'Cerrado' },
  { key: 'fechaReciboPrevista', label: 'Fecha de recibo prevista *', required: true },
  { key: 'importeImpuestos', label: 'Importe de impuestos' },
  { key: 'clienteTrabajo', label: 'Cliente:Trabajo' },
  { key: 'activityCode', label: 'Activity Code' },
  { key: 'refDetallesImpuestos', label: 'Referencia detalles impuestos' },
  { key: 'acciones', label: 'Acciones' },
];

export const NuevaOrdenCompraPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const facturaRegistradaParam = searchParams?.get('facturaRegistrada') === 'true';
  const facturaFolioParam = searchParams?.get('facturaFolio') || '';

  const { agregarOrden, mostrarToast } = useCompras();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── ESTADO DEL WIZARD (5 PASOS DINÁMICOS) ──
  const [currentStep, setCurrentStep] = useState<number>(() => (facturaRegistradaParam ? 5 : 1));
  const [completedSteps, setCompletedSteps] = useState<number[]>(() =>
    facturaRegistradaParam ? [1, 2, 3, 4, 5] : []
  );
  const [isSaved, setIsSaved] = useState<boolean>(() => facturaRegistradaParam);
  const [isFacturaConcluida] = useState<boolean>(() => facturaRegistradaParam);
  const [showErrorBanner, setShowErrorBanner] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Modales y menús
  const [isModalProveedoresOpen, setIsModalProveedoresOpen] = useState(false);
  const [isMenuAccionesOpen, setIsMenuAccionesOpen] = useState(false);
  const [isMenuColumnasOpen, setIsMenuColumnasOpen] = useState(false);
  const [isDialogCancelarOpen, setIsDialogCancelarOpen] = useState(false);
  const [isDialogAnularOpen, setIsDialogAnularOpen] = useState(false);
  const [isDialogConfirmarGuardarOpen, setIsDialogConfirmarGuardarOpen] = useState(false);
  const [modalOpcionesItem, setModalOpcionesItem] = useState<PartidaOrdenForm | null>(null);

  // ── PASO 1: PROVEEDOR ──
  const fechaHoyStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const [folioOrden] = useState('PO-2026-0174');
  const [subsidiaria, setSubsidiaria] = useState('SIFYGSA Fire & Gas S.A. de C.V.');
  const [proveedorBusqueda, setProveedorBusqueda] = useState('FIVE PEAKS MÉXICO SA DE CV');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(() => {
    return (
      PROVEEDORES_OC_CATALOG.find((p) => p.v.includes('FIVE PEAKS')) ||
      PROVEEDORES_OC_CATALOG[0]
    );
  });
  const [isProveedorDropdownOpen, setIsProveedorDropdownOpen] = useState(false);

  const [moneda, setMoneda] = useState<string>('MXN');
  const [tipoCambio, setTipoCambio] = useState<string>('1.00');
  const [filtroModalProveedor, setFiltroModalProveedor] = useState('');

  // ── PASO 2: CONDICIONES Y CLASIFICACIÓN ──
  const [tipoCondicion, setTipoCondicion] = useState<'Contado' | 'Crédito'>('Contado');
  const [diasCredito, setDiasCredito] = useState<number>(15);
  const [notaOrden, setNotaOrden] = useState(
    'PO-2026-0174 - Condiciones de pago: Contado comercial - Suministro para obra Tenaris Tamsa.'
  );
  const [recibidoPor, setRecibidoPor] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [reqContrato, setReqContrato] = useState(REQUISICION_MAESTRA_INFO.codigo);
  const [ubicacion, setUbicacion] = useState('SFG-C259-TAM (Tenaris Tamsa - Veracruz)');
  const [noOrdenCompra, setNoOrdenCompra] = useState('OC-SFG-C259-127');
  const [estadoAprobacion, setEstadoAprobacion] = useState('Aprobado');
  const [proximoAprobador, setProximoAprobador] = useState(APROBADORES_CATALOG[0]);

  // Sección colapsable "Más campos"
  const [isMasCamposOpen, setIsMasCamposOpen] = useState(false);
  const [adNumeroContrato, setAdNumeroContrato] = useState('CTR-2026-TAM-088');
  const [contrato, setContrato] = useState('Tenaris Tamsa Contrato Marco 2026');
  const [contratoCompra, setContratoCompra] = useState('CC-TT-VER-024');
  const [adRequisicionContrato, setAdRequisicionContrato] = useState('AD-RQ-127-REV02');
  const [fechaRevision, setFechaRevision] = useState('2026-11-10');
  const [comprador, setComprador] = useState(COMPRADORES_CATALOG[0]);
  const [fechaAprobacionDG, setFechaAprobacionDG] = useState(
    REQUISICION_MAESTRA_INFO.fechaAprobacionDG
  );

  // ── PASO 3: PARTIDAS (TABLA EDITABLE ESTILO NETSUITE) ──
  // Partidas iniciales cargadas de la requisición
  const [partidas, setPartidas] = useState<PartidaOrdenForm[]>(() => {
    return REQUISICION_MAESTRA_ITEMS.map((it, idx) => ({
      ...it,
      numArticulo: idx + 1,
      proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
      departamento: 'Dirección : Compras',
      recibido: 0,
      facturado: 0,
      opciones: 'Normal',
      cerrado: false,
      fechaReciboPrevista: '2026-11-25',
      clienteTrabajo: 'SFG-C259-TAM Tenaris Tamsa : Obra Principal',
      activityCode: it.activityCode || 'Paquetería',
      refDetallesImpuestos: `1194487_${idx + 1}`,
      importe: (it.q || 0) * (it.p || 0),
      importeBruto: (it.q || 0) * (it.p || 0) * 1.16,
      importeImpuestos: (it.q || 0) * (it.p || 0) * 0.16,
    }));
  });

  // Configuración de visibilidad de columnas (visibles por defecto para no saturar)
  const [columnasVisibles, setColumnasVisibles] = useState<Record<ColumnaNetSuiteKey, boolean>>({
    numArticulo: true,
    articulo: true,
    proveedorNombre: false,
    descripcion: true,
    departamento: false,
    disponible: false,
    recibido: false,
    facturado: false,
    cantidad: true,
    precioUnitario: true,
    importe: true,
    opciones: false,
    impBruto: true,
    cerrado: false,
    fechaReciboPrevista: true,
    importeImpuestos: false,
    clienteTrabajo: false,
    activityCode: false,
    refDetallesImpuestos: false,
    acciones: true,
  });

  const toggleColumna = (key: ColumnaNetSuiteKey) => {
    setColumnasVisibles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Fila de embarque activa
  const tieneEmbarque = useMemo(() => {
    return partidas.some((it) => it.c === 'EMBARQUE' || it.articuloNombre === 'EMBARQUE');
  }, [partidas]);

  // Cálculos de subtotales y totales en tiempo real
  const subtotalArticulos = useMemo(() => {
    return partidas
      .filter((it) => it.c !== 'EMBARQUE')
      .reduce((acc, it) => acc + (Number(it.q) || 0) * (Number(it.p) || 0), 0);
  }, [partidas]);

  const subtotalGastos = useMemo(() => {
    return partidas
      .filter((it) => it.c === 'EMBARQUE')
      .reduce((acc, it) => acc + (Number(it.q) || 0) * (Number(it.p) || 0), 0);
  }, [partidas]);

  const subtotalGeneral = useMemo(() => {
    return subtotalArticulos + subtotalGastos;
  }, [subtotalArticulos, subtotalGastos]);

  const impuestosGenerales = useMemo(() => {
    return subtotalGeneral * 0.16;
  }, [subtotalGeneral]);

  const totalGeneral = useMemo(() => {
    return subtotalGeneral + impuestosGenerales;
  }, [subtotalGeneral, impuestosGenerales]);

  // ── OPERACIONES DE TABLA ──
  // 1. Agregar partida vacía
  const handleAgregarPartida = () => {
    const ultimo = partidas[partidas.length - 1];
    const nuevaFecha = ultimo?.fechaReciboPrevista || recibidoPor;
    const nuevoCliente = ultimo?.clienteTrabajo || 'SFG-C259-TAM Tenaris Tamsa : Obra Principal';
    const nuevoNum = partidas.length + 1;

    const nueva: PartidaOrdenForm = {
      id: `partida-custom-${Date.now()}`,
      numArticulo: nuevoNum,
      c: 'DET-UVIR-01',
      articuloNombre: 'Detector Óptico de Flama UV/IR',
      d: 'Detector Óptico de Flama UV/IR Industrial Det-Tronics',
      n: '',
      on: true,
      q: 1,
      p: 34500.0,
      unidad: 'Pza',
      proveedorNombre: proveedorSeleccionado.v,
      departamento: 'Dirección : Compras',
      disponible: 1,
      recibido: 0,
      facturado: 0,
      opciones: 'Normal',
      cerrado: false,
      fechaReciboPrevista: nuevaFecha,
      clienteTrabajo: nuevoCliente,
      activityCode: 'Instrumentación',
      refDetallesImpuestos: `1194487_${nuevoNum}`,
      importe: 34500.0,
      importeBruto: 34500.0 * 1.16,
      importeImpuestos: 34500.0 * 0.16,
    };

    setPartidas((prev) => [...prev, nueva]);
    mostrarToast('Nueva partida agregada al final de la tabla.', 'info');
  };

  // 2. Agregar embarque
  const handleAgregarEmbarque = () => {
    if (tieneEmbarque) return;

    const ultimo = partidas[partidas.length - 1];
    const nuevaFecha = ultimo?.fechaReciboPrevista || recibidoPor;
    const nuevoCliente = ultimo?.clienteTrabajo || 'SFG-C259-TAM Tenaris Tamsa : Obra Principal';
    const nuevoNum = partidas.length + 1;

    const embarqueItem: PartidaOrdenForm = {
      id: `partida-embarque-${Date.now()}`,
      numArticulo: nuevoNum,
      c: 'EMBARQUE',
      articuloNombre: 'EMBARQUE',
      d: 'Servicio de Flete y Embarque Especializado en Sitio',
      n: 'Flete incluido en cotización',
      on: true,
      q: 1,
      maxCantidad: 1,
      p: 850.0,
      unidad: 'Servicio',
      proveedorNombre: proveedorSeleccionado.v,
      departamento: 'Dirección : Compras',
      disponible: 1,
      recibido: 0,
      facturado: 0,
      opciones: 'Normal',
      cerrado: false,
      fechaReciboPrevista: nuevaFecha,
      clienteTrabajo: nuevoCliente,
      activityCode: 'Apoyo Logístico',
      refDetallesImpuestos: `1194487_${nuevoNum}`,
      importe: 850.0,
      importeBruto: 850.0 * 1.16,
      importeImpuestos: 850.0 * 0.16,
    };

    setPartidas((prev) => [...prev, embarqueItem]);
    mostrarToast('Partida de Embarque agregada a la orden.', 'info');
  };

  // 3. Eliminar partida
  const handleEliminarPartida = (id: string) => {
    setPartidas((prev) => {
      const filtradas = prev.filter((p) => p.id !== id);
      // Re-numerar consecutivo N° artículo
      return filtradas.map((p, idx) => ({
        ...p,
        numArticulo: idx + 1,
        refDetallesImpuestos: `1194487_${idx + 1}`,
      }));
    });
  };

  // 4. Modificar celda de partida
  const handleUpdatePartida = (id: string, patch: Partial<PartidaOrdenForm>) => {
    setPartidas((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;

        const actualizada = { ...it, ...patch };
        const q = Math.max(Number(actualizada.q) || 0, 0);
        const p = Math.max(Number(actualizada.p) || 0, 0);
        actualizada.importe = q * p;
        actualizada.importeImpuestos = q * p * 0.16;
        actualizada.importeBruto = q * p * 1.16;
        return actualizada;
      })
    );
  };

  // ── PASO 4: REVISIÓN Y ARCHIVOS ADJUNTOS ──
  const [isVerDetallePartidasOpen, setIsVerDetallePartidasOpen] = useState(false);
  const [montoCotizacionProveedor, setMontoCotizacionProveedor] = useState<number>(() => totalGeneral);

  const coincideCotizacion = useMemo(() => {
    return Math.abs(Number(montoCotizacionProveedor) - totalGeneral) < 0.05;
  }, [montoCotizacionProveedor, totalGeneral]);

  // Archivos adjuntos
  const [archivos, setArchivos] = useState<ArchivoAdjuntoLocal[]>([
    {
      id: 'file-1',
      nombre: 'Cotizacion_FivePeaks_COT-FP-2026-0173.pdf',
      tamano: 1420000,
      tipo: 'application/pdf',
      tipoDocumento: 'Cotización del proveedor',
    },
    {
      id: 'file-2',
      nombre: 'Requisicion_Autorizada_DG_127.pdf',
      tamano: 890000,
      tipo: 'application/pdf',
      tipoDocumento: 'Comprobante',
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // ── VALIDACIONES POR PASO ──
  const validarPaso = (stepNum: number): { valido: boolean; errores: string[] } => {
    const errs: string[] = [];

    if (stepNum === 1) {
      if (!subsidiaria.trim()) errs.push('La subsidiaria es obligatoria.');
      if (!proveedorSeleccionado || !proveedorBusqueda.trim()) {
        errs.push('Debe seleccionar un proveedor adjudicado.');
      }
      if (!moneda) errs.push('Debe especificar la moneda.');
    } else if (stepNum === 2) {
      if (!recibidoPor) errs.push('La fecha de arribo "Recibido por" es obligatoria.');
      if (!reqContrato.trim()) errs.push('El campo "Req. contrato" es obligatorio.');
      if (!ubicacion.trim()) errs.push('La ubicación de entrega es obligatoria.');
      if (!noOrdenCompra.trim()) errs.push('El número de orden de compra es obligatorio.');
      if (!estadoAprobacion.trim()) errs.push('El estado de aprobación es obligatorio.');
      if (!proximoAprobador.trim()) errs.push('El próximo aprobador es obligatorio.');
    } else if (stepNum === 3) {
      if (partidas.length === 0) {
        errs.push('Debe tener al menos una partida en la orden de compra.');
      }

      partidas.forEach((it, idx) => {
        const qty = Number(it.q) || 0;
        const maxQ = Number(it.maxCantidad);
        const p = Number(it.p) || 0;

        if (!it.c?.trim()) {
          errs.push(`Fila ${idx + 1}: Debe seleccionar un Artículo.`);
        }
        if (!it.d?.trim()) {
          errs.push(`Fila ${idx + 1}: La Descripción es obligatoria.`);
        }
        if (qty <= 0) {
          errs.push(`Fila ${idx + 1} (${it.c}): La Cantidad debe ser mayor a 0.`);
        }
        if (maxQ && qty > maxQ) {
          errs.push(
            `Fila ${idx + 1} (${it.c}): No se puede incrementar la cantidad solicitada (Máximo: ${maxQ} ${it.unidad}).`
          );
        }
        if (p <= 0) {
          errs.push(`Fila ${idx + 1} (${it.c}): El V. unitario es obligatorio y debe ser mayor a 0.`);
        }
        if (!it.fechaReciboPrevista) {
          errs.push(`Fila ${idx + 1} (${it.c}): La Fecha de recibo prevista es obligatoria.`);
        }
      });
    }

    return { valido: errs.length === 0, errores: errs };
  };

  const errorSteps = useMemo(() => {
    const errList: number[] = [];
    if (completedSteps.includes(1) || currentStep > 1) {
      if (!validarPaso(1).valido) errList.push(1);
    }
    if (completedSteps.includes(2) || currentStep > 2) {
      if (!validarPaso(2).valido) errList.push(2);
    }
    if (completedSteps.includes(3) || currentStep > 3) {
      if (!validarPaso(3).valido) errList.push(3);
    }
    return errList;
  }, [
    completedSteps,
    currentStep,
    subsidiaria,
    proveedorSeleccionado,
    proveedorBusqueda,
    moneda,
    recibidoPor,
    reqContrato,
    ubicacion,
    noOrdenCompra,
    estadoAprobacion,
    proximoAprobador,
    partidas,
  ]);

  const estadoPasoActual = useMemo(() => {
    return validarPaso(currentStep);
  }, [
    currentStep,
    subsidiaria,
    proveedorSeleccionado,
    proveedorBusqueda,
    moneda,
    recibidoPor,
    reqContrato,
    ubicacion,
    noOrdenCompra,
    estadoAprobacion,
    proximoAprobador,
    partidas,
  ]);

  // Manejo de avance de paso
  const handleContinuar = () => {
    const res = estadoPasoActual;
    if (!res.valido) {
      setErrorMessages(res.errores);
      setShowErrorBanner(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setShowErrorBanner(false);
    setErrorMessages([]);

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAtras = () => {
    if (currentStep > 1 && !isSaved) {
      setShowErrorBanner(false);
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Guardar orden de compra (Paso 4)
  const ejecutarGuardarOrden = () => {
    const fechaActual = new Date().toISOString().split('T')[0];

    const nuevaOC: OrdenCompra = {
      id: `oc-${Date.now()}`,
      folio: folioOrden,
      proveedorId: proveedorSeleccionado?.rfc || 'PROV-001',
      proveedorNombre: proveedorSeleccionado?.v || proveedorBusqueda,
      proveedorRfc: proveedorSeleccionado?.rfc || 'FPM130918MPA',
      fechaEmision: fechaActual,
      fechaEntrega: recibidoPor,
      moneda: (moneda.split(' ')[0] as MonedaDivisa) || 'MXN',
      tipoCambio: Number(tipoCambio) || 1.0,
      subtotal: subtotalGeneral,
      descuento: 0,
      iva: impuestosGenerales,
      total: totalGeneral,
      estatus: 'abierta',
      condicionPago:
        tipoCondicion === 'Crédito' ? `Crédito ${diasCredito} días` : 'Contado comercial',
      subsidiaria: subsidiaria,
      solicitante: comprador,
      departamento: 'Dirección : Compras',
      almacenDestino: ubicacion,
      proyectoId: 'SFG-C259',
      contratoProyecto: reqContrato,
      notas: notaOrden,
      items: partidas.map((it, idx) => ({
        id: `item-${idx + 1}`,
        partida: idx + 1,
        codigo: it.c,
        descripcion: it.d,
        cantidad: it.q,
        unidad: it.unidad || 'Pza',
        precioUnitario: it.p,
        descuentoPorcentaje: 0,
        subtotal: it.q * it.p,
        ivaMonto: it.q * it.p * 0.16,
        totalPartida: it.q * it.p * 1.16,
      })),
    };

    agregarOrden(nuevaOC);
    setIsSaved(true);
    setCompletedSteps([1, 2, 3, 4]);
    setCurrentStep(5);

    mostrarToast(
      `Orden de compra ${folioOrden} generada exitosamente. Continúa al registro fiscal de factura.`,
      'success'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarOrden = () => {
    if (!coincideCotizacion) {
      setIsDialogConfirmarGuardarOpen(true);
      return;
    }
    ejecutarGuardarOrden();
  };

  // Manejo de archivos
  const handleFilesDropped = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const permitidos = ['.pdf', '.xml', '.jpg', '.jpeg', '.png', '.xlsx'];
    const nuevos: ArchivoAdjuntoLocal[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!permitidos.includes(ext)) {
        mostrarToast(`El formato ${ext} no está permitido. Solo PDF, XML, JPG, PNG o XLSX.`, 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        mostrarToast(`El archivo ${file.name} excede el límite de 10 MB.`, 'error');
        return;
      }

      nuevos.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nombre: file.name,
        tamano: file.size,
        tipo: file.type || ext,
        tipoDocumento: file.name.toLowerCase().includes('factura')
          ? 'Factura'
          : file.name.toLowerCase().includes('cotiz')
            ? 'Cotización del proveedor'
            : 'Comprobante',
      });
    });

    if (nuevos.length > 0) {
      setArchivos((prev) => [...prev, ...nuevos]);
      mostrarToast(`${nuevos.length} archivo(s) agregado(s) correctamente.`, 'info');
    }
  };

  const eliminarArchivo = (id: string) => {
    setArchivos((prev) => prev.filter((a) => a.id !== id));
  };

  const formatearBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDinero = (val: number, cur: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: cur === 'USD' ? 'USD' : 'MXN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="oc-wizard-container">
      {/* ── BARRA SUPERIOR: ENCABEZADO Y ACCIONES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/compras/ordenes"
              className="text-primary hover:underline text-xs flex items-center gap-1 font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver a Órdenes de Compra
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-primary text-[28px]">
              shopping_cart_checkout
            </span>
            Nueva Orden de Compra
          </h1>
        </div>

        {/* Menú de Módulos Compras / Proveedores y Menú de Acciones */}
        <div className="flex items-center gap-2 relative">
          <ModuleMenu />
          <button
            type="button"
            className="oc-collapsible-btn"
            onClick={() => setIsMenuAccionesOpen((prev) => !prev)}
            aria-expanded={isMenuAccionesOpen}
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
            Acciones
          </button>

          {isMenuAccionesOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 py-1.5 animation-fadeIn"
              role="menu"
            >
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                onClick={() => {
                  setIsMenuAccionesOpen(false);
                  setIsDialogAnularOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                Anular orden de compra
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── INDICADOR DE PASOS (PARTE SUPERIOR, SIEMPRE VISIBLE) ── */}
      <WizardStepper
        steps={ORDEN_COMPRA_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        errorSteps={errorSteps}
        isSaved={isSaved}
        isCompletedAll={isFacturaConcluida}
        isCurrentStepValid={estadoPasoActual.valido}
        successBannerText={
          isFacturaConcluida
            ? `Factura ${facturaFolioParam || 'fiscal CFDI 4.0'} vinculada con éxito. Proceso de orden de compra concluido al 100%.`
            : undefined
        }
        onStepClick={(stepNum) => {
          if (!isSaved && !isFacturaConcluida) {
            if (stepNum > currentStep && !estadoPasoActual.valido) {
              setErrorMessages(estadoPasoActual.errores);
              setShowErrorBanner(true);
              return;
            }
            if (completedSteps.includes(stepNum) || stepNum === currentStep || stepNum < currentStep) {
              setCurrentStep(stepNum);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }}
      />

      {/* Banner de Errores de Validación */}
      {showErrorBanner && errorMessages.length > 0 && (
        <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] text-red-600 flex-shrink-0">
            error
          </span>
          <div className="flex-1">
            <strong className="block mb-1">Por favor complete los campos obligatorios:</strong>
            <ul className="list-disc list-inside space-y-0.5">
              {errorMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setShowErrorBanner(false)}
            className="text-red-500 hover:text-red-700"
            aria-label="Cerrar alerta"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          PASO 1 – PROVEEDOR
          (Sin partidas de requisición, únicamente datos de proveedor y moneda)
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="oc-card animation-fadeIn">
          {/* Encabezado del paso con datos de solo lectura en texto pequeño */}
          <div className="oc-step-header-meta">
            <div>
              <span>Fecha del día: </span>
              <strong>{fechaHoyStr}</strong>
            </div>
            <div>
              <span>N.º de pedido: </span>
              <strong>Se generará al guardar ({folioOrden})</strong>
            </div>
            <div>
              <span>Requisición de origen: </span>
              <strong>{REQUISICION_MAESTRA_INFO.codigo} (autorizada por DG)</strong>
            </div>
          </div>

          <div className="oc-form-grid">
            {/* Subsidiaria */}
            <div className="oc-field-group">
              <label htmlFor="oc-subsidiaria" className="oc-label">
                Subsidiaria <span className="text-red-500">*</span>
              </label>
              <select
                id="oc-subsidiaria"
                className="oc-input"
                value={subsidiaria}
                onChange={(e) => setSubsidiaria(e.target.value)}
                disabled={isSaved}
              >
                {SUBSIDIARIAS_CATALOG.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda de Proveedor */}
            <div className="oc-field-group relative">
              <div className="flex items-center justify-between">
                <label htmlFor="oc-proveedor" className="oc-label">
                  Proveedor Adjudicado <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  onClick={() => setIsModalProveedoresOpen(true)}
                  disabled={isSaved}
                >
                  <span className="material-symbols-outlined text-[15px]">list</span>
                  Ver lista
                </button>
              </div>

              <div className="oc-input-wrapper">
                <input
                  id="oc-proveedor"
                  type="text"
                  className="oc-input"
                  placeholder="Escriba para buscar proveedor o RFC..."
                  value={proveedorBusqueda}
                  onChange={(e) => {
                    setProveedorBusqueda(e.target.value);
                    setIsProveedorDropdownOpen(true);
                  }}
                  onFocus={() => setIsProveedorDropdownOpen(true)}
                  disabled={isSaved}
                  autoComplete="off"
                />
                <span className="material-symbols-outlined absolute right-2.5 text-[20px] text-muted pointer-events-none">
                  search
                </span>
              </div>

              {/* Dropdown flotante con filtro */}
              {isProveedorDropdownOpen && !isSaved && (
                <div className="oc-combobox-dropdown">
                  {PROVEEDORES_OC_CATALOG.filter((p) =>
                    `${p.v} ${p.rfc}`.toLowerCase().includes(proveedorBusqueda.toLowerCase())
                  ).slice(0, 8).map((p) => (
                    <div
                      key={p.rfc}
                      className="p-2.5 hover:bg-primary/10 cursor-pointer text-xs border-b border-[var(--border)] last:border-b-0"
                      onClick={() => {
                        setProveedorSeleccionado(p);
                        setProveedorBusqueda(p.v);
                        setIsProveedorDropdownOpen(false);
                      }}
                    >
                      <div className="font-bold text-on-surface">{p.v}</div>
                      <div className="text-[11px] text-muted">
                        RFC: {p.rfc} • {p.ct} • Pago: {p.pay}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tarjeta pequeña con proveedor seleccionado */}
              {proveedorSeleccionado && (
                <div className="oc-provider-selected-card">
                  <div>
                    <div className="oc-provider-card-name">
                      {proveedorSeleccionado.v}
                    </div>
                    <div className="oc-provider-card-meta">
                      RFC: {proveedorSeleccionado.rfc} • {proveedorSeleccionado.ct}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-green-500 text-[20px]">
                    verified
                  </span>
                </div>
              )}
            </div>

            {/* Moneda y Tipo de Cambio */}
            <div className="oc-field-group">
              <label htmlFor="oc-moneda" className="oc-label">
                Moneda <span className="text-red-500">*</span>
              </label>
              <select
                id="oc-moneda"
                className="oc-input"
                value={moneda}
                onChange={(e) => {
                  const val = e.target.value;
                  setMoneda(val);
                  if (val === 'MXN') setTipoCambio('1.00');
                  else if (val === 'USD') setTipoCambio('18.50');
                  else if (val === 'EUR') setTipoCambio('20.10');
                }}
                disabled={isSaved}
              >
                {MONEDAS_CATALOG.map((m) => (
                  <option key={m} value={m.split(' ')[0]}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="oc-field-group">
              <label htmlFor="oc-tipo-cambio" className="oc-label">
                Tipo de Cambio
              </label>
              <input
                id="oc-tipo-cambio"
                type="text"
                className={`oc-input ${moneda === 'MXN' ? 'readonly' : ''}`}
                value={tipoCambio}
                onChange={(e) => setTipoCambio(e.target.value)}
                readOnly={moneda === 'MXN' || isSaved}
              />
              <span className="text-[11px] text-muted">
                {moneda === 'MXN'
                  ? 'Fijo 1.00 en Moneda Nacional.'
                  : 'Editable según tipo de cambio de la cotización.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 2 – CONDICIONES Y CLASIFICACIÓN
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="oc-card animation-fadeIn">
          <div className="oc-card-header">
            <h2 className="oc-card-title">
              <span className="material-symbols-outlined text-primary">gavel</span>
              Condiciones Comerciales y Clasificación
            </h2>
            <span className="oc-card-req-hint">Campos con * son obligatorios</span>
          </div>

          <div className="oc-form-grid">
            {/* SECCIÓN CONDICIONES */}
            <div className="oc-field-group">
              <label htmlFor="oc-condicion-pago" className="oc-label">
                Condición de Pago <span className="text-red-500">*</span>
              </label>
              <select
                id="oc-condicion-pago"
                className="oc-input"
                value={tipoCondicion}
                onChange={(e) => {
                  const val = e.target.value as 'Contado' | 'Crédito';
                  setTipoCondicion(val);
                  setNotaOrden(
                    `${folioOrden} - Condiciones de pago: ${val === 'Crédito' ? `Crédito ${diasCredito} días` : 'Contado comercial'
                    } - Suministro para obra Tenaris Tamsa.`
                  );
                }}
                disabled={isSaved}
              >
                <option value="Contado">Contado comercial</option>
                <option value="Crédito">Crédito a plazo</option>
              </select>
            </div>

            {tipoCondicion === 'Crédito' ? (
              <div className="oc-field-group">
                <label htmlFor="oc-dias-credito" className="oc-label">
                  Días de Crédito <span className="text-red-500">*</span>
                </label>
                <input
                  id="oc-dias-credito"
                  type="number"
                  min="1"
                  max="120"
                  className="oc-input"
                  value={diasCredito}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setDiasCredito(d);
                    setNotaOrden(
                      `${folioOrden} - Condiciones de pago: Crédito ${d} días - Suministro para obra Tenaris Tamsa.`
                    );
                  }}
                  disabled={isSaved}
                />
              </div>
            ) : (
              <div className="oc-field-group">
                <label htmlFor="oc-recibido-por" className="oc-label">
                  Recibido por (Fecha de arribo) <span className="text-red-500">*</span>
                </label>
                <input
                  id="oc-recibido-por"
                  type="date"
                  className="oc-input"
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  disabled={isSaved}
                />
              </div>
            )}

            {tipoCondicion === 'Crédito' && (
              <div className="oc-field-group">
                <label htmlFor="oc-recibido-por-cred" className="oc-label">
                  Recibido por (Fecha de arribo) <span className="text-red-500">*</span>
                </label>
                <input
                  id="oc-recibido-por-cred"
                  type="date"
                  className="oc-input"
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  disabled={isSaved}
                />
              </div>
            )}

            <div className="oc-field-group">
              <label htmlFor="oc-req-contrato" className="oc-label">
                Req. contrato <span className="text-red-500">*</span>
              </label>
              <input
                id="oc-req-contrato"
                type="text"
                className="oc-input"
                value={reqContrato}
                onChange={(e) => setReqContrato(e.target.value)}
                disabled={isSaved}
              />
            </div>

            <div className="oc-col-span-full">
              <label htmlFor="oc-nota-orden" className="oc-label">
                Nota de la Orden
              </label>
              <textarea
                id="oc-nota-orden"
                className="oc-textarea"
                rows={2}
                value={notaOrden}
                onChange={(e) => setNotaOrden(e.target.value)}
                disabled={isSaved}
              />
            </div>

            {/* SECCIÓN CLASIFICACIÓN Y APROBACIÓN */}
            <div className="oc-field-group">
              <label htmlFor="oc-ubicacion" className="oc-label">
                Ubicación (Almacén del contrato) <span className="text-red-500">*</span>
              </label>
              <select
                id="oc-ubicacion"
                className="oc-input"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                disabled={isSaved}
              >
                {UBICACIONES_CATALOG.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="oc-field-group">
              <label htmlFor="oc-num-orden" className="oc-label">
                No. de orden de compra <span className="text-red-500">*</span>
              </label>
              <input
                id="oc-num-orden"
                type="text"
                className="oc-input"
                value={noOrdenCompra}
                onChange={(e) => setNoOrdenCompra(e.target.value)}
                disabled={isSaved}
              />
            </div>

            <div className="oc-field-group">
              <label htmlFor="oc-estado-aprobacion" className="oc-label">
                Estado de aprobación <span className="text-red-500">*</span>
              </label>
              <select
                id="oc-estado-aprobacion"
                className="oc-input"
                value={estadoAprobacion}
                onChange={(e) => setEstadoAprobacion(e.target.value)}
                disabled={isSaved}
              >
                <option value="Aprobado">Aprobado</option>
                <option value="Pendiente de Autorización">Pendiente de Autorización</option>
                <option value="Borrador / En Captura">Borrador / En Captura</option>
              </select>
            </div>

            <div className="oc-field-group">
              <label htmlFor="oc-proximo-aprobador" className="oc-label">
                Próximo aprobador <span className="text-red-500">*</span>
              </label>
              <select
                id="oc-proximo-aprobador"
                className="oc-input"
                value={proximoAprobador}
                onChange={(e) => setProximoAprobador(e.target.value)}
                disabled={isSaved}
              >
                {APROBADORES_CATALOG.map((ap) => (
                  <option key={ap} value={ap}>
                    {ap}
                  </option>
                ))}
              </select>
            </div>

            {/* SECCIÓN COLAPSABLE "MÁS CAMPOS" */}
            <div className="oc-col-span-full mt-2">
              <button
                type="button"
                className="oc-collapsible-btn"
                onClick={() => setIsMasCamposOpen((prev) => !prev)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isMasCamposOpen ? 'expand_less' : 'expand_more'}
                </span>
                {isMasCamposOpen ? 'Ocultar campos adicionales' : 'Más campos (Contrato y DG)'}
              </button>

              {isMasCamposOpen && (
                <div className="oc-collapsible-box oc-form-grid mt-3">
                  <div className="oc-field-group">
                    <label className="oc-label">AD - Número de contrato</label>
                    <input
                      type="text"
                      className="oc-input"
                      value={adNumeroContrato}
                      onChange={(e) => setAdNumeroContrato(e.target.value)}
                    />
                  </div>
                  <div className="oc-field-group">
                    <label className="oc-label">Contrato</label>
                    <input
                      type="text"
                      className="oc-input"
                      value={contrato}
                      onChange={(e) => setContrato(e.target.value)}
                    />
                  </div>
                  <div className="oc-field-group">
                    <label className="oc-label">Contrato de compra</label>
                    <input
                      type="text"
                      className="oc-input"
                      value={contratoCompra}
                      onChange={(e) => setContratoCompra(e.target.value)}
                    />
                  </div>
                  <div className="oc-field-group">
                    <label className="oc-label">AD - Requisición de contrato</label>
                    <input
                      type="text"
                      className="oc-input"
                      value={adRequisicionContrato}
                      onChange={(e) => setAdRequisicionContrato(e.target.value)}
                    />
                  </div>
                  <div className="oc-field-group">
                    <label className="oc-label">Fecha de revisión</label>
                    <input
                      type="date"
                      className="oc-input"
                      value={fechaRevision}
                      onChange={(e) => setFechaRevision(e.target.value)}
                    />
                  </div>
                  <div className="oc-field-group">
                    <label className="oc-label">Comprador</label>
                    <select
                      className="oc-input"
                      value={comprador}
                      onChange={(e) => setComprador(e.target.value)}
                    >
                      {COMPRADORES_CATALOG.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="oc-field-group">
                    <label className="oc-label">Fecha de aprobación de DG</label>
                    <input
                      type="date"
                      className="oc-input"
                      value={fechaAprobacionDG}
                      onChange={(e) => setFechaAprobacionDG(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 3 – PARTIDAS (TABLA EDITABLE ESTILO NETSUITE)
          ========================================================================= */}
      {currentStep === 3 && (
        <div className="oc-card p-0 overflow-hidden animation-fadeIn">
          {/* BARRA SUPERIOR DE LA TABLA (HEADER NETSUITE) */}
          <div className="ns-table-toolbar">
            <div className="ns-table-toolbar-left">
              <span className="ns-badge-subtotal">
                Artículos {formatDinero(subtotalArticulos, moneda)}
              </span>
              <span className="text-muted">•</span>
              <span className="ns-badge-gastos">
                Gastos {formatDinero(subtotalGastos, moneda)}
              </span>

              {/* Botón primario: + Agregar partida */}
              <button
                type="button"
                className="cp-btn cp-btn-primary py-1 px-3 text-xs"
                onClick={handleAgregarPartida}
                disabled={isSaved}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Agregar partida
              </button>

              {/* Botón secundario: + Agregar embarque */}
              <button
                type="button"
                className={`cp-btn cp-btn-secondary py-1 px-3 text-xs ${tieneEmbarque ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                onClick={handleAgregarEmbarque}
                disabled={tieneEmbarque || isSaved}
                title={tieneEmbarque ? 'Ya se agregó el embarque' : 'Agregar servicio de flete/embarque'}
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                Agregar embarque
              </button>
            </div>

            <div className="ns-table-toolbar-right">
              {/* Botón Columnas con menú de selección */}
              <div className="ns-columns-menu-container">
                <button
                  type="button"
                  className="cp-btn cp-btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                  onClick={() => setIsMenuColumnasOpen((prev) => !prev)}
                  title="Mostrar u ocultar columnas de la tabla"
                >
                  <span className="material-symbols-outlined text-[16px]">view_column</span>
                  Columnas
                </button>

                {isMenuColumnasOpen && (
                  <div className="ns-columns-dropdown">
                    <div className="text-[11px] font-bold text-muted uppercase px-2 py-1 border-b border-[var(--border)] mb-1">
                      Columnas visibles
                    </div>
                    {TODAS_LAS_COLUMNAS.map((col) => (
                      <label key={col.key} className="ns-column-item-toggle">
                        <input
                          type="checkbox"
                          checked={columnasVisibles[col.key]}
                          onChange={() => toggleColumna(col.key)}
                          disabled={col.required}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                {partidas.length} {partidas.length === 1 ? 'partida' : 'partidas'}
              </span>
            </div>
          </div>

          {/* TABLA PRINCIPAL NETSUITE CON SCROLL HORIZONTAL Y COLUMNAS STICKY */}
          <div className="ns-table-main-wrapper">
            {partidas.length === 0 ? (
              <div className="p-12 text-center text-muted">
                <span className="material-symbols-outlined text-[48px] text-muted mb-2 block">
                  remove_shopping_cart
                </span>
                <p className="font-bold text-sm text-on-surface">Aún no hay partidas</p>
                <p className="text-xs mt-1">Haga clic en el botón de abajo para comenzar a capturar artículos.</p>
                <button
                  type="button"
                  className="cp-btn cp-btn-primary mt-3 text-xs"
                  onClick={handleAgregarPartida}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Agregar partida
                </button>
              </div>
            ) : (
              <table className="ns-grid-table">
                <thead>
                  <tr>
                    {columnasVisibles.numArticulo && (
                      <th className="ns-sticky-col-num">N°</th>
                    )}
                    {columnasVisibles.articulo && (
                      <th className="ns-sticky-col-art">Artículo *</th>
                    )}
                    {columnasVisibles.descripcion && (
                      <th className="ns-sticky-col-desc">Descripción *</th>
                    )}
                    {columnasVisibles.proveedorNombre && <th>Nombre del proveedor</th>}
                    {columnasVisibles.departamento && <th>Departamento</th>}
                    {columnasVisibles.disponible && <th>Disponible</th>}
                    {columnasVisibles.recibido && <th>Recibido</th>}
                    {columnasVisibles.facturado && <th>Facturado</th>}
                    {columnasVisibles.cantidad && <th>Cantidad *</th>}
                    {columnasVisibles.precioUnitario && <th>V. unitario *</th>}
                    {columnasVisibles.importe && <th>Importe</th>}
                    {columnasVisibles.opciones && <th>Opciones</th>}
                    {columnasVisibles.impBruto && <th>Imp. bruto</th>}
                    {columnasVisibles.cerrado && <th>Cerrado</th>}
                    {columnasVisibles.fechaReciboPrevista && <th>Fecha recibo prevista *</th>}
                    {columnasVisibles.importeImpuestos && <th>Imp. Impuestos</th>}
                    {columnasVisibles.clienteTrabajo && <th>Cliente:Trabajo</th>}
                    {columnasVisibles.activityCode && <th>Activity Code</th>}
                    {columnasVisibles.refDetallesImpuestos && <th>Ref. Impuestos</th>}
                    {columnasVisibles.acciones && (
                      <th className="ns-sticky-col-actions">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {partidas.map((item, index) => {
                    const isQtyExceeded =
                      Boolean(item.maxCantidad) && (Number(item.q) || 0) > (item.maxCantidad || 9999);
                    const isPriceZero = (Number(item.p) || 0) <= 0;
                    const hasRowError = isQtyExceeded || isPriceZero;

                    return (
                      <tr
                        key={item.id}
                        className={hasRowError ? 'ns-row-has-error' : ''}
                      >
                        {/* 1. N° artículo (Sticky Izquierda) */}
                        {columnasVisibles.numArticulo && (
                          <td className="ns-sticky-col-num font-mono font-bold text-muted">
                            {item.numArticulo || index + 1}
                          </td>
                        )}

                        {/* 2. Artículo * (Sticky Izquierda) */}
                        {columnasVisibles.articulo && (
                          <td className="ns-sticky-col-art">
                            {item.c === 'EMBARQUE' ? (
                              <span className="font-bold text-green-600 font-mono text-xs">
                                EMBARQUE
                              </span>
                            ) : (
                              <select
                                className="ns-select-cell font-bold text-primary"
                                value={item.c}
                                onChange={(e) => {
                                  const selCode = e.target.value;
                                  const opt = ARTICULOS_CATALOG.find((a) => a.c === selCode);
                                  handleUpdatePartida(item.id, {
                                    c: selCode,
                                    articuloNombre: opt ? opt.v.split('·')[1]?.trim() : selCode,
                                    d: opt ? opt.v : item.d,
                                    p: opt ? opt.p : item.p,
                                  });
                                }}
                              >
                                {ARTICULOS_CATALOG.map((a) => (
                                  <option key={a.c} value={a.c}>
                                    {a.c}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        )}

                        {/* 4. Descripción * (Sticky Izquierda) */}
                        {columnasVisibles.descripcion && (
                          <td className="ns-sticky-col-desc">
                            <input
                              type="text"
                              className="ns-input-cell text-xs"
                              value={item.d}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, { d: e.target.value })
                              }
                              title={item.d}
                            />
                          </td>
                        )}

                        {/* 3. Nombre del proveedor */}
                        {columnasVisibles.proveedorNombre && (
                          <td>
                            <input
                              type="text"
                              className="ns-input-cell"
                              value={item.proveedorNombre || proveedorSeleccionado.v}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, { proveedorNombre: e.target.value })
                              }
                            />
                          </td>
                        )}

                        {/* 5. Departamento */}
                        {columnasVisibles.departamento && (
                          <td>
                            <select
                              className="ns-select-cell"
                              value={item.departamento || 'Dirección : Compras'}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, { departamento: e.target.value })
                              }
                            >
                              {DEPARTAMENTOS_CATALOG.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* 6. Disponible */}
                        {columnasVisibles.disponible && (
                          <td className="text-center font-semibold text-muted">
                            {item.disponible ?? 1}
                          </td>
                        )}

                        {/* 7. Recibido */}
                        {columnasVisibles.recibido && (
                          <td className="text-center text-muted">
                            {item.recibido ?? 0}
                          </td>
                        )}

                        {/* 8. Facturado */}
                        {columnasVisibles.facturado && (
                          <td className="text-center text-muted">
                            {item.facturado ?? 0}
                          </td>
                        )}

                        {/* 9. Cantidad * */}
                        {columnasVisibles.cantidad && (
                          <td>
                            <div className="flex flex-col">
                              <input
                                type="number"
                                min="1"
                                max={item.maxCantidad || 99999}
                                className={`ns-input-cell text-right font-bold w-20 ${isQtyExceeded ? 'border-red-500 text-red-600' : ''
                                  }`}
                                value={item.q}
                                onChange={(e) =>
                                  handleUpdatePartida(item.id, { q: Number(e.target.value) })
                                }
                              />
                              {isQtyExceeded && (
                                <span className="text-[10px] text-red-500 font-semibold mt-0.5">
                                  Máx: {item.maxCantidad}
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* 10. V. unitario * */}
                        {columnasVisibles.precioUnitario && (
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className={`ns-input-cell text-right font-bold w-24 ${isPriceZero ? 'border-red-500 text-red-600' : ''
                                }`}
                              value={item.p}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, {
                                  p: Math.max(Number(e.target.value) || 0, 0),
                                })
                              }
                            />
                          </td>
                        )}

                        {/* 11. Importe */}
                        {columnasVisibles.importe && (
                          <td className="text-right font-bold text-on-surface">
                            {formatDinero((item.q || 0) * (item.p || 0), moneda)}
                          </td>
                        )}

                        {/* 12. Opciones */}
                        {columnasVisibles.opciones && (
                          <td className="text-center">
                            <button
                              type="button"
                              className="p-1 hover:bg-primary/10 rounded text-muted hover:text-primary"
                              onClick={() => setModalOpcionesItem(item)}
                              title="Ver opciones de la partida"
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                tune
                              </span>
                            </button>
                          </td>
                        )}

                        {/* 13. Imp. bruto */}
                        {columnasVisibles.impBruto && (
                          <td className="text-right font-semibold text-muted">
                            {formatDinero((item.q || 0) * (item.p || 0) * 1.16, moneda)}
                          </td>
                        )}

                        {/* 14. Cerrado */}
                        {columnasVisibles.cerrado && (
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={item.cerrado || false}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, { cerrado: e.target.checked })
                              }
                            />
                          </td>
                        )}

                        {/* 15. Fecha de recibo prevista * */}
                        {columnasVisibles.fechaReciboPrevista && (
                          <td>
                            <input
                              type="date"
                              className="ns-input-cell text-xs w-32"
                              value={item.fechaReciboPrevista || recibidoPor}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, {
                                  fechaReciboPrevista: e.target.value,
                                })
                              }
                            />
                          </td>
                        )}

                        {/* 16. Importe de impuestos */}
                        {columnasVisibles.importeImpuestos && (
                          <td className="text-right text-muted">
                            {formatDinero((item.q || 0) * (item.p || 0) * 0.16, moneda)}
                          </td>
                        )}

                        {/* 17. Cliente:Trabajo */}
                        {columnasVisibles.clienteTrabajo && (
                          <td>
                            <select
                              className="ns-select-cell w-56 truncate"
                              value={item.clienteTrabajo || CLIENTES_TRABAJO_CATALOG[0]}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, { clienteTrabajo: e.target.value })
                              }
                            >
                              {CLIENTES_TRABAJO_CATALOG.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* 18. Activity Code */}
                        {columnasVisibles.activityCode && (
                          <td>
                            <select
                              className="ns-select-cell w-36"
                              value={item.activityCode || ACTIVITY_CODES_CATALOG[0]}
                              onChange={(e) =>
                                handleUpdatePartida(item.id, { activityCode: e.target.value })
                              }
                            >
                              {ACTIVITY_CODES_CATALOG.map((ac) => (
                                <option key={ac} value={ac}>
                                  {ac}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* 19. Referencia detalles impuestos */}
                        {columnasVisibles.refDetallesImpuestos && (
                          <td className="font-mono text-muted text-xs">
                            {item.refDetallesImpuestos || `1194487_${index + 1}`}
                          </td>
                        )}

                        {/* 20. Acciones (Sticky Derecha) */}
                        {columnasVisibles.acciones && (
                          <td className="ns-sticky-col-actions">
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                              onClick={() => handleEliminarPartida(item.id)}
                              title="Eliminar partida"
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                delete
                              </span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* PIE DE LA TABLA CON TOTALES Y VISTA PREVIA IMPUESTO */}
          <div className="ns-table-footer-totals">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cp-btn cp-btn-secondary text-xs flex items-center gap-1.5"
                onClick={() =>
                  mostrarToast(
                    `Vista previa de impuesto: Subtotal ${formatDinero(
                      subtotalGeneral,
                      moneda
                    )} + IVA 16% ${formatDinero(
                      impuestosGenerales,
                      moneda
                    )} = Total ${formatDinero(totalGeneral, moneda)}.`,
                    'info'
                  )
                }
              >
                <span className="material-symbols-outlined text-[16px]">calculate</span>
                Vista previa de impuesto
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-muted mr-1.5">Subtotal:</span>
                <strong className="text-on-surface">
                  {formatDinero(subtotalGeneral, moneda)}
                </strong>
              </div>
              <div>
                <span className="text-muted mr-1.5">Impuestos (16% IVA):</span>
                <strong className="text-on-surface">
                  {formatDinero(impuestosGenerales, moneda)}
                </strong>
              </div>
              <div className="text-sm font-extrabold text-primary border-l border-[var(--border)] pl-4">
                <span>Total: </span>
                <span>{formatDinero(totalGeneral, moneda)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 4 – REVISIÓN Y ARCHIVOS ADJUNTOS
          ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-4 animation-fadeIn">
          {/* SECCIÓN RESUMEN DE LA ORDEN */}
          <div className="oc-card">
            <div className="oc-card-header">
              <h2 className="oc-card-title">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                Resumen Ejecutivo de la Orden de Compra
              </h2>
              <span className="oc-card-req-hint">Verifique los datos antes de emitir</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bloque Proveedor y Moneda */}
              <div className="p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] relative">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase">
                    1. Proveedor & Divisa
                  </span>
                  <button
                    type="button"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
                    onClick={() => setCurrentStep(1)}
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Editar
                  </button>
                </div>
                <div className="text-sm font-bold text-on-surface">{proveedorSeleccionado.v}</div>
                <div className="text-xs text-muted">
                  RFC: {proveedorSeleccionado.rfc} • Subsidiaria: {subsidiaria}
                </div>
                <div className="text-xs text-muted mt-1">
                  Moneda: <strong>{moneda}</strong> (T.C. {tipoCambio})
                </div>
              </div>

              {/* Bloque Condiciones y Clasificación */}
              <div className="p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] relative">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase">
                    2. Condiciones & Recepción
                  </span>
                  <button
                    type="button"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
                    onClick={() => setCurrentStep(2)}
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Editar
                  </button>
                </div>
                <div className="text-xs text-on-surface font-semibold">
                  Pago: {tipoCondicion === 'Crédito' ? `Crédito ${diasCredito} días` : 'Contado comercial'}
                </div>
                <div className="text-xs text-muted">
                  Arribo previsto: <strong>{recibidoPor}</strong> • Ubicación: {ubicacion}
                </div>
                <div className="text-xs text-muted mt-1">
                  Req. Contrato: {reqContrato} • No. OC: <strong>{noOrdenCompra}</strong>
                </div>
              </div>
            </div>

            {/* SECCIÓN PARTIDAS: UN SOLO NÚMERO CON BOTÓN "VER DETALLE" */}
            <div className="mt-4 p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-primary uppercase block">
                    Partidas Adjudicadas
                  </span>
                  <div className="text-base font-extrabold text-on-surface mt-0.5">
                    Partidas: {partidas.length}{' '}
                    {tieneEmbarque ? '+ Embarque incluido' : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="oc-collapsible-btn text-xs"
                    onClick={() => setIsVerDetallePartidasOpen((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isVerDetallePartidasOpen ? 'expand_less' : 'visibility'}
                    </span>
                    {isVerDetallePartidasOpen ? 'Ocultar tabla' : 'Ver detalle'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-primary font-semibold hover:underline"
                    onClick={() => setCurrentStep(3)}
                  >
                    Editar partidas
                  </button>
                </div>
              </div>

              {/* Tabla de solo lectura desplegable (cerrada por defecto) */}
              {isVerDetallePartidasOpen && (
                <div className="mt-3 overflow-x-auto border-t border-[var(--border)] pt-2 animation-fadeIn">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-muted font-bold text-[11px]">
                        <th className="py-1.5 px-2">Artículo</th>
                        <th className="py-1.5 px-2">Descripción</th>
                        <th className="py-1.5 px-2 text-right">Cantidad</th>
                        <th className="py-1.5 px-2 text-right">V. Unitario</th>
                        <th className="py-1.5 px-2 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidas.map((it) => (
                        <tr key={it.id} className="border-b border-[var(--border)] last:border-b-0">
                          <td className="py-1.5 px-2 font-mono font-bold text-primary">{it.c}</td>
                          <td className="py-1.5 px-2">{it.d}</td>
                          <td className="py-1.5 px-2 text-right font-semibold">
                            {it.q} {it.unidad || 'Pza'}
                          </td>
                          <td className="py-1.5 px-2 text-right">{formatDinero(it.p, moneda)}</td>
                          <td className="py-1.5 px-2 text-right font-bold">
                            {formatDinero((it.q || 0) * (it.p || 0), moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TARJETA RESUMEN TOTALES Y COTEJO COTIZACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <div className="flex justify-between text-xs py-1">
                  <span className="text-muted">Subtotal:</span>
                  <strong className="text-on-surface">
                    {formatDinero(subtotalGeneral, moneda)}
                  </strong>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-muted">Impuestos (16% IVA):</span>
                  <strong className="text-on-surface">
                    {formatDinero(impuestosGenerales, moneda)}
                  </strong>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-t border-blue-200 dark:border-blue-900/50 font-black">
                  <span>Total Orden de Compra:</span>
                  <span className="text-primary text-base">
                    {formatDinero(totalGeneral, moneda)}
                  </span>
                </div>
              </div>

              {/* Cotejo con Cotización del Proveedor */}
              <div className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="oc-monto-cotiz" className="oc-label text-xs">
                      Monto de la cotización del proveedor:
                    </label>
                    <span
                      className={`oc-quote-match-badge ${coincideCotizacion ? 'coincide' : 'no-coincide'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {coincideCotizacion ? 'check_circle' : 'cancel'}
                      </span>
                      {coincideCotizacion ? 'Coincide' : 'No coincide con la cotización'}
                    </span>
                  </div>

                  <input
                    id="oc-monto-cotiz"
                    type="number"
                    step="0.01"
                    className="oc-input mt-1.5 font-bold"
                    value={montoCotizacionProveedor}
                    onChange={(e) => setMontoCotizacionProveedor(Number(e.target.value) || 0)}
                  />
                </div>

                {!coincideCotizacion && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    Aviso: El monto ingresado difiere del total calculado ({formatDinero(totalGeneral, moneda)}). Podrá guardar tras confirmar.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN ARCHIVOS ADJUNTOS */}
          <div className="oc-card">
            <div className="oc-card-header">
              <h2 className="oc-card-title">
                <span className="material-symbols-outlined text-primary">attach_file</span>
                Archivos Adjuntos de Soporte
              </h2>
              <span className="text-xs font-bold text-muted">
                {archivos.length} {archivos.length === 1 ? 'archivo cargado' : 'archivos cargados'}
              </span>
            </div>

            {/* Zona Drag & Drop */}
            <div
              className={`oc-dropzone ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesDropped(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.xml,.jpg,.jpeg,.png,.xlsx"
                className="hidden"
                onChange={(e) => handleFilesDropped(e.target.files)}
              />
              <span className="material-symbols-outlined text-[36px] text-primary mb-1">
                cloud_upload
              </span>
              <p className="text-xs font-bold text-on-surface">
                Arrastra y suelta aquí tus archivos o haz clic para seleccionarlos
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                PDF, XML, JPG, PNG, XLSX (máximo 10 MB por archivo)
              </p>
            </div>

            {/* Lista de Archivos Cargados */}
            {archivos.length > 0 && (
              <div className="oc-file-list">
                {archivos.map((archivo) => (
                  <div key={archivo.id} className="oc-file-item">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="oc-file-type-badge">
                        {archivo.nombre.split('.').pop() || 'DOC'}
                      </span>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-on-surface truncate block" title={archivo.nombre}>
                          {archivo.nombre}
                        </span>
                        <span className="text-[11px] text-muted">
                          {formatearBytes(archivo.tamano)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        className="oc-input text-xs py-1 px-2 h-8"
                        value={archivo.tipoDocumento}
                        onChange={(e) => {
                          const val = e.target.value as ArchivoAdjuntoLocal['tipoDocumento'];
                          setArchivos((prev) =>
                            prev.map((a) => (a.id === archivo.id ? { ...a, tipoDocumento: val } : a))
                          );
                        }}
                      >
                        <option value="Cotización del proveedor">Cotización del proveedor</option>
                        <option value="Factura">Factura</option>
                        <option value="Comprobante">Comprobante</option>
                        <option value="Otro">Otro</option>
                      </select>

                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Quitar archivo"
                        onClick={() => eliminarArchivo(archivo.id)}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 5 – REGISTRAR FACTURA EN EL SISTEMA
          ========================================================================= */}
      {currentStep === 5 && (
        <div className="oc-card oc-step5-card animation-fadeIn">
          <div
            className={`oc-step5-success-icon ${isFacturaConcluida ? '!bg-emerald-600 !text-white !ring-emerald-100 dark:!ring-emerald-950/60' : ''
              }`}
          >
            <span className="material-symbols-outlined">
              {isFacturaConcluida ? 'verified' : 'task_alt'}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-on-surface">
              {isFacturaConcluida
                ? '¡Orden de compra concluida con factura registrada!'
                : '¡Orden de compra generada exitosamente!'}
            </h2>
            <p className="text-xs text-muted mt-1">
              {isFacturaConcluida ? (
                <>
                  La orden <strong>{folioOrden}</strong> ha quedado debidamente vinculada con la factura fiscal{' '}
                  <strong>{facturaFolioParam || 'CFDI 4.0'}</strong>. Todos los pasos del ciclo de adquisición han concluido.
                </>
              ) : (
                <>
                  La orden <strong>{folioOrden}</strong> ha sido registrada en el sistema y se encuentra lista para el proceso de facturación.
                </>
              )}
            </p>
          </div>

          {/* Grid de Resumen Rápido */}
          <div className="oc-step5-kpi-grid">
            <div className="oc-step5-kpi-box">
              <span className="oc-step5-kpi-label">Folio ODC</span>
              <div className="oc-step5-kpi-val text-primary">{folioOrden}</div>
            </div>
            <div className="oc-step5-kpi-box">
              <span className="oc-step5-kpi-label">Proveedor</span>
              <div className="oc-step5-kpi-val truncate text-xs font-bold mt-1" title={proveedorSeleccionado.v}>
                {proveedorSeleccionado.v.split(' ')[0]}
              </div>
            </div>
            <div className="oc-step5-kpi-box">
              <span className="oc-step5-kpi-label">Partidas</span>
              <div className="oc-step5-kpi-val">{partidas.length}</div>
            </div>
            <div className="oc-step5-kpi-box">
              <span className="oc-step5-kpi-label">Archivos</span>
              <div className="oc-step5-kpi-val">{archivos.length}</div>
            </div>
          </div>

          {/* Tarjeta Destacada según si está concluida con factura o pendiente de registrar */}
          {isFacturaConcluida ? (
            <div className="max-w-xl w-full p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center animate-fadeIn shadow-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 mb-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Paso 5 Concluido: Factura Vinculada
              </span>
              <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100 mt-1">
                Comprobante CFDI Registrado: {facturaFolioParam || 'FAC-2026-8941'}
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                La póliza fiscal y la orden han sido enlazadas. Se encuentra programada la dispersión en cuentas por pagar de tesorería.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  className="cp-btn cp-btn-primary w-full sm:w-auto"
                  onClick={() => router.push(`/compras/facturas`)}
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Ver en Gestión de Facturas
                </button>

                <button
                  type="button"
                  className="cp-btn cp-btn-secondary w-full sm:w-auto"
                  onClick={() => router.push('/compras/ordenes')}
                >
                  Ir al listado de órdenes
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-xl w-full p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
              <h3 className="font-bold text-sm text-primary flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Registrar factura en el sistema
              </h3>
              <p className="text-xs text-muted mt-1">
                Carga el CFDI 4.0 (archivo XML y PDF) del proveedor para validar candados fiscales SAT 32-D y programar la dispersión de tesorería.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                {/* Botón primario: Redirige al módulo de facturas ya existente */}
                <button
                  type="button"
                  className="cp-btn cp-btn-primary w-full sm:w-auto"
                  onClick={() => {
                    const archivosFactura = archivos
                      .filter((a) => a.tipoDocumento === 'Factura')
                      .map((a) => a.nombre);
                    const queryArchivos = archivosFactura.length > 0 ? `&archivos=${encodeURIComponent(archivosFactura.join(','))}` : '';
                    const url = `/compras/facturas/registro?oc=${encodeURIComponent(
                      folioOrden
                    )}&proveedor=${encodeURIComponent(
                      proveedorSeleccionado.v
                    )}&total=${totalGeneral}&moneda=${encodeURIComponent(moneda)}${queryArchivos}`;
                    router.push(url);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Registrar factura en el sistema
                </button>

                {/* Botón secundario: Regresa al módulo de Compras */}
                <button
                  type="button"
                  className="cp-btn cp-btn-secondary w-full sm:w-auto"
                  onClick={() => router.push('/compras/ordenes')}
                >
                  Registrar después
                </button>
              </div>
            </div>
          )}

          {/* Enlace de texto: Ver orden de compra */}
          <Link
            href={`/compras/ordenes/${encodeURIComponent(folioOrden)}`}
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-2"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            Ver orden de compra generada
          </Link>
        </div>
      )}

      {/* ── PIE FIJO DE NAVEGACIÓN REUTILIZABLE (NORMATIVO) ── */}
      {!isSaved && (
        <FormWizardFooter
          currentStep={currentStep}
          totalSteps={4}
          isValid={estadoPasoActual.valido}
          missingFields={estadoPasoActual.errores}
          onContinue={currentStep === 4 ? handleGuardarOrden : handleContinuar}
          onPrevious={handleAtras}
          onCancel={() => setIsDialogCancelarOpen(true)}
          continueText="Continuar"
          finalText="Guardar orden de compra"
          continueIcon="chevron_right"
          finalIcon="save"
          onInvalidClick={() => {
            setErrorMessages(estadoPasoActual.errores);
            setShowErrorBanner(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          helperText="Completa los campos obligatorios (*) para continuar"
          cancelText="Cancelar"
          showCancel={currentStep <= 4}
          isLastStep={currentStep === 4}
        />
      )}

      {/* ── MODAL: VER LISTA COMPLETA DE PROVEEDORES (PASO 1) ── */}
      {isModalProveedoresOpen && (
        <div className="oc-modal-backdrop" role="dialog" aria-modal="true">
          <div className="oc-modal-container max-w-2xl">
            <div className="oc-modal-header">
              <h3 className="oc-modal-title">
                <span className="material-symbols-outlined text-primary">storefront</span>
                Catálogo de Proveedores Homologados
              </h3>
              <button
                type="button"
                className="oc-modal-close-btn"
                onClick={() => setIsModalProveedoresOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="oc-modal-body">
              <div className="relative mb-3">
                <input
                  type="text"
                  className="oc-input text-xs py-1.5"
                  placeholder="Buscar proveedor por razón social, nombre o RFC..."
                  value={filtroModalProveedor}
                  onChange={(e) => setFiltroModalProveedor(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-muted">
                  search
                </span>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {PROVEEDORES_OC_CATALOG.filter((p) =>
                  `${p.v} ${p.rfc} ${p.ct}`
                    .toLowerCase()
                    .includes(filtroModalProveedor.toLowerCase())
                ).map((prov) => (
                  <div
                    key={prov.rfc}
                    className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-primary/5 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setProveedorSeleccionado(prov);
                      setProveedorBusqueda(prov.v);
                      setIsModalProveedoresOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-bold text-xs text-on-surface">{prov.v}</div>
                      <div className="text-[11px] text-muted">
                        RFC: {prov.rfc} • {prov.ct} • Condición: {prov.pay}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      check_circle
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="oc-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setIsModalProveedoresOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: OPCIONES DE LA PARTIDA (PASO 3) ── */}
      {modalOpcionesItem && (
        <div className="oc-modal-backdrop" role="dialog" aria-modal="true">
          <div className="oc-modal-container max-w-md">
            <div className="oc-modal-header">
              <h3 className="oc-modal-title">
                <span className="material-symbols-outlined text-primary">tune</span>
                Opciones de Partida #{modalOpcionesItem.numArticulo}
              </h3>
              <button
                type="button"
                className="oc-modal-close-btn"
                onClick={() => setModalOpcionesItem(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="oc-modal-body space-y-3 text-xs">
              <div>
                <span className="text-muted block text-[11px] mb-1">Artículo:</span>
                <strong className="text-on-surface">
                  {modalOpcionesItem.c} - {modalOpcionesItem.articuloNombre}
                </strong>
              </div>
              <div className="oc-field-group">
                <label className="oc-label">Aclaración / Nota de la partida</label>
                <textarea
                  className="oc-textarea"
                  rows={2}
                  placeholder="Nota técnica adicional..."
                  value={modalOpcionesItem.n || ''}
                  onChange={(e) =>
                    handleUpdatePartida(modalOpcionesItem.id, { n: e.target.value })
                  }
                />
              </div>
              <div className="oc-field-group">
                <label className="oc-label">Centro de Costos / Proyecto</label>
                <input
                  type="text"
                  className="oc-input"
                  value={modalOpcionesItem.clienteTrabajo || ''}
                  onChange={(e) =>
                    handleUpdatePartida(modalOpcionesItem.id, { clienteTrabajo: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="oc-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-primary"
                onClick={() => setModalOpcionesItem(null)}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIÁLOGO: CANCELAR ASISTENTE ── */}
      {isDialogCancelarOpen && (
        <div className="oc-modal-backdrop" role="dialog" aria-modal="true">
          <div className="oc-modal-container max-w-md">
            <div className="oc-modal-header">
              <h3 className="oc-modal-title text-amber-600">
                <span className="material-symbols-outlined">warning</span>
                ¿Salir sin guardar?
              </h3>
            </div>
            <div className="oc-modal-body text-xs text-muted">
              Tiene datos capturados en el asistente. Si sale ahora, se descartarán los cambios no guardados y regresará al listado de órdenes.
            </div>
            <div className="oc-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setIsDialogCancelarOpen(false)}
              >
                Continuar editando
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primary bg-red-600 hover:bg-red-700"
                onClick={() => router.push('/compras/ordenes')}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIÁLOGO: ANULAR ORDEN DE COMPRA ── */}
      {isDialogAnularOpen && (
        <div className="oc-modal-backdrop" role="dialog" aria-modal="true">
          <div className="oc-modal-container max-w-md">
            <div className="oc-modal-header">
              <h3 className="oc-modal-title text-red-600">
                <span className="material-symbols-outlined">block</span>
                Anular Orden de Compra
              </h3>
            </div>
            <div className="oc-modal-body text-xs text-muted">
              ¿Está seguro de que desea anular esta orden de compra en captura? La requisición quedará liberada para cotizar con otro proveedor.
            </div>
            <div className="oc-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setIsDialogAnularOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primary bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setIsDialogAnularOpen(false);
                  mostrarToast('Orden de compra anulada exitosamente.', 'info');
                  router.push('/compras/ordenes');
                }}
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIÁLOGO: CONFIRMAR DISCREPANCIA CON COTIZACIÓN ── */}
      {isDialogConfirmarGuardarOpen && (
        <div className="oc-modal-backdrop" role="dialog" aria-modal="true">
          <div className="oc-modal-container max-w-md">
            <div className="oc-modal-header">
              <h3 className="oc-modal-title text-amber-600">
                <span className="material-symbols-outlined">info</span>
                Discrepancia con la Cotización
              </h3>
            </div>
            <div className="oc-modal-body text-xs text-muted space-y-2">
              <p>
                El total de la orden (<strong>{formatDinero(totalGeneral, moneda)}</strong>) no coincide exactamente con el monto registrado de la cotización del proveedor (<strong>{formatDinero(montoCotizacionProveedor, moneda)}</strong>).
              </p>
              <p>¿Desea proceder a emitir la orden de compra con esta discrepancia registrada?</p>
            </div>
            <div className="oc-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setIsDialogConfirmarGuardarOpen(false)}
              >
                Volver y corregir
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primary"
                onClick={() => {
                  setIsDialogConfirmarGuardarOpen(false);
                  ejecutarGuardarOrden();
                }}
              >
                Confirmar y Emitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaOrdenCompraPage;
