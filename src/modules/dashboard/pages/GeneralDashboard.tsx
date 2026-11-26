'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RolUsuario } from '@/config/types';
import { tienePermiso } from '@/lib/permissions';
import {
  INITIAL_CRM_CLIENTS,
  INITIAL_STITCH_OPPORTUNITIES,
  type CrmClientContact,
  type StitchOpportunity,
} from '@/modules/crm/components/stitchCrmData';
import '../dashboard.css';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';

const CLIENTES_STORAGE_KEY = 'sfg_crm_registered_clients_v1';

interface ResumenFolioApi {
  folio: string;
  movimientos: number;
  clientePromesa?: string;
  nombrePromesa?: string;
  ultimoMovimiento?: string;
}

interface PromesaDashboardItem extends StitchOpportunity {
  movimientosBitacora: number;
  ultimoMovimiento?: string;
}

interface RankingClienteItem {
  id: string;
  tagCode: string;
  tagDanger?: boolean;
  companyName: string;
  shortName: string;
  sector: string;
  zone: string;
  promesasCount: number;
  movimientosBitacora: number;
  movimientosTotales: number;
  pipelineAmount: number;
  topFolio?: string;
  ultimoMovimiento?: string;
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function acortarNombreCliente(nombre: string): string {
  const mapaCorto: Record<string, string> = {
    'CFE Generación VI': 'CFE Gen. VI',
    'Braskem Idesa Nanchital': 'Braskem Idesa',
    'Pemex Exploración y Prod.': 'Pemex PEP',
    'Ternium Planta Pesquería': 'Ternium',
    'ICA Fluor Daniel S.A.': 'ICA Fluor',
    'Pemex Logística Tanques': 'Pemex Logíst.',
    'Techint Ingeniería & Const.': 'Techint Ing.',
    'Pemex Transformación Industrial': 'Pemex Transf.',
    'ASIPONA Coatzacoalcos': 'ASIPONA',
    'CENAGAS Estación Compresora': 'CENAGAS',
  };
  if (mapaCorto[nombre]) return mapaCorto[nombre];
  return nombre.length > 13 ? `${nombre.slice(0, 12).trim()}…` : nombre;
}

function formatearMontoCompacto(monto: number): string {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`;
  if (monto >= 1_000) return `$${Math.round(monto / 1_000)}k`;
  return `$${monto.toLocaleString('es-MX')}`;
}

function obtenerEtapaVisual(stage: string): { label: string; tone: string } {
  const s = stage.toLowerCase();
  if (s.includes('ganada') || s.includes('adjudicada')) return { label: 'Ganada', tone: 'green' };
  if (s.includes('negociaci')) return { label: 'Negociación', tone: 'amber' };
  if (s.includes('propuesta')) return { label: 'Propuesta', tone: 'indigo' };
  if (s.includes('calificaci')) return { label: 'Calificación', tone: 'cyan' };
  return { label: 'Prospección', tone: 'blue' };
}

interface GeneralDashboardProps {
  onNavigateModule?: (moduleId: string, subItemId?: string) => void;
  rolUsuario?: RolUsuario;
}

export const GeneralDashboard: React.FC<GeneralDashboardProps> = ({
  onNavigateModule: onNavigateProp,
  rolUsuario = 'administrador',
}) => {
  const puedeAutorizarOrdenes = tienePermiso(rolUsuario, 'autorizacion-ordenes', 'aprobar');
  const router = useRouter();
  const [vistaListaCrm, setVistaListaCrm] = useState<'promesas' | 'clientes'>('promesas');
  const [clientesCatalogo, setClientesCatalogo] = useState<CrmClientContact[]>(INITIAL_CRM_CLIENTS);
  const [movimientosPorFolio, setMovimientosPorFolio] = useState<Record<string, ResumenFolioApi>>({});
  const [origenBitacora, setOrigenBitacora] = useState<'mongodb' | 'json' | null>(null);
  const [totalMovimientosBitacora, setTotalMovimientosBitacora] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLIENTES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CrmClientContact[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(INITIAL_CRM_CLIENTS.map((c) => c.id));
          const extras = parsed.filter((c) => c && c.id && !ids.has(c.id));
          if (extras.length > 0) {
            setClientesCatalogo([...extras, ...INITIAL_CRM_CLIENTS]);
          }
        }
      }
    } catch {
      // Ignorar localStorage corrupto o restringido
    }

    let activo = true;
    fetch('/api/crm/ranking-clientes', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!activo || !json?.exito || !json?.datos) return;
        const mapa: Record<string, ResumenFolioApi> = {};
        const lista = Array.isArray(json.datos.porFolio)
          ? (json.datos.porFolio as ResumenFolioApi[])
          : [];
        for (const item of lista) {
          if (item?.folio) mapa[item.folio] = item;
        }
        setMovimientosPorFolio(mapa);
        setOrigenBitacora(json.datos.origen ?? json.origen ?? null);
        setTotalMovimientosBitacora(Number(json.datos.totalMovimientos ?? 0));
      })
      .catch(() => {
        // Si el backend no responde todavía, continuar con métricas base de CRM
      });

    return () => {
      activo = false;
    };
  }, []);

  const promesasEnriquecidas = useMemo<PromesaDashboardItem[]>(() => {
    return INITIAL_STITCH_OPPORTUNITIES.map((opp) => {
      const stats = movimientosPorFolio[opp.folio];
      return {
        ...opp,
        movimientosBitacora: stats?.movimientos ?? 0,
        ultimoMovimiento: stats?.ultimoMovimiento,
      };
    }).sort((a, b) => {
      if (b.movimientosBitacora !== a.movimientosBitacora) {
        return b.movimientosBitacora - a.movimientosBitacora;
      }
      return b.amount - a.amount;
    });
  }, [movimientosPorFolio]);

  const rankingClientes = useMemo<RankingClienteItem[]>(() => {
    const mapaOppsPorFolio = new Map<string, StitchOpportunity>();
    for (const opp of INITIAL_STITCH_OPPORTUNITIES) {
      mapaOppsPorFolio.set(opp.folio, opp);
    }

    // Mapeo de movimientos reales de bitácora por cliente normalizado
    const bitacoraPorCliente = new Map<
      string,
      { movimientos: number; topFolio?: string; topFolioMovs: number; ultimoMovimiento?: string }
    >();

    for (const item of Object.values(movimientosPorFolio)) {
      const opp = mapaOppsPorFolio.get(item.folio);
      const nombreCliente = opp?.client || item.clientePromesa;
      if (!nombreCliente) continue;
      const clave = normalizarTexto(nombreCliente);
      const actual = bitacoraPorCliente.get(clave) ?? {
        movimientos: 0,
        topFolioMovs: -1,
      };
      actual.movimientos += item.movimientos;
      if (item.movimientos > actual.topFolioMovs) {
        actual.topFolioMovs = item.movimientos;
        actual.topFolio = item.folio;
      }
      if (!actual.ultimoMovimiento && item.ultimoMovimiento) {
        actual.ultimoMovimiento = item.ultimoMovimiento;
      }
      bitacoraPorCliente.set(clave, actual);
    }

    return clientesCatalogo
      .map((cli) => {
        const claveCli = normalizarTexto(cli.companyName);
        const oppsCliente = INITIAL_STITCH_OPPORTUNITIES.filter((opp) => {
          const claveOpp = normalizarTexto(opp.client);
          return (
            claveOpp === claveCli ||
            (cli.tagCode === 'TCH' && claveOpp.includes('techint') && claveCli.includes('techint'))
          );
        });

        let movBitacora = bitacoraPorCliente.get(claveCli)?.movimientos ?? 0;
        let topFolio = bitacoraPorCliente.get(claveCli)?.topFolio;
        let ultimoMovimiento = bitacoraPorCliente.get(claveCli)?.ultimoMovimiento;

        // También sumar folios vinculados si el nombre de la oportunidad difiere levemente (ej. Techint)
        for (const opp of oppsCliente) {
          const claveOpp = normalizarTexto(opp.client);
          if (claveOpp !== claveCli) {
            const extra = bitacoraPorCliente.get(claveOpp);
            if (extra) {
              movBitacora += extra.movimientos;
              if (!topFolio) topFolio = extra.topFolio;
              if (!ultimoMovimiento) ultimoMovimiento = extra.ultimoMovimiento;
            }
          }
        }

        if (!topFolio && oppsCliente.length > 0) {
          topFolio = oppsCliente[0].folio;
        }

        const promesasCount = Math.max(cli.activeOppsCount, oppsCliente.length);
        const movimientosTotales = movBitacora + promesasCount;
        const pipelineCalculado =
          oppsCliente.reduce((acc, o) => acc + o.amount, 0) || cli.totalPipelineAmount;

        return {
          id: cli.id,
          tagCode: cli.tagCode,
          tagDanger: oppsCliente.some((o) => o.tagDanger),
          companyName: cli.companyName,
          shortName: acortarNombreCliente(cli.companyName),
          sector: cli.sector,
          zone: cli.zone,
          promesasCount,
          movimientosBitacora: movBitacora,
          movimientosTotales,
          pipelineAmount: Math.max(cli.totalPipelineAmount, pipelineCalculado),
          topFolio,
          ultimoMovimiento,
        };
      })
      .sort((a, b) => {
        if (b.movimientosTotales !== a.movimientosTotales) {
          return b.movimientosTotales - a.movimientosTotales;
        }
        if (b.movimientosBitacora !== a.movimientosBitacora) {
          return b.movimientosBitacora - a.movimientosBitacora;
        }
        return b.pipelineAmount - a.pipelineAmount;
      });
  }, [clientesCatalogo, movimientosPorFolio]);

  const totalCarteraPromesas = useMemo(
    () => promesasEnriquecidas.reduce((acc, p) => acc + p.amount, 0),
    [promesasEnriquecidas]
  );

  const top1Cliente = rankingClientes[0];
  const top2Cliente = rankingClientes[1];
  const top3Cliente = rankingClientes[2];
  const clientesSecundarios = rankingClientes.slice(3, 5);
  const maxMovimientosRanking = Math.max(top1Cliente?.movimientosTotales ?? 1, 1);

  const abrirPromesaDetalle = (folio?: string) => {
    if (folio) {
      router.push(`/crm?sub=crm-opportunity-detail&folio=${encodeURIComponent(folio)}`);
    } else {
      onNavigateModule('crm', 'crm-clientes');
    }
  };

  const onNavigateModule = (moduleId: string, subItemId?: string) => {
    if (onNavigateProp) {
      onNavigateProp(moduleId, subItemId);
      return;
    }
    if (moduleId === 'crm') router.push(subItemId ? `/crm?sub=${subItemId}` : '/crm');
    else if (moduleId === 'compras') router.push(subItemId ? `/requisiciones?sub=${subItemId}` : '/requisiciones');
    else if (moduleId === 'rh') router.push(subItemId ? `/rrhh?sub=${subItemId}` : '/rrhh');
    else if (moduleId === 'almacen') router.push(subItemId ? `/almacen/${subItemId}` : '/almacen');
    else if (moduleId === 'settings') router.push('/ajustes');
  };
  const { t } = useLanguage();
  const { theme } = useTheme();
  return (
    <div className="gemini-dashboard-container" data-theme={theme} key={theme}>
      {/* SECTION A: 6 KPI METRICS CARDS */}
      <section className="kpi-metrics-grid">
        {/* KPI 1: KPIS */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateModule('crm', 'crm-opportunities')}
          title={t('dashboard.tooltip_crm')}
        >
          <div className="kpi-card-header">
            <span className="kpi-label">{t('dashboard.kpi_opportunities')}</span>
            <div className="kpi-icon-container orange">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">$120,400</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$120,400 MRR</span>
              <span className="trend-badge positive">+16% ↑</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Users */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">{t('dashboard.kpi_total_users')}</span>
            <div className="kpi-icon-container cyan">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">239</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$12,491 Users</span>
              <span className="trend-badge positive">+16% ↑</span>
            </div>
          </div>
        </div>

        {/* KPI 3: New MRR */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">{t('dashboard.kpi_new_mrr')}</span>
            <div className="kpi-icon-container amber">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">134</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$1.00 MRR</span>
              <span className="trend-badge negative">-3%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">{t('dashboard.kpi_total')}</span>
            <div className="kpi-icon-container emerald">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">323</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$22.72 Change</span>
              <span className="trend-badge negative">-3%</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Active Projects */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateModule('crm', 'crm-kanban')}
          title={t('dashboard.tooltip_kanban')}
        >
          <div className="kpi-card-header">
            <span className="kpi-label">{t('dashboard.kpi_active_projects')}</span>
            <div className="kpi-icon-container blue">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">40</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">33% Average</span>
              <span className="trend-badge neutral">^ 0%</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Team Projects */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">{t('dashboard.kpi_team_projects')}</span>
            <div className="kpi-icon-container purple">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">41</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$119,000 MRR</span>
              <span className="trend-badge negative">-6%</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: MIDDLE ROW CHARTS & OPERATIONAL TASKS */}
      <section className="middle-charts-grid">
        {/* Monthly Revenue Trend */}
        <div className="dashboard-portlet-card span-5">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">{t('dashboard.revenue_trend_title')}</h3>
            <span className="portlet-tag-mono">2024 (USD)</span>
          </div>

          <div className="bar-chart-container">
            {/* Y Axis */}
            <div className="chart-y-axis">
              <span>2500</span>
              <span>2000</span>
              <span>1500</span>
              <span>1000</span>
              <span>500</span>
              <span>0</span>
            </div>

            {/* Bars Area */}
            <div className="chart-bars-wrap">
              <div className="chart-grid-backdrop">
                <div className="grid-h-line" />
                <div className="grid-h-line" />
                <div className="grid-h-line" />
                <div className="grid-h-line" />
                <div className="grid-h-line" />
              </div>

              <div className="chart-bars-row">
                <div className="month-bars-group" title="Jul">
                  <div className="bar-item gray" style={{ height: '36%' }} />
                  <div className="bar-item orange" style={{ height: '54%' }} />
                </div>
                <div className="month-bars-group" title="Aug">
                  <div className="bar-item gray" style={{ height: '28%' }} />
                  <div className="bar-item cyan" style={{ height: '62%' }} />
                </div>
                <div className="month-bars-group" title="Sep">
                  <div className="bar-item gray" style={{ height: '70%' }} />
                  <div className="bar-item orange" style={{ height: '80%' }} />
                </div>
                <div className="month-bars-group" title="Oct">
                  <div className="bar-item gray" style={{ height: '52%' }} />
                  <div className="bar-item amber" style={{ height: '68%' }} />
                </div>
                <div className="month-bars-group" title="Nov">
                  <div className="bar-item gray" style={{ height: '85%' }} />
                  <div className="bar-item orange" style={{ height: '94%' }} />
                </div>
                <div className="month-bars-group" title="Dec">
                  <div className="bar-item gray" style={{ height: '60%' }} />
                  <div className="bar-item cyan" style={{ height: '98%' }} />
                </div>
              </div>

              {/* X Axis */}
              <div className="chart-x-axis">
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion 73% Donut */}
        <div className="dashboard-portlet-card span-3 align-center">
          <div className="portlet-card-header full-w">
            <span className="portlet-title-text">{t('dashboard.completion_title')}</span>
            <span className="portlet-tag-mono">ACTIVE</span>
          </div>

          <div className="donut-gauge-wrapper">
            <svg className="donut-svg" viewBox="0 0 36 36">
              <path
                className="donut-bg-track"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="donut-progress-fill"
                strokeDasharray="73, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="donut-center-label">
              <span className="donut-percent-num">73%</span>
              <span className="donut-sub-text">{t('dashboard.completion_efficiency')}</span>
            </div>
          </div>

          <div className="donut-legend-bar">
            <span className="legend-entry">
              <span className="legend-dot orange" />
              <span>F&amp;G</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot cyan" />
              <span>Safety</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot gray" />
              <span>Audits</span>
            </span>
          </div>
        </div>

        {/* Operational Tasks */}
        <div className="dashboard-portlet-card span-4">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">{t('dashboard.tasks_title')}</h3>
            <span className="active-tasks-pill">5 {t('dashboard.tasks_active')}</span>
          </div>

          <div className="operational-tasks-table-wrap">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>{t('dashboard.tasks_col_tasks')}</th>
                  <th style={{ textAlign: 'center' }}>{t('dashboard.tasks_col_progress')}</th>
                  <th style={{ textAlign: 'center' }}>{t('dashboard.tasks_col_due')}</th>
                  <th style={{ textAlign: 'right' }}>{t('dashboard.tasks_col_status')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="task-title-cell" title="Task of valorikion">Task of valorikion</td>
                  <td className="center-cell green-text">100%</td>
                  <td className="center-cell mono-date">00/08/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle green">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Commoncorpoeition">Commoncorpoeition</td>
                  <td className="center-cell green-text">100%</td>
                  <td className="center-cell mono-date">00/08/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle green">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Scen traded test">Scen traded test</td>
                  <td className="center-cell amber-text">35%</td>
                  <td className="center-cell mono-date">00/09/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle gray">✕</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Task tolement">Task tolement</td>
                  <td className="center-cell cyan-text">35%</td>
                  <td className="center-cell mono-date">00/04/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle green">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Task te option">Task te option</td>
                  <td className="center-cell rose-text">15%</td>
                  <td className="center-cell mono-date">00/04/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle red">✕</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION C: BOTTOM ROW CRM PROMISES/CLIENTS LIST, CATEGORY SPLIT & CLIENT MOVEMENT RANKING */}
      <section className="bottom-charts-grid">
        {/* Lista de Promesas y Clientes CRM */}
        <div className="dashboard-portlet-card span-5">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">{t('dashboard.status_board_title')}</h3>
            <div className="crm-segmented-tabs" role="tablist" aria-label="Vista CRM">
              <button
                type="button"
                role="tab"
                aria-selected={vistaListaCrm === 'promesas'}
                className={`crm-seg-btn ${vistaListaCrm === 'promesas' ? 'active' : ''}`}
                onClick={() => setVistaListaCrm('promesas')}
              >
                <span>{t('dashboard.crm_tab_promises')}</span>
                <span className="crm-seg-count">{promesasEnriquecidas.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={vistaListaCrm === 'clientes'}
                className={`crm-seg-btn ${vistaListaCrm === 'clientes' ? 'active' : ''}`}
                onClick={() => setVistaListaCrm('clientes')}
              >
                <span>{t('dashboard.crm_tab_clients')}</span>
                <span className="crm-seg-count">{rankingClientes.length}</span>
              </button>
            </div>
          </div>

          <div className="crm-dash-list">
            {vistaListaCrm === 'promesas'
              ? promesasEnriquecidas.map((opp) => {
                  const etapa = obtenerEtapaVisual(opp.stage);
                  return (
                    <button
                      key={opp.folio}
                      type="button"
                      className="crm-dash-row"
                      onClick={() => abrirPromesaDetalle(opp.folio)}
                      title={`${opp.folio} · ${opp.client} — ${opp.title}`}
                    >
                      <div className="crm-dash-row-left">
                        <span className={`crm-dash-tag ${opp.tagDanger ? 'danger' : ''}`}>
                          {opp.tagCode}
                        </span>
                        <div className="crm-dash-info">
                          <span className="crm-dash-title">{opp.title}</span>
                          <div className="crm-dash-meta">
                            <span className="crm-dash-folio">{opp.folio}</span>
                            <span>•</span>
                            <span>{opp.client}</span>
                            <span className={`crm-stage-pill ${etapa.tone}`}>{etapa.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="crm-dash-row-right">
                        <span className="crm-dash-amount">{opp.amountFormatted}</span>
                        <span
                          className={`crm-mov-badge ${opp.movimientosBitacora > 0 ? 'active' : ''}`}
                        >
                          {opp.movimientosBitacora > 0
                            ? `${opp.movimientosBitacora} ${t('dashboard.movements_short')}`
                            : `${opp.probability}% prob.`}
                        </span>
                      </div>
                    </button>
                  );
                })
              : rankingClientes.map((cli) => (
                  <button
                    key={cli.id}
                    type="button"
                    className="crm-dash-row"
                    onClick={() => onNavigateModule('crm', 'crm-clientes')}
                    title={`${cli.companyName} · ${cli.sector} (${cli.zone})`}
                  >
                    <div className="crm-dash-row-left">
                      <span className={`crm-dash-tag ${cli.tagDanger ? 'danger' : ''}`}>
                        {cli.tagCode}
                      </span>
                      <div className="crm-dash-info">
                        <span className="crm-dash-title">{cli.companyName}</span>
                        <div className="crm-dash-meta">
                          <span>{cli.sector}</span>
                          <span>•</span>
                          <span>Zona {cli.zone}</span>
                          <span className="crm-stage-pill blue">
                            {cli.promesasCount}{' '}
                            {cli.promesasCount === 1 ? 'promesa' : 'promesas'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="crm-dash-row-right">
                      <span className="crm-dash-amount">
                        {formatearMontoCompacto(cli.pipelineAmount)}
                      </span>
                      <span
                        className={`crm-mov-badge ${cli.movimientosBitacora > 0 ? 'active' : ''}`}
                      >
                        {cli.movimientosTotales} {t('dashboard.movements_short')}
                      </span>
                    </div>
                  </button>
                ))}
          </div>

          <div className="crm-dash-footer">
            <span>
              {vistaListaCrm === 'promesas'
                ? `${promesasEnriquecidas.length} promesas · ${formatearMontoCompacto(totalCarteraPromesas)} MXN`
                : `${rankingClientes.length} clientes registrados en cartera`}
            </span>
            <button
              type="button"
              className="crm-dash-view-all"
              onClick={() =>
                onNavigateModule(
                  'crm',
                  vistaListaCrm === 'promesas' ? 'crm-opportunities' : 'crm-clientes'
                )
              }
            >
              <span>{t('dashboard.crm_view_all')}</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Category Split */}
        <div className="dashboard-portlet-card span-3 align-center">
          <div className="portlet-card-header full-w">
            <h3 className="portlet-title-text">{t('dashboard.category_split_title')}</h3>
            <span className="portlet-tag-mono">Segmented</span>
          </div>

          <div className="donut-gauge-wrapper">
            <svg className="pie-multi-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="var(--brand-700)" strokeDasharray="39 118" strokeDashoffset="0" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="var(--brand-500)" strokeDasharray="31 126" strokeDashoffset="-39" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="var(--brand-400)" strokeDasharray="28 129" strokeDashoffset="-70" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="var(--brand-300)" strokeDasharray="35 122" strokeDashoffset="-98" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="var(--brand-200)" strokeDasharray="24 133" strokeDashoffset="-133" strokeWidth="24" />
            </svg>
            <div className="pie-center-hole">
              <span className="pie-percent-text">100%</span>
            </div>
          </div>

          <div className="donut-legend-bar">
            <span className="legend-entry">
              <span className="legend-dot" style={{ backgroundColor: 'var(--brand-700)' }} />
              <span>F&amp;G</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot" style={{ backgroundColor: 'var(--brand-500)' }} />
              <span>Safety</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot" style={{ backgroundColor: 'var(--brand-300)' }} />
              <span>Audits</span>
            </span>
          </div>
        </div>

        {/* Ranking de Clientes con Más Movimiento */}
        <div className="dashboard-portlet-card span-4">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">{t('dashboard.team_leaders_title')}</h3>
            <span className="top-performer-pill">{t('dashboard.top_performer')}</span>
          </div>

          <div className="team-podium-stack">
            {/* Rank 2 */}
            {top2Cliente && (
              <div
                className="podium-pillar-col interactive"
                role="button"
                tabIndex={0}
                onClick={() => abrirPromesaDetalle(top2Cliente.topFolio)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') abrirPromesaDetalle(top2Cliente.topFolio);
                }}
                title={`${top2Cliente.companyName}: ${top2Cliente.movimientosBitacora} en bitácora + ${top2Cliente.promesasCount} promesas activas (${formatearMontoCompacto(top2Cliente.pipelineAmount)})`}
              >
                <div className="podium-avatar-circle u2">{top2Cliente.tagCode}</div>
                <div className="podium-block step-2">
                  <span className="rank-num">2</span>
                  <span className="podium-client-name">{top2Cliente.shortName}</span>
                  <span className="podium-mov-sub">
                    {top2Cliente.movimientosTotales} {t('dashboard.movements_short')}
                  </span>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {top1Cliente && (
              <div
                className="podium-pillar-col highest interactive"
                role="button"
                tabIndex={0}
                onClick={() => abrirPromesaDetalle(top1Cliente.topFolio)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') abrirPromesaDetalle(top1Cliente.topFolio);
                }}
                title={`${top1Cliente.companyName}: ${top1Cliente.movimientosBitacora} en bitácora + ${top1Cliente.promesasCount} promesas activas (${formatearMontoCompacto(top1Cliente.pipelineAmount)})`}
              >
                <div className="podium-crown-badge">👑</div>
                <div className="podium-avatar-circle js-leader">{top1Cliente.tagCode}</div>
                <div className="podium-block step-1">
                  <span className="rank-num orange">1</span>
                  <span className="podium-client-name">{top1Cliente.shortName}</span>
                  <span className="podium-mov-sub primary">
                    {top1Cliente.movimientosTotales} {t('dashboard.movements_short')}
                  </span>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {top3Cliente && (
              <div
                className="podium-pillar-col interactive"
                role="button"
                tabIndex={0}
                onClick={() => abrirPromesaDetalle(top3Cliente.topFolio)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') abrirPromesaDetalle(top3Cliente.topFolio);
                }}
                title={`${top3Cliente.companyName}: ${top3Cliente.movimientosBitacora} en bitácora + ${top3Cliente.promesasCount} promesas activas (${formatearMontoCompacto(top3Cliente.pipelineAmount)})`}
              >
                <div className="podium-avatar-circle u3">{top3Cliente.tagCode}</div>
                <div className="podium-block step-3">
                  <span className="rank-num">3</span>
                  <span className="podium-client-name">{top3Cliente.shortName}</span>
                  <span className="podium-mov-sub">
                    {top3Cliente.movimientosTotales} {t('dashboard.movements_short')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {clientesSecundarios.length > 0 && (
            <div className="client-ranking-mini-list">
              {clientesSecundarios.map((cli, idx) => {
                const porcentaje = Math.max(
                  18,
                  Math.round((cli.movimientosTotales / maxMovimientosRanking) * 100)
                );
                return (
                  <button
                    key={cli.id}
                    type="button"
                    className="client-ranking-mini-row"
                    onClick={() => abrirPromesaDetalle(cli.topFolio)}
                    title={`${cli.companyName}: ${cli.movimientosBitacora} en bitácora + ${cli.promesasCount} promesas`}
                  >
                    <span className="ranking-mini-pos">#{idx + 4}</span>
                    <span className="ranking-mini-name">{cli.companyName}</span>
                    <span className="ranking-mini-bar-track">
                      <span
                        className="ranking-mini-bar-fill"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </span>
                    <span className="ranking-mini-movs">
                      {cli.movimientosTotales} {t('dashboard.movements_short')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="podium-footer-note">
            {origenBitacora === 'mongodb' ? (
              <span>
                <span className="podium-live-dot" />
                {t('dashboard.leaderboard_synced_mongo')}
                {totalMovimientosBitacora > 0 ? ` · ${totalMovimientosBitacora} reg.` : ''}
              </span>
            ) : (
              <span>{t('dashboard.leaderboard_updated')}</span>
            )}
          </div>
        </div>
      </section>

      {puedeAutorizarOrdenes && (
        <section className="mt-4">
          <div
            onClick={() => router.push('/autorizacion-ordenes')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push('/autorizacion-ordenes');
            }}
            className="dashboard-portlet-card cursor-pointer flex items-center justify-between p-4 hover:shadow-md transition-all"
            style={{ borderLeft: '4px solid #d97706' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}
              >
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Autorización de Órdenes de Compra
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Mesa de Validación Gerencial · Firma digital, rechazo con motivo y liberación de ODC
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px]" style={{ color: '#d97706' }}>
              arrow_forward
            </span>
          </div>
        </section>
      )}
    </div>
  );
};

export default GeneralDashboard;
