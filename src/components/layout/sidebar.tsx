'use client';

import React from 'react';
import type { RolUsuario } from '@/config/types';
import { obtenerSubItemsPermitidosModulo, type SubItemModulo } from '@/modules/registry';
import { IconChevronRight, IconClose, IconShieldCheck } from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { SubsidebarFavoritos } from './subsidebarFavoritos';

type CrmSidebarModuleKey = 'crm' | 'admin';

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

interface ModuleConfig {
  key: CrmSidebarModuleKey;
  title: string;
  titleEn: string;
  subItems: SubItemModulo[];
  activeCollapsedClass: string;
}

function renderModuleIcon(key: CrmSidebarModuleKey, size: number = 16) {
  if (key === 'crm') {
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        style={{ width: size, height: size }}
      >
        <path
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return <IconShieldCheck size={size} />;
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

  const subItemsCrm = obtenerSubItemsPermitidosModulo('crm', rolUsuario);
  const subItemsAdmin = obtenerSubItemsPermitidosModulo('admin', rolUsuario);

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

  const esSubItemAdminActivo = (idSubItem: string): boolean => {
    if (activeModuleId !== 'admin') return false;
    return (!activeSubItemId && idSubItem === 'resumen') || activeSubItemId === idSubItem;
  };

  const getActiveSubmoduleName = (mod: ModuleConfig): string | null => {
    if (activeModuleId !== mod.key) return null;
    if (activeSubItemId === '__menu__') {
      return language === 'en' ? 'Module selector' : 'Menú selectivo';
    }
    const found = mod.subItems.find((sub) => {
      if (mod.key === 'crm') return esSubItemCrmActivo(sub.id);
      return esSubItemAdminActivo(sub.id);
    });
    if (!found) return null;
    return language === 'en' ? found.nombreEn : found.nombre;
  };

  const modulesList: ModuleConfig[] = [];
  if (subItemsCrm.length > 0) {
    modulesList.push({
      key: 'crm',
      title: t('nav.crm'),
      titleEn: 'CRM & Sales',
      subItems: subItemsCrm,
      activeCollapsedClass: 'active-crm',
    });
  }
  if (showAdmin && subItemsAdmin.length > 0) {
    modulesList.push({
      key: 'admin',
      title: 'Administración',
      titleEn: 'Administration',
      subItems: subItemsAdmin,
      activeCollapsedClass: 'active-crm',
    });
  }

  return (
    <aside
      className={`gemini-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-visible' : ''}`}
      aria-label="Navegación SIFYGSA"
    >
      {/* Cabecera Móvil (solo visible en pantallas pequeñas) */}
      <div className="sidebar-mobile-header">
        <div className="mobile-brand-row">
          <div
            className="sidebar-brand-lockup"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <SfgLogoSymbol size={28} />
            <span
              style={{
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                letterSpacing: '0.04em',
              }}
            >
              SIFYGSA
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
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ width: 16, height: 16 }}
                >
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

              {/* Combobox de Favoritos estilo NetSuite (Exclusivo CRM) */}
              <SubsidebarFavoritos
                portal="crm"
                rolUsuario={rolUsuario}
                showAdmin={showAdmin}
                activeModuleId={activeModuleId}
                activeSubItemId={activeSubItemId}
                onSelectModule={onSelectModule}
                isCollapsed={isCollapsed}
              />
            </div>

            <div className="collapsed-divider-line" />

            {/* Iconos de Módulos Principales CRM (Al hacer clic abren la vista selectiva .tsx del módulo) */}
            <div className="collapsed-nav-icons">
              {modulesList.map((mod) => {
                const isModuleActive = activeModuleId === mod.key;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    className={`collapsed-nav-btn ${isModuleActive ? mod.activeCollapsedClass : ''}`}
                    title={language === 'en' ? mod.titleEn : mod.title}
                    onClick={() => onSelectModule(mod.key, '__menu__')}
                  >
                    {renderModuleIcon(mod.key, 18)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ====================================================================
             MODO EXPANDIDO (Módulos Principales Limpios → Clic abre Menú Selectivo)
             ==================================================================== */
          <>
            {/* Top Quick Tools Bar (Home, Ajustes y Favoritos Combobox) */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'dashboard' ? 'active' : ''}`}
                  title={t('nav.home')}
                  onClick={() => onSelectModule('dashboard')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ width: 16, height: 16 }}
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'settings' ? 'active' : ''}`}
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

                {/* Combobox de Favoritos estilo NetSuite (Exclusivo CRM) */}
                <SubsidebarFavoritos
                  portal="crm"
                  rolUsuario={rolUsuario}
                  showAdmin={showAdmin}
                  activeModuleId={activeModuleId}
                  activeSubItemId={activeSubItemId}
                  onSelectModule={onSelectModule}
                  isCollapsed={isCollapsed}
                />
              </div>
            </div>

            {/* Lista Limpia de Módulos Principales (Sin desplegables permanentes) */}
            <nav className="sidebar-accordion-nav" aria-label="Módulos principales CRM">
              {modulesList.map((mod) => {
                const isModuleActive = activeModuleId === mod.key;
                const activeSubName = getActiveSubmoduleName(mod);

                return (
                  <div key={mod.key} className="accordion-entry">
                    <button
                      type="button"
                      className={`accordion-head-btn sidebar-module-trigger ${isModuleActive ? 'is-active-module' : ''}`}
                      onClick={() => onSelectModule(mod.key, '__menu__')}
                    >
                      <div className="head-left-content">
                        {renderModuleIcon(mod.key, 16)}
                        <div className="sidebar-module-label-group">
                          <span className="group-title-label">
                            {language === 'en' ? mod.titleEn : mod.title}
                          </span>
                          {activeSubName && (
                            <span className="sidebar-active-sub-hint">{activeSubName}</span>
                          )}
                        </div>
                      </div>
                      <IconChevronRight size={14} className="sidebar-module-chevron" />
                    </button>
                  </div>
                );
              })}
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
