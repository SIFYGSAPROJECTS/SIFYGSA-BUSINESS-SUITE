'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface ModuleMenuProps {
  className?: string;
  onNavigate?: () => void;
}

/**
 * Componente compartido ModuleMenu
 * Botones de navegación directa a las pantallas Hub de submódulos:
 * - "Proveedores" (secundario con borde, ícono groups) -> /proveedores/modulos
 * - "Compras" (primario azul #1D4ED8, ícono shopping_cart) -> /compras/modulos
 * Sin comportamiento de menú desplegable ni chevrons, con navegación directa de router y marcas activas.
 */
export const ModuleMenu: React.FC<ModuleMenuProps> = ({ className = '', onNavigate }) => {
  const pathname = usePathname() || '';

  // Detección de módulo activo
  const esProveedoresHub =
    pathname === '/proveedores/modulos' ||
    pathname === '/compras/proveedores/modulos' ||
    pathname.startsWith('/compras/proveedores');

  const esComprasHub =
    pathname === '/compras/modulos' ||
    (!esProveedoresHub &&
      (pathname.startsWith('/compras/ordenes') ||
        pathname.startsWith('/compras/facturas') ||
        pathname.startsWith('/compras/requisiciones') ||
        pathname === '/compras'));

  return (
    <div
      className={`compras-header-actions flex items-center gap-2.5 relative ${className}`}
      style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
    >
      {/* ── BOTÓN 1: PROVEEDORES (Secundario, con borde, sin chevron) ── */}
      <Link
        href="/compras/proveedores/modulos"
        id="btn-nav-proveedores"
        onClick={onNavigate}
        className={`cp-btn cp-btn-secondary inline-flex items-center gap-2 cursor-pointer transition-all select-none no-underline ${
          esProveedoresHub ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs' : ''
        }`}
        style={{
          textDecoration: 'none',
          ...(esProveedoresHub
            ? {
                borderColor: '#059669',
                color: '#059669',
                fontWeight: 700,
              }
            : {}),
        }}
        title="Ir a la pantalla de módulos de Proveedores"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: esProveedoresHub ? '#059669' : 'inherit' }}
        >
          groups
        </span>
        <span className="hidden sm:inline">Proveedores</span>
      </Link>

      {/* ── BOTÓN 2: COMPRAS (Primario, azul de marca #1D4ED8, sin chevron) ── */}
      <Link
        href="/compras/modulos"
        id="btn-nav-compras"
        onClick={onNavigate}
        className={`cp-btn cp-btn-primary inline-flex items-center gap-2 cursor-pointer transition-all select-none no-underline ${
          esComprasHub ? 'ring-2 ring-blue-400/50 shadow-md font-bold' : ''
        }`}
        style={{
          textDecoration: 'none',
          backgroundColor: 'var(--primary, #1D4ED8)',
          color: '#ffffff',
          fontWeight: 700,
        }}
        title="Ir a la pantalla de módulos de Compras"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          shopping_cart
        </span>
        <span>Compras</span>
      </Link>
    </div>
  );
};

export default ModuleMenu;
