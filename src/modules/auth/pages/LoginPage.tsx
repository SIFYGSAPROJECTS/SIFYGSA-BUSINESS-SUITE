import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { LoginHero } from '../components/LoginHero';
import '../auth.css';

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <main className="login-split-page">
      {/* Sección Izquierda: Formulario de Login */}
      <section className="login-section-left">
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </section>

      {/* Sección Derecha: Hero Institucional */}
      <section className="login-section-right">
        <LoginHero />
      </section>
    </main>
  );
};
