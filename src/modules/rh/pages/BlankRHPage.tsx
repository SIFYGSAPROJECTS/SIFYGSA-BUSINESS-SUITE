import React from 'react';
import { IconUsers, IconShieldCheck, IconBriefcase } from '../../../components/ui/Icons';
import { useLanguage } from '../../../context/LanguageContext';
import '../rh.css';

interface BlankRHPageProps {
  subItemId?: string;
}

export const BlankRHPage: React.FC<BlankRHPageProps> = ({ subItemId = 'rh-directorio' }) => {
  const { t } = useLanguage();

  const getSubItemName = () => {
    switch (subItemId) {
      case 'rh-directorio':
      case 'rh-blank':
        return t('nav.rh_directorio');
      case 'rh-expedientes':
        return t('nav.rh_expedientes');
      case 'rh-organigrama':
        return t('nav.rh_organigrama');
      case 'rh-asistencia':
        return t('nav.rh_asistencia');
      case 'rh-incidencias':
        return t('nav.rh_incidencias');
      case 'rh-vacaciones':
        return t('nav.rh_vacaciones');
      case 'rh-contratos':
        return t('nav.rh_contratos');
      case 'rh-ajustes':
        return t('nav.rh_ajustes');
      default:
        return t('rh.blank_title');
    }
  };

  return (
    <div className="rh-blank-page-container">
      {/* Banner de Encabezado Superior para Recursos Humanos */}
      <div className="rh-header-banner">
        <div className="rh-banner-text-block">
          <div className="rh-banner-breadcrumbs">
            <span>SIFYGSA Suite</span>
            <span className="crumb-sep">/</span>
            <span>{t('rh.blank_title')}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{getSubItemName()}</span>
          </div>
          <div className="rh-title-row">
            <h1 className="rh-main-heading">{getSubItemName()}</h1>
            <span className="rh-badge-pill">{t('rh.blank_badge')}</span>
          </div>
          <p className="rh-banner-subtext">
            {t('rh.blank_subtitle')}
          </p>
        </div>

        <div className="rh-banner-actions">
          <button type="button" className="btn-rh-secondary">
            {t('nav.settings')}
          </button>
          <button type="button" className="btn-rh-primary">
            + Nuevo Registro
          </button>
        </div>
      </div>

      {/* Área Central: Lienzo de Trabajo en Blanco (Blank Canvas Card) */}
      <div className="rh-blank-canvas-card">
        <div className="rh-blank-canvas-inner">
          {/* Icono central de talento con aro radiante */}
          <div className="rh-icon-podium">
            <div className="rh-icon-podium-ring">
              <IconUsers size={36} className="rh-center-icon" />
            </div>
          </div>

          <h2 className="rh-canvas-heading">{t('rh.blank_canvas_title')}</h2>
          <p className="rh-canvas-desc">
            {t('rh.blank_canvas_desc')}
          </p>

          {/* Tarjetas informativas de la configuración del módulo */}
          <div className="rh-features-pill-grid">
            <div className="rh-feature-chip">
              <div className="chip-icon-box chip-teal">
                <IconUsers size={18} />
              </div>
              <div className="chip-content">
                <strong>Sidebar Exclusivo RH</strong>
                <span>Navegación independiente separada del módulo CRM</span>
              </div>
            </div>

            <div className="rh-feature-chip">
              <div className="chip-icon-box chip-emerald">
                <IconShieldCheck size={18} />
              </div>
              <div className="chip-content">
                <strong>Acceso Doble Login</strong>
                <span>Credenciales exclusivas para rh@sifygsa.com</span>
              </div>
            </div>

            <div className="rh-feature-chip">
              <div className="chip-icon-box chip-cyan">
                <IconBriefcase size={18} />
              </div>
              <div className="chip-content">
                <strong>Paleta &amp; Identidad RH</strong>
                <span>Colores esmeralda y teal aplicados en layout global</span>
              </div>
            </div>
          </div>

          {/* Lienzo punteado limpio listo para contenido futuro */}
          <div className="rh-placeholder-workspace">
            <div className="rh-dashed-border-box">
              <span className="rh-dashed-label">Área de trabajo en blanco lista para componentes de RH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlankRHPage;
