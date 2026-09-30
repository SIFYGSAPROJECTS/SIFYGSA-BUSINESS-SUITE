import React, { useState } from 'react';
import {
  IconLogo,
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconBriefcase,
  IconUsers,
} from '../../../components/ui/Icons';
import { useLanguage } from '../../../context/LanguageContext';

export interface UserSessionData {
  name: string;
  email: string;
  role: string;
  portal?: 'crm' | 'rh';
}

interface LoginFormProps {
  onLoginSuccess: (user: UserSessionData) => void;
}

export const PRESET_ACCOUNTS = {
  crm: {
    name: 'Carlos Mendoza',
    email: 'crm@sifygsa.com',
    role: 'Director Comercial & CRM',
    portal: 'crm' as const,
    password: '••••••••••••',
    label: 'CRM & Ventas',
    sublabel: 'Comercial & Operaciones',
  },
  rh: {
    name: 'Mariana Garza',
    email: 'rh@sifygsa.com',
    role: 'Coordinadora de Recursos Humanos',
    portal: 'rh' as const,
    password: '••••••••••••',
    label: 'Recursos Humanos',
    sublabel: 'Gestión de Talento Humano',
  },
};

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const [selectedProfile, setSelectedProfile] = useState<'crm' | 'rh'>('crm');
  const [username, setUsername] = useState(PRESET_ACCOUNTS.crm.email);
  const [password, setPassword] = useState(PRESET_ACCOUNTS.crm.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectProfile = (profile: 'crm' | 'rh') => {
    setSelectedProfile(profile);
    setUsername(PRESET_ACCOUNTS[profile].email);
    setPassword(PRESET_ACCOUNTS[profile].password);
    setNotification(null);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const lower = value.toLowerCase();
    if (lower.includes('rh') || lower.includes('recurso') || lower.includes('talento') || lower.includes('mariana')) {
      setSelectedProfile('rh');
    } else if (lower.includes('crm') || lower.includes('ventas') || lower.includes('admin') || lower.includes('carlos')) {
      setSelectedProfile('crm');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setNotification(t('auth.error_no_user'));
      return;
    }
    if (!password.trim()) {
      setNotification(t('auth.error_no_pass'));
      return;
    }

    setIsLoading(true);
    setNotification(null);

    const isRH =
      selectedProfile === 'rh' ||
      username.toLowerCase().includes('rh') ||
      username.toLowerCase().includes('recurso');

    setTimeout(() => {
      setIsLoading(false);
      if (isRH) {
        onLoginSuccess({
          name: PRESET_ACCOUNTS.rh.name,
          email: username.includes('@') ? username : `${username}@sifygsa.com`,
          role: PRESET_ACCOUNTS.rh.role,
          portal: 'rh',
        });
      } else {
        onLoginSuccess({
          name: PRESET_ACCOUNTS.crm.name,
          email: username.includes('@') ? username : `${username}@sifygsa.com`,
          role: PRESET_ACCOUNTS.crm.role,
          portal: 'crm',
        });
      }
    }, 500);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert(t('auth.forgot_alert'));
  };

  return (
    <div className={`login-form-wrapper ${selectedProfile === 'rh' ? 'login-rh-theme' : 'login-crm-theme'}`}>
      <div className="login-form-header">
        <div className="login-brand">
          <IconLogo size={42} />
          <div className="login-brand-text">
            <span className="brand-title">SIFYGSA Enterprise</span>
            <span className="brand-subtitle">{t('auth.brand_subtitle')}</span>
          </div>
        </div>

        <h2 className="login-heading">{t('auth.heading')}</h2>
        <p className="login-subheading">{t('auth.subheading')}</p>
      </div>

      {notification && (
        <div className="login-alert" role="alert">
          <span>{notification}</span>
        </div>
      )}

      {/* Selector de Perfiles de Acceso (CRM vs RH) */}
      <div className="account-selector-container">
        <span className="selector-title">{t('auth.quick_profile_title')}</span>
        <div className="account-selector-grid">
          {/* Tarjeta Cuenta 1: CRM */}
          <button
            type="button"
            className={`account-card account-card-crm ${selectedProfile === 'crm' ? 'active-crm' : ''}`}
            onClick={() => handleSelectProfile('crm')}
          >
            <div className="account-card-header">
              <div className="account-card-icon-box crm-icon">
                <IconBriefcase size={16} />
              </div>
              <span className="account-badge crm-badge">CRM &amp; Ventas</span>
            </div>
            <div className="account-card-body">
              <strong className="account-email">{PRESET_ACCOUNTS.crm.email}</strong>
              <span className="account-role">{PRESET_ACCOUNTS.crm.sublabel}</span>
            </div>
          </button>

          {/* Tarjeta Cuenta 2: RH */}
          <button
            type="button"
            className={`account-card account-card-rh ${selectedProfile === 'rh' ? 'active-rh' : ''}`}
            onClick={() => handleSelectProfile('rh')}
          >
            <div className="account-card-header">
              <div className="account-card-icon-box rh-icon">
                <IconUsers size={16} />
              </div>
              <span className="account-badge rh-badge">Recursos Humanos</span>
            </div>
            <div className="account-card-body">
              <strong className="account-email">{PRESET_ACCOUNTS.rh.email}</strong>
              <span className="account-role">{PRESET_ACCOUNTS.rh.sublabel}</span>
            </div>
          </button>
        </div>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        {/* Campo Usuario */}
        <div className="form-group">
          <label htmlFor="login-username" className="form-label">
            {t('auth.username_label')}
          </label>
          <div className="input-group">
            <span className="input-icon">
              <IconUser size={18} />
            </span>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder={t('auth.username_placeholder')}
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
              autoComplete="username"
            />
            {selectedProfile === 'rh' ? (
              <span className="input-role-tag rh-tag">Modo RH</span>
            ) : (
              <span className="input-role-tag crm-tag">Modo CRM</span>
            )}
          </div>
        </div>

        {/* Campo Contraseña */}
        <div className="form-group">
          <div className="form-label-row">
            <label htmlFor="login-password" className="form-label">
              {t('auth.password_label')}
            </label>
            <a
              href="#recuperar"
              onClick={handleForgotPassword}
              className="forgot-password-link"
            >
              {t('auth.forgot_password')}
            </a>
          </div>
          <div className="input-group">
            <span className="input-icon">
              <IconLock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input password-input"
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>

        {/* Opciones adicionales */}
        <div className="form-options-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-label">{t('auth.remember_session')}</span>
          </label>
        </div>

        {/* Botón Iniciar Sesión dinámico con el color del perfil */}
        <button
          type="submit"
          className={`btn-submit ${selectedProfile === 'rh' ? 'btn-submit-rh' : 'btn-submit-crm'}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading-spinner" />
          ) : selectedProfile === 'rh' ? (
            t('auth.login_as_rh')
          ) : (
            t('auth.login_as_crm')
          )}
        </button>
      </form>

      <footer className="login-form-footer">
        <p>© {new Date().getFullYear()} SFG Business Suite. {t('auth.footer')}</p>
      </footer>
    </div>
  );
};