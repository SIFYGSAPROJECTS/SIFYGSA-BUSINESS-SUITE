'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconClose } from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';

interface SidebarAutorizacionProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
}

export const SidebarAutorizacion: React.FC<SidebarAutorizacionProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  onSelectModule,
}) => {
  const pathname = usePathname() || '';
  const esAutorizacionActiva = pathname.startsWith('/autorizacion-ordenes');

  return (
    <aside
      className={`gemini-sidebar sidebar-compras ${isCollapsed ? 'collapsed' : ''} ${
        isMobileOpen ? 'mobile-visible' : ''
      }`}
      aria-label="Navegación Autorización de Órdenes de Compra SIFYGSA"
    >
      <div className="sidebar-mobile-header">
        <div className="mobile-brand-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SfgLogoSymbol size={28} />
          <span className="mobile-brand-text">SIFYGSA</span>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Cerrar menú lateral"
          >
            <IconClose size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-top-container">
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            <div className="collapsed-tools-stack">
              <button
                type="button"
                className="tool-icon-btn"
                title="Menú Principal SIFYGSA"
                onClick={() => onSelectModule('dashboard')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>

              <button
                type="button"
                className="tool-icon-btn"
                title="Ajustes"
                onClick={() => onSelectModule('settings')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                  <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="collapsed-divider-line" />

            <div className="collapsed-nav-icons">
              <Link
                href="/autorizacion-ordenes"
                className={`collapsed-nav-btn ${esAutorizacionActiva ? 'active-crm' : ''}`}
                title="Autorización de Órdenes de Compra (Mesa de Validación)"
                aria-label="Autorización de Órdenes de Compra"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 19,
                    color: esAutorizacionActiva ? '#ffffff' : '#d97706',
                  }}
                >
                  verified_user
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <nav className="sidebar-accordion-nav" aria-label="Autorización de Órdenes de Compra">
            <div className="accordion-entry">
              <Link
                href="/autorizacion-ordenes"
                className={`accordion-head-btn sidebar-module-trigger ${
                  esAutorizacionActiva ? 'is-active-module' : ''
                }`}
                style={{ textDecoration: 'none' }}
              >
                <div className="head-left-content">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#d97706' }}>
                    verified_user
                  </span>
                  <div className="sidebar-module-label-group">
                    <span className="group-title-label">Autorización de Órdenes</span>
                    <span className="sidebar-active-sub-hint">Mesa de Validación</span>
                  </div>
                </div>
              </Link>
            </div>
          </nav>
        )}
      </div>

      <div className="sidebar-bottom-status-card">
        {isCollapsed ? (
          <div className="collapsed-status-circle" title="Estado del Sistema: En Línea v3.4.1">
            <span className="green-pulse-dot" />
          </div>
        ) : (
          <div className="status-badge-inner">
            <div>
              <p className="status-label-heading">Estado del Sistema</p>
              <p className="status-live-indicator">
                <span className="green-pulse-dot" /> En Línea
              </p>
            </div>
            <span className="version-pill-tag">v3.4.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarAutorizacion;
