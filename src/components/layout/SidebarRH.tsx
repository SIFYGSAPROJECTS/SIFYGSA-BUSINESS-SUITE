'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  LayoutGrid,
  UserPlus,
  Users,
  CalendarDays,
  FileText,
  Building2,
  Phone,
  Cake,
  CalendarCheck,
} from 'lucide-react';
import type { IdModulo, RolUsuario } from '@/config/types';
import { obtenerSubItemsPermitidosModulo } from '@/modules/registry';
import {
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconUsers,
} from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { SubsidebarFavoritos } from './subsidebarFavoritos';

interface SidebarRHProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  activeModuleId: string;
  activeSubItemId?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  onLogout: () => void;
  rolUsuario?: RolUsuario;
  modulosPermitidos?: IdModulo[];
}

interface FloatingTooltipState {
  label: string;
  top: number;
  left: number;
}

function renderSubItemIcon(subId: string, active: boolean) {
  const size = 18;
  const strokeWidth = active ? 2.2 : 1.9;
  const colorMap: Record<string, string> = {
    'rrhh-panel': '#1D4ED8',
    'rrhh-alta': '#2563EB',
    'rrhh-catalogos': '#4F46E5',
    'rrhh-vacaciones': '#059669',
    'rrhh-formatos': '#D97706',
    'rrhh-departamentos': '#0284C7',
    'rrhh-extensiones': '#7C3AED',
    'rrhh-cumpleanos': '#DB2777',
    'rrhh-festivos': '#0D9488',
  };
  const style = active ? undefined : { color: colorMap[subId] ?? 'currentColor' };

  switch (subId) {
    case 'rrhh-panel':
      return <LayoutDashboard size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-alta':
      return <UserPlus size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-catalogos':
      return <Users size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-vacaciones':
      return <CalendarDays size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-formatos':
      return <FileText size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-departamentos':
      return <Building2 size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-extensiones':
      return <Phone size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-cumpleanos':
      return <Cake size={size} strokeWidth={strokeWidth} style={style} />;
    case 'rrhh-festivos':
      return <CalendarCheck size={size} strokeWidth={strokeWidth} style={style} />;
    default:
      return <IconUsers size={size} />;
  }
}

