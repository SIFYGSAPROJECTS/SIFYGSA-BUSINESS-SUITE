import React from 'react';
import { IconShieldCheck } from '../../../components/ui/Icons';
import { useLanguage } from '../../../context/LanguageContext';

export const LoginHero: React.FC = () => {
  const { t } = useLanguage();
  return (
    <aside className="login-hero-container" aria-label="Hero institucional">
      <div className="login-hero-bg-overlay" />

      <div className="login-hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>SIFYGSUITE Enterprise v3.4.1 • SIL-3</span>
        </div>

        <h1 className="hero-title">
          {t('auth.hero_title')} <br />
          <span className="hero-title-accent">{t('auth.hero_title_accent')}</span>
        </h1>

        <p className="hero-description">
          {t('auth.hero_description')}
        </p>


        {/* Security Indicator */}
        <br />
        <div className="hero-footer-badge">
          <IconShieldCheck size={18} />
          <span>{t('auth.hero_security')}</span>
        </div>
      </div>
    </aside>
  );
};
