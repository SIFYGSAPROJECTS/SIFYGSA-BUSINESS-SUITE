import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  IconKanban,
  IconTimeline,
  IconCalendar,
  IconPlus,
  IconPaperclip,
  IconCheckSquare,
  IconClose,
  IconEye,
} from '../../../components/ui/Icons';
import '../crm.css';
import { CalendarView } from '../components/CalendarView';
import { NewTaskModal } from '../components/NewTaskModal';
import type { TaskItem } from '../components/NewTaskModal';
import { GanttDetailModal, type GanttTask } from '../components/GanttDetailModal';
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

  // Gantt Activity Details Modal & Hover Card state
  const [selectedGanttDetail, setSelectedGanttDetail] = useState<GanttTask | null>(null);
  const [hoveredTaskInfo, setHoveredTaskInfo] = useState<{
    item: GanttTask;
    statusClass: string;
    coords: {
      top: number;
      left: number;
      arrowOffset: number;
      placement: 'top' | 'bottom';
    };
  } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const ganttTasks: GanttTask[] = [
    {
      id: 'g-1',
      folio: 'ACT-SIL3-01',
      name: 'Levantamiento en Planta Coquizadora Tula',
      description: 'Levantamiento técnico en campo, validación de áreas clasificadas Clase I Div 1 e ingeniería de rutas de canalización para detectores Honeywell XNX.',
      owner: 'Daniel Rosas',
      ownerRole: 'Ingeniero de Campo SIL-3',
      team: [
        { name: 'Daniel Rosas', role: 'Ingeniero Responsable', initials: 'DR' },
        { name: 'Carlos Méndez', role: 'Especialista F&G', initials: 'CM' },
        { name: 'Roberto Méndez', role: 'Técnico de Sitio', initials: 'RM' },
      ],
      start: '01 Abr',
      end: '10 Abr',
      progress: 100,
      status: 'Completado',
      priority: 'Alta',
      colWidth: '22%',
      colOffset: '1%',
      deliverables: [
        'Reporte fotográfico de áreas de proceso Tula II',
        'Planos de distribución validados con superintendencia Pemex',
        'Cédula de interferencias mecánicas y eléctricas',
      ],
    },
    {
      id: 'g-2',
      folio: 'ACT-SIL3-02',
      name: 'Especificación HTO Detectores H2S / CH4',
      description: 'Elaboración y emisión de Hojas Técnicas de Operación (HTO) para 48 transmisores ópticos e infrarrojos con certificación ATEX/IECEx.',
      owner: 'Carlos Méndez',
      ownerRole: 'Ingeniero Senior de Instrumentación',
      team: [
        { name: 'Carlos Méndez', role: 'Ingeniero Instrumentista', initials: 'CM' },
        { name: 'Roberto Méndez', role: 'Soporte Técnico', initials: 'RM' },
      ],
      start: '08 Abr',
      end: '22 Abr',
      progress: 75,
      status: 'En Curso',
      isCritical: true,
      priority: 'Alta',
      colWidth: '32%',
      colOffset: '17%',
      deliverables: [
        'Fichas técnicas SIL-3 aprobadas por Pemex Refinación',
        'Cálculos de lazos 4-20mA y balance de potencia en tableros',
        'Revisión con departamento de Seguridad Funcional',
      ],
    },
    {
      id: 'g-3',
      folio: 'ACT-SIL3-03',
      name: 'Arquitectura SCADA Honeywell Safety Manager SIL-3',
      description: 'Diseño de arquitectura de comunicaciones tolerante a fallas, configuración de matriz C&E (Cause & Effect) y enlace con el DCS central.',
      owner: 'Ana Torres',
      ownerRole: 'Gerente de Automatización y Seguridad',
      team: [
        { name: 'Ana Torres', role: 'Líder SCADA', initials: 'AT' },
        { name: 'Pedro Ruiz', role: 'Ingeniero de Sistemas', initials: 'PR' },
        { name: 'Carlos Méndez', role: 'Integración F&G', initials: 'CM' },
      ],
      start: '15 Abr',
      end: '02 May',
      progress: 40,
      status: 'En Curso',
      isCritical: true,
      priority: 'Alta',
      colWidth: '36%',
      colOffset: '34%',
      deliverables: [
        'Diagrama de topología de red Ethernet redundante con switches Hirschmann',
        'Matriz C&E aprobada por especialista de procesos Tula',
        'Borrador de procedimiento de pruebas FAT en fábrica',
      ],
    },
    {
      id: 'g-4',
      folio: 'ACT-SIL3-04',
      name: 'Aprobación de Margen Financiero y Cotización Final',
      description: 'Revisión ejecutiva de costos de suministro, logística arancelaria y fijación de margen comercial para emisión de propuesta formal.',
      owner: 'Dirección General',
      ownerRole: 'Comité Técnico & Comercial',
      team: [
        { name: 'Lic. Martha Soto', role: 'Finanzas & Costos', initials: 'MS' },
        { name: 'Ing. Eduardo Mares', role: 'Dirección Comercial', initials: 'EM' },
      ],
      start: '25 Abr',
      end: '10 May',
      progress: 0,
      status: 'Pendiente',
      priority: 'Media',
      colWidth: '30%',
      colOffset: '56%',
      deliverables: [
        'Modelo financiero y flujo de caja consolidado',
        'Carta de fianza y cumplimiento para licitación',
        'Cotización oficial foliada en NetSuite',
      ],
    },
    {
      id: 'g-5',
      folio: 'ACT-SIL3-05',
      name: 'Suministro y Protocolo de Comisionamiento SAT',
      description: 'Recepción de detectores en bodega central, verificación metrológica y programación de protocolo de puesta en marcha SAT en sitio.',
      owner: 'Ing. Jorge Reyes',
      ownerRole: 'Coordinador de Obra y Comisionamiento',
      team: [
        { name: 'Ing. Jorge Reyes', role: 'Coordinador de Obra', initials: 'JR' },
        { name: 'Daniel Rosas', role: 'Ingeniero de Campo', initials: 'DR' },
      ],
      start: '02 May',
      end: '20 May',
      progress: 0,
      status: 'Pendiente',
      priority: 'Media',
      colWidth: '32%',
      colOffset: '68%',
      deliverables: [
        'Guía de embarque y acta de inspección visual en almacén',
        'Certificados individuales de calibración de fábrica Honeywell',
        'Protocolo SAT firmado por supervisor Pemex',
      ],
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

  // Gantt Bar Hover and Portal Handlers
  const handleBarMouseEnter = (
    item: GanttTask,
    statusClass: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const cardWidth = 300;
    const cardHeight = 230;

    // Smart placement: if close to viewport top, show card downwards; otherwise upwards
    const placement: 'top' | 'bottom' = rect.top < (cardHeight + 20) ? 'bottom' : 'top';
    const centerX = rect.left + rect.width / 2;
    // Keep card horizontally within the viewport
    const clampedCenter = Math.max(cardWidth / 2 + 16, Math.min(window.innerWidth - cardWidth / 2 - 16, centerX));
    const arrowOffset = Math.max(20, Math.min(cardWidth - 20, centerX - clampedCenter + cardWidth / 2));
    const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8;

    setHoveredTaskInfo({
      item,
      statusClass,
      coords: {
        top,
        left: clampedCenter,
        arrowOffset,
        placement,
      },
    });
  };

  const handleBarMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTaskInfo(null);
    }, 140);
  };

  const handleCardMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleCardMouseLeave = () => {
    setHoveredTaskInfo(null);
  };

  // Dismiss floating hover card on scroll or window resize
  useEffect(() => {
    const handleDismiss = () => {
      setHoveredTaskInfo(null);
    };
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

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
              {/* Header con 3 columnas principales: Actividad, Detalles, Meses */}
              <div className="gantt-scale-header-3col">
                <div className="gantt-col-header-activity">
                  <span>Actividad / Proyecto</span>
                </div>
                <div className="gantt-col-header-details">
                  <span>Detalles</span>
                </div>
                <div className="gantt-col-header-months">
                  <div className="gantt-months-top-row">
                    <div className="gantt-month-group month-abril">
                      <span>Abril 2024</span>
                    </div>
                    <div className="gantt-month-group month-mayo">
                      <span>Mayo 2024</span>
                    </div>
                  </div>
                  <div className="gantt-weeks-sub-row">
                    <span className="gantt-week-cell">Sem 1 (01-07)</span>
                    <span className="gantt-week-cell">Sem 2 (08-14)</span>
                    <span className="gantt-week-cell">Sem 3 (15-21)</span>
                    <span className="gantt-week-cell">Sem 4 (22-28)</span>
                    <span className="gantt-week-cell week-month-sep">Sem 1 (29-05)</span>
                    <span className="gantt-week-cell">Sem 2 (06-12)</span>
                    <span className="gantt-week-cell">Sem 3 (13-19)</span>
                  </div>
                </div>
              </div>

              {/* Filas de Actividades */}
              <div className="gantt-rows-stack">
                {ganttTasks.map((item) => {
                  const statusClass = item.status === 'Completado' ? 'done' : item.progress > 0 ? 'in-progress' : 'pending';
                  const isHovered = hoveredTaskInfo?.item.id === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`gantt-data-row-3col ${isHovered ? 'row-is-hovered' : ''}`}
                    >
                      {/* Columna 1: Nombre de la Actividad */}
                      <div className="gantt-cell-activity">
                        <div className="activity-title-group">
                          <span className="activity-name-text">{item.name}</span>
                          <div className="activity-meta-tags">
                            <span className="activity-folio-tag font-mono">{item.folio}</span>
                            {item.isCritical && (
                              <span className="critical-path-pill">
                                ⚡ Ruta Crítica
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Detalles (botón para ventana emergente) */}
                      <div className="gantt-cell-details">
                        <button
                          type="button"
                          className="btn-gantt-details-action"
                          onClick={() => setSelectedGanttDetail(item)}
                          title="Ver detalles de la actividad y a quiénes les corresponde"
                        >
                          <IconEye size={14} />
                          <span>Detalles</span>
                        </button>
                      </div>

                      {/* Columna 3: Meses (Visualización en barra con líneas guía) */}
                      <div className="gantt-cell-timeline">
                        {/* Líneas guía verticales punteadas de semanas */}
                        <div className="timeline-guideline" style={{ left: '14.28%' }} />
                        <div className="timeline-guideline" style={{ left: '28.56%' }} />
                        <div className="timeline-guideline" style={{ left: '42.84%' }} />
                        <div className="timeline-guideline timeline-month-boundary" style={{ left: '57.12%' }} />
                        <div className="timeline-guideline" style={{ left: '71.4%' }} />
                        <div className="timeline-guideline" style={{ left: '85.68%' }} />

                        {/* Barra de la Actividad */}
                        <div
                          className={`gantt-bar-box ${statusClass}`}
                          style={{ width: item.colWidth, left: item.colOffset }}
                          onMouseEnter={(e) => handleBarMouseEnter(item, statusClass, e)}
                          onMouseLeave={handleBarMouseLeave}
                        >
                          <div className="bar-visible-track">
                            <span className="bar-date-label font-mono">
                              {item.start} — {item.end}
                            </span>
                            <span className="bar-progress-badge font-mono">
                              {item.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tarjetita Flotante Global vía Portal (Nunca se corta por overflow de tablas o contenedores) */}
          {hoveredTaskInfo && typeof document !== 'undefined' && createPortal(
            <div
              className={`gantt-bar-hover-card-portal placement-${hoveredTaskInfo.coords.placement}`}
              style={{
                top: `${hoveredTaskInfo.coords.top}px`,
                left: `${hoveredTaskInfo.coords.left}px`,
                ['--arrow-left' as string]: `${hoveredTaskInfo.coords.arrowOffset}px`,
              }}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hover-card-header">
                <div className="hover-card-meta-line">
                  <span className="hover-card-folio-pill font-mono">{hoveredTaskInfo.item.folio}</span>
                  <span className={`hover-card-status-pill ${hoveredTaskInfo.statusClass}`}>
                    ● {hoveredTaskInfo.item.status}
                  </span>
                </div>
                <h4 className="hover-card-title">{hoveredTaskInfo.item.name}</h4>
              </div>

              <div className="hover-card-body">
                <div className="hover-info-row">
                  <span className="hover-info-key">A quiénes corresponde:</span>
                  <div className="hover-team-stack">
                    <span className="hover-owner-name">{hoveredTaskInfo.item.owner}</span>
                    <span className="hover-owner-role">{hoveredTaskInfo.item.ownerRole}</span>
                  </div>
                </div>

                <div className="hover-info-row">
                  <span className="hover-info-key">Plazo de ejecución:</span>
                  <span className="hover-info-val font-mono">
                    {hoveredTaskInfo.item.start} — {hoveredTaskInfo.item.end}
                  </span>
                </div>

                <div className="hover-info-row">
                  <span className="hover-info-key">Avance del proyecto:</span>
                  <div className="hover-progress-container">
                    <span className="hover-progress-number font-mono text-orange">
                      {hoveredTaskInfo.item.progress}%
                    </span>
                    <div className="hover-progress-track">
                      <div
                        className={`hover-progress-fill ${hoveredTaskInfo.statusClass}`}
                        style={{ width: `${hoveredTaskInfo.item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="hover-card-footer">
                <button
                  type="button"
                  className="btn-hover-card-details"
                  onClick={() => {
                    setSelectedGanttDetail(hoveredTaskInfo.item);
                    setHoveredTaskInfo(null);
                  }}
                >
                  <IconEye size={13} /> Ver Detalles
                </button>
              </div>
            </div>,
            document.body
          )}
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
              <div className="dialog-status-changer-card">
                <span className="dialog-status-changer-label">
                  Cambiar Estado de la Actividad:
                </span>
                <div className="dialog-status-chips-wrap">
                  {(['todo', 'in_progress', 'review', 'done'] as const).map((colKey) => (
                    <button
                      key={colKey}
                      type="button"
                      onClick={() => handleMoveTask(activeTaskModal.id, colKey)}
                      className={`dialog-status-chip-btn ${activeTaskModal.column === colKey ? 'active' : ''}`}
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

      {/* ====================================================================
          MODAL DETALLES DE ACTIVIDAD DEL CRONOGRAMA (GANTT POPUP)
          ==================================================================== */}
      <GanttDetailModal
        task={selectedGanttDetail}
        onClose={() => setSelectedGanttDetail(null)}
      />
    </div>
  );
};

export default HomeCRM;
