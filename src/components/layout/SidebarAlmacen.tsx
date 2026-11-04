'use client';

import React, { useState } from 'react';
import type { RolUsuario } from '@/config/types';
import {
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconAlmacen,
} from '../ui/Icons';
import { useLanguage } from '../../context/LanguageContext';
import { SubsidebarFavoritos } from './subsidebarFavoritos';

interface SidebarAlmacenProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  activeModuleId: string;
  activeSubItemId?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  onLogout: () => void;
  rolUsuario?: RolUsuario;
}

export const SidebarAlmacen: React.FC<SidebarAlmacenProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  activeModuleId,
  activeSubItemId,
  onSelectModule,
  rolUsuario = 'requisiciones',
}) => {
  const { t } = useLanguage();
  const [openSectionOperaciones, setOpenSectionOperaciones] = useState(true);
  const [openSectionCatalogo, setOpenSectionCatalogo] = useState(true);

  const esSubItemActivo = (subId: string): boolean => {
    if (activeModuleId !== 'almacen') return false;
    if (!activeSubItemId || activeSubItemId === '') {
      return subId === '' || subId === 'almacen-dashboard';
    }
    return activeSubItemId === subId;
  };

  return (
    <aside
      className={`gemini-sidebar sidebar-almacen ${isCollapsed ? 'collapsed' : ''} ${
        isMobileOpen ? 'mobile-visible' : ''
      }`}
      aria-label="Navegación Almacén y SGA SIFYGSA"
    >
      {/* Cabecera Móvil */}
      <div className="sidebar-mobile-header">
        <div className="mobile-brand-row">
          <div
            className="sidebar-brand-lockup"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <IconAlmacen size={28} style={{ color: 'var(--primary)' }} />
            <span
              style={{
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                letterSpacing: '0.04em',
              }}
            >
              ALMACÉN SGA
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <IconClose size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-top-container">
        {/* ====================================================================
           MODO COLAPSADO / MINIMIZADO (Icon Rail Centrado para Almacén)
           ==================================================================== */}
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            {/* Herramientas Rápidas en Columna */}
            <div className="collapsed-tools-stack">
              <button
                type="button"
                className={`tool-icon-btn ${
                  activeModuleId === 'almacen' && (!activeSubItemId || activeSubItemId === '')
                    ? 'active'
                    : ''
                }`}
                title="Dashboard Almacén"
                onClick={() => onSelectModule('almacen', '')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>

              <button
                type="button"
                className={`tool-icon-btn ${activeModuleId === 'settings' ? 'active orange-solid' : ''}`}
                title={t('nav.settings')}
                onClick={() => onSelectModule('settings')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{ width: 16, height: 16 }}
                >
                  <path
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Combobox de Favoritos estilo NetSuite (Exclusivo Almacén) */}
              <SubsidebarFavoritos
                portal="almacen"
                rolUsuario={rolUsuario}
                activeModuleId={activeModuleId}
                activeSubItemId={activeSubItemId}
                onSelectModule={onSelectModule}
                isCollapsed={isCollapsed}
              />
            </div>

            <div className="collapsed-divider-line" />

            {/* Iconos de Grupos de Navegación Almacén */}
            <div className="collapsed-nav-icons">
              {/* Grupo 1: Operaciones de Almacén */}
              <button
                type="button"
                className={`collapsed-nav-btn almacen-group-btn ${
                  activeModuleId === 'almacen' &&
                  (!activeSubItemId ||
                    activeSubItemId === '' ||
                    activeSubItemId === 'recepcion-ir03' ||
                    activeSubItemId === 'salida' ||
                    activeSubItemId === 'asignaciones')
                    ? 'active-ops'
                    : ''
                }`}
                title="Operaciones de Almacén (IR03 / SA / Asignaciones)"
                onClick={() => onSelectModule('almacen', '')}
              >
                <IconAlmacen size={18} />
              </button>

              {/* Grupo 2: Catálogo & Suministros */}
              <button
                type="button"
                className={`collapsed-nav-btn almacen-ops-btn ${
                  activeModuleId === 'almacen' &&
                  (activeSubItemId === 'alta-articulo' || activeSubItemId === 'alta-servicio')
                    ? 'active-ops'
                    : ''
                }`}
                title="Catálogo & Suministros"
                onClick={() => onSelectModule('almacen', 'alta-articulo')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Grupo 4: Requisiciones */}
              <button
                type="button"
                className={`collapsed-nav-btn ops-group-btn ${
                  activeModuleId === 'compras' ? 'active-ops' : ''
                }`}
                title="Requisiciones de Compra"
                onClick={() => onSelectModule('compras', 'compras-mis-requisiciones')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================================
             MODO EXPANDIDO (Acordeones dedicados al Almacén)
             ==================================================================== */
          <>
            {/* Top Quick Tools Bar */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${
                    activeModuleId === 'almacen' && (!activeSubItemId || activeSubItemId === '')
                      ? 'active'
                      : ''
                  }`}
                  title="Dashboard Almacén"
                  onClick={() => onSelectModule('almacen', '')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'settings' ? 'active' : ''}`}
                  title={t('nav.settings')}
                  onClick={() => onSelectModule('settings')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Combobox de Favoritos estilo NetSuite (Exclusivo Almacén) */}
                <SubsidebarFavoritos
                  portal="almacen"
                  rolUsuario={rolUsuario}
                  activeModuleId={activeModuleId}
                  activeSubItemId={activeSubItemId}
                  onSelectModule={onSelectModule}
                  isCollapsed={isCollapsed}
                />
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--brand-tonal-text)',
                  backgroundColor: 'var(--brand-tonal-bg)',
                  border: '1px solid var(--brand-tonal-border)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-control)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                SGA ALMACÉN
              </span>
            </div>

            {/* Navigation Accordion Groups */}
            <nav className="sidebar-accordion-nav">
              {/* Grupo 1: OPERACIONES DE ALMACÉN */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSectionOperaciones(!openSectionOperaciones)}
                >
                  <div className="head-left-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-title-label">Operaciones de Almacén</span>
                  </div>
                  {openSectionOperaciones ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSectionOperaciones && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${
                        esSubItemActivo('') || esSubItemActivo('almacen-dashboard')
                          ? 'active-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('almacen', '')}
                    >
                      <span
                        className={`bullet-indicator ${
                          esSubItemActivo('') || esSubItemActivo('almacen-dashboard')
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>Dashboard General</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${esSubItemActivo('recepcion-ir03') ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('almacen', 'recepcion-ir03')}
                    >
                      <span className={`bullet-indicator ${esSubItemActivo('recepcion-ir03') ? 'orange' : 'gray'}`} />
                      <span>Entradas de Almacén (IR03)</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${esSubItemActivo('salida') ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('almacen', 'salida')}
                    >
                      <span className={`bullet-indicator ${esSubItemActivo('salida') ? 'orange' : 'gray'}`} />
                      <span>Salidas de Almacén (SA)</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${esSubItemActivo('asignaciones') ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('almacen', 'asignaciones')}
                    >
                      <span className={`bullet-indicator ${esSubItemActivo('asignaciones') ? 'orange' : 'gray'}`} />
                      <span>Asignaciones a Proyectos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Grupo 2: CATÁLOGO & SUMINISTROS */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSectionCatalogo(!openSectionCatalogo)}
                >
                  <div className="head-left-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-title-label">Catálogo &amp; Suministros</span>
                  </div>
                  {openSectionCatalogo ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSectionCatalogo && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${esSubItemActivo('alta-articulo') ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('almacen', 'alta-articulo')}
                    >
                      <span className={`bullet-indicator ${esSubItemActivo('alta-articulo') ? 'orange' : 'gray'}`} />
                      <span>+ Alta de Artículo</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${esSubItemActivo('alta-servicio') ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('almacen', 'alta-servicio')}
                    >
                      <span className={`bullet-indicator ${esSubItemActivo('alta-servicio') ? 'orange' : 'gray'}`} />
                      <span>Alta de Servicio</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Tarjeta Inferior de Estado del Sistema */}
      <div className="sidebar-bottom-status-card">
        {isCollapsed ? (
          <div
            className="collapsed-status-circle"
            title="SGA Almacén: En línea v3.4.1"
          >
            <span className="green-pulse-dot" />
          </div>
        ) : (
          <div className="status-badge-inner">
            <div>
              <p className="status-label-heading">SGA Almacén</p>
              <p className="status-live-indicator">
                <span className="green-pulse-dot" /> En línea
              </p>
            </div>
            <span className="version-pill-tag">v3.4.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarAlmacen;
