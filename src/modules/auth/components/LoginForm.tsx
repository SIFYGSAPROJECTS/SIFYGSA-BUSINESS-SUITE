import React, { useState } from 'react';
import { IconLogo, IconUser, IconLock, IconEye, IconEyeOff } from '../../../components/ui/Icons';
import { useLanguage } from '../../../context/LanguageContext';

interface LoginFormProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('admin@sifygsa.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

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

    // Simulación de autenticación
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: 'Carlos Mendoza',
        email: username.includes('@') ? username : `${username}@sifygsa.com`,
        role: 'Director General (Admin)',
      });
    }, 600);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert(t('auth.forgot_alert'));
  };

  return (
    <div className="login-form-wrapper">
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
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
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

        {/* Botón Iniciar Sesión */}
        <button
          type="submit"
          className="btn-submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading-spinner" />
          ) : (
            t('auth.submit_btn')
          )}
        </button>

        {/* Demo Fast Access */}
        <div className="demo-access-container">
          <span className="divider-text">{t('auth.demo_divider')}</span>
          <button
            type="button"
            className="btn-demo"
            onClick={() =>
              onLoginSuccess({
                name: 'Carlos Mendoza',
                email: 'admin@sifygsa.com',
                role: 'Director General (Admin)',
              })
            }
          >
            {t('auth.demo_btn')}
          </button>
        </div>
      </form>

      <footer className="login-form-footer">
        <p>© {new Date().getFullYear()} SFG Business Suite. {t('auth.footer')}</p>
      </footer>
    </div>
  );
};