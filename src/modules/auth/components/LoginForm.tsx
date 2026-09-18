import React, { useState } from 'react';
import { IconLogo, IconUser, IconLock, IconEye, IconEyeOff } from '../../../components/ui/Icons';

interface LoginFormProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin@sifygsa.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setNotification('Por favor ingresa tu usuario o correo corporativo.');
      return;
    }
    if (!password.trim()) {
      setNotification('Por favor ingresa tu contraseña.');
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
    alert('Se ha enviado un enlace de recuperación a tu correo corporativo registrado.');
  };

  return (
    <div className="login-form-wrapper">
      <div className="login-form-header">
        <div className="login-brand">
          <IconLogo size={42} />
          <div className="login-brand-text">
            <span className="brand-title">SIFYGSUITE Enterprise</span>
            <span className="brand-subtitle">Fire & Gas Suite • ERP NetSuite</span>
          </div>
        </div>

        <h2 className="login-heading">Iniciar Sesión</h2>
        <p className="login-subheading">
          Ingresa tus credenciales para acceder a la plataforma modular
        </p>
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
            Usuario o Correo Corporativo
          </label>
          <div className="input-group">
            <span className="input-icon">
              <IconUser size={18} />
            </span>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="ejemplo@sifygsa.com"
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
              Contraseña
            </label>
            <a
              href="#recuperar"
              onClick={handleForgotPassword}
              className="forgot-password-link"
            >
              ¿Olvidaste tu contraseña?
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
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
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
            <span className="checkbox-label">Recordar sesión en este equipo</span>
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
            'Iniciar Sesión'
          )}
        </button>

        {/* Demo Fast Access */}
        <div className="demo-access-container">
          <span className="divider-text">o entra en modo demostración</span>
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
            Acceder al Dashboard / Suite Demo
          </button>
        </div>
      </form>

      <footer className="login-form-footer">
        <p>© {new Date().getFullYear()} SFG Business Suite. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
