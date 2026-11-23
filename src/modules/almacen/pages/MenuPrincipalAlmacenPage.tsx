'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { DashboardAlmacenMaestro } from '../components/DashboardAlmacenMaestro';
import '../almacen.css';

export const MenuPrincipalAlmacenPage: React.FC = () => {
  // Estado para desplegar los menús de acciones rápidas (solo uno abierto a la vez)
  const [menuAbierto, setMenuAbierto] = useState<'articulos' | 'servicios' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuAbierto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (tipo: 'articulos' | 'servicios') => {
    setMenuAbierto((prev) => (prev === tipo ? null : tipo));
  };

  return (
    <div
      className="almacen-module-container cp-menu-principal-container w-full"
      style={{
        padding: '1.25rem 1.5rem',
        maxWidth: 1440,
        margin: '0 auto',
      }}
    >
      {/* ── 1. ENCABEZADO INSTITUCIONAL DE ALMACÉN CON SELECTORES DE ACCIÓN ── */}
      <div className="dashboard-almacen-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="dashboard-almacen-title-group">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Almacén
              </h1>
            </div>
          </div>
        </div>

        {/* ── SELECTORES TIPO SELECTOR: ARTÍCULOS Y SERVICIOS CON MENÚS DESPLEGABLES ── */}
        <div ref={containerRef} className="dashboard-almacen-actions flex items-center gap-2.5 relative">
          {/* SELECTOR 1: ARTÍCULOS (Botón Split: Clic en texto/ícono -> /almacen/articulos, Clic en flecha -> despliega menú) */}
          <div className="relative inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
            <Link
              href="/almacen/articulos"
              className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors no-underline cursor-pointer rounded-l-xl"
              title="Ir al Hub de Artículos"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                inventory_2
              </span>
              <span>Artículos</span>
            </Link>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

            <button
              type="button"
              onClick={() => toggleMenu('articulos')}
              className={`p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer rounded-r-xl ${
                menuAbierto === 'articulos'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-400'
              }`}
              title="Acciones de Artículos e Inventario"
              aria-expanded={menuAbierto === 'articulos'}
            >
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-200 block ${
                  menuAbierto === 'articulos' ? 'rotate-180 text-blue-600' : 'text-slate-400'
                }`}
              >
                keyboard_arrow_down
              </span>
            </button>

            {/* Menú Desplegable de Artículos */}
            {menuAbierto === 'articulos' && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Acciones de Artículos
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {/* Opción 1: Nuevo artículo */}
                  <Link
                    href="/almacen/alta-articulo"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Nuevo artículo</span>
                      <span className="text-[10px] text-slate-400">Formulario asistido de alta</span>
                    </div>
                  </Link>

                  {/* Opción 2: Entrada a inventario */}
                  <Link
                    href="/almacen/recepcion-ir03?origen=articulos"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Entrada a inventario</span>
                      <span className="text-[10px] text-slate-400">Recepción de mercancía (IR03)</span>
                    </div>
                  </Link>

                  {/* Opción 3: Salida de inventario */}
                  <Link
                    href="/almacen/salida?origen=articulos"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">outbox</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Salida de inventario</span>
                      <span className="text-[10px] text-slate-400">Vale de salida a proyecto (SA)</span>
                    </div>
                  </Link>

                  {/* Opción 4: Requisición de artículos */}
                  <Link
                    href="/requisiciones"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Requisición de artículos</span>
                      <span className="text-[10px] text-slate-400">Solicitud de material para obra o reposición</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* SELECTOR 2: SERVICIOS (Botón Split: Clic en texto/ícono -> /almacen/servicios, Clic en flecha -> despliega menú) */}
          <div className="relative inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
            <Link
              href="/almacen/servicios"
              className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors no-underline cursor-pointer rounded-l-xl"
              title="Ir al Hub de Servicios"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                extension
              </span>
              <span>Servicios</span>
            </Link>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

            <button
              type="button"
              onClick={() => toggleMenu('servicios')}
              className={`p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer rounded-r-xl ${
                menuAbierto === 'servicios'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}
              title="Acciones de Servicios y Pruebas"
              aria-expanded={menuAbierto === 'servicios'}
            >
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-200 block ${
                  menuAbierto === 'servicios' ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                }`}
              >
                keyboard_arrow_down
              </span>
            </button>

            {/* Menú Desplegable de Servicios */}
            {menuAbierto === 'servicios' && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Acciones de Servicios
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {/* Opción 1: Nuevo servicio */}
                  <Link
                    href="/almacen/alta-servicio"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Nuevo servicio</span>
                      <span className="text-[10px] text-slate-400">Alta de servicio no inventariable</span>
                    </div>
                  </Link>

                  {/* Opción 2: Entrada a inventario */}
                  <Link
                    href="/almacen/recepcion-ir03?origen=servicios"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Entrada a inventario</span>
                      <span className="text-[10px] text-slate-400">Validación y recepción física (IR03)</span>
                    </div>
                  </Link>

                  {/* Opción 3: Salida de inventario */}
                  <Link
                    href="/almacen/salida?origen=servicios"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">outbox</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Salida de inventario</span>
                      <span className="text-[10px] text-slate-400">Asignación de servicio a proyecto</span>
                    </div>
                  </Link>

                  {/* Opción 4: Requisición de servicios */}
                  <Link
                    href="/requisiciones"
                    onClick={() => setMenuAbierto(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group no-underline"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Requisición de servicios</span>
                      <span className="text-[10px] text-slate-400">Solicitud de pruebas o calibración técnica</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* SELECTOR 3: REQUISICIONES (Enlace directo a requisiciones) */}
          <Link
            href="/requisiciones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs transition-colors no-underline cursor-pointer"
            title="Ir al submódulo de Requisiciones"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">
              assignment
            </span>
            <span>Requisiciones</span>
          </Link>
        </div>
      </div>

      {/* ── 2. DASHBOARD INTEGRAL DE ALMACÉN (KPIS, BUSCADOR, FILTROS Y TABLA DE ARTÍCULOS) ── */}
      <section aria-label="Dashboard Operativo de Almacén" className="w-full">
        <DashboardAlmacenMaestro />
      </section>
    </div>
  );
};

export default MenuPrincipalAlmacenPage;

