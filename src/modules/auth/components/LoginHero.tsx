import React from 'react';
import { IconShieldCheck, IconChartBar, IconUsers } from '../../../components/ui/Icons';

export const LoginHero: React.FC = () => {
  return (
    <aside className="login-hero-container" aria-label="Hero institucional">
      <div className="login-hero-bg-overlay" />

      <div className="login-hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>SIFYGSUITE Enterprise v3.4.1 • SIL-3</span>
        </div>

        <h1 className="hero-title">
          Control Total & Gestión <br />
          <span className="hero-title-accent">Industrial F&G NetSuite</span>
        </h1>

        <p className="hero-description">
          Plataforma unificada para operaciones críticas de detección de fuego y gas,
          gestión comercial CRM, requisiciones y control de proyectos en plantas industriales.
        </p>


        {/* Security Indicator */}
        <br />
        <div className="hero-footer-badge">
          <IconShieldCheck size={18} />
          <span>Acceso empresarial seguro con encriptación de extremo a extremo</span>
        </div>
      </div>
    </aside>
  );
};
