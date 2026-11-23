'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_COMPRAS_FILTROS } from '../data/mock-data';
import '../compras.css';

interface SubmoduloCardItem {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: string;
  colorClass: 'brand' | 'cyan' | 'amber' | 'emerald' | 'indigo';
  badge?: number | string;
  badgeType?: 'warning' | 'primary';
  tag: string;
}

const SUBMODULOS_COMPRAS: SubmoduloCardItem[] = [
  {
    id: 'nueva-orden',
    href: '/compras/ordenes/nueva',
    title: 'Nueva Orden de Compra',
    description: 'Captura directa de ODC, partidas y cotizaciones.',
    icon: 'add_shopping_cart',
    colorClass: 'brand',
    tag: 'Formulario Asistido',
  },
  {
    id: 'ordenes',
    href: '/compras/ordenes',
    title: 'Órdenes de Compra',
    description: 'Gestión, seguimiento y control de órdenes.',
    icon: 'description',
    colorClass: 'cyan',
    tag: 'Listado y Seguimiento',
  },
  {
    id: 'por-actualizar',
    href: '/compras/ordenes/por-actualizar',
    title: 'Por Actualizar',
    description: 'Órdenes abiertas que requieren seguimiento.',
    icon: 'update',
    colorClass: 'amber',
    badge: MOCK_COMPRAS_FILTROS.ordenesPorActualizarCount,
    badgeType: 'warning',
    tag: '8 órdenes abiertas',
  },
  {
    id: 'pendientes',
    href: '/compras/ordenes/pendientes',
    title: 'Órdenes Pendientes',
    description: 'En espera de validación gerencial y liberación.',
    icon: 'pending_actions',
    colorClass: 'brand',
    badge: MOCK_COMPRAS_FILTROS.ordenesPendientesCount,
    badgeType: 'primary',
    tag: '14 por firmar',
  },
  {
    id: 'autorizar',
    href: '/compras/ordenes/autorizar',
    title: 'Autorización de Órdenes',
    description: 'Validación gerencial, firma digital y liberación.',
    icon: 'verified_user',
    colorClass: 'amber',
    tag: 'Mesa de Validación',
  },
  {
    id: 'requisiciones',
    href: '/requisiciones',
    title: 'Requisiciones',
    description: 'Solicitudes de compra, materiales y autorizaciones internas.',
    icon: 'assignment',
    colorClass: 'brand',
    tag: 'Solicitudes y Aprobación',
  },
];

export const HubModulosComprasPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── BREADCRUMB & ACCIÓN SUPERIOR ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/compras" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[16px]">home</span>
            Dashboard Compras
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">Módulos de Compras</span>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/compras"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Volver al dashboard principal de Compras"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            <span>Volver al dashboard</span>
          </Link>

          <Link
            href="/compras/proveedores/modulos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Ir al Hub de Proveedores"
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-600">groups</span>
            <span>Proveedores</span>
          </Link>

          <Link
            href="/requisiciones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Ir al submódulo de Requisiciones"
          >
            <span className="material-symbols-outlined text-[17px] text-amber-600">assignment</span>
            <span>Requisiciones</span>
          </Link>
        </div>
      </div>

      {/* ── ENCABEZADO INSTITUCIONAL DE COMPRAS ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-[28px]">shopping_cart</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Compras
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    6 Submódulos
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Centro unificado para la gestión operativa de adquisiciones, emisión de órdenes de compra, seguimiento y mesa de autorización.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUADRÍCULA DE SUBMÓDULOS DE COMPRAS (CARPETAS GRANDES CON EFECTO HOVER) ── */}
      <section aria-label="Submódulos de Compras" className="cp-ventas-launcher-bar p-6 rounded-2xl mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {SUBMODULOS_COMPRAS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 no-underline cursor-pointer"
            >
              {/* Badge si tiene contador */}
              {item.badge !== undefined && (
                <span
                  className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-black text-white shadow-sm font-mono ${
                    item.badgeType === 'warning' ? 'bg-amber-600' : 'bg-primary'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Ícono grande con gradiente */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200 shadow-md ${
                  item.colorClass === 'brand'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/25'
                    : item.colorClass === 'cyan'
                    ? 'bg-gradient-to-br from-sky-600 to-sky-700 shadow-sky-500/25'
                    : item.colorClass === 'amber'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25'
                    : 'bg-gradient-to-br from-slate-600 to-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[32px]">{item.icon}</span>
              </div>

              {/* Título */}
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-primary transition-colors">
                {item.title}
              </h2>

              {/* Descripción */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">
                {item.description}
              </p>

              {/* Footer o tag de estado */}
              <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-primary transition-colors">
                <span>{item.tag}</span>
                <span className="material-symbols-outlined text-[16px] transform group-hover:translate-x-1 transition-transform">
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

export default HubModulosComprasPage;
