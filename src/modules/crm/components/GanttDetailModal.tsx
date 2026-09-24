import React from 'react';
import {
  IconClose,
  IconUsers,
  IconTimeline,
  IconCheckSquare,
} from '../../../components/ui/Icons';

export interface GanttTeamMember {
  name: string;
  role: string;
  initials: string;
}

export interface GanttTask {
  id: string;
  folio: string;
  name: string;
  description: string;
  owner: string;
  ownerRole: string;
  team: GanttTeamMember[];
  start: string;
  end: string;
  progress: number;
  status: 'Completado' | 'En Curso' | 'Pendiente';
  isCritical?: boolean;
  priority: 'Alta' | 'Media' | 'Baja';
  colWidth: string;
  colOffset: string;
  deliverables?: string[];
}

interface GanttDetailModalProps {
  task: GanttTask | null;
  onClose: () => void;
}

export const GanttDetailModal: React.FC<GanttDetailModalProps> = ({ task, onClose }) => {
  if (!task) return null;

  const getStatusClass = (status: GanttTask['status']) => {
    switch (status) {
      case 'Completado':
        return 'status-done';
      case 'En Curso':
        return 'status-in-progress';
      case 'Pendiente':
      default:
        return 'status-pending';
    }
  };

  const getPriorityClass = (priority: GanttTask['priority']) => {
    switch (priority) {
      case 'Alta':
        return 'priority-high';
      case 'Media':
        return 'priority-medium';
      case 'Baja':
      default:
        return 'priority-low';
    }
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose}>
      <div
        className="crm-gantt-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="gantt-modal-header">
          <div className="gantt-modal-title-group">
            <div className="gantt-modal-tags">
              <span className="gantt-modal-folio font-mono">{task.folio}</span>
              <span className={`gantt-modal-status-badge ${getStatusClass(task.status)}`}>
                ● {task.status}
              </span>
              {task.isCritical && (
                <span className="critical-path-pill">⚡ RUTA CRÍTICA</span>
              )}
              <span className={`priority-tag ${getPriorityClass(task.priority)}`}>
                Prioridad {task.priority}
              </span>
            </div>
            <h2 className="gantt-modal-title">{task.name}</h2>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Cerrar modal de detalles"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="gantt-modal-body">
          {/* A quiénes les corresponde */}
          <div className="gantt-modal-section">
            <h3 className="gantt-section-title">
              <IconUsers size={16} /> A quiénes les corresponde
            </h3>
            <div className="gantt-team-grid">
              {task.team.map((member, idx) => (
                <div key={idx} className="gantt-team-card">
                  <div className="team-avatar">{member.initials}</div>
                  <div className="team-info">
                    <span className="team-name">{member.name}</span>
                    <span className="team-role">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plazos y Avance */}
          <div className="gantt-modal-section">
            <h3 className="gantt-section-title">
              <IconTimeline size={16} /> Plazos y Avance del Proyecto
            </h3>
            <div className="gantt-progress-box">
              <div className="gantt-progress-stats">
                <div className="stat-col">
                  <span className="stat-label">Fecha Inicio</span>
                  <span className="stat-value font-mono">{task.start}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Fecha Término</span>
                  <span className="stat-value font-mono">{task.end}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Avance Actual</span>
                  <span className="stat-value font-mono stat-percent">
                    {task.progress}%
                  </span>
                </div>
              </div>
              <div className="gantt-modal-progress-track">
                <div
                  className={`gantt-modal-progress-fill ${getStatusClass(task.status)}`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Descripción y Entregables */}
          <div className="gantt-modal-section">
            <h3 className="gantt-section-title">
              <IconCheckSquare size={16} /> Alcance y Entregables Técnicos SIL-3
            </h3>
            <p className="gantt-modal-description">{task.description}</p>
            {task.deliverables && task.deliverables.length > 0 && (
              <ul className="gantt-deliverables-list">
                {task.deliverables.map((item, idx) => (
                  <li key={idx} className="gantt-deliverable-item">
                    <span className="deliverable-check">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="gantt-modal-footer">
          <button
            type="button"
            className="btn-dialog-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn-dialog-primary"
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
