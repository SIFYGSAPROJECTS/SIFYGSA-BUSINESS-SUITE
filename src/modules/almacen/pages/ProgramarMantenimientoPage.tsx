'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { FormWizardFooter } from '../components/FormWizardFooter';
import { useAlmacen } from '../context/AlmacenContext';
import { useCompras } from '@/modules/compras/context/ComprasContext';
import type {
  AdjuntoMantenimiento,
  FrecuenciaMantenimiento,
  MantenimientoArticulo,
  PrioridadMantenimiento,
  ProcesoSiguienteMantenimiento,
  TipoMantenimiento,
} from '../types';
import '../almacen.css';

interface ProgramarMantenimientoPageProps {
  usuarioActual?: string;
}

const PASOS_MANTENIMIENTO: StepItem[] = [
  {
    id: 1,
    title: 'Responsable y Tipo',
    description: 'Artículo, tipo de servicio y responsables',
  },
  {
    id: 2,
    title: 'Fechas y Ubicación',
    description: 'Entrada, inicio, frecuencia y traslados',
  },
  {
    id: 3,
    title: 'Detalle y Documentos',
    description: 'Trabajo/falla, prioridad, costo y adjuntos',
  },
  {
    id: 4,
    title: 'Proceso siguiente',
    description: 'Compras o Almacén y resumen final',
  },
];

const STORAGE_KEY_BORRADOR_MNT = 'sifygsa_borrador_programar_mantenimiento_v1';

const PARTICULAS_CONFETI = [
  { left: '12%', delay: '0s', color: '#8b5cf6' },
  { left: '24%', delay: '0.12s', color: '#10b981' },
  { left: '36%', delay: '0.05s', color: '#3b82f6' },
  { left: '50%', delay: '0.18s', color: '#f59e0b' },
  { left: '64%', delay: '0.08s', color: '#8b5cf6' },
  { left: '76%', delay: '0.15s', color: '#10b981' },
  { left: '88%', delay: '0.03s', color: '#3b82f6' },
];

