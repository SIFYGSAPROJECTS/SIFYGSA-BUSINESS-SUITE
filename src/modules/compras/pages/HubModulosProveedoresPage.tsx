'use client';

import React from 'react';
import Link from 'next/link';
import '../compras.css';

interface SubmoduloCardItem {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: string;
  colorClass: 'emerald' | 'indigo' | 'brand';
  tag: string;
}

const SUBMODULOS_PROVEEDORES: SubmoduloCardItem[] = [
  {
    id: 'proveedores-directorio',
    href: '/compras/proveedores',
    title: 'Proveedores (directorio)',
    description: 'Directorio unificado, cuentas y SAT 32-D.',
    icon: 'groups',
    colorClass: 'emerald',
    tag: 'Padrón de Contratistas',
  },
  {
    id: 'nuevo-proveedor',
    href: '/compras/proveedores/nuevo',
    title: 'Nuevo Proveedor',
    description: 'Formulario de alta y registro fiscal.',
    icon: 'person_add',
    colorClass: 'indigo',
    tag: 'Alta Asistida 5 Pasos',
  },
];

export const HubModulosProveedoresPage: React.FC = () => {
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
          <span className="text-slate-900 dark:text-slate-100 font-bold">Módulos de Proveedores</span>
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
            href="/compras/modulos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Ir al Hub de Compras"
          >
            <span className="material-symbols-outlined text-[17px] text-blue-600">shopping_cart</span>
            <span>Compras</span>
          </Link>
        </div>
      </div>

      {/* ── ENCABEZADO INSTITUCIONAL DE PROVEEDORES ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <span className="material-symbols-outlined text-[28px]">groups</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Proveedores
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    2 Submódulos
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Directorio unificado de contratistas, cuentas bancarias autorizadas, opinión de cumplimiento SAT 32-D y verificación 69-B.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUADRÍCULA DE SUBMÓDULOS DE PROVEEDORES (2 TARJETAS GRANDES) ── */}
      <section aria-label="Submódulos de Proveedores" className="cp-ventas-launcher-bar p-6 rounded-2xl mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto gap-6">
          {SUBMODULOS_PROVEEDORES.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 no-underline cursor-pointer"
            >
              {/* Ícono grande con gradiente */}
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-200 shadow-md ${
                  item.colorClass === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/25'
                    : 'bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-indigo-500/25'
                }`}
              >
                <span className="material-symbols-outlined text-[40px]">{item.icon}</span>
              </div>

              {/* Título */}
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h2>

              {/* Descripción */}
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1 max-w-xs">
                {item.description}
              </p>

              {/* Footer o tag de estado */}
              <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-primary transition-colors">
                <span>{item.tag}</span>
                <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
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

export default HubModulosProveedoresPage;
