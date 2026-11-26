'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAlmacen } from '../context/AlmacenContext';
import type {
  AdjuntoMantenimiento,
  EstatusSemaforoMantenimiento,
  FrecuenciaMantenimiento,
  MantenimientoArticulo,
  TipoMantenimiento,
} from '../types';
import '../almacen.css';

interface MantenimientoArticulosPageProps {
  puedeGestionar?: boolean;
  usuarioActual?: string;
}

const FRECUENCIAS: FrecuenciaMantenimiento[] = [
  'Única',
  'Mensual',
  'Trimestral',
  'Semestral',
  'Anual',
  'Por horas / uso',
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function calcularEstatusSemaforo(
  m: MantenimientoArticulo,
  hoyStr: string,
  limite30Str: string
): EstatusSemaforoMantenimiento {
  if (m.estado === 'Baja Definitiva / Irreparable') return 'Baja';
  if (m.estado === 'Completado / Listo para Reingreso') return 'Al día';
  const fechaObjetivo = m.fechaProgramada || m.fechaEstimadaRetorno;
  if (m.estado === 'En Proceso' || m.estado === 'Pendiente / En Diagnóstico') {
    if (fechaObjetivo && fechaObjetivo < hoyStr) return 'Vencido';
    return 'En servicio';
  }
  if (fechaObjetivo && fechaObjetivo < hoyStr) return 'Vencido';
  if (fechaObjetivo && fechaObjetivo <= limite30Str) return 'Por vencer';
  return 'Al día';
}

function obtenerChipSemaforo(estatus: EstatusSemaforoMantenimiento) {
  switch (estatus) {
    case 'Al día':
      return {
        bg: 'rgba(16, 185, 129, 0.14)',
        color: '#10b981',
        border: 'rgba(16, 185, 129, 0.35)',
        icon: 'check_circle',
      };
    case 'Por vencer':
      return {
        bg: 'rgba(245, 158, 11, 0.14)',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.35)',
        icon: 'schedule',
      };
    case 'Vencido':
      return {
        bg: 'rgba(239, 68, 68, 0.14)',
        color: '#ef4444',
        border: 'rgba(239, 68, 68, 0.35)',
        icon: 'error',
      };
    case 'En servicio':
      return {
        bg: 'rgba(139, 92, 246, 0.15)',
        color: '#a78bfa',
        border: 'rgba(139, 92, 246, 0.38)',
        icon: 'build',
      };
    default:
      return {
        bg: 'rgba(100, 116, 139, 0.15)',
        color: '#94a3b8',
        border: 'rgba(100, 116, 139, 0.35)',
        icon: 'block',
      };
  }
}

