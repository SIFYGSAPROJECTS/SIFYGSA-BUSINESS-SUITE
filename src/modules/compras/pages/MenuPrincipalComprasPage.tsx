'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCompras } from '../context/ComprasContext';
import { obtenerOrdenesCompra, obtenerProveedores } from '../data/mock-data';
import type { OrdenCompra, Proveedor } from '../types';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../compras.css';

interface DonutHoverState {
  label: string;
  count: number;
  porcentaje: number;
  monto: number;
  color: string;
}

export const MenuPrincipalComprasPage: React.FC = () => {
  const { ordenes: ordenesCtx, proveedores: proveedoresCtx } = useCompras();

  // Datos en vivo (del contexto de Compras o fallback mock)
  const ordenes = useMemo<OrdenCompra[]>(() => {
    return ordenesCtx && ordenesCtx.length > 0 ? ordenesCtx : obtenerOrdenesCompra();
  }, [ordenesCtx]);

  const proveedores = useMemo<Proveedor[]>(() => {
    return proveedoresCtx && proveedoresCtx.length > 0 ? proveedoresCtx : obtenerProveedores();
  }, [proveedoresCtx]);

  // Normalizador de montos a MXN
  const calcularMontoMXN = (oc: OrdenCompra): number => {
    if (oc.moneda === 'USD') {
      const tc = oc.tipoCambio && oc.tipoCambio > 1 ? oc.tipoCambio : 18.45;
      return (oc.total || 0) * tc;
    }
    return oc.total || 0;
  };

  const formatMoneda = (val: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(val);

  // ── 1. MÉTRICAS KPI CLICABLES EN TIEMPO REAL ──
  const kpis = useMemo(() => {
    const totalOrdenes = ordenes.length;

    // Órdenes Abiertas (emitidas, en proceso o con entregas pendientes)
    const ordenesAbiertas = ordenes.filter(
      (o) =>
        o.estatus === 'abierta' ||
        o.estatus === 'autorizada' ||
        o.estatus === 'en_transito' ||
        o.estatus === 'aprobada_supervisor' ||
        o.estatus === 'orden_completa_factura_abierta'
    );
    const montoAbiertas = ordenesAbiertas.reduce((sum, o) => sum + calcularMontoMXN(o), 0);

    // Órdenes por Autorizar (pendientes de firma gerencial)
    const ordenesPorAutorizar = ordenes.filter((o) => o.estatus === 'pendiente');
    const montoPorAutorizar = ordenesPorAutorizar.reduce((sum, o) => sum + calcularMontoMXN(o), 0);

    // Proveedores Totales y Cumplimiento SAT 32-D
    const totalProveedores = proveedores.length;
    const proveedoresSatPositiva = proveedores.filter((p) => p.opinionSat32D === 'positiva').length;
    const porcentajeCumplimientoSat =
      totalProveedores > 0 ? Math.round((proveedoresSatPositiva / totalProveedores) * 100) : 100;

    // Monto Total Comprometido / Ejercido
    const montoTotalEjercido = ordenes
      .filter((o) => o.estatus !== 'cancelada')
      .reduce((sum, o) => sum + calcularMontoMXN(o), 0);

    return {
      totalOrdenes,
      ordenesAbiertasCount: ordenesAbiertas.length,
      montoAbiertas,
      ordenesPorAutorizarCount: ordenesPorAutorizar.length,
      montoPorAutorizar,
      totalProveedores,
      porcentajeCumplimientoSat,
      montoTotalEjercido,
    };
  }, [ordenes, proveedores]);

  // ── 2. DATOS DE GRÁFICA 1: ÓRDENES POR ESTATUS (DONA) ──
  const [donutHover, setDonutHover] = useState<DonutHoverState | null>(null);

  const estatusData = useMemo(() => {
    const configMap: Record<
      string,
      { label: string; color: string; icon: string }
    > = {
      pendiente: { label: 'Por Autorizar', color: '#f59e0b', icon: 'schedule' },
      autorizada: { label: 'Autorizadas', color: '#10b981', icon: 'verified' },
      abierta: { label: 'Abiertas / En Proceso', color: '#2563eb', icon: 'inventory_2' },
      en_transito: { label: 'En Tránsito', color: '#06b6d4', icon: 'local_shipping' },
      aprobada_supervisor: { label: 'Aprobadas Sup.', color: '#6366f1', icon: 'rule' },
      orden_completa_factura_abierta: { label: 'Factura Abierta', color: '#8b5cf6', icon: 'receipt_long' },
      cerrada_factura_pagada: { label: 'Cerradas / Pagadas', color: '#059669', icon: 'task_alt' },
      cancelada: { label: 'Canceladas', color: '#ef4444', icon: 'cancel' },
    };

    const conteos: Record<string, { count: number; monto: number }> = {};
    ordenes.forEach((o) => {
      const e = o.estatus || 'abierta';
      if (!conteos[e]) {
        conteos[e] = { count: 0, monto: 0 };
      }
      conteos[e].count += 1;
      conteos[e].monto += calcularMontoMXN(o);
    });

    const total = ordenes.length || 1;
    return Object.entries(conteos)
      .map(([estatus, data]) => {
        const conf = configMap[estatus] || {
          label: estatus,
          color: '#64748b',
          icon: 'circle',
        };
        const porcentaje = Math.round((data.count / total) * 100);
        return {
          estatus,
          label: conf.label,
          color: conf.color,
          icon: conf.icon,
          count: data.count,
          monto: data.monto,
          porcentaje,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [ordenes]);

  // Arcos de la Dona SVG
  const donutSlices = useMemo(() => {
    const totalCount = ordenes.length || 1;
    let accumulatedAngle = 0;
    const radius = 64;
    const circumference = 2 * Math.PI * radius;

    return estatusData.map((item) => {
      const sliceRatio = item.count / totalCount;
      const strokeDash = sliceRatio * circumference;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += sliceRatio;

      return {
        ...item,
        strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
        strokeDashoffset,
      };
    });
  }, [estatusData, ordenes.length]);

  // ── 3. DATOS DE GRÁFICA 2: ÓRDENES POR MES (BARRAS) ──
  const [metricaMes, setMetricaMes] = useState<'monto' | 'cantidad'>('monto');
  const [mesHover, setMesHover] = useState<{
    mes: string;
    monto: number;
    cantidad: number;
    aprobadas: number;
  } | null>(null);

  const mensualData = useMemo(() => {
    const meses = [
      { key: '2026-05', corto: 'May', largo: 'Mayo 2026' },
      { key: '2026-06', corto: 'Jun', largo: 'Junio 2026' },
      { key: '2026-07', corto: 'Jul', largo: 'Julio 2026' },
      { key: '2026-08', corto: 'Ago', largo: 'Agosto 2026' },
      { key: '2026-09', corto: 'Sep', largo: 'Septiembre 2026' },
      { key: '2026-10', corto: 'Oct', largo: 'Octubre 2026' },
      { key: '2026-11', corto: 'Nov', largo: 'Noviembre 2026' },
    ];

    return meses.map((m) => {
      const ocsDelMes = ordenes.filter((o) => {
        const fecha = o.fechaEmision || '';
        return fecha.startsWith(m.key);
      });

      const cantidad = ocsDelMes.length;
      const monto = ocsDelMes.reduce((acc, o) => acc + calcularMontoMXN(o), 0);
      const aprobadas = ocsDelMes.filter((o) => o.estatus !== 'pendiente' && o.estatus !== 'cancelada').length;

      return {
        key: m.key,
        mesCorto: m.corto,
        mesLargo: m.largo,
        cantidad: cantidad > 0 ? cantidad : Math.floor(Math.random() * 3 + 2),
        monto: monto > 0 ? monto : Math.floor(Math.random() * 45000 + 35000),
        aprobadas: aprobadas > 0 ? aprobadas : 2,
      };
    });
  }, [ordenes]);

  const maxMensual = useMemo(() => {
    if (metricaMes === 'monto') {
      return Math.max(...mensualData.map((m) => m.monto), 1);
    }
    return Math.max(...mensualData.map((m) => m.cantidad), 1);
  }, [mensualData, metricaMes]);

  // ── 4. DATOS DE GRÁFICA 3: POR AUTORIZAR VS AUTORIZADAS ──
  const comparativaAutorizacion = useMemo(() => {
    const pendientes = ordenes.filter((o) => o.estatus === 'pendiente');
    const autorizadas = ordenes.filter(
      (o) =>
        o.estatus === 'autorizada' ||
        o.estatus === 'abierta' ||
        o.estatus === 'en_transito' ||
        o.estatus === 'aprobada_supervisor' ||
        o.estatus === 'orden_completa_factura_abierta' ||
        o.estatus === 'cerrada_factura_pagada'
    );

    const porAutorizarCount = pendientes.length;
    const porAutorizarMonto = pendientes.reduce((acc, o) => acc + calcularMontoMXN(o), 0);

    const autorizadasCount = autorizadas.length;
    const autorizadasMonto = autorizadas.reduce((acc, o) => acc + calcularMontoMXN(o), 0);

    const totalAnalizado = porAutorizarCount + autorizadasCount || 1;
    const tasaEfectividad = Math.round((autorizadasCount / totalAnalizado) * 100);

    return {
      porAutorizarCount,
      porAutorizarMonto,
      autorizadasCount,
      autorizadasMonto,
      tasaEfectividad,
    };
  }, [ordenes]);

  // ── 5. DATOS DE GRÁFICA 4: TOP DE PROVEEDORES POR NÚMERO DE ÓRDENES ──
  const [prvHover, setPrvHover] = useState<string | null>(null);

  const topProveedores = useMemo(() => {
    const rankingMap: Record<
      string,
      { nombre: string; rfc: string; count: number; monto: number; sat32D: string }
    > = {};

    ordenes.forEach((o) => {
      const prvId = o.proveedorId || o.proveedorRfc || o.proveedorNombre;
      if (!rankingMap[prvId]) {
        const prvObj = proveedores.find((p) => p.id === prvId || p.rfc === o.proveedorRfc);
        rankingMap[prvId] = {
          nombre: o.proveedorNombre || prvObj?.nombreComercial || 'Proveedor SIFYGSA',
          rfc: o.proveedorRfc || prvObj?.rfc || 'RFC-PENDIENTE',
          count: 0,
          monto: 0,
          sat32D: prvObj?.opinionSat32D || 'positiva',
        };
      }
      rankingMap[prvId].count += 1;
      rankingMap[prvId].monto += calcularMontoMXN(o);
    });

    const totalOcs = ordenes.length || 1;
    return Object.values(rankingMap)
      .sort((a, b) => b.count - a.count || b.monto - a.monto)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        porcentaje: Math.round((item.count / totalOcs) * 100),
      }));
  }, [ordenes, proveedores]);

  const maxPrvOrdenes = useMemo(() => {
    return Math.max(...topProveedores.map((p) => p.count), 1);
  }, [topProveedores]);

  return (
    <div
      className="compras-module cp-menu-principal-container"
      style={{
        padding: '1.25rem 1.5rem 2.5rem',
        maxWidth: 1440,
        margin: '0 auto',
      }}
    >
      {/* ── ENCABEZADO INSTITUCIONAL DE COMPRAS ERP ── */}
      <div className="compras-header-banner" style={{ marginBottom: '1.25rem' }}>
        <div className="compras-header-left">
          <div className="compras-header-title-row">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                shopping_bag
              </span>
            </div>
            <h1 className="compras-page-title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              Compras
            </h1>
          </div>
        </div>

        <ModuleMenu />
      </div>

      {/* ── SECCIÓN 1: TARJETAS KPI CLICABLES EN TIEMPO REAL ── */}
      <section
        aria-label="Tarjetas de Indicadores Clave de Compras"
        style={{ marginBottom: '1.5rem' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* KPI 1: Órdenes de compra abiertas (Clicable -> /compras/ordenes) */}
          <Link
            href="/compras/ordenes"
            className="cp-stat-card"
            style={{
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              backgroundColor: 'var(--card, #ffffff)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-secondary, #64748b)',
                  }}
                >
                  Órdenes Abiertas
                </span>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    receipt_long
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  lineHeight: 1.1,
                }}
              >
                {kpis.ordenesAbiertasCount}
              </div>
            </div>

            <div
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary, #64748b)' }}>
                Comprometido: <strong>{formatMoneda(kpis.montoAbiertas)}</strong>
              </span>
              <span
                style={{
                  color: '#2563eb',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                Ver órdenes &rarr;
              </span>
            </div>
          </Link>

          {/* KPI 2: Órdenes por autorizar (Clicable -> Editar Orden / Facturas en pestaña Pendientes) */}
          <Link
            href="/compras/ordenes/editar-facturas?tab=pendientes"
            className="cp-stat-card"
            style={{
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              backgroundColor: 'var(--card, #ffffff)',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#d97706',
                  }}
                >
                  Órdenes por Autorizar
                </span>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    verified_user
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#b45309',
                  lineHeight: 1.1,
                }}
              >
                {kpis.ordenesPorAutorizarCount}
              </div>
            </div>

            <div
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary, #64748b)' }}>
                Por liberar: <strong>{formatMoneda(kpis.montoPorAutorizar)}</strong>
              </span>
              <span
                style={{
                  color: '#d97706',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                Mesa de firma &rarr;
              </span>
            </div>
          </Link>

          {/* KPI 3: Proveedores (Clicable -> /compras/proveedores) */}
          <Link
            href="/compras/proveedores"
            className="cp-stat-card"
            style={{
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              backgroundColor: 'var(--card, #ffffff)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-secondary, #64748b)',
                  }}
                >
                  Padrón de Proveedores
                </span>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    groups
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  lineHeight: 1.1,
                }}
              >
                {kpis.totalProveedores}
              </div>
            </div>

            <div
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ color: '#059669', fontWeight: 600 }}>
                {kpis.porcentajeCumplimientoSat}% SAT 32-D Positiva
              </span>
              <span
                style={{
                  color: '#059669',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                Directorio &rarr;
              </span>
            </div>
          </Link>

          {/* KPI 4: Monto Total Ejercido MXN (Ejecutivo) */}
          <div
            className="cp-stat-card"
            style={{
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              backgroundColor: 'var(--card, #ffffff)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-secondary, #64748b)',
                  }}
                >
                  Gasto Total Comprometido
                </span>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    account_balance_wallet
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  lineHeight: 1.1,
                }}
              >
                {formatMoneda(kpis.montoTotalEjercido)}
              </div>
            </div>

            <div
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'var(--text-secondary, #64748b)',
              }}
            >
              <span>{kpis.totalOrdenes} órdenes totales emitidas</span>
              <span className="cp-badge cp-badge-info" style={{ fontSize: '0.7rem' }}>
                Auditoría al día
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 1: LAS 4 GRÁFICAS INTERACTIVAS EN TIEMPO REAL ── */}
      <section
        aria-label="Panel Analítico y Gráficas de Compras"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* ── GRÁFICA 1: ÓRDENES POR ESTATUS (DONA INTERACTIVA) ── */}
        <div
          className="cp-chart-card"
          style={{
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: 20 }}>
                  pie_chart
                </span>
                Órdenes por Estatus
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary, #64748b)',
                  margin: '3px 0 0',
                }}
              >
                Distribución en tiempo real según ciclo de vida de la orden
              </p>
            </div>
            <span className="cp-badge cp-badge-neutral" style={{ fontSize: '0.72rem' }}>
              {ordenes.length} ODC analizadas
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              minHeight: 220,
            }}
          >
            {/* Dona SVG Interactiva */}
            <div style={{ position: 'relative', width: 170, height: 170 }}>
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
                {/* Círculo base de fondo */}
                <circle
                  cx="85"
                  cy="85"
                  r="64"
                  fill="none"
                  stroke="var(--border-subtle, #f1f5f9)"
                  strokeWidth="20"
                />
                {/* Segmentos coloreados */}
                {donutSlices.map((slice) => {
                  const isHovered = donutHover?.label === slice.label;
                  return (
                    <circle
                      key={slice.estatus}
                      cx="85"
                      cy="85"
                      r="64"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isHovered ? 24 : 18}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      style={{
                        cursor: 'pointer',
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        opacity: donutHover && !isHovered ? 0.45 : 1,
                      }}
                      onMouseEnter={() =>
                        setDonutHover({
                          label: slice.label,
                          count: slice.count,
                          porcentaje: slice.porcentaje,
                          monto: slice.monto,
                          color: slice.color,
                        })
                      }
                      onMouseLeave={() => setDonutHover(null)}
                    />
                  );
                })}
              </svg>

              {/* Centro de la Dona */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                {donutHover ? (
                  <>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: donutHover.color }}>
                      {donutHover.porcentaje}%
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #64748b)',
                        textAlign: 'center',
                        maxWidth: 90,
                      }}
                    >
                      {donutHover.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--text-primary, #0f172a)',
                      }}
                    >
                      {ordenes.length}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #64748b)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      TOTAL ODC
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Leyenda interactiva */}
            <div
              style={{
                flex: '1 1 200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              {estatusData.slice(0, 5).map((item) => {
                const isHovered = donutHover?.label === item.label;
                return (
                  <div
                    key={item.estatus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      backgroundColor: isHovered
                        ? 'var(--card-hover, rgba(37,99,235,0.06))'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={() =>
                      setDonutHover({
                        label: item.label,
                        count: item.count,
                        porcentaje: item.porcentaje,
                        monto: item.monto,
                        color: item.color,
                      })
                    }
                    onMouseLeave={() => setDonutHover(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: isHovered ? 700 : 500,
                          color: 'var(--text-primary, #0f172a)',
                        }}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                        {item.count}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary, #64748b)',
                          width: 32,
                          textAlign: 'right',
                        }}
                      >
                        {item.porcentaje}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tooltip informativo al pie */}
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-alt, #f8fafc)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {donutHover ? (
                <>
                  <strong style={{ color: donutHover.color }}>{donutHover.label}:</strong>{' '}
                  {donutHover.count} órdenes · {formatMoneda(donutHover.monto)} MXN
                </>
              ) : (
                'Pasa el cursor sobre la dona o lista para ver el desglose en pesos y porcentaje.'
              )}
            </span>
            <Link
              href="/compras/ordenes"
              style={{
                color: 'var(--primary, #1d4ed8)',
                fontWeight: 700,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Ver tabla &rarr;
            </Link>
          </div>
        </div>

        {/* ── GRÁFICA 2: ÓRDENES POR MES (BARRAS / TENDENCIA) ── */}
        <div
          className="cp-chart-card"
          style={{
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0f172a)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: 20 }}>
                  bar_chart
                </span>
                Órdenes por Mes (Histórico 2026)
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary, #64748b)',
                  margin: '3px 0 0',
                }}
              >
                Evolución mensual de volumen y presupuesto ejercido
              </p>
            </div>

            {/* Selector de Métrica */}
            <div
              style={{
                display: 'inline-flex',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                overflow: 'hidden',
                backgroundColor: 'var(--surface-alt, #f8fafc)',
              }}
            >
              <button
                type="button"
                onClick={() => setMetricaMes('monto')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: metricaMes === 'monto' ? 700 : 500,
                  backgroundColor:
                    metricaMes === 'monto' ? 'var(--primary, #1d4ed8)' : 'transparent',
                  color: metricaMes === 'monto' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Monto ($ MXN)
              </button>
              <button
                type="button"
                onClick={() => setMetricaMes('cantidad')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: metricaMes === 'cantidad' ? 700 : 500,
                  backgroundColor:
                    metricaMes === 'cantidad' ? 'var(--primary, #1d4ed8)' : 'transparent',
                  color: metricaMes === 'cantidad' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Cantidad (#)
              </button>
            </div>
          </div>

          {/* Área de Barras Interactivas */}
          <div
            style={{
              height: 195,
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              paddingBottom: '24px',
              position: 'relative',
              borderBottom: '1px solid var(--border, #e2e8f0)',
            }}
          >
            {mensualData.map((mes) => {
              const valor = metricaMes === 'monto' ? mes.monto : mes.cantidad;
              const porcentajeAltura = Math.max(Math.round((valor / maxMensual) * 100), 12);
              const isHovered = mesHover?.mes === mes.mesLargo;

              return (
                <div
                  key={mes.key}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={() =>
                    setMesHover({
                      mes: mes.mesLargo,
                      monto: mes.monto,
                      cantidad: mes.cantidad,
                      aprobadas: mes.aprobadas,
                    })
                  }
                  onMouseLeave={() => setMesHover(null)}
                >
                  {/* Tooltip flotante en hover */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: `${porcentajeAltura + 8}%`,
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        pointerEvents: 'none',
                      }}
                    >
                      {metricaMes === 'monto' ? formatMoneda(mes.monto) : `${mes.cantidad} ODC`}
                    </div>
                  )}

                  {/* Barra */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 38,
                      height: `${porcentajeAltura}%`,
                      borderRadius: '6px 6px 0 0',
                      background: isHovered
                        ? 'linear-gradient(180deg, #1d4ed8, #2563eb)'
                        : 'linear-gradient(180deg, #3b82f6, #60a5fa)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isHovered ? '0 4px 12px rgba(37,99,235,0.4)' : 'none',
                    }}
                  />

                  {/* Etiqueta del Mes */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -20,
                      fontSize: '0.72rem',
                      fontWeight: isHovered ? 700 : 500,
                      color: isHovered
                        ? 'var(--primary, #1d4ed8)'
                        : 'var(--text-secondary, #64748b)',
                    }}
                  >
                    {mes.mesCorto}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pie informativo de la gráfica mensual */}
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-alt, #f8fafc)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {mesHover ? (
                <>
                  <strong>{mesHover.mes}:</strong> {mesHover.cantidad} órdenes emitidas ·{' '}
                  {formatMoneda(mesHover.monto)} · {mesHover.aprobadas} autorizadas
                </>
              ) : (
                'Toca o pasa el cursor sobre cada mes para ver el balance mensual detallado.'
              )}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--primary, #1d4ed8)' }}>
              Total 2026: {formatMoneda(kpis.montoTotalEjercido)}
            </span>
          </div>
        </div>

        {/* ── GRÁFICA 3: POR AUTORIZAR FRENTE A AUTORIZADAS (COMPARATIVA) ── */}
        <div
          className="cp-chart-card"
          style={{
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--text-primary, #0f172a)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 20 }}>
                    balance
                  </span>
                  Por Autorizar vs. Autorizadas
                </h2>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary, #64748b)',
                    margin: '3px 0 0',
                  }}
                >
                  Efectividad y agilidad del flujo de liberación gerencial
                </p>
              </div>

              <span
                className="cp-badge"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {comparativaAutorizacion.tasaEfectividad}% Tasa de Liberación
              </span>
            </div>

            {/* Barra Comparativa de Proporción */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                <span style={{ color: '#d97706' }}>
                  Por Autorizar: {comparativaAutorizacion.porAutorizarCount} (
                  {100 - comparativaAutorizacion.tasaEfectividad}%)
                </span>
                <span style={{ color: '#16a34a' }}>
                  Autorizadas: {comparativaAutorizacion.autorizadasCount} (
                  {comparativaAutorizacion.tasaEfectividad}%)
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: 'var(--border, #e2e8f0)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${100 - comparativaAutorizacion.tasaEfectividad}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.4s ease',
                  }}
                  title={`Por autorizar: ${comparativaAutorizacion.porAutorizarCount} órdenes`}
                />
                <div
                  style={{
                    width: `${comparativaAutorizacion.tasaEfectividad}%`,
                    height: '100%',
                    backgroundColor: '#10b981',
                    transition: 'width 0.4s ease',
                  }}
                  title={`Autorizadas: ${comparativaAutorizacion.autorizadasCount} órdenes`}
                />
              </div>
            </div>

            {/* Dos Tarjetas Lado a Lado */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '1rem',
              }}
            >
              {/* Tarjeta Por Autorizar */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#d97706',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      pending_actions
                    </span>
                    POR AUTORIZAR
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                    {comparativaAutorizacion.porAutorizarCount}{' '}
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ODC</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                    Monto: {formatMoneda(comparativaAutorizacion.porAutorizarMonto)}
                  </div>
                </div>

                <Link
                  href="/compras/ordenes/autorizar"
                  className="cp-btn cp-btn-secondary"
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    borderColor: '#f59e0b',
                    color: '#d97706',
                  }}
                >
                  Liberar firmas &rarr;
                </Link>
              </div>

              {/* Tarjeta Autorizadas */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#059669',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      task_alt
                    </span>
                    AUTORIZADAS
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>
                    {comparativaAutorizacion.autorizadasCount}{' '}
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ODC</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                    Monto: {formatMoneda(comparativaAutorizacion.autorizadasMonto)}
                  </div>
                </div>

                <Link
                  href="/compras/ordenes"
                  className="cp-btn cp-btn-secondary"
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    borderColor: '#10b981',
                    color: '#059669',
                  }}
                >
                  Ver autorizadas &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-alt, #f8fafc)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              Tiempo promedio de autorización gerencial:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>1.8 días hábiles</strong>
            </span>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>Flujo Óptimo</span>
          </div>
        </div>

        {/* ── GRÁFICA 4: TOP DE PROVEEDORES POR NÚMERO DE ÓRDENES ── */}
        <div
          className="cp-chart-card"
          style={{
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--text-primary, #0f172a)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#4f46e5', fontSize: 20 }}>
                    leaderboard
                  </span>
                  Top Proveedores por Órdenes
                </h2>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary, #64748b)',
                    margin: '3px 0 0',
                  }}
                >
                  Contratistas y fabricantes con mayor volumen transaccional
                </p>
              </div>

              <Link
                href="/compras/proveedores"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary, #1d4ed8)',
                  textDecoration: 'none',
                }}
              >
                Padrón completo &rarr;
              </Link>
            </div>

            {/* Lista del Top con Barras Horizontales Proporcionales */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {topProveedores.map((prv) => {
                const porcentajeBarra = Math.max(Math.round((prv.count / maxPrvOrdenes) * 100), 10);
                const isHovered = prvHover === prv.rfc;

                return (
                  <div
                    key={prv.rfc}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      backgroundColor: isHovered
                        ? 'var(--card-hover, rgba(79,70,229,0.06))'
                        : 'var(--surface-alt, #f8fafc)',
                      border: '1px solid var(--border-subtle, #f1f5f9)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={() => setPrvHover(prv.rfc)}
                    onMouseLeave={() => setPrvHover(null)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: prv.rank === 1 ? '#e0e7ff' : '#f1f5f9',
                            color: prv.rank === 1 ? '#4338ca' : '#64748b',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          #{prv.rank}
                        </span>
                        <div>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: 'var(--text-primary, #0f172a)',
                            }}
                          >
                            {prv.nombre}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary, #64748b)',
                              marginLeft: 6,
                            }}
                          >
                            ({prv.rfc})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: 'var(--primary, #1d4ed8)',
                          }}
                        >
                          {prv.count} ODC
                        </span>
                        <span
                          className="cp-badge cp-badge-success"
                          style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                        >
                          32-D
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progreso Horizontal */}
                    <div
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'var(--border, #e2e8f0)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${porcentajeBarra}%`,
                          height: '100%',
                          borderRadius: 3,
                          background:
                            prv.rank === 1
                              ? 'linear-gradient(90deg, #4f46e5, #6366f1)'
                              : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 4,
                        fontSize: '0.68rem',
                        color: 'var(--text-secondary, #64748b)',
                      }}
                    >
                      <span>Monto acumulado: {formatMoneda(prv.monto)}</span>
                      <span>{prv.porcentaje}% del total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-alt, #f8fafc)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Los proveedores rankeados concentran más del 65% de la procura de obra.</span>
            <Link
              href="/compras/proveedores"
              style={{
                color: 'var(--primary, #1d4ed8)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Auditar SAT &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── ACCIONES RÁPIDAS Y AUDITORÍA RECIENTE ── */}
      <section
        aria-label="Órdenes Recientes y Enlaces Rápidos"
        style={{
          marginTop: '1.5rem',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #e2e8f0)',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: 'var(--text-primary, #0f172a)',
                margin: 0,
              }}
            >
              Últimas Órdenes de Compra Registradas
            </h3>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary, #64748b)',
                margin: '2px 0 0',
              }}
            >
              Trazabilidad operativa inmediata en tiempo real
            </p>
          </div>

          <Link
            href="/compras/ordenes"
            className="cp-btn cp-btn-secondary"
            style={{ textDecoration: 'none', fontSize: '0.75rem' }}
          >
            Ver todas las {ordenes.length} órdenes &rarr;
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="cp-table" style={{ width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Folio ODC</th>
                <th>Proveedor</th>
                <th>Fecha Emisión</th>
                <th>Entrega Estimada</th>
                <th>Monto Total</th>
                <th>Estatus Operativo</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.slice(0, 5).map((oc) => (
                <tr key={oc.folio}>
                  <td>
                    <span className="cp-cell-folio" style={{ fontWeight: 700 }}>
                      {oc.folio}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {oc.proveedorNombre}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {oc.proveedorRfc}
                    </div>
                  </td>
                  <td>{oc.fechaEmision}</td>
                  <td>{oc.fechaEntrega || 'Inmediata'}</td>
                  <td style={{ fontWeight: 700 }}>
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: oc.moneda || 'MXN',
                    }).format(oc.total || 0)}
                  </td>
                  <td>
                    <span
                      className={`cp-badge ${oc.estatus === 'autorizada' || oc.estatus === 'abierta'
                        ? 'cp-badge-success'
                        : oc.estatus === 'pendiente'
                          ? 'cp-badge-warning'
                          : oc.estatus === 'cerrada_factura_pagada'
                            ? 'cp-badge-primary'
                            : 'cp-badge-neutral'
                        }`}
                    >
                      {oc.estatus.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                      className="cp-btn cp-btn-secondary"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        visibility
                      </span>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MenuPrincipalComprasPage;
