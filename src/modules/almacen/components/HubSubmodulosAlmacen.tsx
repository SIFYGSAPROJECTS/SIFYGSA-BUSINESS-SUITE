'use client';

import React from 'react';
import Link from 'next/link';
import '../almacen.css';

export interface SubmoduloCardItem {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: string;
  colorClass: 'brand' | 'emerald' | 'amber';
  tag: string;
}

export interface HubSubmodulosAlmacenProps {
  titulo: string;
  subtitulo: string;
  badgeTexto: string;
  headerIcon: string;
  headerColorClass?: 'brand' | 'emerald';
  breadcrumbModulo: string;
  items: SubmoduloCardItem[];
}

export const HubSubmodulosAlmacen: React.FC<HubSubmodulosAlmacenProps> = ({
  titulo,
  subtitulo,
  badgeTexto,
  headerIcon,
  headerColorClass = 'brand',
  breadcrumbModulo,
  items,
}) => {
  const isEmerald = headerColorClass === 'emerald';

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── BREADCRUMB & ACCIÓN SUPERIOR ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href="/almacen"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Dashboard Almacén
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">{breadcrumbModulo}</span>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/almacen"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Volver al dashboard principal de Almacén"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            <span>Volver al dashboard</span>
          </Link>
        </div>
      </div>

      {/* ── ENCABEZADO INSTITUCIONAL ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
                  isEmerald
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/20'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">{headerIcon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {titulo}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isEmerald
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    {badgeTexto}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitulo}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUADRÍCULA DE SUBMÓDULOS (3 TARJETAS GRANDES) ── */}
      <section aria-label={`Submódulos de ${titulo}`} className="cp-ventas-launcher-bar p-6 rounded-2xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 no-underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {/* Ícono grande con gradiente */}
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-200 shadow-md ${
                  item.colorClass === 'brand'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/25'
                    : item.colorClass === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/25'
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25'
                }`}
              >
                <span className="material-symbols-outlined text-[40px]">{item.icon}</span>
              </div>

              {/* Título */}
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.title}
              </h2>

              {/* Descripción */}
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1 max-w-xs">
                {item.description}
              </p>

              {/* Footer o tag de estado con flecha */}
              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <span>{item.tag}</span>
                <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HubSubmodulosAlmacen;