export default function MantenimientoArticulosPage({
  puedeGestionar = true,
  usuarioActual = 'Ing. Mateo Gómez',
}: MantenimientoArticulosPageProps) {
  const router = useRouter();
  const {
    mantenimientos,
    bitacoraMantenimiento,
    articulosActivos,
    articulos,
    enviarAMantenimiento,
    completarMantenimientoReingreso,
    reprogramarMantenimiento,
    darDeBajaMantenimiento,
    mostrarToast,
  } = useAlmacen();

  // Vista: Tabla o Calendario
  const [vista, setVista] = useState<'tabla' | 'calendario'>('tabla');
  const [mesCalendario, setMesCalendario] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroSemaforo, setFiltroSemaforo] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todas');
  const [filtroResponsable, setFiltroResponsable] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Modales
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalEjecucionOpen, setModalEjecucionOpen] = useState(false);
  const [modalReprogramarOpen, setModalReprogramarOpen] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<MantenimientoArticulo | null>(null);

  // Formulario Programar / Registrar Mantenimiento
  const [nuevoArticuloSku, setNuevoArticuloSku] = useState(articulosActivos[0]?.sku || '');
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [nuevoTipo, setNuevoTipo] = useState<TipoMantenimiento>('Preventivo');
  const [modoRegistro, setModoRegistro] = useState<'programar' | 'iniciar'>('programar');
  const [nuevaFechaProgramada, setNuevaFechaProgramada] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [nuevaFrecuencia, setNuevaFrecuencia] = useState<FrecuenciaMantenimiento>('Trimestral');
  const [nuevoResponsable, setNuevoResponsable] = useState('');
  const [nuevoCostoEstimado, setNuevoCostoEstimado] = useState<string>('');
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState('');
  const [bloquearSalidaCorrectivo, setBloquearSalidaCorrectivo] = useState(true);
  const [nuevosAdjuntos, setNuevosAdjuntos] = useState<AdjuntoMantenimiento[]>([]);

  // Formulario Registrar Ejecución
  const [ejecFechaReal, setEjecFechaReal] = useState(() => new Date().toISOString().slice(0, 10));
  const [ejecTrabajo, setEjecTrabajo] = useState('');
  const [ejecRefacciones, setEjecRefacciones] = useState('');
  const [ejecCostoFinal, setEjecCostoFinal] = useState<string>('0');
  const [ejecObservaciones, setEjecObservaciones] = useState('');
  const [ejecEstatusResultante, setEjecEstatusResultante] = useState<
    'Al día' | 'Requiere seguimiento' | 'Baja Definitiva'
  >('Al día');
  const [ejecAdjuntos, setEjecAdjuntos] = useState<AdjuntoMantenimiento[]>([]);

  // Formulario Reprogramar / Baja
  const [reprogramarFecha, setReprogramarFecha] = useState('');
  const [bajaMotivo, setBajaMotivo] = useState('');

  // Buscador de artículo en modal Programar
  const [busquedaArticuloTexto, setBusquedaArticuloTexto] = useState('');
  const [comboboxAbierto, setComboboxAbierto] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const articuloSeleccionado = useMemo(() => {
    return articulos.find((a) => a.sku.toLowerCase() === nuevoArticuloSku.toLowerCase());
  }, [articulos, nuevoArticuloSku]);

  useEffect(() => {
    if (modalNuevoOpen && articuloSeleccionado) {
      setBusquedaArticuloTexto(
        `${articuloSeleccionado.sku} - ${articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre}`
      );
    }
  }, [modalNuevoOpen, articuloSeleccionado]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setComboboxAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const articulosFiltradosBusqueda = useMemo(() => {
    const q = busquedaArticuloTexto.toLowerCase().trim();
    if (!q) return articulosActivos;
    return articulosActivos.filter((a) => {
      return (
        a.sku.toLowerCase().includes(q) ||
        (a.nombre || '').toLowerCase().includes(q) ||
        (a.descripcionCorta || a.descripcion || '').toLowerCase().includes(q) ||
        (a.categoria || '').toLowerCase().includes(q)
      );
    });
  }, [articulosActivos, busquedaArticuloTexto]);

  // Fechas de referencia reales
  const { hoyStr, limite30Str, mesActualPrefix } = useMemo(() => {
    const hoy = new Date();
    const hoyIso = hoy.toISOString().slice(0, 10);
    const l30 = new Date(hoy);
    l30.setDate(l30.getDate() + 30);
    return {
      hoyStr: hoyIso,
      limite30Str: l30.toISOString().slice(0, 10),
      mesActualPrefix: hoyIso.slice(0, 7),
    };
  }, []);

  // Enriquecer cada registro con datos del catálogo + semáforo
  const registrosEnriquecidos = useMemo(() => {
    return mantenimientos.map((m) => {
      const art = articulos.find(
        (a) => a.id === m.articuloId || a.sku.toLowerCase() === m.articuloSku.toLowerCase()
      );
      const categoria = m.categoria || art?.categoria || 'General';
      const ubicacion = m.ubicacion || art?.ubicacionNave || art?.almacenId || 'Almacén Principal';
      const semaforo = calcularEstatusSemaforo(m, hoyStr, limite30Str);
      const proximaFecha = m.fechaProgramada || m.fechaEstimadaRetorno;
      return {
        ...m,
        categoria,
        ubicacion,
        proximaFecha,
        semaforo,
        articulo: art,
      };
    });
  }, [mantenimientos, articulos, hoyStr, limite30Str]);

  // Opciones dinámicas de filtros
  const opcionesFiltros = useMemo(() => {
    const cats = Array.from(new Set(registrosEnriquecidos.map((r) => r.categoria))).sort();
    const ubis = Array.from(new Set(registrosEnriquecidos.map((r) => r.ubicacion))).sort();
    const resps = Array.from(
      new Set(registrosEnriquecidos.map((r) => r.responsableOProveedor).filter(Boolean))
    ).sort();
    return { cats, ubis, resps };
  }, [registrosEnriquecidos]);

  // KPIs requeridos
  const kpis = useMemo(() => {
    const enMantenimiento = registrosEnriquecidos.filter((r) => r.semaforo === 'En servicio').length;
    const programados30Dias = registrosEnriquecidos.filter(
      (r) =>
        r.estado === 'Programado' &&
        r.proximaFecha >= hoyStr &&
        r.proximaFecha <= limite30Str
    ).length;
    const vencidos = registrosEnriquecidos.filter((r) => r.semaforo === 'Vencido').length;
    const porVencer = registrosEnriquecidos.filter((r) => r.semaforo === 'Por vencer').length;
    const completadosMes = registrosEnriquecidos.filter(
      (r) =>
        r.estado === 'Completado / Listo para Reingreso' &&
        (r.fechaRetornoReal || '').startsWith(mesActualPrefix)
    ).length;

    return {
      enMantenimiento,
      programados30Dias,
      vencidos,
      porVencer,
      completadosMes,
    };
  }, [registrosEnriquecidos, hoyStr, limite30Str, mesActualPrefix]);

  // Filtrado
  const registrosFiltrados = useMemo(() => {
    return registrosEnriquecidos.filter((r) => {
      if (filtroSemaforo !== 'todos' && r.semaforo !== filtroSemaforo) return false;
      if (filtroTipo !== 'todos' && r.tipoMantenimiento !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && r.categoria !== filtroCategoria) return false;
      if (filtroUbicacion !== 'todas' && r.ubicacion !== filtroUbicacion) return false;
      if (filtroResponsable !== 'todos' && r.responsableOProveedor !== filtroResponsable) {
        return false;
      }
      if (fechaDesde && r.proximaFecha < fechaDesde) return false;
      if (fechaHasta && r.proximaFecha > fechaHasta) return false;

      const q = busqueda.toLowerCase().trim();
      if (q) {
        const match =
          r.folio.toLowerCase().includes(q) ||
          r.articuloSku.toLowerCase().includes(q) ||
          r.articuloNombre.toLowerCase().includes(q) ||
          r.categoria.toLowerCase().includes(q) ||
          r.ubicacion.toLowerCase().includes(q) ||
          r.responsableOProveedor.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    registrosEnriquecidos,
    filtroSemaforo,
    filtroTipo,
    filtroCategoria,
    filtroUbicacion,
    filtroResponsable,
    fechaDesde,
    fechaHasta,
    busqueda,
  ]);

  // Datos del artículo seleccionado para Detalle (historial, próximos, adjuntos, costos)
  const detalleArticulo = useMemo(() => {
    if (!itemSeleccionado) return null;
    const skuLower = itemSeleccionado.articuloSku.toLowerCase();
    const art = articulos.find((a) => a.sku.toLowerCase() === skuLower);
    const serviciosArticulo = registrosEnriquecidos.filter(
      (r) => r.articuloSku.toLowerCase() === skuLower
    );
    const proximos = serviciosArticulo.filter(
      (r) =>
        r.estado === 'Programado' ||
        r.estado === 'En Proceso' ||
        r.estado === 'Pendiente / En Diagnóstico'
    );
    const bitacora = bitacoraMantenimiento
      .filter((b) => b.articuloSku.toLowerCase() === skuLower)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const adjuntos = serviciosArticulo.flatMap((s) => s.adjuntos || []);
    const costoAcumulado = serviciosArticulo.reduce(
      (sum, s) => sum + (s.costoMantenimiento ?? s.costoEstimado ?? 0),
      0
    );

    return {
      art,
      serviciosArticulo,
      proximos,
      bitacora,
      adjuntos,
      costoAcumulado,
    };
  }, [itemSeleccionado, articulos, registrosEnriquecidos, bitacoraMantenimiento]);

  // Celdas del calendario mensual
  const calendarioCeldas = useMemo(() => {
    const { year, month } = mesCalendario;
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const offsetInicio = (primerDia.getDay() + 6) % 7; // Lunes = 0
    const totalDias = ultimoDia.getDate();

    const celdas: Array<{
      fechaStr: string | null;
      diaNum: number | null;
      items: typeof registrosFiltrados;
    }> = [];

    for (let i = 0; i < offsetInicio; i++) {
      celdas.push({ fechaStr: null, diaNum: null, items: [] });
    }
    for (let d = 1; d <= totalDias; d++) {
      const f = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = registrosFiltrados.filter((r) => r.proximaFecha === f);
      celdas.push({ fechaStr: f, diaNum: d, items });
    }
    return celdas;
  }, [mesCalendario, registrosFiltrados]);

  const nombreMesCalendario = useMemo(() => {
    return new Date(mesCalendario.year, mesCalendario.month, 1).toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
  }, [mesCalendario]);

  // Adjuntos helper
  const handleAgregarAdjuntos = (
    files: FileList | null,
    tipoDoc: AdjuntoMantenimiento['tipo'],
    setter: React.Dispatch<React.SetStateAction<AdjuntoMantenimiento[]>>
  ) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const nuevo: AdjuntoMantenimiento = {
          id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nombre: file.name,
          tipo: tipoDoc,
          tamano: file.size,
          fecha: new Date().toISOString().slice(0, 10),
          url: typeof reader.result === 'string' ? reader.result : undefined,
        };
        setter((prev) => [...prev, nuevo]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit Programar / Iniciar
  const handleConfirmarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar) return;
    if (!articuloSeleccionado) {
      mostrarToast('Selecciona un artículo válido del catálogo.', 'error');
      return;
    }
    if (modoRegistro === 'iniciar' && nuevaCantidad > articuloSeleccionado.stockDisponible) {
      mostrarToast(
        `Stock insuficiente: Solo hay ${articuloSeleccionado.stockDisponible} unidades disponibles de ${articuloSeleccionado.sku}.`,
        'error'
      );
      return;
    }
    if (!nuevoResponsable.trim()) {
      mostrarToast('Indica el responsable interno o proveedor externo.', 'error');
      return;
    }
    if (!nuevaFechaProgramada) {
      mostrarToast('Indica la fecha programada del servicio.', 'error');
      return;
    }
    if (!nuevoDiagnostico.trim()) {
      mostrarToast('Describe la falla o trabajo a realizar.', 'error');
      return;
    }

    const folio = `MNT-2026-${String(mantenimientos.length + 1).padStart(4, '0')}`;
    const bloquear = nuevoTipo === 'Correctivo' && bloquearSalidaCorrectivo;

    const nuevoMantenimiento: MantenimientoArticulo = {
      id: `mnt-${Date.now()}`,
      folio,
      articuloId: articuloSeleccionado.id,
      articuloSku: articuloSeleccionado.sku,
      articuloNombre: articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre,
      categoria: articuloSeleccionado.categoria,
      ubicacion: articuloSeleccionado.ubicacionNave || articuloSeleccionado.ubicacionSugerida || 'Almacén Principal',
      cantidad: nuevaCantidad,
      almacenId: articuloSeleccionado.almacenId || 'principal',
      tipoMantenimiento: nuevoTipo,
      estado: modoRegistro === 'programar' ? 'Programado' : 'En Proceso',
      frecuencia: nuevaFrecuencia,
      fechaEnvio: new Date().toISOString().slice(0, 10),
      fechaProgramada: nuevaFechaProgramada,
      fechaEstimadaRetorno: nuevaFechaProgramada,
      responsableOProveedor: nuevoResponsable.trim(),
      costoEstimado: nuevoCostoEstimado !== '' ? Number(nuevoCostoEstimado) : undefined,
      costoMantenimiento: nuevoCostoEstimado !== '' ? Number(nuevoCostoEstimado) : undefined,
      diagnosticoFalla: nuevoDiagnostico.trim(),
      bloquearDisponibilidad: bloquear,
      adjuntos: nuevosAdjuntos,
      usuarioRegistro: usuarioActual,
    };

    enviarAMantenimiento(nuevoMantenimiento);
    setModalNuevoOpen(false);
    setNuevaCantidad(1);
    setNuevoResponsable('');
    setNuevoCostoEstimado('');
    setNuevoDiagnostico('');
    setNuevosAdjuntos([]);
  };

  // Submit Registrar Ejecución
  const handleConfirmarEjecucion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar || !itemSeleccionado) return;
    if (!ejecTrabajo.trim()) {
      mostrarToast('Describe el trabajo realizado.', 'error');
      return;
    }

    completarMantenimientoReingreso(
      itemSeleccionado.id,
      ejecFechaReal,
      Number(ejecCostoFinal) || 0,
      ejecObservaciones.trim() || ejecTrabajo.trim(),
      usuarioActual,
      {
        trabajoRealizado: ejecTrabajo.trim(),
        refaccionesUsadas: ejecRefacciones.trim(),
        estatusResultante: ejecEstatusResultante,
        adjuntos: ejecAdjuntos,
      }
    );

    setModalEjecucionOpen(false);
    setItemSeleccionado(null);
    setEjecTrabajo('');
    setEjecRefacciones('');
    setEjecCostoFinal('0');
    setEjecObservaciones('');
    setEjecAdjuntos([]);
  };

  // Submit Reprogramar
  const handleConfirmarReprogramar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar || !itemSeleccionado || !reprogramarFecha) return;
    reprogramarMantenimiento(itemSeleccionado.id, reprogramarFecha, usuarioActual);
    setModalReprogramarOpen(false);
    setItemSeleccionado(null);
  };

  // Submit Baja
  const handleConfirmarBaja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar || !itemSeleccionado) return;
    if (!bajaMotivo.trim()) {
      mostrarToast('El motivo de baja es obligatorio para la bitácora.', 'error');
      return;
    }
    darDeBajaMantenimiento(itemSeleccionado.id, bajaMotivo.trim(), usuarioActual);
    setModalBajaOpen(false);
    setItemSeleccionado(null);
    setBajaMotivo('');
  };

  const filtrosActivos =
    busqueda ||
    filtroSemaforo !== 'todos' ||
    filtroTipo !== 'todos' ||
    filtroCategoria !== 'todas' ||
    filtroUbicacion !== 'todas' ||
    filtroResponsable !== 'todos' ||
    fechaDesde ||
    fechaHasta;

  return (
    <div
      className="almacen-module-container"
      style={{ minHeight: '100vh', background: 'var(--app-bg)', color: 'var(--text-primary)' }}
    >
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Cabecera */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            padding: '20px 24px',
            background: 'var(--card)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                build
              </span>
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Mantenimiento de Artículos
                </h1>
                {!puedeGestionar && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: 'rgba(100, 116, 139, 0.16)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Solo Consulta
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Programación preventiva, atención correctiva, bitácora cronológica y control de disponibilidad.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => router.push('/almacen/articulos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_back
              </span>
              <span>Artículos</span>
            </button>

            <div
              style={{
                display: 'inline-flex',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: 3,
              }}
            >
              <button
                type="button"
                onClick={() => setVista('tabla')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: 'none',
                  background: vista === 'tabla' ? '#7c3aed' : 'transparent',
                  color: vista === 'tabla' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  table_rows
                </span>
                <span>Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setVista('calendario')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: 'none',
                  background: vista === 'calendario' ? '#7c3aed' : 'transparent',
                  color: vista === 'calendario' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  calendar_month
                </span>
                <span>Calendario</span>
              </button>
            </div>

            {puedeGestionar && (
              <button
                type="button"
                onClick={() => router.push('/almacen/mantenimiento/programar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  event_available
                </span>
                <span>Programar mantenimiento</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPIs Superiores */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 16,
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setFiltroSemaforo((prev) => (prev === 'En servicio' ? 'todos' : 'En servicio'))
            }
            style={{
              textAlign: 'left',
              padding: 18,
              background: 'var(--card)',
              borderRadius: 14,
              border:
                filtroSemaforo === 'En servicio'
                  ? '1.5px solid #8b5cf6'
                  : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                EN MANTENIMIENTO
              </span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'rgba(139, 92, 246, 0.16)',
                  color: '#a78bfa',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  construction
                </span>
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
              {kpis.enMantenimiento}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 700 }}>
              Artículos actualmente en servicio
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroSemaforo((prev) => (prev === 'Por vencer' ? 'todos' : 'Por vencer'))
            }
            style={{
              textAlign: 'left',
              padding: 18,
              background: 'var(--card)',
              borderRadius: 14,
              border:
                filtroSemaforo === 'Por vencer'
                  ? '1.5px solid #f59e0b'
                  : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                PROGRAMADOS PRÓX. 30 DÍAS
              </span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.16)',
                  color: '#f59e0b',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  event_upcoming
                </span>
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
              {kpis.programados30Dias}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
              Servicios próximos por atender
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroSemaforo((prev) => (prev === 'Vencido' ? 'todos' : 'Vencido'))
            }
            style={{
              textAlign: 'left',
              padding: 18,
              background: 'var(--card)',
              borderRadius: 14,
              border:
                filtroSemaforo === 'Vencido'
                  ? '1.5px solid #ef4444'
                  : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                VENCIDOS
              </span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.16)',
                  color: '#ef4444',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  warning
                </span>
              </span>
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                margin: '8px 0 2px',
                color: kpis.vencidos > 0 ? '#ef4444' : 'var(--text-primary)',
              }}
            >
              {kpis.vencidos}
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                color: kpis.vencidos > 0 ? '#ef4444' : '#10b981',
                fontWeight: 700,
              }}
            >
              {kpis.vencidos > 0 ? 'Requieren atención inmediata' : 'Sin atrasos pendientes'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroSemaforo((prev) => (prev === 'Al día' ? 'todos' : 'Al día'))}
            style={{
              textAlign: 'left',
              padding: 18,
              background: 'var(--card)',
              borderRadius: 14,
              border:
                filtroSemaforo === 'Al día'
                  ? '1.5px solid #10b981'
                  : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                COMPLETADOS ESTE MES
              </span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#10b981',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  verified
                </span>
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
              {kpis.completadosMes}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
              Servicios ejecutados en el mes
            </span>
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            padding: 16,
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div style={{ gridColumn: 'span 2', minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              BUSCAR ARTÍCULO / FOLIO
            </label>
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: 19,
                }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Código, nombre, folio, responsable..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 34px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              ESTATUS
            </label>
            <select
              value={filtroSemaforo}
              onChange={(e) => setFiltroSemaforo(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <option value="todos">Todos los estatus</option>
              <option value="Al día">Al día</option>
              <option value="Por vencer">Por vencer</option>
              <option value="Vencido">Vencido</option>
              <option value="En servicio">En servicio</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              TIPO
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <option value="todos">Todos los tipos</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Calibración / Revisión">Calibración / Revisión</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              CATEGORÍA
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <option value="todas">Todas</option>
              {opcionesFiltros.cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              UBICACIÓN
            </label>
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <option value="todas">Todas</option>
              {opcionesFiltros.ubis.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              RESPONSABLE / PROVEEDOR
            </label>
            <select
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
            >
              <option value="todos">Todos</option>
              {opcionesFiltros.resps.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              PRÓX. FECHA DESDE
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              PRÓX. FECHA HASTA
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
              }}
            />
          </div>

          {filtrosActivos && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroSemaforo('todos');
                  setFiltroTipo('todos');
                  setFiltroCategoria('todas');
                  setFiltroUbicacion('todas');
                  setFiltroResponsable('todos');
                  setFechaDesde('');
                  setFechaHasta('');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* VISTA 1: TABLA DE ARTÍCULOS Y MANTENIMIENTOS */}
        {vista === 'tabla' ? (
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              overflowX: 'auto',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {registrosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 44, opacity: 0.5 }}>
                  build
                </span>
                <p style={{ margin: '12px 0 0', fontSize: '0.95rem', fontWeight: 600 }}>
                  No se encontraron registros de mantenimiento con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', minWidth: 980 }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--surface-alt)',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Código</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Artículo</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Categoría</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Ubicación</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Tipo</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Última fecha</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Próxima fecha</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Responsable / Proveedor</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Estatus</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((r) => {
                    const chip = obtenerChipSemaforo(r.semaforo);
                    const esPendienteEjecucion =
                      r.estado === 'Programado' ||
                      r.estado === 'En Proceso' ||
                      r.estado === 'Pendiente / En Diagnóstico';
                    return (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#a78bfa' }}>
                          <div>{r.articuloSku}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.folio}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          <div>{r.articuloNombre}</div>
                          {r.bloquearDisponibilidad && esPendienteEjecucion && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginTop: 4,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 7px',
                                borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.14)',
                                color: '#f87171',
                              }}
                            >
                              Bloqueado en salidas/préstamos
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{r.categoria}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{r.ubicacion}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 9px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                r.tipoMantenimiento === 'Correctivo'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(59, 130, 246, 0.12)',
                              color: r.tipoMantenimiento === 'Correctivo' ? '#f87171' : '#60a5fa',
                            }}
                          >
                            {r.tipoMantenimiento}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {r.fechaRetornoReal || r.ultimaFecha || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.proximaFecha}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {r.responsableOProveedor}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: chip.bg,
                              color: chip.color,
                              border: `1px solid ${chip.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                              {chip.icon}
                            </span>
                            {r.semaforo}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setItemSeleccionado(r);
                                setModalDetalleOpen(true);
                              }}
                              title="Ver ficha, bitácora y costos del artículo"
                              style={{
                                padding: '5px 10px',
                                borderRadius: 7,
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text-primary)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Detalle
                            </button>

                            {puedeGestionar && esPendienteEjecucion && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemSeleccionado(r);
                                    setEjecCostoFinal(String(r.costoEstimado ?? r.costoMantenimiento ?? 0));
                                    setEjecFechaReal(new Date().toISOString().slice(0, 10));
                                    setModalEjecucionOpen(true);
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 7,
                                    border: 'none',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Registrar ejecución
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemSeleccionado(r);
                                    setReprogramarFecha(r.proximaFecha);
                                    setModalReprogramarOpen(true);
                                  }}
                                  title="Reprogramar fecha"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: 7,
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                                    edit_calendar
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemSeleccionado(r);
                                    setModalBajaOpen(true);
                                  }}
                                  title="Dar de baja irreparable"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: 7,
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                                    delete_forever
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* VISTA 2: CALENDARIO MENSUAL */
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'capitalize' }}>
                {nombreMesCalendario}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    setMesCalendario((prev) =>
                      prev.month === 0
                        ? { year: prev.year - 1, month: 11 }
                        : { year: prev.year, month: prev.month - 1 }
                    )
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    setMesCalendario({ year: d.getFullYear(), month: d.getMonth() });
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMesCalendario((prev) =>
                      prev.month === 11
                        ? { year: prev.year + 1, month: 0 }
                        : { year: prev.year, month: prev.month + 1 }
                    )
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Siguiente →
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia}
                  style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    padding: '6px 0',
                  }}
                >
                  {dia}
                </div>
              ))}

              {calendarioCeldas.map((celda, idx) => (
                <div
                  key={celda.fechaStr || `empty-${idx}`}
                  style={{
                    minHeight: 105,
                    borderRadius: 10,
                    padding: 8,
                    border:
                      celda.fechaStr === hoyStr
                        ? '1.5px solid #8b5cf6'
                        : '1px solid var(--border)',
                    background: celda.fechaStr ? 'var(--surface)' : 'transparent',
                    opacity: celda.fechaStr ? 1 : 0.3,
                  }}
                >
                  {celda.diaNum && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        marginBottom: 6,
                        color: celda.fechaStr === hoyStr ? '#a78bfa' : 'var(--text-secondary)',
                      }}
                    >
                      {celda.diaNum}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {celda.items.map((item) => {
                      const chip = obtenerChipSemaforo(item.semaforo);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setItemSeleccionado(item);
                            setModalDetalleOpen(true);
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: `1px solid ${chip.border}`,
                            background: chip.bg,
                            color: chip.color,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={`${item.folio} · ${item.articuloSku} · ${item.articuloNombre}`}
                        >
                          {item.articuloSku} · {item.tipoMantenimiento}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: PROGRAMAR / REGISTRAR MANTENIMIENTO */}
      {modalNuevoOpen && puedeGestionar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <form
            onSubmit={handleConfirmarEnvio}
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Programar / Registrar Mantenimiento
              </h2>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Buscador de artículo en catálogo */}
            <div ref={comboboxRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Artículo del Catálogo *
              </label>
              <input
                type="text"
                value={busquedaArticuloTexto}
                onFocus={() => setComboboxAbierto(true)}
                onChange={(e) => {
                  setBusquedaArticuloTexto(e.target.value);
                  setComboboxAbierto(true);
                }}
                placeholder="Buscar por SKU, nombre o categoría..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                }}
              />
              {comboboxAbierto && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    zIndex: 50,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                  }}
                >
                  {articulosFiltradosBusqueda.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setNuevoArticuloSku(a.sku);
                        setBusquedaArticuloTexto(`${a.sku} - ${a.descripcionCorta || a.nombre}`);
                        setComboboxAbierto(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.83rem',
                      }}
                    >
                      <strong>{a.sku}</strong> — {a.descripcionCorta || a.nombre}{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        ({a.categoria} · Disp: {a.stockDisponible})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Modalidad
                </label>
                <select
                  value={modoRegistro}
                  onChange={(e) => setModoRegistro(e.target.value as 'programar' | 'iniciar')}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="programar">Programar a futuro</option>
                  <option value="iniciar">Enviar a servicio ahora</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Tipo *
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as TipoMantenimiento)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Preventivo">Preventivo</option>
                  <option value="Correctivo">Correctivo</option>
                  <option value="Calibración / Revisión">Calibración / Revisión</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Fecha programada *
                </label>
                <input
                  type="date"
                  value={nuevaFechaProgramada}
                  onChange={(e) => setNuevaFechaProgramada(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Frecuencia
                </label>
                <select
                  value={nuevaFrecuencia}
                  onChange={(e) => setNuevaFrecuencia(e.target.value as FrecuenciaMantenimiento)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {FRECUENCIAS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  value={nuevaCantidad}
                  onChange={(e) => setNuevaCantidad(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Costo estimado (MXN)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={nuevoCostoEstimado}
                  onChange={(e) => setNuevoCostoEstimado(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Responsable o Proveedor *
              </label>
              <input
                type="text"
                value={nuevoResponsable}
                onChange={(e) => setNuevoResponsable(e.target.value)}
                placeholder="Ej. Taller Interno SIFYGSA / Laboratorio EMA"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Descripción de la falla o trabajo *
              </label>
              <textarea
                rows={3}
                value={nuevoDiagnostico}
                onChange={(e) => setNuevoDiagnostico(e.target.value)}
                placeholder="Describe las actividades preventivas, diagnóstico o falla reportada..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {nuevoTipo === 'Correctivo' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  cursor: 'pointer',
                  fontSize: '0.83rem',
                  fontWeight: 700,
                  color: '#fca5a5',
                }}
              >
                <input
                  type="checkbox"
                  checked={bloquearSalidaCorrectivo}
                  onChange={(e) => setBloquearSalidaCorrectivo(e.target.checked)}
                />
                <span>
                  Marcar artículo como &quot;No disponible&quot; mientras esté en mantenimiento (bloquea vales de salida y préstamos)
                </span>
              </label>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Adjuntos (Fotos, Órdenes de Servicio, Facturas)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.xml"
                onChange={(e) => handleAgregarAdjuntos(e.target.files, 'Orden de Servicio', setNuevosAdjuntos)}
                style={{ fontSize: '0.82rem' }}
              />
              {nuevosAdjuntos.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {nuevosAdjuntos.map((a) => (
                    <span
                      key={a.id}
                      style={{
                        fontSize: '0.74rem',
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {a.nombre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Guardar registro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: REGISTRAR EJECUCIÓN */}
      {modalEjecucionOpen && itemSeleccionado && puedeGestionar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <form
            onSubmit={handleConfirmarEjecucion}
            style={{
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              Registrar Ejecución · {itemSeleccionado.folio}
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {itemSeleccionado.articuloSku} — {itemSeleccionado.articuloNombre}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Fecha real *
                </label>
                <input
                  type="date"
                  value={ejecFechaReal}
                  onChange={(e) => setEjecFechaReal(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Costo final (MXN) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ejecCostoFinal}
                  onChange={(e) => setEjecCostoFinal(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                  Estatus resultante *
                </label>
                <select
                  value={ejecEstatusResultante}
                  onChange={(e) =>
                    setEjecEstatusResultante(
                      e.target.value as 'Al día' | 'Requiere seguimiento' | 'Baja Definitiva'
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Al día">Al día (Liberar a disponible)</option>
                  <option value="Requiere seguimiento">Requiere seguimiento</option>
                  <option value="Baja Definitiva">Baja Definitiva / Irreparable</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Trabajo realizado *
              </label>
              <textarea
                rows={3}
                value={ejecTrabajo}
                onChange={(e) => setEjecTrabajo(e.target.value)}
                required
                placeholder="Detalle técnico de las maniobras, pruebas o calibraciones efectuadas..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Refacciones usadas
              </label>
              <input
                type="text"
                value={ejecRefacciones}
                onChange={(e) => setEjecRefacciones(e.target.value)}
                placeholder="Ej. Fusibles 10A, sellos, batería de respaldo..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Observaciones
              </label>
              <textarea
                rows={2}
                value={ejecObservaciones}
                onChange={(e) => setEjecObservaciones(e.target.value)}
                placeholder="Notas de entrega, certificado o recomendaciones..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                Adjuntar evidencia / factura / certificado
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.xml"
                onChange={(e) => handleAgregarAdjuntos(e.target.files, 'Factura', setEjecAdjuntos)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setModalEjecucionOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirmar ejecución
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: DETALLE DEL ARTÍCULO, BITÁCORA CRONOLÓGICA, ADJUNTOS Y COSTOS */}
      {modalDetalleOpen && itemSeleccionado && detalleArticulo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 780,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa' }}>
                  FICHA TÉCNICA DE MANTENIMIENTO · {itemSeleccionado.articuloSku}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  {itemSeleccionado.articuloNombre}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Categoría: {itemSeleccionado.categoria || detalleArticulo.art?.categoria || 'General'} · Ubicación:{' '}
                  {itemSeleccionado.ubicacion || detalleArticulo.art?.ubicacionNave || 'Almacén Principal'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Resumen de costos y próximos servicios */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>COSTO ACUMULADO</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#a78bfa', marginTop: 4 }}>
                  ${detalleArticulo.costoAcumulado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SERVICIOS REGISTRADOS</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: 4 }}>
                  {detalleArticulo.serviciosArticulo.length}
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PRÓXIMOS SERVICIOS</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>
                  {detalleArticulo.proximos.length}
                </div>
              </div>
            </div>

            {/* Próximos servicios */}
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 800 }}>Próximos Servicios</h3>
              {detalleArticulo.proximos.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  No hay mantenimientos futuros pendientes para este artículo.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detalleArticulo.proximos.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <strong>{p.folio}</strong> · {p.tipoMantenimiento} ({p.frecuencia || 'Única'}) —{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{p.diagnosticoFalla}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>{p.proximaFecha}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial completo (bitácora cronológica) */}
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 800 }}>
                Bitácora Cronológica de Mantenimientos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detalleArticulo.bitacora.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Sin eventos registrados en bitácora todavía.
                  </p>
                ) : (
                  detalleArticulo.bitacora.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong>
                          {b.fecha} · {b.folio} ({b.tipoMantenimiento})
                        </strong>
                        {b.costoFinal !== undefined && (
                          <span style={{ fontWeight: 700, color: '#10b981' }}>
                            ${b.costoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{b.descripcion}</div>
                      {b.trabajoRealizado && (
                        <div style={{ marginTop: 4 }}>
                          <strong>Trabajo:</strong> {b.trabajoRealizado}
                        </div>
                      )}
                      {b.refaccionesUsadas && (
                        <div>
                          <strong>Refacciones:</strong> {b.refaccionesUsadas}
                        </div>
                      )}
                      <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Responsable: {b.responsable} · Registró: {b.usuario}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Documentos adjuntos */}
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 800 }}>Documentos Adjuntos</h3>
              {detalleArticulo.adjuntos.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  No hay fotos, órdenes de servicio o facturas adjuntas.
                </p>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detalleArticulo.adjuntos.map((adj) => (
                    <a
                      key={adj.id}
                      href={adj.url || '#'}
                      download={adj.nombre}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        attach_file
                      </span>
                      {adj.nombre}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REPROGRAMAR */}
      {modalReprogramarOpen && itemSeleccionado && puedeGestionar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <form
            onSubmit={handleConfirmarReprogramar}
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
              Reprogramar {itemSeleccionado.folio}
            </h3>
            <input
              type="date"
              value={reprogramarFecha}
              onChange={(e) => setReprogramarFecha(e.target.value)}
              required
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setModalReprogramarOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Guardar fecha
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: BAJA IRREPARABLE */}
      {modalBajaOpen && itemSeleccionado && puedeGestionar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <form
            onSubmit={handleConfirmarBaja}
            style={{
              width: '100%',
              maxWidth: 460,
              background: 'var(--card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ef4444' }}>
              Baja Definitiva · {itemSeleccionado.folio}
            </h3>
            <textarea
              rows={3}
              value={bajaMotivo}
              onChange={(e) => setBajaMotivo(e.target.value)}
              placeholder="Motivo obligatorio de baja irreparable..."
              required
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setModalBajaOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirmar baja
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
