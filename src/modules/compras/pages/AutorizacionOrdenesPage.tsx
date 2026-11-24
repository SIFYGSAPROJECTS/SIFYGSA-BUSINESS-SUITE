'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCompras } from '../context/ComprasContext';
import { obtenerOrdenesCompra, guardarNuevaOrdenCompra } from '../data/mock-data';
import type { OrdenCompra } from '../types';
import '../compras.css';

type SortField = 'folio' | 'proveedorNombre' | 'fechaEmision' | 'fechaEntrega' | 'total' | 'estatus';
type SortDir = 'asc' | 'desc';

export const AutorizacionOrdenesPage: React.FC = () => {
  const {
    ordenes: ordenesContext,
    actualizarOrden,
    ocTieneFactura,
    mostrarToast,
  } = useCompras();

  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() =>
    ordenesContext.length > 0 ? ordenesContext : obtenerOrdenesCompra()
  );

  useEffect(() => {
    if (ordenesContext.length > 0) {
      setOrdenes(ordenesContext);
    }
  }, [ordenesContext]);

  // ── ESTADOS DE FILTRO Y BÚSQUEDA ──
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<'todas' | 'pendientes' | 'autorizadas' | 'rechazadas'>('pendientes');
  const [seleccionadasIds, setSeleccionadasIds] = useState<string[]>([]);
  const [dictamenNota, setDictamenNota] = useState('Partidas y presupuesto verificados contra requisición.');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selector de columnas visibles
  const [columnasVisibles, setColumnasVisibles] = useState({
    proveedor: true,
    fechaEmision: true,
    fechaEntrega: true,
    total: true,
    estatus: true,
    factura: true,
    acciones: true,
  });
  const [isMenuColumnasOpen, setIsMenuColumnasOpen] = useState(false);

  // Ordenamiento y paginación
  const [sortField, setSortField] = useState<SortField>('fechaEmision');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // Tooltip explicativo
  const [showTooltipInfo, setShowTooltipInfo] = useState(false);

  // Modal de rechazo con motivo obligatorio
  const [ordenARechazar, setOrdenARechazar] = useState<OrdenCompra | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState('');

  // Contadores para chips de estatus y KPIs
  const contadores = useMemo(() => {
    const hoyIso = new Date().toISOString().split('T')[0];
    const pendientes = ordenes.filter((o) => o.estatus === 'pendiente').length;
    const autorizadas = ordenes.filter(
      (o) => o.estatus === 'autorizada' || o.estatus === 'aprobada_supervisor'
    ).length;
    const autorizadasHoy = ordenes.filter(
      (o) =>
        (o.estatus === 'autorizada' || o.estatus === 'aprobada_supervisor') &&
        o.fechaAutorizacion === hoyIso
    ).length;
    const rechazadas = ordenes.filter(
      (o) => o.estatus === 'cancelada' || Boolean(o.motivoRechazo)
    ).length;
    return {
      todas: ordenes.length,
      pendientes,
      autorizadas,
      autorizadasHoy,
      rechazadas,
    };
  }, [ordenes]);

  // Filtrado de órdenes
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((o) => {
      // Filtro por estatus de autorización
      if (filtroEstatus === 'pendientes' && o.estatus !== 'pendiente') return false;
      if (
        filtroEstatus === 'autorizadas' &&
        o.estatus !== 'autorizada' &&
        o.estatus !== 'aprobada_supervisor'
      )
        return false;
      if (filtroEstatus === 'rechazadas' && o.estatus !== 'cancelada' && !o.motivoRechazo)
        return false;

      // Filtro por búsqueda de texto
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const matchFolio = o.folio.toLowerCase().includes(q);
      const matchProv = o.proveedorNombre.toLowerCase().includes(q);
      const matchRfc = (o.proveedorRfc || '').toLowerCase().includes(q);
      const matchSolicitante = (o.solicitante || '').toLowerCase().includes(q);
      const matchProyecto = (o.almacenDestino || '').toLowerCase().includes(q) || (o.proyectoId || '').toLowerCase().includes(q);
      const matchSku = o.items?.some((it) => (it.descripcion || '').toLowerCase().includes(q));

      return matchFolio || matchProv || matchRfc || matchSolicitante || matchProyecto || matchSku;
    });
  }, [ordenes, filtroEstatus, busqueda]);

  // Ordenamiento
  const ordenesOrdenadas = useMemo(() => {
    return [...ordenesFiltradas].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'folio') {
        valA = a.folio;
        valB = b.folio;
      } else if (sortField === 'proveedorNombre') {
        valA = a.proveedorNombre;
        valB = b.proveedorNombre;
      } else if (sortField === 'fechaEmision') {
        valA = new Date(a.fechaEmision).getTime() || 0;
        valB = new Date(b.fechaEmision).getTime() || 0;
      } else if (sortField === 'fechaEntrega') {
        valA = new Date(a.fechaEntrega).getTime() || 0;
        valB = new Date(b.fechaEntrega).getTime() || 0;
      } else if (sortField === 'total') {
        valA = a.total;
        valB = b.total;
      } else if (sortField === 'estatus') {
        valA = a.estatus;
        valB = b.estatus;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ordenesFiltradas, sortField, sortDir]);

  // Paginación
  const totalPaginas = Math.ceil(ordenesOrdenadas.length / itemsPorPagina) || 1;
  const ordenesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return ordenesOrdenadas.slice(inicio, inicio + itemsPorPagina);
  }, [ordenesOrdenadas, paginaActual, itemsPorPagina]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ── AUTORIZAR INDIVIDUAL ──
  const handleAutorizarIndividual = (oc: OrdenCompra) => {
    const hoyIso = new Date().toISOString().split('T')[0];
    const actualizada: OrdenCompra = {
      ...oc,
      estatus: 'autorizada',
      motivoRechazo: undefined,
      fechaAutorizacion: hoyIso,
      autorizadoPor: 'Validación Gerencial',
      notas: `${oc.notas || ''} | [AUTORIZADA: ${new Date().toLocaleDateString('es-MX')} - ${dictamenNota}]`.trim(),
    };
    actualizarOrden(actualizada);
    guardarNuevaOrdenCompra(actualizada);
    setOrdenes((prev) => prev.map((o) => (o.id === oc.id ? actualizada : o)));
    mostrarToast(`Orden ${oc.folio} autorizada con firma digital. Salió de Pendientes.`, 'success');
  };

  // ── RECHAZAR CON MOTIVO OBLIGATORIO (REGRESA A "POR ACTUALIZAR") ──
  const handleConfirmarRechazo = () => {
    if (!ordenARechazar) return;
    const motivo = motivoRechazoInput.trim();
    if (!motivo) {
      mostrarToast('El motivo de rechazo es obligatorio.', 'error');
      return;
    }
    const devuelta: OrdenCompra = {
      ...ordenARechazar,
      estatus: 'abierta',
      motivoRechazo: motivo,
      notas: `${ordenARechazar.notas || ''} | [RECHAZADA ${new Date().toLocaleDateString('es-MX')}: ${motivo}]`.trim(),
    };
    actualizarOrden(devuelta);
    guardarNuevaOrdenCompra(devuelta);
    setOrdenes((prev) => prev.map((o) => (o.id === ordenARechazar.id ? devuelta : o)));
    setOrdenARechazar(null);
    setMotivoRechazoInput('');
    mostrarToast(
      `Orden ${devuelta.folio} rechazada y devuelta a "Por actualizar" con el motivo registrado.`,
      'info'
    );
  };

  // ── LIBERAR ORDEN AUTORIZADA ──
  const handleLiberarOrden = (oc: OrdenCompra) => {
    const hoyIso = new Date().toISOString().split('T')[0];
    const liberada: OrdenCompra = {
      ...oc,
      estatus: 'en_transito',
      liberada: true,
      fechaLiberacion: hoyIso,
    };
    actualizarOrden(liberada);
    guardarNuevaOrdenCompra(liberada);
    setOrdenes((prev) => prev.map((o) => (o.id === oc.id ? liberada : o)));
    mostrarToast(`Orden ${oc.folio} liberada exitosamente para envío al proveedor.`, 'success');
  };

  // ── ACCIONES MASIVAS ──
  const handleAutorizarSeleccionadas = () => {
    if (seleccionadasIds.length === 0) return;
    const fechaHoy = new Date().toLocaleDateString('es-MX');

    setOrdenes((prev) =>
      prev.map((o) => {
        if (seleccionadasIds.includes(o.id)) {
          const act: OrdenCompra = {
            ...o,
            estatus: 'autorizada',
            notas: `${o.notas || ''} | [AUTORIZACIÓN GERENCIAL ${fechaHoy} - ${dictamenNota}]`.trim(),
          };
          actualizarOrden(act);
          guardarNuevaOrdenCompra(act);
          return act;
        }
        return o;
      })
    );

    mostrarToast(
      `${seleccionadasIds.length} órdenes autorizadas con firma digital.`,
      'success'
    );
    setSeleccionadasIds([]);
  };

  const handleEnviarARevision = () => {
    if (seleccionadasIds.length === 0) return;
    mostrarToast(
      `${seleccionadasIds.length} órdenes enviadas a mesa de revisión presupuestal.`,
      'info'
    );
    setSeleccionadasIds([]);
  };

  // Refrescar
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setOrdenes(obtenerOrdenesCompra());
      setIsRefreshing(false);
      mostrarToast('Listado de autorización actualizado', 'success');
    }, 400);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ['Folio', 'Proveedor', 'RFC', 'Fecha Emisión', 'Entrega Estimada', 'Total', 'Moneda', 'Estatus'];
    const rows = ordenesOrdenadas.map((o) => [
      o.folio,
      `"${o.proveedorNombre.replace(/"/g, '""')}"`,
      o.proveedorRfc,
      o.fechaEmision,
      o.fechaEntrega,
      o.total,
      o.moneda,
      o.estatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Autorizacion_Ordenes_SIFYGSA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarToast('Reporte de autorización descargado en CSV', 'success');
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-5 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── 1. ENCABEZADO MÓDULO INDEPENDIENTE: AUTORIZACIÓN DE ÓRDENES DE COMPRA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Menú Principal SIFYGSA
            </Link>
            <span>/</span>
            <span className="text-slate-400">Autorización de Órdenes de Compra</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Autorización de Órdenes de Compra
            </h1>

            {/* Ícono de información con Tooltip compacto */}
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltipInfo(true)}
                onMouseLeave={() => setShowTooltipInfo(false)}
                onClick={() => setShowTooltipInfo(!showTooltipInfo)}
                className="text-slate-400 hover:text-primary transition-colors flex items-center p-1"
                aria-label="Información de autorización"
              >
                <span className="material-symbols-outlined text-[19px]">info</span>
              </button>

              {showTooltipInfo && (
                <div className="absolute left-0 top-full mt-1 z-50 w-80 p-3 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 animate-fadeIn leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    Mesa de Validación Gerencial
                  </div>
                  Autoriza con firma digital, rechaza con motivo obligatorio (devuelve a Por actualizar) o libera órdenes autorizadas para envío al proveedor.
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mesa de Validación · Firma digital, rechazo con motivo y liberación de órdenes
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="cp-btn cp-btn-secondary text-xs inline-flex items-center gap-1.5"
            title="Exportar listado a CSV"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="hidden md:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPIS DE MESA DE VALIDACIÓN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Por firmar</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{contadores.pendientes}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">pending_actions</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Autorizadas hoy</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{contadores.autorizadasHoy}</p>
            <span className="text-[10px] text-slate-400">{contadores.autorizadas} acumuladas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rechazadas</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{contadores.rechazadas}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">cancel</span>
          </div>
        </div>
      </div>

      {/* ── 3. BARRA DE HERRAMIENTAS SOBRE LA TABLA EN UNA SOLA FILA ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 mb-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Buscador en vivo */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-primary"
            placeholder="Buscar por folio, proveedor, RFC, SKU, solicitante o proyecto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Filtros de estatus con Chips/Pestañas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('todas');
              setPaginaActual(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroEstatus === 'todas'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Todas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-white/20">
              {contadores.todas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('pendientes');
              setPaginaActual(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroEstatus === 'pendientes'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
            }`}
          >
            <span>Pendiente autorización</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
              {contadores.pendientes}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('autorizadas');
              setPaginaActual(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroEstatus === 'autorizadas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
            }`}
          >
            <span>Autorizadas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
              {contadores.autorizadas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('rechazadas');
              setPaginaActual(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroEstatus === 'rechazadas'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100'
            }`}
          >
            <span>Rechazadas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
              {contadores.rechazadas}
            </span>
          </button>
        </div>

        {/* Botón Actualizar y Selector de Columnas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            title="Refrescar lista"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Selector de columnas desplegable */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuColumnasOpen(!isMenuColumnasOpen)}
              className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 flex items-center gap-1 text-xs"
              title="Personalizar columnas"
            >
              <span className="material-symbols-outlined text-[18px]">view_column</span>
            </button>

            {isMenuColumnasOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-xs space-y-2 animate-fadeIn">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b">
                  Columnas visibles
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnasVisibles.proveedor}
                    onChange={(e) => setColumnasVisibles((prev) => ({ ...prev, proveedor: e.target.checked }))}
                  />
                  <span>Proveedor / RFC</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnasVisibles.fechaEmision}
                    onChange={(e) => setColumnasVisibles((prev) => ({ ...prev, fechaEmision: e.target.checked }))}
                  />
                  <span>Fecha emisión</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnasVisibles.fechaEntrega}
                    onChange={(e) => setColumnasVisibles((prev) => ({ ...prev, fechaEntrega: e.target.checked }))}
                  />
                  <span>Entrega estimada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnasVisibles.total}
                    onChange={(e) => setColumnasVisibles((prev) => ({ ...prev, total: e.target.checked }))}
                  />
                  <span>Monto total</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnasVisibles.factura}
                    onChange={(e) => setColumnasVisibles((prev) => ({ ...prev, factura: e.target.checked }))}
                  />
                  <span>Factura CFDI</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. BARRA DE ACCIONES MASIVAS (Solo visible si hay seleccionadas) ── */}
      {seleccionadasIds.length > 0 && (
        <div className="p-3.5 mb-3 rounded-2xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary text-white">
              {seleccionadasIds.length}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              órdenes seleccionadas para dictamen
            </span>
          </div>

          {/* Campo de una línea: Dictamen / Nota de autorización */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              className="w-full px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-primary"
              value={dictamenNota}
              onChange={(e) => setDictamenNota(e.target.value)}
              placeholder="Dictamen / Nota de autorización..."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutorizarSeleccionadas}
              className="cp-btn cp-btn-primary text-xs py-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Autorizar seleccionadas
            </button>

            <button
              type="button"
              onClick={handleEnviarARevision}
              className="cp-btn cp-btn-secondary text-xs py-1.5"
            >
              Enviar a revisión
            </button>

            <button
              type="button"
              onClick={() => setSeleccionadasIds([])}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-2"
            >
              Limpiar selección
            </button>
          </div>
        </div>
      )}

      {/* ── 5. TABLA (PROTAGONISTA: TODO EL ANCHO, ENCABEZADO FIJO, FILAS COMPACTAS) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-bold text-[10px] tracking-wider select-none sticky top-0 z-10">
                {/* Casilla de selección múltiple */}
                <th className="px-3.5 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todas"
                    checked={
                      ordenesPaginadas.length > 0 &&
                      ordenesPaginadas.every((o) => seleccionadasIds.includes(o.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSeleccionadasIds(ordenesPaginadas.map((o) => o.id));
                      } else {
                        setSeleccionadasIds([]);
                      }
                    }}
                  />
                </th>

                {/* Folio (columna fija a la izquierda en scroll horizontal) */}
                <th
                  onClick={() => handleSort('folio')}
                  className="px-3.5 py-3 cursor-pointer hover:text-primary sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-20 whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-1">
                    <span>Folio</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'folio' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>

                {columnasVisibles.proveedor && (
                  <th
                    onClick={() => handleSort('proveedorNombre')}
                    className="px-3.5 py-3 cursor-pointer hover:text-primary whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Proveedor</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'proveedorNombre' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {columnasVisibles.fechaEmision && (
                  <th
                    onClick={() => handleSort('fechaEmision')}
                    className="px-3.5 py-3 cursor-pointer hover:text-primary whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Fecha Emisión</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'fechaEmision' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {columnasVisibles.fechaEntrega && (
                  <th
                    onClick={() => handleSort('fechaEntrega')}
                    className="px-3.5 py-3 cursor-pointer hover:text-primary whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Entrega Estimada</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'fechaEntrega' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {columnasVisibles.total && (
                  <th
                    onClick={() => handleSort('total')}
                    className="px-3.5 py-3 text-right cursor-pointer hover:text-primary whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Monto Total</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'total' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {columnasVisibles.estatus && (
                  <th
                    onClick={() => handleSort('estatus')}
                    className="px-3.5 py-3 text-center cursor-pointer hover:text-primary whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Estatus</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'estatus' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {columnasVisibles.factura && (
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Factura</th>
                )}

                {columnasVisibles.acciones && (
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Acción</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ordenesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">
                      verified_user
                    </span>
                    <p className="text-xs font-semibold text-slate-500">
                      No se encontraron órdenes de compra para los filtros seleccionados.
                    </p>
                  </td>
                </tr>
              ) : (
                ordenesPaginadas.map((oc, idx) => {
                  const isChecked = seleccionadasIds.includes(oc.id);
                  const tieneFactura = ocTieneFactura(oc.folio) || oc.tieneFactura;

                  // Insignia de estatus
                  let estatusBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                      Pendiente Autorización
                    </span>
                  );

                  if (oc.estatus === 'autorizada' || oc.estatus === 'aprobada_supervisor') {
                    estatusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                        Autorizada
                      </span>
                    );
                  } else if (oc.estatus === 'cancelada') {
                    estatusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200">
                        Rechazada
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={oc.id}
                      className={`transition-colors duration-150 ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : idx % 2 === 0
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                          : 'bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3.5 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSeleccionadasIds((prev) => [...prev, oc.id]);
                            } else {
                              setSeleccionadasIds((prev) => prev.filter((id) => id !== oc.id));
                            }
                          }}
                        />
                      </td>

                      {/* Folio (Enlace azul, una sola línea, sin partición) */}
                      <td className="px-3.5 py-2.5 font-bold whitespace-nowrap sticky left-0 bg-inherit z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        <Link
                          href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                          className="text-primary hover:underline"
                        >
                          {oc.folio}
                        </Link>
                      </td>

                      {/* Proveedor */}
                      {columnasVisibles.proveedor && (
                        <td className="px-3.5 py-2.5 max-w-[220px]">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={oc.proveedorNombre}>
                            {oc.proveedorNombre}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {oc.proveedorRfc || 'RFC Padrón'}
                          </div>
                        </td>
                      )}

                      {/* Fecha Emisión */}
                      {columnasVisibles.fechaEmision && (
                        <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {oc.fechaEmision}
                        </td>
                      )}

                      {/* Entrega Estimada */}
                      {columnasVisibles.fechaEntrega && (
                        <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {oc.fechaEntrega || 'Por definir'}
                        </td>
                      )}

                      {/* Monto Total */}
                      {columnasVisibles.total && (
                        <td className="px-3.5 py-2.5 text-right font-black whitespace-nowrap text-slate-900 dark:text-slate-100">
                          ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {oc.moneda}
                        </td>
                      )}

                      {/* Estatus */}
                      {columnasVisibles.estatus && (
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {estatusBadge}
                        </td>
                      )}

                      {/* Factura */}
                      {columnasVisibles.factura && (
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {tieneFactura ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                              <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                              Con factura
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800">
                              Sin factura
                            </span>
                          )}
                        </td>
                      )}

                      {/* Acciones */}
                      {columnasVisibles.acciones && (
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {oc.estatus === 'pendiente' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAutorizarIndividual(oc)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                                  title="Autorizar orden de compra con firma digital"
                                >
                                  Autorizar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrdenARechazar(oc);
                                    setMotivoRechazoInput('');
                                  }}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                                  title="Rechazar con motivo obligatorio y devolver a Por actualizar"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}

                            {(oc.estatus === 'autorizada' || oc.estatus === 'aprobada_supervisor') && !oc.liberada && (
                              <button
                                type="button"
                                onClick={() => handleLiberarOrden(oc)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                                title="Liberar orden autorizada"
                              >
                                Liberar
                              </button>
                            )}

                            <Link
                              href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                              title="Ver detalle completo"
                            >
                              Ver Detalle
                            </Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PIE CON PAGINACIÓN Y SELECTOR DE FILAS POR PÁGINA ── */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={itemsPorPagina}
              onChange={(e) => {
                setItemsPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>órdenes por página • Total: {ordenesOrdenadas.length} órdenes</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Anterior
            </button>
            <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Rechazo con Motivo Obligatorio */}
      {ordenARechazar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setOrdenARechazar(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <span className="material-symbols-outlined text-[24px]">cancel</span>
              <h3 className="text-base font-bold">
                Rechazar Orden {ordenARechazar.folio}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              La orden regresará a la pestaña <strong>Por actualizar</strong> del submódulo de edición con este motivo visible para seguimiento.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Motivo del rechazo <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={motivoRechazoInput}
                onChange={(e) => setMotivoRechazoInput(e.target.value)}
                placeholder="Especifica el motivo del rechazo o corrección requerida..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrdenARechazar(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRechazo}
                disabled={!motivoRechazoInput.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorizacionOrdenesPage;

