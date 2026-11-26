'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import {
  obtenerOrdenesCompra,
  obtenerFacturasProveedor,
} from '../data/mock-data';
import type { FacturaProveedor, OrdenCompra } from '../types';
import { useCompras } from '../context/ComprasContext';
import { parseCfdiXml, SAMPLE_CFDI_40_XML, type FacturaData } from '../services/facturas';
import '../compras.css';

interface ArchivoAdjuntoFactura {
  id: string;
  nombre: string;
  carpeta: string;
  tamano: number;
  tipo: string;
  fechaCarga: string;
  usuario: string;
  url?: string;
}

function crearIdTemporalRecepcion(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface GestionFacturasProveedorPageProps {
  modo?: 'nueva' | 'ver' | 'directo';
  ocIdProp?: string;
  facturaIdProp?: string;
}

export const GestionFacturasProveedorPage: React.FC<GestionFacturasProveedorPageProps> = ({
  modo,
  ocIdProp,
  facturaIdProp,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // Compras Suite Centralized State (React Context + localStorage)
  const {
    ordenes: ordenesContext,
    guardarFactura: guardarFacturaContext,
    anularFactura: anularFacturaContext,
    ocTieneFactura,
    getFacturaPorOC,
    getOrden,
    mostrarToast,
  } = useCompras();

  const ocParam = searchParams?.get('oc');
  const ocIdRoute = params?.id as string | undefined;
  const facturaIdRoute = params?.facturaId as string | undefined;

  // ── 1. MODOS DE VISTA: 'detalle' (Stitch screen d1850c5d6d7b46bbad528166e412016a) O 'lista' (Directorio) ──
  const [vistaActual, setVistaActual] = useState<'detalle' | 'lista'>('detalle');

  // ODC activa vinculada a la recepción de factura
  const [odcSeleccionadaFolio, setOdcSeleccionadaFolio] = useState<string>(
    () => ocIdProp || ocIdRoute || ocParam || 'PO-2026-0173'
  );

  useEffect(() => {
    if (ocIdProp || ocIdRoute || ocParam) {
      setOdcSeleccionadaFolio(ocIdProp || ocIdRoute || ocParam || 'PO-2026-0173');
    }
  }, [ocIdProp, ocIdRoute, ocParam]);

  // Modo de operación efectivo
  const modoEfectivo: 'nueva' | 'ver' | 'directo' = useMemo(() => {
    if (modo) return modo;
    if (facturaIdProp || facturaIdRoute) return 'ver';
    const queryModo = searchParams?.get('modo') as 'nueva' | 'ver' | null;
    if (queryModo) return queryModo;
    return ocTieneFactura(odcSeleccionadaFolio) ? 'ver' : 'nueva';
  }, [modo, facturaIdProp, facturaIdRoute, searchParams, ocTieneFactura, odcSeleccionadaFolio]);

  // Factura existente si la orden ya tiene factura adjunta
  const facturaExistente = useMemo(() => {
    return getFacturaPorOC(odcSeleccionadaFolio);
  }, [getFacturaPorOC, odcSeleccionadaFolio]);

  // ── GUARDIA DE RUTA PARA MODO 'VER': SI NO TIENE FACTURA ADJUNTA, REDIRIGIR A LA OC CON ALERTA ──
  useEffect(() => {
    if (modoEfectivo === 'ver' && !ocTieneFactura(odcSeleccionadaFolio)) {
      mostrarToast('Esta orden no tiene factura adjunta', 'warning');
      router.replace(`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`);
    }
  }, [modoEfectivo, odcSeleccionadaFolio, ocTieneFactura, router, mostrarToast]);

  // Datos mock base
  const [ordenes] = useState<OrdenCompra[]>(() => (ordenesContext.length > 0 ? ordenesContext : obtenerOrdenesCompra()));
  const [facturas] = useState<FacturaProveedor[]>(() => obtenerFacturasProveedor());

  // Buscar ODC actual
  const ordenActual = useMemo(() => {
    const fromContext = getOrden(odcSeleccionadaFolio);
    if (fromContext) return fromContext;
    return (
      ordenes.find((o) => o.folio.toLowerCase() === odcSeleccionadaFolio.toLowerCase()) ||
      ordenes[0] ||
      null
    );
  }, [getOrden, odcSeleccionadaFolio, ordenes]);

  // Secciones colapsables
  const [secInfoPrimariaOpen, setSecInfoPrimariaOpen] = useState(true);
  const [secClasificacionOpen, setSecClasificacionOpen] = useState(true);

  // Pestañas principales de la transacción
  const [activeTab, setActiveTab] = useState<string>('gastos');
  const [subTabComunicacion, setSubTabComunicacion] = useState<'archivos' | 'eventos' | 'tareas' | 'llamadas'>('archivos');

  // Estados para fila interactiva de comunicación (NetSuite ERP - Imagen 1)
  const [inlineNombreArchivo, setInlineNombreArchivo] = useState('');
  const [inlineCarpeta, setInlineCarpeta] = useState('HSE');
  const [inlineTamanoKb, setInlineTamanoKb] = useState(150);
  const [inlineTipoArchivo, setInlineTipoArchivo] = useState('Imagen PNG');
  const [inlineArchivoFile, setInlineArchivoFile] = useState<File | null>(null);
  const fileInputComunicacionRef = useRef<HTMLInputElement | null>(null);

  // Selector XML
  const xmlFileInputRef = useRef<HTMLInputElement | null>(null);

  // Visor y modales
  const [docModal, setDocModal] = useState<{ nombre: string; tipo: string; tamano: number; url?: string } | null>(null);
  const [mostrarModalImpuestos, setMostrarModalImpuestos] = useState(false);
  const [mostrarMenuAcciones, setMostrarMenuAcciones] = useState(false);
  const [notificacionFeedback, setNotificacionFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de parseo y autocompletado XML CFDI 4.0
  const [autocompletadoDesdeXml, setAutocompletadoDesdeXml] = useState(
    () => facturaExistente?.autocompletadoDesdeXml ?? true
  );
  const [isDraggingXml, setIsDraggingXml] = useState(false);
  const [alertaRfcDiferente, setAlertaRfcDiferente] = useState<string | null>(null);
  const [alertaRecepcionParcial, setAlertaRecepcionParcial] = useState<string | null>(
    () => (modoEfectivo === 'ver' || facturaExistente ? 'Recepción parcial: Factura de $2,700.00 MXN vs Orden de $4,118.00 MXN (ODC Recibida parcialmente)' : null)
  );
  const [alertaUuidOk, setAlertaUuidOk] = useState<string | null>(
    () => (modoEfectivo === 'ver' || facturaExistente ? 'CFDI 4.0 verificado ante el SAT. Folio Fiscal UUID Timbre válido.' : null)
  );

  // ── ESTADOS DEL FORMULARIO DE RECEPCIÓN (STITCH d1850c5d6d7b46bbad528166e412016a) ──
  const [formularioPersonalizado, setFormularioPersonalizado] = useState(
    'SIFYGSA - Factura del proveedor (Norma Compras)'
  );
  const [proveedorNombre, setProveedorNombre] = useState(
    () => facturaExistente?.proveedor || ordenActual?.proveedorNombre || 'Five Peaks México SA de CV'
  );
  const [proveedorRfc, setProveedorRfc] = useState(
    () => facturaExistente?.rfcEmisor || ordenActual?.proveedorRfc || 'FPM130918MPA'
  );
  const [fechaEmision, setFechaEmision] = useState(
    () => facturaExistente?.fechaEmision || '2026-10-27'
  );
  const [limiteCredito] = useState(150000.0);
  const [creditoDisponible] = useState(112400.0);

  const [referenciaFiscal, setReferenciaFiscal] = useState(
    () => facturaExistente?.folio || 'FAC-GMX-99421'
  );
  const [subsidiaria] = useState(
    () => facturaExistente?.subsidiaria || (ordenActual as unknown as { subsidiaria?: string })?.subsidiaria || 'SIFYGSA (Suministros Industriales Fire & Gas)'
  );
  const [notaCondiciones, setNotaCondiciones] = useState(
    () =>
      facturaExistente?.notaCondiciones ||
      `${odcSeleccionadaFolio} - Condiciones de pago: ${ordenActual?.condicionPago || 'crédito acordado'}`
  );
  const [cuentaContable, setCuentaContable] = useState(
    () => facturaExistente?.cuentaContable || '2110-0010-0000-0000 PROVEEDORES MXN'
  );
  const [periodoContable, setPeriodoContable] = useState(
    () => facturaExistente?.periodoContable || 'oct 2026'
  );

  const [plazoDias, setPlazoDias] = useState<number>(30);
  const [fechaVencimiento, setFechaVencimiento] = useState(
    () => facturaExistente?.fechaVencimiento || '2026-11-26'
  );
  const [retencionPago, setRetencionPago] = useState(false);

  // Bloques Inferiores
  const [uuidFiscal, setUuidFiscal] = useState(
    () => facturaExistente?.uuid || '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0'
  );
  const [tipoOperacion, setTipoOperacion] = useState(
    () => facturaExistente?.tipoOperacion || 'Prestación de Servicios Profesionales'
  );
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN');
  const [tipoCambio, setTipoCambio] = useState(1.0);
  const [adReqContrato] = useState('SFG-C259-LVT-RQ-127/26');
  const [estadoAprobacion, setEstadoAprobacion] = useState<'Aprobado' | 'Pendiente' | 'Rechazado'>('Aprobado');
  const [isAnulada, setIsAnulada] = useState<boolean>(() => facturaExistente?.estado === 'cancelada');
  const [fechaAprobacionDg] = useState('09/10/2026');
  const [fechaRevision] = useState('08/10/2026');

  // ── PARTIDAS / ARTÍCULOS EXACTOS DE LA RECEPCIÓN ──
  interface PartidaRecepcion {
    id: string;
    articulo: string;
    nombreProveedor: string;
    descripcion: string;
    departamento: string;
    cantidad: number;
    unidades: string;
    valorUnitario: number;
    importe: number;
    opciones: string;
    impBruto: string;
    programaAmortizac: string;
  }

  const [partidas, setPartidas] = useState<PartidaRecepcion[]>([
    {
      id: 'part-1',
      articulo: 'SER-REN-BAÑ',
      nombreProveedor: '-',
      descripcion:
        'Servicio de renta de baño portátil, dentro de "Tenaris Tamsa", en Veracruz, Ver., con servicio de limpieza 3 veces por semana, del 26 de octubre del 2026 al 25 de noviembre del 2026, se anexa ubicación',
      departamento: 'Dirección : QHSE',
      cantidad: 1,
      unidades: 'Servicio',
      valorUnitario: 2700.0,
      importe: 2700.0,
      opciones: '-',
      impBruto: '-',
      programaAmortizac: '-',
    },
  ]);

  // Fila interactiva <Type then tab>
  const [inlineArticulo, setInlineArticulo] = useState('');
  const [inlineDescripcion, setInlineDescripcion] = useState('');
  const [inlineCantidad, setInlineCantidad] = useState(1);
  const [inlineValorUnitario, setInlineValorUnitario] = useState(0);

  // Totales calculados
  const subtotalTotal = useMemo(() => {
    return partidas.reduce((acc, p) => acc + p.importe, 0);
  }, [partidas]);

  const ivaTotal = useMemo(() => {
    return +(subtotalTotal * 0.16).toFixed(2);
  }, [subtotalTotal]);

  const granTotal = useMemo(() => {
    return +(subtotalTotal + ivaTotal).toFixed(2);
  }, [subtotalTotal, ivaTotal]);

  // Sincronizar datos de la ODC vinculada en el formulario de recepción Stitch
  useEffect(() => {
    if (ordenActual) {
      if (ordenActual.proveedorNombre) setProveedorNombre(ordenActual.proveedorNombre);
      if (ordenActual.proveedorRfc) setProveedorRfc(ordenActual.proveedorRfc);
      if (ordenActual.folio) {
        setNotaCondiciones(
          `${ordenActual.folio} - Condiciones de pago: ${ordenActual.condicionPago || 'Crédito acordado contra entrega ODC'}`
        );
      }
      if (ordenActual.moneda === 'MXN' || ordenActual.moneda === 'USD') {
        setMoneda(ordenActual.moneda);
      }
      if (ordenActual.items && ordenActual.items.length > 0) {
        setPartidas(
          ordenActual.items.map((item, idx) => ({
            id: `part-${idx + 1}`,
            articulo: item.codigo || `PART-${idx + 1}`,
            nombreProveedor: '-',
            descripcion: item.descripcion,
            departamento: ordenActual.departamento || 'Dirección : QHSE',
            cantidad: item.cantidad,
            unidades: item.unidad || 'Pieza',
            valorUnitario: item.precioUnitario,
            importe: item.subtotal || item.cantidad * item.precioUnitario,
            opciones: '-',
            impBruto: '-',
            programaAmortizac: '-',
          }))
        );
      }
    }
  }, [ordenActual]);

  // ── ARCHIVOS ADJUNTOS EN LA TRANSACCIÓN (NETSUITE ERP - COMUNICACIÓN EXACTA) ──
  const [archivosTransaccion, setArchivosTransaccion] = useState<ArchivoAdjuntoFactura[]>([
    {
      id: 'arch-1',
      nombre: 'Captura de pantalla 2026-10-08 170641.png',
      carpeta: 'HSE',
      tamano: 132 * 1024,
      tipo: 'image/png',
      fechaCarga: '08/10/2026 5:17 PM',
      usuario: 'HSE',
    },
    {
      id: 'arch-2',
      nombre: 'Captura de pantalla 2026-10-08 170655.png',
      carpeta: 'HSE',
      tamano: 168 * 1024,
      tipo: 'image/png',
      fechaCarga: '08/10/2026 5:17 PM',
      usuario: 'HSE',
    },
    {
      id: 'arch-3',
      nombre: 'Captura de pantalla 2026-10-08 170708.png',
      carpeta: 'HSE',
      tamano: 209 * 1024,
      tipo: 'image/png',
      fechaCarga: '08/10/2026 5:18 PM',
      usuario: 'HSE',
    },
    {
      id: 'arch-4',
      nombre: 'ubicacion Tenaris Tamsa.png',
      carpeta: 'HSE',
      tamano: 862 * 1024,
      tipo: 'image/png',
      fechaCarga: '03/08/2025 6:17 PM',
      usuario: 'HSE',
    },
    {
      id: 'arch-5',
      nombre: 'FAC_FPM130918MPA_FAC-GMX-99421.xml',
      carpeta: 'Compras - comprobantes fiscales XML/PDF',
      tamano: 42 * 1024,
      tipo: 'text/xml',
      fechaCarga: '27/10/2026 14:15',
      usuario: 'M. Torres',
    },
  ]);

  // ── HIDRATACIÓN AUTOMÁTICA DESDE PRECARGA DE ORDEN DE COMPRA (SESSIONSTORAGE) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = `sifygsa_factura_precarga_${odcSeleccionadaFolio}`;
      const raw =
        sessionStorage.getItem(storageKey) ||
        sessionStorage.getItem('sifygsa_factura_precarga_reciente');
      if (raw) {
        const precarga = JSON.parse(raw);
        if (precarga.folio) setReferenciaFiscal(precarga.folio);
        if (precarga.uuid) setUuidFiscal(precarga.uuid);
        if (precarga.proveedor) setProveedorNombre(precarga.proveedor);
        if (precarga.rfcEmisor) setProveedorRfc(precarga.rfcEmisor);
        if (precarga.fechaEmision) setFechaEmision(precarga.fechaEmision);
        if (precarga.moneda === 'MXN' || precarga.moneda === 'USD') setMoneda(precarga.moneda);
        if (precarga.tipoCambio) setTipoCambio(precarga.tipoCambio);
        setAutocompletadoDesdeXml(true);

        if (Array.isArray(precarga.conceptos) && precarga.conceptos.length > 0) {
          setPartidas(
            precarga.conceptos.map((c: any, idx: number) => ({
              id: `part-precarga-${idx + 1}`,
              articulo: c.noIdentificacion || c.codigo || `PART-${idx + 1}`,
              nombreProveedor: precarga.proveedor || '-',
              descripcion: c.descripcion || 'Servicio o partida validada en CFDI 4.0',
              departamento: ordenActual?.departamento || 'Dirección : QHSE',
              cantidad: c.cantidad || 1,
              unidades: c.unidad || c.claveUnidad || 'Servicio',
              valorUnitario: c.valorUnitario || c.precioUnitario || 0,
              importe:
                c.importe ||
                c.subtotal ||
                (c.cantidad || 1) * (c.valorUnitario || 0),
              opciones: '-',
              impBruto: '-',
              programaAmortizac: '-',
            }))
          );
        }

        const archivosNuevos: ArchivoAdjuntoFactura[] = [];
        if (precarga.xmlNombre) {
          archivosNuevos.push({
            id: 'xml-precarga-sat',
            nombre: precarga.xmlNombre,
            carpeta: 'Expediente Fiscal SAT CFDI 4.0',
            tamano: 24.8 * 1024,
            tipo: 'text/xml',
            fechaCarga: new Date().toLocaleDateString('es-MX'),
            usuario: 'Comprador SIFYGSA',
          });
        }
        if (precarga.pdfNombre) {
          archivosNuevos.push({
            id: 'pdf-precarga-sat',
            nombre: precarga.pdfNombre,
            carpeta: 'Expediente Fiscal SAT CFDI 4.0',
            tamano: 182.4 * 1024,
            tipo: 'application/pdf',
            fechaCarga: new Date().toLocaleDateString('es-MX'),
            usuario: 'Comprador SIFYGSA',
          });
        }
        if (archivosNuevos.length > 0) {
          setArchivosTransaccion((prev) => [
            ...archivosNuevos,
            ...prev.filter((a) => !a.id.includes('precarga')),
          ]);
        }

        if (Array.isArray(precarga.advertencias) && precarga.advertencias.length > 0) {
          setAlertaRfcDiferente(precarga.advertencias.join(' | '));
        } else {
          setAlertaRfcDiferente(null);
        }
      }
    } catch (e) {
      console.error('Error al precargar factura desde sessionStorage:', e);
    }
  }, [odcSeleccionadaFolio, ordenActual]);

  // ── MANEJADORES DE COMUNICACIÓN • ARCHIVOS (NETSUITE ERP - IMAGEN 1) ──
  const handleAgregarArchivoComunicacion = () => {
    const nombre = inlineArchivoFile ? inlineArchivoFile.name : inlineNombreArchivo.trim();
    if (!nombre) {
      alert('Por favor ingrese o seleccione un archivo para adjuntar.');
      return;
    }
    const ahora = new Date();
    const fechaStr = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${ahora.getFullYear()} ${ahora.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    let fileUrl: string | undefined = undefined;
    if (inlineArchivoFile) {
      fileUrl = URL.createObjectURL(inlineArchivoFile);
    }

    const nuevo: ArchivoAdjuntoFactura = {
      id: `arch-${Date.now()}`,
      nombre: nombre,
      carpeta: inlineCarpeta || 'HSE',
      tamano: inlineTamanoKb * 1024,
      tipo: inlineTipoArchivo,
      fechaCarga: fechaStr,
      usuario: 'Ing. M. Torres',
      url: fileUrl,
    };

    setArchivosTransaccion((prev) => [...prev, nuevo]);
    setInlineNombreArchivo('');
    setInlineArchivoFile(null);
    mostrarToast(`Archivo "${nombre}" agregado exitosamente a Comunicación`, 'success');
  };

  const handleEliminarTodoComunicacion = () => {
    if (archivosTransaccion.length === 0) return;
    if (confirm('¿Desea eliminar todos los archivos adjuntos de comunicación?')) {
      setArchivosTransaccion([]);
      mostrarToast('Todos los archivos de comunicación fueron eliminados', 'info');
    }
  };

  const handleBorrarTodasLasLineasComunicacion = () => {
    setArchivosTransaccion([]);
    mostrarToast('Líneas de archivos eliminadas', 'info');
  };

  const handleEliminarArchivoComunicacion = (id: string) => {
    setArchivosTransaccion((prev) => prev.filter((a) => a.id !== id));
    mostrarToast('Archivo eliminado', 'info');
  };

  const handleSubirArchivoDirecto = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const ahora = new Date();
    const fechaStr = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${ahora.getFullYear()} ${ahora.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    const nuevos: ArchivoAdjuntoFactura[] = [];
    Array.from(files).forEach((f) => {
      let tipoStr = 'Archivo';
      if (f.name.endsWith('.png')) tipoStr = 'Imagen PNG';
      else if (f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')) tipoStr = 'Imagen JPG';
      else if (f.name.endsWith('.pdf')) tipoStr = 'Documento PDF';
      else if (f.name.endsWith('.xml')) tipoStr = 'Archivo XML';
      else if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) tipoStr = 'Hoja de Cálculo Excel';

      nuevos.push({
        id: `arch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        nombre: f.name,
        carpeta: inlineCarpeta || 'HSE',
        tamano: f.size,
        tipo: tipoStr,
        fechaCarga: fechaStr,
        usuario: 'Ing. M. Torres',
        url: URL.createObjectURL(f),
      });
    });

    setArchivosTransaccion((prev) => [...prev, ...nuevos]);
    mostrarToast(`${nuevos.length} archivo(s) agregado(s) a Comunicación`, 'success');
  };

  // ── FILTROS Y BÚSQUEDA DE LA VISTA LISTADO GENERAL ──
  const [filtroBusquedaLista, setFiltroBusquedaLista] = useState('');
  const [filtroEstatusLista, setFiltroEstatusLista] = useState<'todas' | 'abierta' | 'pagada' | 'cancelada'>('todas');

  const facturasFiltradas = useMemo(() => {
    return facturas.filter((f) => {
      const matchTexto =
        filtroBusquedaLista.trim() === '' ||
        f.folio.toLowerCase().includes(filtroBusquedaLista.toLowerCase()) ||
        f.proveedorNombre.toLowerCase().includes(filtroBusquedaLista.toLowerCase()) ||
        f.proveedorRfc.toLowerCase().includes(filtroBusquedaLista.toLowerCase()) ||
        f.ordenCompraFolio.toLowerCase().includes(filtroBusquedaLista.toLowerCase()) ||
        f.uuidFiscal.toLowerCase().includes(filtroBusquedaLista.toLowerCase());

      const matchEstatus =
        filtroEstatusLista === 'todas' || f.estatus === filtroEstatusLista;

      return matchTexto && matchEstatus;
    });
  }, [facturas, filtroBusquedaLista, filtroEstatusLista]);

  // ── ACCIONES Y MANEJADORES ──
  const handleAplicarPlazoDias = (dias: number) => {
    setPlazoDias(dias);
    const fecha = new Date(fechaEmision || '2026-10-27');
    fecha.setDate(fecha.getDate() + dias);
    setFechaVencimiento(fecha.toISOString().split('T')[0]);
  };

  // ── PARSEO Y AUTOCOMPLETADO AUTOMÁTICO DESDE XML CFDI 4.0 ──
  const handleProcesarXmlString = (xmlString: string, nombreArchivo?: string) => {
    const parsed = parseCfdiXml(xmlString);
    if (!parsed) {
      mostrarAvisoFeedback('Error al parsear el archivo XML. Formato CFDI 4.0 inválido.');
      return;
    }

    if (parsed.folio) setReferenciaFiscal(parsed.folio);
    if (parsed.uuid) setUuidFiscal(parsed.uuid);
    if (parsed.proveedor) setProveedorNombre(parsed.proveedor);
    if (parsed.rfcEmisor) setProveedorRfc(parsed.rfcEmisor);
    if (parsed.fechaEmision) setFechaEmision(parsed.fechaEmision);
    if (parsed.moneda === 'MXN' || parsed.moneda === 'USD') {
      setMoneda(parsed.moneda);
    }
    if (parsed.tipoCambio) {
      // tipoCambio is fixed in state or updated
    }

    // Calcular vencimiento según plazo
    const fecha = new Date(parsed.fechaEmision || '2026-10-27');
    fecha.setDate(fecha.getDate() + plazoDias);
    setFechaVencimiento(fecha.toISOString().split('T')[0]);

    if (parsed.conceptos && parsed.conceptos.length > 0) {
      setPartidas(
        parsed.conceptos.map((c, idx) => ({
          id: `part-${idx + 1}`,
          articulo: c.noIdentificacion || 'SRV-SAN-001',
          nombreProveedor: '-',
          descripcion: c.descripcion,
          departamento: 'Dirección : QHSE',
          cantidad: c.cantidad,
          unidades: c.unidad || 'Servicio',
          valorUnitario: c.valorUnitario,
          importe: c.importe,
          opciones: '-',
          impBruto: '-',
          programaAmortizac: '-',
        }))
      );
    }

    setAutocompletadoDesdeXml(true);

    // Alertas no bloqueantes
    if (ordenActual && ordenActual.proveedorRfc && parsed.rfcEmisor !== ordenActual.proveedorRfc) {
      setAlertaRfcDiferente(`Advertencia: RFC del emisor XML (${parsed.rfcEmisor}) difiere del RFC de la orden (${ordenActual.proveedorRfc}).`);
    } else {
      setAlertaRfcDiferente(null);
    }

    if (ordenActual && parsed.total != null && parsed.total < ordenActual.total) {
      setAlertaRecepcionParcial(
        `Recepción parcial: Factura por $${parsed.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN contra Orden por $${ordenActual.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (ODC Recibida parcialmente).`
      );
    } else {
      setAlertaRecepcionParcial(null);
    }

    setAlertaUuidOk(`CFDI 4.0 válido ante padrón SAT. Folio Fiscal UUID Timbre: ${parsed.uuid}`);

    // Agregar archivo a la tabla de archivos de la transacción
    const nuevoArch: ArchivoAdjuntoFactura = {
      id: crearIdTemporalRecepcion('arch'),
      nombre: nombreArchivo || `${parsed.folio}.xml`,
      carpeta: 'Compras - comprobantes fiscales XML/PDF',
      tamano: Math.round(xmlString.length),
      tipo: 'text/xml',
      fechaCarga: `${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
      usuario: 'Ing. M. Torres',
    };
    setArchivosTransaccion((prev) => [nuevoArch, ...prev]);

    mostrarToast(`CFDI 4.0 ${parsed.folio} cargado y autocompletado con éxito`, 'success');
  };

  const handleFileDropOrSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.name.toLowerCase().endsWith('.xml')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          handleProcesarXmlString(text, file.name);
        }
      };
      reader.readAsText(file);
    } else {
      // Archivo complementario (PDF o imagen)
      const ahora = new Date();
      const fechaStr = `${ahora.toLocaleDateString('es-MX')} ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
      const nuevo: ArchivoAdjuntoFactura = {
        id: crearIdTemporalRecepcion('arch'),
        nombre: file.name,
        carpeta: 'Compras - facturas proveedor',
        tamano: file.size,
        tipo: file.type || 'application/pdf',
        fechaCarga: fechaStr,
        usuario: 'Ing. M. Torres',
      };
      setArchivosTransaccion((prev) => [nuevo, ...prev]);
      mostrarToast(`Documento ${file.name} adjuntado a la recepción`, 'info');
    }
  };

  const handleAgregarPartidaInline = () => {
    if (!inlineArticulo.trim() && !inlineDescripcion.trim()) return;
    const importe = inlineCantidad * inlineValorUnitario;
    const nueva: PartidaRecepcion = {
      id: crearIdTemporalRecepcion('part'),
      articulo: inlineArticulo || 'ART-GEN',
      nombreProveedor: '-',
      descripcion: inlineDescripcion || 'Concepto adicional de recepción contra ODC',
      departamento: 'Compras : Logística',
      cantidad: inlineCantidad,
      unidades: 'Servicio',
      valorUnitario: inlineValorUnitario,
      importe: importe,
      opciones: '-',
      impBruto: '-',
      programaAmortizac: '-',
    };
    setPartidas((prev) => [...prev, nueva]);
    setInlineArticulo('');
    setInlineDescripcion('');
    setInlineCantidad(1);
    setInlineValorUnitario(0);
    mostrarAvisoFeedback('Línea de artículo agregada correctamente a la recepción.');
  };

  const handleRecalcular = () => {
    mostrarAvisoFeedback(
      `Totales recalculados: Subtotal $${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda} | IVA 16%: $${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda} | Total: $${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}`
    );
  };

  const handleGuardarRecepcion = (esBorrador: boolean = false) => {
    setIsSaving(true);
    const facturaAGuardar: FacturaData = {
      id: facturaExistente?.id || `FAC-${referenciaFiscal || Date.now()}`,
      ocId: odcSeleccionadaFolio,
      uuid: uuidFiscal || '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
      folio: referenciaFiscal || 'FAC-GMX-99421',
      proveedor: proveedorNombre,
      rfcEmisor: proveedorRfc,
      rfcReceptor: 'SFG180425ABC',
      fechaEmision: fechaEmision,
      fechaVencimiento: fechaVencimiento,
      moneda: moneda,
      tipoCambio: tipoCambio,
      subtotal: subtotalTotal,
      iva: ivaTotal,
      total: granTotal,
      conceptos: partidas.map((p) => ({
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        unidad: p.unidades,
        valorUnitario: p.valorUnitario,
        importe: p.importe,
        noIdentificacion: p.articulo,
      })),
      xmlNombre: `${referenciaFiscal || 'FAC-GMX-99421'}.xml`,
      pdfNombre: `${referenciaFiscal || 'FAC-GMX-99421'}.pdf`,
      estado: esBorrador ? 'abierta' : 'abierta',
      regimenEmisor: '601',
      usoCfdi: 'G03',
      notaCondiciones: notaCondiciones,
      subsidiaria: subsidiaria,
      cuentaContable: cuentaContable,
      periodoContable: periodoContable,
      adReqContrato: adReqContrato,
      reqContrato: adReqContrato,
      noOrdenCompra: odcSeleccionadaFolio,
      estadoAprobacion: estadoAprobacion,
      tipoOperacion: tipoOperacion,
      autocompletadoDesdeXml: autocompletadoDesdeXml,
    };

    guardarFacturaContext(facturaAGuardar);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(`sifygsa_factura_precarga_${odcSeleccionadaFolio}`);
        sessionStorage.removeItem('sifygsa_factura_precarga_reciente');
      } catch (err) {
        console.error(err);
      }
    }
    mostrarToast(
      `Factura ${facturaAGuardar.folio} asociada exitosamente a la orden ${odcSeleccionadaFolio}`,
      'success'
    );
    setTimeout(() => {
      setIsSaving(false);
      router.push(`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`);
    }, 400);
  };

  const handleAnularRecepcion = () => {
    if (
      confirm(
        `¿Desea anular la recepción de la factura ${referenciaFiscal} vinculada a la ODC ${odcSeleccionadaFolio}? Esta acción revierte los registros contables y el pasivo en proveedores.`
      )
    ) {
      if (facturaExistente) {
        anularFacturaContext(facturaExistente.id, odcSeleccionadaFolio);
      } else {
        anularFacturaContext(referenciaFiscal, odcSeleccionadaFolio);
      }
      setEstadoAprobacion('Rechazado');
      setIsAnulada(true);
      mostrarToast(
        `Factura ${referenciaFiscal} anulada y desvinculada de la orden ${odcSeleccionadaFolio}`,
        'warning'
      );
      setTimeout(() => {
        router.push(`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`);
      }, 400);
    }
  };

  const mostrarAvisoFeedback = (mensaje: string) => {
    setNotificacionFeedback(mensaje);
    setTimeout(() => {
      setNotificacionFeedback(null);
    }, 5000);
  };

  const descargarArchivoSimulado = (nombre: string, tipo: string) => {
    const blob = new Blob([`Contenido de comprobante fiscal digital SIFYGSA: ${nombre}`], {
      type: tipo,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cp-dashboard-container" style={{ paddingBottom: '5rem' }}>
      {/* ── NOTIFICACIÓN FEEDBACK EN PANTALLA ── */}
      {notificacionFeedback && (
        <div
          style={{
            position: 'fixed',
            top: 76,
            right: 24,
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-control)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>{notificacionFeedback}</span>
        </div>
      )}

      {/* ── BREADCRUMB & SAT PAC EN LÍNEA (IMAGEN 10 / REGISTRO FISCAL CFDI 4.0) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span>Operaciones</span>
          <span>&gt;</span>
          <Link href="/facturas" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Facturas / Facturación
          </Link>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            Registro Fiscal CFDI 4.0
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              color: '#10b981',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
              }}
            />
            SAT PAC: En Línea
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              sync
            </span>
            Sincronizado 10:42 AM
          </span>
        </div>
      </div>

      {/* ── ENCABEZADO PRINCIPAL DE FACTURA CON ACCIONES UNIFICADAS ── */}
      <div
        className="cp-ns-hero-header"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            width: '100%',
          }}
        >
          {/* Título, un solo estatus principal y folio en una sola línea */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              className="cp-ns-hero-icon"
              style={{
                backgroundColor: 'rgba(29, 78, 216, 0.15)',
                color: '#1d4ed8',
                borderRadius: 8,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                receipt_long
              </span>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flexWrap: 'wrap',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Factura
                </h1>
                <span
                  style={{
                    backgroundColor: isAnulada
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    color: isAnulada ? '#dc2626' : '#f59e0b',
                    border: isAnulada
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '9999px',
                    padding: '2px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {isAnulada ? 'ANULADA / CANCELADA' : 'ABIERTA / PENDIENTE DE PAGO'}
                </span>
              </div>

              {/* Subtítulo en una sola línea: Folio monoespaciado, OC y Proveedor */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  marginTop: 4,
                  flexWrap: 'wrap',
                  fontSize: '0.82rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    verified
                  </span>
                  CFDI 4.0 TIMBRADO
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {referenciaFiscal || 'FAC-2026-8910'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {odcSeleccionadaFolio} — {proveedorNombre}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                  }}
                >
                  Folio Fiscal SAT: {referenciaFiscal}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción unificados en el encabezado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div className="cp-ns-btn-split">
              <button
                type="button"
                className="cp-ns-btn-primary"
                onClick={() => handleGuardarRecepcion(false)}
                disabled={isSaving}
                style={{ backgroundColor: '#1d4ed8' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  save
                </span>
                <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </button>
              <button
                type="button"
                className="cp-ns-btn-primary"
                style={{
                  backgroundColor: '#1d4ed8',
                  borderLeft: '1px solid rgba(255,255,255,0.25)',
                  padding: '0.45rem 0.35rem',
                }}
                onClick={() => handleGuardarRecepcion(true)}
                disabled={isSaving}
                title="Guardar borrador"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_drop_down
                </span>
              </button>
            </div>

            <Link
              href={`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`}
              className="cp-ns-btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              Cancelar
            </Link>

            <button
              type="button"
              className="cp-ns-btn-secondary"
              onClick={() => setMostrarModalImpuestos(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                visibility
              </span>
              <span>Vista previa impuesto</span>
            </button>

            <button
              type="button"
              className="cp-ns-btn-secondary"
              onClick={handleRecalcular}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                sync
              </span>
              <span>Recalcular</span>
            </button>

            {/* Menú desplegable Acciones */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="cp-ns-btn-secondary"
                onClick={() => setMostrarMenuAcciones((prev) => !prev)}
              >
                <span>Acciones</span>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  arrow_drop_down
                </span>
              </button>
              {mostrarMenuAcciones && (
                <div
                  style={{
                    position: 'absolute',
                    top: '105%',
                    right: 0,
                    width: 250,
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    zIndex: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <button
                    type="button"
                    className="cp-ns-action-menu-item"
                    onClick={() => {
                      setMostrarMenuAcciones(false);
                      alert(
                        `Validando UUID ${uuidFiscal} ante padrón SAT CFDI 4.0... Resultado: Comprobante VIGENTE.`
                      );
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', color: '#10b981' }}
                    >
                      verified
                    </span>
                    <span>Validar CFDI SAT 4.0</span>
                  </button>
                  <button
                    type="button"
                    className="cp-ns-action-menu-item"
                    onClick={() => {
                      setMostrarMenuAcciones(false);
                      descargarArchivoSimulado(
                        `Poliza_Contable_${referenciaFiscal}.pdf`,
                        'application/pdf'
                      );
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', color: 'var(--primary)' }}
                    >
                      picture_as_pdf
                    </span>
                    <span>Imprimir Póliza Contable</span>
                  </button>
                  <button
                    type="button"
                    className="cp-ns-action-menu-item"
                    style={{ color: '#ef4444' }}
                    onClick={() => {
                      setMostrarMenuAcciones(false);
                      handleAnularRecepcion();
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      cancel
                    </span>
                    <span>Anular Recepción</span>
                  </button>
                </div>
              )}
            </div>

            {/* Accesos rápidos a vistas y listado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <Link
                href="/compras/facturas/registro"
                className="cp-ns-btn cp-ns-btn-primary"
                style={{ height: 32, padding: '0 0.65rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                title="Nuevo Registro de Factura Asistido por Pasos"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                <span>Registrar Factura</span>
              </Link>

              <Link
                href="/compras/facturas/registro?vista=programadas"
                className="cp-ns-btn cp-ns-btn-secondary"
                style={{ height: 32, padding: '0 0.65rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                title="Ver Facturas Programadas por Vencimiento"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>event_note</span>
                <span>Facturas Programadas</span>
              </Link>

              <button
                type="button"
                className="cp-ns-util-btn"
                style={{ padding: '0.45rem' }}
                title="Conmutar entre vista Ficha y Listado Bóveda"
                onClick={() => setVistaActual(vistaActual === 'detalle' ? 'lista' : 'detalle')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  format_list_bulleted
                </span>
              </button>
              <button
                type="button"
                className="cp-ns-util-btn"
                style={{ padding: '0.45rem' }}
                title="Imprimir comprobante"
                onClick={() => window.print()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  print
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TARJETAS DE RESUMEN KPI (4 TARJETAS EXACTO IMAGEN 10, SIN DATOS DUPLICADOS) ── */}
      {vistaActual === 'detalle' && (
        <div
          className="cp-kpi-grid"
          style={{
            marginBottom: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <div className="cp-kpi-card">
            <div className="cp-kpi-top">
              <span className="cp-kpi-label">ORDEN COMPRA LIGADA</span>
              <div className="cp-kpi-icon blue">
                <span className="material-symbols-outlined">shopping_cart</span>
              </div>
            </div>
            <div
              className="cp-kpi-value"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '1.25rem',
                fontFamily: 'monospace',
              }}
            >
              <Link
                href={`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`}
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Abrir expediente de la orden de compra"
              >
                {odcSeleccionadaFolio}
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  open_in_new
                </span>
              </Link>
            </div>
            <div className="cp-kpi-trend neutral">
              <span>
                {proveedorNombre.length > 25
                  ? proveedorNombre.slice(0, 25) + '...'
                  : proveedorNombre}
              </span>
            </div>
          </div>

          <div className="cp-kpi-card">
            <div className="cp-kpi-top">
              <span className="cp-kpi-label">IMPORTE FACTURADO</span>
              <div className="cp-kpi-icon blue">
                <span className="material-symbols-outlined">payments</span>
              </div>
            </div>
            <div className="cp-kpi-value" style={{ fontSize: '1.35rem', fontWeight: 900 }}>
              ${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              <small
                style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}
              >
                {moneda}
              </small>
            </div>
            <div className="cp-kpi-trend up">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                check_circle
              </span>
              <span>
                Subtotal ${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                + IVA ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="cp-kpi-card">
            <div className="cp-kpi-top">
              <span className="cp-kpi-label">VALIDACIÓN FISCAL SAT</span>
              <div className="cp-kpi-icon green">
                <span className="material-symbols-outlined">verified</span>
              </div>
            </div>
            <div
              className="cp-kpi-value"
              style={{
                fontSize: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#10b981',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                check_circle
              </span>
              <span>Vigente y Timbrado</span>
            </div>
            <div className="cp-kpi-trend up">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                fingerprint
              </span>
              <span style={{ fontFamily: 'monospace' }}>
                UUID: {uuidFiscal.slice(0, 16)}...
              </span>
            </div>
          </div>

          <div className="cp-kpi-card">
            <div className="cp-kpi-top">
              <span className="cp-kpi-label">VENCIMIENTO FISCAL</span>
              <div className="cp-kpi-icon orange">
                <span className="material-symbols-outlined">event_available</span>
              </div>
            </div>
            <div className="cp-kpi-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {fechaVencimiento}{' '}
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                (En término)
              </span>
            </div>
            <div className="cp-kpi-trend up">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                schedule
              </span>
              <span>Plazo de crédito: {plazoDias} días</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          VISTA 1: FICHA DE RECEPCIÓN Y GESTIÓN DE FACTURAS (STITCH d1850c5d6d7b46bbad528166e412016a)
          ══════════════════════════════════════════════════════════════════════════ */}
      {vistaActual === 'detalle' && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── DROPZONE & BOTÓN DE CARGA RÁPIDA XML CFDI 4.0 DE EJEMPLO ── */}
          <input
            type="file"
            ref={xmlFileInputRef}
            style={{ display: 'none' }}
            accept=".xml,.pdf"
            onChange={(e) => {
              handleFileDropOrSelect(e.target.files);
              e.target.value = '';
            }}
          />

          <div
            className="cp-ns-section-card"
            style={{
              border: isDraggingXml ? '2px dashed var(--primary)' : '1px dashed var(--border)',
              backgroundColor: isDraggingXml ? 'rgba(59, 130, 246, 0.05)' : 'var(--card)',
              transition: 'all 0.2s ease',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingXml(true);
            }}
            onDragLeave={() => setIsDraggingXml(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingXml(false);
              handleFileDropOrSelect(e.dataTransfer.files);
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                    cloud_upload
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Adjuntar Factura CFDI 4.0 SAT (XML / PDF)
                    </h4>
                    {autocompletadoDesdeXml && (
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                        Autocompletado desde XML
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Arrastra aquí el comprobante fiscal XML para autollenar en automático folio fiscal, proveedor, UUID, fecha, retenciones e importes.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="cp-ns-btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.85rem',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => handleProcesarXmlString(SAMPLE_CFDI_40_XML, 'FAC_FivePeaks_FAC-GMX-99421.xml')}
                  title="Cargar automáticamente el XML CFDI 4.0 de prueba de Five Peaks México (FAC-GMX-99421)"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>auto_fix_high</span>
                  <span>🪄 Cargar XML Ejemplo SAT (Five Peaks FAC-GMX-99421)</span>
                </button>

                <button
                  type="button"
                  className="cp-ns-btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => xmlFileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>upload_file</span>
                  <span>Seleccionar Archivo...</span>
                </button>
              </div>
            </div>

            {/* Alertas informativas no bloqueantes */}
            <div style={{ padding: '0 1.25rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {alertaRfcDiferente && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-control)',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.78rem',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>warning</span>
                  <span>{alertaRfcDiferente}</span>
                </div>
              )}

              {alertaRecepcionParcial && (
                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-control)',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.78rem',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>info</span>
                  <span>{alertaRecepcionParcial}</span>
                </div>
              )}

              {autocompletadoDesdeXml && alertaUuidOk && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-control)',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.78rem',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>verified</span>
                  <span>{alertaUuidOk}</span>
                </div>
              )}
            </div>
          </div>
          {/* ── SECCIÓN 1: INFORMACIÓN PRIMARIA (RECEPCIÓN CONTRA ODC) ── */}
          <div className="cp-ns-section-card">
            <div
              className="cp-ns-collapsible-bar"
              onClick={() => setSecInfoPrimariaOpen((prev) => !prev)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {secInfoPrimariaOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Información primaria (Recepción contra ODC: {odcSeleccionadaFolio})
                </span>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-control)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
                ODC Recibida parcialmente
              </span>
            </div>

            {secInfoPrimariaOpen && (
              <div className="cp-ns-section-body" style={{ padding: '1.25rem 1.5rem' }}>
                {/* ── ESTILOS GRID RESPONSIVO INFORMACIÓN PRIMARIA (3 COLUMNAS EXACTO IMAGEN 1) ── */}
                <style>{`
                  .cp-factura-3col-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.15fr 1fr;
                    gap: 1.5rem;
                    align-items: start;
                  }
                  @media (max-width: 1024px) {
                    .cp-factura-3col-grid {
                      grid-template-columns: 1fr 1fr;
                      gap: 1.15rem;
                    }
                  }
                  @media (max-width: 640px) {
                    .cp-factura-3col-grid {
                      grid-template-columns: 1fr;
                      gap: 1rem;
                    }
                  }
                `}</style>

                <div className="cp-factura-3col-grid">
                  {/* ── COLUMNA 1: FORMULARIO, PROVEEDOR, FECHA DE EMISIÓN, LÍMITE DE CRÉDITO ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                    <div>
                      <label className="cp-ns-label">
                        FORMULARIO PERSONALIZADO <span className="req">*</span>
                      </label>
                      <select
                        className="cp-ns-select"
                        value={formularioPersonalizado}
                        onChange={(e) => setFormularioPersonalizado(e.target.value)}
                      >
                        <option value="SIFYGSA - Factura del proveedor (Norma Compras)">
                          SIFYGSA - Factura del proveedor (Norma...)
                        </option>
                        <option value="SIFYGSA - Recepción Directa Contable">
                          SIFYGSA - Recepción Directa Contable
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="cp-ns-label">
                        PROVEEDOR <span className="req">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="cp-ns-input"
                          value={proveedorNombre}
                          onChange={(e) => setProveedorNombre(e.target.value)}
                        />
                        <button
                          type="button"
                          style={{
                            position: 'absolute',
                            right: 6,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                          title="Ver ficha de proveedor"
                          onClick={() => router.push('/compras/proveedores')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>unfold_more</span>
                        </button>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        RFC: {proveedorRfc} • Régimen 601 General de Ley
                      </span>
                    </div>

                    <div>
                      <label className="cp-ns-label">
                        FECHA DE EMISIÓN <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        className="cp-ns-input"
                        value={fechaEmision}
                        onChange={(e) => setFechaEmision(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="cp-ns-label">LÍMITE DE CRÉDITO</label>
                      <div
                        style={{
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 0.75rem',
                          borderRadius: 'var(--radius-control)',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span>${limiteCredito.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                          (Disponible: ${creditoDisponible.toLocaleString('es-MX', { minimumFractionDigits: 2 })})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── COLUMNA 2: REFERENCIA N.°, SUBSIDIARIA, NOTA/CONDICIONES, CUENTA CONTABLE, PERÍODO CONTABLE ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                    <div>
                      <label className="cp-ns-label">
                        REFERENCIA N.° (FACTURA FISCAL) <span className="req">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="cp-ns-input"
                          style={{ fontFamily: 'monospace', fontWeight: 700 }}
                          value={referenciaFiscal}
                          onChange={(e) => setReferenciaFiscal(e.target.value)}
                          placeholder="Ej. FAC-GMX-99421"
                        />
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#10b981',
                            fontSize: '16px',
                          }}
                          title="Referencia fiscal validada"
                        >
                          check_circle
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Ingresar folio fiscal tal como figura en el CFDI
                      </span>
                    </div>

                    <div>
                      <label className="cp-ns-label">SUBSIDIARIA</label>
                      <div
                        style={{
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          gap: '0.4rem',
                          padding: '0 0.75rem',
                          borderRadius: 'var(--radius-control)',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subsidiaria}</span>
                      </div>
                    </div>

                    <div>
                      <label className="cp-ns-label">NOTA / CONDICIONES</label>
                      <input
                        type="text"
                        className="cp-ns-input"
                        value={notaCondiciones}
                        onChange={(e) => setNotaCondiciones(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="cp-ns-label">
                        CUENTA CONTABLE NORMATIVA <span className="req">*</span>
                      </label>
                      <select
                        className="cp-ns-select"
                        style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                        value={cuentaContable}
                        onChange={(e) => setCuentaContable(e.target.value)}
                      >
                        <option value="2110-0010-0000-0000 PROVEEDORES MXN">
                          2110 0010 0000 0000 PROVEEDORES MXN
                        </option>
                        <option value="2110-0020-0000-0000 PROVEEDORES EXTRANJEROS (USD)">
                          2110 0020 0000 0000 PROVEEDORES EXTRANJEROS (USD)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="cp-ns-label">
                        PERÍODO CONTABLE <span className="req">*</span>
                      </label>
                      <select
                        className="cp-ns-select"
                        value={periodoContable}
                        onChange={(e) => setPeriodoContable(e.target.value)}
                      >
                        <option value="oct 2026">oct 2026</option>
                        <option value="nov 2026">nov 2026</option>
                        <option value="dic 2026">dic 2026</option>
                      </select>
                    </div>
                  </div>

                  {/* ── COLUMNA 3: FECHA DE VENCIMIENTO, IMPORTE TOTAL, RETENCIÓN DEL PAGO ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label className="cp-ns-label" style={{ margin: 0 }}>
                          FECHA DE VENCIMIENTO <span className="req">*</span>
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="cp-ns-util-btn"
                            style={{ padding: '1px 6px', fontSize: '0.68rem', backgroundColor: plazoDias === 0 ? 'var(--primary)' : 'var(--surface-alt)', color: plazoDias === 0 ? '#fff' : 'var(--text-primary)' }}
                            onClick={() => handleAplicarPlazoDias(0)}
                          >
                            Contado
                          </button>
                          <button
                            type="button"
                            className="cp-ns-util-btn"
                            style={{ padding: '1px 6px', fontSize: '0.68rem', backgroundColor: plazoDias === 15 ? 'var(--primary)' : 'var(--surface-alt)', color: plazoDias === 15 ? '#fff' : 'var(--text-primary)' }}
                            onClick={() => handleAplicarPlazoDias(15)}
                          >
                            15
                          </button>
                          <button
                            type="button"
                            className="cp-ns-util-btn"
                            style={{ padding: '1px 6px', fontSize: '0.68rem', backgroundColor: plazoDias === 30 ? 'var(--primary)' : 'var(--surface-alt)', color: plazoDias === 30 ? '#fff' : 'var(--text-primary)' }}
                            onClick={() => handleAplicarPlazoDias(30)}
                          >
                            30
                          </button>
                          <button
                            type="button"
                            className="cp-ns-util-btn"
                            style={{ padding: '1px 6px', fontSize: '0.68rem', backgroundColor: plazoDias === 60 ? 'var(--primary)' : 'var(--surface-alt)', color: plazoDias === 60 ? '#fff' : 'var(--text-primary)' }}
                            onClick={() => handleAplicarPlazoDias(60)}
                          >
                            60
                          </button>
                        </div>
                      </div>
                      <input
                        type="date"
                        className="cp-ns-input"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                        Plazo: {plazoDias} días a partir de emisión
                      </span>
                    </div>

                    <div>
                      <label className="cp-ns-label">
                        IMPORTE TOTAL (CON IMPUESTOS) <span className="req">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontFamily: 'monospace',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                          }}
                        >
                          $
                        </span>
                        <input
                          type="text"
                          className="cp-ns-input"
                          style={{
                            paddingLeft: '1.4rem',
                            paddingRight: '3rem',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                          }}
                          value={granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          readOnly
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {moneda}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                        <span>Subtotal: ${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        <span>IVA 16%: ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          padding: '0.6rem 0.75rem',
                          backgroundColor: 'var(--surface-alt)',
                          borderRadius: 'var(--radius-control)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={retencionPago}
                            onChange={(e) => setRetencionPago(e.target.checked)}
                          />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                            Retención del pago
                          </span>
                        </label>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Marcar únicamente si Tesorería requiere validación física de equipo contra reporte de inspección.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECCIÓN 2: TRES BLOQUES INFERIORES (CLASIFICACIÓN, TRANSACTION INFO, APPROVAL) ── */}
          <div className="cp-ns-section-card">
            <div
              className="cp-ns-collapsible-bar"
              onClick={() => setSecClasificacionOpen((prev) => !prev)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {secClasificacionOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Clasificación, Información de Transacción y Aprobación
                </span>
              </div>
            </div>

            {secClasificacionOpen && (
              <div className="cp-ns-section-body" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {/* 1. Clasificación Fiscal */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10b981' }}>verified_user</span>
                        Clasificación Fiscal
                      </h3>
                      <span className="cp-badge cp-badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        SAT 4.0
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <label className="cp-ns-label" style={{ margin: 0 }}>CFDI 4.0 : UUID (FOLIO FISCAL SAT)</label>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                          title="Copiar UUID"
                          onClick={() => {
                            navigator.clipboard?.writeText(uuidFiscal);
                            mostrarToast('UUID copiado al portapapeles', 'info');
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        className="cp-ns-input"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.74rem',
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '6px 8px',
                        }}
                        value={uuidFiscal}
                        readOnly
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="cp-ns-label">IMPUESTO IVA (16%)</label>
                        <div
                          style={{
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--card)',
                            padding: '0 0.5rem',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}
                        </div>
                      </div>
                      <div>
                        <label className="cp-ns-label">RFC EMISOR PROVEEDOR</label>
                        <div
                          style={{
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.82rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            backgroundColor: 'var(--card)',
                            padding: '0 0.5rem',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {proveedorRfc}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="cp-ns-label">TIPO DE OPERACIÓN</label>
                      <select
                        className="cp-ns-select"
                        value={tipoOperacion}
                        onChange={(e) => setTipoOperacion(e.target.value)}
                        style={{ height: 34, fontSize: '0.8rem' }}
                      >
                        <option value="Prestación de Servicios Profesionales">Prestación de Servicios Profesionales</option>
                        <option value="Adquisición de Mercancías">Adquisición de Mercancías</option>
                        <option value="Arrendamiento">Arrendamiento</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>check_box</span>
                      <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                        UUID RECEIVED (XML Timbrado SAT)
                      </span>
                    </div>
                  </div>

                  {/* 2. Información de la Transacción */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>currency_exchange</span>
                        Información de la Transacción
                      </h3>
                      <span className="cp-badge cp-badge-neutral" style={{ fontSize: '0.68rem', padding: '1px 6px', fontFamily: 'monospace' }}>
                        FX: {tipoCambio.toFixed(4)}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                      <div>
                        <label className="cp-ns-label">MONEDA</label>
                        <select
                          className="cp-ns-select"
                          value={moneda}
                          onChange={(e) => setMoneda(e.target.value as 'MXN' | 'USD')}
                          style={{ height: 34, fontSize: '0.8rem' }}
                        >
                          <option value="MXN">MXN - Peso Mexicano</option>
                          <option value="USD">USD - Dólar Estadounidense</option>
                        </select>
                      </div>
                      <div>
                        <label className="cp-ns-label">
                          TIPO DE CAMBIO <span className="req">*</span>
                        </label>
                        <div
                          style={{
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 0.5rem',
                            backgroundColor: 'var(--card)',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                          }}
                        >
                          {tipoCambio.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="cp-ns-label">REQUISICIÓN DE CONTRATO (AD / RQ)</label>
                      <div
                        style={{
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          backgroundColor: 'var(--card)',
                          padding: '0 0.5rem',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span>{adReqContrato}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-muted)' }}>open_in_new</span>
                      </div>
                    </div>

                    <div>
                      <label className="cp-ns-label">NO. DE ORDEN COMPRA RELACIONADA</label>
                      <div
                        style={{
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          backgroundColor: 'var(--card)',
                          padding: '0 0.5rem',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          color: 'var(--primary)',
                        }}
                      >
                        <span>SFG-C259-LVT-OC-127/26 ({odcSeleccionadaFolio})</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Proyecto: <strong>Tenaris Tamsa LVT</strong> • Contrato Marco <strong>C259</strong>
                    </div>
                  </div>

                  {/* 3. Flujo de Aprobación */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      padding: '1rem',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10b981' }}>thumb_up</span>
                        Flujo de Aprobación
                      </h3>
                      <span className="cp-badge cp-badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        ✓ Aprobado
                      </span>
                    </div>

                    <div>
                      <label className="cp-ns-label">ESTADO DE APROBACIÓN</label>
                      <select
                        className="cp-ns-select"
                        value={estadoAprobacion}
                        onChange={(e) => setEstadoAprobacion(e.target.value as 'Aprobado' | 'Pendiente' | 'Rechazado')}
                        style={{ height: 34, fontSize: '0.8rem', fontWeight: 700, color: estadoAprobacion === 'Aprobado' ? '#10b981' : 'inherit' }}
                      >
                        <option value="Aprobado">Aprobado para Pago</option>
                        <option value="Pendiente">Pendiente de Autorización</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="cp-ns-label">APROBACIÓN DE DG</label>
                        <div
                          style={{
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            backgroundColor: 'var(--card)',
                            padding: '0 0.5rem',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                          }}
                        >
                          {fechaAprobacionDg}
                        </div>
                      </div>
                      <div>
                        <label className="cp-ns-label">FECHA DE REVISIÓN</label>
                        <div
                          style={{
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            backgroundColor: 'var(--card)',
                            padding: '0 0.5rem',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                          }}
                        >
                          {fechaRevision}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="cp-ns-label">APROBADOR REGISTRADO</label>
                      <div
                        style={{
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--card)',
                          padding: '0 0.5rem',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            fontSize: '0.65rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                          }}
                        >
                          CM
                        </span>
                        <span>Ing. Carlos Mendoza Estrada</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Gerencia de Compras & Suministro • <span style={{ color: '#10b981', fontWeight: 600 }}>Liberado para Dispersión</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECCIÓN 3: PESTAÑAS NETSUITE ERP (STITCH & NETSUITE EXACTO) ── */}
          <div className="cp-ns-section-card">
            {/* Barra principal de pestañas - 8 Pestañas Normativas */}
            <div className="cp-ns-tabs-bar">
              <div className="cp-ns-tabs-list">
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'gastos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('gastos')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
                  <span>Gastos y artículos</span>
                  <span className="cp-ns-tab-badge">{partidas.length}</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'facturacion' ? 'active' : ''}`}
                  onClick={() => setActiveTab('facturacion')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                  <span>Facturación</span>
                  <span className="cp-ns-tab-badge">{facturas.length}</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'relaciones' ? 'active' : ''}`}
                  onClick={() => setActiveTab('relaciones')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_tree</span>
                  <span>Relaciones</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'comunicacion' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comunicacion')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>attach_file</span>
                  <span>Comunicación</span>
                  <span className="cp-ns-tab-badge">{archivosTransaccion.length}</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'sistema' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sistema')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>dns</span>
                  <span>Información del sistema</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'personalizado' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personalizado')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
                  <span>Personalizado</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'documento' ? 'active' : ''}`}
                  onClick={() => setActiveTab('documento')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
                  <span>Documento electrónico</span>
                </button>
                <button
                  type="button"
                  className={`cp-ns-tab ${activeTab === 'cfdi' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cfdi')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>qr_code_2</span>
                  <span>CFDI Information</span>
                </button>
              </div>
            </div>

            {/* ── PANEL 1: GASTOS Y ARTÍCULOS ── */}
            {activeTab === 'gastos' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem 1.25rem' }}>
                {/* Sub-barra de conteo / categorías: Artículos 3,550.00 • Gastos 0.00 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    backgroundColor: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--border)',
                    marginBottom: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>inventory_2</span>
                      Artículos <span style={{ color: '#10b981' }}>${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      Gastos $0.00
                    </span>
                    <span className="cp-badge cp-badge-info" style={{ fontSize: '0.72rem' }}>
                      {partidas.length} partidas conciliadas
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="cp-ns-btn-primary"
                      onClick={handleAgregarPartidaInline}
                      title="Inserta una nueva partida directamente en la tabla sin abrir ventana emergente"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                      <span>+ Agregar Nueva Partida Directa</span>
                    </button>
                    <button
                      type="button"
                      className="cp-ns-util-btn"
                      onClick={() => mostrarAvisoFeedback('Catálogo de suministros sincronizado con partidas de la ODC.')}
                    >
                      Agregar varios
                    </button>
                    <button
                      type="button"
                      className="cp-ns-util-btn"
                      onClick={() => {
                        if (confirm('¿Borrar todas las líneas de artículos de esta recepción?')) {
                          setPartidas([]);
                        }
                      }}
                    >
                      Borrar todas las líneas
                    </button>
                  </div>
                </div>

                {/* Tabla de Partidas de Factura */}
                <div className="cp-ns-table-wrap">
                  <table className="cp-ns-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 130 }}>
                          ARTÍCULO <span style={{ color: '#ef4444' }}>*</span>
                        </th>
                        <th style={{ minWidth: 120 }}>NOMBRE DEL PROVEEDOR</th>
                        <th style={{ minWidth: 300 }}>DESCRIPCIÓN</th>
                        <th style={{ minWidth: 140 }}>DEPARTAMENTO</th>
                        <th style={{ textAlign: 'right', minWidth: 75 }}>CANTIDAD</th>
                        <th style={{ minWidth: 90 }}>UNIDADES</th>
                        <th style={{ textAlign: 'right', minWidth: 105 }}>V. UNITARIO</th>
                        <th style={{ textAlign: 'right', minWidth: 105 }}>IMPORTE</th>
                        <th style={{ textAlign: 'center', minWidth: 80 }}>OPCIONES</th>
                        <th style={{ textAlign: 'right', minWidth: 85 }}>IMP. BRUTO</th>
                        <th style={{ minWidth: 120 }}>PROGRAMA AMORTIZAC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidas.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                            {item.articulo}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.nombreProveedor}</td>
                          <td style={{ fontSize: '0.8rem', lineHeight: '1.35', color: 'var(--text-primary)' }}>{item.descripcion}</td>
                          <td>
                            <span className="cp-badge cp-badge-neutral" style={{ fontSize: '0.7rem' }}>
                              {item.departamento}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>
                            {item.cantidad}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {item.unidades}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                            ${item.valorUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>
                            ${item.importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="cp-ns-util-btn"
                              style={{ padding: '2px 6px', color: '#ef4444' }}
                              title="Eliminar esta partida"
                              onClick={() => setPartidas((prev) => prev.filter((p) => p.id !== item.id))}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                            </button>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            ${(item.importe * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.programaAmortizac}</td>
                        </tr>
                      ))}

                      {/* Fila de captura interactiva directa en tabla */}
                      <tr className="cp-ns-inline-row">
                        <td>
                          <input
                            type="text"
                            className="cp-ns-input"
                            style={{ height: 32, fontSize: '0.78rem', fontFamily: 'monospace' }}
                            placeholder="SKU / Código..."
                            value={inlineArticulo}
                            onChange={(e) => setInlineArticulo(e.target.value)}
                          />
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{proveedorNombre.slice(0, 14)}</span>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="cp-ns-input"
                            style={{ height: 32, fontSize: '0.78rem' }}
                            placeholder="Descripción del concepto o servicio..."
                            value={inlineDescripcion}
                            onChange={(e) => setInlineDescripcion(e.target.value)}
                          />
                        </td>
                        <td>
                          <span className="cp-badge cp-badge-neutral" style={{ fontSize: '0.7rem' }}>Compras</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            className="cp-ns-input"
                            style={{ height: 32, width: 70, textAlign: 'right', fontSize: '0.78rem', fontFamily: 'monospace' }}
                            value={inlineCantidad}
                            onChange={(e) => setInlineCantidad(Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SERVICIO</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            className="cp-ns-input"
                            style={{ height: 32, width: 95, textAlign: 'right', fontSize: '0.78rem', fontFamily: 'monospace' }}
                            value={inlineValorUnitario}
                            onChange={(e) => setInlineValorUnitario(Number(e.target.value))}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                          ${(inlineCantidad * inlineValorUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="cp-ns-btn-primary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                            onClick={handleAgregarPartidaInline}
                            title="Insertar partida en la tabla"
                          >
                            + Agregar
                          </button>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          ${(inlineCantidad * inlineValorUnitario * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td>-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Botonera de fila inline */}
                <div className="cp-ns-inline-actions">
                  <button
                    type="button"
                    className="cp-ns-inline-btn add"
                    onClick={handleAgregarPartidaInline}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                    <span>Agregar Partida a Tabla</span>
                  </button>
                  <button
                    type="button"
                    className="cp-ns-inline-btn cancel"
                    onClick={() => {
                      setInlineArticulo('');
                      setInlineDescripcion('');
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
                    <span>Limpiar Fila</span>
                  </button>
                  <button
                    type="button"
                    className="cp-ns-inline-btn insert"
                    onClick={() => {
                      if (partidas.length > 0) {
                        const ult = partidas[partidas.length - 1];
                        setInlineArticulo(ult.articulo);
                        setInlineDescripcion(ult.descripcion);
                        setInlineCantidad(ult.cantidad);
                        setInlineValorUnitario(ult.valorUnitario);
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
                    <span>Copiar anterior</span>
                  </button>
                  <button
                    type="button"
                    className="cp-ns-inline-btn insert"
                    onClick={handleAgregarPartidaInline}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>playlist_add</span>
                    <span>Insertar Línea</span>
                  </button>
                  <button
                    type="button"
                    className="cp-ns-inline-btn delete"
                    onClick={() => {
                      if (partidas.length > 0) {
                        setPartidas((prev) => prev.slice(0, -1));
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                    <span>Eliminar Última</span>
                  </button>
                </div>

                {/* ── VALIDACIÓN DE SELLOS DIGITALES SAT & RESUMEN DE LIQUIDACIÓN (IMAGEN 10) ── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.25rem',
                    marginTop: '1.25rem',
                  }}
                >
                  {/* Validación de Sellos Digitales SAT */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10b981' }}>verified</span>
                        Validación de Sellos Digitales SAT
                      </span>
                      <span className="cp-badge cp-badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        ✓ Certificado CSD Válido
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          No. Certificado SAT:
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                          00001000000504465028
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          Régimen Fiscal Emisor:
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                          601 - General de Ley Personas Morales
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        Cadena Original del Complemento de Certificación:
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.68rem',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--card)',
                          padding: '6px 8px',
                          borderRadius: 4,
                          border: '1px solid var(--border)',
                          marginTop: 4,
                          wordBreak: 'break-all',
                          lineHeight: 1.4,
                        }}
                      >
                        {`||1.1|${uuidFiscal}|2026-10-27T10:35:12|${proveedorRfc}|${subtotalTotal.toFixed(2)}|${moneda}|${granTotal.toFixed(2)}|I|PUE|91700||`}
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Liquidación */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Resumen de Liquidación
                      </span>
                      <span className="cp-badge cp-badge-neutral" style={{ fontSize: '0.68rem', padding: '1px 6px', fontFamily: 'monospace' }}>
                        {moneda} ($)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Subtotal Neto</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>IVA Trasladado (16%)</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Retención ISR (0.00%)</span>
                      <span style={{ fontFamily: 'monospace' }}>$0.00 {moneda}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Retención IVA (0.00%)</span>
                      <span style={{ fontFamily: 'monospace' }}>$0.00 {moneda}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginTop: 4,
                        paddingTop: 8,
                        borderTop: '1px dashed var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Total Factura
                      </span>
                      <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 900, color: '#10b981' }}>
                        ${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
                      <span>Saldo Pendiente:</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        ${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── EXPEDIENTE ELECTRÓNICO FISCAL (CFDI 4.0) (IMAGEN 10) ── */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1.15rem',
                    backgroundColor: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>
                        inventory
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Expediente Electrónico Fiscal (CFDI 4.0)
                      </h4>
                    </div>
                    <span className="cp-badge cp-badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                      ✓ Conciliado con Buzón Tributario
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {/* Archivo XML */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--card)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>code</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {archivosTransaccion.find((a) => a.nombre.toLowerCase().endsWith('.xml'))?.nombre || `${proveedorRfc}_${referenciaFiscal}.xml`}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            CFDI 4.0 Timbrado • 24.8 KB • {fechaEmision}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="cp-ns-btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                        onClick={() => descargarArchivoSimulado(`${proveedorRfc}_${referenciaFiscal}.xml`, 'text/xml')}
                        title="Descargar archivo XML oficial"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                        <span>Descargar XML</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#10b981' }}>check</span>
                      </button>
                    </div>

                    {/* Archivo PDF */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--card)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>picture_as_pdf</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {archivosTransaccion.find((a) => a.nombre.toLowerCase().endsWith('.pdf'))?.nombre || `Representacion_Impresa_${referenciaFiscal}.pdf`}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            PDF con Timbre Fiscal • 182.4 KB • {fechaEmision}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="cp-ns-btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setDocModal({
                            nombre: `Representacion_Impresa_${referenciaFiscal}.pdf`,
                            tipo: 'application/pdf',
                            tamano: 182.4 * 1024,
                          })}
                          title="Visualizar representación impresa del CFDI"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                          <span>Ver PDF</span>
                        </button>
                        <button
                          type="button"
                          className="cp-ns-util-btn"
                          style={{ padding: '0.35rem' }}
                          onClick={() => descargarArchivoSimulado(`Representacion_Impresa_${referenciaFiscal}.pdf`, 'application/pdf')}
                          title="Descargar PDF"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PANEL 2: COMUNICACIÓN & ARCHIVOS (NETSUITE ERP - IMAGEN 1 & 2 EXACTO) ── */}
            {activeTab === 'comunicacion' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '0.75rem 1rem' }}>
                {/* Input oculto para carga de archivos desde el explorador */}
                <input
                  type="file"
                  ref={fileInputComunicacionRef}
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleSubirArchivoDirecto(e.target.files);
                    e.target.value = '';
                  }}
                />

                {/* Sub-tabs NetSuite: Archivos • | Eventos | Tareas | Llamadas telefónicas (Imagen 1) */}
                <div className="cp-ns-com-subtabs-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className={`cp-ns-com-subtab-btn ${subTabComunicacion === 'archivos' ? 'active' : ''}`}
                    onClick={() => setSubTabComunicacion('archivos')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: subTabComunicacion === 'archivos' ? 700 : 500, color: subTabComunicacion === 'archivos' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <span>Archivos</span>
                    <span>•</span>
                  </button>
                  <button
                    type="button"
                    className={`cp-ns-com-subtab-btn ${subTabComunicacion === 'eventos' ? 'active' : ''}`}
                    onClick={() => setSubTabComunicacion('eventos')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: subTabComunicacion === 'eventos' ? 700 : 500, color: subTabComunicacion === 'eventos' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <span>Eventos</span>
                  </button>
                  <button
                    type="button"
                    className={`cp-ns-com-subtab-btn ${subTabComunicacion === 'tareas' ? 'active' : ''}`}
                    onClick={() => setSubTabComunicacion('tareas')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: subTabComunicacion === 'tareas' ? 700 : 500, color: subTabComunicacion === 'tareas' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <span>Tareas</span>
                  </button>
                  <button
                    type="button"
                    className={`cp-ns-com-subtab-btn ${subTabComunicacion === 'llamadas' ? 'active' : ''}`}
                    onClick={() => setSubTabComunicacion('llamadas')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: subTabComunicacion === 'llamadas' ? 700 : 500, color: subTabComunicacion === 'llamadas' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <span>Llamadas telefónicas</span>
                  </button>
                </div>

                {/* SUBTAB 1: ARCHIVOS ADJUNTOS DE COMUNICACIÓN (IMAGEN 1 EXACTO) */}
                {subTabComunicacion === 'archivos' && (
                  <div>
                    {/* Botones de acción superiores: Eliminar todo | Borrar todas las líneas */}
                    <div className="cp-ns-com-actions-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        className="cp-ns-com-action-btn"
                        onClick={handleEliminarTodoComunicacion}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-control)', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        Eliminar todo
                      </button>
                      <button
                        type="button"
                        className="cp-ns-com-action-btn"
                        onClick={handleBorrarTodasLasLineasComunicacion}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-control)', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        Borrar todas las líneas
                      </button>
                    </div>

                    {/* Tabla de Archivos de Comunicación (NetSuite ERP - Columnas de Imagen 1) */}
                    <div className="cp-ns-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)' }}>
                      <table className="cp-ns-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '38%', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                              ADJUNTAR ARCHIVO <span style={{ color: '#ef4444' }}>*</span>
                            </th>
                            <th style={{ width: '15%', textTransform: 'uppercase', fontSize: '0.74rem' }}>CARPETA</th>
                            <th style={{ width: '12%', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.74rem' }}>TAMAÑO (KB)</th>
                            <th style={{ width: '18%', textTransform: 'uppercase', fontSize: '0.74rem' }}>ÚLTIMA MODIFICACIÓN</th>
                            <th style={{ width: '17%', textTransform: 'uppercase', fontSize: '0.74rem' }}>TIPO DE ARCHIVO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivosTransaccion.map((doc) => (
                            <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <span
                                    style={{
                                      color: 'var(--text-primary)',
                                      fontSize: '0.8125rem',
                                      cursor: 'pointer',
                                      fontWeight: 500,
                                    }}
                                    onClick={() =>
                                      setDocModal({
                                        nombre: doc.nombre,
                                        tipo: doc.tipo,
                                        tamano: doc.tamano,
                                        url: doc.url,
                                      })
                                    }
                                    title="Haga clic para interpretar y previsualizar documento"
                                  >
                                    {doc.nombre}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <button
                                      type="button"
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                        padding: '2px 6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                      }}
                                      onClick={() =>
                                        setDocModal({
                                          nombre: doc.nombre,
                                          tipo: doc.tipo,
                                          tamano: doc.tamano,
                                          url: doc.url,
                                        })
                                      }
                                      title="Interpretar / Ver archivo"
                                    >
                                      Ver
                                    </button>
                                    <button
                                      type="button"
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '2px 4px',
                                        fontSize: '12px',
                                      }}
                                      title="Eliminar fila"
                                      onClick={() => handleEliminarArchivoComunicacion(doc.id)}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{doc.carpeta}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                {Math.round(doc.tamano / 1024)}
                              </td>
                              <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                {doc.fechaCarga}
                              </td>
                              <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                {doc.tipo}
                              </td>
                            </tr>
                          ))}

                          {/* Fila Activa / Inline de NetSuite: <Type then tab> (Imagen 1) */}
                          <tr className="cp-ns-inline-row" style={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input
                                  type="text"
                                  className="cp-ns-input"
                                  style={{ height: '30px', fontSize: '0.8rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--card)' }}
                                  placeholder="<Type then tab>"
                                  value={inlineArchivoFile ? inlineArchivoFile.name : inlineNombreArchivo}
                                  onChange={(e) => setInlineNombreArchivo(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAgregarArchivoComunicacion();
                                  }}
                                />
                                <button
                                  type="button"
                                  className="cp-ns-btn-secondary"
                                  style={{ padding: '0.25rem 0.45rem', height: '30px' }}
                                  title="Explorar archivo en equipo"
                                  onClick={() => fileInputComunicacionRef.current?.click()}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>attach_file</span>
                                </button>
                              </div>
                            </td>
                            <td>
                              <select
                                className="cp-ns-select"
                                style={{ height: '30px', fontSize: '0.8rem', padding: '0.2rem 0.45rem', backgroundColor: 'var(--card)' }}
                                value={inlineCarpeta}
                                onChange={(e) => setInlineCarpeta(e.target.value)}
                              >
                                <option value="HSE">HSE</option>
                                <option value="Compras">Compras</option>
                                <option value="Adjuntos">Adjuntos</option>
                                <option value="Facturas">Facturas</option>
                                <option value="Comprobantes">Comprobantes</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                className="cp-ns-input"
                                style={{ height: '30px', fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: '80px', textAlign: 'right', backgroundColor: 'var(--card)' }}
                                value={inlineTamanoKb}
                                onChange={(e) => setInlineTamanoKb(Number(e.target.value))}
                              />
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              En edición...
                            </td>
                            <td>
                              <select
                                className="cp-ns-select"
                                style={{ height: '30px', fontSize: '0.8rem', padding: '0.2rem 0.45rem', backgroundColor: 'var(--card)' }}
                                value={inlineTipoArchivo}
                                onChange={(e) => setInlineTipoArchivo(e.target.value)}
                              >
                                <option value="Imagen PNG">Imagen PNG</option>
                                <option value="Imagen JPG">Imagen JPG</option>
                                <option value="Documento PDF">Documento PDF</option>
                                <option value="Archivo XML">Archivo XML</option>
                                <option value="Hoja de Cálculo Excel">Hoja de Cálculo Excel</option>
                                <option value="Documento Word">Documento Word</option>
                              </select>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Barra de botones inline de la fila: ✔ Agregar | ✖ Cancelar | + Insertar | 🗑 Eliminar */}
                      <div className="cp-ns-inline-actions" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-alt)', borderTop: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          className="cp-ns-inline-btn add"
                          onClick={handleAgregarArchivoComunicacion}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 'var(--radius-control)', backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check</span>
                          <span>Agregar</span>
                        </button>
                        <button
                          type="button"
                          className="cp-ns-inline-btn cancel"
                          onClick={() => {
                            setInlineNombreArchivo('');
                            setInlineArchivoFile(null);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-control)', backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
                          <span>Cancelar</span>
                        </button>
                        <button
                          type="button"
                          className="cp-ns-inline-btn"
                          onClick={() => fileInputComunicacionRef.current?.click()}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-control)', backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
                          <span>Insertar</span>
                        </button>
                        <button
                          type="button"
                          className="cp-ns-inline-btn delete"
                          onClick={() => {
                            if (archivosTransaccion.length > 0) {
                              handleEliminarArchivoComunicacion(archivosTransaccion[archivosTransaccion.length - 1].id);
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-control)', backgroundColor: 'var(--card)', color: '#ef4444', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>

                    {/* Barra de Acciones ERP al pie de tabla de Comunicación (Imagen 1) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="cp-ns-btn-primary"
                          onClick={() => handleGuardarRecepcion(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>save</span>
                          <span>Guardar</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_drop_down</span>
                        </button>
                        <button
                          type="button"
                          className="cp-ns-btn-secondary"
                          onClick={() => router.push(`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="cp-ns-btn-secondary"
                          onClick={() => setMostrarModalImpuestos(true)}
                        >
                          Vista previa de impuesto
                        </button>
                        <button
                          type="button"
                          className="cp-ns-btn-secondary"
                          onClick={handleRecalcular}
                        >
                          Recalcular
                        </button>
                        <button
                          type="button"
                          className="cp-ns-btn-secondary"
                          onClick={() => setMostrarMenuAcciones((prev) => !prev)}
                        >
                          Acciones
                        </button>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        Archivos cotejados: {archivosTransaccion.length} | HSE Planta Tenaris Tamsa
                      </span>
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: EVENTOS */}
                {subTabComunicacion === 'eventos' && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Bitácora de Eventos de Comunicación
                      </h4>
                      <button
                        type="button"
                        className="cp-ns-btn-primary"
                        onClick={() => mostrarToast('Formulario de nuevo evento aperturado', 'info')}
                      >
                        + Programar Evento
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Reunión previa de Seguridad HSE - Tenaris Tamsa</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>08/10/2026 10:00 AM</span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Coordinación de acceso y protocolos de sanidad con supervisión de contratistas Tenaris Tamsa. Asistieron: Ing. Roberto Silva, Ing. M. Torres y Pamela León (Five Peaks).
                        </p>
                      </div>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Entrega e Instalación de Caseta en Patio de Maniobras Nave 4</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>08/10/2026 05:00 PM</span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Recepción física del baño portátil SER-REN-BAÑ con verificación fotográfica e informe de nivelación en terreno.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: TAREAS */}
                {subTabComunicacion === 'tareas' && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Tareas de Seguimiento
                      </h4>
                      <button
                        type="button"
                        className="cp-ns-btn-primary"
                        onClick={() => mostrarToast('Nueva tarea creada', 'info')}
                      >
                        + Nueva Tarea
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '18px' }}>check_circle</span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>Verificar croquis de ubicación Tenaris Tamsa con HSE</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asignado: Ing. Roberto Silva • Completado</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '18px' }}>pending</span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cotejo de CFDI 4.0 contra Orden PO-2026-0173</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asignado: M. Torres • En progreso</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>radio_button_unchecked</span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>Revisar bitácora de limpieza 3x semana (Lunes, Miércoles y Viernes)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asignado: Supervisor Obra • Programado</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: LLAMADAS TELEFÓNICAS */}
                {subTabComunicacion === 'llamadas' && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Registro de Llamadas con Proveedor
                      </h4>
                      <button
                        type="button"
                        className="cp-ns-btn-primary"
                        onClick={() => mostrarToast('Registro de llamada aperturado', 'info')}
                      >
                        + Registrar Llamada
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Llamada con Pamela León Cadena (Five Peaks)</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>07/10/2026 03:45 PM • 6 min</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Confirmación de horario de entrega de sanitario móvil y requerimientos de pase de ingreso a caseta en planta Tenaris Tamsa.
                        </p>
                      </div>
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Llamada de Verificación con Vigilancia Puerta 3 Tenaris Tamsa</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>08/10/2026 09:15 AM • 4 min</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Validación de placas de unidad proveedora y registro en bitácora de acceso de contratistas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PANEL 3: RELACIONES (TRANSACCIONES VINCULADAS) ── */}
            {activeTab === 'relaciones' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Transacciones y Registros Vinculados
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Cotejo normativo NetSuite ERP
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>shopping_cart</span>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Orden de Compra Primaria</h4>
                    </div>
                    <div style={{ fontSize: '0.825rem', lineHeight: 1.6 }}>
                      <div><strong>Folio:</strong> <Link href={`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{odcSeleccionadaFolio}</Link></div>
                      <div><strong>Importe ODC:</strong> $4,118.00 MXN</div>
                      <div><strong>Estatus:</strong> <span className="cp-badge cp-badge-warning" style={{ fontSize: '0.7rem' }}>Recibida parcialmente</span></div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>badge</span>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Proveedor Adjudicado</h4>
                    </div>
                    <div style={{ fontSize: '0.825rem', lineHeight: 1.6 }}>
                      <div><strong>Razón Social:</strong> {proveedorNombre}</div>
                      <div><strong>RFC:</strong> {proveedorRfc}</div>
                      <div><strong>Expediente:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>Cotejado & Activo</span></div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '20px' }}>assignment</span>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Requisición y Contrato</h4>
                    </div>
                    <div style={{ fontSize: '0.825rem', lineHeight: 1.6 }}>
                      <div><strong>Folio Req:</strong> {adReqContrato}</div>
                      <div><strong>Centro de Costos:</strong> SFG-C259 (Tenaris Tamsa)</div>
                      <div><strong>Tope Requisición:</strong> 1.00</div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>move_to_inbox</span>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Recepción de Artículos (IR)</h4>
                    </div>
                    <div style={{ fontSize: '0.825rem', lineHeight: 1.6 }}>
                      <div><strong>Recepción IR:</strong> IR-2026-0091</div>
                      <div><strong>Fecha de Entrada:</strong> 27/10/2026</div>
                      <div><strong>Conformidad QHSE:</strong> Inspección en sitio aprobada</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PANEL 4: INFORMACIÓN DEL SISTEMA ── */}
            {activeTab === 'sistema' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Información y Registro del Sistema
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    ERP Audit Trail v2026.4
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>ID Interno Transacción:</strong> <span style={{ fontFamily: 'monospace' }}>TXN-8849102</span></div>
                    <div><strong>Creado Por:</strong> Ing. M. Torres (Suministro & Planta)</div>
                    <div><strong>Fecha de Creación:</strong> 27/10/2026 09:30 AM</div>
                    <div><strong>Última Modificación:</strong> 27/10/2026 02:15 PM por Ing. Carlos Mendoza Estrada</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>Flujo de Aprobación:</strong> Aprobado por Dirección General</div>
                    <div><strong>Fecha de Aprobación DG:</strong> {fechaAprobacionDg}</div>
                    <div><strong>Fecha de Revisión:</strong> {fechaRevision}</div>
                    <div><strong>Estado de Validación SAT:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>UUID Verificado ante SAT</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PANEL 5: PERSONALIZADO (CAMPOS SIFYGSA) ── */}
            {activeTab === 'personalizado' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Campos Personalizados SIFYGSA
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>Frente de Obra / Sitio:</strong> Tenaris Tamsa - Veracruz, Ver.</div>
                    <div><strong>Supervisor de Obra:</strong> Ing. Roberto Silva (QHSE SIFYGSA)</div>
                    <div><strong>Centro de Operaciones:</strong> QHSE & Seguridad Industrial</div>
                    <div><strong>Folio Contrato / Requisición:</strong> {adReqContrato}</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>Comprador Responsable:</strong> Jeannette Ivonne Macías Qxando</div>
                    <div><strong>Solicitante Original:</strong> Carlos Mendoza Estrada</div>
                    <div><strong>Almacén Destino:</strong> Almacén Principal (Sede CDMX) / Maniobras Veracruz</div>
                    <div><strong>Términos de Entrega:</strong> Entrega DDP Sitio Obra</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PANEL 6: DOCUMENTO ELECTRÓNICO ── */}
            {activeTab === 'documento' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Generación y Timbrado de Documento Electrónico
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>Estado Documento:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>Generado y Cotejado SAT</span></div>
                    <div><strong>Plantilla de Factura:</strong> Formato Oficial SIFYGSA v4.0</div>
                    <div><strong>Cadena Original SAT:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all' }}>||1.1|{uuidFiscal}|2026-10-27T14:15:22|FPM130918MPA|...||</span></div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>Certificado CSD SAT:</strong> 00001000000504465028</div>
                    <div><strong>Certificado Emisor:</strong> 00001000000506149884</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="cp-ns-btn-secondary"
                        onClick={() => descargarArchivoSimulado(`${referenciaFiscal}.pdf`, 'application/pdf')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
                        <span>Descargar PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PANEL 7: CFDI INFORMATION ── */}
            {activeTab === 'cfdi' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Información Fiscal del Comprobante CFDI 4.0
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>Folio Fiscal UUID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{uuidFiscal}</span></div>
                    <div><strong>Versión:</strong> CFDI 4.0</div>
                    <div><strong>Tipo de Comprobante:</strong> I - Ingreso</div>
                    <div><strong>RFC Emisor:</strong> {proveedorRfc} ({proveedorNombre})</div>
                    <div><strong>Régimen Fiscal Emisor:</strong> 601 - General de Ley Personas Morales</div>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                    <div><strong>RFC Receptor:</strong> SFG120315ABC (SIFYGSA Fire & Gas S.A. de C.V.)</div>
                    <div><strong>Régimen Fiscal Receptor:</strong> 601 - General de Ley Personas Morales</div>
                    <div><strong>Uso de CFDI:</strong> G03 - Gastos en general</div>
                    <div><strong>Método de Pago SAT:</strong> PPD - Pago en parcialidades o diferido</div>
                    <div><strong>Forma de Pago SAT:</strong> 99 - Por definir</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PANEL 8: FACTURACIÓN ASOCIADA ── */}
            {activeTab === 'facturacion' && (
              <div className="cp-ns-tab-content-area" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    Facturas registradas para la Orden {odcSeleccionadaFolio}
                  </h3>
                  <Link
                    href={`/compras/facturas/registro?oc=${encodeURIComponent(odcSeleccionadaFolio)}`}
                    className="cp-ns-btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    <span>+ Agregar Factura</span>
                  </Link>
                </div>

                <div className="cp-ns-table-wrap">
                  <table className="cp-ns-table">
                    <thead>
                      <tr>
                        <th>Folio Factura</th>
                        <th>Proveedor</th>
                        <th>Fecha Emisión</th>
                        <th>Fecha Vencimiento</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th>Estatus</th>
                        <th>Documento Adjunto</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map((f) => (
                        <tr key={f.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{f.folio}</td>
                          <td>{f.proveedorNombre}</td>
                          <td>{f.fechaEmision}</td>
                          <td>{f.fechaVencimiento}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>
                            ${f.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {f.moneda}
                          </td>
                          <td>
                            <span
                              className={`cp-badge ${
                                f.estatus === 'pagada'
                                  ? 'cp-badge-success'
                                  : f.estatus === 'cancelada'
                                  ? 'cp-badge-danger'
                                  : 'cp-badge-info'
                              }`}
                            >
                              <span className="cp-dot" /> {f.estatus}
                            </span>
                          </td>
                          <td>
                            {f.documentoPrincipal ? (
                              <button
                                type="button"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--primary)',
                                  cursor: 'pointer',
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                onClick={() => setDocModal(f.documentoPrincipal!)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                  {f.documentoPrincipal.tipo.includes('pdf') ? 'picture_as_pdf' : 'code'}
                                </span>
                                <span>{f.documentoPrincipal.nombre}</span>
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Sin adjunto</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="cp-ns-util-btn"
                              onClick={() => {
                                setReferenciaFiscal(f.folio);
                                setUuidFiscal(f.uuidFiscal);
                                setProveedorNombre(f.proveedorNombre);
                                setProveedorRfc(f.proveedorRfc);
                                setFechaEmision(f.fechaEmision);
                                setFechaVencimiento(f.fechaVencimiento);
                                setActiveTab('gastos');
                                mostrarAvisoFeedback(`Factura ${f.folio} cargada en la vista de recepción.`);
                              }}
                            >
                              Cargar en Recepción
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          VISTA 2: LISTADO / TABLERO GENERAL DE FACTURAS DE PROVEEDOR
          ══════════════════════════════════════════════════════════════════════════ */}
      {vistaActual === 'lista' && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Métricas KPI de Facturación */}
          <div className="cp-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="cp-kpi-card">
              <div className="cp-kpi-icon blue">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div className="cp-kpi-info">
                <span className="cp-kpi-value">{facturas.length}</span>
                <span className="cp-kpi-label">Total de Facturas</span>
              </div>
            </div>

            <div className="cp-kpi-card">
              <div className="cp-kpi-icon orange">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
              <div className="cp-kpi-info">
                <span className="cp-kpi-value">
                  {facturas.filter((f) => f.estatus === 'abierta').length}
                </span>
                <span className="cp-kpi-label">Pendientes / Por Pagar</span>
              </div>
            </div>

            <div className="cp-kpi-card">
              <div className="cp-kpi-icon green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="cp-kpi-info">
                <span className="cp-kpi-value">
                  {facturas.filter((f) => f.estatus === 'pagada').length}
                </span>
                <span className="cp-kpi-label">Pagadas / Liquidadas</span>
              </div>
            </div>

            <div className="cp-kpi-card">
              <div className="cp-kpi-icon blue">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div className="cp-kpi-info">
                <span className="cp-kpi-value">
                  ${facturas.reduce((acc, f) => acc + f.total, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="cp-kpi-label">Total en Facturación (MXN)</span>
              </div>
            </div>
          </div>

          {/* Filtros de Búsqueda y Botón Registrar Factura */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              backgroundColor: 'var(--card)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}
                >
                  search
                </span>
                <input
                  type="text"
                  className="cp-ns-input"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="Buscar por Folio, Proveedor, RFC, UUID o Folio de ODC..."
                  value={filtroBusquedaLista}
                  onChange={(e) => setFiltroBusquedaLista(e.target.value)}
                />
              </div>

              <select
                className="cp-ns-select"
                style={{ width: 170 }}
                value={filtroEstatusLista}
                onChange={(e) => setFiltroEstatusLista(e.target.value as any)}
              >
                <option value="todas">Todos los estatus</option>
                <option value="abierta">Abierta / Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="cp-ns-btn-secondary"
                onClick={() => setVistaActual('detalle')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                <span>Ficha Recepción ODC</span>
              </button>

              <Link
                href="/compras/facturas/registro"
                className="cp-ns-btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                <span>+ Registrar Factura de Proveedor</span>
              </Link>
            </div>
          </div>

          {/* Tabla de Facturas de Proveedor */}
          <div className="cp-ns-table-wrap">
            <table className="cp-ns-table">
              <thead>
                <tr>
                  <th>Folio Fiscal</th>
                  <th>ODC Vinculada</th>
                  <th>Proveedor</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Vencimiento</th>
                  <th style={{ textAlign: 'right' }}>Total (MXN)</th>
                  <th>Estatus</th>
                  <th>Comprobantes</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron facturas registradas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  facturasFiltradas.map((fac) => (
                    <tr key={fac.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {fac.folio}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--surface-alt)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.78rem',
                          }}
                        >
                          {fac.ordenCompraFolio}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{fac.proveedorNombre}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RFC: {fac.proveedorRfc}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{fac.fechaEmision}</td>
                      <td style={{ fontSize: '0.8rem' }}>{fac.fechaVencimiento}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>
                        ${fac.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span
                          className={`cp-badge ${
                            fac.estatus === 'pagada'
                              ? 'cp-badge-success'
                              : fac.estatus === 'cancelada'
                              ? 'cp-badge-danger'
                              : 'cp-badge-info'
                          }`}
                        >
                          <span className="cp-dot" /> {fac.estatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {fac.documentoPrincipal && (
                            <button
                              type="button"
                              className="cp-ns-util-btn"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={() => setDocModal(fac.documentoPrincipal!)}
                              title="Ver documento adjunto"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#ef4444' }}>picture_as_pdf</span>
                              <span>PDF</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="cp-ns-util-btn"
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            onClick={() => descargarArchivoSimulado(`${fac.folio}.xml`, 'text/xml')}
                            title="Descargar XML CFDI 4.0"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#10b981' }}>code</span>
                            <span>XML</span>
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            type="button"
                            className="cp-ns-util-btn"
                            onClick={() => {
                              setReferenciaFiscal(fac.folio);
                              setUuidFiscal(fac.uuidFiscal);
                              setProveedorNombre(fac.proveedorNombre);
                              setProveedorRfc(fac.proveedorRfc);
                              setFechaEmision(fac.fechaEmision);
                              setFechaVencimiento(fac.fechaVencimiento);
                              setOdcSeleccionadaFolio(fac.ordenCompraFolio);
                              setVistaActual('detalle');
                            }}
                          >
                            Ver Recepción
                          </button>
                          <Link
                            href={`/compras/facturas/registro?oc=${encodeURIComponent(fac.ordenCompraFolio)}`}
                            className="cp-ns-util-btn"
                            style={{ textDecoration: 'none' }}
                          >
                            Registrar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL VISTA PREVIA DE IMPUESTOS (CFDI 4.0 SAT) ── */}
      {mostrarModalImpuestos && (
        <div className="cp-modal-backdrop" onClick={() => setMostrarModalImpuestos(false)}>
          <div className="cp-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="cp-modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>percent</span>
                <span>Vista Previa de Impuestos (CFDI 4.0 SAT)</span>
              </h3>
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                style={{ padding: '0.35rem 0.5rem' }}
                onClick={() => setMostrarModalImpuestos(false)}
              >
                ✕
              </button>
            </div>
            <div className="cp-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.4rem' }}>
                  <span>Base Gravable (Tasa 16%):</span>
                  <strong style={{ fontFamily: 'monospace' }}>${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.4rem' }}>
                  <span>Impuesto IVA Trasladado (16.00%):</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.4rem' }}>
                  <span>Retenciones de Impuestos:</span>
                  <strong style={{ fontFamily: 'monospace' }}>$0.00 {moneda}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', fontSize: '1rem' }}>
                  <span style={{ fontWeight: 700 }}>Total con Impuestos:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}</strong>
                </div>
              </div>
            </div>
            <div className="cp-modal-footer">
              <button type="button" className="cp-btn cp-btn-primary" onClick={() => setMostrarModalImpuestos(false)}>
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VISOR E INTERPRETACIÓN DE DOCUMENTO ADJUNTO (IMAGEN 1 & 2) ── */}
      {docModal && (
        <div className="cp-modal-backdrop" onClick={() => setDocModal(null)}>
          <div className="cp-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, width: '92%' }}>
            <div className="cp-modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '0.85rem 1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                  {docModal.nombre.toLowerCase().includes('ubicacion') || docModal.nombre.toLowerCase().includes('tamsa')
                    ? 'map'
                    : docModal.tipo.includes('pdf')
                    ? 'picture_as_pdf'
                    : docModal.tipo.includes('xml')
                    ? 'code'
                    : 'photo_camera'}
                </span>
                <span>{docModal.nombre}</span>
              </h3>
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                style={{ padding: '0.35rem 0.5rem' }}
                onClick={() => setDocModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="cp-modal-body" style={{ padding: '1.25rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* CASO 1: CROQUIS DE UBICACIÓN OPERATIVA TENARIS TAMSA (IMAGEN 1) */}
              {(docModal.nombre.toLowerCase().includes('ubicacion') || docModal.nombre.toLowerCase().includes('tamsa')) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Banner descriptivo */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-control)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>place</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          Croquis de Ubicación Operativa HSE en Planta Tenaris Tamsa
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Documento anexado para partida SER-REN-BAÑ • Carretera Veracruz - Jalapa Km 13.5
                        </div>
                      </div>
                    </div>
                    <span className="cp-badge cp-badge-success" style={{ fontSize: '0.7rem' }}>
                      Cotejado en Sitio
                    </span>
                  </div>

                  {/* Representación visual vectorial interactiva del Plano de Ubicación */}
                  <div style={{ position: 'relative', width: '100%', height: 260, backgroundColor: '#090d16', borderRadius: 'var(--radius-control)', border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="100%" height="100%" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                        </pattern>
                        <linearGradient id="glowPin" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                      </defs>

                      {/* Cuadrícula técnica de fondo */}
                      <rect width="600" height="260" fill="url(#gridPattern)" />

                      {/* Vialidad principal: Carr. Veracruz - Jalapa */}
                      <rect x="0" y="210" width="600" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                      <line x1="0" y1="230" x2="600" y2="230" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10,8" />
                      <text x="20" y="225" fill="#94a3b8" fontSize="10" fontFamily="monospace">Carretera Federal Veracruz - Jalapa (Km 13.5)</text>

                      {/* Acceso Puerta 3 */}
                      <rect x="70" y="180" width="80" height="30" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" rx="3" />
                      <text x="78" y="198" fill="#38bdf8" fontSize="9" fontWeight="bold">Puerta 3 Acceso</text>

                      {/* Naves industriales Tenaris Tamsa */}
                      <rect x="40" y="30" width="160" height="130" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="4" />
                      <text x="50" y="50" fill="#94a3b8" fontSize="10" fontWeight="bold">Nave 3 • Taller Central</text>
                      <line x1="50" y1="60" x2="190" y2="60" stroke="#334155" strokeWidth="0.8" />

                      <rect x="230" y="25" width="220" height="140" fill="#131c31" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
                      <text x="245" y="48" fill="#60a5fa" fontSize="11" fontWeight="bold">Nave 4 • Laminación & Tubos</text>
                      <text x="245" y="63" fill="#64748b" fontSize="8.5">Área Operativa Tenaris Tamsa</text>

                      {/* Patio de maniobras HSE */}
                      <rect x="470" y="30" width="115" height="125" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="4" />
                      <text x="480" y="50" fill="#94a3b8" fontSize="9.5" fontWeight="bold">Patio Maniobras</text>
                      <text x="480" y="65" fill="#64748b" fontSize="8">Zona de Almacén</text>

                      {/* Ruta de servicio y camión de limpieza (Línea punteada azul) */}
                      <path d="M 110 180 L 110 130 L 210 130 L 210 185 L 360 185 L 360 145" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5,4" />
                      <text x="125" y="150" fill="#38bdf8" fontSize="8" fontFamily="monospace">Ruta Servicio Limpieza 3x/sem</text>

                      {/* PIN DE UBICACIÓN: Baño Portátil SER-REN-BAÑ */}
                      <circle cx="360" cy="140" r="16" fill="rgba(59, 130, 246, 0.25)" />
                      <circle cx="360" cy="140" r="9" fill="url(#glowPin)" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="360" y="143" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">✓</text>

                      {/* Etiqueta del Pin */}
                      <g transform="translate(380, 115)">
                        <rect x="0" y="0" width="185" height="42" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
                        <text x="8" y="16" fill="#38bdf8" fontSize="9.5" fontWeight="bold">PUNTO ASIGNADO SER-REN-BAÑ</text>
                        <text x="8" y="28" fill="#e2e8f0" fontSize="8.5">Sanitario Portátil • Caseta QHSE</text>
                        <text x="8" y="38" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">Coord: 19.1678° N, 96.2234° W</text>
                      </g>

                      {/* Rosa de los vientos (Norte) */}
                      <g transform="translate(560, 20)">
                        <circle cx="12" cy="12" r="12" fill="#1e293b" />
                        <path d="M 12 4 L 16 14 L 12 11 L 8 14 Z" fill="#ef4444" />
                        <text x="12" y="21" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">N</text>
                      </g>
                    </svg>
                  </div>

                  {/* Tabla de Ficha Técnica e Interpretación */}
                  <div style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Instalación:</strong> <span style={{ color: 'var(--text-primary)' }}>Planta Tubos de Acero (Tenaris Tamsa)</span></div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Frente de Obra:</strong> <span style={{ color: 'var(--text-primary)' }}>Nave 4 / Patio Maniobras</span></div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Frecuencia de Limpieza:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>3 veces por semana (Lun/Mié/Vie)</span></div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Periodo del Contrato:</strong> <span style={{ color: 'var(--text-primary)' }}>26/10/2026 al 25/11/2026</span></div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Responsable en Sitio:</strong> <span style={{ color: 'var(--text-primary)' }}>Ing. Roberto Silva (QHSE SIFYGSA)</span></div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Proveedor Asignado:</strong> <span style={{ color: 'var(--text-primary)' }}>Five Peaks México SA de CV</span></div>
                    </div>
                  </div>
                </div>
              ) : docModal.nombre.toLowerCase().includes('captura') || docModal.nombre.includes('1706') || docModal.nombre.includes('1707') ? (
                /* CASO 2: CAPTURAS DE PANTALLA DE INSPECCIÓN HSE (IMAGEN 1) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-control)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>verified</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          Reporte Fotográfico y Ficha de Inspección HSE en Sitio
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Captura {docModal.nombre} • Verificación de instalación conforme a norma
                        </div>
                      </div>
                    </div>
                    <span className="cp-badge cp-badge-success" style={{ fontSize: '0.7rem' }}>
                      Inspección Aprobada
                    </span>
                  </div>

                  {/* Visor simulado de cámara de inspección industrial */}
                  <div style={{ padding: '1.5rem', backgroundColor: '#090d16', borderRadius: 'var(--radius-control)', border: '1px solid #1e293b', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                      <span>REC • HSE-CAM-04</span>
                      <span style={{ color: '#10b981' }}>TIMESTAMP: 08/10/2026 5:17 PM</span>
                      <span>TENARIS TAMSA VER</span>
                    </div>

                    <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-control)', display: 'inline-block', border: '1px dashed #334155' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#38bdf8', display: 'block', marginBottom: '0.5rem' }}>
                        wc
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                        Unidad Sanitaria SER-REN-BAÑ en Caseta QHSE Nave 4
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                        Cotejado con Orden PO-2026-0173 • Proveedor Five Peaks México
                      </div>
                    </div>
                  </div>

                  {/* Checklist de Conformidad Normativa */}
                  <div style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Criterios de Verificación HSE en Sitio:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                        <span style={{ color: 'var(--text-primary)' }}>Sanitización previa y líquido bactericida biodegradable verificado</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                        <span style={{ color: 'var(--text-primary)' }}>Nivelación y sujeción antivuelco en terreno compactado</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                        <span style={{ color: 'var(--text-primary)' }}>Señalización de seguridad y bitácora de limpieza pegada en caseta</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                        <span style={{ color: 'var(--text-primary)' }}>Pase de acceso vehicular validado en Caseta Puerta 3 Tenaris Tamsa</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : docModal.url && docModal.url.startsWith('data:image') ? (
                /* CASO 3: IMAGEN REAL SUBIDA POR EL USUARIO */
                <div style={{ textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={docModal.url} alt={docModal.nombre} style={{ maxWidth: '100%', maxHeight: 380, borderRadius: 6, objectFit: 'contain' }} />
                </div>
              ) : (
                /* CASO 4: DOCUMENTO PDF O XML ESTÁNDAR */
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ padding: '2rem 1rem', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-control)', marginBottom: '1rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      {docModal.tipo.includes('pdf') ? 'picture_as_pdf' : docModal.tipo.includes('xml') ? 'code' : 'description'}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{docModal.nombre}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Tamaño: {(docModal.tamano / 1024).toFixed(1)} KB • Almacén Contable
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', marginBottom: 0 }}>
                      Comprobante digital cotejado con el expediente de recepción de la orden {odcSeleccionadaFolio}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="cp-modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setDocModal(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primary"
                onClick={() => {
                  descargarArchivoSimulado(docModal.nombre, docModal.tipo);
                  setDocModal(null);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Descargar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRA INFERIOR FIJA DE ACCIONES (EXACTO IMAGEN 10 / REGISTRO FISCAL CFDI 4.0) ── */}
      <div
        className="cp-ns-bottom-dock"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--card)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
            info
          </span>
          <span>
            Los cambios afectan la contabilidad electrónica de SIFYGSA y el registro DIOT del período {periodoContable}.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href={`/compras/ordenes/${encodeURIComponent(odcSeleccionadaFolio)}`}
            className="cp-ns-btn-secondary"
            style={{ textDecoration: 'none', padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}
          >
            Cancelar
          </Link>

          <button
            type="button"
            className="cp-ns-btn-primary"
            onClick={() => handleGuardarRecepcion(false)}
            disabled={isSaving}
            style={{
              backgroundColor: '#1d4ed8',
              borderColor: '#1d4ed8',
              color: '#ffffff',
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(29, 78, 216, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              save
            </span>
            <span>{isSaving ? 'Guardando Factura...' : 'Guardar Factura'}</span>
          </button>
        </div>      </div>
    </div>
  );
};

export default GestionFacturasProveedorPage;

