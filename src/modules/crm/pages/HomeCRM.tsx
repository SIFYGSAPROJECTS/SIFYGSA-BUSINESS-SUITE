import React, { useState, useEffect } from 'react';
import {
  IconKanban,
  IconTable,
  IconTimeline,
  IconCalendar,
  IconPlus,
  IconPaperclip,
  IconCheckSquare,
  IconClose,
} from '../../../components/ui/Icons';
import '../crm.css';
import { CalendarView } from '../components/CalendarView';
import { NewTaskModal } from '../components/NewTaskModal';
import type { TaskItem } from '../components/NewTaskModal';
import { OpportunitiesList } from './OpportunitiesList';
import { OpportunityDetail } from './OpportunityDetail';

type CrmView = 'kanban' | 'gantt' | 'calendar' | 'table' | 'detail';

interface HomeCRMProps {
  subItemId?: string;
}

export const HomeCRM: React.FC<HomeCRMProps> = ({ subItemId }) => {
  const getInitialView = (): CrmView => {
    switch (subItemId) {
      case 'crm-opportunities':
        return 'table';
      case 'crm-opportunity-detail':
        return 'detail';
      case 'crm-gantt':
        return 'gantt';
      case 'crm-calendar':
        return 'calendar';
      case 'crm-kanban':
      default:
        return 'table'; // Pantalla 3 por defecto al ingresar a CRM
    }
  };

  const [activeView, setActiveView] = useState<CrmView>(getInitialView());

  // Sincronizar reactivamente cuando el usuario hace clic en el menú lateral
  useEffect(() => {
    if (subItemId) {
      switch (subItemId) {
        case 'crm-opportunities':
          setActiveView('table');
          break;
        case 'crm-opportunity-detail':
          setActiveView('detail');
          break;
        case 'crm-gantt':
          setActiveView('gantt');
          break;
        case 'crm-calendar':
          setActiveView('calendar');
          break;
        case 'crm-kanban':
          setActiveView('kanban');
          break;
        default:
          setActiveView('table');
          break;
      }
    }
  }, [subItemId]);
  const [selectedOpportunityFolio, setSelectedOpportunityFolio] = useState<string>('OPP-2024-041');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Task Details Modal
  const [activeTaskModal, setActiveTaskModal] = useState<TaskItem | null>(null);

  // New Task Modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskDefaultDate, setNewTaskDefaultDate] = useState<string | undefined>(undefined);

  // Checklist state for task detail modal
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'chk-1': true,
    'chk-2': true,
    'chk-3': true,
    'chk-4': false,
  });

  // Initial tasks (Scrum / Kanban items)
  const [tasks, setTasks] = useState<TaskItem[]>([
    // 1. POR HACER
    {
      id: 't-1',
      folio: 'OPP-T14',
      title: 'Reunión de aprobación de margen financiero con Dirección General',
      priority: 'Media',
      checklistCount: '0/2',
      attachmentsCount: 1,
      dueDate: '25 Abr',
      assigneeInitials: 'DG',
      assigneeName: 'Dirección General',
      column: 'todo',
    },
    {
      id: 't-2',
      folio: 'OPP-T15',
      title: 'Solicitud de carta de distribuidor Honeywell Analytics Pemex',
      priority: 'Alta',
      checklistCount: '1/3',
      attachmentsCount: 2,
      dueDate: '28 Abr',
      assigneeInitials: 'CM',
      assigneeName: 'Carlos Méndez',
      column: 'todo',
    },
    {
      id: 't-3',
      folio: 'OPP-T16',
      title: 'Elaboración de cronograma de suministro de obra marina',
      priority: 'Baja',
      attachmentsCount: 1,
      dueDate: '05 May',
      assigneeInitials: 'PM',
      assigneeName: 'Proyectos Marinos',
      column: 'todo',
    },
    // 2. EN CURSO
    {
      id: 't-4',
      folio: 'SCRUM-12',
      title: 'Cotización de central SCADA Honeywell Safety Manager SIL-3',
      description: 'Subir memoria técnica de cálculo, desglose I/O 24Vdc y cotización PDF con VoBo Gerencial.',
      priority: 'Alta',
      isCritical: true,
      progress: 75,
      checklistCount: '3/4',
      attachmentsCount: 2,
      dueDate: '18 Abr',
      assigneeInitials: 'CM',
      assigneeName: 'Carlos Méndez',
      column: 'in_progress',
    },
    {
      id: 't-5',
      folio: 'HTO-08',
      title: 'Especificación HTO detectores puntuales de sulfhídrico H2S',
      priority: 'Alta',
      checklistCount: '2/2',
      attachmentsCount: 3,
      dueDate: '20 Abr',
      assigneeInitials: 'DR',
      assigneeName: 'Daniel Rosas',
      column: 'in_progress',
    },
    {
      id: 't-6',
      folio: 'OPP-T11',
      title: 'Dimensionamiento de tubería conduit cédula 40 ATEX',
      priority: 'Media',
      attachmentsCount: 1,
      dueDate: '22 Abr',
      assigneeInitials: 'RM',
      assigneeName: 'Roberto Méndez',
      column: 'in_progress',
    },
    // 3. EN REVISIÓN
    {
      id: 't-7',
      folio: 'SCRUM-13',
      title: 'Memoria de cálculo de atenuación óptica sensores CH4 infrarrojo',
      priority: 'Media',
      checklistCount: '4/4',
      attachmentsCount: 2,
      dueDate: '16 Abr',
      assigneeInitials: 'AT',
      assigneeName: 'Ana Torres',
      column: 'review',
    },
    {
      id: 't-8',
      folio: 'OPP-T09',
      title: 'Certificados de calibración de fábrica sensores punto combustible',
      priority: 'Media',
      attachmentsCount: 4,
      dueDate: '15 Abr',
      assigneeInitials: 'DR',
      assigneeName: 'Daniel Rosas',
      column: 'review',
    },
    // 4. FINALIZADO
    {
      id: 't-9',
      folio: 'OPP-T01',
      title: 'Mapeo de detectores H2S por dispersión de penacho en planta',
      priority: 'Baja',
      checklistCount: 'Listo',
      attachmentsCount: 3,
      dueDate: '05 Abr',
      assigneeInitials: 'DR',
      assigneeName: 'Daniel Rosas',
      column: 'done',
    },
    {
      id: 't-10',
      folio: 'OPP-T02',
      title: 'Selección de sensores ópticos e infrarrojos IR3 ATEX',
      priority: 'Media',
      checklistCount: 'Listo',
      attachmentsCount: 2,
      dueDate: '12 Abr',
      assigneeInitials: 'RM',
      assigneeName: 'Roberto Méndez',
      column: 'done',
    },
    {
      id: 't-11',
      folio: 'OPP-T03',
      title: 'Levantamiento de rutas de canalización en Coquizadora Tula II',
      priority: 'Media',
      checklistCount: 'Listo',
      attachmentsCount: 5,
      dueDate: '13 Abr',
      assigneeInitials: 'CM',
      assigneeName: 'Carlos Méndez',
      column: 'done',
    },
  ]);

  // Gantt items
  const ganttTasks = [
    {
      id: 'g-1',
      name: 'Levantamiento en Planta Coquizadora Tula',
      owner: 'Daniel Rosas',
      start: '01 Abr',
      end: '10 Abr',
      progress: 100,
      status: 'Completado',
      colWidth: '35%',
      colOffset: '5%',
    },
    {
      id: 'g-2',
      name: 'Especificación HTO Detectores H2S / CH4',
      owner: 'Carlos Méndez',
      start: '08 Abr',
      end: '22 Abr',
      progress: 75,
      status: 'En Curso',
      colWidth: '45%',
      colOffset: '25%',
      isCritical: true,
    },
    {
      id: 'g-3',
      name: 'Arquitectura SCADA Honeywell Safety Manager SIL-3',
      owner: 'Ana Torres',
      start: '15 Abr',
      end: '02 May',
      progress: 40,
      status: 'En Curso',
      colWidth: '40%',
      colOffset: '45%',
      isCritical: true,
    },
    {
      id: 'g-4',
      name: 'Aprobación de Margen Financiero y Cotización Final',
      owner: 'Dirección General',
      start: '25 Abr',
      end: '10 May',
      progress: 0,
      status: 'Pendiente',
      colWidth: '35%',
      colOffset: '65%',
    },
  ];

  // Move task to another column
  const handleMoveTask = (taskId: string, targetCol: TaskItem['column']) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            column: targetCol,
            progress: targetCol === 'done' ? 100 : t.progress,
          };
        }
        return t;
      })
    );
    if (activeTaskModal && activeTaskModal.id === taskId) {
      setActiveTaskModal({
        ...activeTaskModal,
        column: targetCol,
        progress: targetCol === 'done' ? 100 : activeTaskModal.progress,
      });
    }
  };

  // Add new task from modal
  const handleSaveNewTask = (newTask: TaskItem) => {
    setTasks([newTask, ...tasks]);
  };

  const handleOpenNewTask = (date?: string) => {
    setNewTaskDefaultDate(date);
    setIsNewTaskModalOpen(true);
  };

  const handleCompleteSprint = () => {
    const doneCount = tasks.filter((t) => t.column === 'done').length;
    alert(`Sprint completado: ${doneCount} actividades finalizadas satisfactoriamente para PEMEX Refinación.`);
  };

  const getFilteredTasksByCol = (column: TaskItem['column']) => {
    return tasks.filter(
      (t) =>
        t.column === column &&
        (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.folio.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Stage priority class
  const getPriorityClass = (priority: TaskItem['priority']) => {
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

  // If activeView is 'detail', render Screen 3.1
  if (activeView === 'detail') {
    return (
      <div className="sifygsa-crm-container">
        <OpportunityDetail
          folio={selectedOpportunityFolio}
          onBackToOpportunities={() => setActiveView('table')}
          onGoToActivities={() => setActiveView('kanban')}
          onOpenNewActivityModal={() => handleOpenNewTask()}
        />

        {/* Modal for creating activities */}
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onSaveTask={handleSaveNewTask}
          defaultDate={newTaskDefaultDate}
        />
      </div>
    );
  }

  // If activeView is 'table', render Screen 3
  if (activeView === 'table') {
    return (
      <div className="sifygsa-crm-container">
        <OpportunitiesList
          onSelectOpportunity={(folio) => {
            setSelectedOpportunityFolio(folio);
            setActiveView('detail');
          }}
          onNewOpportunity={() => handleOpenNewTask()}
        />

        {/* Modal for creating activities */}
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onSaveTask={handleSaveNewTask}
          defaultDate={newTaskDefaultDate}
        />
      </div>
    );
  }

  return (
    <div className="sifygsa-crm-container">
      {/* ====================================================================
          HERO BANNER DE LA OPORTUNIDAD ACTIVA & NAVEGACIÓN ENTRE VISTAS
          ==================================================================== */}
      <section className="crm-project-hero-card">
        <div className="hero-top-row">
          <div className="hero-identity-group">
            <div className="hero-symbol-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F97316' }}>
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <div>
              <div className="hero-tags-line">
                <span className="hero-folio-tag font-mono">{selectedOpportunityFolio}</span>
                <span className="hero-client-name">PEMEX REFINACIÓN — TULA HIDALGO</span>
                <span className="hero-status-tag">58% Avance General</span>
              </div>
              <h1 className="hero-project-title">
                Flujo de Venta &amp; Suministro F&amp;G — Detección H2S / CH4 Planta Coquizadora
              </h1>
            </div>
          </div>

          <div className="hero-kpi-group">
            <div className="kpi-block">
              <span className="kpi-label">MONTO OPORTUNIDAD</span>
              <span className="kpi-value font-mono">$1,250,000 MXN</span>
            </div>
            <div className="kpi-block text-right">
              <span className="kpi-label">CIERRE ESTIMADO</span>
              <span className="kpi-date font-mono">30 May 2024</span>
            </div>
          </div>
        </div>

        {/* Barra de Pestañas de Vista y Acciones Jira / Monday */}
        <div className="hero-toolbar-row">
          <div className="views-switch-tabs">
            <button
              type="button"
              className={`view-tab-btn ${activeView === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveView('kanban')}
            >
              <IconKanban size={16} />
              <span>Tablero Kanban</span>
            </button>

            <button
              type="button"
              className={`view-tab-btn ${activeView === 'gantt' ? 'active' : ''}`}
              onClick={() => setActiveView('gantt')}
            >
              <IconTimeline size={16} />
              <span>Gantt / Cronograma</span>
            </button>

            <button
              type="button"
              className={`view-tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
            >
              <IconCalendar size={16} />
              <span>Calendario de Actividades</span>
            </button>

            <button
              type="button"
              className={`view-tab-btn ${(activeView as string) === 'table' ? 'active' : ''}`}
              onClick={() => setActiveView('table')}
            >
              <IconTable size={16} />
              <span>Cartera NetSuite</span>
            </button>
          </div>

          <div className="toolbar-search-actions">
            <div className="kanban-search-box">
              <input
                type="text"
                placeholder="Filtrar folio, cliente, tarea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="kanban-search-input"
              />
            </div>

            <button
              type="button"
              className="btn-add-task-primary"
              onClick={() => handleOpenNewTask()}
            >
              <IconPlus size={15} /> Nueva Actividad
            </button>

            <button
              type="button"
              className="btn-sprint-action"
              onClick={handleCompleteSprint}
            >
              <IconCheckSquare size={16} />
              <span>Completar Sprint</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          VISTA 1: TABLERO KANBAN (JIRA / MONDAY STYLE - Screen 3.2)
          ==================================================================== */}
      {activeView === 'kanban' && (
        <section className="sifygsa-kanban-board">
          {/* 1. POR HACER */}
          <div className="kanban-column">
            <div className="kanban-col-header">
              <div className="col-title-wrap">
                <span className="status-dot dot-gray" />
                <h3 className="col-title-text">POR HACER / PENDIENTE</h3>
              </div>
              <span className="col-count-badge">
                {getFilteredTasksByCol('todo').length}
              </span>
            </div>

            <div className="kanban-cards-stack">
              {getFilteredTasksByCol('todo').map((task) => (
                <div
                  key={task.id}
                  className="kanban-task-card"
                  onClick={() => setActiveTaskModal(task)}
                >
                  <div className="card-top-meta">
                    <span className="task-folio-badge">{task.folio}</span>
                    <span className={`priority-tag ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="task-card-title">{task.title}</h4>
                  <div className="card-bottom-info">
                    <div className="info-indicators">
                      {task.attachmentsCount && (
                        <span className="indicator-chip">
                          <IconPaperclip size={13} />
                          <span>{task.attachmentsCount}</span>
                        </span>
                      )}
                      {task.checklistCount && (
                        <span className="indicator-chip">
                          <IconCheckSquare size={13} />
                          <span>{task.checklistCount}</span>
                        </span>
                      )}
                    </div>
                    <div className="assignee-meta">
                      <span className="due-date-text">{task.dueDate}</span>
                      <div className="assignee-avatar-sm" title={task.assigneeName}>
                        {task.assigneeInitials}
                      </div>
                    </div>
                  </div>

                  {/* Quick move dropdown */}
                  <div className="card-quick-move" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-quick-move"
                      onClick={() => handleMoveTask(task.id, 'in_progress')}
                    >
                      Mover a En Curso →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. EN CURSO */}
          <div className="kanban-column">
            <div className="kanban-col-header">
              <div className="col-title-wrap">
                <span className="status-dot dot-orange" />
                <h3 className="col-title-text">EN CURSO / DESARROLLO</h3>
              </div>
              <span className="col-count-badge">
                {getFilteredTasksByCol('in_progress').length}
              </span>
            </div>

            <div className="kanban-cards-stack">
              {getFilteredTasksByCol('in_progress').map((task) => (
                <div
                  key={task.id}
                  className="kanban-task-card active-card"
                  onClick={() => setActiveTaskModal(task)}
                >
                  <div className="card-top-meta">
                    <div className="folio-pills-wrap">
                      <span className="task-folio-badge">{task.folio}</span>
                      {task.isCritical && (
                        <span className="critical-path-pill">
                          <span className="pulsing-orange-dot" /> ⚡ RUTA CRÍTICA
                        </span>
                      )}
                    </div>
                    <span className={`priority-tag ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  <h4 className="task-card-title">{task.title}</h4>

                  {task.description && (
                    <p className="task-card-desc">{task.description}</p>
                  )}

                  {task.progress !== undefined && (
                    <div className="task-progress-block">
                      <div className="progress-labels">
                        <span>Progreso Técnico</span>
                        <span className="font-mono">{task.progress}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill-bar"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="card-bottom-info">
                    <div className="info-indicators">
                      {task.attachmentsCount && (
                        <span className="indicator-chip">
                          <IconPaperclip size={13} />
                          <span>{task.attachmentsCount}</span>
                        </span>
                      )}
                      {task.checklistCount && (
                        <span className="indicator-chip">
                          <IconCheckSquare size={13} />
                          <span>{task.checklistCount}</span>
                        </span>
                      )}
                    </div>
                    <div className="assignee-meta">
                      <span className="due-date-text">{task.dueDate}</span>
                      <div className="assignee-avatar-sm highlight" title={task.assigneeName}>
                        {task.assigneeInitials}
                      </div>
                    </div>
                  </div>

                  {/* Quick move dropdown */}
                  <div className="card-quick-move" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-quick-move"
                      onClick={() => handleMoveTask(task.id, 'review')}
                    >
                      Mover a Revisión →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. EN REVISIÓN */}
          <div className="kanban-column">
            <div className="kanban-col-header">
              <div className="col-title-wrap">
                <span className="status-dot dot-blue" />
                <h3 className="col-title-text">EN REVISIÓN / APROBACIÓN</h3>
              </div>
              <span className="col-count-badge">
                {getFilteredTasksByCol('review').length}
              </span>
            </div>

            <div className="kanban-cards-stack">
              {getFilteredTasksByCol('review').map((task) => (
                <div
                  key={task.id}
                  className="kanban-task-card"
                  onClick={() => setActiveTaskModal(task)}
                >
                  <div className="card-top-meta">
                    <span className="task-folio-badge">{task.folio}</span>
                    <span className="priority-tag priority-blue">Revisión Técnica</span>
                  </div>
                  <h4 className="task-card-title">{task.title}</h4>
                  <div className="card-bottom-info">
                    <div className="info-indicators">
                      {task.attachmentsCount && (
                        <span className="indicator-chip">
                          <IconPaperclip size={13} />
                          <span>{task.attachmentsCount}</span>
                        </span>
                      )}
                      {task.checklistCount && (
                        <span className="indicator-chip">
                          <IconCheckSquare size={13} />
                          <span>{task.checklistCount}</span>
                        </span>
                      )}
                    </div>
                    <div className="assignee-meta">
                      <span className="due-date-text">{task.dueDate}</span>
                      <div className="assignee-avatar-sm" title={task.assigneeName}>
                        {task.assigneeInitials}
                      </div>
                    </div>
                  </div>

                  {/* Quick move dropdown */}
                  <div className="card-quick-move" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-quick-move"
                      onClick={() => handleMoveTask(task.id, 'done')}
                    >
                      Aprobar y Finalizar ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. FINALIZADO */}
          <div className="kanban-column">
            <div className="kanban-col-header">
              <div className="col-title-wrap">
                <span className="status-dot dot-green" />
                <h3 className="col-title-text">FINALIZADO / LISTO</h3>
              </div>
              <span className="col-count-badge">
                {getFilteredTasksByCol('done').length}
              </span>
            </div>

            <div className="kanban-cards-stack">
              {getFilteredTasksByCol('done').map((task) => (
                <div
                  key={task.id}
                  className="kanban-task-card finished-card"
                  onClick={() => setActiveTaskModal(task)}
                >
                  <div className="card-top-meta">
                    <span className="task-folio-badge">{task.folio}</span>
                    <span className="priority-tag priority-green">Completado</span>
                  </div>
                  <h4 className="task-card-title strike-through">{task.title}</h4>
                  <div className="card-bottom-info">
                    <div className="info-indicators">
                      {task.attachmentsCount && (
                        <span className="indicator-chip">
                          <IconPaperclip size={13} />
                          <span>{task.attachmentsCount}</span>
                        </span>
                      )}
                      <span className="indicator-chip green-text">
                        <IconCheckSquare size={13} />
                        <span>Listo</span>
                      </span>
                    </div>
                    <div className="assignee-meta">
                      <span className="due-date-text">{task.dueDate}</span>
                      <div className="assignee-avatar-sm" title={task.assigneeName}>
                        {task.assigneeInitials}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          VISTA 2: GANTT / CRONOGRAMA DE ACTIVIDADES (MONDAY.COM STYLE)
          ==================================================================== */}
      {activeView === 'gantt' && (
        <section className="sifygsa-gantt-section">
          <div className="gantt-card-wrapper">
            <div className="gantt-header-row">
              <h2 className="gantt-title">Cronograma de Entrega e Hitos Técnicos SIL-3</h2>
              <span className="gantt-period font-mono">Abril — Mayo 2024</span>
            </div>

            <div className="gantt-timeline-container">
              <div className="gantt-scale-header">
                <div className="gantt-task-col">Fase / Actividad Operativa</div>
                <div className="gantt-owner-col">Responsable</div>
                <div className="gantt-dates-col">Plazos</div>
                <div className="gantt-chart-col">
                  <span>Sem 1 (01-07)</span>
                  <span>Sem 2 (08-14)</span>
                  <span>Sem 3 (15-21)</span>
                  <span>Sem 4 (22-28)</span>
                  <span>Mayo</span>
                </div>
              </div>

              <div className="gantt-rows-stack">
                {ganttTasks.map((item) => (
                  <div key={item.id} className="gantt-data-row">
                    <div className="gantt-task-col">
                      <span className="gantt-task-name">{item.name}</span>
                      {item.isCritical && (
                        <span className="critical-path-pill" style={{ marginLeft: '6px' }}>
                          ⚡ Ruta Crítica
                        </span>
                      )}
                    </div>
                    <div className="gantt-owner-col">{item.owner}</div>
                    <div className="gantt-dates-col font-mono">
                      {item.start} — {item.end}
                    </div>
                    <div className="gantt-chart-col">
                      <div
                        className={`gantt-bar-element ${item.status === 'Completado' ? 'done' : 'in-progress'}`}
                        style={{ width: item.colWidth, left: item.colOffset }}
                      >
                        <span className="bar-label-text">{item.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          VISTA 3: CALENDARIO DE ACTIVIDADES (MONDAY.COM & JIRA STYLE)
          ==================================================================== */}
      {activeView === 'calendar' && (
        <CalendarView
          tasks={tasks}
          onSelectTask={(task) => setActiveTaskModal(task)}
          onOpenNewTaskModal={(date) => handleOpenNewTask(date)}
        />
      )}

      {/* ====================================================================
          MODAL DE DETALLE DE ACTIVIDAD (EDITAR / MOVER ESTADO / CHECKLIST)
          ==================================================================== */}
      {activeTaskModal && (
        <div
          className="crm-task-dialog-backdrop"
          onClick={() => setActiveTaskModal(null)}
        >
          <div
            className="crm-task-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div className="dialog-meta-header">
                <span className="dialog-folio-mono">{activeTaskModal.folio}</span>
                <span className={`priority-tag ${getPriorityClass(activeTaskModal.priority)}`}>
                  Prioridad {activeTaskModal.priority}
                </span>
                {activeTaskModal.isCritical && (
                  <span className="critical-path-pill">⚡ RUTA CRÍTICA</span>
                )}
              </div>
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => setActiveTaskModal(null)}
                aria-label="Cerrar modal"
              >
                <IconClose size={20} />
              </button>
            </div>

            <div className="dialog-body-content">
              <h2 className="dialog-task-title">{activeTaskModal.title}</h2>

              {/* Columna Status Changer */}
              <div style={{ margin: '0.85rem 0', padding: '0.65rem', background: '#1F1F22', borderRadius: '4px', border: '1px solid #38383B' }}>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>
                  Cambiar Estado de la Actividad:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {(['todo', 'in_progress', 'review', 'done'] as const).map((colKey) => (
                    <button
                      key={colKey}
                      type="button"
                      onClick={() => handleMoveTask(activeTaskModal.id, colKey)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '3px',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTaskModal.column === colKey ? '#F97316' : '#2D2D30',
                        color: '#FFFFFF',
                      }}
                    >
                      {colKey === 'todo' && 'Por Hacer'}
                      {colKey === 'in_progress' && 'En Curso'}
                      {colKey === 'review' && 'En Revisión'}
                      {colKey === 'done' && 'Finalizado'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dialog-metadata-grid">
                <div className="meta-card-col">
                  <span className="meta-card-label">Responsable</span>
                  <div className="assignee-dialog-row">
                    <div className="assignee-avatar-sm highlight">
                      {activeTaskModal.assigneeInitials}
                    </div>
                    <span className="meta-card-value">{activeTaskModal.assigneeName}</span>
                  </div>
                </div>

                <div className="meta-card-col">
                  <span className="meta-card-label">Fecha Límite</span>
                  <span className="meta-card-value font-mono">
                    {activeTaskModal.dueDate} 2024
                  </span>
                </div>

                <div className="meta-card-col">
                  <span className="meta-card-label">Progreso</span>
                  <span className="meta-card-value font-mono text-orange">
                    {activeTaskModal.progress ?? 0}%
                  </span>
                </div>
              </div>

              {activeTaskModal.description && (
                <div className="dialog-section-block">
                  <h3 className="section-block-heading">Memoria Técnica</h3>
                  <p className="section-block-paragraph">
                    {activeTaskModal.description}
                  </p>
                </div>
              )}

              {/* Checklist */}
              <div className="dialog-section-block">
                <h3 className="section-block-heading">Criterios de Verificación</h3>
                <div className="dialog-checklist">
                  {[
                    { id: 'chk-1', text: 'Memoria de cálculo I/O conforme a ingeniería de detalle Pemex' },
                    { id: 'chk-2', text: 'Certificación SIL-3 emitida por TÜV Rheinland verificada' },
                    { id: 'chk-3', text: 'Alineación de precios con lista de distribución Honeywell' },
                    { id: 'chk-4', text: 'VoBo Gerente Técnico firmado en formato digital' },
                  ].map((chk) => (
                    <label key={chk.id} className="checklist-label-row">
                      <input
                        type="checkbox"
                        checked={checklist[chk.id] ?? false}
                        onChange={() => setChecklist((prev) => ({ ...prev, [chk.id]: !prev[chk.id] }))}
                        className="sifygsa-checkbox"
                      />
                      <span className={checklist[chk.id] ? 'checked-strike' : ''}>
                        {chk.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="dialog-footer-actions">
              <button
                type="button"
                className="btn-dialog-secondary"
                onClick={() => setActiveTaskModal(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn-dialog-primary"
                onClick={() => {
                  alert('Cambios guardados en Jira / SIFYSUITE');
                  setActiveTaskModal(null);
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL CREAR NUEVA ACTIVIDAD
          ==================================================================== */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSaveTask={handleSaveNewTask}
        defaultDate={newTaskDefaultDate}
      />
    </div>
  );
};

export default HomeCRM;