export const SidebarRH: React.FC<SidebarRHProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  activeModuleId,
  activeSubItemId,
  onSelectModule,
  rolUsuario = 'rrhh',
  modulosPermitidos,
}) => {
  const { language, t } = useLanguage();
  const [openSectionRh, setOpenSectionRh] = useState(true);
  const [tooltip, setTooltip] = useState<FloatingTooltipState | null>(null);

  const subItemsRrhh = obtenerSubItemsPermitidosModulo('rrhh', rolUsuario, modulosPermitidos);
  const navSubItemsRail = subItemsRrhh.filter((sub) => sub.id !== 'rrhh-panel');

  const esSubItemRrhhActivo = (idSubItem: string): boolean => {
    if (activeModuleId !== 'rh' && activeModuleId !== 'rrhh') return false;
    if (activeSubItemId === '__menu__') return false;
    if (!activeSubItemId || activeSubItemId === 'rh-directorio') {
      return idSubItem === 'rrhh-panel';
    }
    return activeSubItemId === idSubItem;
  };

  const esMenuSelectivoActivo =
    (activeModuleId === 'rh' || activeModuleId === 'rrhh') && activeSubItemId === '__menu__';

  const showFloatingTooltip = (e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const hideFloatingTooltip = () => setTooltip(null);

  return (
    <aside
      className={`gemini-sidebar sidebar-rh ${isCollapsed ? 'collapsed' : ''} ${
        isMobileOpen ? 'mobile-visible' : ''
      }`}
      aria-label="Navegación Recursos Humanos SIFYGSA"
    >
      {/* Cabecera Móvil (solo visible en pantallas pequeñas) */}
      <div className="sidebar-mobile-header sidebar-rh-mobile-header">
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
              RH SUITE
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
           MODO COLAPSADO / MINIMIZADO (Icon Rail Completo para RRHH)
           ==================================================================== */}
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            {/* Herramientas Rápidas en Columna */}
            <div className="collapsed-tools-stack">
              <button
                type="button"
                className={`tool-icon-btn ${
                  esSubItemRrhhActivo('rrhh-panel') ? 'active-rh' : ''
                }`}
                title={language === 'en' ? 'Main Menu (HR)' : 'Menú Principal RH'}
                aria-label={language === 'en' ? 'Main Menu (HR)' : 'Menú Principal RH'}
                onClick={() => onSelectModule('rh', 'rrhh-panel')}
                onMouseEnter={(e) =>
                  showFloatingTooltip(e, language === 'en' ? 'Main Menu' : 'Menú Principal')
                }
                onMouseLeave={hideFloatingTooltip}
                onFocus={(e) =>
                  showFloatingTooltip(e, language === 'en' ? 'Main Menu' : 'Menú Principal')
                }
                onBlur={hideFloatingTooltip}
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
                className={`collapsed-nav-btn ${esMenuSelectivoActivo ? 'active-rh' : ''}`}
                title={language === 'en' ? 'All HR Submodules' : 'Ver todos los submódulos RH'}
                aria-label={language === 'en' ? 'All HR Submodules' : 'Ver todos los submódulos RH'}
                onClick={() => onSelectModule('rh', '__menu__')}
                onMouseEnter={(e) =>
                  showFloatingTooltip(
                    e,
                    language === 'en' ? 'HR Submodules Menu' : 'Menú de Submódulos RH'
                  )
                }
                onMouseLeave={hideFloatingTooltip}
                onFocus={(e) =>
                  showFloatingTooltip(
                    e,
                    language === 'en' ? 'HR Submodules Menu' : 'Menú de Submódulos RH'
                  )
                }
                onBlur={hideFloatingTooltip}
              >
                <LayoutGrid size={17} strokeWidth={2} />
              </button>

              <button
                type="button"
                className={`tool-icon-btn ${
                  activeModuleId === 'settings' ? 'active-rh' : ''
                }`}
                title={t('nav.settings')}
                aria-label={t('nav.settings')}
                onClick={() => onSelectModule('settings')}
                onMouseEnter={(e) => showFloatingTooltip(e, t('nav.settings'))}
                onMouseLeave={hideFloatingTooltip}
                onFocus={(e) => showFloatingTooltip(e, t('nav.settings'))}
                onBlur={hideFloatingTooltip}
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

              {/* Combobox de Favoritos estilo NetSuite (Exclusivo RRHH) */}
              <SubsidebarFavoritos
                portal="rh"
                rolUsuario={rolUsuario}
                activeModuleId={activeModuleId}
                activeSubItemId={activeSubItemId}
                onSelectModule={onSelectModule}
                isCollapsed={isCollapsed}
              />
            </div>

            <div className="collapsed-divider-line" />

            {/* Iconos de todos los submódulos de Recursos Humanos */}
            <div className="collapsed-nav-icons" style={{ gap: '0.45rem' }}>
              {navSubItemsRail.map((sub) => {
                const activo = esSubItemRrhhActivo(sub.id);
                const label = language === 'en' ? sub.nombreEn : sub.nombre;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={`collapsed-nav-btn rh-group-btn ${activo ? 'active-rh' : ''}`}
                    title={label}
                    aria-label={label}
                    onClick={() => {
                      hideFloatingTooltip();
                      onSelectModule('rh', sub.vista);
                    }}
                    onMouseEnter={(e) => showFloatingTooltip(e, label)}
                    onMouseLeave={hideFloatingTooltip}
                    onFocus={(e) => showFloatingTooltip(e, label)}
                    onBlur={hideFloatingTooltip}
                  >
                    {renderSubItemIcon(sub.id, activo)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ====================================================================
             MODO EXPANDIDO / MÓVIL (Submódulos completos de Recursos Humanos)
             ==================================================================== */
          <>
            {/* Top Quick Tools Bar RH */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${esSubItemRrhhActivo('rrhh-panel') ? 'active-rh' : ''}`}
                  title="Menú Principal RH"
                  onClick={() => onSelectModule('rh', 'rrhh-panel')}
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
                  className={`tool-icon-btn ${activeModuleId === 'settings' ? 'active-rh' : ''}`}
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

                {/* Combobox de Favoritos estilo NetSuite (Exclusivo RRHH) */}
                <SubsidebarFavoritos
                  portal="rh"
                  rolUsuario={rolUsuario}
                  activeModuleId={activeModuleId}
                  activeSubItemId={activeSubItemId}
                  onSelectModule={onSelectModule}
                  isCollapsed={isCollapsed}
                />
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-control)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                MÓDULO RH
              </span>
            </div>

            {/* Navigation Links Group (RECURSOS HUMANOS - 9 submódulos) */}
            <nav className="sidebar-accordion-nav">
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSectionRh(!openSectionRh)}
                >
                  <div className="head-left-content">
                    <IconUsers size={16} />
                    <span className="group-title-label">
                      {language === 'en' ? 'HUMAN RESOURCES' : 'RECURSOS HUMANOS'}
                    </span>
                  </div>
                  {openSectionRh ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSectionRh && (
                  <div className="accordion-sub-stack">
                    {subItemsRrhh.map((sub) => {
                      const activo = esSubItemRrhhActivo(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          className={`sub-nav-link ${activo ? 'active-pill active-rh-pill' : ''}`}
                          onClick={() => onSelectModule('rh', sub.vista)}
                        >
                          <span className={`bullet-indicator ${activo ? 'orange' : 'gray'}`} />
                          <span>{language === 'en' ? sub.nombreEn : sub.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Tooltip flotante instantáneo para el rail compacto (sin recorte de overflow) */}
      {typeof document !== 'undefined' &&
        isCollapsed &&
        tooltip &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${tooltip.top}px`,
              left: `${tooltip.left}px`,
              transform: 'translateY(-50%)',
              zIndex: 9999,
              pointerEvents: 'none',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--surface)',
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.22)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
            }}
          >
            {tooltip.label}
          </div>,
          document.body
        )}

      {/* Tarjeta Inferior de Estado del Sistema RH */}
      <div className="sidebar-bottom-status-card">
        {isCollapsed ? (
          <div
            className="collapsed-status-circle"
            title={`${t('nav.system_status')}: RH Suite Operativo v3.4.1`}
          >
            <span className="green-pulse-dot" />
          </div>
        ) : (
          <div className="status-badge-inner status-badge-rh">
            <div>
              <p className="status-label-heading">{t('nav.system_status')}</p>
              <p className="status-live-indicator">
                <span className="green-pulse-dot" /> RH Suite • Operativo
              </p>
            </div>
            <span className="version-pill-tag version-pill-rh">v3.4.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarRH;
