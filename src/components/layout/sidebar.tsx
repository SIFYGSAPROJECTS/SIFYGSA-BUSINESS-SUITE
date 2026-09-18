import React, { useState } from 'react';
import { IconChevronDown, IconChevronRight, IconClose, IconSettings } from '../ui/Icons';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  activeModuleId: string;
  activeSubItemId?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  activeModuleId,
  activeSubItemId,
  onSelectModule,
}) => {
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(true);
  const [openSection3, setOpenSection3] = useState(false);

  return (
    <aside
      className={`gemini-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-visible' : ''}`}
      aria-label="Navegación SIFYGSA"
    >
      {/* Cabecera Móvil (solo visible en pantallas pequeñas) */}
      <div className="sidebar-mobile-header">
        <div className="mobile-brand-row">
          <picture className="sidebar-brand-picture">
            <source srcSet="/SFGLogo.svg" type="image/svg+xml" />
            <img
              src="/SFGLogo.png"
              onError={(e) => { e.currentTarget.src = '/SFGLogo.png'; }}
              alt="SIFYGSA"
              className="sidebar-brand-logo-img"
            />
          </picture>
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
           MODO COLAPSADO / MINIMIZADO (Icon Rail Centrado - como en Imagen 1)
           Sin botón de expandir superior (tachado con X roja en Imagen 1)
           ==================================================================== */}
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            {/* Herramientas Rápidas en Columna */}
            <div className="collapsed-tools-stack">
              <button
                type="button"
                className={`tool-icon-btn ${activeModuleId === 'dashboard' ? 'active-glow' : ''}`}
                title="Panel General / Dashboard"
                onClick={() => onSelectModule('dashboard')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>

              <button
                type="button"
                className={`tool-icon-btn ${activeModuleId === 'crm' ? 'active-glow orange-solid' : ''}`}
                title="Ventas / CRM"
                onClick={() => onSelectModule('crm', 'crm-opportunities')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                  <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                type="button"
                className={`tool-icon-btn ${activeModuleId === 'compras' ? 'active-glow' : ''}`}
                title="Operaciones / Compras"
                onClick={() => onSelectModule('compras', 'compras-requisicion')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                  <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.6 5.6l12.8 12.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="collapsed-divider-line" />

            {/* Iconos de Grupos de Navegación (Idéntico a Imagen 1) */}
            <div className="collapsed-nav-icons">
              {/* Icono de Grupo 1: CRM & Ventas (Cuadro oscuro con borde naranja y punto naranja en la esquina) */}
              <button
                type="button"
                className={`collapsed-nav-btn crm-group-btn ${activeModuleId === 'crm' ? 'active-crm' : ''}`}
                title="CRM & Ventas"
                onClick={() => onSelectModule('crm', 'crm-opportunities')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#F97316' }}>
                  <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="collapsed-top-dot orange" />
              </button>

              {/* Icono de Grupo 2: Operaciones (Cuadro oscuro con borde cyan y carpeta) */}
              <button
                type="button"
                className={`collapsed-nav-btn ops-group-btn ${activeModuleId === 'compras' ? 'active-ops' : ''}`}
                title="Operaciones — Requisición NetSuite"
                onClick={() => onSelectModule('compras', 'compras-requisicion')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#06B6D4' }}>
                  <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {activeModuleId === 'compras' && <span className="collapsed-top-dot cyan" />}
              </button>

              {/* Icono de Grupo 3: Administrador (Cuadro oscuro con borde púrpura y escudo) */}
              <button
                type="button"
                className={`collapsed-nav-btn admin-group-btn ${activeModuleId === 'settings' ? 'active-admin' : ''}`}
                title="Administración / Configuración"
                onClick={() => onSelectModule('settings')}
              >
                <IconSettings size={18} style={{ color: '#A855F7' }} />
                {activeModuleId === 'settings' && <span className="collapsed-top-dot purple" />}
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================================
             MODO EXPANDIDO (Vista Completa con Acordeones - Idéntico a Imágenes 3 y 4)
             Sin botón << en la barra superior de herramientas
             ==================================================================== */
          <>
            {/* Top Quick Tools Bar (Home, Sliders, Slash-circle - sin <<) */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'dashboard' ? 'active' : ''}`}
                  title="Panel General / Dashboard"
                  onClick={() => onSelectModule('dashboard')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'crm' ? 'active' : ''}`}
                  title="Ventas / CRM"
                  onClick={() => onSelectModule('crm', 'crm-opportunities')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'compras' ? 'active' : ''}`}
                  title="Operaciones / Compras"
                  onClick={() => onSelectModule('compras', 'compras-requisicion')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.6 5.6l12.8 12.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Links Group (CRM & VENTAS + OPERACIONES + ADMINISTRADOR) */}
            <nav className="sidebar-accordion-nav">
              {/* Group 1: CRM & VENTAS (Inspirado en OPTION ^ de Imagen 3 y 4) */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection1(!openSection1)}
                >
                  <div className="head-left-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16, color: '#F97316' }}>
                      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-title-label">CRM &amp; VENTAS</span>
                  </div>
                  {openSection1 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection1 && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${activeModuleId === 'crm' && (activeSubItemId === 'crm-opportunities' || !activeSubItemId) ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('crm', 'crm-opportunities')}
                    >
                      <span className="bullet-indicator orange" />
                      <span>Oportunidades</span>
                    </button>
                    <button
                      type="button"
                      className={`sub-nav-link ${activeModuleId === 'crm' && activeSubItemId === 'crm-opportunity-detail' ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('crm', 'crm-opportunity-detail')}
                    >
                      <span className="bullet-indicator orange" />
                      <span>Detalle Oportunidad</span>
                    </button>
                    <button
                      type="button"
                      className={`sub-nav-link ${activeModuleId === 'crm' && (activeSubItemId === 'crm-kanban' || activeSubItemId === 'crm-gantt' || activeSubItemId === 'crm-calendar') ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('crm', 'crm-kanban')}
                    >
                      <span className="bullet-indicator gray" />
                      <span>Actividades (Kanban &amp; Gantt)</span>
                    </button>
                    <button
                      type="button"
                      className="sub-nav-link"
                      onClick={() => onSelectModule('crm', 'crm-opportunities')}
                    >
                      <span className="bullet-indicator gray" />
                      <span>Cartera Clientes</span>
                    </button>
                    <button
                      type="button"
                      className="sub-nav-link"
                      onClick={() => onSelectModule('crm', 'crm-opportunities')}
                    >
                      <span className="bullet-indicator gray" />
                      <span>Cotizaciones HTO</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group 2: OPERACIONES (con Sub-navigation y borde izquierdo naranja como en Imagen 4) */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection2(!openSection2)}
                >
                  <div className="head-left-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16, color: '#06B6D4' }}>
                      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-title-label">OPERACIONES</span>
                  </div>
                  {openSection2 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection2 && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${activeModuleId === 'compras' ? 'active-subnav-bar' : ''}`}
                      onClick={() => onSelectModule('compras', 'compras-requisicion')}
                    >
                      <span className="bullet-indicator orange" />
                      <span>Requisición</span>
                    </button>
                    <button
                      type="button"
                      className="sub-nav-link"
                      onClick={() => onSelectModule('compras', 'compras-requisicion')}
                    >
                      <span className="bullet-indicator gray" />
                      <span>Órdenes de Compra</span>
                    </button>
                    <button
                      type="button"
                      className="sub-nav-link"
                      onClick={() => onSelectModule('compras', 'compras-requisicion')}
                    >
                      <span className="bullet-indicator gray" />
                      <span>Proveedores SIL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group 3: ADMINISTRADOR */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection3(!openSection3)}
                >
                  <div className="head-left-content">
                    <IconSettings size={16} style={{ color: '#A855F7' }} />
                    <span className="group-title-label">ADMINISTRADOR</span>
                  </div>
                  {openSection3 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection3 && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${activeModuleId === 'settings' ? 'active-pill' : ''}`}
                      onClick={() => onSelectModule('settings')}
                    >
                      <span className="bullet-indicator gray" />
                      <span>Configuración General</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Tarjeta Inferior de Estado del Sistema (System Status) */}
      <div className="sidebar-bottom-status-card">
        {isCollapsed ? (
          <div
            className="collapsed-status-circle"
            title="System Status: Optimal Online v3.4.1"
          >
            <span className="green-pulse-dot" />
          </div>
        ) : (
          <div className="status-badge-inner">
            <div>
              <p className="status-label-heading">System Status</p>
              <p className="status-live-indicator">
                <span className="green-pulse-dot" /> Optimal Online
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
