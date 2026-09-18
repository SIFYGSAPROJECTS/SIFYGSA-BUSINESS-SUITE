import React from 'react';
import { IconUsers, IconShieldCheck, IconChartBar } from '../../../components/ui/Icons';
import '../rh.css';

export const HomeRH: React.FC = () => {
  return (
    <div className="rh-module-page">
      {/* Banner de Encabezado */}
      <div className="module-header-banner">
        <div className="module-header-text">
          <h1 className="module-title">Módulo Recursos Humanos & Talento</h1>
          <p className="module-subtitle">
            Administración de colaboradores, control de asistencia, nómina y expedientes digitales.
          </p>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-action-secondary">
            Incidencias del Día
          </button>
          <button type="button" className="btn-action-primary">
            + Registrar Colaborador
          </button>
        </div>
      </div>

      {/* Métricas de Talento Humano */}
      <div className="rh-metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Plantilla Activa</span>
            <span className="metric-icon-box">
              <IconUsers size={18} />
            </span>
          </div>
          <div className="metric-value">342</div>
          <div className="metric-footer positive">
            <span>↑ 8 nuevas altas</span> este trimestre
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Asistencia Hoy</span>
            <span className="metric-icon-box">
              <IconShieldCheck size={18} />
            </span>
          </div>
          <div className="metric-value">97.4%</div>
          <div className="metric-footer positive">
            <span>• 333 presentes</span> de 342
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Solicitudes Pendientes</span>
            <span className="metric-icon-box">
              <IconChartBar size={18} />
            </span>
          </div>
          <div className="metric-value">14</div>
          <div className="metric-footer neutral">
            <span>• 9 vacaciones</span>, 5 permisos
          </div>
        </div>
      </div>

      {/* Directorio de Colaboradores Recientes */}
      <div className="rh-content-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Directorio de Colaboradores Clave</h3>
            <p className="card-sub">Expedientes actualizados y estatus laboral en la suite</p>
          </div>
          <span className="badge-pill">342 Expedientes Digitales</span>
        </div>

        <div className="table-responsive">
          <table className="rh-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Departamento</th>
                <th>Puesto</th>
                <th>Tipo de Contrato</th>
                <th>Estatus</th>
                <th>Acción</th>
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
                <td>Indefinido</td>
                <td><span className="status-badge active">Activo</span></td>
                <td><button type="button" className="table-btn">Expediente</button></td>
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
                <td>Indefinido</td>
                <td><span className="status-badge active">Activo</span></td>
                <td><button type="button" className="table-btn">Expediente</button></td>
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
                <td>Indefinido</td>
                <td><span className="status-badge vacation">Vacaciones</span></td>
                <td><button type="button" className="table-btn">Expediente</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
