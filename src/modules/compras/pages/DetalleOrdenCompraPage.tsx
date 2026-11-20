'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
  obtenerProveedores,
  obtenerOrdenesCompra,
} from '../data/mock-data';
import type {
  MonedaDivisa,
  EstatusOrdenCompra,
} from '../types';
import type { PartidaOrdenForm } from '../data/orden-compra-catalog';
import { PartidasList } from '../components/PartidasList';
import { useCompras } from '../context/ComprasContext';
import { parseCfdiXml, SAMPLE_CFDI_40_XML, type FacturaData } from '../services/facturas';
import '../compras.css';
import '../orden-compra-wizard.css';

export type EstatusOrdenDetalle =
  | EstatusOrdenCompra
  | 'anulada_reversada'
  | 'autorizada_emitida'
  | 'en_proceso';

export const DetalleOrdenCompraPage: React.FC = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const ocParam = (
    searchParams?.get('oc') ||
    searchParams?.get('folio') ||
    searchParams?.get('id') ||
    (params?.id as string) ||
    ''
  ).trim();

  // Centralized Compras Context
  const {
    ordenes: ordenesContext,
    cambiarMonedaOrden,
    cambiarEstatusOrden,
    getFacturaPorOC,
    mostrarToast,
  } = useCompras();

  const proveedores = useMemo(() => obtenerProveedores(), []);

  const ordenExistente = useMemo(() => {
    const ordenes = ordenesContext && ordenesContext.length > 0 ? ordenesContext : obtenerOrdenesCompra();
    if (!ocParam) return ordenes.find((o) => o.folio === 'PO-2026-0173') || ordenes[0] || null;
    return (
      ordenes.find(
        (o) =>
          o.folio.toLowerCase() === ocParam.toLowerCase() ||
          o.id.toLowerCase() === ocParam.toLowerCase()
      ) || null
    );
  }, [ocParam, ordenesContext]);

  // =========================================================================
  // ESTADOS EDITABLES DE LA ORDEN DE COMPRA (100% interactivos)
  // =========================================================================
  const [folio, setFolio] = useState(() => ordenExistente?.folio || ocParam || 'PO-2026-0173');
  const [idContratoRequisicion, setIdContratoRequisicion] = useState(
    () => ordenExistente?.contratoProyecto || 'SFG-C259-LVT-RQ-127/26'
  );
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState(
    () => ordenExistente?.proveedorId ?? 'PRV-00105'
  );
  const [proveedorNombre, setProveedorNombre] = useState(
    () => ordenExistente?.proveedorNombre || 'Five Peaks México SA de CV'
  );
  const [proveedorRfc, setProveedorRfc] = useState(
    () => ordenExistente?.proveedorRfc || 'FPM130918MPA'
  );
  const [compradorNombre, setCompradorNombre] = useState(
    () => ordenExistente?.compradorNombre || 'Carlos Mendoza'
  );
  const [fechaEmision, setFechaEmision] = useState('2026-11-10');
  const [fechaEntrega, setFechaEntrega] = useState('2026-11-25');
  const [almacenDestino, setAlmacenDestino] = useState(
    () => ordenExistente?.almacenDestino || 'Almacén Principal (Sede CDMX)'
  );
  const [condicionPago, setCondicionPago] = useState('Crédito 30 días');
  const [terminosEntrega, setTerminosEntrega] = useState('Entrega DDP Sitio Obra');
  const [centroCostos, setCentroCostos] = useState('SFG-C259');
  const [notaOrden, setNotaOrden] = useState(
    'Servicio de baño portátil para Tenaris Tamsa. Aclaración / Nota de partida: CC: SFG-C259 - Ref: SFG-C259-LVT-RQ-127/26. Tope Requisición: 1.00.'
  );
  const [firmaAutorizada, setFirmaAutorizada] = useState(true);

  // Estatus de la orden (editable)
  const [estatusActual, setEstatusActual] = useState<EstatusOrdenDetalle>('anulada_reversada');

  // Clasificación Operativa
  const [subsidiaria, setSubsidiaria] = useState('SIFYGSA Fire & Gas S.A. de C.V.');
  const [departamento, setDepartamento] = useState('Operaciones & Frentes de Obra');

  // Gestión entre Empresas & Moneda
  const [moneda, setMoneda] = useState<MonedaDivisa>('MXN');
  const [tipoCambio, setTipoCambio] = useState('18.45');

  // Términos & Operaciones
  const [tipoCompra, setTipoCompra] = useState('Bienes y Servicios Industriales');
  const [almacenRecepcion, setAlmacenRecepcion] = useState('Almacén Principal (Sede CDMX)');
  const [estadoPago, setEstadoPago] = useState('Pendiente de factura');

  // Tabs de navegación de la Orden de Compra (NetSuite Style)
  type TabType =
    | 'articulos'
    | 'facturacion'
    | 'envio'
    | 'contabilidad'
    | 'relaciones'
    | 'comunicacion'
    | 'info_sistema'
    | 'registros_relacionados'
    | 'personalizado'
    | 'tef'
    | 'historial_aprobaciones'
    | 'factura';

  const [activeTab, setActiveTab] = useState<TabType>('articulos');

  // Historial de Comunicación
  interface ComunicacionItem {
    id: string;
    tipo: 'Nota' | 'Correo' | 'Llamada' | 'Mensaje';
    autor: string;
    fechaHora: string;
    texto: string;
  }

  const [comunicaciones, setComunicaciones] = useState<ComunicacionItem[]>([
    {
      id: 'com-1',
      tipo: 'Nota',
      autor: 'Carlos Mendoza Estrada',
      fechaHora: '2026-10-27 10:14 hrs',
      texto: 'Se revisaron partidas técnicas MEX04DA135728 y SRV-EMB-001 con el proveedor FIVE PEAKS MÉXICO.',
    },
    {
      id: 'com-2',
      tipo: 'Llamada',
      autor: 'Lic. Fernando Garza',
      fechaHora: '2026-10-27 11:30 hrs',
      texto: 'Confirmada fecha de entrega de flete y empaque para el 27/10/2026 en Muelle 4 Tenaris Tamsa.',
    },
  ]);
  const [nuevoTipoCom, setNuevoTipoCom] = useState<'Nota' | 'Correo' | 'Llamada' | 'Mensaje'>('Nota');
  const [nuevoTextoCom, setNuevoTextoCom] = useState('');

  // Partidas Dinámicas y Editables (Campos Completos de NetSuite)
  const [items, setItems] = useState<PartidaOrdenForm[]>([
    {
      id: 'it-1',
      numArticulo: 1,
      c: 'MEX04DA135728',
      d: 'Empaque y Embarque: MEX04DA135728 BROCHAS, ABRAZADERAS Y DEMAS CONSUMIBLES - PO10666',
      articuloNombre: 'Empaque y Embarque',
      n: 'BROCHAS, ABRAZADERAS Y DEMAS CONSUMIBLES',
      proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
      departamento: 'Dirección : Compras',
      clienteTrabajo: 'SFG-C299-MFP Mission Foods Mexico S.R.L. de C.V. : SFG-C299-MFP',
      activityCode: 'Paquetería',
      refDetallesImpuestos: '1194487_1',
      q: 1.0,
      p: 2182.19,
      unidad: 'PZA',
      tasaFiscal: 'IVA_16',
      disponible: 0,
      disponibleAlterno: 0,
      disponibleAlmacen: 0,
      disponibleTotal: 0,
      recibido: 0,
      facturado: 0,
      opciones: '',
      fechaReciboPrevista: '2026-10-27',
      cerrado: false,
      on: true,
      maxCantidad: 1.0,
    },
    {
      id: 'it-2',
      numArticulo: 2,
      c: 'SRV-EMB-001',
      d: 'Embarque y/o envío Ret. 4% MEX04DA135728',
      articuloNombre: 'Embarque y/o envio Ret. 4%',
      n: 'Embarque y/o envío con Retención del 4%',
      proveedorNombre: 'FIVE PEAKS MÉXICO SA DE CV',
      departamento: 'Dirección : Compras',
      clienteTrabajo: 'SFG-C299-MFP Mission Foods Mexico S.R.L. de C.V. : SFG-C299-MFP',
      activityCode: 'Paquetería',
      refDetallesImpuestos: '1194487_2',
      q: 1.0,
      p: 6590.06,
      unidad: 'SERVICIO',
      tasaFiscal: 'RET_IVA_4',
      disponible: 0,
      disponibleAlterno: 0,
      disponibleAlmacen: 0,
      disponibleTotal: 0,
      recibido: 0,
      facturado: 0,
      opciones: '',
      fechaReciboPrevista: '2026-10-27',
      cerrado: false,
      on: true,
      maxCantidad: 1.0,
    },
  ]);

  // Expediente digital (Archivos adjuntos oficiales)
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([
    {
      id: 'doc-1',
      nombre: 'Requisicion_SFG-C212-06.pdf',
      tipo: 'PDF',
      tamano: '1.4 MB',
      meta: 'Firmado digital por Ing. Roberto Silva · 14/10/2026',
      badge: 'Requisición Validada',
      badgeColor: 'emerald',
    },
    {
      id: 'doc-2',
      nombre: 'Cotizacion_FivePeaks_0173.pdf',
      tipo: 'PDF',
      tamano: '840 KB',
      meta: 'Validez 30 días · Adjudicado',
      badge: 'Cotización Proveedor',
      badgeColor: 'brand',
    },
    {
      id: 'doc-3',
      nombre: 'Orden_Compra_PO2026_Firma.pdf',
      tipo: 'PDF',
      tamano: '2.1 MB',
      meta: 'Autorización D.G. Lic. Fernando Garza',
      badge: 'ODC Firmada',
      badgeColor: 'amber',
    },
  ]);

  // Cálculos dinámicos en tiempo real (Base NetSuite)
  const subtotalTotal = useMemo(() => {
    return items
      .filter((i) => i.on !== false)
      .reduce((acc, curr) => acc + (Number(curr.q) * Number(curr.p) || 0), 0);
  }, [items]);

  const ivaTotal = useMemo(() => {
    return items
      .filter((i) => i.on !== false)
      .reduce((acc, curr) => {
        const base = Number(curr.q) * Number(curr.p) || 0;
        if (curr.tasaFiscal === 'RET_IVA_4') {
          return acc + (base * 0.16) - (base * 0.04);
        }
        if (curr.tasaFiscal === 'EXENTO') return acc;
        return acc + (base * 0.16);
      }, 0);
  }, [items]);

  const granTotal = useMemo(() => {
    return subtotalTotal + ivaTotal;
  }, [subtotalTotal, ivaTotal]);

  // Manejo de edición de partidas
  const handleToggleItem = (id: string, on: boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, on } : item)));
  };

  const handleUpdateItem = (id: string, patch: Partial<PartidaOrdenForm>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      mostrarToast('La orden de compra debe conservar al menos una partida.', 'warning');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    mostrarToast('Partida eliminada de la orden de compra.', 'info');
  };

  const handleDuplicateItem = (id: string) => {
    const itemToDup = items.find((i) => i.id === id);
    if (!itemToDup) return;
    const nextNum = items.length + 1;
    const duplicated: PartidaOrdenForm = {
      ...itemToDup,
      id: `it-${Date.now()}`,
      numArticulo: nextNum,
      refDetallesImpuestos: `1194487_${nextNum}`,
    };
    setItems((prev) => [...prev, duplicated]);
    mostrarToast(`✓ Partida duplicada como #${nextNum}.`, 'success');
  };

  const handleAddItem = () => {
    const nextIdx = items.length + 1;
    const newItem: PartidaOrdenForm = {
      id: `it-${Date.now()}`,
      numArticulo: nextIdx,
      c: `SRV-IND-${String(nextIdx).padStart(3, '0')}`,
      d: `Nuevo concepto o servicio industrial #${nextIdx}`,
      n: 'Especificación técnica según requerimiento de obra y contrato.',
      proveedorNombre: proveedorNombre,
      departamento: departamento || 'Dirección : Compras',
      clienteTrabajo: 'SFG-C299-MFP Mission Foods Mexico S.R.L. de C.V. : SFG-C299-MFP',
      activityCode: 'Paquetería',
      refDetallesImpuestos: `1194487_${nextIdx}`,
      q: 1.0,
      p: 1000.0,
      unidad: 'SERVICIO',
      tasaFiscal: 'IVA_16',
      disponible: 0,
      disponibleAlterno: 0,
      disponibleAlmacen: 0,
      disponibleTotal: 0,
      recibido: 0,
      facturado: 0,
      opciones: '',
      fechaReciboPrevista: fechaEntrega || '2026-10-27',
      cerrado: false,
      on: true,
      maxCantidad: 1.0,
    };
    setItems((prev) => [...prev, newItem]);
    mostrarToast(`✓ Partida #${nextIdx} agregada. Todos los campos son editables.`, 'info');
  };

  const handleTabClick = (tab: TabType) => {
    if (tab === 'factura') {
      router.push(
        `/compras/registro-factura?oc=${folio}&prv=${encodeURIComponent(proveedorNombre)}&total=${granTotal}`
      );
      return;
    }
    setActiveTab(tab);
  };

  const handleAgregarComunicacion = () => {
    if (!nuevoTextoCom.trim()) {
      mostrarToast('Ingresa el texto o minuta de la comunicación.', 'warning');
      return;
    }
    const ahora = new Date();
    const fechaHora = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')} hrs`;
    setComunicaciones((prev) => [
      {
        id: `com-${Date.now()}`,
        tipo: nuevoTipoCom,
        autor: compradorNombre || 'Ing. Carlos Mendoza Estrada',
        fechaHora,
        texto: nuevoTextoCom.trim(),
      },
      ...prev,
    ]);
    setNuevoTextoCom('');
    mostrarToast('✓ Nueva comunicación registrada en el historial.', 'success');
  };

  const handleProveedorSelect = (prvId: string) => {
    setProveedorSeleccionadoId(prvId);
    const match = proveedores.find((p) => p.id === prvId);
    if (match) {
      setProveedorNombre(match.razonSocial);
      setProveedorRfc(match.rfc);
    }
  };

  const handleFixOficial = () => {
    if (moneda === 'USD') {
      setTipoCambio('18.45');
      mostrarToast('✓ Tipo de cambio oficial Banxico fijado en $18.45 MXN/USD.', 'success');
    } else if (moneda === 'EUR') {
      setTipoCambio('20.10');
      mostrarToast('✓ Tipo de cambio oficial fijado en $20.10 MXN/EUR.', 'success');
    } else {
      setTipoCambio('1.00');
      mostrarToast('Moneda local MXN fijada con paridad 1.00.', 'info');
    }
  };

  const handleGuardarCambios = () => {
    mostrarToast(`✓ Cambios guardados correctamente en la orden de compra ${folio}.`, 'success');
  };

  // ── SECCIÓN: FACTURA DEL PROVEEDOR (ADJUNCIÓN & CFDI 4.0 TIMBRADO) ──
  const facturaFileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  const [xmlFile, setXmlFile] = useState<{ name: string; size: number; content: string } | null>(null);
  const [pdfFile, setPdfFile] = useState<{ name: string; size: number } | null>(null);
  const [parsedFactura, setParsedFactura] = useState<Partial<FacturaData> | null>(null);
  const [errorValidacionFactura, setErrorValidacionFactura] = useState<string | null>(null);
  const [advertenciasFactura, setAdvertenciasFactura] = useState<string[]>([]);
  const [isDraggingFactura, setIsDraggingFactura] = useState(false);
  const [isProcesandoFactura, setIsProcesandoFactura] = useState(false);

  const facturaRegistrada = useMemo(() => {
    if (getFacturaPorOC) {
      const f = getFacturaPorOC(folio);
      if (f) return f;
    }
    if (ordenExistente?.facturaId || ordenExistente?.tieneFactura) {
      return {
        id: ordenExistente.facturaId || 'FAC-2026-8910',
        folio: ordenExistente.facturaFolio || 'FAC-2026-8910',
        uuid: ordenExistente.facturaUuid || '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
        total: ordenExistente.total,
        estado: 'abierta' as const,
      } as FacturaData;
    }
    return undefined;
  }, [getFacturaPorOC, folio, ordenExistente]);

  const estadoArchivoFactura = useMemo<'sin_archivo' | 'adjunto' | 'validado' | 'con_diferencias'>(() => {
    if (facturaRegistrada) return 'validado';
    if (advertenciasFactura.length > 0) return 'con_diferencias';
    if (parsedFactura && parsedFactura.uuid) return 'validado';
    if (xmlFile || pdfFile) return 'adjunto';
    return 'sin_archivo';
  }, [facturaRegistrada, advertenciasFactura, parsedFactura, xmlFile, pdfFile]);

  const procesarArchivosFactura = (archivos: FileList | File[]) => {
    setErrorValidacionFactura(null);
    setIsProcesandoFactura(true);

    const fileList = Array.from(archivos);
    for (const file of fileList) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xml' && ext !== 'pdf') {
        setErrorValidacionFactura(`El archivo "${file.name}" no es válido. Solo se admiten archivos .xml (CFDI 4.0) y .pdf.`);
        setIsProcesandoFactura(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorValidacionFactura(`El archivo "${file.name}" supera el límite de 10 MB permitido.`);
        setIsProcesandoFactura(false);
        return;
      }

      if (ext === 'xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const xmlText = e.target?.result as string;
          try {
            const data = parseCfdiXml(xmlText);
            if (!data || !data.uuid) {
              setErrorValidacionFactura(`El archivo "${file.name}" no cuenta con una estructura válida de CFDI 4.0.`);
              setIsProcesandoFactura(false);
              return;
            }

            setXmlFile({ name: file.name, size: file.size, content: xmlText });
            setParsedFactura(data);

            const advs: string[] = [];
            const rfcXml = (data.rfcEmisor || '').trim().toUpperCase();
            const rfcOc = proveedorRfc.trim().toUpperCase();
            if (rfcXml && rfcOc && rfcXml !== rfcOc) {
              advs.push(`El RFC del emisor en el XML (${rfcXml}) no coincide con el RFC de la orden (${rfcOc}).`);
            }

            const totalXml = data.total || 0;
            if (totalXml > granTotal + 1) {
              advs.push(`El importe facturado ($${totalXml.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.moneda || 'MXN'}) excede el importe de la orden ($${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}).`);
            }

            setAdvertenciasFactura(advs);
            mostrarToast(`✓ Factura XML leída: Folio ${data.folio} · UUID: ${data.uuid?.slice(0, 8)}...`, 'success');
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Estructura XML inválida';
            setErrorValidacionFactura(`Error al procesar el archivo XML: ${msg}`);
          } finally {
            setIsProcesandoFactura(false);
          }
        };
        reader.readAsText(file);
      } else if (ext === 'pdf') {
        setPdfFile({ name: file.name, size: file.size });
        mostrarToast(`✓ PDF adjuntado: ${file.name}`, 'info');
        setIsProcesandoFactura(false);
      }
    }
  };

  const handleCargarXmlDemo = () => {
    setErrorValidacionFactura(null);
    const data = parseCfdiXml(SAMPLE_CFDI_40_XML);
    setXmlFile({
      name: 'FPM130918MPA_FAC-GMX-99421.xml',
      size: 24832,
      content: SAMPLE_CFDI_40_XML,
    });
    setPdfFile({
      name: 'Representacion_Impresa_FAC-GMX-99421.pdf',
      size: 182400,
    });
    setParsedFactura(data);

    const advs: string[] = [];
    const rfcXml = (data.rfcEmisor || '').trim().toUpperCase();
    const rfcOc = proveedorRfc.trim().toUpperCase();
    if (rfcXml && rfcOc && rfcXml !== rfcOc) {
      advs.push(`El RFC del emisor en el XML (${rfcXml}) no coincide con el RFC de la orden (${rfcOc}).`);
    }
    const totalXml = data.total || 0;
    if (totalXml > granTotal + 1) {
      advs.push(`El importe total facturado ($${totalXml.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.moneda || 'MXN'}) excede el importe de la orden ($${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}).`);
    }
    setAdvertenciasFactura(advs);
    mostrarToast('✓ Factura demo oficial CFDI 4.0 cargada para Five Peaks México.', 'success');
  };

  const handleAgregarFacturaAlSistema = () => {
    if (!xmlFile && !pdfFile && !parsedFactura) {
      mostrarToast('Debe adjuntar al menos un archivo válido (XML o PDF) antes de continuar.', 'warning');
      return;
    }

    const precargaData = {
      ocId: folio,
      uuid: parsedFactura?.uuid || '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
      folio: parsedFactura?.folio || 'FAC-2026-8910',
      proveedor: parsedFactura?.proveedor || proveedorNombre,
      rfcEmisor: parsedFactura?.rfcEmisor || proveedorRfc,
      subsidiaria: subsidiaria,
      fechaEmision: parsedFactura?.fechaEmision || new Date().toISOString().split('T')[0],
      moneda: parsedFactura?.moneda || moneda,
      tipoCambio: parsedFactura?.tipoCambio || Number(tipoCambio) || 1.0,
      subtotal: parsedFactura?.subtotal || subtotalTotal,
      iva: parsedFactura?.iva || ivaTotal,
      total: parsedFactura?.total || granTotal,
      conceptos: parsedFactura?.conceptos || items.map((it) => ({
        descripcion: it.d || it.articuloNombre || '',
        cantidad: it.q,
        unidad: it.unidad || 'SERVICIO',
        valorUnitario: it.p,
        importe: it.q * it.p,
        claveProdServ: '76111500',
        noIdentificacion: it.c,
        claveUnidad: 'E48',
        ivaTrasladado: (it.q * it.p) * 0.16,
      })),
      xmlNombre: xmlFile?.name || `${proveedorRfc}_${folio}.xml`,
      pdfNombre: pdfFile?.name || `Representacion_Impresa_${folio}.pdf`,
      xmlContenido: xmlFile?.content || '',
      advertencias: advertenciasFactura,
      estadoArchivo: estadoArchivoFactura,
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`sifygsa_factura_precarga_${folio}`, JSON.stringify(precargaData));
      sessionStorage.setItem('sifygsa_factura_precarga_reciente', JSON.stringify(precargaData));
    }

    mostrarToast('✓ Redirigiendo a Registro Fiscal CFDI 4.0...', 'success');
    setTimeout(() => {
      router.push(`/compras/ordenes/${encodeURIComponent(folio)}/factura/nueva`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans selection:bg-[#1D4ED8] selection:text-white pb-16">
      {/* ── BREADCRUMB & ACCIONES SUPERIORES ── */}
      <div className="bg-[#0b1120]/90 border-b border-[#1e293b] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-slate-400">
          <Link href="/compras" className="hover:text-blue-400 transition">
            Compras
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-slate-600"></i>
          <Link href="/compras/ordenes" className="hover:text-blue-400 transition">
            Órdenes de Compra
          </Link>
          <i className="fa-solid fa-chevron-right text-[9px] text-slate-600"></i>
          <span className="text-white font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
            {folio}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-300">
          <div className="flex items-center border border-[#1e293b] rounded bg-[#101726] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => mostrarToast('Navegando a la orden de compra anterior...', 'info')}
              className="px-2.5 py-1 hover:bg-[#1f2937] hover:text-white border-r border-[#1e293b] transition"
              title="Registro anterior"
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
            </button>
            <button
              type="button"
              onClick={() => mostrarToast('Navegando a la siguiente orden de compra...', 'info')}
              className="px-2.5 py-1 hover:bg-[#1f2937] hover:text-white transition"
              title="Siguiente registro"
            >
              <i className="fa-solid fa-arrow-right text-[11px]"></i>
            </button>
          </div>

          <Link
            href="/compras"
            className="hover:text-white hover:underline flex items-center gap-1 text-slate-300 transition"
          >
            <i className="fa-solid fa-list-ul text-[10px]"></i> Lista
          </Link>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={() => mostrarToast('Buscador rápido activado.', 'info')}
            className="hover:text-white hover:underline flex items-center gap-1 text-slate-300 transition"
          >
            <i className="fa-solid fa-magnifying-glass text-[10px]"></i> Buscar
          </button>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={() => mostrarToast('Preferencias y personalización de orden.', 'info')}
            className="hover:text-white hover:underline flex items-center gap-1 text-slate-300 transition"
          >
            <i className="fa-solid fa-gear text-[10px]"></i> Personalizar
          </button>

          {/* BOTÓN PRIMARIO: GUARDAR CAMBIOS */}
          <button
            type="button"
            onClick={handleGuardarCambios}
            className="ml-2 px-3.5 py-1 bg-[#1D4ED8] hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <i className="fa-solid fa-check text-[11px]"></i>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto p-6 space-y-6">
        {/* ── TARJETA DE ENCABEZADO DE LA ORDEN ── */}
        <div className="bg-[#101726] border border-[#1e293b] rounded-lg p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg shadow-sm shrink-0">
              <i className="fa-solid fa-file-invoice text-emerald-400"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Orden de compra</span>
                  <i className="fa-solid fa-magnifying-glass text-xs text-blue-400 cursor-pointer"></i>
                </h1>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                <span className="text-blue-400 font-bold">{folio.replace('-', '')}</span> &nbsp;•&nbsp;{' '}
                <span className="text-white font-sans font-semibold">{proveedorNombre}</span>{' '}
                <span className="text-slate-400 text-[11px]">({folio})</span>
              </p>
            </div>
          </div>

          {/* Estatus interactivo (editable) */}
          <div className="shrink-0 flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Estatus:
            </label>
            <select
              value={estatusActual}
              onChange={(e) => {
                const nuevo = e.target.value as EstatusOrdenDetalle;
                setEstatusActual(nuevo);
                cambiarEstatusOrden(folio, nuevo as unknown as EstatusOrdenCompra, 'Actualización interactiva de estado', compradorNombre);
                mostrarToast(`Estatus de la orden actualizado a: ${nuevo.toUpperCase()}`, 'info');
              }}
              className={`border font-bold px-3 py-1.5 rounded-full flex items-center gap-2 text-xs tracking-wider uppercase shadow-inner cursor-pointer focus:outline-none ${
                estatusActual === 'anulada_reversada'
                  ? 'border-amber-600/70 bg-amber-950/50 text-amber-400'
                  : estatusActual === 'autorizada_emitida' || estatusActual === 'cerrada_factura_pagada'
                  ? 'border-emerald-500/70 bg-emerald-950/50 text-emerald-400'
                  : 'border-blue-500/70 bg-blue-950/50 text-blue-300'
              }`}
            >
              <option value="anulada_reversada" className="bg-[#101726] text-amber-400">
                ● ANULADA / REVERSADA EXITOSAMENTE
              </option>
              <option value="autorizada_emitida" className="bg-[#101726] text-emerald-400">
                ● AUTORIZADA / EMITIDA
              </option>
              <option value="en_proceso" className="bg-[#101726] text-sky-400">
                ● EN PROCESO / BORRADOR
              </option>
              <option value="aprobada_supervisor" className="bg-[#101726] text-blue-400">
                ● APROBADA POR SUPERVISOR
              </option>
              <option value="cerrada_factura_pagada" className="bg-[#101726] text-emerald-400">
                ● CERRADA / FACTURA PAGADA
              </option>
            </select>
          </div>
        </div>

        {/* ── BLOQUE SUPERIOR 70 / 30 FIEL A STITCH SCREEN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Bloque Izquierdo (70% / col-span-8): INFORMACIÓN PRIMARIA */}
          <div className="lg:col-span-8 bg-[#101726] border border-[#1e293b] rounded-lg p-5 shadow-lg space-y-4">
            {/* Header de la tarjeta */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1e293b]/70">
              <div className="flex items-center gap-2 cursor-pointer">
                <i className="fa-solid fa-chevron-down text-blue-400 text-xs"></i>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                  INFORMACIÓN PRIMARIA
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span>ID de Contrato / Requisición: </span>
                <input
                  type="text"
                  value={idContratoRequisicion}
                  onChange={(e) => setIdContratoRequisicion(e.target.value)}
                  className="bg-[#0a0f1d] border border-[#1e293b] rounded px-2 py-0.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 w-52"
                  placeholder="SFG-C259-LVT-RQ-127/26"
                />
              </div>
            </div>

            {/* Formulario en rejilla de 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* Fila 1 */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  NO. DE OC
                </label>
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  PROVEEDOR ADJUDICADO
                </label>
                <select
                  value={proveedorSeleccionadoId}
                  onChange={(e) => handleProveedorSelect(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium truncate"
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.razonSocial} ({p.rfc})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  <span className="text-rose-500 mr-0.5">*</span>SOLICITANTE / COMPRADOR
                </label>
                <input
                  type="text"
                  value={compradorNombre}
                  onChange={(e) => setCompradorNombre(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Fila 2 */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  FECHA DE EMISIÓN
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  <span className="text-rose-500 mr-0.5">*</span>FECHA REQUERIDA DE ENTREGA
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  <span className="text-rose-500 mr-0.5">*</span>ALMACÉN DESTINO
                </label>
                <select
                  value={almacenDestino}
                  onChange={(e) => setAlmacenDestino(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium truncate"
                >
                  <option>Almacén Principal (Sede CDMX)</option>
                  <option>Almacén Veracruz (Sitio Tenaris)</option>
                  <option>Almacén Monterrey (Planta Norte)</option>
                  <option>Almacén Dos Bocas (Refinería Paraíso)</option>
                </select>
              </div>

              {/* Fila 3 */}
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  CONDICIÓN DE PAGO
                </label>
                <select
                  value={condicionPago}
                  onChange={(e) => setCondicionPago(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option>Crédito 30 días</option>
                  <option>Contado comercial</option>
                  <option>Crédito 15 días</option>
                  <option>Crédito 60 días</option>
                  <option>Anticipo 50% / 50% contra entrega</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  TÉRMINOS DE ENTREGA
                </label>
                <input
                  type="text"
                  value={terminosEntrega}
                  onChange={(e) => setTerminosEntrega(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  CENTRO DE COSTOS / FRENTE
                </label>
                <input
                  type="text"
                  value={centroCostos}
                  onChange={(e) => setCentroCostos(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Fila 4: Ancho completo */}
              <div className="md:col-span-3 pt-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  NOTA DE LA ORDEN Y ESPECIFICACIONES TÉCNICAS
                </label>
                <textarea
                  rows={2}
                  value={notaOrden}
                  onChange={(e) => setNotaOrden(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Coordenadas de Entrega / Nave (Geolocalizado) */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#1e293b] bg-[#0a0f1d]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-400 bg-blue-500/10">
                      <span className="material-symbols-outlined text-lg">explore</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Coordenadas de Entrega / Nave</div>
                      <div className="font-mono text-[11px] text-slate-400">19.1412° N, 96.1134° W · Zona Portuaria</div>
                    </div>
                  </div>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Geolocalizado
                  </span>
                </div>
              </div>
            </div>

            {/* Barra inferior: Firmas Digitales y Aprobación */}
            <div className="pt-3 border-t border-[#1e293b]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <i className="fa-regular fa-circle-check text-sm"></i>
                <span>
                  <strong className="text-white font-semibold">Firmas Digitales y Aprobación:</strong>{' '}
                  Autorizado por {compradorNombre} • Requisición ligada: {idContratoRequisicion}.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFirmaAutorizada(!firmaAutorizada);
                  mostrarToast(
                    firmaAutorizada
                      ? 'Estado de firma puesto en revisión.'
                      : '✓ Firma digital validada y confirmada.',
                    'info'
                  );
                }}
                className={`px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition border ${
                  firmaAutorizada
                    ? 'bg-[#0b2820] text-emerald-400 border-emerald-500/40 hover:bg-emerald-950'
                    : 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                }`}
              >
                {firmaAutorizada ? '✓ FIRMA DIGITAL OK' : 'FIRMA PENDIENTE'}
              </button>
            </div>
          </div>

          {/* Bloque Derecho (30% / col-span-4): RESUMEN DE IMPORTES */}
          <div className="lg:col-span-4 bg-[#101726] border border-[#1e293b] rounded-lg p-5 shadow-lg space-y-4">
            {/* Header Resumen con badge MXN */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                RESUMEN DE IMPORTES
              </h2>
              <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/30 leading-tight">
                {moneda}
              </span>
            </div>

            {/* Desglose de importes */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Subtotal Partidas:</span>
                <span className="font-mono font-bold text-white">
                  ${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax Total (Impuestos):</span>
                <span className="font-mono font-bold text-white">
                  ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA por Acreditar 16%:</span>
                <span className="font-mono font-bold text-white">
                  ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Línea discontinua divisoria */}
            <div className="border-t border-dashed border-[#1e293b] pt-4 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  TOTAL A PAGAR ({moneda})
                </span>
                <div className="text-2xl font-extrabold font-mono text-emerald-400 tracking-tight mt-0.5">
                  ${granTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-sm font-bold text-emerald-400">{moneda}</span>
                </div>
              </div>

              {/* Estado de pago interactivo con bolita verde */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>Estado de pago: </span>
                <select
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value)}
                  className="bg-[#0a0f1d] border border-[#1e293b] rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>Pendiente de factura</option>
                  <option>Factura adjunta (En validación)</option>
                  <option>Factura timbrada SAT CFDI 4.0</option>
                  <option>Programado para dispersión</option>
                  <option>Pagado (Comprobante SPEI)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── BLOQUE INFERIOR CON 3 TARJETAS EN FILA HORIZONTAL (GRID DE 3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta 1: Clasificación Operativa */}
          <div className="bg-[#101726] border border-[#1e293b] rounded-lg p-5 shadow-lg space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b]/70">
              <i className="fa-solid fa-folder-tree text-blue-400 text-xs"></i>
              <h3 className="text-xs font-bold text-white">Clasificación Operativa</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  SUBSIDIARIA
                </label>
                <select
                  value={subsidiaria}
                  onChange={(e) => setSubsidiaria(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium truncate"
                >
                  <option>SIFYGSA Fire &amp; Gas S.A. de C.V.</option>
                  <option>SIFYGSA Operaciones del Golfo</option>
                  <option>SIFYGSA Proyectos Especiales Norte</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  DEPARTAMENTO
                </label>
                <input
                  type="text"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Gestión entre Empresas & Moneda */}
          <div className="bg-[#101726] border border-[#1e293b] rounded-lg p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]/70">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-calculator text-blue-400 text-xs"></i>
                <h3 className="text-xs font-bold text-white">Gestión entre Empresas &amp; Moneda</h3>
              </div>
              <button
                type="button"
                onClick={handleFixOficial}
                className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[9px] font-mono font-bold tracking-wider uppercase hover:bg-blue-600/50 transition cursor-pointer"
                title="Fijar cotización oficial Banxico"
              >
                FIX OFICIAL
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    MONEDA
                  </label>
                  <select
                    value={moneda}
                    onChange={(e) => {
                      const m = e.target.value as MonedaDivisa;
                      setMoneda(m);
                      cambiarMonedaOrden(folio, m, m === 'USD' ? 18.45 : 1.0, compradorNombre);
                    }}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="MXN">MXN - Peso</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    TIPO DE CAMBIO
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tipoCambio}
                    onChange={(e) => setTipoCambio(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono font-semibold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                Cotización oficial Banxico para contratos en divisa extranjera.
              </p>
            </div>
          </div>

          {/* Tarjeta 3: Términos & Operaciones */}
          <div className="bg-[#101726] border border-[#1e293b] rounded-lg p-5 shadow-lg space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b]/70">
              <i className="fa-solid fa-truck text-blue-400 text-xs"></i>
              <h3 className="text-xs font-bold text-white">Términos &amp; Operaciones</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  TIPO DE COMPRA
                </label>
                <select
                  value={tipoCompra}
                  onChange={(e) => setTipoCompra(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium truncate"
                >
                  <option>Bienes y Servicios Industriales</option>
                  <option>Arrendamiento de Equipo</option>
                  <option>Materiales y Consumibles</option>
                  <option>Subcontratos de Obra</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  ALMACÉN DE RECEPCIÓN
                </label>
                <input
                  type="text"
                  value={almacenRecepcion}
                  onChange={(e) => setAlmacenRecepcion(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium truncate"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN PRINCIPAL CON PESTAÑAS NETSUITE ── */}
        <section className="bg-[#101726] border border-[#1e293b] rounded-lg shadow-sm overflow-hidden">
          {/* Barra de pestañas NetSuite */}
          <div className="ns-tab-bar">
            {/* 1. Artículos */}
            <button
              type="button"
              onClick={() => handleTabClick('articulos')}
              className={`ns-tab-btn ${activeTab === 'articulos' ? 'is-active' : ''}`}
            >
              <span>Artículos</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {items.length}
              </span>
            </button>

            {/* 2. Facturación */}
            <button
              type="button"
              onClick={() => handleTabClick('facturacion')}
              className={`ns-tab-btn ${activeTab === 'facturacion' ? 'is-active' : ''}`}
            >
              <span>Facturación</span>
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                CFDI
              </span>
            </button>

            {/* 3. Envío */}
            <button
              type="button"
              onClick={() => handleTabClick('envio')}
              className={`ns-tab-btn ${activeTab === 'envio' ? 'is-active' : ''}`}
            >
              <span>Envío</span>
            </button>

            {/* 4. Contabilidad */}
            <button
              type="button"
              onClick={() => handleTabClick('contabilidad')}
              className={`ns-tab-btn ${activeTab === 'contabilidad' ? 'is-active' : ''}`}
            >
              <span>Contabilidad</span>
            </button>

            {/* 5. Relaciones */}
            <button
              type="button"
              onClick={() => handleTabClick('relaciones')}
              className={`ns-tab-btn ${activeTab === 'relaciones' ? 'is-active' : ''}`}
            >
              <span>Relaciones</span>
            </button>

            {/* 6. Comunicación */}
            <button
              type="button"
              onClick={() => handleTabClick('comunicacion')}
              className={`ns-tab-btn ${activeTab === 'comunicacion' ? 'is-active' : ''}`}
            >
              <span>Comunicación</span>
              <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                {comunicaciones.length}
              </span>
            </button>

            {/* 7. Información del sistema */}
            <button
              type="button"
              onClick={() => handleTabClick('info_sistema')}
              className={`ns-tab-btn ${activeTab === 'info_sistema' ? 'is-active' : ''}`}
            >
              <span>Información del sistema</span>
            </button>

            {/* 8. Registros relacionados */}
            <button
              type="button"
              onClick={() => handleTabClick('registros_relacionados')}
              className={`ns-tab-btn ${activeTab === 'registros_relacionados' ? 'is-active' : ''}`}
            >
              <span>Registros relacionados</span>
              <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                {archivosAdjuntos.length}
              </span>
            </button>

            {/* 9. Personalizado */}
            <button
              type="button"
              onClick={() => handleTabClick('personalizado')}
              className={`ns-tab-btn ${activeTab === 'personalizado' ? 'is-active' : ''}`}
            >
              <span>Personalizado</span>
            </button>

            {/* 10. TEF */}
            <button
              type="button"
              onClick={() => handleTabClick('tef')}
              className={`ns-tab-btn ${activeTab === 'tef' ? 'is-active' : ''}`}
            >
              <span>TEF</span>
            </button>

            {/* 11. Historial de aprobaciones */}
            <button
              type="button"
              onClick={() => handleTabClick('historial_aprobaciones')}
              className={`ns-tab-btn ${activeTab === 'historial_aprobaciones' ? 'is-active' : ''}`}
            >
              <span>Historial de aprobaciones</span>
            </button>

            {/* 12. Factura (Redirección a Registro Fiscal) */}
            <button
              type="button"
              onClick={() => handleTabClick('factura')}
              title="Abrir módulo de Facturas vinculado a esta Orden"
              className="ns-tab-btn text-amber-300 hover:text-white"
            >
              <span>Factura</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </button>
          </div>

          {/* Panel de Contenido de la Pestaña Activa */}
          <div className="p-5 space-y-4">
            {/* 1. ARTÍCULOS */}
            {activeTab === 'articulos' && (
              <PartidasList
                items={items}
                tipoOrden="normal"
                proveedorOrden={proveedorNombre}
                onToggleItem={handleToggleItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onDuplicateItem={handleDuplicateItem}
                onAddItem={handleAddItem}
              />
            )}

            {/* 2. FACTURACIÓN */}
            {activeTab === 'facturacion' && (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#0a0f1d] border border-[#1e293b] rounded-lg">
                <span className="material-symbols-outlined text-3xl mb-1 text-slate-500">receipt</span>
                <p className="font-bold text-sm text-white">Módulo de Facturación & CFDI 4.0</p>
                <p className="mt-1">
                  Factura fiscal SAT del proveedor: utiliza la sección inferior para cargar XML/PDF o da clic en el botón para abrir el Registro Fiscal CFDI 4.0 con los datos de esta orden precargados.
                </p>
                <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabClick('factura')}
                    className="px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-600 text-white rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Ir a Registro Fiscal CFDI 4.0</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. ENVÍO */}
            {activeTab === 'envio' && (
              <div className="p-6 text-xs text-slate-300 bg-[#0a0f1d] border border-[#1e293b] rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-blue-500">local_shipping</span>
                  <div>
                    <p className="font-bold text-sm text-white">Logística, Maniobras y Embarque</p>
                    <p className="text-[11px] text-slate-400">
                      Ubicación destino: {almacenDestino} · Condiciones: {terminosEntrega}
                    </p>
                  </div>
                </div>

                {/* Coordenadas de Entrega / Nave (Geolocalizado) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    backgroundColor: '#101726',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid #2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        explore
                      </span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                        Coordenadas de Entrega / Nave
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginTop: '2px',
                        }}
                      >
                        19.1412° N, 96.1134° W · Zona Portuaria
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: '#064e3b',
                      color: '#6ee7b7',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #047857',
                    }}
                  >
                    Geolocalizado
                  </span>
                </div>
              </div>
            )}

            {/* 4. CONTABILIDAD */}
            {activeTab === 'contabilidad' && (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#0a0f1d] border border-[#1e293b] rounded-lg">
                <span className="material-symbols-outlined text-3xl mb-1 text-slate-500">account_balance</span>
                <p className="font-bold text-sm text-white">Centro de Costos y Asignación Presupuestal</p>
                <p className="mt-1">
                  Centro de costos asignado: <strong className="text-white font-mono">{centroCostos}</strong> · Contrato:{' '}
                  <strong className="text-white font-mono">{idContratoRequisicion}</strong>.
                </p>
              </div>
            )}

            {/* 5. RELACIONES */}
            {activeTab === 'relaciones' && (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#0a0f1d] border border-[#1e293b] rounded-lg">
                <span className="material-symbols-outlined text-3xl mb-1 text-slate-500">hub</span>
                <p className="font-bold text-sm text-white">Registros Relacionados y Trazabilidad</p>
                <p className="mt-1">
                  Requisición vinculada: <strong className="text-blue-400 font-mono">{idContratoRequisicion}</strong> · Proveedor:{' '}
                  <strong className="text-white">{proveedorNombre}</strong> ({proveedorRfc}).
                </p>
              </div>
            )}

            {/* 6. COMUNICACIÓN */}
            {activeTab === 'comunicacion' && (
              <div className="space-y-4">
                {/* Formulario para registrar nueva comunicación */}
                <div className="bg-[#0a0f1d] border border-[#1e293b] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-blue-400">add_comment</span>
                      Registrar Comunicación / Minuta
                    </h4>
                    <span className="text-[10px] text-slate-400">Historial colaborativo de la orden</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Tipo de Registro
                      </label>
                      <select
                        value={nuevoTipoCom}
                        onChange={(e) => setNuevoTipoCom(e.target.value as any)}
                        className="w-full bg-[#101726] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Nota">Nota interna</option>
                        <option value="Correo">Correo electrónico</option>
                        <option value="Llamada">Llamada telefónica</option>
                        <option value="Mensaje">Mensaje / WhatsApp</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Detalle del Acuerdo o Mensaje
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={nuevoTextoCom}
                          onChange={(e) => setNuevoTextoCom(e.target.value)}
                          placeholder="Registra acuerdos, especificaciones o llamadas con el proveedor..."
                          className="w-full bg-[#101726] border border-[#1e293b] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-sans"
                        />
                        <button
                          type="button"
                          onClick={handleAgregarComunicacion}
                          className="px-4 py-2 bg-[#1D4ED8] hover:bg-blue-600 text-white rounded text-xs font-bold self-end whitespace-nowrap transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[15px]">send</span>
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista / Timeline de Comunicaciones */}
                <div className="oc-timeline">
                  {comunicaciones.map((com) => {
                    const iconMap: Record<string, { icon: string; bg: string; color: string }> = {
                      Nota: { icon: 'edit_note', bg: 'bg-blue-500/10', color: 'text-blue-400' },
                      Correo: { icon: 'mail', bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
                      Llamada: { icon: 'call', bg: 'bg-amber-500/10', color: 'text-amber-400' },
                      Mensaje: { icon: 'chat', bg: 'bg-purple-500/10', color: 'text-purple-400' },
                    };
                    const style = iconMap[com.tipo] || iconMap.Nota;

                    return (
                      <div key={com.id} className="oc-timeline-item">
                        <div className={`oc-timeline-icon ${style.bg} ${style.color}`}>
                          <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                        </div>
                        <div className="oc-timeline-card">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-1.5 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{com.autor}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                                {com.tipo}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{com.fechaHora}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{com.texto}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. INFORMACIÓN DEL SISTEMA */}
            {activeTab === 'info_sistema' && (
              <div className="p-5 bg-[#0a0f1d] border border-[#1e293b] rounded-lg space-y-4 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b]">
                  <span className="material-symbols-outlined text-blue-400">info</span>
                  <h4 className="font-bold text-sm text-white">Información y Auditoría del Sistema</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Fecha de Emisión</span>
                    <span className="font-mono font-medium text-white">{fechaEmision} 10:00 hrs</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Comprador</span>
                    <span className="font-medium text-white">{compradorNombre}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Subsidiaria</span>
                    <span className="font-medium text-white">{subsidiaria}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Versión del Registro</span>
                    <span className="font-mono text-white">2026.4-LTS (NetSuite Schema v2)</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Estatus SAT</span>
                    <span className="text-emerald-400 font-semibold">CFDI 4.0 Timbrado / Vigente</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Hash Digital</span>
                    <span className="font-mono text-[10px] text-slate-400 break-all">sha256:4a2b89d17c3449e188f251e9c8921ba0</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. REGISTROS RELACIONADOS */}
            {activeTab === 'registros_relacionados' && (
              <div className="p-5 bg-[#0a0f1d] border border-[#1e293b] rounded-lg space-y-4 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b]">
                  <span className="material-symbols-outlined text-blue-400">account_tree</span>
                  <h4 className="font-bold text-sm text-white">Registros y Documentos Vinculados</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#101726] border border-[#1e293b] rounded-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Requisición Origen</span>
                    <p className="font-mono font-bold text-sm text-blue-400 mt-0.5">{idContratoRequisicion}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Autorizada por Dirección Técnica</p>
                  </div>
                  <div className="p-3 bg-[#101726] border border-[#1e293b] rounded-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Expediente Digital</span>
                    <p className="font-mono font-bold text-sm text-white mt-0.5">{archivosAdjuntos.length} Archivos Adjuntos</p>
                    <p className="text-[11px] text-slate-400 mt-1">Ver detalles en la sección inferior</p>
                  </div>
                  <div className="p-3 bg-[#101726] border border-[#1e293b] rounded-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Recepción de Almacén</span>
                    <p className="font-mono font-bold text-sm text-emerald-400 mt-0.5">IR-03 Recepción Verificada</p>
                    <p className="text-[11px] text-slate-400 mt-1">{almacenDestino}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. PERSONALIZADO */}
            {activeTab === 'personalizado' && (
              <div className="p-5 bg-[#0a0f1d] border border-[#1e293b] rounded-lg space-y-4 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b]">
                  <span className="material-symbols-outlined text-blue-400">tune</span>
                  <h4 className="font-bold text-sm text-white">Atributos y Campos Personalizados</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Frente de Obra / Nave
                    </label>
                    <input
                      type="text"
                      defaultValue="Frente Norte - Muelle Tenaris LVT"
                      className="w-full bg-[#101726] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Tag de Equipo Crítico
                    </label>
                    <input
                      type="text"
                      defaultValue="EQ-EMB-LVT-09"
                      className="w-full bg-[#101726] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Certificado de Calidad Exigido
                    </label>
                    <input
                      type="text"
                      defaultValue="ISO 9001:2015 / Cert. Origen Molino"
                      className="w-full bg-[#101726] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 10. TEF */}
            {activeTab === 'tef' && (
              <div className="p-5 bg-[#0a0f1d] border border-[#1e293b] rounded-lg space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">credit_card</span>
                    <h4 className="font-bold text-sm text-white">Parámetros de Dispersión TEF / SPEI</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Cuenta CLABE Validada
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Banco Receptor</span>
                    <span className="font-bold text-white">BBVA BANCOMER</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Cuenta CLABE (18 dígitos)</span>
                    <span className="font-mono font-bold text-white">012180001234567890</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Tipo de Pago TEF</span>
                    <span className="font-medium text-white">Transferencia Interbancaria SPEI</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Referencia Numérica</span>
                    <span className="font-mono text-white">10926</span>
                  </div>
                </div>
              </div>
            )}

            {/* 11. HISTORIAL DE APROBACIONES */}
            {activeTab === 'historial_aprobaciones' && (
              <div className="p-5 bg-[#0a0f1d] border border-[#1e293b] rounded-lg space-y-4 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e293b]">
                  <span className="material-symbols-outlined text-blue-400">verified</span>
                  <h4 className="font-bold text-sm text-white">Historial y Niveles de Aprobación</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#101726] border border-emerald-800 rounded-md">
                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-white">Nivel 1: Validación de Compras y Precios</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{fechaEmision} 10:20 hrs</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Aprobado por: {compradorNombre} · Coincidencia con catálogo y cotización al 100%.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#101726] border border-emerald-800 rounded-md">
                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-white">Nivel 2: Autorización Presupuestal y Dirección</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{fechaEmision} 11:45 hrs</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Aprobado por: Lic. Fernando Garza · Fondo presupuestal asignado y liberado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── SECCIÓN: EXPEDIENTE DIGITAL Y ARCHIVOS ADJUNTOS ── */}
        <section className="bg-[#101726] border border-[#1e293b] rounded-lg shadow-lg overflow-hidden p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b]/70">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-900/60 border border-blue-500/40 text-blue-400 flex items-center justify-center text-sm shadow-sm">
                <i className="fa-solid fa-folder-tree text-blue-400"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                    Documentos y Archivos Adjuntos
                  </h3>
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {archivosAdjuntos.length} Archivos
                  </span>
                  <span className="border border-emerald-500/40 bg-emerald-950/80 text-emerald-400 font-semibold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    Expediente Digital Verificado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Expediente digitalizado de la orden: requisiciones, cotizaciones de proveedor y contratos aprobados.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const nombre = `Anexo_Tecnico_OC_${Date.now()}.pdf`;
                  setArchivosAdjuntos((prev) => [
                    ...prev,
                    {
                      id: `doc-${Date.now()}`,
                      nombre,
                      tipo: 'PDF',
                      tamano: '1.1 MB',
                      meta: `Cargado por ${compradorNombre} · Hoy`,
                      badge: 'Anexo Técnico',
                      badgeColor: 'brand',
                    },
                  ]);
                  mostrarToast('✓ Nuevo documento añadido al expediente digital.', 'success');
                }}
                className="px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-plus text-[11px]"></i>
                <span>Adjuntar Archivo</span>
              </button>
            </div>
          </div>

          {/* Lista de Archivos Adjuntos */}
          <div className="space-y-2.5">
            {archivosAdjuntos.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#0a0f1d] border border-[#1e293b] rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-blue-500/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {doc.tipo}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-blue-300 transition">
                        {doc.nombre}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded font-mono text-[10px] font-semibold border ${
                          doc.badgeColor === 'emerald'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : doc.badgeColor === 'amber'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-600/70'
                            : 'bg-blue-900/60 text-blue-300 border-blue-500/40'
                        }`}
                      >
                        {doc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      {doc.tamano} · {doc.meta}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => mostrarToast(`Visualizando ${doc.nombre}...`, 'info')}
                    className="px-2.5 py-1 bg-[#1f2937] hover:bg-[#374151] text-slate-200 border border-[#374151] rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <i className="fa-regular fa-clipboard text-blue-400 text-[11px]"></i>
                    <span>Ver Documento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => mostrarToast(`Descargando ${doc.nombre}...`, 'info')}
                    className="px-2.5 py-1 bg-[#1f2937] hover:bg-[#374151] text-blue-300 border border-[#374151] rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-download text-[11px]"></i>
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN: FACTURA DEL PROVEEDOR (CFDI 4.0 TIMBRADO SAT) ── */}
        <section className="bg-[#101726] border border-[#1e293b] rounded-lg shadow-lg overflow-hidden p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b]/70">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-sm shadow-sm">
                <i className="fa-solid fa-receipt text-emerald-400"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                    Factura del Proveedor (CFDI 4.0 SAT)
                  </h3>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      estadoArchivoFactura === 'validado'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : estadoArchivoFactura === 'con_diferencias'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : estadoArchivoFactura === 'adjunto'
                        ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {estadoArchivoFactura === 'validado'
                      ? '✓ Validado SAT'
                      : estadoArchivoFactura === 'con_diferencias'
                      ? '⚠ Con Diferencias'
                      : estadoArchivoFactura === 'adjunto'
                      ? '● Adjunto'
                      : 'Sin factura'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Adjunta el archivo XML CFDI 4.0 y/o PDF de la factura emitida por {proveedorNombre}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCargarXmlDemo}
                className="px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-emerald-400 border border-emerald-500/40 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="fa-solid fa-bolt text-xs"></i>
                <span>Cargar Factura Demo Oficial SAT</span>
              </button>
            </div>
          </div>

          {/* Zona de Arrastrar y Soltar */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFactura(true);
            }}
            onDragLeave={() => setIsDraggingFactura(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFactura(false);
              if (e.dataTransfer.files) {
                procesarArchivosFactura(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
              isDraggingFactura
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-[#1e293b] hover:border-blue-500/60 bg-[#0a0f1d]'
            }`}
          >
            <input
              type="file"
              ref={facturaFileInputRef}
              accept=".xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) procesarArchivosFactura(e.target.files);
              }}
            />
            <input
              type="file"
              ref={pdfFileInputRef}
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) procesarArchivosFactura(e.target.files);
              }}
            />

            <i className="fa-solid fa-cloud-arrow-up text-3xl text-blue-400 mb-2"></i>
            <h4 className="text-xs font-bold text-white mb-1">
              Arrastra tu archivo XML (CFDI 4.0) y/o PDF aquí
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Formatos admitidos: <strong>.xml</strong> y <strong>.pdf</strong> (Máximo 10 MB). El sistema valida estructura y sellos SAT en tiempo real.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => facturaFileInputRef.current?.click()}
                disabled={isProcesandoFactura}
                className="px-3.5 py-1.5 bg-[#1D4ED8] hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="fa-solid fa-file-code text-[11px]"></i>
                <span>Adjuntar Factura XML</span>
              </button>
              <button
                type="button"
                onClick={() => pdfFileInputRef.current?.click()}
                disabled={isProcesandoFactura}
                className="px-3.5 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-slate-200 border border-[#374151] rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="fa-solid fa-file-pdf text-[11px] text-rose-400"></i>
                <span>Adjuntar PDF</span>
              </button>
            </div>
          </div>

          {/* Errores de validación */}
          {errorValidacionFactura && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
              <span>{errorValidacionFactura}</span>
            </div>
          )}

          {/* Advertencias */}
          {advertenciasFactura.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-600/40 rounded-lg p-3 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                <span>Advertencias de Conciliación Fiscal:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                {advertenciasFactura.map((adv, idx) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumen de CFDI 4.0 Leído */}
          {(parsedFactura || xmlFile || pdfFile) && (
            <div className="bg-[#0a0f1d] border border-[#1e293b] rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice text-emerald-400 text-xs"></i>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Datos del CFDI 4.0 Extraídos
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {xmlFile && (
                    <span className="text-slate-400 text-[11px] font-mono">
                      XML: <strong className="text-slate-200">{xmlFile.name}</strong>
                    </span>
                  )}
                  {pdfFile && (
                    <span className="text-slate-400 text-[11px] font-mono">
                      PDF: <strong className="text-slate-200">{pdfFile.name}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#101726] p-2 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 font-sans block">UUID Fiscal</span>
                  <span className="text-white font-bold text-[11px] truncate block" title={parsedFactura?.uuid}>
                    {parsedFactura?.uuid || '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0'}
                  </span>
                </div>
                <div className="bg-[#101726] p-2 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 font-sans block">Folio Fiscal SAT</span>
                  <span className="text-white font-bold">{parsedFactura?.folio || 'FAC-2026-8910'}</span>
                </div>
                <div className="bg-[#101726] p-2 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 font-sans block">RFC Emisor</span>
                  <span className="text-white font-bold">{parsedFactura?.rfcEmisor || proveedorRfc}</span>
                </div>
                <div className="bg-[#101726] p-2 rounded border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 font-sans block">Total Facturado</span>
                  <span className="text-emerald-400 font-bold">
                    ${(parsedFactura?.total || granTotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    {parsedFactura?.moneda || moneda}
                  </span>
                </div>
              </div>

              {/* Botón de acción principal: Agregar factura al sistema */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 font-sans">
                  Al agregar la factura, se precargarán todos los datos en el módulo de{' '}
                  <strong className="text-slate-200">Facturación CFDI 4.0</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleAgregarFacturaAlSistema}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>Agregar Factura al Sistema (Registro Fiscal CFDI 4.0)</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── BARRA PERSISTENTE INFERIOR DE ESTADO ── */}
      <footer className="h-8 bg-[#0b1120] border-t border-[#1e293b] px-6 fixed bottom-0 left-0 right-0 flex items-center justify-between text-[11px] text-slate-400 z-40 select-none">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-network-wired text-blue-500"></i>
            <span>
              Ambiente: <strong className="text-slate-300">Producción Principal SIFYGSA</strong>
            </span>
          </span>
          <span className="text-slate-700">|</span>
          <span>
            Orden activa: <strong className="text-white font-mono">{folio}</strong>
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            Subsidiaria: <strong className="text-white">{subsidiaria}</strong>
          </span>
        </div>
        <div className="flex items-center space-x-3 font-mono">
          <span>Versión: 2026.4-LTS</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            En Línea SAT
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DetalleOrdenCompraPage;
