'use client';

import React, { useState, useMemo } from 'react';
import type { OrdenCompra, EstatusOrdenCompra } from '../types';

interface ComprasChartsProps {
  ordenes: OrdenCompra[];
  filtroEstadoActivo?: string;
  filtroProveedorActivo?: string;
  onSelectEstado?: (estatus: EstatusOrdenCompra | 'todas') => void;
  onSelectProveedor?: (proveedorNombre: string) => void;
}

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const ESTATUS_META: Record<
  EstatusOrdenCompra,
  { label: string; color: string; bgToken: string; textToken: string; icon: string }
> = {
  abierta: {
    label: 'Abierta / Emitida',
    color: '#16A34A',
    bgToken: 'var(--success-bg)',
    textToken: 'var(--success-text)',
    icon: 'check_circle',
  },
  transito: {
    label: 'En Tránsito',
    color: '#00B7EB',
    bgToken: 'var(--info-bg)',
    textToken: 'var(--info-text)',
    icon: 'local_shipping',
  },
  pendiente: {
    label: 'Pendiente Aprobación',
    color: '#D97706',
    bgToken: 'var(--warning-bg)',
    textToken: 'var(--warning-text)',
    icon: 'schedule',
  },
  cerrada: {
    label: 'Recibida / Cerrada',
    color: '#1D4ED8',
    bgToken: 'var(--brand-50)',
    textToken: 'var(--primary)',
    icon: 'inventory_2',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#DC2626',
    bgToken: 'var(--danger-bg)',
    textToken: 'var(--danger-text)',
    icon: 'cancel',
  },
  pendiente_aprobacion: {
    label: 'Pendiente de Aprobación',
    color: '#D97706',
    bgToken: 'var(--warning-bg)',
    textToken: 'var(--warning-text)',
    icon: 'hourglass_empty',
  },
  aprobada_supervisor: {
    label: 'Aprobada por Supervisor',
    color: '#2563EB',
    bgToken: 'var(--brand-50)',
    textToken: 'var(--primary)',
    icon: 'verified',
  },
  orden_completa_factura_abierta: {
    label: 'Orden Completa / Factura Abierta',
    color: '#16A34A',
    bgToken: 'var(--success-bg)',
    textToken: 'var(--success-text)',
    icon: 'receipt_long',
  },
  cerrada_factura_pagada: {
    label: 'Cerrada / Factura Pagada',
    color: '#0F172A',
    bgToken: '#F1F5F9',
    textToken: '#0F172A',
    icon: 'task_alt',
  },
  en_transito: {
    label: 'En Tránsito',
    color: '#00B7EB',
    bgToken: 'var(--info-bg)',
    textToken: 'var(--info-text)',
    icon: 'local_shipping',
  },
  autorizada: {
    label: 'Autorizada',
    color: '#10B981',
    bgToken: 'var(--success-bg)',
    textToken: 'var(--success-text)',
    icon: 'verified',
  },
};

const PALETA_PROVEEDORES = [
  '#1D4ED8', // --brand-700 (Primary)
  '#2563EB', // --brand-600
  '#3B82F6', // --brand-500
  '#00B7EB', // --info
  '#16A34A', // --success
  '#D97706', // --warning
];

const formatCurrencyMXN = (monto: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto);

const formatCompactMXN = (monto: number) => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(2)}M`;
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(1)}k`;
  return `$${monto.toFixed(0)}`;
};

