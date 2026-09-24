import React, { useState } from 'react';
import { IconPlus } from '../../../components/ui/Icons';
import type { TaskItem } from './NewTaskModal';

interface CalendarViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenNewTaskModal: (date?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
  onOpenNewTaskModal,
}) => {
  // Default to Abril 2024 as in the Pemex project mockups
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(3); // 0-indexed: 3 is Abril
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentMonth(3); // Abril 2024 mockup
    setCurrentYear(2024);
  };

  // Generate calendar days
  // First day of month (0 = Sunday, 1 = Monday...)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Helper to match task to day number in current month
  const getTasksForDay = (dayNum: number) => {
    return tasks.filter((task) => {
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

      // dueDate can be '18 Abr', '25 Abr', '05 May', etc.
      const monthAbbrs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const curAbbr = monthAbbrs[currentMonth];

      const parts = task.dueDate.split(' ');
      if (parts.length >= 2) {
        const taskDay = parseInt(parts[0], 10);
        const taskMonth = parts[1];
        return taskDay === dayNum && taskMonth.toLowerCase().startsWith(curAbbr.toLowerCase().slice(0, 3));
      }
      return false;
    });
  };

  // Status badge styling
  const getStatusColor = (col: TaskItem['column']) => {
    switch (col) {
      case 'todo':
        return '#6B7280';
      case 'in_progress':
        return '#EA580C';
      case 'review':
        return '#0284C7';
      case 'done':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="crm-calendar-wrapper">
      {/* Calendar Header Bar (Monday.com style) */}
      <div className="calendar-controls-bar">
        {/* Left: Navigation Month/Year */}
        <div className="calendar-nav-group">
          <div className="calendar-month-display">
            <h2 className="calendar-month-title">
              {monthNames[currentMonth]} <span className="calendar-year-mono">{currentYear}</span>
            </h2>
            <span className="calendar-brand-tag">Cronograma Actividades Jira / Monday</span>
          </div>

          <div className="calendar-nav-buttons">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              title="Mes Anterior"
            >
              ◀
            </button>
            <button
              type="button"
              className="cal-today-btn"
              onClick={handleToday}
            >
              Hoy
            </button>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handleNextMonth}
              title="Mes Siguiente"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Right: Filters & Create button */}
        <div className="calendar-actions-group">
          {/* Priority filter */}
          <div className="calendar-filter-dropdown">
            <span className="cal-filter-label">Prioridad:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="cal-filter-select"
            >
              <option value="all">Todas</option>
              <option value="Alta">Alta (Crítica)</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          {/* New Task Button */}
          <button
            type="button"
            className="cal-btn-add-activity"
            onClick={() => onOpenNewTaskModal(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`)}
          >
            <IconPlus size={16} /> Agendar Actividad
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="calendar-legend-bar">
        <div className="legend-item">
          <span className="legend-pip" style={{ background: '#6B7280' }} />
          <span>Por Hacer</span>
        </div>
        <div className="legend-item">
          <span className="legend-pip" style={{ background: '#EA580C' }} />
          <span>En Curso</span>
        </div>
        <div className="legend-item">
          <span className="legend-pip" style={{ background: '#0284C7' }} />
          <span>En Revisión</span>
        </div>
        <div className="legend-item">
          <span className="legend-pip" style={{ background: '#10B981' }} />
          <span>Finalizado</span>
        </div>
        <div className="legend-item">
          <span className="legend-pip" style={{ background: '#F59E0B' }} />
          <span>⚡ Ruta Crítica</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="calendar-grid-card">
        {/* Days Header */}
        <div className="calendar-weekdays-header">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className={`weekday-col-title ${idx >= 5 ? 'weekend' : ''}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="calendar-days-grid">
          {/* Previous month padding cells */}
          {Array.from({ length: startingDayIndex }).map((_, idx) => {
            const dayNumber = daysInPrevMonth - startingDayIndex + idx + 1;
            return (
              <div key={`prev-${idx}`} className="calendar-cell outside-month">
                <span className="cell-day-num">{dayNumber}</span>
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNumber = idx + 1;
            const dayTasks = getTasksForDay(dayNumber);
            const isToday = currentMonth === 3 && currentYear === 2024 && dayNumber === 18;
            const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

            return (
              <div
                key={`day-${dayNumber}`}
                className={`calendar-cell ${isToday ? 'today-cell' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
              >
                <div className="cell-top-row">
                  <span className={`cell-day-num ${isToday ? 'today-badge' : ''}`}>
                    {dayNumber}
                  </span>
                  <button
                    type="button"
                    className="cell-quick-add"
                    title={`Añadir tarea el ${dayNumber} ${monthNames[currentMonth]}`}
                    onClick={() => onOpenNewTaskModal(formattedDateStr)}
                  >
                    +
                  </button>
                </div>

                {/* Day Tasks Stack */}
                <div className="cell-tasks-stack">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`cal-task-chip ${task.isCritical ? 'critical-border' : ''}`}
                      style={{ borderLeftColor: getStatusColor(task.column) }}
                      onClick={() => onSelectTask(task)}
                      title={`${task.folio}: ${task.title} (${task.assigneeName})`}
                    >
                      <div className="chip-top-meta">
                        <span className="chip-folio-tag">{task.folio}</span>
                        {task.isCritical && <span className="chip-crit-icon">⚡</span>}
                        <span className="chip-assignee-circle">{task.assigneeInitials}</span>
                      </div>
                      <span className="chip-title-truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
