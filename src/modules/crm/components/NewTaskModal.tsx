import React, { useState } from 'react';
import { IconClose, IconPlus, IconCheckSquare } from '../../../components/ui/Icons';

export interface TaskItem {
  id: string;
  folio: string;
  title: string;
  description?: string;
  priority: 'Baja' | 'Media' | 'Alta';
  isCritical?: boolean;
  progress?: number;
  checklistCount?: string;
  attachmentsCount?: number;
  dueDate: string;
  assigneeInitials: string;
  assigneeName: string;
  column: 'todo' | 'in_progress' | 'review' | 'done';
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (newTask: TaskItem) => void;
  defaultDate?: string;
  defaultColumn?: 'todo' | 'in_progress' | 'review' | 'done';
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  defaultDate,
  defaultColumn = 'todo',
}) => {
  const [folio, setFolio] = useState(`OPP-T${Math.floor(10 + Math.random() * 90)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Baja' | 'Media' | 'Alta'>('Alta');
  const [isCritical, setIsCritical] = useState(false);
  const [progress, setProgress] = useState(0);
  const [column, setColumn] = useState<'todo' | 'in_progress' | 'review' | 'done'>(defaultColumn);
  const [dueDate, setDueDate] = useState(defaultDate || '2024-05-15');
  const [assignee, setAssignee] = useState('Carlos Méndez (CM)');
  const [checklistItems, setChecklistItems] = useState<string[]>([
    'Revisión de planos e ingeniería de detalle',
    'Cálculo de consumo y memoria técnica',
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (newChecklistText.trim()) {
      setChecklistItems([...checklistItems, newChecklistText.trim()]);
      setNewChecklistText('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor introduce el título de la actividad');
      return;
    }

    const initialsMatch = assignee.match(/\(([^)]+)\)/);
    const initials = initialsMatch ? initialsMatch[1] : 'F&G';
    const nameOnly = assignee.replace(/\s*\([^)]+\)/, '');

    // Format dueDate for display, e.g., '15 May'
    let formattedDate = dueDate;
    try {
      const parts = dueDate.split('-');
      if (parts.length === 3) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        formattedDate = `${parseInt(parts[2], 10)} ${months[monthIdx] || ''}`;
      }
    } catch {
      formattedDate = dueDate;
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      folio: folio.trim() || `OPP-T${Math.floor(10 + Math.random() * 90)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      isCritical,
      progress: column === 'done' ? 100 : progress,
      checklistCount: checklistItems.length > 0 ? `0/${checklistItems.length}` : undefined,
      attachmentsCount: 1,
      dueDate: formattedDate,
      assigneeInitials: initials,
      assigneeName: nameOnly,
      column,
    };

    onSaveTask(newTask);
    onClose();
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose}>
      <div className="crm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div className="crm-modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <IconCheckSquare size={18} />
            </span>
            <div>
              <h2 className="modal-heading-text">Registrar Nueva Actividad F&G</h2>
              <p className="modal-sub-text">Gestión ágil de tareas Jira & Monday.com vinculadas a la Oportunidad</p>
            </div>
          </div>
          <button type="button" className="modal-close-icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="crm-modal-body">
          <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Folio */}
            <div className="form-field-group">
              <label className="crm-form-label">Código / Folio Scrum <span className="req-asterisk">*</span></label>
              <input
                type="text"
                className="crm-form-input font-mono"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="ej. OPP-T18 / SCRUM-15"
                required
              />
            </div>

            {/* Columna Inicial */}
            <div className="form-field-group">
              <label className="crm-form-label">Columna / Estado Inicial</label>
              <select
                className="crm-form-select"
                value={column}
                onChange={(e) => setColumn(e.target.value as TaskItem['column'])}
              >
                <option value="todo">Por Hacer / Pendiente</option>
                <option value="in_progress">En Curso / Desarrollo</option>
                <option value="review">En Revisión / Aprobación</option>
                <option value="done">Finalizado / Listo</option>
              </select>
            </div>
          </div>

          {/* Título */}
          <div className="form-field-group" style={{ marginTop: '0.85rem' }}>
            <label className="crm-form-label">Título de la Actividad <span className="req-asterisk">*</span></label>
            <input
              type="text"
              className="crm-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Especificación técnica detectores CH4 y pruebas de lazo"
              required
            />
          </div>

          {/* Descripción */}
          <div className="form-field-group" style={{ marginTop: '0.85rem' }}>
            <label className="crm-form-label">Memoria Descriptiva / Criterio de Aceptación</label>
            <textarea
              className="crm-form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla los entregables, memoria técnica de cálculo, hojas de datos del fabricante..."
            />
          </div>

          {/* 3 Column Metadata Row */}
          <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginTop: '0.85rem' }}>
            {/* Prioridad */}
            <div className="form-field-group">
              <label className="crm-form-label">Prioridad</label>
              <select
                className="crm-form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Baja' | 'Media' | 'Alta')}
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            {/* Asignado */}
            <div className="form-field-group">
              <label className="crm-form-label">Responsable F&G</label>
              <select
                className="crm-form-select"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="Carlos Méndez (CM)">Carlos Méndez (CM)</option>
                <option value="Daniel Rosas (DR)">Daniel Rosas (DR)</option>
                <option value="Ana Torres (AT)">Ana Torres (AT)</option>
                <option value="Laura Vega (LV)">Laura Vega (LV)</option>
                <option value="Roberto Méndez (RM)">Roberto Méndez (RM)</option>
                <option value="Dirección General (DG)">Dirección General (DG)</option>
              </select>
            </div>

            {/* Fecha Límite */}
            <div className="form-field-group">
              <label className="crm-form-label">Fecha Límite</label>
              <input
                type="date"
                className="crm-form-input font-mono"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Ruta Crítica Checkbox & Progreso */}
          <div className="new-task-critical-row">
            <label className="new-task-critical-label">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                style={{ accentColor: '#F97316', width: '16px', height: '16px' }}
              />
              <span className="crit-text-highlight">⚡ Marcar como Ruta Crítica</span>
            </label>

            <div className="new-task-advance-group">
              <span className="new-task-advance-label">Avance:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="crm-form-input font-mono new-task-advance-input"
              />
              <span className="new-task-advance-label">%</span>
            </div>
          </div>

          {/* Checklist interactivo */}
          <div className="form-field-group" style={{ marginTop: '0.85rem' }}>
            <label className="crm-form-label">Criterios de Aceptación / Checklist ({checklistItems.length})</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="crm-form-input"
                placeholder="Añadir criterio o sub-tarea..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <button
                type="button"
                className="new-task-add-checklist-btn"
                onClick={handleAddChecklistItem}
              >
                <IconPlus size={14} /> Añadir
              </button>
            </div>

            <ul className="new-task-checklist-list">
              {checklistItems.map((item, idx) => (
                <li
                  key={idx}
                  className="new-task-checklist-item"
                >
                  <span className="new-task-checklist-text">✓ {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="new-task-remove-item-btn"
                    title="Eliminar ítem"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="crm-modal-footer" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn-save">
              <IconPlus size={16} /> Crear Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
