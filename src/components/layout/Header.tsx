import React, { useState, useRef, useEffect } from 'react';
import { IconSearch, IconBell, IconLogOut, IconSettings, IconUser } from '../ui/Icons';
import { SfgLogoSymbol } from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  currentModuleTitle?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onLogout: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen = false,
  onLogout,
  user = {
    name: 'Jared S.',
    email: 'jared.s@sifygsa.com',
    role: 'Safety Director',
  },
}) => {
  const { t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sfg_theme') === 'dark';
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sincronizar tema con el DOM y localStorage
  useEffect(() => {
    document.body.removeAttribute('data-theme');
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.remove('light-mode');
      localStorage.setItem('sfg_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light-mode');
      localStorage.setItem('sfg_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sifygsa-header">
      {/* Left: 3-line menu button + Brand Logo Identity (Flama SIFYGSA) */}
      <div className="header-brand-group">
        {onToggleSidebar && (
          <button
            type="button"
            className={`header-toggle-btn ${isSidebarOpen ? 'is-active' : ''}`}
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Plegar menú lateral' : 'Desplegar menú lateral'}
            title={isSidebarOpen ? 'Plegar menú lateral' : 'Desplegar menú lateral'}
            aria-expanded={isSidebarOpen}
          >
            <span className="hamburger-animated-box" aria-hidden="true">
              <span className="hamburger-line line-top" />
              <span className="hamburger-line line-middle" />
              <span className="hamburger-line line-bottom" />
            </span>
          </button>
        )}
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
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  transition: 'color 0.2s ease',
                }}
              >
                SIFYGSA
              </span>
              <span
                className="brand-tag-enterprise"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  backgroundColor: '#EA580C',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 3px rgba(234, 88, 12, 0.35)',
                }}
              >
                SUITE
              </span>
            </div>
            <span
              className="brand-subtitle-text"
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: isDarkMode ? '#94A3B8' : '#475569',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'color 0.2s ease',
              }}
            >
              Business Platform
            </span>
          </div>
        </div>
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
          title={isDarkMode ? t('header.change_to_light') : t('header.change_to_dark')}
          onClick={toggleTheme}
        >
          {isDarkMode ? (
            /* Icono Sol (para pasar a Modo Claro) */
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
            /* Icono Luna (para pasar a Modo Oscuro) */
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

        {/* Notificaciones */}
        <button
          type="button"
          className="header-tool-btn"
          aria-label={t('header.notifications')}
          title={t('header.notifications')}
        >
          <IconBell size={20} />
          <span className="notification-number-badge">9</span>
        </button>

        <div className="header-separator-line" />

        <div className="user-profile-menu-container" ref={userMenuRef}>
          <button
            type="button"
            className="user-profile-trigger"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-expanded={isUserMenuOpen}
          >
            <div className="user-avatar-podium-ring">
              <div className="user-avatar-inner">JS</div>
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
                onClick={() => setIsUserMenuOpen(false)}
              >
                <IconUser size={15} />
                <span>Perfil</span>
              </button>

              <button
                type="button"
                className="dialog-menu-item"
                onClick={() => setIsUserMenuOpen(false)}
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
