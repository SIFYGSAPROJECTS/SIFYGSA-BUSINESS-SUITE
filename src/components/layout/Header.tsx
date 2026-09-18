import React, { useState, useRef, useEffect } from 'react';
import { IconMenu, IconSearch, IconBell, IconLogOut, IconSettings, IconUser } from '../ui/Icons';

interface HeaderProps {
  currentModuleTitle?: string;
  onToggleSidebar?: () => void;
  onLogout: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onLogout,
  user = {
    name: 'Jared S.',
    email: 'jared.s@sifygsa.com',
    role: 'Safety Director',
  },
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      {/* Left: 3-line menu button + Brand Logo Identity */}
      <div className="header-brand-group">
        {onToggleSidebar && (
          <button
            type="button"
            className="header-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Abrir o colapsar menú lateral"
            title="Alternar menú lateral"
          >
            <IconMenu size={20} />
          </button>
        )}
        <div className="brand-suite-identity">
          <picture className="header-brand-picture">
            <source srcSet="/SFGLogo.svg" type="image/svg+xml" />
            <img
              src="/SFGLogo.png"
              onError={(e) => { e.currentTarget.src = '/SFGLogo.png'; }}
              alt="SIFYGSA"
              className="header-brand-logo-img"
            />
          </picture>
        </div>
      </div>

      {/* Center: Search Input */}
      <div className="header-search-container">
        <div className="search-input-wrapper">
          <IconSearch size={16} className="search-icon-symbol" />
          <input
            type="text"
            placeholder="Type to search sensor telemetry, audits, reports, tickets..."
            className="sifygsa-search-field"
          />
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="header-actions-group">
        <button
          type="button"
          className="header-tool-btn"
          aria-label="Notifications"
          title="Notifications"
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
                <span>Perfil de Director</span>
              </button>

              <button
                type="button"
                className="dialog-menu-item"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <IconSettings size={15} />
                <span>Configuración de Suite</span>
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
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
