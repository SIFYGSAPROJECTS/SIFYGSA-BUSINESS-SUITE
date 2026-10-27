'use client';

import React, { useState } from 'react';
import type { RolUsuario } from '@/config/types';
import { obtenerSubItemsPermitidosModulo } from '@/modules/registry';
import { IconChevronDown, IconChevronRight, IconClose } from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  activeModuleId: string;
  activeSubItemId?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  onLogout: () => void;
  showAdmin?: boolean;
  rolUsuario?: RolUsuario;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  activeModuleId,
  activeSubItemId,
  onSelectModule,
  showAdmin = false,
  rolUsuario = 'administrador',
}) => {
  const { language, t } = useLanguage();
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(true);
  const [openSection3, setOpenSection3] = useState(true);

  const subItemsCrm = obtenerSubItemsPermitidosModulo('crm', rolUsuario);
  const subItemsRequisiciones = obtenerSubItemsPermitidosModulo('requisiciones', rolUsuario);
  const subItemsAdmin = obtenerSubItemsPermitidosModulo('admin', rolUsuario);

  const subItemInicialCompras =
    subItemsRequisiciones.find((s) => s.id === 'compras-requisicion')?.id ??
    subItemsRequisiciones[0]?.id ??
    'compras-mis-requisiciones';

  const esSubItemCrmActivo = (idSubItem: string): boolean => {
    if (activeModuleId !== 'crm') return false;
    if (idSubItem === 'crm-opportunities') {
      return (
        !activeSubItemId ||
        activeSubItemId === 'crm-opportunities' ||
        activeSubItemId === 'crm-opportunity-detail'
      );
    }
    if (idSubItem === 'crm-kanban') {
      return (
        activeSubItemId === 'crm-kanban' ||
        activeSubItemId === 'crm-gantt' ||
        activeSubItemId === 'crm-calendar'
      );
    }
    return activeSubItemId === idSubItem;
  };

  const esSubItemComprasActivo = (idSubItem: string): boolean => {
    if (activeModuleId !== 'compras') return false;
    if (!activeSubItemId) {
      return idSubItem === subItemInicialCompras;
    }
    return activeSubItemId === idSubItem;
  };

  return (
    <aside
      className={`gemini-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-visible' : ''}`}
      aria-label="Navegación SIFYGSA"
    >
      {/* Cabecera Móvil (solo visible en pantallas pequeñas) */}
      <div className="sidebar-mobile-header">
        <div className="mobile-brand-row">
          <div className="sidebar-brand-lockup" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SfgLogoSymbol size={28} />
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>SIFYGSA</span>
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
           MODO COLAPSADO / MINIMIZADO (Icon Rail Centrado)
           ==================================================================== */}
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            {/* Herramientas Rápidas en Columna */}
            <div className="collapsed-tools-stack">
              <button
                type="button"
                className={`tool-icon-btn ${activeModuleId === 'dashboard' ? 'active' : ''}`}
                title={t('nav.home')}
                onClick={() => onSelectModule('dashboard')}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                  <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="collapsed-divider-line" />

            {/* Iconos de Grupos de Navegación */}
            <div className="collapsed-nav-icons">
              {subItemsCrm.length > 0 && (
                <button
                  type="button"
                  className={`collapsed-nav-btn crm-group-btn ${activeModuleId === 'crm' ? 'active-crm' : ''}`}
                  title="CRM & Ventas"
                  onClick={() => onSelectModule('crm', 'crm-opportunities')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {/* Icono de Grupo 2: Operaciones — Requisición */}
              <button
                type="button"
                className={`collapsed-nav-btn ops-group-btn ${activeModuleId === 'compras' ? 'active-ops' : ''}`}
                title="Operaciones — Requisición"
                onClick={() => onSelectModule('compras', subItemInicialCompras)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showAdmin && subItemsAdmin.length > 0 && (
                <button
                  type="button"
                  className={`collapsed-nav-btn ${activeModuleId === 'admin' ? 'active-crm' : ''}`}
                  title="Administración General"
                  onClick={() => onSelectModule('admin', 'resumen')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ====================================================================
             MODO EXPANDIDO (Generado desde el registro central de módulos)
             ==================================================================== */
          <>
            {/* Top Quick Tools Bar (Home y Ajustes) */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'dashboard' ? 'active' : ''}`}
                  title={t('nav.home')}
                  onClick={() => onSelectModule('dashboard')}
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
              </div>
            </div>

            {/* Navigation Links Group (CRM & VENTAS + OPERACIONES + ADMINISTRADOR) */}
            <nav className="sidebar-accordion-nav">
              {/* Group 1: CRM & VENTAS */}
              {subItemsCrm.length > 0 && (
                <div className="accordion-entry">
                  <button
                    type="button"
                    className="accordion-head-btn"
                    onClick={() => setOpenSection1(!openSection1)}
                  >
                    <div className="head-left-content">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                        <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="group-title-label">{t('nav.crm')}</span>
                    </div>
                    {openSection1 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </button>

                  {openSection1 && (
                    <div className="accordion-sub-stack">
                      {subItemsCrm.map((sub) => {
                        const activo = esSubItemCrmActivo(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            className={`sub-nav-link ${activo ? 'active-pill' : ''}`}
                            onClick={() => onSelectModule('crm', sub.vista)}
                          >
                            <span className={`bullet-indicator ${activo ? 'orange' : 'gray'}`} />
                            <span>{language === 'en' ? sub.nombreEn : sub.nombre}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Group 2: OPERACIONES / REQUISICIONES (Abierto a todos los roles) */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection2(!openSection2)}
                >
                  <div className="head-left-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-title-label">{t('nav.operations')}</span>
                  </div>
                  {openSection2 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection2 && (
                  <div className="accordion-sub-stack">
                    {subItemsRequisiciones.map((sub) => {
                      const activo = esSubItemComprasActivo(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          className={`sub-nav-link ${activo ? 'active-pill' : ''}`}
                          onClick={() => onSelectModule('compras', sub.vista)}
                        >
                          <span className={`bullet-indicator ${activo ? 'orange' : 'gray'}`} />
                          <span>{language === 'en' ? sub.nombreEn : sub.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group 3: ADMINISTRACIÓN (solo si tiene permiso) */}
              {showAdmin && subItemsAdmin.length > 0 && (
                <div className="accordion-entry">
                  <button
                    type="button"
                    className="accordion-head-btn"
                    onClick={() => setOpenSection3(!openSection3)}
                  >
                    <div className="head-left-content">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="group-title-label">Administración</span>
                    </div>
                    {openSection3 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </button>

                  {openSection3 && (
                    <div className="accordion-sub-stack">
                      {subItemsAdmin.map((sub) => {
                        const activo =
                          activeModuleId === 'admin' &&
                          ((!activeSubItemId && sub.id === 'resumen') || activeSubItemId === sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            className={`sub-nav-link ${activo ? 'active-pill' : ''}`}
                            onClick={() => onSelectModule('admin', sub.vista)}
                          >
                            <span className={`bullet-indicator ${activo ? 'orange' : 'gray'}`} />
                            <span>{language === 'en' ? sub.nombreEn : sub.nombre}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </>
        )}
      </div>

      {/* Tarjeta Inferior de Estado del Sistema (System Status) */}
      <div className="sidebar-bottom-status-card">
        {isCollapsed ? (
          <div
            className="collapsed-status-circle"
            title={`${t('nav.system_status')}: ${t('nav.optimal_online')} v3.4.1`}
          >
            <span className="green-pulse-dot" />
          </div>
        ) : (
          <div className="status-badge-inner">
            <div>
              <p className="status-label-heading">{t('nav.system_status')}</p>
              <p className="status-live-indicator">
                <span className="green-pulse-dot" /> {t('nav.optimal_online')}
              </p>
            </div>
            <span className="version-pill-tag">v3.4.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
