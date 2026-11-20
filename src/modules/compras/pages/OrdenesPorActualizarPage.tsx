'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  obtenerOrdenesPorActualizar,
  guardarOrdenesPorActualizar,
  type OrdenPorActualizar,
} from '../data/mock-data';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../compras.css';

type SortField = 'folio' | 'proveedorNombre' | 'fechaEmision' | 'fechaEntrega' | 'total' | 'diasSinActualizar';
type SortDir = 'asc' | 'desc';

export const OrdenesPorActualizarPage: React.FC = () => {

  const [ordenes, setOrdenes] = useState<OrdenPorActualizar[]>(() =>
    obtenerOrdenesPorActualizar()
  );

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<'todas' | 'abierta' | 'transito' | 'en_revision'>('todas');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Selector de columnas visibles
  const [columnasVisibles, setColumnasVisibles] = useState({
    proveedor: true,
    fechaEmision: true,
    fechaEntrega: true,
    total: true,
    estatus: true,
    diasSinActualizar: true,
    acciones: true,
  });
  const [isMenuColumnasOpen, setIsMenuColumnasOpen] = useState(false);

  // Ordenamiento y paginación
  const [sortField, setSortField] = useState<SortField>('diasSinActualizar');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // Modal para actualizar orden
  const [ordenModal, setOrdenModal] = useState<OrdenPorActualizar | null>(null);
  const [modalFechaEntrega, setModalFechaEntrega] = useState('');
  const [modalNotas, setModalNotas] = useState('');
  const [modalEstatus, setModalEstatus] = useState<OrdenPorActualizar['estatus']>('abierta');

  const mostrarNotificacion = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  // Contadores de estado
  const contadores = useMemo(() => {
    return {
      todas: ordenes.length,
      abiertas: ordenes.filter((o) => o.estatus === 'abierta').length,
      transito: ordenes.filter((o) => o.estatus === 'transito').length,
      en_revision: ordenes.filter((o) => o.estatus === 'en_revision' || o.estatus === 'pendiente_aprobacion').length,
      alertaUrgente: ordenes.filter((o) => o.diasSinActualizar > 5).length,
    };
  }, [ordenes]);

  // Filtrado
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((o) => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        o.folio.toLowerCase().includes(q) ||
        o.proveedorNombre.toLowerCase().includes(q) ||
        o.proveedorRfc.toLowerCase().includes(q) ||
        (o.proyecto && o.proyecto.toLowerCase().includes(q));

      let matchEstatus = true;
      if (filtroEstatus === 'abierta') matchEstatus = o.estatus === 'abierta';
      else if (filtroEstatus === 'transito') matchEstatus = o.estatus === 'transito';
      else if (filtroEstatus === 'en_revision')
        matchEstatus = o.estatus === 'en_revision' || o.estatus === 'pendiente_aprobacion';

      return matchBusqueda && matchEstatus;
    });
  }, [ordenes, busqueda, filtroEstatus]);

  // Ordenamiento
  const ordenesOrdenadas = useMemo(() => {
    return [...ordenesFiltradas].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'total' || sortField === 'diasSinActualizar') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ordenesFiltradas, sortField, sortDir]);

  // Paginación
  const totalPaginas = Math.ceil(ordenesOrdenadas.length / itemsPorPagina) || 1;
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const ordenesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * itemsPorPagina;
    return ordenesOrdenadas.slice(inicio, inicio + itemsPorPagina);
  }, [ordenesOrdenadas, paginaSegura, itemsPorPagina]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Abrir modal de actualización
  const handleAbrirActualizar = (oc: OrdenPorActualizar) => {
    setOrdenModal(oc);
    setModalFechaEntrega(oc.fechaEntrega);
    setModalNotas(oc.notas || '');
    setModalEstatus(oc.estatus);
  };

  // Guardar actualización de la orden
  const handleGuardarActualizacion = () => {
    if (!ordenModal) return;
    const actualizada: OrdenPorActualizar = {
      ...ordenModal,
      fechaEntrega: modalFechaEntrega,
      notas: modalNotas,
      estatus: modalEstatus,
      diasSinActualizar: 0, // Se resetea el contador al actualizar
    };

    const nuevas = ordenes.map((o) => (o.id === ordenModal.id ? actualizada : o));
    setOrdenes(nuevas);
    guardarOrdenesPorActualizar(nuevas);
    setOrdenModal(null);
    mostrarNotificacion(`Orden ${ordenModal.folio} actualizada exitosamente. Días de seguimiento restablecidos a 0.`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setOrdenes(obtenerOrdenesPorActualizar());
      setIsRefreshing(false);
      mostrarNotificacion('Listado de órdenes por actualizar sincronizado');
    }, 350);
  };

  const handleExportCSV = () => {
    const headers = ['Folio', 'Proveedor', 'RFC', 'Fecha Emisión', 'Entrega Estimada', 'Total', 'Moneda', 'Estatus', 'Días sin actualizar', 'Proyecto'];
    const rows = ordenesOrdenadas.map((o) => [
      o.folio,
      `"${o.proveedorNombre.replace(/"/g, '""')}"`,
      o.proveedorRfc,
      o.fechaEmision,
      o.fechaEntrega,
      o.total,
      o.moneda,
      o.estatus,
      o.diasSinActualizar,
      `"${(o.proyecto || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ordenes_Por_Actualizar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarNotificacion('Reporte descargado en CSV');
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-5 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── NOTIFICACIÓN TOAST ── */}
      {toastMensaje && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* ── 1. ENCABEZADO COMPACTO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/compras/modulos" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Módulos de Compras
            </Link>
            <span>/</span>
            <span className="text-slate-400">Por Actualizar</span>
          </nav>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white"
              style={{ backgroundColor: '#d97706' }}
            >
              <span className="material-symbols-outlined text-[20px]">update</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ÓRDENES POR ACTUALIZAR
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {ordenes.length} órdenes abiertas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Órdenes abiertas que requieren seguimiento o actualización de fechas y estatus
          </p>
        </div>

        {/* Lado Derecho: Exportar CSV + ModuleMenu */}
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

          <ModuleMenu />
        </div>
      </div>

      {/* ── 2. BARRA DE HERRAMIENTAS SOBRE LA TABLA EN UNA SOLA FILA ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 mb-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            placeholder="Buscar por folio, proveedor, RFC o proyecto..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Chips de filtro por estatus con contadores */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('todas');
              setPaginaActual(1);
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              filtroEstatus === 'todas'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Todas</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
              {contadores.todas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('abierta');
              setPaginaActual(1);
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              filtroEstatus === 'abierta'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Abiertas</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
              {contadores.abiertas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('transito');
              setPaginaActual(1);
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              filtroEstatus === 'transito'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>En Tránsito</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
              {contadores.transito}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltroEstatus('en_revision');
              setPaginaActual(1);
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
              filtroEstatus === 'en_revision'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>En Revisión</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
              {contadores.en_revision}
            </span>
          </button>
        </div>

        {/* Botón Actualizar y Selector de Columnas */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            title="Actualizar listado"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isRefreshing ? 'animate-spin text-amber-500' : ''
              }`}
            >
              refresh
            </span>
          </button>

          {/* Menú de columnas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuColumnasOpen(!isMenuColumnasOpen)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-medium"
              title="Personalizar columnas"
            >
              <span className="material-symbols-outlined text-[16px]">view_column</span>
              <span className="hidden sm:inline">Columnas</span>
            </button>

            {isMenuColumnasOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-48 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1">
                <div className="font-semibold text-slate-500 px-2 py-1 text-[11px]">Columnas visibles</div>
                {Object.entries(columnasVisibles).map(([key, visible]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) =>
                        setColumnasVisibles((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="capitalize">{key === 'diasSinActualizar' ? 'Días sin actualizar' : key}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. TABLA PRINCIPAL ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 select-none">
                {/* Folio (Sticky Left) */}
                <th
                  onClick={() => handleSort('folio')}
                  className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 sticky left-0 z-20 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-1">
                    <span>Folio</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'folio' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>

                {/* Proveedor */}
                {columnasVisibles.proveedor && (
                  <th
                    onClick={() => handleSort('proveedorNombre')}
                    className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 min-w-[200px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Proveedor</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'proveedorNombre' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {/* Fecha Emisión */}
                {columnasVisibles.fechaEmision && (
                  <th
                    onClick={() => handleSort('fechaEmision')}
                    className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Fecha Emisión</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'fechaEmision' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {/* Entrega Estimada */}
                {columnasVisibles.fechaEntrega && (
                  <th
                    onClick={() => handleSort('fechaEntrega')}
                    className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Entrega Estimada</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'fechaEntrega' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {/* Monto Total */}
                {columnasVisibles.total && (
                  <th
                    onClick={() => handleSort('total')}
                    className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Monto Total</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'total' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {/* Estatus */}
                {columnasVisibles.estatus && (
                  <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                    Estatus
                  </th>
                )}

                {/* Días sin actualizar */}
                {columnasVisibles.diasSinActualizar && (
                  <th
                    onClick={() => handleSort('diasSinActualizar')}
                    className="py-3 px-3 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Días sin actualizar</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {sortField === 'diasSinActualizar' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                )}

                {/* Acción */}
                {columnasVisibles.acciones && (
                  <th className="py-3 px-3 sm:px-4 font-semibold text-right whitespace-nowrap min-w-[160px]">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
              {ordenesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[42px] text-slate-400">
                        task_alt
                      </span>
                      <span className="font-semibold text-sm">
                        No hay órdenes pendientes de actualización
                      </span>
                      <p className="text-xs text-slate-400">
                        Todas las órdenes de compra se encuentran al día con sus tiempos de entrega y seguimiento.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                ordenesPaginadas.map((oc, index) => {
                  const tieneAlerta = oc.diasSinActualizar > 5;

                  return (
                    <tr
                      key={oc.id}
                      className={`hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors ${
                        index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/40 dark:bg-slate-800/20'
                      }`}
                    >
                      {/* Folio (Sticky) */}
                      <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-sm">
                        <Link
                          href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                          className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <span>{oc.folio}</span>
                          <span className="material-symbols-outlined text-[13px] opacity-70">
                            arrow_outward
                          </span>
                        </Link>
                      </td>

                      {/* Proveedor */}
                      {columnasVisibles.proveedor && (
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[240px]">
                            {oc.proveedorNombre}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {oc.proveedorRfc}
                          </div>
                        </td>
                      )}

                      {/* Fecha Emisión */}
                      {columnasVisibles.fechaEmision && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                          {oc.fechaEmision}
                        </td>
                      )}

                      {/* Entrega Estimada */}
                      {columnasVisibles.fechaEntrega && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                          {oc.fechaEntrega}
                        </td>
                      )}

                      {/* Total */}
                      {columnasVisibles.total && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                          ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            {oc.moneda}
                          </span>
                        </td>
                      )}

                      {/* Estatus */}
                      {columnasVisibles.estatus && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              oc.estatus === 'transito'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                : oc.estatus === 'en_revision' || oc.estatus === 'pendiente_aprobacion'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {oc.estatus === 'transito'
                                ? 'local_shipping'
                                : oc.estatus === 'en_revision'
                                ? 'rate_review'
                                : 'description'}
                            </span>
                            <span className="capitalize">{oc.estatus.replace('_', ' ')}</span>
                          </span>
                        </td>
                      )}

                      {/* Días sin actualizar con alerta si > 5 días */}
                      {columnasVisibles.diasSinActualizar && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {tieneAlerta ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              <span className="material-symbols-outlined text-[13px] text-amber-600 dark:text-amber-400">
                                warning
                              </span>
                              <span>{oc.diasSinActualizar} días sin actualizar</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                schedule
                              </span>
                              <span>{oc.diasSinActualizar} días</span>
                            </span>
                          )}
                        </td>
                      )}

                      {/* Acciones */}
                      {columnasVisibles.acciones && (
                        <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAbrirActualizar(oc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center gap-1"
                              title="Actualizar estatus, entrega o notas"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span>Actualizar</span>
                            </button>

                            <Link
                              href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Ver detalle completo de la orden"
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

        {/* ── 4. PIE DE TABLA CON PAGINACIÓN ── */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={itemsPorPagina}
              onChange={(e) => {
                setItemsPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>por página</span>
            <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
            <span>
              Total: <strong>{ordenesOrdenadas.length}</strong> órdenes
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={paginaSegura <= 1}
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Página anterior"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            <span className="px-2.5 font-medium">
              Página {paginaSegura} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaSegura >= totalPaginas}
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Página siguiente"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL DE ACTUALIZACIÓN RÁPIDA ── */}
      {ordenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[22px]">
                  update
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Actualizar Orden {ordenModal.folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrdenModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-500 block mb-1">Proveedor:</span>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{ordenModal.proveedorNombre}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{ordenModal.proveedorRfc}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Estatus Operativo
                  </label>
                  <select
                    value={modalEstatus}
                    onChange={(e) => setModalEstatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="abierta">Abierta</option>
                    <option value="transito">En Tránsito</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="pendiente_aprobacion">Pendiente de Aprobación</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Nueva Fecha Entrega
                  </label>
                  <input
                    type="date"
                    value={modalFechaEntrega}
                    onChange={(e) => setModalFechaEntrega(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Bitácora / Notas de Seguimiento
                </label>
                <textarea
                  rows={3}
                  value={modalNotas}
                  onChange={(e) => setModalNotas(e.target.value)}
                  placeholder="Detalla el motivo del cambio o el estado del envío..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOrdenModal(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarActualizacion}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesPorActualizarPage;
