import React, { useState, useEffect } from 'react';
import {
  IconCalendar,
  IconClose,
  IconChevronLeft,
  IconChevronRight,
} from '../../../components/ui/Icons';

interface CalendarEvent {
  id: string;
  day: number;
  time: string;
  type: 'cumpleanos' | 'contrato' | 'capacitacion' | 'guardia' | 'vacaciones';
  typeLabel: string;
  title: string;
  location: string;
  pillColor: string;
  badgeType?: 'critico' | 'normal';
}

interface CalendarModalRHProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModalRH: React.FC<CalendarModalRHProps> = ({ isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<'oct' | 'nov'>('oct');
  const [selectedDay, setSelectedDay] = useState<number>(15);

  // Escuchar la tecla ESC para cerrar la ventana modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const events: CalendarEvent[] = [
    {
      id: 'e1',
      day: 2,
      time: '08:00',
      type: 'guardia',
      typeLabel: 'Guardia',
      title: 'Guardia Mina',
      location: 'Refinería Minatitlán • Turno 24h',
      pillColor: '#059669',
    },
    {
      id: 'e2',
      day: 9,
      time: '09:00',
      type: 'vacaciones',
      typeLabel: 'Vacaciones',
      title: 'Vacac: R. Ortiz',
      location: 'Roberto Ortiz • 5 días hábiles',
      pillColor: '#4f46e5',
    },
    {
      id: 'e3',
      day: 15,
      time: '09:00',
      type: 'cumpleanos',
      typeLabel: 'Cumpleaños',
      title: 'Cumpleaños Carlos Ruiz',
      location: 'Carlos Ruiz • Base Comalcalco, Tabasco',
      pillColor: '#ea580c',
    },
    {
      id: 'e4',
      day: 24,
      time: '10:00',
      type: 'capacitacion',
      typeLabel: 'Capacitación',
      title: 'Capacitación SIL-3',
      location: 'Equipo Técnico • Base Comalcalco, Tabasco',
      pillColor: '#0284c7',
    },
    {
      id: 'e5',
      day: 25,
      time: '11:30',
      type: 'guardia',
      typeLabel: 'Inducción',
      title: 'Inducción Minatitlán',
      location: 'Cuadrilla Alfa • Base Mapachapa',
      pillColor: '#059669',
    },
    {
      id: 'e6',
      day: 26,
      time: '08:00',
      type: 'guardia',
      typeLabel: 'Guardia',
      title: 'Guardia Mina',
      location: 'Brigada F&G • Refinería Minatitlán',
      pillColor: '#059669',
    },
    {
      id: 'e7',
      day: 30,
      time: 'LÍMITE',
      type: 'contrato',
      typeLabel: 'CRÍTICO',
      badgeType: 'critico',
      title: 'Fin Laura Gómez',
      location: 'Laura Gómez • Plataforma Marina Pemex',
      pillColor: '#dc2626',
    },
  ];

  // Cuadrícula de días para Octubre (comenzando el lunes 30 Sep previo)
  const calendarCells = [
    { day: 30, isPrevMonth: true },
    { day: 1, isPrevMonth: false },
    { day: 2, isPrevMonth: false, event: events[0] },
    { day: 3, isPrevMonth: false },
    { day: 4, isPrevMonth: false },
    { day: 5, isPrevMonth: false },
    { day: 6, isPrevMonth: false },
    { day: 7, isPrevMonth: false },
    { day: 8, isPrevMonth: false },
    { day: 9, isPrevMonth: false, event: events[1] },
    { day: 10, isPrevMonth: false },
    { day: 11, isPrevMonth: false },
    { day: 12, isPrevMonth: false },
    { day: 13, isPrevMonth: false },
    { day: 14, isPrevMonth: false },
    { day: 15, isPrevMonth: false, isToday: true, event: events[2] },
    { day: 16, isPrevMonth: false },
    { day: 17, isPrevMonth: false },
    { day: 18, isPrevMonth: false },
    { day: 19, isPrevMonth: false },
    { day: 20, isPrevMonth: false },
    { day: 21, isPrevMonth: false },
    { day: 22, isPrevMonth: false },
    { day: 23, isPrevMonth: false },
    { day: 24, isPrevMonth: false, event: events[3] },
    { day: 25, isPrevMonth: false, event: events[4] },
    { day: 26, isPrevMonth: false, event: events[5] },
    { day: 27, isPrevMonth: false },
    { day: 28, isPrevMonth: false },
    { day: 29, isPrevMonth: false },
    { day: 30, isPrevMonth: false, event: events[6] },
    { day: 31, isPrevMonth: false },
    { day: 1, isNextMonth: true, monthName: 'Nov' },
    { day: 2, isNextMonth: true },
    { day: 3, isNextMonth: true },
  ];

  return (
    /* NOTA: NO se cierra al hacer clic fuera de la ventana (se removió onClick del backdrop) */
    <div className="rh-modal-backdrop" aria-hidden={!isOpen}>
      <div
        className="rh-calendar-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
      >
        {/* Header del Modal */}
        <div className="rh-cal-modal-header">
          <div className="rh-cal-header-left">
            {/* Flecha con botón para volver / cerrar con ESC */}
            <button
              type="button"
              className="cal-modal-back-arrow-btn"
              onClick={onClose}
              title="Volver / Cerrar (Esc)"
              aria-label="Volver / Cerrar ventana"
            >
              <IconChevronLeft size={20} />
            </button>

            <div className="rh-cal-icon-box">
              <IconCalendar size={22} style={{ color: '#F97316' }} />
            </div>

            <div>
              <div className="rh-cal-title-row">
                <h2 id="calendar-modal-title" className="rh-cal-title">
                  Calendario General de RRHH &amp; Operaciones
                </h2>
                <span className="rh-cal-status-badge">ACTIVO</span>
              </div>
              <p className="rh-cal-subtitle">
                Monitoreo de guardias operativas en campo, vacaciones, cumpleaños y contratos
              </p>
            </div>
          </div>

          <div className="rh-cal-header-controls">
            <button
              type="button"
              className="btn-cal-primary"
              onClick={() => alert('Registrar nuevo evento en el calendario')}
            >
              + + Agregar Evento
            </button>

            <div className="cal-month-nav">
              <button
                type="button"
                className="cal-nav-arrow"
                title="Mes anterior"
                aria-label="Mes anterior"
              >
                <IconChevronLeft size={16} />
              </button>
              <span className="cal-nav-month-label">
                {selectedMonth === 'oct' ? 'Octubre 2024' : 'Noviembre 2024'}
              </span>
              <button
                type="button"
                className="cal-nav-arrow"
                title="Mes siguiente"
                aria-label="Mes siguiente"
              >
                <IconChevronRight size={16} />
              </button>
            </div>

            <div className="cal-month-toggle-pills">
              <button
                type="button"
                className={`cal-toggle-pill ${selectedMonth === 'oct' ? 'active' : ''}`}
                onClick={() => setSelectedMonth('oct')}
              >
                Oct 2024
              </button>
              <button
                type="button"
                className={`cal-toggle-pill ${selectedMonth === 'nov' ? 'active' : ''}`}
                onClick={() => setSelectedMonth('nov')}
              >
                Nov 2024
              </button>
            </div>

            {/* Botón X prominente para cerrar con indicación de tecla Esc */}
            <button
              type="button"
              className="cal-modal-close-btn"
              onClick={onClose}
              title="Cerrar ventana (Esc)"
              aria-label="Cerrar ventana"
            >
              <IconClose size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Leyenda de Colores */}
        <div className="rh-cal-legend-bar">
          <span className="cal-legend-label">LEYENDA:</span>
          <span className="cal-legend-tag tag-birthday">
            <span className="dot dot-birthday" /> Cumpleaños
          </span>
          <span className="cal-legend-tag tag-contract">
            <span className="dot dot-contract" /> Fin de Contrato
          </span>
          <span className="cal-legend-tag tag-sil3">
            <span className="dot dot-sil3" /> Capacitación SIL-3
          </span>
          <span className="cal-legend-tag tag-guard">
            <span className="dot dot-guard" /> Guardias Operativas
          </span>
          <span className="cal-legend-tag tag-vacation">
            <span className="dot dot-vacation" /> Vacaciones / Permisos
          </span>
        </div>

        {/* Contenido Dividido: Cuadrícula Calendario (Izq) + Eventos Programados (Der) */}
        <div className="rh-cal-split-body">
          {/* Lado Izquierdo: Cuadrícula del Calendario */}
          <div className="rh-cal-grid-area">
            {/* Cabecera de días de la semana */}
            <div className="cal-weekdays-row">
              <span className="weekday-header">LUN</span>
              <span className="weekday-header">MAR</span>
              <span className="weekday-header">MIÉ</span>
              <span className="weekday-header">JUE</span>
              <span className="weekday-header">VIE</span>
              <span className="weekday-header weekend">SÁB</span>
              <span className="weekday-header weekend">DOM</span>
            </div>

            {/* Días del mes */}
            <div className="cal-days-grid">
              {calendarCells.map((cell, idx) => {
                const isSelected = !cell.isPrevMonth && !cell.isNextMonth && cell.day === selectedDay;
                return (
                  <div
                    key={idx}
                    className={`cal-day-cell ${
                      cell.isPrevMonth || cell.isNextMonth ? 'dimmed-day' : ''
                    } ${cell.isToday ? 'today-day' : ''} ${isSelected ? 'selected-day' : ''}`}
                    onClick={() => {
                      if (!cell.isPrevMonth && !cell.isNextMonth) {
                        setSelectedDay(cell.day);
                      }
                    }}
                  >
                    <div className="cal-day-number-row">
                      <span className="cal-day-num">
                        {cell.day} {cell.monthName ? <small>{cell.monthName}</small> : null}
                      </span>
                      {cell.isToday && <span className="today-badge">HOY</span>}
                    </div>

                    {cell.event && (
                      <div
                        className="cal-day-event-chip"
                        style={{
                          backgroundColor: `${cell.event.pillColor}22`,
                          borderColor: cell.event.pillColor,
                          color: cell.event.pillColor,
                        }}
                        title={`${cell.event.title} (${cell.event.location})`}
                      >
                        <span className="event-chip-text">{cell.event.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lado Derecho: Panel de Eventos Programados */}
          <div className="rh-cal-events-panel">
            <div className="events-panel-header">
              <div className="events-panel-title">
                <span className="orange-dot" />
                <span>EVENTOS PROGRAMADOS</span>
              </div>
              <button
                type="button"
                className="btn-add-event-mini"
                onClick={() => alert('Crear nuevo evento para esta fecha')}
              >
                + Nuevo
              </button>
            </div>

            {/* Lista de Eventos */}
            <div className="events-panel-list">
              {/* Evento 1 */}
              <div className="event-scheduled-card">
                <div className="event-meta-top">
                  <span className="event-datetime">15 OCT • 09:00</span>
                  <span className="event-badge badge-cumple">Cumpleaños</span>
                </div>
                <h4 className="event-title">Cumpleaños Carlos Ruiz</h4>
                <p className="event-location">Carlos Ruiz • Base Comalcalco, Tabasco</p>
              </div>

              {/* Evento 2 */}
              <div className="event-scheduled-card">
                <div className="event-meta-top">
                  <span className="event-datetime">24 OCT • 10:00</span>
                  <span className="event-badge badge-cap">Capacitación</span>
                </div>
                <h4 className="event-title">Capacitación SIL-3</h4>
                <p className="event-location">Equipo Técnico • Base Comalcalco, Tabasco</p>
              </div>

              {/* Evento 3 */}
              <div className="event-scheduled-card card-critical">
                <div className="event-meta-top">
                  <span className="event-datetime text-red">30 OCT • LÍMITE</span>
                  <span className="event-badge badge-critical">CRÍTICO</span>
                </div>
                <h4 className="event-title">Fin Laura Gómez</h4>
                <p className="event-location">Laura Gómez • Plataforma Marina Pemex</p>
              </div>
            </div>

            {/* Botón de Registro de Nuevo Evento al pie */}
            <div className="events-panel-actions">
              <button
                type="button"
                className="btn-register-event-dashed"
                onClick={() => alert('Formulario de registro de evento')}
              >
                + + Registrar Nuevo Evento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModalRH;
