'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAlmacen } from '../context/AlmacenContext';
import type { Articulo, CategoriaArticulo } from '../types';

type FiltroKPI = 'todos' | 'entradas' | 'mantenimiento' | 'proyecto' | 'stock-bajo';
type FiltroEstado = 'todos' | 'activos' | 'inactivos';

interface ColumnaOrden {
  campo: 'sku' | 'nombre' | 'categoria' | 'stockDisponible' | 'stockMinimo';
  direccion: 'asc' | 'desc';
}

const CATEGORIAS_LISTA: CategoriaArticulo[] = [
  'Consumibles',
  'Herramientas',
  'Equipos de Medición',
  'Mobiliario y Activos',
  'EPP',
  'Tubería y Conexiones',
  'Instrumentación',
  'Servicios Especializados',
];

export const DashboardAlmacenMaestro: React.FC = () => {
  const {
    articulos,
    mantenimientos,
    recepciones,
    movimientos,
    toggleEstatusArticulo,
    actualizarArticulo,
    mostrarToast,
  } = useAlmacen();

  // Estados de Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroKPI, setFiltroKPI] = useState<FiltroKPI>('todos');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [orden, setOrden] = useState<ColumnaOrden>({ campo: 'sku', direccion: 'asc' });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Modales
  const [modalInactivarOpen, setModalInactivarOpen] = useState(false);
  const [articuloAInactivar, setArticuloAInactivar] = useState<Articulo | null>(null);
  const [motivoInactivacion, setMotivoInactivacion] = useState('');

  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [articuloAEditar, setArticuloAEditar] = useState<Articulo | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcionCorta: '',
    categoria: '' as CategoriaArticulo,
    marca: '',
    modelo: '',
    ubicacionNave: '',
    stockMinimo: 5,
    stockMaximo: 50,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CÁLCULO DE KPIS EN VIVO DESDE LOS DATOS
  // ──────────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    // 1. Artículos con entrada a inventario (en recepciones IR03 o movimientos de entrada)
    const skusConEntrada = new Set<string>();
    recepciones.forEach((r) => {
      r.partidas?.forEach((p) => {
        if (p.sku) skusConEntrada.add(p.sku.toLowerCase());
      });
    });
    movimientos.forEach((m) => {
      const tipo = (m.tipo || '').toLowerCase();
      if (tipo.includes('entrada') || tipo.includes('recep') || tipo.includes('ir03')) {
        if (m.articuloSku) skusConEntrada.add(m.articuloSku.toLowerCase());
      }
    });

    const articulosEntrada = articulos.filter(
      (a) => skusConEntrada.has(a.sku.toLowerCase()) || (a.stockTotal > 0 && a.stockDisponible > 0)
    );

    // 2. Artículos en mantenimiento o reparación
    const skusEnMantenimientoActivo = new Set<string>();
    mantenimientos.forEach((m) => {
      if (m.estado === 'En Proceso' || m.estado === 'Pendiente / En Diagnóstico') {
        if (m.articuloSku) skusEnMantenimientoActivo.add(m.articuloSku.toLowerCase());
      }
    });

    const articulosMantenimiento = articulos.filter(
      (a) =>
        (a.stockMantenimiento || 0) > 0 ||
        skusEnMantenimientoActivo.has(a.sku.toLowerCase()) ||
        a.estado === 'Mantenimiento'
    );

    // 3. Artículos en proyecto
    const articulosEnProyecto = articulos.filter(
      (a) => (a.stockProyecto || 0) > 0 || a.estado === 'En Proyecto'
    );

    // 4. Stock bajo (disponible <= mínimo o estado Stock Bajo/Crítico)
    const articulosStockBajo = articulos.filter(
      (a) =>
        (a.stockDisponible || 0) <= (a.stockMinimo || 5) ||
        a.estado === 'Stock Bajo' ||
        a.estado === 'Crítico'
    );

    return {
      entradaCount: articulosEntrada.length,
      entradaSkus: new Set(articulosEntrada.map((a) => a.sku.toLowerCase())),

      mantenimientoCount: articulosMantenimiento.length,
      mantenimientoSkus: new Set(articulosMantenimiento.map((a) => a.sku.toLowerCase())),

      proyectoCount: articulosEnProyecto.length,
      proyectoSkus: new Set(articulosEnProyecto.map((a) => a.sku.toLowerCase())),

      stockBajoCount: articulosStockBajo.length,
      stockBajoSkus: new Set(articulosStockBajo.map((a) => a.sku.toLowerCase())),
    };
  }, [articulos, recepciones, movimientos, mantenimientos]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FILTRADO, BÚSQUEDA Y ORDENAMIENTO
  // ──────────────────────────────────────────────────────────────────────────
  const articulosFiltrados = useMemo(() => {
    return articulos
      .filter((art) => {
        // Normalización de estado activo / inactivo
        const esActivo = art.estatus !== 'Inactivo';

        // Filtro por Estado
        if (filtroEstado === 'activos' && !esActivo) return false;
        if (filtroEstado === 'inactivos' && esActivo) return false;

        // Filtro por Categoría
        if (filtroCategoria !== 'todas' && art.categoria !== filtroCategoria) return false;

        // Filtro por KPI activo
        const skuKey = art.sku.toLowerCase();
        if (filtroKPI === 'entradas' && !kpis.entradaSkus.has(skuKey)) return false;
        if (filtroKPI === 'mantenimiento' && !kpis.mantenimientoSkus.has(skuKey)) return false;
        if (filtroKPI === 'proyecto' && !kpis.proyectoSkus.has(skuKey)) return false;
        if (filtroKPI === 'stock-bajo' && !kpis.stockBajoSkus.has(skuKey)) return false;

        // Búsqueda en texto
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase().trim();
          const matchSku = art.sku?.toLowerCase().includes(q);
          const matchNombre = art.nombre?.toLowerCase().includes(q);
          const matchDesc = art.descripcionCorta?.toLowerCase().includes(q) || art.descripcion?.toLowerCase().includes(q);
          const matchCat = art.categoria?.toLowerCase().includes(q);
          const matchUbicacion = (art.ubicacionNave || art.ubicacionSugerida || '')?.toLowerCase().includes(q);
          const matchMarca = (art.marca || '')?.toLowerCase().includes(q);
          const matchModelo = (art.modelo || '')?.toLowerCase().includes(q);

          if (!matchSku && !matchNombre && !matchDesc && !matchCat && !matchUbicacion && !matchMarca && !matchModelo) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const factor = orden.direccion === 'asc' ? 1 : -1;
        switch (orden.campo) {
          case 'sku':
            return factor * (a.sku || '').localeCompare(b.sku || '');
          case 'nombre':
            return factor * (a.nombre || '').localeCompare(b.nombre || '');
          case 'categoria':
            return factor * (a.categoria || '').localeCompare(b.categoria || '');
          case 'stockDisponible':
            return factor * ((a.stockDisponible || 0) - (b.stockDisponible || 0));
          case 'stockMinimo':
            return factor * ((a.stockMinimo || 0) - (b.stockMinimo || 0));
          default:
            return 0;
        }
      });
  }, [articulos, filtroEstado, filtroCategoria, filtroKPI, busqueda, orden, kpis]);

  // Paginación de resultados
  const totalPaginas = Math.ceil(articulosFiltrados.length / elementosPorPagina) || 1;
  const articulosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return articulosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [articulosFiltrados, paginaActual, elementosPorPagina]);

  const handleOrdenar = (campo: ColumnaOrden['campo']) => {
    setOrden((prev) => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleKPI = (kpi: FiltroKPI) => {
    setFiltroKPI((prev) => (prev === kpi ? 'todos' : kpi));
    setPaginaActual(1);
  };

  const handleResetFiltros = () => {
    setBusqueda('');
    setFiltroKPI('todos');
    setFiltroEstado('todos');
    setFiltroCategoria('todas');
    setPaginaActual(1);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ACCIONES DE FILA: ACTIVAR / DESACTIVAR / EDITAR
  // ──────────────────────────────────────────────────────────────────────────
  const handleSolicitarToggleEstatus = (art: Articulo) => {
    const esActivo = art.estatus !== 'Inactivo';
    if (esActivo) {
      // Pedir confirmación antes de desactivar
      setArticuloAInactivar(art);
      setMotivoInactivacion('');
      setModalInactivarOpen(true);
    } else {
      // Reactivar directamente
      toggleEstatusArticulo(art.sku, 'Activo', 'Supervisor Almacén', 'Reactivado en catálogo');
      mostrarToast(`El artículo ${art.sku} fue reactivado con éxito.`, 'success');
    }
  };

  const handleConfirmarInactivacion = () => {
    if (!articuloAInactivar) return;
    toggleEstatusArticulo(
      articuloAInactivar.sku,
      'Inactivo',
      'Supervisor Almacén',
      motivoInactivacion.trim() || 'Desactivado desde el Dashboard de Almacén'
    );
    mostrarToast(`El artículo ${articuloAInactivar.sku} ha sido desactivado.`, 'warning');
    setModalInactivarOpen(false);
    setArticuloAInactivar(null);
    setMotivoInactivacion('');
  };

  const handleAbrirEditar = (art: Articulo) => {
    setArticuloAEditar(art);
    setEditForm({
      nombre: art.nombre || '',
      descripcionCorta: art.descripcionCorta || art.descripcion || '',
      categoria: art.categoria,
      marca: art.marca || '',
      modelo: art.modelo || '',
      ubicacionNave: art.ubicacionNave || art.ubicacionSugerida || '',
      stockMinimo: art.stockMinimo || 5,
      stockMaximo: art.stockMaximo || 50,
    });
    setModalEditarOpen(true);
  };

  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articuloAEditar) return;

    if (!editForm.nombre.trim()) {
      mostrarToast('El nombre del artículo no puede estar vacío.', 'error');
      return;
    }

    const articuloActualizado: Articulo = {
      ...articuloAEditar,
      nombre: editForm.nombre.trim(),
      descripcionCorta: editForm.descripcionCorta.trim(),
      categoria: editForm.categoria,
      marca: editForm.marca.trim() || articuloAEditar.marca,
      modelo: editForm.modelo.trim() || articuloAEditar.modelo,
      ubicacionNave: editForm.ubicacionNave.trim() || articuloAEditar.ubicacionNave,
      stockMinimo: Number(editForm.stockMinimo) || 5,
      stockMaximo: Number(editForm.stockMaximo) || 50,
    };

    actualizarArticulo(articuloActualizado);
    mostrarToast(`Artículo ${articuloAEditar.sku} actualizado correctamente.`, 'success');
    setModalEditarOpen(false);
    setArticuloAEditar(null);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ──────────────────────────────────────────────────────────────────
          2. TARJETAS KPI (FILA SUPERIOR DEL DASHBOARD)
         ────────────────────────────────────────────────────────────────── */}
      <section aria-label="Indicadores Clave de Almacén" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Artículos de Entrada */}
        <button
          type="button"
          onClick={() => handleToggleKPI('entradas')}
          className={`relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
            filtroKPI === 'entradas'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Artículos de Entrada
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">input</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.entradaCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">artículos</span>
          </div>
          <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>Con recepciones registradas</span>
          </p>
          {filtroKPI === 'entradas' && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
              Activo
            </span>
          )}
        </button>

        {/* KPI 2: Mantenimiento */}
        <button
          type="button"
          onClick={() => handleToggleKPI('mantenimiento')}
          className={`relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
            filtroKPI === 'mantenimiento'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mantenimiento
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">build</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.mantenimientoCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">artículos</span>
          </div>
          <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>En taller o calibración activa</span>
          </p>
          {filtroKPI === 'mantenimiento' && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
              Activo
            </span>
          )}
        </button>

        {/* KPI 3: Artículos en Proyecto */}
        <button
          type="button"
          onClick={() => handleToggleKPI('proyecto')}
          className={`relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
            filtroKPI === 'proyecto'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Artículos en Proyecto
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.proyectoCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">artículos</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">engineering</span>
            <span>Asignados a frentes de obra</span>
          </p>
          {filtroKPI === 'proyecto' && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
              Activo
            </span>
          )}
        </button>

        {/* KPI 4: Stock Bajo */}
        <button
          type="button"
          onClick={() => handleToggleKPI('stock-bajo')}
          className={`relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
            filtroKPI === 'stock-bajo'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Stock Bajo
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {kpis.stockBajoCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">artículos</span>
          </div>
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">notification_important</span>
            <span>Existencia ≤ Stock Mínimo</span>
          </p>
          {filtroKPI === 'stock-bajo' && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white shadow-xs">
              Activo
            </span>
          )}
        </button>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          3. BARRA DE FILTROS Y BÚSQUEDA DEL CATÁLOGO
         ────────────────────────────────────────────────────────────────── */}
      <section aria-label="Filtros del Catálogo" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Buscador */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por SKU, nombre, descripción, marca o ubicación..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Filtros Dropdowns y Estado */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro por Categoría */}
            <select
              value={filtroCategoria}
              onChange={(e) => {
                setFiltroCategoria(e.target.value);
                setPaginaActual(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs"
            >
              <option value="todas">Todas las Categorías</option>
              {CATEGORIAS_LISTA.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Filtro por Estado (Pills) */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setFiltroEstado('todos');
                  setPaginaActual(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroEstado === 'todos'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Todos ({articulos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroEstado('activos');
                  setPaginaActual(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroEstado === 'activos'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Activos ({articulos.filter((a) => a.estatus !== 'Inactivo').length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroEstado('inactivos');
                  setPaginaActual(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroEstado === 'inactivos'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Inactivos ({articulos.filter((a) => a.estatus === 'Inactivo').length})
              </button>
            </div>

            {/* Reset Filtros si hay algo aplicado */}
            {(busqueda || filtroKPI !== 'todos' || filtroEstado !== 'todos' || filtroCategoria !== 'todas') && (
              <button
                type="button"
                onClick={handleResetFiltros}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Restablecer todos los filtros"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner de filtro KPI activo */}
        {filtroKPI !== 'todos' && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[17px] text-blue-600 dark:text-blue-400">filter_list</span>
              <span>
                Filtrando por KPI: <strong className="text-slate-900 dark:text-slate-100 uppercase">{filtroKPI}</strong> ({articulosFiltrados.length} artículos)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleKPI(filtroKPI)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Quitar filtro de KPI
            </button>
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          4. TABLA DE ARTÍCULOS MAESTRA
         ────────────────────────────────────────────────────────────────── */}
      <section aria-label="Catálogo Maestro de Artículos" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <th
                  scope="col"
                  onClick={() => handleOrdenar('sku')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SKU</span>
                    {orden.campo === 'sku' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {orden.direccion === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleOrdenar('nombre')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none min-w-[240px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nombre / Descripción</span>
                    {orden.campo === 'nombre' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {orden.direccion === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleOrdenar('categoria')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Categoría</span>
                    {orden.campo === 'categoria' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {orden.direccion === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleOrdenar('stockDisponible')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Existencia</span>
                    {orden.campo === 'stockDisponible' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {orden.direccion === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleOrdenar('stockMinimo')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Mínimo</span>
                    {orden.campo === 'stockMinimo' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {orden.direccion === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3">
                  Ubicación
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {articulosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[28px]">search_off</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No se encontraron artículos con los criterios seleccionados.
                      </p>
                      <p className="text-xs text-slate-400">
                        Intenta ajustar la búsqueda, el filtro de categoría o restablecer los KPIs.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFiltros}
                        className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Restablecer Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                articulosPaginados.map((art) => {
                  const esActivo = art.estatus !== 'Inactivo';
                  const esStockBajo = (art.stockDisponible || 0) <= (art.stockMinimo || 5);
                  const ubicacionTexto = art.ubicacionNave || art.ubicacionSugerida || 'Almacén Principal';

                  return (
                    <tr
                      key={art.id || art.sku}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        !esActivo ? 'opacity-60 bg-slate-50/40 dark:bg-slate-950/20' : ''
                      }`}
                    >
                      {/* SKU */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                          {art.sku}
                        </span>
                      </td>

                      {/* Nombre y Descripción */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {art.nombre}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {art.descripcionCorta || art.descripcion || `${art.marca || ''} ${art.modelo || ''}`}
                          </span>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {art.categoria}
                        </span>
                      </td>

                      {/* Existencia */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-black text-xs ${
                              esStockBajo ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {art.stockDisponible} <span className="text-[10px] font-normal text-slate-400">disp.</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            de {art.stockTotal || art.stockDisponible} total
                          </span>
                        </div>
                      </td>

                      {/* Stock Mínimo */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                          {art.stockMinimo || 5}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                          <span className="truncate max-w-[140px]" title={ubicacionTexto}>
                            {ubicacionTexto}
                          </span>
                        </span>
                      </td>

                      {/* Estado (Activo / Inactivo) */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {esActivo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(art)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
                            title="Editar información de artículo"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>

                          {/* Switch Activar / Desactivar */}
                          <button
                            type="button"
                            onClick={() => handleSolicitarToggleEstatus(art)}
                            className={`p-1.5 rounded-lg border transition-colors shadow-xs ${
                              esActivo
                                ? 'border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                : 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                            }`}
                            title={esActivo ? 'Desactivar artículo' : 'Reactivar artículo'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {esActivo ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            PAGINADOR
           ────────────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Mostrando{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {articulosFiltrados.length === 0 ? 0 : (paginaActual - 1) * elementosPorPagina + 1}
            </strong>{' '}
            a{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {Math.min(paginaActual * elementosPorPagina, articulosFiltrados.length)}
            </strong>{' '}
            de <strong className="text-slate-900 dark:text-slate-100">{articulosFiltrados.length}</strong> artículos
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all shadow-xs"
            >
              Anterior
            </button>

            <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all shadow-xs"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          MODAL DE CONFIRMACIÓN PARA DESACTIVAR ARTÍCULO
         ────────────────────────────────────────────────────────────────── */}
      {modalInactivarOpen && articuloAInactivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 animate-scaleUp">
            <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ¿Desactivar Artículo?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirmación de baja temporal en catálogo
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Estás a punto de marcar como <strong>Inactivo</strong> el artículo{' '}
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {articuloAInactivar.sku}
              </span>{' '}
              (<em>{articuloAInactivar.nombre}</em>).
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-4 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-amber-500">info</span>
                Efectos de la desactivación:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                <li>El registro no se eliminará; se mantendrá su historial íntegro.</li>
                <li>Se mostrará atenuado en el catálogo de almacén.</li>
                <li>No podrá seleccionarse en nuevas entradas ni vales de salida.</li>
              </ul>
            </div>

            <div className="mb-5">
              <label htmlFor="motivoBaja" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Motivo de la desactivación (opcional):
              </label>
              <input
                id="motivoBaja"
                type="text"
                value={motivoInactivacion}
                onChange={(e) => setMotivoInactivacion(e.target.value)}
                placeholder="Ej. Obsolescencia técnica, fin de vida o daño permanente..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setModalInactivarOpen(false);
                  setArticuloAInactivar(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarInactivacion}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Sí, Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          MODAL DE EDICIÓN RÁPIDA DE ARTÍCULO
         ────────────────────────────────────────────────────────────────── */}
      {modalEditarOpen && articuloAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Editar Artículo
                  </h3>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {articuloAEditar.sku}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Oficial del Artículo *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción Corta / Especificación
                </label>
                <input
                  type="text"
                  value={editForm.descripcionCorta}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, descripcionCorta: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editForm.categoria}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, categoria: e.target.value as CategoriaArticulo }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    {CATEGORIAS_LISTA.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ubicación en Nave
                  </label>
                  <input
                    type="text"
                    value={editForm.ubicacionNave}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, ubicacionNave: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Ej. Rack A-02, Nivel 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={editForm.marca}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, marca: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={editForm.modelo}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, modelo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.stockMinimo}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, stockMinimo: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.stockMaximo}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, stockMaximo: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/almacen/alta-articulo`}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  <span>Abrir asistente completo</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEditarOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAlmacenMaestro;
