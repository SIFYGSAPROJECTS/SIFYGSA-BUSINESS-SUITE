'use client';

import React, { useState } from 'react';
import type { RolUsuario } from '@/config/types';
import { obtenerSubItemsPermitidosModulo } from '@/modules/registry';
import {
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconSettings,
  IconUsers,
  IconShieldCheck,
  IconBriefcase,
} from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';

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
}

export const SidebarRH: React.FC<SidebarRHProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  activeModuleId,
  activeSubItemId,
  onSelectModule,
  rolUsuario = 'rrhh',
}) => {
  const { language, t } = useLanguage();
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(true);
  const [openSection3, setOpenSection3] = useState(false);
  const [openSectionReq, setOpenSectionReq] = useState(true);

  const subItemsRequisiciones = obtenerSubItemsPermitidosModulo('requisiciones', rolUsuario);

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
           MODO COLAPSADO / MINIMIZADO (Icon Rail Centrado para RH)
           ==================================================================== */}
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            {/* Herramientas Rápidas en Columna */}
            <div className="collapsed-tools-stack">
              <button
                type="button"
                className={`tool-icon-btn ${
                  activeModuleId === 'rh' ? 'active-rh' : ''
                }`}
                title={t('rh.blank_title')}
                onClick={() => onSelectModule('rh', 'rh-directorio')}
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
                className={`tool-icon-btn ${
                  activeModuleId === 'settings' ? 'active-rh' : ''
                }`}
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
            </div>

            <div className="collapsed-divider-line" />

            {/* Iconos de Grupos de Navegación RH */}
            <div className="collapsed-nav-icons">
              {/* Grupo 1: Talento Humano */}
              <button
                type="button"
                className={`collapsed-nav-btn rh-group-btn ${
                  activeModuleId === 'rh' &&
                  (!activeSubItemId || activeSubItemId.startsWith('rh-dir') || activeSubItemId.startsWith('rh-exp') || activeSubItemId.startsWith('rh-org'))
                    ? 'active-rh'
                    : ''
                }`}
                title={t('nav.rh_group_talent')}
                onClick={() => onSelectModule('rh', 'rh-directorio')}
              >
                <IconUsers size={18} />
              </button>

              {/* Grupo 2: Asistencia & Tiempos */}
              <button
                type="button"
                className={`collapsed-nav-btn rh-ops-btn ${
                  activeModuleId === 'rh' &&
                  (activeSubItemId === 'rh-asistencia' || activeSubItemId === 'rh-incidencias' || activeSubItemId === 'rh-vacaciones')
                    ? 'active-rh'
                    : ''
                }`}
                title={t('nav.rh_group_attendance')}
                onClick={() => onSelectModule('rh', 'rh-asistencia')}
              >
                <IconShieldCheck size={18} />
              </button>

              {/* Grupo 3: Administración & Políticas */}
              <button
                type="button"
                className={`collapsed-nav-btn rh-admin-btn ${
                  activeModuleId === 'rh' &&
                  (activeSubItemId === 'rh-contratos' || activeSubItemId === 'rh-ajustes')
                    ? 'active-rh'
                    : ''
                }`}
                title={t('nav.rh_group_admin')}
                onClick={() => onSelectModule('rh', 'rh-contratos')}
              >
                <IconBriefcase size={18} />
              </button>

              {/* Grupo 4: Requisiciones */}
              <button
                type="button"
                className={`collapsed-nav-btn ops-group-btn ${
                  activeModuleId === 'compras' ? 'active-rh' : ''
                }`}
                title="Requisiciones"
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
             MODO EXPANDIDO (Vista Completa con Acordeones Exclusivos de RH)
             ==================================================================== */
          <>
            {/* Top Quick Tools Bar RH */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${activeModuleId === 'rh' ? 'active-rh' : ''}`}
                  title={t('rh.blank_title')}
                  onClick={() => onSelectModule('rh', 'rh-directorio')}
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

            {/* Navigation Links Group (TALENTO HUMANO + ASISTENCIA & TIEMPOS + ADMINISTRACIÓN + REQUISICIONES) */}
            <nav className="sidebar-accordion-nav">
              {/* Group 1: TALENTO HUMANO */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection1(!openSection1)}
                >
                  <div className="head-left-content">
                    <IconUsers size={16} />
                    <span className="group-title-label">{t('nav.rh_group_talent')}</span>
                  </div>
                  {openSection1 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection1 && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' &&
                        (activeSubItemId === 'rh-directorio' || !activeSubItemId || activeSubItemId === 'rh-blank')
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-directorio')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' &&
                          (activeSubItemId === 'rh-directorio' || !activeSubItemId || activeSubItemId === 'rh-blank')
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_directorio')}</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-expedientes'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-expedientes')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-expedientes'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_expedientes')}</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-organigrama'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-organigrama')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-organigrama'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_organigrama')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group 2: ASISTENCIA & TIEMPOS */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection2(!openSection2)}
                >
                  <div className="head-left-content">
                    <IconShieldCheck size={16} />
                    <span className="group-title-label">{t('nav.rh_group_attendance')}</span>
                  </div>
                  {openSection2 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection2 && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-asistencia'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-asistencia')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-asistencia'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_asistencia')}</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-incidencias'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-incidencias')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-incidencias'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_incidencias')}</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-vacaciones'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-vacaciones')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-vacaciones'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_vacaciones')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group 3: ADMINISTRACIÓN RH */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSection3(!openSection3)}
                >
                  <div className="head-left-content">
                    <IconSettings size={16} />
                    <span className="group-title-label">{t('nav.rh_group_admin')}</span>
                  </div>
                  {openSection3 ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSection3 && (
                  <div className="accordion-sub-stack">
                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-contratos'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-contratos')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-contratos'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_contratos')}</span>
                    </button>

                    <button
                      type="button"
                      className={`sub-nav-link ${
                        activeModuleId === 'rh' && activeSubItemId === 'rh-ajustes'
                          ? 'active-pill active-rh-pill'
                          : ''
                      }`}
                      onClick={() => onSelectModule('rh', 'rh-ajustes')}
                    >
                      <span
                        className={`bullet-indicator ${
                          activeModuleId === 'rh' && activeSubItemId === 'rh-ajustes'
                            ? 'orange'
                            : 'gray'
                        }`}
                      />
                      <span>{t('nav.rh_ajustes')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group 4: REQUISICIONES (Abierto para personal de RRHH) */}
              <div className="accordion-entry">
                <button
                  type="button"
                  className="accordion-head-btn"
                  onClick={() => setOpenSectionReq(!openSectionReq)}
                >
                  <div className="head-left-content">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="group-title-label">REQUISICIONES</span>
                  </div>
                  {openSectionReq ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </button>

                {openSectionReq && (
                  <div className="accordion-sub-stack">
                    {subItemsRequisiciones.map((sub) => {
                      const activo =
                        activeModuleId === 'compras' &&
                        (activeSubItemId === sub.id || (!activeSubItemId && sub.id === 'compras-mis-requisiciones'));
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          className={`sub-nav-link ${activo ? 'active-pill active-rh-pill' : ''}`}
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
            </nav>
          </>
        )}
      </div>

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
