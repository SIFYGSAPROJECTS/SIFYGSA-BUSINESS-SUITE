'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  IconSearch,
  IconBell,
  IconLogOut,
  IconSettings,
  IconUser,
  IconChevronDown,
  IconCheck,
} from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';
import { getSelectedMenuIconMeta } from './MenuSelectivoModulo';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderComboOption {
  label: string;
  subItemId: string;
}

const VENTAS_COMBO_OPTIONS: readonly HeaderComboOption[] = [
  { label: 'Mi flujo', subItemId: 'crm-kanban' },
  { label: 'Mis actividades', subItemId: 'crm-calendar' },
  { label: 'Equipos', subItemId: 'crm-opportunities' },
  { label: 'Clientes', subItemId: 'crm-opportunities' },
];

const REPORTES_COMBO_OPTIONS: readonly HeaderComboOption[] = [
  { label: 'Pronóstico', subItemId: 'crm-reportes' },
  { label: 'Flujo', subItemId: 'crm-kanban' },
  { label: 'Leads', subItemId: 'crm-leads' },
  { label: 'Actividades', subItemId: 'crm-calendar' },
];

interface HeaderProps {
  currentModuleTitle?: string;
  activeModuleId?: string;
  activeSubItemId?: string;
  onBackToMenu?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onLogout: () => void;
  onSelectModule?: (moduleId: string, subItemId?: string) => void;
  isChatCenterOpen?: boolean;
  onToggleChatCenter?: () => void;
  unreadChatCount?: number;
  user?: {
    name: string;
    email: string;
    role: string;
    portal?: 'crm' | 'rh' | 'almacen' | 'compras';
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeModuleId = 'crm',
  activeSubItemId = 'crm-kanban',
  onBackToMenu,
  onToggleSidebar,
  onLogout,
  onSelectModule,
  isChatCenterOpen = false,
  onToggleChatCenter,
  unreadChatCount = 3,
  user = {
    name: 'Carlos Mendoza',
    email: 'crm@sifygsa.com',
    role: 'Director Comercial & CRM',
    portal: 'crm',
  },
}) => {
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const selectedMenuMeta = getSelectedMenuIconMeta(activeModuleId, activeSubItemId);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openCombo, setOpenCombo] = useState<'ventas' | 'reportes' | null>(null);
  const [selectedVentas, setSelectedVentas] = useState<string | null>(null);
  const [selectedReportes, setSelectedReportes] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const combosRef = useRef<HTMLDivElement>(null);

  const esPortalCrm = user?.portal !== 'rh' && user?.portal !== 'almacen';

  const getInitials = (name?: string) => {
    if (!name) return 'SF';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (combosRef.current && !combosRef.current.contains(target)) {
        setOpenCombo(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenCombo(null);
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectComboOption = (
    combo: 'ventas' | 'reportes',
    option: HeaderComboOption
  ) => {
    if (combo === 'ventas') {
      setSelectedVentas(option.label);
    } else {
      setSelectedReportes(option.label);
    }
    setOpenCombo(null);
    onSelectModule?.('crm', option.subItemId);
  };

  return (
    <header className="sifygsa-header">
      {/* Left: Selected Menu Icon (animates to "<" on hover to return to launcher) + Brand Logo Identity */}
      <div className="header-brand-group">
        <button
          type="button"
          className={`header-selected-menu-btn tile-color-${selectedMenuMeta.colorClass}`}
          onClick={() => {
            if (onBackToMenu) {
              onBackToMenu();
            } else if (onSelectModule) {
              onSelectModule(
                activeModuleId === 'compras' || activeModuleId === 'admin' || activeModuleId === 'rh'
                  ? activeModuleId
                  : 'crm',
                '__menu__'
              );
            } else if (onToggleSidebar) {
              onToggleSidebar();
            }
          }}
          aria-label={`Menú actual: ${selectedMenuMeta.title}. Clic para regresar al selector de módulos`}
          title={`${selectedMenuMeta.title} — Regresar al menú de módulos`}
        >
          {/* Icono del menú seleccionado por defecto */}
          <span className="header-selected-icon-front" aria-hidden="true">
            {selectedMenuMeta.isCalendarTile ? (
              <span className="header-mini-calendar-tile">
                <span className="header-mini-calendar-month">NOV</span>
                <span className="header-mini-calendar-day">11</span>
              </span>
            ) : (
              selectedMenuMeta.icon
            )}
          </span>

          {/* Flecha "<" animada al pasar el cursor por encima */}
          <span className="header-selected-icon-back" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <div className="brand-suite-identity" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="flame-logo-wrapper" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <SfgLogoSymbol size={38} className="header-flame-logo" />
          </div>
          <div className="brand-text-block" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div className="brand-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                className="brand-title-text"
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  color: 'var(--text-primary)',
                  transition: 'color 0.2s ease',
                }}
              >
                SIFYGSA
              </span>
              <span
                className={`brand-tag-enterprise ${user?.portal === 'rh' ? 'brand-tag-rh' : user?.portal === 'almacen' ? 'brand-tag-almacen' : ''}`}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--on-primary)',
                  backgroundColor: 'var(--primary)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-control)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {user?.portal === 'rh' ? 'RH SUITE' : user?.portal === 'almacen' ? 'ALMACÉN SGA' : 'SUITE'}
              </span>
            </div>
            <span
              className={`brand-subtitle-text ${user?.portal === 'rh' ? 'rh-subtitle' : user?.portal === 'almacen' ? 'almacen-subtitle' : ''}`}
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'color 0.2s ease',
              }}
            >
              {user?.portal === 'rh' ? 'Talento Humano' : user?.portal === 'almacen' ? 'Gestión de Almacén' : 'Business Platform'}
            </span>
          </div>
        </div>

        {/* Dos Combo Box de Navegación CRM en el lado izquierdo del Header */}
        {esPortalCrm && (
          <div className="header-crm-combos" ref={combosRef}>
            <span className="header-combos-divider" aria-hidden="true" />

            {/* Combo Box 1: Ventas */}
            <div className="header-combo-box">
              <button
                type="button"
                className={`header-combo-trigger ${openCombo === 'ventas' ? 'is-open' : ''} ${selectedVentas ? 'has-value' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={openCombo === 'ventas'}
                aria-label="Ventas"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setOpenCombo((prev) => (prev === 'ventas' ? null : 'ventas'));
                }}
              >
                <span className="header-combo-text">
                  {selectedVentas ? (
                    <>
                      <span className="header-combo-prefix">Ventas:</span>
                      <span className="header-combo-value">{selectedVentas}</span>
                    </>
                  ) : (
                    <span className="header-combo-value">Ventas</span>
                  )}
                </span>
                <IconChevronDown
                  size={14}
                  className={`header-combo-chevron ${openCombo === 'ventas' ? 'rotated' : ''}`}
                />
              </button>

              {openCombo === 'ventas' && (
                <div className="header-combo-menu" role="listbox" aria-label="Opciones de Ventas">
                  {VENTAS_COMBO_OPTIONS.map((option) => {
                    const isSelected = selectedVentas === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`header-combo-option ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectComboOption('ventas', option)}
                      >
                        <span>{option.label}</span>
                        {isSelected && <IconCheck size={14} className="header-combo-check" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Combo Box 2: Reportes */}
            <div className="header-combo-box">
              <button
                type="button"
                className={`header-combo-trigger ${openCombo === 'reportes' ? 'is-open' : ''} ${selectedReportes ? 'has-value' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={openCombo === 'reportes'}
                aria-label="Reportes"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setOpenCombo((prev) => (prev === 'reportes' ? null : 'reportes'));
                }}
              >
                <span className="header-combo-text">
                  {selectedReportes ? (
                    <>
                      <span className="header-combo-prefix">Reportes:</span>
                      <span className="header-combo-value">{selectedReportes}</span>
                    </>
                  ) : (
                    <span className="header-combo-value">Reportes</span>
                  )}
                </span>
                <IconChevronDown
                  size={14}
                  className={`header-combo-chevron ${openCombo === 'reportes' ? 'rotated' : ''}`}
                />
              </button>

              {openCombo === 'reportes' && (
                <div className="header-combo-menu" role="listbox" aria-label="Opciones de Reportes">
                  {REPORTES_COMBO_OPTIONS.map((option) => {
                    const isSelected = selectedReportes === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`header-combo-option ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectComboOption('reportes', option)}
                      >
                        <span>{option.label}</span>
                        {isSelected && <IconCheck size={14} className="header-combo-check" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center: Search Input */}
      <div className="header-search-container">
        <div className="search-input-wrapper">
          <IconSearch size={16} className="search-icon-symbol" />
          <input
            type="text"
            placeholder={t('header.search_placeholder')}
            className="sifygsa-search-field"
          />
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="header-actions-group">
        {/* Dark Mode & Light Mode Toggle */}
        <button
          type="button"
          className="header-tool-btn"
          aria-label={isDarkMode ? t('header.change_to_light') : t('header.change_to_dark')}
          aria-pressed={isDarkMode}
          title={isDarkMode ? t('header.change_to_light') : t('header.change_to_dark')}
          onClick={toggleTheme}
          suppressHydrationWarning
        >
          {isDarkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656" />
              <path d="M6.343 17.657l-1.414 1.414" />
              <path d="M6.343 6.343l-1.414 -1.414" />
              <path d="M17.657 6.343l1.414 -1.414" />
              <path d="M17.657 17.657l1.414 1.414" />
              <path d="M4 12h-2" />
              <path d="M12 4v-2" />
              <path d="M20 12h2" />
              <path d="M12 20v2" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
              <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
              <path d="M19 11h2m-1 -1v2" />
            </svg>
          )}
        </button>

        {/* Centro de Conversaciones (CRM) o Notificaciones (RH / Almacén) */}
        {esPortalCrm ? (
          <button
            type="button"
            data-chat-trigger="true"
            className={`header-tool-btn header-chat-trigger-btn ${isChatCenterOpen ? 'is-open' : ''}`}
            aria-label="Centro de Conversaciones"
            aria-expanded={isChatCenterOpen}
            title="Centro de Conversaciones"
            onClick={onToggleChatCenter}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadChatCount > 0 && (
              <span className="notification-number-badge">{unreadChatCount}</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="header-tool-btn"
            aria-label={t('header.notifications')}
            title={t('header.notifications')}
          >
            <IconBell size={20} />
            <span className="notification-number-badge">9</span>
          </button>
        )}

        <div className="header-separator-line" />

        <div className="user-profile-menu-container" ref={userMenuRef}>
          <button
            type="button"
            className="user-profile-trigger"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-expanded={isUserMenuOpen}
          >
            <div className={`user-avatar-podium-ring ${user?.portal === 'rh' ? 'rh-podium' : ''}`}>
              <div className="user-avatar-inner">{getInitials(user?.name)}</div>
            </div>
            <div className="user-meta-info">
              <span className="user-display-name">{user.name}</span>
              <span className="user-display-role">{user.role}</span>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown-dialog">
              <div className="user-dialog-header">
                <p className="dialog-user-title">{user.name}</p>
                <p className="dialog-user-email">{user.email}</p>
              </div>

              <div className="dialog-divider" />

              <button
                type="button"
                className="dialog-menu-item"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onSelectModule?.('settings');
                }}
              >
                <IconUser size={15} />
                <span>Perfil</span>
              </button>

              <button
                type="button"
                className="dialog-menu-item"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onSelectModule?.('settings');
                }}
              >
                <IconSettings size={15} />
                <span>{t('nav.settings')}</span>
              </button>

              <div className="dialog-divider" />

              <button
                type="button"
                className="dialog-menu-item logout-action"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout();
                }}
              >
                <IconLogOut size={15} />
                <span>{t('header.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
