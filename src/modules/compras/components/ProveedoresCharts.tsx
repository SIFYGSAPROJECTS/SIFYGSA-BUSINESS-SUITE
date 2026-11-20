'use client';

import React, { useState, useMemo } from 'react';
import type { Proveedor, OrdenCompra } from '../types';

interface ProveedoresChartsProps {
  proveedores: Proveedor[];
  ordenes: OrdenCompra[];
  filtroCategoriaActiva?: string;
  onSelectCategoria?: (categoria: string) => void;
  onSelectProveedor?: (proveedorNombre: string) => void;
}

const PALETA_CATEGORIAS = [
  '#1D4ED8', // Primary Blue (Manual UI/UX v1.1)
  '#00B7EB', // Info Cyan
  '#16A34A', // Success Emerald
  '#D97706', // Warning Amber
  '#7C3AED', // Purple
  '#0284C7', // Sky Blue
  '#EA580C', // Orange
  '#475569', // Slate
];

const formatCurrencyMXN = (monto: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto);

export const ProveedoresCharts: React.FC<ProveedoresChartsProps> = ({
  proveedores,
  ordenes,
  filtroCategoriaActiva = 'TODAS',
  onSelectCategoria,
  onSelectProveedor,
}) => {
  const [catHover, setCatHover] = useState<string | null>(null);
  const [prvHoverIdx, setPrvHoverIdx] = useState<number | null>(null);

  // Conversión normalizada a MXN para órdenes
  const getMontoEnMXN = (oc: OrdenCompra) => {
    if (oc.moneda === 'USD') {
      const tc = oc.tipoCambio && oc.tipoCambio > 1 ? oc.tipoCambio : 18.45;
      return oc.total * tc;
    }
    return oc.total;
  };

  // =========================================================================
  // 1. COMPRAS POR PROVEEDOR (Top 5 con volumen acumulado y % de participación)
  // =========================================================================
  const comprasPorProveedor = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string;
        rfc: string;
        montoMXN: number;
        ordenesCount: number;
        categoria: string;
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
        categoria: 'General',
      };
      actual.montoMXN += monto;
      actual.ordenesCount += 1;
      mapa.set(key, actual);
    });

    // Enriquecer con categoría de proveedor si coincide
    proveedores.forEach((p) => {
      const entry = mapa.get(p.rfc) || mapa.get(p.razonSocial);
      if (entry) {
        entry.categoria = p.categoria;
      }
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.montoMXN - a.montoMXN)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        porcentaje: sumaTotal > 0 ? (item.montoMXN / sumaTotal) * 100 : 0,
        color: PALETA_CATEGORIAS[idx % PALETA_CATEGORIAS.length],
      }));
  }, [ordenes, proveedores]);

  // =========================================================================
  // 2. PROVEEDORES POR CATEGORÍA (Dona SVG interactiva con leyenda y tooltips)
  // =========================================================================
  const proveedoresPorCategoria = useMemo(() => {
    const conteo = new Map<string, number>();
    proveedores.forEach((p) => {
      const cat = p.categoria || 'Sin Categoría';
      conteo.set(cat, (conteo.get(cat) || 0) + 1);
    });

    const total = proveedores.length || 1;
    const radio = 60;
    const circunferencia = 2 * Math.PI * radio;
    let acumuladoPct = 0;

    const items = Array.from(conteo.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, count], idx) => {
        const pct = (count / total) * 100;
        const dasharray = `${(pct / 100) * circunferencia} ${circunferencia}`;
        const dashoffset = -((acumuladoPct / 100) * circunferencia);
        acumuladoPct += pct;
        return {
          categoria,
          count,
          pct,
          color: PALETA_CATEGORIAS[idx % PALETA_CATEGORIAS.length],
          dasharray,
          dashoffset,
        };
      });

    return {
      total,
      radio,
      circunferencia,
      items,
    };
  }, [proveedores]);

  const catActivaObj = catHover
    ? proveedoresPorCategoria.items.find((c) => c.categoria === catHover)
    : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* ── GRÁFICA 1: COMPRAS POR PROVEEDOR ── */}
      <div
        className="cp-chart-card"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card, 16px)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.65rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(29, 78, 216, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Compras por Proveedor
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Concentración del volumen acumulado en órdenes activas
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {comprasPorProveedor.map((item, idx) => {
            const isHover = prvHoverIdx === idx;
            return (
              <div
                key={item.rfc || item.nombre}
                onMouseEnter={() => setPrvHoverIdx(idx)}
                onMouseLeave={() => setPrvHoverIdx(null)}
                onClick={() => onSelectProveedor && onSelectProveedor(item.nombre)}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  background: isHover ? 'var(--surface-alt)' : 'transparent',
                  cursor: onSelectProveedor ? 'pointer' : 'default',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        maxWidth: 220,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.nombre}
                    >
                      {item.nombre}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatCurrencyMXN(item.montoMXN)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginLeft: 6,
                        fontWeight: 600,
                      }}
                    >
                      {item.porcentaje.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Barra de progreso interactiva */}
                <div
                  style={{
                    height: 7,
                    width: '100%',
                    backgroundColor: 'var(--surface-alt, #e2e8f0)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(4, item.porcentaje))}%`,
                      backgroundColor: item.color,
                      borderRadius: 99,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GRÁFICA 2: PROVEEDORES POR CATEGORÍA ── */}
      <div
        className="cp-chart-card"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card, 16px)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.65rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(0, 183, 235, 0.1)',
                color: 'var(--info, #00B7EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Proveedores por Categoría
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Distribución por giro industrial y especialidad de suministro
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Dona SVG Interactiva */}
          <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0, margin: '0 auto' }}>
            <svg viewBox="0 0 150 150" width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
              {proveedoresPorCategoria.items.map((cat) => {
                const isHover = catHover === cat.categoria;
                return (
                  <circle
                    key={cat.categoria}
                    cx="75"
                    cy="75"
                    r={proveedoresPorCategoria.radio}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isHover ? 22 : 18}
                    strokeDasharray={cat.dasharray}
                    strokeDashoffset={cat.dashoffset}
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      cursor: 'pointer',
                      opacity: catHover && !isHover ? 0.45 : 1,
                    }}
                    onMouseEnter={() => setCatHover(cat.categoria)}
                    onMouseLeave={() => setCatHover(null)}
                    onClick={() => onSelectCategoria && onSelectCategoria(cat.categoria)}
                  />
                );
              })}
            </svg>

            {/* Centro de la dona */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {catActivaObj ? catActivaObj.count : proveedoresPorCategoria.total}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {catActivaObj ? 'Empresas' : 'Padrón'}
              </span>
            </div>
          </div>

          {/* Leyenda interactiva de categorías */}
          <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {proveedoresPorCategoria.items.map((cat) => {
              const isSelected = filtroCategoriaActiva === cat.categoria;
              const isHover = catHover === cat.categoria;
              return (
                <div
                  key={cat.categoria}
                  onMouseEnter={() => setCatHover(cat.categoria)}
                  onMouseLeave={() => setCatHover(null)}
                  onClick={() => onSelectCategoria && onSelectCategoria(cat.categoria)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.5rem',
                    borderRadius: 8,
                    background: isSelected
                      ? 'rgba(29, 78, 216, 0.1)'
                      : isHover
                      ? 'var(--surface-alt)'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    border: isSelected ? '1px solid rgba(29, 78, 216, 0.3)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: cat.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                      }}
                    >
                      {cat.categoria}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {cat.count} ({cat.pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProveedoresCharts;

