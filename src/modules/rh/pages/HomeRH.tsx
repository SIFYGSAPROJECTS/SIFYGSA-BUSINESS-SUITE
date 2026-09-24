import React from 'react';
import { IconUsers, IconShieldCheck, IconChartBar } from '../../../components/ui/Icons';
import '../rh.css';
import { useLanguage } from '../../../context/LanguageContext';

export const HomeRH: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="rh-module-page">
      {/* Banner de Encabezado */}
      <div className="module-header-banner">
        <div className="module-header-text">
          <h1 className="module-title">{t('rh.module_title')}</h1>
          <p className="module-subtitle">
            {t('rh.module_subtitle')}
          </p>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-action-secondary">
            {t('rh.btn_incidents')}
          </button>
          <button type="button" className="btn-action-primary">
            {t('rh.btn_register')}
          </button>
        </div>
      </div>

      {/* Métricas de Talento Humano */}
      <div className="rh-metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">{t('rh.metric_active_staff')}</span>
            <span className="metric-icon-box">
              <IconUsers size={18} />
            </span>
          </div>
          <div className="metric-value">342</div>
          <div className="metric-footer positive">
            <span>↑ 8 {t('rh.metric_active_staff_footer')}</span> {t('rh.metric_active_staff_quarter')}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">{t('rh.metric_attendance')}</span>
            <span className="metric-icon-box">
              <IconShieldCheck size={18} />
            </span>
          </div>
          <div className="metric-value">97.4%</div>
          <div className="metric-footer positive">
            <span>• 333 {t('rh.metric_attendance_footer')}</span> {t('rh.metric_attendance_of')} 342
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">{t('rh.metric_pending')}</span>
            <span className="metric-icon-box">
              <IconChartBar size={18} />
            </span>
          </div>
          <div className="metric-value">14</div>
          <div className="metric-footer neutral">
            <span>• 9 {t('rh.metric_pending_vacations')}</span>, 5 {t('rh.metric_pending_permits')}
          </div>
        </div>
      </div>

      {/* Directorio de Colaboradores Recientes */}
      <div className="rh-content-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">{t('rh.directory_title')}</h3>
            <p className="card-sub">{t('rh.directory_sub')}</p>
          </div>
          <span className="badge-pill">342 {t('rh.badge_records')}</span>
        </div>

        <div className="table-responsive">
          <table className="rh-table">
            <thead>
              <tr>
                <th>{t('rh.col_employee')}</th>
                <th>{t('rh.col_department')}</th>
                <th>{t('rh.col_position')}</th>
                <th>{t('rh.col_contract')}</th>
                <th>{t('rh.col_status')}</th>
                <th>{t('rh.col_action')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="user-cell">
                    <div className="cell-avatar">MG</div>
                    <div>
                      <strong>Mariana Garza</strong>
                      <div className="cell-sub">mariana.garza@sifygsa.com</div>
                    </div>
                  </div>
                </td>
                <td>Operaciones & Logística</td>
                <td>Coordinadora de Operaciones</td>
                <td>{t('rh.contract_indefinite')}</td>
                <td><span className="status-badge active">{t('rh.status_active')}</span></td>
                <td><button type="button" className="table-btn">{t('rh.btn_record')}</button></td>
              </tr>
              <tr>
                <td>
                  <div className="user-cell">
                    <div className="cell-avatar">AL</div>
                    <div>
                      <strong>Alejandro Lozano</strong>
                      <div className="cell-sub">alejandro.l@sifygsa.com</div>
                    </div>
                  </div>
                </td>
                <td>Tecnología & Sistemas</td>
                <td>Líder de Desarrollo</td>
                <td>{t('rh.contract_indefinite')}</td>
                <td><span className="status-badge active">{t('rh.status_active')}</span></td>
                <td><button type="button" className="table-btn">{t('rh.btn_record')}</button></td>
              </tr>
              <tr>
                <td>
                  <div className="user-cell">
                    <div className="cell-avatar">SP</div>
                    <div>
                      <strong>Sofía Paredes</strong>
                      <div className="cell-sub">sofia.p@sifygsa.com</div>
                    </div>
                  </div>
                </td>
                <td>Administración & Finanzas</td>
                <td>Analista Contable Senior</td>
                <td>{t('rh.contract_indefinite')}</td>
                <td><span className="status-badge vacation">{t('rh.status_vacation')}</span></td>
                <td><button type="button" className="table-btn">{t('rh.btn_record')}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