export const ComprasCharts: React.FC<ComprasChartsProps> = ({
  ordenes,
  filtroEstadoActivo = 'todas',
  filtroProveedorActivo = 'TODOS',
  onSelectEstado,
  onSelectProveedor,
}) => {
  const [modoGraficaMes, setModoGraficaMes] = useState<'monto' | 'cantidad'>('monto');
  const [mesHoverIdx, setMesHoverIdx] = useState<number | null>(null);
  const [estadoHover, setEstadoHover] = useState<EstatusOrdenCompra | null>(null);
  const [proveedorHoverIdx, setProveedorHoverIdx] = useState<number | null>(null);

  // Conversión normalizada a MXN para agregaciones financieras consistentes
  const getMontoEnMXN = (oc: OrdenCompra) => {
    if (oc.moneda === 'USD') {
      const tc = oc.tipoCambio && oc.tipoCambio > 1 ? oc.tipoCambio : 18.45;
      return oc.total * tc;
    }
    return oc.total;
  };

  // =========================================================================
  // 1. COMPRAS POR MES (Barras + Línea de tendencia interactiva)
  // =========================================================================
  const datosPorMes = useMemo(() => {
    const mapa = new Map<
      string,
      {
        key: string;
        mesCorto: string;
        mesLargo: string;
        anio: number;
        montoMXN: number;
        cantidad: number;
        aprobadas: number;
      }
    >();

    ordenes.forEach((oc) => {
      if (oc.estatus === 'cancelada') return;
      const partes = oc.fechaEmision.split('-');
      const anio = parseInt(partes[0] || '2026', 10);
      const mesIdx = Math.max(0, Math.min(11, parseInt(partes[1] || '1', 10) - 1));
      const key = `${anio}-${String(mesIdx + 1).padStart(2, '0')}`;
      const actual = mapa.get(key) || {
        key,
        mesCorto: `${MESES_CORTOS[mesIdx]} ${String(anio).slice(-2)}`,
        mesLargo: `${MESES_LARGOS[mesIdx]} ${anio}`,
        anio,
        montoMXN: 0,
        cantidad: 0,
        aprobadas: 0,
      };
      actual.montoMXN += getMontoEnMXN(oc);
      actual.cantidad += 1;
      if (oc.estatus === 'abierta' || oc.estatus === 'cerrada') {
        actual.aprobadas += 1;
      }
      mapa.set(key, actual);
    });

    const lista = Array.from(mapa.values()).sort((a, b) => a.key.localeCompare(b.key));
    return lista;
  }, [ordenes]);

  const maxValorMes = useMemo(() => {
    if (datosPorMes.length === 0) return 1;
    const max = Math.max(
      ...datosPorMes.map((d) => (modoGraficaMes === 'monto' ? d.montoMXN : d.cantidad))
    );
    return max > 0 ? max : 1;
  }, [datosPorMes, modoGraficaMes]);

  // =========================================================================
  // 2. COMPRAS POR PROVEEDOR (Barras horizontales con % de participación)
  // =========================================================================
  const datosPorProveedor = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string;
        rfc: string;
        montoMXN: number;
        ordenesCount: number;
      }
    >();

    let sumaTotal = 0;
    ordenes.forEach((oc) => {
      if (oc.estatus === 'cancelada') return;
      const monto = getMontoEnMXN(oc);
      sumaTotal += monto;
      const key = oc.proveedorRfc || oc.proveedorNombre;
      const actual = mapa.get(key) || {
        nombre: oc.proveedorNombre,
        rfc: oc.proveedorRfc,
        montoMXN: 0,
        ordenesCount: 0,
      };
      actual.montoMXN += monto;
      actual.ordenesCount += 1;
      mapa.set(key, actual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.montoMXN - a.montoMXN)
      .slice(0, 6)
      .map((item, idx) => ({
        ...item,
        porcentaje: sumaTotal > 0 ? (item.montoMXN / sumaTotal) * 100 : 0,
        color: PALETA_PROVEEDORES[idx % PALETA_PROVEEDORES.length],
      }));
  }, [ordenes]);

  // =========================================================================
  // 3. ÓRDENES POR ESTADO (Gráfica de Dona SVG interactiva)
  // =========================================================================
  const datosPorEstado = useMemo(() => {
    const conteo: Record<EstatusOrdenCompra, { count: number; montoMXN: number }> = {
      abierta: { count: 0, montoMXN: 0 },
      transito: { count: 0, montoMXN: 0 },
      pendiente: { count: 0, montoMXN: 0 },
      cerrada: { count: 0, montoMXN: 0 },
      cancelada: { count: 0, montoMXN: 0 },
      pendiente_aprobacion: { count: 0, montoMXN: 0 },
      aprobada_supervisor: { count: 0, montoMXN: 0 },
      orden_completa_factura_abierta: { count: 0, montoMXN: 0 },
      cerrada_factura_pagada: { count: 0, montoMXN: 0 },
      en_transito: { count: 0, montoMXN: 0 },
      autorizada: { count: 0, montoMXN: 0 },
    };

    ordenes.forEach((oc) => {
      const est = oc.estatus in conteo ? oc.estatus : 'abierta';
      conteo[est].count += 1;
      conteo[est].montoMXN += getMontoEnMXN(oc);
    });

    const total = ordenes.length || 1;
    const radio = 62;
    const circunferencia = 2 * Math.PI * radio;
    let acumuladoPct = 0;

    const ordenEstados: EstatusOrdenCompra[] = [
      'abierta',
      'cerrada',
      'transito',
      'pendiente',
      'cancelada',
    ];

    return ordenEstados.map((estatus) => {
      const count = conteo[estatus].count;
      const pct = (count / total) * 100;
      const dashLength = (pct / 100) * circunferencia;
      const dashOffset = -((acumuladoPct / 100) * circunferencia);
      acumuladoPct += pct;

      return {
        estatus,
        ...ESTATUS_META[estatus],
        count,
        montoMXN: conteo[estatus].montoMXN,
        porcentaje: pct,
        dashArray: `${dashLength} ${circunferencia}`,
        dashOffset,
      };
    });
  }, [ordenes]);

  const estadoDestacado = useMemo(() => {
    if (!estadoHover) return null;
    return datosPorEstado.find((e) => e.estatus === estadoHover) || null;
  }, [estadoHover, datosPorEstado]);

  // =========================================================================
  // 4. TOP ARTÍCULOS Y SERVICIOS MÁS COMPRADOS
  // =========================================================================
  const topArticulos = useMemo(() => {
    // Recolecta las partidas reales de las órdenes activas en el módulo
    const mapa = new Map<
      string,
      {
        codigo: string;
        descripcion: string;
        unidad: string;
        cantidadTotal: number;
        montoSubtotalMXN: number;
        frecuenciaOrdenes: number;
      }
    >();

    ordenes.forEach((oc) => {
      if (oc.estatus === 'cancelada') return;
      const factorTC = oc.moneda === 'USD' ? oc.tipoCambio || 18.45 : 1;

      (oc.items || []).forEach((item) => {
        const key = item.codigo || item.descripcion.slice(0, 24);
        const actual = mapa.get(key) || {
          codigo: item.codigo || 'SIN-SKU',
          descripcion: item.descripcion,
          unidad: item.unidad || 'PZA',
          cantidadTotal: 0,
          montoSubtotalMXN: 0,
          frecuenciaOrdenes: 0,
        };
        actual.cantidadTotal += Number(item.cantidad) || 0;
        actual.montoSubtotalMXN += (Number(item.subtotal) || 0) * factorTC;
        actual.frecuenciaOrdenes += 1;
        mapa.set(key, actual);
      });
    });

    const lista = Array.from(mapa.values()).sort(
      (a, b) => b.montoSubtotalMXN - a.montoSubtotalMXN
    );
    const maxMonto = lista[0]?.montoSubtotalMXN || 1;

    return lista.slice(0, 5).map((art, index) => ({
      ...art,
      rank: index + 1,
      pctRelativo: (art.montoSubtotalMXN / maxMonto) * 100,
    }));
  }, [ordenes]);

  return (
    <div className="cp-analytics-grid" role="region" aria-label=" Tablero Analítico de Compras">
      {/* ================================================================= */}
      {/* TARJETA 1: COMPRAS POR MES (BARRAS + LÍNEA DE TENDENCIA)          */}
      {/* ================================================================= */}
      <article className="cp-chart-card">
        <div className="cp-chart-header">
          <div>
            <div className="cp-chart-title-row">
              <span className="material-symbols-outlined cp-chart-icon">bar_chart</span>
              <h3 className="cp-chart-title">Evolución de Compras por Mes</h3>
            </div>
            <p className="cp-chart-subtitle">
              Importe ejercido en MXN y volumen de órdenes emitidas (excluye canceladas)
            </p>
          </div>

          <div className="cp-chart-SegmentedControl" role="group" aria-label="Métrica mensual">
            <button
              type="button"
              className={`cp-chart-seg-btn ${modoGraficaMes === 'monto' ? 'active' : ''}`}
              onClick={() => setModoGraficaMes('monto')}
            >
              Monto MXN
            </button>
            <button
              type="button"
              className={`cp-chart-seg-btn ${modoGraficaMes === 'cantidad' ? 'active' : ''}`}
              onClick={() => setModoGraficaMes('cantidad')}
            >
              N° Órdenes
            </button>
          </div>
        </div>

        {datosPorMes.length === 0 ? (
          <div className="cp-chart-empty">
            <span className="material-symbols-outlined">monitoring</span>
            <p>Sin órdenes registradas en el rango de fechas seleccionado.</p>
          </div>
        ) : (
          <div className="cp-bar-chart-wrapper">
            {/* Tooltip flotante superior */}
            <div className="cp-chart-live-summary">
              {mesHoverIdx !== null && datosPorMes[mesHoverIdx] ? (
                <div className="cp-chart-tooltip-pill">
                  <span className="cp-tooltip-dot" style={{ background: 'var(--primary)' }} />
                  <strong>{datosPorMes[mesHoverIdx].mesLargo}:</strong>
                  <span>{formatCurrencyMXN(datosPorMes[mesHoverIdx].montoMXN)}</span>
                  <span className="cp-tooltip-sep">•</span>
                  <span>
                    {datosPorMes[mesHoverIdx].cantidad}{' '}
                    {datosPorMes[mesHoverIdx].cantidad === 1 ? 'orden' : 'órdenes'}
                  </span>
                </div>
              ) : (
                <div className="cp-chart-legend-inline">
                  <span className="cp-legend-item">
                    <span className="cp-legend-swatch" style={{ background: 'var(--primary)' }} />
                    {modoGraficaMes === 'monto'
                      ? 'Importe Mensual (MXN)'
                      : 'Órdenes Emitidas por Mes'}
                  </span>
                  <span className="cp-legend-item">
                    <span
                      className="cp-legend-swatch"
                      style={{ background: 'var(--info)', borderRadius: '50%' }}
                    />
                    Pasa el cursor sobre cada barra para ver el detalle
                  </span>
                </div>
              )}
            </div>

            {/* Contenedor de barras interactivas */}
            <div className="cp-vbars-stage">
              {datosPorMes.map((item, idx) => {
                const valor = modoGraficaMes === 'monto' ? item.montoMXN : item.cantidad;
                const alturaPct = Math.max(12, Math.round((valor / maxValorMes) * 100));
                const isHovered = mesHoverIdx === idx;

                return (
                  <div
                    key={item.key}
                    className={`cp-vbar-col ${isHovered ? 'is-hovered' : ''}`}
                    onMouseEnter={() => setMesHoverIdx(idx)}
                    onMouseLeave={() => setMesHoverIdx(null)}
                    tabIndex={0}
                    onFocus={() => setMesHoverIdx(idx)}
                    onBlur={() => setMesHoverIdx(null)}
                    aria-label={`${item.mesLargo}: ${formatCurrencyMXN(item.montoMXN)}, ${item.cantidad} órdenes`}
                  >
                    <div className="cp-vbar-value-top">
                      {modoGraficaMes === 'monto'
                        ? formatCompactMXN(item.montoMXN)
                        : `${item.cantidad} OC`}
                    </div>
                    <div className="cp-vbar-track">
                      <div
                        className="cp-vbar-fill"
                        style={{
                          height: `${alturaPct}%`,
                          background: isHovered
                            ? 'linear-gradient(180deg, var(--brand-500) 0%, var(--primary) 100%)'
                            : 'linear-gradient(180deg, var(--brand-600) 0%, var(--primary) 100%)',
                        }}
                      >
                        <span className="cp-vbar-cap-dot" />
                      </div>
                    </div>
                    <div className="cp-vbar-label">{item.mesCorto}</div>
                    <div className="cp-vbar-sublabel">{item.cantidad} OC</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>

      {/* ================================================================= */}
      {/* TARJETA 2: ÓRDENES POR ESTADO (DONA SVG INTERACTIVA)              */}
      {/* ================================================================= */}
      <article className="cp-chart-card">
        <div className="cp-chart-header">
          <div>
            <div className="cp-chart-title-row">
              <span className="material-symbols-outlined cp-chart-icon">donut_large</span>
              <h3 className="cp-chart-title">Distribución por Estado</h3>
            </div>
            <p className="cp-chart-subtitle">
              Haz clic en un estado para filtrar la tabla de órdenes
            </p>
          </div>
          {filtroEstadoActivo !== 'todas' && onSelectEstado && (
            <button
              type="button"
              className="cp-chart-reset-pill"
              onClick={() => onSelectEstado('todas')}
            >
              Ver todas
            </button>
          )}
        </div>

        <div className="cp-donut-layout">
          <div className="cp-donut-svg-box">
            <svg viewBox="0 0 160 160" className="cp-donut-svg" aria-label="Gráfica de dona por estado">
              <circle
                cx="80"
                cy="80"
                r="62"
                fill="transparent"
                stroke="var(--surface-alt)"
                strokeWidth="18"
              />
              {datosPorEstado.map((seg) => {
                if (seg.count === 0) return null;
                const isSelected =
                  filtroEstadoActivo === seg.estatus || estadoHover === seg.estatus;
                return (
                  <circle
                    key={seg.estatus}
                    cx="80"
                    cy="80"
                    r="62"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isSelected ? '22' : '18'}
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    transform="rotate(-90 80 80)"
                    className="cp-donut-segment"
                    style={{
                      opacity:
                        estadoHover && estadoHover !== seg.estatus
                          ? 0.45
                          : 1,
                    }}
                    onMouseEnter={() => setEstadoHover(seg.estatus)}
                    onMouseLeave={() => setEstadoHover(null)}
                    onClick={() =>
                      onSelectEstado &&
                      onSelectEstado(
                        filtroEstadoActivo === seg.estatus ? 'todas' : seg.estatus
                      )
                    }
                  />
                );
              })}
            </svg>
            <div className="cp-donut-center">
              {estadoDestacado ? (
                <>
                  <span
                    className="cp-donut-center-num"
                    style={{ color: estadoDestacado.color }}
                  >
                    {estadoDestacado.count}
                  </span>
                  <span className="cp-donut-center-label">{estadoDestacado.label}</span>
                  <span className="cp-donut-center-sub">
                    {estadoDestacado.porcentaje.toFixed(0)}% del total
                  </span>
                </>
              ) : (
                <>
                  <span className="cp-donut-center-num">{ordenes.length}</span>
                  <span className="cp-donut-center-label">Órdenes Totales</span>
                  <span className="cp-donut-center-sub">100% período</span>
                </>
              )}
            </div>
          </div>

          <div className="cp-donut-legend">
            {datosPorEstado.map((seg) => {
              const isSelected = filtroEstadoActivo === seg.estatus;
              return (
                <button
                  key={seg.estatus}
                  type="button"
                  className={`cp-donut-legend-row ${isSelected ? 'active' : ''}`}
                  onMouseEnter={() => setEstadoHover(seg.estatus)}
                  onMouseLeave={() => setEstadoHover(null)}
                  onClick={() =>
                    onSelectEstado &&
                    onSelectEstado(isSelected ? 'todas' : seg.estatus)
                  }
                >
                  <div className="cp-donut-legend-left">
                    <span
                      className="cp-donut-swatch"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="cp-donut-legend-name">{seg.label}</span>
                  </div>
                  <div className="cp-donut-legend-right">
                    <span className="cp-donut-legend-count">{seg.count} OC</span>
                    <span className="cp-donut-legend-pct">
                      ({seg.porcentaje.toFixed(0)}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </article>

      {/* ================================================================= */}
      {/* TARJETA 3: COMPRAS POR PROVEEDOR (BARRAS HORIZONTALES)            */}
      {/* ================================================================= */}
      <article className="cp-chart-card">
        <div className="cp-chart-header">
          <div>
            <div className="cp-chart-title-row">
              <span className="material-symbols-outlined cp-chart-icon">domain</span>
              <h3 className="cp-chart-title">Volumen de Compra por Proveedor</h3>
            </div>
            <p className="cp-chart-subtitle">
              Participación porcentual en gasto autorizado (haz clic para filtrar)
            </p>
          </div>
          {filtroProveedorActivo !== 'TODOS' && onSelectProveedor && (
            <button
              type="button"
              className="cp-chart-reset-pill"
              onClick={() => onSelectProveedor('TODOS')}
            >
              Todos los proveedores
            </button>
          )}
        </div>

        {datosPorProveedor.length === 0 ? (
          <div className="cp-chart-empty">
            <span className="material-symbols-outlined">storefront</span>
            <p>Sin datos de proveedores en el filtro actual.</p>
          </div>
        ) : (
          <div className="cp-hbar-list">
            {datosPorProveedor.map((prov, idx) => {
              const isSelected = filtroProveedorActivo === prov.nombre;
              const isHovered = proveedorHoverIdx === idx;
              return (
                <div
                  key={prov.rfc + idx}
                  className={`cp-hbar-item ${isSelected ? 'is-selected' : ''} ${
                    isHovered ? 'is-hovered' : ''
                  }`}
                  onMouseEnter={() => setProveedorHoverIdx(idx)}
                  onMouseLeave={() => setProveedorHoverIdx(null)}
                  onClick={() =>
                    onSelectProveedor &&
                    onSelectProveedor(isSelected ? 'TODOS' : prov.nombre)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProveedor?.(isSelected ? 'TODOS' : prov.nombre);
                    }
                  }}
                >
                  <div className="cp-hbar-meta">
                    <div className="cp-hbar-title-group">
                      <span
                        className="cp-hbar-rank-dot"
                        style={{ backgroundColor: prov.color }}
                      />
                      <span className="cp-hbar-name" title={prov.nombre}>
                        {prov.nombre}
                      </span>
                      <span className="cp-hbar-rfc">{prov.rfc}</span>
                    </div>
                    <div className="cp-hbar-values">
                      <strong className="cp-hbar-amount">
                        {formatCurrencyMXN(prov.montoMXN)}
                      </strong>
                      <span className="cp-hbar-badge">
                        {prov.ordenesCount} OC • {prov.porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="cp-hbar-track">
                    <div
                      className="cp-hbar-fill"
                      style={{
                        width: `${Math.max(6, prov.porcentaje)}%`,
                        backgroundColor: prov.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* ================================================================= */}
      {/* TARJETA 4: TOP ARTÍCULOS Y SERVICIOS MÁS COMPRADOS                */}
      {/* ================================================================= */}
      <article className="cp-chart-card">
        <div className="cp-chart-header">
          <div>
            <div className="cp-chart-title-row">
              <span className="material-symbols-outlined cp-chart-icon">category</span>
              <h3 className="cp-chart-title">Top Artículos y Servicios Más Comprados</h3>
            </div>
            <p className="cp-chart-subtitle">
              Ranking de partidas con mayor inversión acumulada en órdenes activas
            </p>
          </div>
          <span className="cp-chart-tag-pill">Top {topArticulos.length}</span>
        </div>

        {topArticulos.length === 0 ? (
          <div className="cp-chart-empty">
            <span className="material-symbols-outlined">inventory_2</span>
            <p>No hay partidas registradas para este periodo.</p>
          </div>
        ) : (
          <div className="cp-top-items-list">
            {topArticulos.map((art) => (
              <div key={art.codigo} className="cp-top-item-row">
                <div className="cp-top-item-rank">#{art.rank}</div>
                <div className="cp-top-item-body">
                  <div className="cp-top-item-head">
                    <div className="cp-top-item-title-wrap">
                      <span className="cp-top-item-sku">{art.codigo}</span>
                      <span className="cp-top-item-desc" title={art.descripcion}>
                        {art.descripcion}
                      </span>
                    </div>
                    <strong className="cp-top-item-amount">
                      {formatCurrencyMXN(art.montoSubtotalMXN)}
                    </strong>
                  </div>
                  <div className="cp-top-item-progress-row">
                    <div className="cp-top-item-bar-track">
                      <div
                        className="cp-top-item-bar-fill"
                        style={{ width: `${Math.max(8, art.pctRelativo)}%` }}
                      />
                    </div>
                    <span className="cp-top-item-qty">
                      {art.cantidadTotal.toLocaleString('es-MX')} {art.unidad} ({art.frecuenciaOrdenes}{' '}
                      {art.frecuenciaOrdenes === 1 ? 'OC' : 'OCs'})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

