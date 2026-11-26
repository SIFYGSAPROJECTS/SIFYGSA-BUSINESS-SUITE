'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAlmacen } from '../context/AlmacenContext';
import type {
  MantenimientoArticulo,
  TipoMantenimiento,
} from '../types';
import '../almacen.css';

export default function MantenimientoArticulosPage() {
  const router = useRouter();
  const {
    mantenimientos,
    articulosActivos,
    articulos,
    enviarAMantenimiento,
    completarMantenimientoReingreso,
    darDeBajaMantenimiento,
    mostrarToast,
  } = useAlmacen();

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Modales
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalReingresoOpen, setModalReingresoOpen] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<MantenimientoArticulo | null>(null);

  // Formulario de Envío a Mantenimiento
  const [nuevoArticuloSku, setNuevoArticuloSku] = useState(articulosActivos[0]?.sku || '');
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [nuevoTipo, setNuevoTipo] = useState<TipoMantenimiento>('Preventivo');
  const [nuevoResponsable, setNuevoResponsable] = useState('');
  const [nuevaFechaRetorno, setNuevaFechaRetorno] = useState('');
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState<number | ''>('');

  // Formulario de Reingreso
  const [reingresoFechaReal, setReingresoFechaReal] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reingresoCosto, setReingresoCosto] = useState<number>(0);
  const [reingresoObservaciones, setReingresoObservaciones] = useState('');

  // Formulario de Baja
  const [bajaMotivo, setBajaMotivo] = useState('');

  // Obtener artículo seleccionado para envío
  const articuloSeleccionado = useMemo(() => {
    return articulos.find((a) => a.sku.toLowerCase() === nuevoArticuloSku.toLowerCase());
  }, [articulos, nuevoArticuloSku]);

  // Búsqueda en tiempo real y autocompletado en el modal de Enviar a Mantenimiento
  const [busquedaArticuloTexto, setBusquedaArticuloTexto] = useState('');
  const [comboboxAbierto, setComboboxAbierto] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Sincronizar texto inicial con el artículo seleccionado al abrir el modal
  useEffect(() => {
    if (modalNuevoOpen && articuloSeleccionado) {
      setBusquedaArticuloTexto(`${articuloSeleccionado.sku} - ${articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre}`);
    }
  }, [modalNuevoOpen, articuloSeleccionado]);

  // Cerrar lista desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setComboboxAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado reactivo en tiempo real de artículos según lo que escribe el usuario
  const articulosFiltradosBusqueda = useMemo(() => {
    const q = busquedaArticuloTexto.toLowerCase().trim();
    if (!q) return articulosActivos;
    return articulosActivos.filter((a) => {
      const matchSku = a.sku.toLowerCase().includes(q);
      const matchNombre = (a.nombre || '').toLowerCase().includes(q);
      const matchDesc = (a.descripcionCorta || a.descripcion || '').toLowerCase().includes(q);
      const matchCat = (a.categoria || '').toLowerCase().includes(q);
      return matchSku || matchNombre || matchDesc || matchCat;
    });
  }, [articulosActivos, busquedaArticuloTexto]);

  // KPIs
  const hoyStr = new Date().toISOString().slice(0, 10);
  const kpis = useMemo(() => {
    const enMantenimiento = mantenimientos.filter(
      (m) =>
        m.estado === 'Pendiente / En Diagnóstico' || m.estado === 'En Proceso'
    ).length;

    const vencidos = mantenimientos.filter(
      (m) =>
        (m.estado === 'Pendiente / En Diagnóstico' || m.estado === 'En Proceso') &&
        m.fechaEstimadaRetorno < hoyStr
    ).length;

    const completados = mantenimientos.filter(
      (m) => m.estado === 'Completado / Listo para Reingreso'
    ).length;

    const costoTotal = mantenimientos.reduce(
      (acc, m) => acc + (m.costoMantenimiento || 0),
      0
    );

    return {
      enMantenimiento,
      vencidos,
      completados,
      costoTotal,
    };
  }, [mantenimientos, hoyStr]);

  // Filtrado de mantenimientos
  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter((m) => {
      const matchEstado =
        filtroEstado === 'todos' || m.estado === filtroEstado;
      const matchTipo =
        filtroTipo === 'todos' || m.tipoMantenimiento === filtroTipo;

      const q = busqueda.toLowerCase().trim();
      const matchQuery =
        !q ||
        m.folio.toLowerCase().includes(q) ||
        m.articuloSku.toLowerCase().includes(q) ||
        m.articuloNombre.toLowerCase().includes(q) ||
        m.responsableOProveedor.toLowerCase().includes(q);

      return matchEstado && matchTipo && matchQuery;
    });
  }, [mantenimientos, filtroEstado, filtroTipo, busqueda]);

  // Handler: Enviar a Mantenimiento
  const handleConfirmarEnvio = (e: React.FormEvent) => {
    e.preventDefault();

    if (!articuloSeleccionado) {
      mostrarToast('Selecciona un artículo válido del inventario.', 'error');
      return;
    }

    if (nuevaCantidad <= 0) {
      mostrarToast('La cantidad debe ser mayor a 0.', 'error');
      return;
    }

    if (nuevaCantidad > articuloSeleccionado.stockDisponible) {
      mostrarToast(
        `Existencias insuficientes: Solo dispones de ${articuloSeleccionado.stockDisponible} unidades de ${articuloSeleccionado.sku}.`,
        'error'
      );
      return;
    }

    if (!nuevoResponsable.trim()) {
      mostrarToast('Indica el taller técnico, laboratorio o proveedor responsable.', 'error');
      return;
    }

    if (!nuevaFechaRetorno) {
      mostrarToast('Indica la fecha estimada de retorno.', 'error');
      return;
    }

    if (!nuevoDiagnostico.trim()) {
      mostrarToast('Captura el diagnóstico inicial de falla o motivo de servicio.', 'error');
      return;
    }

    const folio = `MNT-2026-${String(mantenimientos.length + 1).padStart(4, '0')}`;

    const nuevoMantenimiento: MantenimientoArticulo = {
      id: `mnt-${Date.now()}`,
      folio,
      articuloId: articuloSeleccionado.id,
      articuloSku: articuloSeleccionado.sku,
      articuloNombre: articuloSeleccionado.descripcionCorta || articuloSeleccionado.nombre,
      cantidad: nuevaCantidad,
      almacenId: articuloSeleccionado.almacenId || 'principal',
      tipoMantenimiento: nuevoTipo,
      estado: 'En Proceso',
      fechaEnvio: new Date().toISOString().slice(0, 10),
      fechaEstimadaRetorno: nuevaFechaRetorno,
      responsableOProveedor: nuevoResponsable.trim(),
      costoMantenimiento: nuevoCosto !== '' ? Number(nuevoCosto) : undefined,
      diagnosticoFalla: nuevoDiagnostico.trim(),
      usuarioRegistro: 'Ing. Mateo Gómez (Jefe Almacén)',
    };

    enviarAMantenimiento(nuevoMantenimiento);
    setModalNuevoOpen(false);

    // Reset fields
    setNuevaCantidad(1);
    setNuevoResponsable('');
    setNuevaFechaRetorno('');
    setNuevoDiagnostico('');
    setNuevoCosto('');
  };

  // Handler: Confirmar Reingreso
  const handleConfirmarReingreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSeleccionado) return;

    completarMantenimientoReingreso(
      itemSeleccionado.id,
      reingresoFechaReal,
      reingresoCosto,
      reingresoObservaciones.trim(),
      'Ing. Mateo Gómez'
    );

    setModalReingresoOpen(false);
    setItemSeleccionado(null);
    setReingresoCosto(0);
    setReingresoObservaciones('');
  };

  // Handler: Confirmar Baja
  const handleConfirmarBaja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSeleccionado) return;

    if (!bajaMotivo.trim()) {
      mostrarToast('El motivo de baja irreparable es estrictamente obligatorio para la bitácora.', 'error');
      return;
    }

    darDeBajaMantenimiento(itemSeleccionado.id, bajaMotivo.trim(), 'Ing. Mateo Gómez');
    setModalBajaOpen(false);
    setItemSeleccionado(null);
    setBajaMotivo('');
  };

  return (
    <div className="almacen-module-container" style={{ minHeight: '100vh', background: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Cabecera Principal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            padding: '20px 24px',
            background: 'var(--card)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>build_circle</span>
              </span>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Control de Mantenimiento de Artículos
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Gestión del ciclo de vida de herramientas y equipos en taller, calibración y reingreso a kárdex.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => router.push('/almacen')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              <span>Menú Almacén</span>
            </button>

            <button
              type="button"
              onClick={() => setModalNuevoOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              <span>Enviar a Mantenimiento</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs de Mantenimiento */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* KPI 1: En Mantenimiento */}
          <div
            style={{
              padding: 20,
              background: 'var(--card)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>EN MANTENIMIENTO ACTIVO</span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'var(--warning-bg)',
                  color: 'var(--warning-text)',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>construction</span>
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', margin: '10px 0 2px' }}>
              {kpis.enMantenimiento} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>equipos</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 700 }}>
              ● En taller o calibración externa
            </span>
          </div>

          {/* KPI 2: Mantenimientos Vencidos */}
          <div
            style={{
              padding: 20,
              background: 'var(--card)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MANTENIMIENTOS VENCIDOS</span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: kpis.vencidos > 0 ? 'var(--danger)' : 'var(--text-primary)', margin: '10px 0 2px' }}>
              {kpis.vencidos} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>alertas</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: kpis.vencidos > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
              {kpis.vencidos > 0 ? 'Excedieron fecha de retorno prevista' : 'En tiempo normativo'}
            </span>
          </div>

          {/* KPI 3: Completados */}
          <div
            style={{
              padding: 20,
              background: 'var(--card)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>COMPLETADOS Y REINGRESADOS</span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'var(--success-bg)',
                  color: 'var(--success-text)',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', margin: '10px 0 2px' }}>
              {kpis.completados} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>servicios</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
              Reincorporados a existencias
            </span>
          </div>

          {/* KPI 4: Costo Total */}
          <div
            style={{
              padding: 20,
              background: 'var(--card)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>COSTO ACUMULADO</span>
              <span
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'var(--brand-tonal-bg)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 2px' }}>
              ${kpis.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Gasto en talleres y metrología
            </span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            padding: 18,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: 20,
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por folio, SKU, nombre de equipo o taller..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="todos">Todos los Estados</option>
              <option value="Pendiente / En Diagnóstico">Pendiente / En Diagnóstico</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completado / Listo para Reingreso">Completado / Listo para Reingreso</option>
              <option value="Baja Definitiva / Irreparable">Baja Definitiva / Irreparable</option>
            </select>
          </div>

          <div style={{ width: 210 }}>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Calibración / Revisión">Calibración / Revisión</option>
            </select>
          </div>

          {(busqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('todos');
                setFiltroTipo('todos');
              }}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-alt)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {/* Tabla Principal */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          {mantenimientosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#cbd5e1' }}>
                build
              </span>
              <p style={{ margin: '12px 0 0', fontSize: '0.95rem', fontWeight: 600 }}>
                No se encontraron registros de mantenimiento con los criterios seleccionados.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Folio</th>
                  <th style={{ padding: '12px 16px' }}>Artículo / Equipo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ padding: '12px 16px' }}>Tipo</th>
                  <th style={{ padding: '12px 16px' }}>Fechas</th>
                  <th style={{ padding: '12px 16px' }}>Taller / Proveedor</th>
                  <th style={{ padding: '12px 16px' }}>Costo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientosFiltrados.map((m) => {
                  const estaVencido =
                    (m.estado === 'Pendiente / En Diagnóstico' || m.estado === 'En Proceso') &&
                    m.fechaEstimadaRetorno < hoyStr;

                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--divider)', background: estaVencido ? 'rgba(239, 68, 68, 0.12)' : 'transparent', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--link)' }}>
                        {m.folio}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{m.articuloNombre}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace" }}>
                          SKU: {m.articuloSku}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {m.cantidad} uds
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              m.tipoMantenimiento === 'Preventivo'
                                ? 'var(--info-bg)'
                                : m.tipoMantenimiento === 'Correctivo'
                                ? 'var(--danger-bg)'
                                : 'var(--warning-bg)',
                            color:
                              m.tipoMantenimiento === 'Preventivo'
                                ? 'var(--info-text)'
                                : m.tipoMantenimiento === 'Correctivo'
                                ? 'var(--danger-text)'
                                : 'var(--warning-text)',
                          }}
                        >
                          {m.tipoMantenimiento}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>
                        <div>Envío: {m.fechaEnvio}</div>
                        <div style={{ color: estaVencido ? '#dc2626' : '#64748b', fontWeight: estaVencido ? 700 : 500 }}>
                          Est.: {m.fechaEstimadaRetorno} {estaVencido && '⚠ Vencido'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {m.responsableOProveedor}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.costoMantenimiento
                          ? `$${m.costoMantenimiento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : 'Pendiente'}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 9999,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background:
                              m.estado === 'Completado / Listo para Reingreso'
                                ? 'var(--success-bg)'
                                : m.estado === 'Baja Definitiva / Irreparable'
                                ? 'var(--danger-bg)'
                                : m.estado === 'En Proceso'
                                ? 'var(--warning-bg)'
                                : 'var(--surface-alt)',
                            color:
                              m.estado === 'Completado / Listo para Reingreso'
                                ? 'var(--success-text)'
                                : m.estado === 'Baja Definitiva / Irreparable'
                                ? 'var(--danger-text)'
                                : m.estado === 'En Proceso'
                                ? 'var(--warning-text)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {m.estado}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setItemSeleccionado(m);
                              setModalDetalleOpen(true);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'var(--surface-alt)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                            title="Ver detalles del mantenimiento"
                          >
                            Detalle
                          </button>

                          {m.estado !== 'Completado / Listo para Reingreso' &&
                            m.estado !== 'Baja Definitiva / Irreparable' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemSeleccionado(m);
                                    setReingresoCosto(m.costoMantenimiento || 0);
                                    setModalReingresoOpen(true);
                                  }}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                  }}
                                  title="Reingresar unidades reparadas a inventario disponible"
                                >
                                  Reingreso
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemSeleccionado(m);
                                    setModalBajaOpen(true);
                                  }}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                  }}
                                  title="Dar de baja definitiva por daño irreparable"
                                >
                                  Baja
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
      </main>

      {/* MODAL 1: ENVIAR ARTÍCULO A MANTENIMIENTO */}
      {modalNuevoOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 26 }}>
                  construction
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Enviar Artículo / Equipo a Mantenimiento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Selector con Campo de Texto y Búsqueda en Tiempo Real */}
              <div ref={comboboxRef} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary, #475569)', marginBottom: 4 }}>
                  Seleccionar Artículo / Equipo del Inventario:
                </label>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: 12,
                      fontSize: 18,
                      color: 'var(--text-secondary, #94a3b8)',
                      pointerEvents: 'none',
                    }}
                  >
                    search
                  </span>

                  <input
                    type="text"
                    placeholder="Escribe para buscar por código SKU, nombre o categoría..."
                    value={busquedaArticuloTexto}
                    onChange={(e) => {
                      setBusquedaArticuloTexto(e.target.value);
                      setComboboxAbierto(true);
                      if (!e.target.value.trim()) {
                        setNuevoArticuloSku('');
                      }
                    }}
                    onFocus={() => setComboboxAbierto(true)}
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 38px',
                      borderRadius: 'var(--radius-control, 8px)',
                      border: '1.5px solid var(--border, #cbd5e1)',
                      backgroundColor: 'var(--surface, #ffffff)',
                      color: 'var(--text-primary, #0f172a)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setComboboxAbierto(false);
                      if (e.key === 'Enter' && articulosFiltradosBusqueda.length > 0 && comboboxAbierto) {
                        e.preventDefault();
                        const primer = articulosFiltradosBusqueda[0];
                        setNuevoArticuloSku(primer.sku);
                        setBusquedaArticuloTexto(`${primer.sku} - ${primer.descripcionCorta || primer.nombre}`);
                        setComboboxAbierto(false);
                      }
                    }}
                    required
                  />

                  {busquedaArticuloTexto ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBusquedaArticuloTexto('');
                        setNuevoArticuloSku('');
                        setComboboxAbierto(true);
                      }}
                      style={{
                        position: 'absolute',
                        right: 10,
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary, #94a3b8)',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Limpiar campo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        right: 10,
                        fontSize: 20,
                        color: 'var(--text-secondary, #94a3b8)',
                        pointerEvents: 'none',
                      }}
                    >
                      arrow_drop_down
                    </span>
                  )}
                </div>

                {/* Panel Flotante de Resultados de Búsqueda */}
                {comboboxAbierto && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 60,
                      marginTop: 4,
                      background: 'var(--surface, #ffffff)',
                      border: '1px solid var(--border, #e2e8f0)',
                      borderRadius: 10,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                      maxHeight: 230,
                      overflowY: 'auto',
                    }}
                  >
                    {articulosFiltradosBusqueda.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', textAlign: 'center' }}>
                        No se encontraron artículos con &ldquo;{busquedaArticuloTexto}&rdquo;.
                      </div>
                    ) : (
                      articulosFiltradosBusqueda.map((a) => {
                        const isSelected = a.sku.toLowerCase() === nuevoArticuloSku.toLowerCase();
                        return (
                          <div
                            key={a.sku}
                            onClick={() => {
                              setNuevoArticuloSku(a.sku);
                              setBusquedaArticuloTexto(`${a.sku} - ${a.descripcionCorta || a.nombre}`);
                              setComboboxAbierto(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              borderBottom: '1px solid var(--divider, #f1f5f9)',
                              backgroundColor: isSelected ? 'var(--brand-50, #eff6ff)' : 'transparent',
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-alt, #f8fafc)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    color: 'var(--primary, #1d4ed8)',
                                  }}
                                >
                                  {a.sku}
                                </span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                                  {a.descripcionCorta || a.nombre}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)' }}>
                                {a.categoria} • Ubicación: {a.ubicacionSugerida || 'Almacén Principal'}
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 9999,
                                flexShrink: 0,
                                backgroundColor: a.stockDisponible > 0 ? 'var(--success-bg, #dcfce7)' : 'var(--danger-bg, #fee2e2)',
                                color: a.stockDisponible > 0 ? 'var(--success-text, #166534)' : 'var(--danger-text, #991b1b)',
                              }}
                            >
                              Disp: {a.stockDisponible} uds
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Indicador de stock disponible del artículo seleccionado */}
                {articuloSeleccionado ? (
                  <div style={{ marginTop: 6, fontSize: '0.76rem', color: 'var(--success, #16a34a)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                    <span>Stock disponible actual: <strong>{articuloSeleccionado.stockDisponible} unidades</strong></span>
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Escribe para buscar y seleccionar el equipo del inventario.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Cantidad a Enviar:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={articuloSeleccionado?.stockDisponible || 1}
                    value={nuevaCantidad}
                    onChange={(e) => setNuevaCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Tipo de Mantenimiento:
                  </label>
                  <select
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value as TipoMantenimiento)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    <option value="Preventivo">Preventivo (Servicio Periódico)</option>
                    <option value="Correctivo">Correctivo (Reparación de Falla)</option>
                    <option value="Calibración / Revisión">Calibración / Metrología NOM</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Taller, Laboratorio o Técnico:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Taller Central SIFYGSA / Snap-on"
                    value={nuevoResponsable}
                    onChange={(e) => setNuevoResponsable(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Fecha Estimada de Retorno:
                  </label>
                  <input
                    type="date"
                    value={nuevaFechaRetorno}
                    onChange={(e) => setNuevaFechaRetorno(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Costo Estimado (MXN, Opcional):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={nuevoCosto}
                  onChange={(e) => setNuevoCosto(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Diagnóstico de Falla / Motivo del Envío:
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla los síntomas, anomalías o requerimientos de calibración..."
                  value={nuevoDiagnostico}
                  onChange={(e) => setNuevoDiagnostico(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                    color: 'var(--text-secondary)',
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
                    background: '#1d4ed8',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirmar Envío y Descontar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REINGRESO A INVENTARIO */}
      {modalReingresoOpen && itemSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: 26 }}>
                  check_circle
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Reingreso de Artículo a Inventario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalReingresoOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'var(--success-bg)',
                color: 'var(--success-text)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                marginBottom: 16,
                fontSize: '0.84rem',
              }}
            >
              <div><strong>Folio:</strong> {itemSeleccionado.folio}</div>
              <div><strong>Artículo:</strong> {itemSeleccionado.articuloSku} - {itemSeleccionado.articuloNombre}</div>
              <div><strong>Cantidad a reintegrar al stock disponible:</strong> {itemSeleccionado.cantidad} uds</div>
            </div>

            <form onSubmit={handleConfirmarReingreso} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Fecha Real de Retorno / Entrega:
                </label>
                <input
                  type="date"
                  value={reingresoFechaReal}
                  onChange={(e) => setReingresoFechaReal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Costo Final de Mantenimiento (MXN):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={reingresoCosto}
                  onChange={(e) => setReingresoCosto(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Dictamen Técnico y Observaciones de Resolución:
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla las pruebas realizadas, refacciones cambiadas o número de certificado de calibración..."
                  value={reingresoObservaciones}
                  onChange={(e) => setReingresoObservaciones(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalReingresoOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                    color: 'var(--text-secondary)',
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
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Completar Reingreso a Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DAR DE BAJA DEFINITIVA */}
      {modalBajaOpen && itemSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 26 }}>
                  cancel
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>
                  Baja Definitiva de Activo / Equipo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalBajaOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: 'var(--danger-bg)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                marginBottom: 16,
                fontSize: '0.84rem',
                color: 'var(--danger-text)',
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>
                ¡Atención! Esta acción descontará de forma permanente {itemSeleccionado.cantidad} unidades del inventario total de la empresa por considerarse daño irreparable o merma técnica.
              </p>
              <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#7f1d1d' }}>
                Equipo: {itemSeleccionado.articuloSku} - {itemSeleccionado.articuloNombre}
              </div>
            </div>

            <form onSubmit={handleConfirmarBaja} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Motivo de Baja Irreparable / Dictamen de Desecho:
                </label>
                <textarea
                  rows={4}
                  placeholder="Detalla por qué no fue posible la reparación o por qué el equipo no es apto para continuar operando..."
                  value={bajaMotivo}
                  onChange={(e) => setBajaMotivo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalBajaOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                    color: 'var(--text-secondary)',
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
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirmar Baja Definitiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DETALLE DE MANTENIMIENTO */}
      {modalDetalleOpen && itemSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              maxWidth: 540,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#1d4ed8', fontSize: 26 }}>
                  description
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Expediente de Mantenimiento {itemSeleccionado.folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                <div><strong>SKU:</strong> {itemSeleccionado.articuloSku}</div>
                <div><strong>Cantidad:</strong> {itemSeleccionado.cantidad} uds</div>
                <div><strong>Tipo:</strong> {itemSeleccionado.tipoMantenimiento}</div>
                <div><strong>Estado:</strong> {itemSeleccionado.estado}</div>
                <div><strong>Fecha Envío:</strong> {itemSeleccionado.fechaEnvio}</div>
                <div><strong>Fecha Estimada:</strong> {itemSeleccionado.fechaEstimadaRetorno}</div>
                {itemSeleccionado.fechaRetornoReal && (
                  <div><strong>Retorno Real:</strong> {itemSeleccionado.fechaRetornoReal}</div>
                )}
                <div>
                  <strong>Costo:</strong>{' '}
                  {itemSeleccionado.costoMantenimiento
                    ? `$${itemSeleccionado.costoMantenimiento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </div>
              </div>

              <div>
                <strong>Taller o Proveedor Responsable:</strong>
                <p style={{ margin: '4px 0 0', color: '#475569' }}>{itemSeleccionado.responsableOProveedor}</p>
              </div>

              <div>
                <strong>Diagnóstico Inicial / Motivo:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', background: 'var(--card)', border: '1px solid var(--border)', padding: 10, borderRadius: 6 }}>
                  {itemSeleccionado.diagnosticoFalla}
                </p>
              </div>

              {itemSeleccionado.observacionesResolucion && (
                <div>
                  <strong>Resolución / Dictamen Final:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--success-text)', background: 'var(--success-bg)', border: '1px solid var(--border)', padding: 10, borderRadius: 6 }}>
                    {itemSeleccionado.observacionesResolucion}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
