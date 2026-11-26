'use client';

import React, { useState, useMemo } from 'react';
import type { RolUsuario, ZonaComercial } from '@/config/types';
import { INITIAL_LEADS_DATA } from './leadsCrmData';
import { WorldChoroplethMap } from './WorldChoroplethMap';

export interface LeadsCrmProps {
  rolUsuario?: RolUsuario;
  zonaUsuario?: ZonaComercial;
  onConvertLeadToOpportunity?: (payload: {
    leadFolio: string;
    oppFolio: string;
    title: string;
    client: string;
    contactName: string;
    email: string;
    phone: string;
    amount: number;
    zone: string;
    ownerName: string;
    ownerInitials: string;
    pendingManagerApproval: boolean;
  }) => void;
  onNavigateToPipeline?: (oppFolio?: string) => void;
}

type DashboardSection = 'leads' | 'flujo';
type PeriodFilter =
  | 'Últimos 7 días'
  | 'Últimos 30 días'
  | 'Trimestre Q4 2026'
  | 'Año 2026';
type MainChartType = 'line' | 'bar' | 'pie';
type GranularityType = 'Semanas' | 'Meses' | 'Trimestres';

export const LeadsCrm: React.FC<LeadsCrmProps> = ({
  onNavigateToPipeline,
}) => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('leads');
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('Últimos 30 días');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Main chart controls
  const [mainChartType, setMainChartType] = useState<MainChartType>('line');
  const [granularity, setGranularity] = useState<GranularityType>('Meses');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Top Countries / Regiones card controls
  const [geoViewMode, setGeoViewMode] = useState<'map' | 'top50'>('map');
  const [geoScope, setGeoScope] = useState<'Mundo' | 'México (Zonas)'>('Mundo');

  // Mini chart toggles for individual cards
  const [cardDisplayMode, setCardDisplayMode] = useState<
    Record<string, 'table' | 'bar' | 'pie'>
  >({
    tags: 'table',
    lost: 'table',
    medium: 'table',
    teams: 'table',
    sellers: 'table',
  });

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return INITIAL_LEADS_DATA;
    const q = searchQuery.toLowerCase();
    return INITIAL_LEADS_DATA.filter(
      (l) =>
        l.empresa.toLowerCase().includes(q) ||
        l.asunto.toLowerCase().includes(q) ||
        l.vendedor.toLowerCase().includes(q) ||
        l.zona.toLowerCase().includes(q) ||
        l.medio.toLowerCase().includes(q) ||
        l.origen.toLowerCase().includes(q) ||
        l.etiquetas.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Computed analytics for Leads vs Flujo
  const analytics = useMemo(() => {
    const multiplier =
      period === 'Últimos 7 días'
        ? 0.45
        : period === 'Últimos 30 días'
        ? 1
        : period === 'Trimestre Q4 2026'
        ? 1.65
        : 2.8;

    const totalLeads = filteredLeads.length;
    const totalRevenue = Math.round(
      filteredLeads.reduce((acc, l) => acc + l.ingresoEstimado, 0) * multiplier
    );
    const avgDeal = totalLeads > 0 ? Math.round(totalRevenue / totalLeads) : 0;
    const winRate = activeSection === 'leads' ? 24 : 38;
    const daysToWin = activeSection === 'leads' ? 14 : 28;
    const daysToAssign = activeSection === 'leads' ? 1.2 : 0.8;

    // Tags aggregation
    const tagMap = new Map<string, { count: number; revenue: number }>();
    filteredLeads.forEach((l) => {
      l.etiquetas.forEach((tg) => {
        const prev = tagMap.get(tg) || { count: 0, revenue: 0 };
        tagMap.set(tg, {
          count: prev.count + 1,
          revenue: prev.revenue + Math.round(l.ingresoEstimado * multiplier),
        });
      });
    });
    const tagsRows = Array.from(tagMap.entries())
      .map(([tag, data]) => ({ tag, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Lost / Discard reasons aggregation (Zero #DIV/0!)
    const lostReasons = [
      {
        reason: 'Presupuesto insuficiente / cancelado por planta',
        leads: 4,
        pct: 36,
      },
      {
        reason: 'Adjudicado a competidor por precio',
        leads: 3,
        pct: 27,
      },
      {
        reason: 'Proyecto pospuesto para siguiente ejercicio fiscal',
        leads: 2,
        pct: 18,
      },
      {
        reason: 'Sin respuesta tras 3 intentos de seguimiento',
        leads: 1,
        pct: 10,
      },
      {
        reason: 'Fuera de alcance técnico SIFYGSA',
        leads: 1,
        pct: 9,
      },
    ];

    // Mediums aggregation
    const mediumMap = new Map<string, { count: number; revenue: number }>();
    filteredLeads.forEach((l) => {
      const prev = mediumMap.get(l.medio) || { count: 0, revenue: 0 };
      mediumMap.set(l.medio, {
        count: prev.count + 1,
        revenue: prev.revenue + Math.round(l.ingresoEstimado * multiplier),
      });
    });
    const mediumRows = Array.from(mediumMap.entries())
      .map(([medium, data]) => ({ medium, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Sales Teams aggregation
    const istmoLeads = filteredLeads.filter((l) => l.zona === 'Istmo');
    const surLeads = filteredLeads.filter((l) => l.zona === 'Sur');
    const teamsRows = [
      {
        team: 'Ventas & Ingeniería Zona Istmo',
        count: istmoLeads.length,
        revenue: Math.round(
          istmoLeads.reduce((a, b) => a + b.ingresoEstimado, 0) * multiplier
        ),
      },
      {
        team: 'Ventas & Ingeniería Zona Sur',
        count: surLeads.length,
        revenue: Math.round(
          surLeads.reduce((a, b) => a + b.ingresoEstimado, 0) * multiplier
        ),
      },
      {
        team: 'Licitaciones Públicas PEMEX / CFE',
        count: filteredLeads.filter((l) => l.sector === 'Público').length,
        revenue: Math.round(
          filteredLeads
            .filter((l) => l.sector === 'Público')
            .reduce((a, b) => a + b.ingresoEstimado, 0) * multiplier
        ),
      },
    ];

    // Salespeople aggregation
    const sellerMap = new Map<string, { count: number; revenue: number }>();
    filteredLeads.forEach((l) => {
      const name =
        l.vendedor && l.vendedor.trim() !== ''
          ? l.vendedor
          : 'Ing. Ivan Alexei Gamboa Bernal';
      const prev = sellerMap.get(name) || { count: 0, revenue: 0 };
      sellerMap.set(name, {
        count: prev.count + 1,
        revenue: prev.revenue + Math.round(l.ingresoEstimado * multiplier),
      });
    });
    const sellerRows = Array.from(sellerMap.entries())
      .map(([seller, data]) => ({ seller, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Monthly series
    const monthlySeries =
      activeSection === 'leads'
        ? [
            { month: 'junio 2026', count: 5, revenue: 11200000 },
            { month: 'julio 2026', count: 8, revenue: 16800000 },
            { month: 'agosto 2026', count: 7, revenue: 14500000 },
            { month: 'septiembre 2026', count: 11, revenue: 26400000 },
            { month: 'octubre 2026', count: 14, revenue: 35900000 },
            {
              month: 'noviembre 2026',
              count: totalLeads,
              revenue: totalRevenue,
            },
          ]
        : [
            { month: 'junio 2026', count: 4, revenue: 14800000 },
            { month: 'julio 2026', count: 6, revenue: 21500000 },
            { month: 'agosto 2026', count: 9, revenue: 31200000 },
            { month: 'septiembre 2026', count: 8, revenue: 28900000 },
            { month: 'octubre 2026', count: 12, revenue: 44600000 },
            { month: 'noviembre 2026', count: 10, revenue: 70560000 },
          ];

    return {
      totalLeads,
      totalRevenue,
      avgDeal,
      winRate,
      daysToWin,
      daysToAssign,
      tagsRows,
      lostReasons,
      mediumRows,
      teamsRows,
      sellerRows,
      monthlySeries,
    };
  }, [filteredLeads, period, activeSection]);

  const toggleCardMode = (cardKey: string) => {
    setCardDisplayMode((prev) => {
      const curr = prev[cardKey] || 'table';
      const next =
        curr === 'table' ? 'bar' : curr === 'bar' ? 'pie' : 'table';
      return { ...prev, [cardKey]: next };
    });
  };

  return (
    <div className="sifygsa-tailwind-scope w-full min-h-screen bg-surface text-on-surface flex flex-col select-none">
      {/* =====================================================================
          BARRA SUPERIOR DE TABLEROS / INICIATIVAS (LEADS)
          ===================================================================== */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/25 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Module Title */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[18px]">
              monitoring
            </span>
          </div>
          <span className="text-base font-bold text-on-surface tracking-tight">
            Tableros
          </span>
          <span className="text-outline">/</span>
          <span className="text-sm font-semibold text-primary">
            {activeSection === 'leads'
              ? 'Iniciativas (Leads)'
              : 'Flujo Comercial'}
          </span>
        </div>

        {/* Center: Search Omnibox + Period Selector (< Últimos 30 días >) */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-center">
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/35 rounded-lg px-3 py-1.5 flex-1 min-w-[220px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
            <span className="material-symbols-outlined text-[16px] text-outline">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por etiqueta, vendedor, medio, cliente o zona..."
              className="bg-transparent border-none text-xs text-on-surface placeholder:text-outline focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  close
                </span>
              </button>
            )}
          </div>

          {/* Period Picker */}
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPeriodMenuOpen((v) => !v)}
              className="bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/35 rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">
                calendar_today
              </span>
              <span>{period}</span>
              <span className="material-symbols-outlined text-[14px] text-outline">
                expand_more
              </span>
            </button>

            <button
              type="button"
              aria-label="Periodo anterior"
              onClick={() => setPeriod('Últimos 30 días')}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/35 text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                chevron_left
              </span>
            </button>
            <button
              type="button"
              aria-label="Periodo siguiente"
              onClick={() => setPeriod('Trimestre Q4 2026')}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/35 text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                chevron_right
              </span>
            </button>

            {periodMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                {(
                  [
                    'Últimos 7 días',
                    'Últimos 30 días',
                    'Trimestre Q4 2026',
                    'Año 2026',
                  ] as const
                ).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      setPeriodMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low flex items-center justify-between text-on-surface cursor-pointer"
                  >
                    <span>{p}</span>
                    {period === p && (
                      <span className="text-primary font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Compartir + Favorito */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShareToast(
                'Enlace del tablero analítico de Leads copiado al portapapeles.'
              );
              setTimeout(() => setShareToast(null), 3500);
            }}
            className="bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/35 text-on-surface text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">share</span>
            <span>Compartir</span>
          </button>

          <button
            type="button"
            aria-label="Marcar tablero como favorito"
            onClick={() => setIsFavorite((v) => !v)}
            className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/35 cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[17px] ${
                isFavorite ? 'text-amber-400' : 'text-outline'
              }`}
              style={{
                fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              star
            </span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {shareToast && (
        <div className="bg-primary-fixed text-on-primary-fixed px-6 py-2 text-xs font-semibold flex items-center justify-between border-b border-primary/20">
          <span>✓ {shareToast}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setShareToast(null)}
            className="cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          CUERPO PRINCIPAL: SIDEBAR INTERNO (CRM: Leads | Flujo) + LIENZO DE GRÁFICAS
          ===================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Internal Sub-Sidebar (Exactamente como en tus 3 capturas) */}
        <aside
          className={`${
            leftRailCollapsed ? 'w-12' : 'w-48'
          } bg-surface-container-lowest border-r border-outline-variant/25 flex flex-col justify-between py-3 px-2.5 transition-all shrink-0`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1.5">
              {!leftRailCollapsed && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                  CRM
                </span>
              )}
              <button
                type="button"
                aria-label="Alternar panel lateral de tableros"
                onClick={() => setLeftRailCollapsed((v) => !v)}
                className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  dock_to_right
                </span>
              </button>
            </div>

            <nav className="flex flex-col gap-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveSection('leads')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  activeSection === 'leads'
                    ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  bolt
                </span>
                {!leftRailCollapsed && <span>Leads</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('flujo')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  activeSection === 'flujo'
                    ? 'bg-primary-fixed text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  view_kanban
                </span>
                {!leftRailCollapsed && <span>Flujo</span>}
              </button>
            </nav>
          </div>

          {!leftRailCollapsed && onNavigateToPipeline && (
            <button
              type="button"
              onClick={() => onNavigateToPipeline()}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-[11px] font-semibold text-on-surface-variant hover:text-primary flex items-center justify-between cursor-pointer"
            >
              <span>Abrir Kanban CRM</span>
              <span className="material-symbols-outlined text-[14px]">
                arrow_forward
              </span>
            </button>
          )}
        </aside>

        {/* Main Scrollable Analytics Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface">
          <div className="max-w-7xl mx-auto flex flex-col gap-5">
            {/* ===============================================================
                FILA 1: 5 TARJETAS KPI SUPERIORES (CAPTURA 2)
                =============================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* KPI 1 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center justify-between">
                <span className="text-xs font-semibold text-primary truncate w-full">
                  Índice de acuerdos ganados
                </span>
                <span className="font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400 my-1.5">
                  {analytics.winRate}%
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  +4.2% último periodo
                </span>
              </div>

              {/* KPI 2 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center justify-between">
                <span className="text-xs font-semibold text-primary truncate w-full">
                  Tamaño promedio de acuerdo
                </span>
                <span className="font-mono text-2xl font-bold text-on-surface my-1.5">
                  ${(analytics.avgDeal / 1000000).toFixed(2)}M
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  +8.5% desde el último periodo
                </span>
              </div>

              {/* KPI 3 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center justify-between">
                <span className="text-xs font-semibold text-primary truncate w-full">
                  Ingreso
                </span>
                <span className="font-mono text-2xl font-bold text-on-surface my-1.5">
                  ${(analytics.totalRevenue / 1000000).toFixed(2)}M
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  +14.2% desde el último periodo
                </span>
              </div>

              {/* KPI 4 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center justify-between">
                <span className="text-xs font-semibold text-primary truncate w-full">
                  Días para ganar
                </span>
                <span className="font-mono text-3xl font-bold text-on-surface my-1.5">
                  {analytics.daysToWin} días
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  16 días último periodo
                </span>
              </div>

              {/* KPI 5 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center justify-between">
                <span className="text-xs font-semibold text-primary truncate w-full">
                  Días hasta asignar
                </span>
                <span className="font-mono text-3xl font-bold text-on-surface my-1.5">
                  {analytics.daysToAssign} días
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  1.5 días último periodo
                </span>
              </div>
            </div>

            {/* ===============================================================
                FILA 2: GRÁFICA PRINCIPAL "LEADS POR MES" (CAPTURA 2)
                =============================================================== */}
            <div
              className={`bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col gap-4 ${
                expandedCard === 'monthly'
                  ? 'fixed inset-6 z-50 overflow-auto shadow-2xl'
                  : ''
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-primary">
                  {activeSection === 'leads'
                    ? 'Leads por mes'
                    : 'Flujo de Oportunidades por mes'}
                </h2>

                <div className="flex items-center gap-2 text-xs">
                  {/* Selector de Tipo de Gráfica: Línea | Barras | Pastel */}
                  <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/30">
                    {[
                      { id: 'line', icon: 'show_chart', label: 'Línea' },
                      { id: 'bar', icon: 'bar_chart', label: 'Barras' },
                      { id: 'pie', icon: 'pie_chart', label: 'Pastel' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setMainChartType(t.id as MainChartType)
                        }
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                          mainChartType === t.id
                            ? 'bg-primary-container text-on-primary font-semibold'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {t.icon}
                        </span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Granularidad Meses ▾ */}
                  <select
                    aria-label="Seleccionar agrupación temporal"
                    value={granularity}
                    onChange={(e) =>
                      setGranularity(e.target.value as GranularityType)
                    }
                    className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1 text-xs font-semibold text-on-surface"
                  >
                    <option value="Semanas">Semanas</option>
                    <option value="Meses">Meses</option>
                    <option value="Trimestres">Trimestres</option>
                  </select>

                  <button
                    type="button"
                    aria-label="Expandir gráfica Leads por mes"
                    onClick={() =>
                      setExpandedCard(
                        expandedCard === 'monthly' ? null : 'monthly'
                      )
                    }
                    className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {expandedCard === 'monthly'
                        ? 'close_fullscreen'
                        : 'open_in_full'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Contenido de la Gráfica Principal */}
              {mainChartType === 'line' && (
                <div className="w-full h-64 pt-2">
                  <svg viewBox="0 0 780 220" className="w-full h-full">
                    <defs>
                      <linearGradient
                        id="leadsAreaGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#1D4ED8"
                          stopOpacity="0.28"
                        />
                        <stop
                          offset="100%"
                          stopColor="#1D4ED8"
                          stopOpacity="0.01"
                        />
                      </linearGradient>
                    </defs>
                    {/* Gridlines horizontales y eje Y */}
                    {[0, 4, 8, 12, 16].map((val, i) => {
                      const y = 180 - i * 38;
                      return (
                        <g key={val}>
                          <line
                            x1="50"
                            y1={y}
                            x2="740"
                            y2={y}
                            stroke="currentColor"
                            strokeOpacity="0.1"
                          />
                          <text
                            x="38"
                            y={y + 4}
                            textAnchor="end"
                            className="fill-current text-[10px] font-mono opacity-60"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                    {/* Eje Y Label */}
                    <text
                      x="14"
                      y="110"
                      transform="rotate(-90 14,110)"
                      textAnchor="middle"
                      className="fill-current text-[10px] font-semibold opacity-60"
                    >
                      Leads
                    </text>

                    {/* Área y Línea */}
                    <path
                      d="M 70 132 L 200 104 L 330 114 L 460 75 L 590 47 L 720 28 L 720 180 L 70 180 Z"
                      fill="url(#leadsAreaGrad)"
                    />
                    <path
                      d="M 70 132 L 200 104 L 330 114 L 460 75 L 590 47 L 720 28"
                      fill="none"
                      stroke="#1D4ED8"
                      strokeWidth="3"
                    />

                    {/* Puntos y etiquetas del eje X */}
                    {analytics.monthlySeries.map((pt, idx) => {
                      const x = 70 + idx * 130;
                      const y = Math.max(24, 180 - pt.count * 9.5);
                      return (
                        <g key={pt.month}>
                          <circle
                            cx={x}
                            cy={y}
                            r="5.5"
                            fill="#1D4ED8"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            className="fill-current text-[10px] font-mono font-bold"
                          >
                            {pt.count} ({`$${(pt.revenue / 1000000).toFixed(1)}M`})
                          </text>
                          <text
                            x={x}
                            y={202}
                            textAnchor="middle"
                            className="fill-current text-[10px] font-mono opacity-75"
                          >
                            {pt.month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {mainChartType === 'bar' && (
                <div className="w-full h-64 flex items-end justify-around gap-6 pt-8 pb-2 px-8 border-b border-outline-variant/20">
                  {analytics.monthlySeries.map((pt) => {
                    const hPct = Math.min(96, Math.max(20, pt.count * 6));
                    return (
                      <div
                        key={pt.month}
                        className="flex-1 flex flex-col items-center gap-2 max-w-[110px]"
                      >
                        <span className="font-mono text-xs font-bold text-primary">
                          {pt.count} leads
                        </span>
                        <div className="w-full h-44 bg-surface-container-low rounded-t-lg flex items-end p-1">
                          <div
                            className="w-full bg-primary rounded-t-md transition-all"
                            style={{ height: `${hPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          {pt.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {mainChartType === 'pie' && (
                <div className="w-full h-64 flex items-center justify-center gap-12">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg
                      viewBox="0 0 36 36"
                      className="w-full h-full -rotate-90"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#1D4ED8"
                        strokeWidth="4"
                        strokeDasharray="45 55"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#0EA5E9"
                        strokeWidth="4"
                        strokeDasharray="30 70"
                        strokeDashoffset="-45"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="4"
                        strokeDasharray="25 75"
                        strokeDashoffset="-75"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-lg font-bold text-on-surface">
                        {analytics.totalLeads}
                      </span>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                        Leads
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    {analytics.monthlySeries.slice(-4).map((m) => (
                      <div
                        key={m.month}
                        className="flex items-center justify-between gap-6 border-b border-outline-variant/20 pb-1"
                      >
                        <span className="font-semibold text-on-surface capitalize">
                          {m.month}
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {m.count} leads (${(m.revenue / 1000000).toFixed(1)}M)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================================
                FILA 3: CUADRÍCULA 2×3 DE PANELES ANALÍTICOS (CAPTURAS 1, 2 Y 3)
                =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* -------------------------------------------------------------
                  PANEL 1: TOP COUNTRIES / PRINCIPALES PAÍSES Y REGIONES (MAPA)
                  ------------------------------------------------------------- */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col justify-between min-h-[310px]">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <h3 className="text-sm font-bold text-primary">
                    Principales Regiones y Países
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setGeoViewMode('map')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                        geoViewMode === 'map'
                          ? 'text-primary underline'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Mapa
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeoViewMode('top50')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                        geoViewMode === 'top50'
                          ? 'text-primary underline'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Top 50
                    </button>
                    <select
                      aria-label="Seleccionar alcance geográfico"
                      value={geoScope}
                      onChange={(e) =>
                        setGeoScope(
                          e.target.value as 'Mundo' | 'México (Zonas)'
                        )
                      }
                      className="bg-surface-container-low border border-outline-variant/30 rounded px-2 py-0.5 text-[11px] font-medium text-on-surface"
                    >
                      <option value="Mundo">Mundo</option>
                      <option value="México (Zonas)">México (Zonas)</option>
                    </select>
                  </div>
                </div>

                {geoViewMode === 'map' ? (
                  <WorldChoroplethMap
                    scope={geoScope}
                    totalLeads={analytics.totalLeads}
                    totalRevenue={analytics.totalRevenue}
                  />
                ) : (
                  <div className="flex-1 pt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-on-surface-variant border-b border-outline-variant/25 font-bold">
                          <th className="py-2 text-left">País / Región</th>
                          <th className="py-2 text-right"># Leads</th>
                          <th className="py-2 text-right">Ingreso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15 font-mono">
                        <tr>
                          <td className="py-2 font-sans font-semibold text-on-surface">
                            🇲🇽 México — Zona Sur (Tabasco / Chiapas / Campeche)
                          </td>
                          <td className="py-2 text-right">7</td>
                          <td className="py-2 text-right font-bold text-primary">
                            $24,440,000 MXN
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-sans font-semibold text-on-surface">
                            🇲🇽 México — Zona Istmo (Veracruz / Oaxaca)
                          </td>
                          <td className="py-2 text-right">9</td>
                          <td className="py-2 text-right font-bold text-primary">
                            $22,860,000 MXN
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-sans font-semibold text-on-surface">
                            🇺🇸 Estados Unidos — Gulf Coast (Houston, TX)
                          </td>
                          <td className="py-2 text-right">3</td>
                          <td className="py-2 text-right font-bold text-primary">
                            $8,400,000 MXN
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-sans font-semibold text-on-surface">
                            🇨🇴 Colombia — Refinería Barrancabermeja
                          </td>
                          <td className="py-2 text-right">2</td>
                          <td className="py-2 text-right font-bold text-primary">
                            $5,200,000 MXN
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-sans font-semibold text-on-surface">
                            🇧🇷 Brasil — Plataforma Offshore Bacia de Santos
                          </td>
                          <td className="py-2 text-right">1</td>
                          <td className="py-2 text-right font-bold text-primary">
                            $3,100,000 MXN
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* -------------------------------------------------------------
                  PANEL 2: ETIQUETAS PRINCIPALES (CAPTURA 1 Y 2)
                  ------------------------------------------------------------- */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col justify-between min-h-[310px]">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <h3 className="text-sm font-bold text-primary">
                    Etiquetas principales
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleCardMode('tags')}
                    className="text-[11px] font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {cardDisplayMode.tags === 'table'
                        ? 'bar_chart'
                        : 'table_rows'}
                    </span>
                    <span>
                      {cardDisplayMode.tags === 'table'
                        ? 'Ver Gráfica'
                        : 'Ver Tabla'}
                    </span>
                  </button>
                </div>

                {cardDisplayMode.tags === 'table' ? (
                  <div className="flex-1 pt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-on-surface-variant border-b border-outline-variant/25 font-bold">
                          <th className="py-2 text-left">Etiqueta</th>
                          <th className="py-2 text-right"># Leads</th>
                          <th className="py-2 text-right">Ingreso ▾</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15 font-mono">
                        <tr className="bg-surface-container-low/60 font-bold text-on-surface">
                          <td className="py-2 px-1 font-sans">Total</td>
                          <td className="py-2 text-right">
                            {analytics.totalLeads}
                          </td>
                          <td className="py-2 text-right text-primary">
                            ${analytics.totalRevenue.toLocaleString('es-MX')}
                          </td>
                        </tr>
                        {analytics.tagsRows.slice(0, 6).map((row) => (
                          <tr
                            key={row.tag}
                            className="hover:bg-surface-container-low/40"
                          >
                            <td className="py-2 font-sans font-medium text-on-surface">
                              {row.tag}
                            </td>
                            <td className="py-2 text-right">{row.count}</td>
                            <td className="py-2 text-right font-semibold">
                              ${row.revenue.toLocaleString('es-MX')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center gap-2.5 pt-3">
                    {analytics.tagsRows.slice(0, 5).map((row) => {
                      const pct = Math.min(
                        100,
                        Math.round(
                          (row.revenue / (analytics.totalRevenue || 1)) * 100
                        )
                      );
                      return (
                        <div key={row.tag} className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{row.tag}</span>
                            <span className="font-mono">
                              ${(row.revenue / 1000000).toFixed(2)}M ({row.count})
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${Math.max(12, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* -------------------------------------------------------------
                  PANEL 3: MOTIVOS PRINCIPALES DE DESCARTE (CERO #DIV/0!)
                  ------------------------------------------------------------- */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col justify-between min-h-[290px]">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <h3 className="text-sm font-bold text-primary">
                    Motivos principales de pérdida / descarte
                  </h3>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    11 registros cerrados
                  </span>
                </div>

                <div className="flex-1 pt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-on-surface-variant border-b border-outline-variant/25 font-bold">
                        <th className="py-2 text-left">Motivo de descarte</th>
                        <th className="py-2 text-right"># Leads</th>
                        <th className="py-2 text-right">% del Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 font-mono">
                      <tr className="bg-surface-container-low/60 font-bold text-on-surface">
                        <td className="py-2 px-1 font-sans">Total</td>
                        <td className="py-2 text-right">11</td>
                        <td className="py-2 text-right text-primary">100%</td>
                      </tr>
                      {analytics.lostReasons.map((r) => (
                        <tr
                          key={r.reason}
                          className="hover:bg-surface-container-low/40"
                        >
                          <td className="py-2 font-sans text-on-surface">
                            {r.reason}
                          </td>
                          <td className="py-2 text-right">{r.leads}</td>
                          <td className="py-2 text-right font-semibold">
                            {r.pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  PANEL 4: MEDIOS PRINCIPALES (CAPTURA 1 Y 3)
                  ------------------------------------------------------------- */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col justify-between min-h-[290px]">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <h3 className="text-sm font-bold text-primary">
                    Medios principales
                  </h3>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    Canales de captación
                  </span>
                </div>

                <div className="flex-1 pt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-on-surface-variant border-b border-outline-variant/25 font-bold">
                        <th className="py-2 text-left">Medio</th>
                        <th className="py-2 text-right"># Leads</th>
                        <th className="py-2 text-right">Ingreso ▾</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 font-mono">
                      <tr className="bg-surface-container-low/60 font-bold text-on-surface">
                        <td className="py-2 px-1 font-sans">Total</td>
                        <td className="py-2 text-right">
                          {analytics.totalLeads}
                        </td>
                        <td className="py-2 text-right text-primary">
                          ${analytics.totalRevenue.toLocaleString('es-MX')}
                        </td>
                      </tr>
                      {analytics.mediumRows.map((m) => (
                        <tr
                          key={m.medium}
                          className="hover:bg-surface-container-low/40"
                        >
                          <td className="py-2 font-sans text-on-surface">
                            {m.medium}
                          </td>
                          <td className="py-2 text-right">{m.count}</td>
                          <td className="py-2 text-right font-semibold">
                            ${m.revenue.toLocaleString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  PANEL 5: MEJORES EQUIPOS DE VENTA (CAPTURA 3)
                  ------------------------------------------------------------- */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col justify-between min-h-[260px]">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <h3 className="text-sm font-bold text-primary">
                    Mejores equipos de venta
                  </h3>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    Desempeño regional
                  </span>
                </div>

                <div className="flex-1 pt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-on-surface-variant border-b border-outline-variant/25 font-bold">
                        <th className="py-2 text-left">Equipo de venta</th>
                        <th className="py-2 text-right"># Leads</th>
                        <th className="py-2 text-right">Ingreso ▾</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 font-mono">
                      {analytics.teamsRows.map((t) => (
                        <tr
                          key={t.team}
                          className="hover:bg-surface-container-low/40"
                        >
                          <td className="py-2.5 font-sans font-semibold text-on-surface">
                            {t.team}
                          </td>
                          <td className="py-2.5 text-right">{t.count}</td>
                          <td className="py-2.5 text-right font-bold text-primary">
                            ${t.revenue.toLocaleString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  PANEL 6: MEJORES VENDEDORES (CAPTURA 3)
                  ------------------------------------------------------------- */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col justify-between min-h-[260px]">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <h3 className="text-sm font-bold text-primary">
                    Mejores vendedores
                  </h3>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    Ingenieros SIFYGSA
                  </span>
                </div>

                <div className="flex-1 pt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-on-surface-variant border-b border-outline-variant/25 font-bold">
                        <th className="py-2 text-left">Vendedor</th>
                        <th className="py-2 text-right"># Leads</th>
                        <th className="py-2 text-right">Ingreso ▾</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 font-mono">
                      {analytics.sellerRows.map((s) => (
                        <tr
                          key={s.seller}
                          className="hover:bg-surface-container-low/40"
                        >
                          <td className="py-2.5 font-sans font-semibold text-on-surface">
                            {s.seller}
                          </td>
                          <td className="py-2.5 text-right">{s.count}</td>
                          <td className="py-2.5 text-right font-bold text-primary">
                            ${s.revenue.toLocaleString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LeadsCrm;
