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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', background: '#242426', padding: '0.65rem 0.85rem', borderRadius: '4px', border: '1px solid #3A3A3D' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                style={{ accentColor: '#F97316', width: '16px', height: '16px' }}
              />
              <span style={{ color: '#F97316' }}>⚡ Marcar como Ruta Crítica</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Avance:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="crm-form-input font-mono"
                style={{ width: '60px', height: '28px', padding: '2px 6px', textAlign: 'right' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>%</span>
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
                className="crm-filter-btn"
                onClick={handleAddChecklistItem}
                style={{ background: '#3A3A3C', color: '#FFFFFF', padding: '0 0.85rem' }}
              >
                <IconPlus size={14} /> Añadir
              </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {checklistItems.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#1F1F22',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#E2E8F0',
                    border: '1px solid #333336',
                  }}
                >
                  <span>✓ {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
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
