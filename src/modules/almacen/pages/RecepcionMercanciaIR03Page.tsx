'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAlmacen } from '../context/AlmacenContext';
import type { PartidaRecepcionIR03, RecepcionIR03Documento } from '../types';
import { Stepper, type StepItem } from '@/components/ui/Stepper';

interface ItemRecepcionStitch {
  id: string;
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  cantidadOrdenada: number;
  cantidadRecibida: number;
  unidad: string;
  precioUnitario: number;
  recibir: boolean;
  numerosSerie?: string[];
}

const PARTIDAS_INICIALES_STITCH: ItemRecepcionStitch[] = [
  {
    id: 'row-1',
    codigo: 'ART-10012',
    descripcion: 'Firewall FortiGate 60F - ex-UPC 8509500012',
    marca: 'Fortinet',
    modelo: 'FG-60F',
    cantidadOrdenada: 5,
    cantidadRecibida: 5,
    unidad: 'PZA',
    precioUnitario: 8250.0,
    recibir: true,
    numerosSerie: ['FG60F-TK2109-01', 'FG60F-TK2109-02', 'FG60F-TK2109-03', 'FG60F-TK2109-04', 'FG60F-TK2109-05'],
  },
  {
    id: 'row-2',
    codigo: 'ART-10025',
    descripcion: 'Bobina Cable UTP Cat6 305m Azul',
    marca: 'Belden',
    modelo: '7814A',
    cantidadOrdenada: 10,
    cantidadRecibida: 3,
    unidad: 'RLL',
    precioUnitario: 2450.0,
    recibir: true,
  },
  {
    id: 'row-3',
    codigo: 'ART-10044',
    descripcion: 'Switch Cisco Catalyst 1000 24 Puertos',
    marca: 'Cisco',
    modelo: 'C1000-24P-4G-L',
    cantidadOrdenada: 4,
    cantidadRecibida: 3,
    unidad: 'PZA',
    precioUnitario: 14200.0,
    recibir: true,
    numerosSerie: ['CSCO-CAT1000-A1', 'CSCO-CAT1000-A2', 'CSCO-CAT1000-A3'],
  },
  {
    id: 'row-4',
    codigo: 'ART-10089',
    descripcion: 'Sensor de Humo Fotoeléctrico Direccionable',
    marca: 'Notifier',
    modelo: 'FSP-951',
    cantidadOrdenada: 25,
    cantidadRecibida: 25,
    unidad: 'PZA',
    precioUnitario: 890.0,
    recibir: true,
  },
];


const PASOS_RECEPCION: StepItem[] = [
  {
    id: 1,
    title: 'Datos de Entrada & OC',
    description: 'Orden de compra, proveedor, fecha y almacén',
  },
  {
    id: 2,
    title: 'Partidas Recibidas & Series',
    description: 'Inspección de cantidades, series y evidencia fotográfica',
  },
  {
    id: 3,
    title: 'Verificación & Confirmación',
    description: 'Resumen documental de recepción IR03',
  },
];

