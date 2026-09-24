import React, { useState } from 'react';
import { useLanguage, type Language } from '../../../context/LanguageContext';
import '../settings.css';

interface SettingsPageProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user = {
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@sifygsa.com',
    role: 'Director General (Admin)',
  },
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'language' | 'appearance' | 'profile' | 'system'>('language');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado del tema sincronizado con localStorage
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('sfg_theme') === 'dark' ? 'dark' : 'light';
  });

  const handleSelectLanguage = (newLang: Language) => {
    if (newLang === language) return;
    setLanguage(newLang);
    showToast(newLang === 'es' ? 'Idioma cambiado a Español (Predeterminado)' : 'Language switched to English');
  };

  const handleSelectTheme = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('sfg_theme', theme);
    document.body.removeAttribute('data-theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.remove('light-mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light-mode');
    }
    showToast(theme === 'dark' ? 'Modo Oscuro activado' : 'Modo Claro activado');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div className="settings-module-container">
      {/* Banner Superior */}
      <div className="settings-header-banner">
        <div className="settings-header-info">
          <h1 className="settings-title">{t('settings.main_title')}</h1>
          <p className="settings-subtitle">{t('settings.main_subtitle')}</p>
        </div>
        <div className="settings-header-tag">
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span>SIFYGSUITE v3.4.1</span>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="settings-tabs-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'language' ? 'active' : ''}`}
          onClick={() => setActiveTab('language')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{t('settings.tab_language')}</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
            <circle cx="12" cy="12" r="5" />
          </svg>
          <span>{t('settings.tab_appearance')}</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{t('settings.tab_profile')}</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t('settings.tab_system')}</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      <div className="settings-content-card">
        {/* PESTAÑA: IDIOMA Y REGIÓN */}
        {activeTab === 'language' && (
          <>
            <div className="settings-section-head">
              <h2 className="section-head-title">{t('settings.lang_section_title')}</h2>
              <p className="section-head-desc">{t('settings.lang_section_desc')}</p>
            </div>

            {/* Tarjetas de Selección de Idioma */}
            <div className="language-cards-grid">
              {/* Opción Español */}
              <div
                className={`language-card ${language === 'es' ? 'selected' : ''}`}
                onClick={() => handleSelectLanguage('es')}
              >
                <div>
                  <div className="lang-card-top">
                    <span className="lang-badge-icon es">ES</span>
                    {language === 'es' && (
                      <span className="lang-status-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {t('settings.lang_active_badge')}
                      </span>
                    )}
                  </div>
                  <h3 className="lang-card-title">{t('settings.lang_es_title')}</h3>
                  <p className="lang-card-desc">{t('settings.lang_es_desc')}</p>
                </div>
                <div className="lang-select-action">
                  {language === 'es' ? (
                    <span>● {t('settings.lang_active_badge')}</span>
                  ) : (
                    <span>{t('settings.lang_select_btn')} →</span>
                  )}
                </div>
              </div>

              {/* Opción Inglés */}
              <div
                className={`language-card ${language === 'en' ? 'selected' : ''}`}
                onClick={() => handleSelectLanguage('en')}
              >
                <div>
                  <div className="lang-card-top">
                    <span className="lang-badge-icon en">EN</span>
                    {language === 'en' && (
                      <span className="lang-status-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {t('settings.lang_active_badge')}
                      </span>
                    )}
                  </div>
                  <h3 className="lang-card-title">{t('settings.lang_en_title')}</h3>
                  <p className="lang-card-desc">{t('settings.lang_en_desc')}</p>
                </div>
                <div className="lang-select-action">
                  {language === 'en' ? (
                    <span>● {t('settings.lang_active_badge')}</span>
                  ) : (
                    <span>{t('settings.lang_select_btn')} →</span>
                  )}
                </div>
              </div>
            </div>

            {/* Formatos Regionales */}
            <div className="settings-section-head" style={{ marginTop: '1rem' }}>
              <h2 className="section-head-title">{t('settings.regional_title')}</h2>
            </div>
            <div className="settings-form-grid">
              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.timezone_label')}</label>
                <select className="settings-select" defaultValue="America/Mexico_City">
                  <option value="America/Mexico_City">GMT-6 (Ciudad de México / CDMX)</option>
                  <option value="America/Monterrey">GMT-6 (Monterrey, NL)</option>
                  <option value="America/Houston">GMT-6 (Houston, TX - US Central)</option>
                  <option value="UTC">UTC (Tiempo Universal Coordinado)</option>
                </select>
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.date_format_label')}</label>
                <select className="settings-select" defaultValue={language === 'es' ? 'DD/MM/YYYY' : 'MM/DD/YYYY'}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (ej. 23/09/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                </select>
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.currency_label')}</label>
                <select className="settings-select" defaultValue={language === 'es' ? 'MXN' : 'USD'}>
                  <option value="MXN">MXN - Peso Mexicano ($)</option>
                  <option value="USD">USD - Dólar Estadounidense ($)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA: APARIENCIA */}
        {activeTab === 'appearance' && (
          <>
            <div className="settings-section-head">
              <h2 className="section-head-title">{t('settings.theme_section_title')}</h2>
              <p className="section-head-desc">{t('settings.theme_section_desc')}</p>
            </div>

            <div className="theme-cards-grid">
              <div
                className={`theme-card ${currentTheme === 'light' ? 'selected' : ''}`}
                onClick={() => handleSelectTheme('light')}
              >
                <div className="theme-icon-box light">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <div className="theme-info-box">
                  <h3 className="theme-card-title">{t('settings.theme_light_title')}</h3>
                  <p className="theme-card-desc">{t('settings.theme_light_desc')}</p>
                </div>
              </div>

              <div
                className={`theme-card ${currentTheme === 'dark' ? 'selected' : ''}`}
                onClick={() => handleSelectTheme('dark')}
              >
                <div className="theme-icon-box dark">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <div className="theme-info-box">
                  <h3 className="theme-card-title">{t('settings.theme_dark_title')}</h3>
                  <p className="theme-card-desc">{t('settings.theme_dark_desc')}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA: PERFIL */}
        {activeTab === 'profile' && (
          <>
            <div className="settings-section-head">
              <h2 className="section-head-title">{t('settings.profile_section_title')}</h2>
              <p className="section-head-desc">{t('settings.profile_section_desc')}</p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.profile_name_label')}</label>
                <input className="settings-input" defaultValue={user.name} />
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.profile_email_label')}</label>
                <input className="settings-input" defaultValue={user.email} />
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.profile_role_label')}</label>
                <input className="settings-input" defaultValue={user.role} disabled />
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">{t('settings.profile_company_label')}</label>
                <input className="settings-input" defaultValue="SIFYGSA Fire & Gas de México S.A. de C.V." disabled />
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA: SISTEMA & SEGURIDAD */}
        {activeTab === 'system' && (
          <>
            <div className="settings-section-head">
              <h2 className="section-head-title">Seguridad SIL-3 & Telemetría Industrial</h2>
              <p className="section-head-desc">Parámetros de conexión a PLC, sensores térmicos y cifrado de datos.</p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field-group">
                <label className="settings-field-label">Nivel de Integridad de Seguridad</label>
                <input className="settings-input" value="Certificación SIL-3 (IEC 61508 / 61511)" disabled />
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">Frecuencia de Muestreo de Sensores</label>
                <select className="settings-select" defaultValue="500ms">
                  <option value="250ms">250ms (Alta Precisión)</option>
                  <option value="500ms">500ms (Estándar Industrial)</option>
                  <option value="1s">1000ms (Monitoreo Pasivo)</option>
                </select>
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">Cifrado de Comunicaciones</label>
                <input className="settings-input" value="TLS 1.3 / AES-256 GCM Activo" disabled />
              </div>

              <div className="settings-field-group">
                <label className="settings-field-label">Servidor Backend API</label>
                <input className="settings-input" value="http://localhost:3001/api/v1 (Conectado)" disabled />
              </div>
            </div>
          </>
        )}

        {/* Botón Guardar */}
        <div className="settings-footer-actions">
          <button
            type="button"
            className="btn-save-settings"
            onClick={() => showToast(t('settings.saved_toast'))}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{t('settings.save_btn')}</span>
          </button>
        </div>
      </div>

      {/* Notificación Toast */}
      {toastMessage && (
        <div className="settings-toast-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