export default function ProgramarMantenimientoPage({
  usuarioActual = 'Ing. Mateo Gómez',
}: ProgramarMantenimientoPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skuParam = searchParams?.get('sku') || '';

  const { articulos, articulosActivos, mantenimientos, enviarAMantenimiento, mostrarToast } =
    useAlmacen();
  const { agregarOrden, ordenes } = useCompras();

  const hoyIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [guardandoBorrador, setGuardandoBorrador] = useState(false);

  // Paso 1: Artículo, Tipo y Responsables
  const [articuloSku, setArticuloSku] = useState(
    () => skuParam || articulosActivos[0]?.sku || ''
  );
  const [busquedaSku, setBusquedaSku] = useState('');
  const [comboboxAbierto, setComboboxAbierto] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [tipoMantenimiento, setTipoMantenimiento] = useState<TipoMantenimiento>('Preventivo');
  const [responsableMantenimiento, setResponsableMantenimiento] = useState('');
  const [custodioArticulo, setCustodioArticulo] = useState(usuarioActual);

  // Paso 2: Fechas y Ubicación
  const [fechaEntrada, setFechaEntrada] = useState(hoyIso);
  const [fechaInicio, setFechaInicio] = useState(hoyIso);
  const [fechaEstimadaTermino, setFechaEstimadaTermino] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaMantenimiento>('Única');
  const [ubicacionActual, setUbicacionActual] = useState('Almacén Principal');
  const [ubicacionMantenimiento, setUbicacionMantenimiento] = useState('Taller Interno SIFYGSA');

  // Paso 3: Detalle y Documentos
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadMantenimiento>('Media');
  const [adjuntos, setAdjuntos] = useState<AdjuntoMantenimiento[]>([]);
  const [isDraggingAdjuntos, setIsDraggingAdjuntos] = useState(false);
  const adjuntosInputRef = useRef<HTMLInputElement>(null);

  // Paso 4: Proceso siguiente
  const [procesoSiguiente, setProcesoSiguiente] =
    useState<ProcesoSiguienteMantenimiento>('Almacén');

  // Modal de éxito animado al finalizar
  const [resumenConfirmado, setResumenConfirmado] = useState<{
    folio: string;
    articuloLabel: string;
    responsable: string;
    fechaInicio: string;
    proceso: ProcesoSiguienteMantenimiento;
    folioCompra?: string;
  } | null>(null);

  const articuloSeleccionado = useMemo(() => {
    return articulos.find((a) => a.sku.toLowerCase() === articuloSku.toLowerCase());
  }, [articulos, articuloSku]);

  // Sincronizar ubicación actual y texto de artículo si viene ?sku=
  useEffect(() => {
    if (skuParam) {
      setArticuloSku(skuParam);
    }
  }, [skuParam]);

  useEffect(() => {
    if (articuloSeleccionado) {
      setBusquedaSku(
        `${articuloSeleccionado.sku} - ${articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre}`
      );
      if (articuloSeleccionado.ubicacionNave || articuloSeleccionado.ubicacionSugerida) {
        setUbicacionActual(
          articuloSeleccionado.ubicacionNave ||
            articuloSeleccionado.ubicacionSugerida ||
            'Almacén Principal'
        );
      }
    }
  }, [articuloSeleccionado]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setComboboxAbierto(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const articulosFiltrados = useMemo(() => {
    const q = busquedaSku.trim().toLowerCase();
    if (!q) return articulosActivos;
    return articulosActivos.filter(
      (a) =>
        a.sku.toLowerCase().includes(q) ||
        (a.nombre || '').toLowerCase().includes(q) ||
        (a.descripcionCorta || '').toLowerCase().includes(q) ||
        (a.categoria || '').toLowerCase().includes(q)
    );
  }, [articulosActivos, busquedaSku]);

  // Validaciones por paso (incluye coherencia de fechas)
  const validacionPaso = useMemo(() => {
    const faltantes: string[] = [];

    if (currentStep === 1) {
      if (!articuloSeleccionado) faltantes.push('Artículo del catálogo');
      if (!tipoMantenimiento) faltantes.push('Tipo de mantenimiento');
      if (!responsableMantenimiento.trim()) faltantes.push('Responsable del mantenimiento');
      if (!custodioArticulo.trim()) faltantes.push('Responsable del artículo / custodio');
    } else if (currentStep === 2) {
      if (!fechaEntrada) faltantes.push('Fecha de entrada');
      if (!fechaInicio) faltantes.push('Fecha de inicio');
      if (fechaEntrada && fechaInicio && fechaInicio < fechaEntrada) {
        faltantes.push('Fecha de inicio no puede ser menor a la fecha de entrada');
      }
      if (fechaEstimadaTermino && fechaInicio && fechaEstimadaTermino < fechaInicio) {
        faltantes.push('Fecha estimada de término no puede ser menor a la fecha de inicio');
      }
      if (!ubicacionActual.trim()) faltantes.push('Ubicación actual');
      if (!ubicacionMantenimiento.trim()) faltantes.push('Ubicación del mantenimiento');
    } else if (currentStep === 3) {
      if (!descripcionTrabajo.trim()) faltantes.push('Descripción del trabajo o falla');
      if (!prioridad) faltantes.push('Prioridad');
    } else if (currentStep === 4) {
      if (!procesoSiguiente) faltantes.push('Proceso siguiente (Compras o Almacén)');
    }

    return { valido: faltantes.length === 0, camposFaltantes: faltantes };
  }, [
    currentStep,
    articuloSeleccionado,
    tipoMantenimiento,
    responsableMantenimiento,
    custodioArticulo,
    fechaEntrada,
    fechaInicio,
    fechaEstimadaTermino,
    ubicacionActual,
    ubicacionMantenimiento,
    descripcionTrabajo,
    prioridad,
    procesoSiguiente,
  ]);

  const handleIntentoInvalido = () => {
    if (validacionPaso.camposFaltantes.length > 0) {
      mostrarToast(validacionPaso.camposFaltantes[0], 'error');
    }
  };

  const handleContinuar = () => {
    if (!validacionPaso.valido) {
      handleIntentoInvalido();
      return;
    }
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    setCurrentStep((prev) => Math.min(4, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAtras = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarBorrador = () => {
    setGuardandoBorrador(true);
    try {
      localStorage.setItem(
        STORAGE_KEY_BORRADOR_MNT,
        JSON.stringify({
          articuloSku,
          tipoMantenimiento,
          responsableMantenimiento,
          custodioArticulo,
          fechaEntrada,
          fechaInicio,
          fechaEstimadaTermino,
          frecuencia,
          ubicacionActual,
          ubicacionMantenimiento,
          descripcionTrabajo,
          prioridad,
          procesoSiguiente,
        })
      );
      mostrarToast('Borrador de mantenimiento guardado localmente.', 'info');
    } finally {
      setTimeout(() => setGuardandoBorrador(false), 350);
    }
  };

  const handleAdjuntarArchivos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const tipoDoc: AdjuntoMantenimiento['tipo'] = file.type.startsWith('image/')
          ? 'Foto'
          : file.name.toLowerCase().includes('cot')
          ? 'Orden de Servicio'
          : 'Otro';
        setAdjuntos((prev) => [
          ...prev,
          {
            id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            nombre: file.name,
            tipo: tipoDoc,
            tamano: file.size,
            fecha: hoyIso,
            url: typeof reader.result === 'string' ? reader.result : undefined,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleConfirmarProgramacion = () => {
    if (!validacionPaso.valido || !articuloSeleccionado) {
      handleIntentoInvalido();
      return;
    }

    const folio = `MNT-2026-${String(mantenimientos.length + 1).padStart(4, '0')}`;
    let folioCompraGenerado: string | undefined;

    if (procesoSiguiente === 'Compras') {
      folioCompraGenerado = `PO-2026-${String(ordenes.length + 180).padStart(4, '0')}`;
      const subtotal = 1500;
      const iva = +(subtotal * 0.16).toFixed(2);
      agregarOrden({
        id: `oc-mnt-${Date.now()}`,
        folio: folioCompraGenerado,
        proveedorId: 'prov-mnt-01',
        proveedorNombre: responsableMantenimiento.trim(),
        proveedorRfc: 'XAXX010101000',
        fechaEmision: hoyIso,
        fechaEntrega: fechaEstimadaTermino || fechaInicio,
        moneda: 'MXN',
        condicionPago: 'Por definir / Crédito 30 días',
        subtotal,
        descuento: 0,
        iva,
        total: +(subtotal + iva).toFixed(2),
        estatus: 'pendiente',
        departamento: 'Almacén & Mantenimiento',
        solicitante: custodioArticulo.trim(),
        almacenDestino: ubicacionActual.trim(),
        referenciaServicioExtraordinario: `${folio} (${articuloSeleccionado.sku})`,
        notas: `Solicitud generada desde Mantenimiento ${folio} para artículo ${articuloSeleccionado.sku}: ${descripcionTrabajo.trim()}`,
        items: [
          {
            id: `item-mnt-${Date.now()}`,
            partida: 1,
            codigo: articuloSeleccionado.sku,
            descripcion: `Servicio ${tipoMantenimiento} - ${articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre}`,
            cantidad: 1,
            unidad: 'Servicio',
            precioUnitario: subtotal,
            descuentoPorcentaje: 0,
            subtotal,
          },
        ],
      });
    }

    const nuevoRegistro: MantenimientoArticulo = {
      id: `mnt-${Date.now()}`,
      folio,
      articuloId: articuloSeleccionado.id,
      articuloSku: articuloSeleccionado.sku,
      articuloNombre: articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre,
      categoria: articuloSeleccionado.categoria,
      ubicacion: ubicacionActual.trim(),
      cantidad: 1,
      almacenId: articuloSeleccionado.almacenId || 'principal',
      tipoMantenimiento,
      estado: procesoSiguiente === 'Almacén' ? 'En Proceso' : 'Programado',
      frecuencia,
      fechaEnvio: fechaEntrada,
      fechaEntrada,
      fechaInicio,
      fechaProgramada: fechaInicio,
      fechaEstimadaTermino: fechaEstimadaTermino || undefined,
      fechaEstimadaRetorno: fechaEstimadaTermino || fechaInicio,
      responsableOProveedor: responsableMantenimiento.trim(),
      custodioArticulo: custodioArticulo.trim(),
      ubicacionActual: ubicacionActual.trim(),
      ubicacionMantenimiento: ubicacionMantenimiento.trim(),
      prioridad,
      procesoSiguiente,
      comprasReferenciaFolio: folioCompraGenerado,
      diagnosticoFalla: descripcionTrabajo.trim(),
      bloquearDisponibilidad: procesoSiguiente === 'Almacén',
      adjuntos,
      usuarioRegistro: usuarioActual,
    };

    enviarAMantenimiento(nuevoRegistro);
    localStorage.removeItem(STORAGE_KEY_BORRADOR_MNT);

    setResumenConfirmado({
      folio,
      articuloLabel: `${articuloSeleccionado.sku} — ${articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre}`,
      responsable: responsableMantenimiento.trim(),
      fechaInicio,
      proceso: procesoSiguiente,
      folioCompra: folioCompraGenerado,
    });
  };

  const resetearAsistente = () => {
    setResumenConfirmado(null);
    setCurrentStep(1);
    setCompletedSteps([]);
    setResponsableMantenimiento('');
    setDescripcionTrabajo('');
    setAdjuntos([]);
    setFechaEstimadaTermino('');
  };

  return (
    <div className="alta-articulo-container" style={{ paddingBottom: '6.5rem' }}>
      <style>{`
        @keyframes mntModalFadeScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes mntPulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45); }
          50% { box-shadow: 0 0 0 14px rgba(16, 185, 129, 0); }
        }
        @keyframes mntDrawCheck {
          from { stroke-dashoffset: 48; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes mntConfettiFall {
          0% { opacity: 0; transform: translateY(-12px) rotate(0deg); }
          20% { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(110px) rotate(220deg); }
        }
        .mnt-success-modal {
          animation: mntModalFadeScale 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mnt-check-circle {
          animation: mntPulseRing 1.8s ease-in-out infinite;
        }
        .mnt-check-path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: mntDrawCheck 0.45s 0.15s ease-out forwards;
        }
        .mnt-confetti-dot {
          animation: mntConfettiFall 1.8s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .mnt-success-modal,
          .mnt-check-circle,
          .mnt-check-path,
          .mnt-confetti-dot {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      {/* Cabecera */}
      <div className="alta-articulo-header">
        <div>
          <nav aria-label="Migas de pan" className="alta-articulo-breadcrumbs">
            <button
              type="button"
              onClick={() => router.push('/almacen')}
              className="alta-articulo-breadcrumb-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Almacén
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => router.push('/almacen/mantenimiento')}
              className="alta-articulo-breadcrumb-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Mantenimiento
            </button>
            <span>/</span>
            <span className="alta-articulo-breadcrumb-current">Programar mantenimiento</span>
          </nav>

          <h1 className="alta-articulo-title">Programar Mantenimiento de Artículo</h1>
          <p className="alta-articulo-subtitle">
            Asistente guiado para programar servicio preventivo, correctivo, predictivo o calibración.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/almacen/mantenimiento')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          <span>Volver a Mantenimiento</span>
        </button>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Stepper
          steps={PASOS_MANTENIMIENTO}
          currentStep={currentStep}
          completedSteps={completedSteps}
          isCurrentStepValid={validacionPaso.valido}
          onStepClick={(stepNum) => {
            if (stepNum > currentStep && !validacionPaso.valido) {
              handleIntentoInvalido();
              return;
            }
            setCurrentStep(stepNum);
          }}
        />
      </div>

      {/* PASO 1: RESPONSABLE Y TIPO */}
      {currentStep === 1 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">1</span>
              <h2 className="alta-articulo-card-title">Responsable y Tipo de Mantenimiento</h2>
            </div>
            <span className="alta-articulo-card-header-tag primary">Identificación</span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-field" ref={comboboxRef} style={{ position: 'relative' }}>
              <label className="alta-articulo-label">
                <span>
                  ARTÍCULO DEL CATÁLOGO <span className="alta-articulo-req">*</span>
                </span>
              </label>
              <input
                type="text"
                value={busquedaSku}
                onFocus={() => setComboboxAbierto(true)}
                onChange={(e) => {
                  setBusquedaSku(e.target.value);
                  setComboboxAbierto(true);
                }}
                placeholder="Buscar artículo por SKU o descripción..."
                className="alta-articulo-input"
              />
              {comboboxAbierto && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: 210,
                    overflowY: 'auto',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    zIndex: 40,
                    boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                  }}
                >
                  {articulosFiltrados.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setArticuloSku(a.sku);
                        setBusquedaSku(`${a.sku} - ${a.descripcionCorta || a.nombre}`);
                        setComboboxAbierto(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                      }}
                    >
                      <strong>{a.sku}</strong> — {a.descripcionCorta || a.nombre}{' '}
                      <span style={{ color: 'var(--text-muted)' }}>({a.categoria})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    TIPO DE MANTENIMIENTO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <select
                  value={tipoMantenimiento}
                  onChange={(e) => setTipoMantenimiento(e.target.value as TipoMantenimiento)}
                  className="alta-articulo-input"
                >
                  <option value="Preventivo">Preventivo</option>
                  <option value="Correctivo">Correctivo</option>
                  <option value="Predictivo">Predictivo</option>
                  <option value="Calibración">Calibración</option>
                </select>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    RESPONSABLE DEL MANTENIMIENTO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={responsableMantenimiento}
                  onChange={(e) => setResponsableMantenimiento(e.target.value)}
                  placeholder="Usuario interno o proveedor externo"
                  className="alta-articulo-input"
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    RESPONSABLE DEL ARTÍCULO / CUSTODIO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={custodioArticulo}
                  onChange={(e) => setCustodioArticulo(e.target.value)}
                  placeholder="Nombre del custodio"
                  className="alta-articulo-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: FECHAS Y UBICACIÓN */}
      {currentStep === 2 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">2</span>
              <h2 className="alta-articulo-card-title">Fechas y Ubicación</h2>
            </div>
            <span className="alta-articulo-card-header-tag primary">Programación</span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    FECHA DE ENTRADA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={fechaEntrada}
                  onChange={(e) => setFechaEntrada(e.target.value)}
                  className="alta-articulo-input"
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    FECHA DE INICIO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  min={fechaEntrada}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="alta-articulo-input"
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>FECHA ESTIMADA DE TÉRMINO (OPCIONAL)</span>
                </label>
                <input
                  type="date"
                  value={fechaEstimadaTermino}
                  min={fechaInicio}
                  onChange={(e) => setFechaEstimadaTermino(e.target.value)}
                  className="alta-articulo-input"
                />
              </div>
            </div>

            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>FRECUENCIA</span>
                </label>
                <select
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as FrecuenciaMantenimiento)}
                  className="alta-articulo-input"
                >
                  <option value="Única">Única</option>
                  <option value="Mensual">Recurrente · Mensual</option>
                  <option value="Trimestral">Recurrente · Trimestral</option>
                  <option value="Semestral">Recurrente · Semestral</option>
                  <option value="Anual">Recurrente · Anual</option>
                  <option value="Por horas / uso">Recurrente · Por horas / uso</option>
                </select>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    UBICACIÓN ACTUAL DEL ARTÍCULO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={ubicacionActual}
                  onChange={(e) => setUbicacionActual(e.target.value)}
                  placeholder="Ej. Almacén Principal - Nave A"
                  className="alta-articulo-input"
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    UBICACIÓN DEL MANTENIMIENTO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={ubicacionMantenimiento}
                  onChange={(e) => setUbicacionMantenimiento(e.target.value)}
                  placeholder="Taller interno o sede proveedor"
                  className="alta-articulo-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 3: DETALLE Y DOCUMENTOS */}
      {currentStep === 3 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">3</span>
              <h2 className="alta-articulo-card-title">Detalle y Documentos</h2>
            </div>
            <span className="alta-articulo-card-header-tag primary">Alcance Técnico</span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-field">
              <label className="alta-articulo-label">
                <span>
                  DESCRIPCIÓN DEL TRABAJO O FALLA <span className="alta-articulo-req">*</span>
                </span>
              </label>
              <textarea
                rows={4}
                value={descripcionTrabajo}
                onChange={(e) => setDescripcionTrabajo(e.target.value)}
                placeholder="Describe el alcance del mantenimiento, falla reportada o parámetros de calibración..."
                className="alta-articulo-input"
                style={{ minHeight: '96px', paddingTop: '0.65rem' }}
              />
            </div>

            <div className="alta-articulo-field">
              <label className="alta-articulo-label">
                <span>
                  PRIORIDAD <span className="alta-articulo-req">*</span>
                </span>
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as PrioridadMantenimiento)}
                className="alta-articulo-input"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>

            {/* Tarjeta de Adjuntos con Dropzone punteado */}
            <div
              style={{
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Adjuntos y Evidencias
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Opcional
                </span>
              </div>

              <div
                onClick={() => adjuntosInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingAdjuntos(true);
                }}
                onDragLeave={() => setIsDraggingAdjuntos(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingAdjuntos(false);
                  handleAdjuntarArchivos(e.dataTransfer.files);
                }}
                style={{
                  border: isDraggingAdjuntos
                    ? '2px dashed #3b82f6'
                    : '2px dashed rgba(96, 165, 250, 0.45)',
                  borderRadius: 12,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDraggingAdjuntos
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'rgba(59, 130, 246, 0.02)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <input
                  ref={adjuntosInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.xml"
                  onChange={(e) => handleAdjuntarArchivos(e.target.files)}
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                    add_photo_alternate
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Fotos, cotizaciones u órdenes de servicio
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    JPG, PNG, PDF, XML o arrastra aquí
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjuntosInputRef.current?.click();
                  }}
                  style={{
                    marginTop: 4,
                    padding: '7px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Seleccionar archivo
                </button>
              </div>

              {adjuntos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {adjuntos.map((adj) => (
                    <span
                      key={adj.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.76rem',
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#60a5fa' }}>
                        attach_file
                      </span>
                      <span>{adj.nombre}</span>
                      <button
                        type="button"
                        onClick={() => setAdjuntos((prev) => prev.filter((item) => item.id !== adj.id))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                        }}
                        title="Quitar archivo"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PASO 4: PROCESO SIGUIENTE Y RESUMEN */}
      {currentStep === 4 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">4</span>
              <h2 className="alta-articulo-card-title">Proceso Siguiente y Confirmación</h2>
            </div>
            <span className="alta-articulo-card-header-tag primary">Flujo Operativo</span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-grid-2">
              <button
                type="button"
                onClick={() => setProcesoSiguiente('Compras')}
                style={{
                  textAlign: 'left',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  border:
                    procesoSiguiente === 'Compras'
                      ? '2px solid #3b82f6'
                      : '1px solid var(--border)',
                  background:
                    procesoSiguiente === 'Compras'
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: '#3b82f6' }}
                  >
                    shopping_cart
                  </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Compras
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Genera una solicitud/orden de compra (refacciones o servicio externo) enlazada al artículo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProcesoSiguiente('Almacén')}
                style={{
                  textAlign: 'left',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  border:
                    procesoSiguiente === 'Almacén'
                      ? '2px solid #8b5cf6'
                      : '1px solid var(--border)',
                  background:
                    procesoSiguiente === 'Almacén'
                      ? 'rgba(139, 92, 246, 0.12)'
                      : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: '#a78bfa' }}
                  >
                    inventory_2
                  </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Almacén
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Genera el movimiento de almacén (salida a mantenimiento / traslado) y marca el artículo como &quot;En mantenimiento / No disponible&quot; para bloquear vales y préstamos.
                </p>
              </button>
            </div>

            {/* Resumen final */}
            <div
              style={{
                marginTop: 8,
                padding: '1.15rem',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800 }}>
                Resumen antes de confirmar
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 10,
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Artículo: </span>
                  <strong>{articuloSeleccionado?.sku}</strong> ·{' '}
                  {articuloSeleccionado?.descripcionCorta || articuloSeleccionado?.nombre}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Tipo / Frecuencia: </span>
                  <strong>{tipoMantenimiento}</strong> ({frecuencia})
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Responsable Mnt.: </span>
                  <strong>{responsableMantenimiento}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Custodio: </span>
                  <strong>{custodioArticulo}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Entrada / Inicio: </span>
                  <strong>
                    {fechaEntrada} → {fechaInicio}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Término estimado: </span>
                  <strong>{fechaEstimadaTermino || 'No especificado'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Traslado: </span>
                  <strong>
                    {ubicacionActual} → {ubicacionMantenimiento}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Prioridad: </span>
                  <strong>{prioridad}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Proceso elegido: </span>
                  <strong style={{ color: procesoSiguiente === 'Compras' ? '#60a5fa' : '#a78bfa' }}>
                    {procesoSiguiente}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer reutilizable */}
      <FormWizardFooter
        currentStep={currentStep}
        totalSteps={4}
        isValid={validacionPaso.valido}
        missingFields={validacionPaso.camposFaltantes}
        onContinue={currentStep < 4 ? handleContinuar : handleConfirmarProgramacion}
        onPrevious={handleAtras}
        onSaveDraft={handleGuardarBorrador}
        isSavingDraft={guardandoBorrador}
        onCancel={() => router.push('/almacen/mantenimiento')}
        continueText="Siguiente"
        finalText="Confirmar"
        continueIcon="arrow_forward"
        finalIcon="check_circle"
        onInvalidClick={handleIntentoInvalido}
        helperText="Completa los campos obligatorios (*) para continuar"
        cancelText="Cancelar"
        showCancel={true}
        isLastStep={currentStep === 4}
      />

      {/* MODAL DE COMPLETADO ANIMADO (SOLO AL FINAL) */}
      {resumenConfirmado && (
        <div
          role="dialog"
          aria-modal="true"
          className="alta-articulo-modal-backdrop"
        >
          <div
            className="alta-articulo-modal-card mnt-success-modal"
            style={{
              maxWidth: '32rem',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Partículas suaves */}
            {PARTICULAS_CONFETI.map((p, idx) => (
              <span
                key={idx}
                className="mnt-confetti-dot"
                style={{
                  position: 'absolute',
                  top: 12,
                  left: p.left,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  animationDelay: p.delay,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Palomita animada dentro de círculo con pulso */}
            <div
              className="mnt-check-circle"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path
                  d="M9 18.5L15 24.5L27 12"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mnt-check-path"
                />
              </svg>
            </div>

            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.3rem', fontWeight: 800 }}>
              Mantenimiento programado
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Folio generado: <strong style={{ color: '#a78bfa' }}>{resumenConfirmado.folio}</strong>
              {resumenConfirmado.folioCompra && (
                <> · Orden de Compra: <strong style={{ color: '#60a5fa' }}>{resumenConfirmado.folioCompra}</strong></>
              )}
            </p>

            <div
              style={{
                textAlign: 'left',
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Artículo: </span>
                <strong>{resumenConfirmado.articuloLabel}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Responsable: </span>
                <strong>{resumenConfirmado.responsable}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fecha de inicio: </span>
                <strong>{resumenConfirmado.fechaInicio}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Proceso elegido: </span>
                <strong>{resumenConfirmado.proceso}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => router.push('/almacen/mantenimiento')}
                style={{
                  padding: '9px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ver mantenimiento
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    resumenConfirmado.proceso === 'Compras' ? '/compras/ordenes' : '/almacen'
                  )
                }
                style={{
                  padding: '9px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {resumenConfirmado.proceso === 'Compras' ? 'Ir a Compras' : 'Ir a Almacén'}
              </button>
              <button
                type="button"
                onClick={resetearAsistente}
                style={{
                  padding: '9px 14px',
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Programar otro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