export default function RecepcionMercanciaIR03Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const esOrigenServicios = searchParams?.get('origen') === 'servicios';
  const rutaPadre = esOrigenServicios ? '/almacen/servicios' : '/almacen/articulos';
  const etiquetaPadre = esOrigenServicios ? 'Servicios' : 'Artículos';
  const { recepciones, articulos, crearRecepcionIR03, eliminarRecepcionIR03, mostrarToast } = useAlmacen();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Estados de Pasos (Stepper SIFYGSA)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const validarPaso1 = (): boolean => {
    if (!noOrdenCompra.trim()) {
      mostrarToast('El número de orden de compra es obligatorio.', 'error');
      return false;
    }
    if (!proveedor.trim()) {
      mostrarToast('El proveedor es obligatorio.', 'error');
      return false;
    }
    if (!almacenDestino.trim()) {
      mostrarToast('El almacén destino es obligatorio.', 'error');
      return false;
    }
    return true;
  };

  const validarPaso2 = (): boolean => {
    const partidasARecibir = partidas.filter((p) => p.recibir && p.cantidadRecibida > 0);
    if (partidasARecibir.length === 0) {
      mostrarToast('Debe marcar y recibir al menos una partida con cantidad mayor a 0.', 'error');
      return false;
    }
    return true;
  };

  const handleContinuar = () => {
    if (currentStep === 1) {
      if (!validarPaso1()) return;
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!validarPaso2()) return;
      setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAtras = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNum: number) => {
    if (stepNum === currentStep) return;
    if (stepNum < currentStep || completedSteps.includes(stepNum)) {
      setCurrentStep(stepNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentStep === 1 && !validarPaso1()) return;
    if (currentStep === 2 && !validarPaso2()) return;
    setCurrentStep(stepNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Estados de Cabecera y Datos de Entrada (Stitch Form)
  const [noOrdenCompra, setNoOrdenCompra] = useState('PO OC-0006');
  const [subsidiaria, setSubsidiaria] = useState('SIFYGSA');
  const [proveedor, setProveedor] = useState('Corporativo SOS SA de CV');
  const [fechaRecepcion, setFechaRecepcion] = useState('13/11/2026');
  const [almacenDestino, setAlmacenDestino] = useState('Almacén Principal');
  const [moneda, setMoneda] = useState('MXN');
  const [nota, setNota] = useState(
    'Entrega programada para 13/11/2026. Revisar contra PO y validar cantidad y número de serie previo a recepción.'
  );

  // Selector desplegable interactivo de fechas
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Evidencia Fotográfica adjunta
  const [evidenciaNombre, setEvidenciaNombre] = useState<string | null>(null);

  // Partidas Operativas
  const [partidas, setPartidas] = useState<ItemRecepcionStitch[]>(PARTIDAS_INICIALES_STITCH);

  // Estados de retroalimentación
  const [borradorGuardado, setBorradorGuardado] = useState(false);
  const [modalExitoOpen, setModalExitoOpen] = useState(false);
  const [recepcionCreada, setRecepcionCreada] = useState<RecepcionIR03Documento | null>(null);

  // Modal para agregar artículo
  const [modalAgregarArticuloOpen, setModalAgregarArticuloOpen] = useState(false);
  const [skuSeleccionadoParaAgregar, setSkuSeleccionadoParaAgregar] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');

  // Modal para eliminar recepción con motivo de auditoría
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [recepcionAEliminar, setRecepcionAEliminar] = useState<string | null>(null);
  const [motivoEliminacion, setMotivoEliminacion] = useState('');

  // Folio Provisional
  const folioProvisional = useMemo(() => {
    return `IR03-2026-${String(recepciones.length + 11).padStart(2, '0')}`;
  }, [recepciones]);

  // Manejar cambio de cantidad recibida en una fila
  const handleCantidadRecibidaChange = (id: string, valor: number) => {
    setPartidas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            cantidadRecibida: Math.max(0, valor),
          };
        }
        return item;
      })
    );
  };

  // Alternar checkbox de recibir partida
  const handleToggleRecibir = (id: string) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, recibir: !item.recibir } : item))
    );
  };

  // Cálculo de totales financieros en tiempo real
  const subtotalCalculado = useMemo(() => {
    return partidas.reduce((acc, p) => {
      if (!p.recibir) return acc;
      return acc + p.cantidadRecibida * p.precioUnitario;
    }, 0);
  }, [partidas]);

  const ivaCalculado = useMemo(() => subtotalCalculado * 0.16, [subtotalCalculado]);
  const totalCalculado = useMemo(() => subtotalCalculado + ivaCalculado, [subtotalCalculado, ivaCalculado]);

  // Manejo de carga de foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenciaNombre(file.name);
      mostrarToast(`Evidencia fotográfica "${file.name}" adjunta con éxito.`, 'success');
    }
  };

  // Guardar borrador
  const handleGuardarBorrador = () => {
    setBorradorGuardado(true);
    mostrarToast('Borrador guardado localmente de forma segura.', 'info');
    setTimeout(() => setBorradorGuardado(false), 2500);
  };

  // Agregar artículo desde el catálogo
  const handleAgregarArticulo = () => {
    if (!skuSeleccionadoParaAgregar) return;
    const art = articulos.find((a) => a.sku === skuSeleccionadoParaAgregar);
    if (!art) return;

    const nuevaFila: ItemRecepcionStitch = {
      id: `row-${Date.now()}`,
      codigo: art.sku,
      descripcion: art.descripcionCorta || art.nombre,
      marca: art.marca || 'Genérico',
      modelo: art.modelo || 'STD-2026',
      cantidadOrdenada: 5,
      cantidadRecibida: 5,
      unidad: art.unidadMedida || 'PZA',
      precioUnitario: art.precioUnitario || 1500,
      recibir: true,
    };

    setPartidas((prev) => [...prev, nuevaFila]);
    setModalAgregarArticuloOpen(false);
    setSkuSeleccionadoParaAgregar('');
    mostrarToast(`Artículo ${art.sku} agregado a la tabla de recepción.`, 'success');
  };

  // Filtrar artículos por marca
  const handleFiltrarPorMarca = () => {
    const marcasDisponibles = ['Fortinet', 'Belden', 'Cisco', 'Notifier', 'Det-Tronics'];
    const proxima = marcasDisponibles[(marcasDisponibles.indexOf(filtroMarca) + 1) % marcasDisponibles.length];
    setFiltroMarca(proxima);
    mostrarToast(`Filtrando partidas por marca: ${proxima}`, 'info');
  };

  // Partidas visibles (con filtro opcional)
  const partidasVisibles = useMemo(() => {
    if (!filtroMarca) return partidas;
    return partidas.filter((p) => p.marca.toLowerCase().includes(filtroMarca.toLowerCase()));
  }, [partidas, filtroMarca]);

  // Confirmar Recepción Física al Kárdex
  const handleConfirmarRecepcion = () => {
    const partidasARecibir = partidas.filter((p) => p.recibir && p.cantidadRecibida > 0);

    if (partidasARecibir.length === 0) {
      mostrarToast('Debes marcar al menos una partida con cantidad recibida mayor a 0.', 'error');
      return;
    }

    const esParcial = partidasARecibir.some((p) => p.cantidadRecibida < p.cantidadOrdenada);

    const partidasIR03: PartidaRecepcionIR03[] = partidasARecibir.map((item) => {
      const artEnCatalogo = articulos.find(
        (a) => a.sku.toLowerCase() === item.codigo.toLowerCase()
      );
      return {
        id: `p-rec-${Date.now()}-${item.codigo}`,
        sku: item.codigo,
        descripcion: item.descripcion,
        cantidadSolicitadaPO: item.cantidadOrdenada,
        cantidadFacturada: item.cantidadOrdenada,
        cantidadRecibidaFisica: item.cantidadRecibida,
        stockDisponibleAlmacenPrincipal: artEnCatalogo ? artEnCatalogo.stockDisponible : 10,
        unidad: item.unidad,
        ubicacionProyectoDestino: almacenDestino,
        numerosSerie: item.numerosSerie || [],
        observaciones: `Recepción física confirmada en ${almacenDestino}.`,
        estadoPartida:
          item.cantidadRecibida >= item.cantidadOrdenada
            ? 'Completo'
            : item.cantidadRecibida > 0
            ? 'Parcial'
            : 'Pendiente',
      };
    });

    const nuevaRecepcion: RecepcionIR03Documento = {
      id: `rec-${Date.now()}`,
      folio: folioProvisional,
      ordenCompraFolio: noOrdenCompra,
      contratoProyecto: 'SFG-C259-TAM (Tenaris Tamsa)',
      proveedor,
      remisionFactura: 'REM-IR03-OFICIAL',
      fecha: new Date().toISOString().slice(0, 10),
      almacenistaResponsable: 'Roberto Velázquez - Supervisor General',
      ubicacionDestinoGeneral: almacenDestino,
      partidas: partidasIR03,
      estatus: esParcial ? 'Parcial' : 'Completa',
      notasGenerales: nota,
    };

    crearRecepcionIR03(nuevaRecepcion);
    setRecepcionCreada(nuevaRecepcion);
    setModalExitoOpen(true);
    mostrarToast(
      `¡Recepción ${folioProvisional} confirmada con éxito! Existencias afectadas en Kárdex.`,
      'success'
    );
  };

  // Eliminar recepción con motivo de auditoría
  const handleConfirmarEliminacion = () => {
    if (!recepcionAEliminar) return;
    if (!motivoEliminacion.trim()) {
      mostrarToast('El motivo de eliminación es estrictamente obligatorio para la auditoría.', 'error');
      return;
    }
    eliminarRecepcionIR03(recepcionAEliminar, motivoEliminacion.trim(), 'Roberto Velázquez');
    setModalEliminarOpen(false);
    setRecepcionAEliminar(null);
    setMotivoEliminacion('');
  };

  return (
    <div className="min-h-screen selection:bg-[#1D4ED8] selection:text-white pb-36 font-sans transition-colors" style={{ background: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <main className="w-full pt-6 max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Cabecera con título, migas de pan y botones superiores */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            {/* Migas de pan */}
            <nav className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span
                onClick={() => router.push('/almacen')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Almacén
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span
                onClick={() => router.push(rutaPadre)}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                {etiquetaPadre}
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {esOrigenServicios ? 'Entrada de servicio (IR03)' : 'Entrada a inventario (IR03)'}
              </span>
            </nav>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              {esOrigenServicios ? 'Nueva Recepción de Servicio' : 'Nueva Recepción de Artículo'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => router.push(rutaPadre)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              title={`Volver a ${etiquetaPadre}`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Volver a {etiquetaPadre}</span>
            </button>
            <button
              type="button"
              onClick={handleGuardarBorrador}
              className="px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {borradorGuardado ? '✓ Borrador Guardado' : 'Guardar Borrador'}
            </button>
          </div>
        </div>


        {/* ── STEPPER CORPORATIVO SIFYGSA ── */}
        <div className="mb-6">
          <Stepper
            steps={PASOS_RECEPCION}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
        <div className="space-y-6">
          {/* ====================================================================
              TARJETA 1: DATOS DE ENTRADA
             ==================================================================== */}
          {currentStep === 1 && (
          <div className="rounded-xl shadow-xs p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-2.5 mb-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1D4ED8] text-[26px]">fact_check</span>
                <h2 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>Datos de Entrada</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--border)' }}>
                <span className="material-symbols-outlined text-[15px]">tag</span>
                Folio Provisional: {folioProvisional}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* No. Orden de Compra */}
                <div>
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    No. Orden de Compra
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={noOrdenCompra}
                      onChange={(e) => setNoOrdenCompra(e.target.value)}
                      placeholder="ej: PO OC-0006"
                      className="w-full px-3.5 py-2 rounded-lg text-sm pr-10 shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const folioSugerido = 'PO-OC-2026-0042';
                        const proveedorSugerido = 'SIFYGSA Soluciones Industriales';
                        setNoOrdenCompra(folioSugerido);
                        setProveedor(proveedorSugerido);
                        mostrarToast(`Orden ${folioSugerido} vinculada a la recepción.`, 'info');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:text-[#1D4ED8] rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Buscar o validar orden de compra"
                    >
                      <span className="material-symbols-outlined text-[18px]">search</span>
                    </button>
                  </div>
                </div>

                {/* Subsidiaria */}
                <div>
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Subsidiaria
                  </label>
                  <div className="relative">
                    <select
                      value={subsidiaria}
                      onChange={(e) => setSubsidiaria(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2 rounded-lg text-sm cursor-pointer pr-10 shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    >
                      <option value="SIFYGSA">SIFYGSA (Empresa Principal)</option>
                      <option value="SIFYGSA_SUR">SIFYGSA - Región Sur</option>
                      <option value="SIFYGSA_NORTE">SIFYGSA - Logística Norte</option>
                      <option value="TELECOM">Telecom &amp; Redes del Centro</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]" style={{ color: 'var(--text-muted)' }}>
                      business
                    </span>
                  </div>
                </div>

                {/* Proveedor */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg text-sm shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                    style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Fecha de Recepción */}
                <div>
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Fecha de Recepción
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={fechaRecepcion}
                      onClick={() => setDatePickerOpen(!datePickerOpen)}
                      className="w-full px-3.5 py-2 rounded-lg text-sm pr-10 cursor-pointer shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setDatePickerOpen(!datePickerOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:text-[#1D4ED8] rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Abrir selector de fecha"
                    >
                      <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                    </button>

                    {/* Popover de Selector de Fecha */}
                    {datePickerOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 p-3 rounded-xl shadow-lg z-50 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Noviembre 2026</span>
                          <button
                            type="button"
                            onClick={() => setDatePickerOpen(false)}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                          <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {Array.from({ length: 30 }, (_, i) => i + 1).map((dia) => (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => {
                                setFechaRecepcion(`${String(dia).padStart(2, '0')}/11/2026`);
                                setDatePickerOpen(false);
                              }}
                              className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg ${
                                dia === 13
                                  ? 'bg-[#1D4ED8] text-white font-bold'
                                  : 'hover:bg-[var(--surface-alt)]'
                              }`}
                              style={{ color: dia === 13 ? '#ffffff' : 'var(--text-primary)' }}
                            >
                              {dia}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Almacén Destino */}
                <div>
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Almacén Destino
                  </label>
                  <div className="relative">
                    <select
                      value={almacenDestino}
                      onChange={(e) => setAlmacenDestino(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2 rounded-lg text-sm cursor-pointer pr-10 shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    >
                      <option value="Almacén Principal">Almacén Principal</option>
                      <option value="Mérida">Mérida</option>
                      <option value="Ciudad del Carmen">Ciudad del Carmen</option>
                      <option value="Comalcalco">Comalcalco</option>
                      <option value="Minatitlán">Minatitlán</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]" style={{ color: 'var(--text-muted)' }}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Moneda */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Moneda
                  </label>
                  <div className="relative">
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2 rounded-lg text-sm cursor-pointer pr-10 shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    >
                      <option value="MXN">MXN - Peso Mexicano</option>
                      <option value="USD">USD - Dólar Estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]" style={{ color: 'var(--text-muted)' }}>
                      payments
                    </span>
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Nota
                </label>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg text-sm resize-none shadow-xs font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                  style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                />
              </div>
            </div>
          </div>
          )}

          {/* ====================================================================
              TARJETA 2: ARTÍCULOS (4 PARTIDAS STITCH)
             ==================================================================== */}
          {currentStep === 2 && (
          <div className="rounded-xl shadow-xs p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1D4ED8] text-[26px]">table_chart</span>
                <h2 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  Artículos ({partidas.length} partidas)
                </h2>
              </div>
              {filtroMarca && (
                <span className="text-xs font-semibold flex items-center gap-1 text-[#1D4ED8]">
                  Filtro: {filtroMarca}
                  <button
                    type="button"
                    onClick={() => setFiltroMarca('')}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            {/* Barra de acciones sobre la tabla */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => setModalAgregarArticuloOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--link)' }}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Agregar Artículo</span>
              </button>

              <button
                type="button"
                onClick={handleFiltrarPorMarca}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--link)' }}
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Buscar por Marca (ej: Fortinet)</span>
              </button>

              <label
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--link)' }}
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>Adjuntar Evidencia Fotográfica</span>
              </label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {evidenciaNombre && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--border)' }}>
                  <span className="material-symbols-outlined text-[16px]">image</span>
                  <span className="max-w-[150px] truncate">{evidenciaNombre}</span>
                  <button
                    type="button"
                    onClick={() => setEvidenciaNombre(null)}
                    className="hover:opacity-75 cursor-pointer ml-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tabla Operativa Completa y Nítida */}
            <div className="overflow-x-auto rounded-lg shadow-xs" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-left border-collapse text-sm">
                <thead className="font-bold text-xs uppercase tracking-wider" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th className="py-3 px-3 text-center w-12" style={{ borderRight: '1px solid var(--border)' }}>Recibir</th>
                    <th className="py-3 px-3" style={{ borderRight: '1px solid var(--border)' }}>Código Artículo</th>
                    <th className="py-3 px-3" style={{ borderRight: '1px solid var(--border)' }}>Descripción Corta Buscable</th>
                    <th className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>Marca</th>
                    <th className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>Modelo</th>
                    <th className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>Cant. Ordenada</th>
                    <th className="py-3 px-3 text-center font-bold" style={{ borderRight: '1px solid var(--border)' }}>Cant. Recibida</th>
                    <th className="py-3 px-3 text-center font-bold min-w-[160px]" style={{ borderRight: '1px solid var(--border)' }}>
                      Cant. Pendiente<br />
                      <span className="font-normal text-[10px] lowercase" style={{ color: 'var(--text-muted)' }}>(Restante)</span>
                    </th>
                    <th className="py-3 px-3 text-center">Unidad</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'var(--card)', color: 'var(--text-primary)' }}>
                  {partidasVisibles.map((item) => {
                    const diff = item.cantidadOrdenada - item.cantidadRecibida;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          !item.recibir ? 'opacity-50' : ''
                        }`}
                        style={{ borderBottom: '1px solid var(--divider)' }}
                      >
                        {/* Recibir Checkbox */}
                        <td className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
                          <input
                            type="checkbox"
                            checked={item.recibir}
                            onChange={() => handleToggleRecibir(item.id)}
                            className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Código Artículo */}
                        <td className="py-3 px-3 font-mono text-xs font-bold" style={{ borderRight: '1px solid var(--border)', color: 'var(--link)' }}>
                          {item.codigo}
                        </td>

                        {/* Descripción Corta */}
                        <td className="py-3 px-3 font-normal" style={{ borderRight: '1px solid var(--border)' }}>
                          {item.descripcion}
                        </td>

                        {/* Marca */}
                        <td className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                            {item.marca}
                          </span>
                        </td>

                        {/* Modelo */}
                        <td className="py-3 px-3 text-center font-mono text-xs" style={{ borderRight: '1px solid var(--border)' }}>
                          {item.modelo}
                        </td>

                        {/* Cant. Ordenada */}
                        <td className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded" style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)' }}>
                            {item.cantidadOrdenada}
                          </span>
                        </td>

                        {/* Cant. Recibida (Editable) */}
                        <td className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
                          <input
                            type="number"
                            min={0}
                            value={item.cantidadRecibida}
                            disabled={!item.recibir}
                            onChange={(e) =>
                              handleCantidadRecibidaChange(item.id, Number(e.target.value))
                            }
                            className="w-16 text-center font-bold py-1 px-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] font-mono shadow-xs"
                            style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          />
                        </td>

                        {/* Cant. Pendiente (Restante) */}
                        <td className="py-3 px-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
                          {diff === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-xs" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--border)' }}>
                              <span className="material-symbols-outlined text-[15px]">check_circle</span>
                              ✓ Completo (0 restantes)
                            </span>
                          ) : diff > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-xs" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--border)' }}>
                              <span className="material-symbols-outlined text-[15px]">warning</span>
                              ⚠ Faltan {diff}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-xs" style={{ background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--border)' }}>
                              <span className="material-symbols-outlined text-[15px]">add_circle</span>
                              Excedente +{Math.abs(diff)}
                            </span>
                          )}
                        </td>

                        {/* Unidad */}
                        <td className="py-3 px-3 text-center font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {item.unidad}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen financiero alineado a la derecha */}
            <div className="mt-5 flex flex-col sm:flex-row flex-wrap sm:items-center sm:justify-end gap-3 sm:gap-8 pr-2 text-sm pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span className="font-mono font-bold min-w-[130px] text-right" style={{ color: 'var(--text-primary)' }}>
                  {subtotalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {moneda}
                </span>
              </div>
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>IVA (16%):</span>
                <span className="font-mono font-bold min-w-[130px] text-right" style={{ color: 'var(--text-primary)' }}>
                  {ivaCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {moneda}
                </span>
              </div>
              <div className="flex items-center gap-3 justify-between sm:justify-end text-base">
                <span className="font-bold text-[#1D4ED8]">TOTAL {moneda}:</span>
                <span className="font-mono font-bold text-[#1D4ED8] text-[20px] min-w-[150px] text-right">
                  {totalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {moneda}
                </span>
              </div>
            </div>
          </div>
          )}

          {/* ====================================================================
              PASO 3: VERIFICACIÓN & CONFIRMACIÓN DE RECEPCIÓN IR03
             ==================================================================== */}
          {currentStep === 3 && (
          <div className="rounded-xl shadow-xs p-6 space-y-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1D4ED8] text-[26px]">verified</span>
                <div>
                  <h2 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>Resumen y Verificación de Recepción</h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Revise la información y partidas recibidas antes de ingresar al inventario de almacén.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--border)' }}>
                <span className="material-symbols-outlined text-[15px]">assignment_turned_in</span>
                Listo para Confirmar
              </span>
            </div>

            {/* Metadatos Generales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl text-xs" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              <div>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Folio Provisional:</span>
                <span className="font-mono font-bold text-[#1D4ED8] text-sm">{folioProvisional}</span>
              </div>
              <div>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Orden de Compra:</span>
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{noOrdenCompra}</span>
              </div>
              <div>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Proveedor:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{proveedor}</span>
              </div>
              <div>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Almacén Destino:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{almacenDestino}</span>
              </div>
              <div>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Fecha de Recepción:</span>
                <span className="font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{fechaRecepcion}</span>
              </div>
              <div>
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Subsidiaria:</span>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{subsidiaria}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Evidencia Adjunta:</span>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{evidenciaNombre || 'Sin archivo fotográfico adjunto'}</span>
              </div>
            </div>

            {/* Partidas que ingresan */}
            <div>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="material-symbols-outlined text-[18px] text-[#1D4ED8]">inventory_2</span>
                Partidas Marcadas para Entrada al Inventario ({partidas.filter((p) => p.recibir).length} de {partidas.length})
              </h3>
              <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="font-mono uppercase text-[11px]" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant. Recibida</th>
                      <th className="py-2.5 px-3 text-right">P. Unitario</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium" style={{ background: 'var(--card)', color: 'var(--text-primary)' }}>
                    {partidas.filter((p) => p.recibir).map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1D4ED8]">{p.codigo}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.descripcion}</div>
                          {p.numerosSerie && p.numerosSerie.length > 0 && (
                            <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              Series: {p.numerosSerie.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-500">
                          {p.cantidadRecibida} {p.unidad}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                          $ {p.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                          $ {(p.cantidadRecibida * p.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="mt-4 flex flex-col sm:flex-row justify-end gap-6 text-xs pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-right">
                  <span className="mr-3" style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>$ {subtotalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}</span>
                </div>
                <div className="text-right">
                  <span className="mr-3" style={{ color: 'var(--text-secondary)' }}>IVA (16%):</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>$ {ivaCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}</span>
                </div>
                <div className="text-right text-sm">
                  <span className="font-bold text-[#1D4ED8] mr-3">TOTAL:</span>
                  <span className="font-mono font-bold text-[#1D4ED8] text-base">$ {totalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ====================================================================
              TARJETA 3: HISTORIAL DE RECEPCIONES IR03 CONFIRMADAS
             ==================================================================== */}
          <div className="rounded-xl shadow-xs p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">history</span>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Historial de Recepciones IR03 en Sistema
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                {recepciones.length} Documentos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="font-mono uppercase text-[11px]" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th className="py-2 px-3">Folio IR03</th>
                    <th className="py-2 px-3">Orden Compra</th>
                    <th className="py-2 px-3">Proveedor</th>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3 text-center">Partidas</th>
                    <th className="py-2 px-3 text-center">Estado</th>
                    <th className="py-2 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="font-medium" style={{ background: 'var(--card)', color: 'var(--text-primary)' }}>
                  {recepciones.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1D4ED8]">{r.folio}</td>
                      <td className="py-2.5 px-3 font-mono">{r.ordenCompraFolio}</td>
                      <td className="py-2.5 px-3">{r.proveedor}</td>
                      <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{r.fecha}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{r.partidas.length}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold"
                          style={{
                            background: r.estatus === 'Completa' ? 'var(--success-bg)' : 'var(--warning-bg)',
                            color: r.estatus === 'Completa' ? 'var(--success-text)' : 'var(--warning-text)',
                          }}
                        >
                          {r.estatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setRecepcionAEliminar(r.id);
                            setModalEliminarOpen(true);
                          }}
                          className="px-2 py-1 rounded font-mono text-xs cursor-pointer"
                          style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--border)' }}
                        >
                          Anular
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ====================================================================
          BARRA INFERIOR FIJA (BOTTOM STICKY BAR)
         ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-3.5 z-30 transition-all bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-[0_-4px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Estatus */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] animate-pulse" />
            <span className="hidden sm:inline font-medium">
              Borrador guardado localmente hace 1 min • Recepción IR03 vinculada a Orden {noOrdenCompra}
            </span>
            <span className="sm:hidden font-semibold">
              IR03 • {noOrdenCompra}
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => router.push(rutaPadre)}
                className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAtras}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Atrás</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGuardarBorrador}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <span className="material-symbols-outlined text-[17px]">save</span>
              <span>Guardar Borrador</span>
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleContinuar}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>Continuar</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmarRecepcion}
                className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">check_circle</span>
                <span>Confirmar Recepción</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Agregar Artículo */}
      {modalAgregarArticuloOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setModalAgregarArticuloOpen(false)}
        >
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="material-symbols-outlined text-[#1D4ED8]">add_box</span>
                Agregar Artículo de Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setModalAgregarArticuloOpen(false)}
                className="p-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                Seleccionar SKU del Catálogo Maestro
              </label>
              <select
                value={skuSeleccionadoParaAgregar}
                onChange={(e) => setSkuSeleccionadoParaAgregar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                <option value="">-- Elige un artículo --</option>
                {articulos.map((art) => (
                  <option key={art.sku} value={art.sku}>
                    {art.sku} — {art.descripcionCorta || art.nombre} ({art.marca})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAgregarArticuloOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregarArticulo}
                disabled={!skuSeleccionadoParaAgregar}
                className="px-5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                Agregar a Partidas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Exitosa */}
      {modalExitoOpen && recepcionCreada && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-[#10B981]" style={{ background: 'var(--success-bg)', border: '1px solid var(--border)' }}>
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>¡Recepción Confirmada Exitosamente!</h3>
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-secondary)' }}>
                Folio: <strong className="text-[#1D4ED8]">{recepcionCreada.folio}</strong>
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Se han incrementado las existencias en el Kárdex de almacén y registrado los movimientos físicos en {almacenDestino}.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setModalExitoOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Continuar en esta Pantalla
              </button>
              <button
                type="button"
                onClick={() => router.push(rutaPadre)}
                className="px-5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Volver a {etiquetaPadre}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Eliminar Recepción con Motivo de Auditoría */}
      {modalEliminarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setModalEliminarOpen(false)}
        >
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--danger-border, #f43f5e)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500 flex-shrink-0" style={{ background: 'var(--danger-bg)' }}>
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Auditoría: Anular Recepción IR03</h3>
                <span className="text-xs font-mono text-rose-500">Esta acción revertirá las existencias en Kárdex</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                Motivo de Auditoría / Justificación <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={motivoEliminacion}
                onChange={(e) => setMotivoEliminacion(e.target.value)}
                placeholder="Especifica el motivo de la anulación..."
                className="w-full px-3.5 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalEliminarOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
