import React, { useState } from 'react';
import {
  IconUsers,
  IconShieldCheck,
  IconCalendar,
  IconClock,
  IconCake,
  IconAlertTriangle,
  IconEye,
  IconEdit,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconChartBar,
  IconBriefcase,
  IconCheckSquare,
} from '../../../components/ui/Icons';
import { CalendarModalRH } from '../components/CalendarModalRH';
import '../rh.css';

interface Colaborador {
  id: string;
  initials: string;
  avatarColor: string;
  name: string;
  email: string;
  position: string;
  specialty: string;
  sede: string;
  cuadrilla: string;
  statusText: string;
  statusType: 'vigente-sil3' | 'vigente' | 'renovar' | 'activo-rh';
  fechaIngreso: string;
}

export const HomeRH: React.FC = () => {
  // Estado para la sede seleccionada en la cabecera
  const [selectedSede, setSelectedSede] = useState<string>('Refinería Minatitlán, Ver.');

  // Estado del modal de calendario
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Filtros de la tabla de colaboradores
  const [activeDepto, setActiveDepto] = useState<string>('Todos los Deptos');
  const [activeSedeTab, setActiveSedeTab] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Estado del carrusel de KPIs (3 slides)
  const [kpiSlideIndex, setKpiSlideIndex] = useState<number>(0);

  // Estado del carrusel estilo Steam de la Agenda Operativa
  const [agendaSlideIndex, setAgendaSlideIndex] = useState<number>(0);

  // Estado para tareas completadas en la Agenda Operativa
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Expandir actividades del viernes
  const [expandedFriday, setExpandedFriday] = useState<boolean>(false);

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Datos de Colaboradores
  const colaboradores: Colaborador[] = [
    {
      id: 'c1',
      initials: 'SM',
      avatarColor: '#0284C7', // Azul petróleo
      name: 'Mtra. Sofía Morales Ruiz',
      email: 'sofia.morales@sifygsa.com',
      position: 'Coordinadora de Seguridad',
      specialty: 'Sistemas Fire & Gas',
      sede: 'Refinería Minatitlán',
      cuadrilla: 'Cuadrilla Alfa / Seguridad',
      statusText: 'DC-3 Vigente SIL-3',
      statusType: 'vigente-sil3',
      fechaIngreso: '12/09/2022',
    },
    {
      id: 'c2',
      initials: 'CH',
      avatarColor: '#EA580C', // Naranja
      name: 'Ing. Carlos Hernández',
      email: 'carlos.hernandez@sifygsa.com',
      position: 'Técnico Esp. Detección Gas',
      specialty: 'Sensores H2S / LEL',
      sede: 'Base Mapachapa',
      cuadrilla: 'Operaciones F&G',
      statusText: 'DC-3 Vigente',
      statusType: 'vigente',
      fechaIngreso: '18/09/2023',
    },
    {
      id: 'c3',
      initials: 'RS',
      avatarColor: '#4F46E5', // Slate Indigo
      name: 'Téc. Roberto Silva Alor',
      email: 'roberto.silva@sifygsa.com',
      position: 'Supervisor de Instrumentación',
      specialty: 'Mantenimiento SCADA',
      sede: 'Refinería Minatitlán',
      cuadrilla: 'Cuadrilla Industrial Minatitlán',
      statusText: 'Por Renovar DC-3',
      statusType: 'renovar',
      fechaIngreso: '05/09/2024',
    },
    {
      id: 'c4',
      initials: 'AF',
      avatarColor: '#0284C7', // Azul Corporativo
      name: 'Lic. Ana Lucía Fernández',
      email: 'ana.fernandez@sifygsa.com',
      position: 'Especialista Nóminas & Campo',
      specialty: 'Recursos Humanos SIFYGSA',
      sede: 'Base Comalcalco',
      cuadrilla: 'Oficinas Centrales',
      statusText: 'Activo RH',
      statusType: 'activo-rh',
      fechaIngreso: '01/09/2024',
    },
  ];

  // Filtrado de colaboradores según pestaña de sede
  const filteredColaboradores = colaboradores.filter((colab) => {
    if (activeSedeTab === 'Todos') return true;
    if (activeSedeTab === 'Minatitlán') return colab.sede.includes('Minatitlán');
    if (activeSedeTab === 'Comalcalco') return colab.sede.includes('Comalcalco');
    if (activeSedeTab === 'Mapachapa') return colab.sede.includes('Mapachapa');
    return true;
  });

  return (
    <div className="rh-dashboard-container">
      {/* ====================================================================
          1. HEADER BANNER RECURSOS HUMANOS
          ==================================================================== */}
      <div className="rh-top-control-banner">
        <div className="rh-header-title-group">
          <div className="rh-heading-with-badge">
            <h1 className="rh-title-text">Recursos Humanos</h1>
            <span className="rh-control-badge">RH Control Center</span>
          </div>
          <p className="rh-subtitle-text">
            Gestión integral de talento, guardias operativas Minatitlán/Comalcalco y cumplimiento normativo SIL-3.
          </p>
        </div>

        <div className="rh-header-actions-group">
          <div className="rh-sede-selector-wrapper">
            <span className="rh-sede-label">Sede:</span>
            <select
              className="rh-sede-select"
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
            >
              <option value="Todas las Sedes">Todas las Sedes</option>
              <option value="Refinería Minatitlán, Ver.">Refinería Minatitlán, Ver.</option>
              <option value="Base Comalcalco, Tab.">Base Comalcalco, Tab.</option>
              <option value="Base Mapachapa, Ver.">Base Mapachapa, Ver.</option>
            </select>
          </div>

          <button
            type="button"
            className="btn-rh-calendar-trigger"
            onClick={() => setIsCalendarOpen(true)}
          >
            <IconCalendar size={18} />
            <span>Abrir Calendario RH</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. INDICADORES OPERATIVOS CLAVE
          ==================================================================== */}
      <section className="rh-kpi-section" aria-label="Indicadores Operativos Clave">
        <div className="rh-section-header-row">
          <div className="rh-section-title-lockup">
            <h2 className="rh-section-heading">INDICADORES OPERATIVOS CLAVE</h2>
            <span className="rh-updated-tag">Actualizado: Sep 2026</span>
            <span className="rh-kpi-slide-counter">
              {kpiSlideIndex === 0 && 'Plantilla & Estatus'}
              {kpiSlideIndex === 1 && 'Operaciones & Seguridad en Campo'}
              {kpiSlideIndex === 2 && 'Capacitación & Cumplimiento STPS'}
              {' '}({kpiSlideIndex + 1}/3)
            </span>
          </div>

          <div className="rh-carousel-arrows">
            <button
              type="button"
              className="carousel-arrow-btn"
              aria-label="Diapositiva anterior"
              title="Anterior"
              disabled={kpiSlideIndex === 0}
              onClick={() => setKpiSlideIndex((prev) => Math.max(0, prev - 1))}
            >
              <IconChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="carousel-arrow-btn"
              aria-label="Siguiente diapositiva"
              title="Siguiente"
              disabled={kpiSlideIndex === 2}
              onClick={() => setKpiSlideIndex((prev) => Math.min(2, prev + 1))}
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Viewport del Carrusel de KPIs */}
        <div className="rh-kpis-carousel-viewport">
          <div
            className="rh-kpis-carousel-track"
            style={{ transform: `translateX(-${kpiSlideIndex * 100}%)` }}
          >
            {/* Diapositiva 1: Plantilla & Estatus Operativo */}
            <div className="rh-kpis-slide">
              {/* Tarjeta 1: Total de Empleados */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Total de Empleados</span>
                  <div className="kpi-icon-box orange">
                    <IconUsers size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">128</div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">↗ +12 este mes</span>
                  <span className="kpi-sub-comparison">+9.5% vs mes ant.</span>
                </div>
              </div>

              {/* Tarjeta 2: Eventuales */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Eventuales</span>
                  <div className="kpi-icon-box amber">
                    <IconClock size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">6</div>
                <div className="kpi-footer-row">
                  <span className="kpi-sub-alert">
                    <span className="mini-dot amber" /> 3 ingresados esta semana
                  </span>
                  <span className="kpi-sub-dim">Eval. Técnica</span>
                </div>
              </div>

              {/* Tarjeta 3: Cumpleaños del Mes */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Cumpleaños del Mes</span>
                  <div className="kpi-icon-box orange-deep">
                    <IconCake size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">8</div>
                <div className="kpi-footer-row">
                  <span className="kpi-birthday-text">Próx: Carlos Ruiz (en 4d)</span>
                  <button
                    type="button"
                    className="kpi-link-btn"
                    onClick={() => setIsCalendarOpen(true)}
                  >
                    Ver todos (8)
                  </button>
                </div>
              </div>

              {/* Tarjeta 4: Contratos por Vencer */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Contratos por Vencer</span>
                  <div className="kpi-icon-box red">
                    <IconAlertTriangle size={18} />
                  </div>
                </div>
                <div className="kpi-main-number text-red">5</div>
                <div className="kpi-footer-row">
                  <span className="kpi-urgent-red">2 urgentes en 30 días</span>
                  <span className="kpi-sub-dim">Minatitlán / Tula</span>
                </div>
              </div>

              {/* Tarjeta 5: Acreditados SIL-3 / DC-3 */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Acreditados SIL-3 / DC-3</span>
                  <div className="kpi-icon-box blue">
                    <IconShieldCheck size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">
                  42 <span className="kpi-unit-sub">/ 58 Técnicos</span>
                </div>
                <div className="kpi-footer-row">
                  <span className="kpi-sub-blue">100% Cobertura Refinería</span>
                  <span className="kpi-sub-dim">Vigencia 2026</span>
                </div>
              </div>
            </div>

            {/* Diapositiva 2: Operaciones & Seguridad en Campo */}
            <div className="rh-kpis-slide">
              {/* Tarjeta 6: Asistencia Diaria */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Asistencia Hoy</span>
                  <div className="kpi-icon-box green">
                    <IconCheck size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">98.4%</div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">126 presentes / 128</span>
                  <span className="kpi-sub-dim">2 justificados</span>
                </div>
              </div>

              {/* Tarjeta 7: Guardias 24/7 Activas */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Guardias Activas 24/7</span>
                  <div className="kpi-icon-box blue">
                    <IconShieldCheck size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">14</div>
                <div className="kpi-footer-row">
                  <span className="kpi-sub-blue">8 Mina / 6 Comalcalco</span>
                  <span className="kpi-sub-dim">Turno B Activo</span>
                </div>
              </div>

              {/* Tarjeta 8: Horas Sin Accidentes */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Horas Sin Accidentes</span>
                  <div className="kpi-icon-box green">
                    <IconClock size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">
                  148.2k <span className="kpi-unit-sub">hrs</span>
                </div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">Cero incidentes LTI</span>
                  <span className="kpi-sub-dim">SIL-3 Activo</span>
                </div>
              </div>

              {/* Tarjeta 9: Exámenes Médicos */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Exámenes Médicos</span>
                  <div className="kpi-icon-box amber">
                    <IconBriefcase size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">94%</div>
                <div className="kpi-footer-row">
                  <span className="kpi-sub-alert">
                    <span className="mini-dot amber" /> 6 citas pendientes
                  </span>
                  <span className="kpi-sub-dim">Base Mapachapa</span>
                </div>
              </div>

              {/* Tarjeta 10: Vacaciones en Curso */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Vacaciones en Curso</span>
                  <div className="kpi-icon-box blue">
                    <IconCalendar size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">4</div>
                <div className="kpi-footer-row">
                  <span className="kpi-sub-blue">Cobertura 100% relevos</span>
                  <span className="kpi-sub-dim">Retorno próx. lunes</span>
                </div>
              </div>
            </div>

            {/* Diapositiva 3: Capacitación & Cumplimiento STPS */}
            <div className="rh-kpis-slide">
              {/* Tarjeta 11: Horas de Capacitación */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Horas Capacitación Q3</span>
                  <div className="kpi-icon-box blue">
                    <IconChartBar size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">
                  385 <span className="kpi-unit-sub">hrs</span>
                </div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">↗ +28h esta quincena</span>
                  <span className="kpi-sub-dim">Prom. 3.2h/técnico</span>
                </div>
              </div>

              {/* Tarjeta 12: Certificaciones STPS */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Certificaciones DC-3</span>
                  <div className="kpi-icon-box green">
                    <IconShieldCheck size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">52</div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">Normas NOM-004/029</span>
                  <span className="kpi-sub-dim">Registradas STPS</span>
                </div>
              </div>

              {/* Tarjeta 13: Vacantes Activas */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Vacantes Activas</span>
                  <div className="kpi-icon-box amber">
                    <IconBriefcase size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">3</div>
                <div className="kpi-footer-row">
                  <span className="kpi-sub-alert">
                    <span className="mini-dot amber" /> 14 postulantes
                  </span>
                  <span className="kpi-sub-dim">En entrevista</span>
                </div>
              </div>

              {/* Tarjeta 14: Índice de Rotación */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Índice de Rotación</span>
                  <div className="kpi-icon-box green">
                    <IconUsers size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">0.8%</div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">↘ -0.6% vs estándar</span>
                  <span className="kpi-sub-dim">Retención Alta</span>
                </div>
              </div>

              {/* Tarjeta 15: Auditorías Aprobadas */}
              <div className="rh-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-label">Auditorías Aprobadas</span>
                  <div className="kpi-icon-box green">
                    <IconCheckSquare size={18} />
                  </div>
                </div>
                <div className="kpi-main-number">
                  4 <span className="kpi-unit-sub">/ 4</span>
                </div>
                <div className="kpi-footer-row">
                  <span className="kpi-growth-positive">0 no conformidades</span>
                  <span className="kpi-sub-dim">PEMEX / CFE 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Paginador de puntos interactivo del carrusel */}
        <div className="rh-carousel-dots" role="tablist" aria-label="Navegación de indicadores">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              className={`carousel-dot ${kpiSlideIndex === idx ? 'active' : ''}`}
              onClick={() => setKpiSlideIndex(idx)}
              aria-label={`Ir a diapositiva ${idx + 1}`}
              title={`Diapositiva ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
          3. AGENDA OPERATIVA & LANZAMIENTOS (Carrusel Estilo Steam)
          ==================================================================== */}
      <section className="rh-agenda-section" aria-label="Agenda Operativa y Lanzamientos">
        <div className="rh-agenda-header-row">
          <div>
            <div className="agenda-title-lockup">
              <span className="agenda-orange-bullet" />
              <h2 className="agenda-main-title">Agenda Operativa Semanal</h2>
              <span className="agenda-badge-count">7 Actividades Pendientes</span>
            </div>
            <p className="agenda-subtext">
              Programación de guardias en campo, relevos operativos, vencimientos normativos y auditorías programadas.
            </p>
          </div>

          <div className="agenda-header-actions-steam">
            {/* Controles del Carrusel Estilo Steam en Cabecera */}
            <div className="steam-carousel-nav-box">
              <button
                type="button"
                className="steam-nav-arrow-btn"
                disabled={agendaSlideIndex === 0}
                onClick={() => setAgendaSlideIndex((prev) => Math.max(0, prev - 1))}
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <IconChevronLeft size={18} />
              </button>

              <div className="steam-progress-track" title={`Página ${agendaSlideIndex + 1} de 3`}>
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`steam-progress-segment ${agendaSlideIndex === idx ? 'active' : ''}`}
                    onClick={() => setAgendaSlideIndex(idx)}
                    aria-label={`Ir a semana ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="steam-nav-arrow-btn"
                disabled={agendaSlideIndex === 2}
                onClick={() => setAgendaSlideIndex((prev) => Math.min(2, prev + 1))}
                title="Semana siguiente"
                aria-label="Semana siguiente"
              >
                <IconChevronRight size={18} />
              </button>

              <span className="steam-slide-range-label">
                {agendaSlideIndex === 0 && 'Semana 1: 25 - 28 Sep'}
                {agendaSlideIndex === 1 && 'Semana 2: 29 Sep - 02 Oct'}
                {agendaSlideIndex === 2 && 'Semana 3: 03 - 06 Oct'}
              </span>
            </div>

            <div className="agenda-actions-group">
              <button
                type="button"
                className="btn-agenda-primary"
                onClick={() => alert('Crear nueva actividad operativa en la agenda')}
              >
                + + Nueva Actividad
              </button>
              <button
                type="button"
                className="btn-agenda-secondary"
                onClick={() => setIsCalendarOpen(true)}
              >
                <IconCalendar size={16} />
                <span>Abrir Calendario Completo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Leyenda de Actividades */}
        <div className="rh-agenda-legend-row">
          <span className="legend-label">LEYENDA:</span>
          <span className="legend-pill pill-blue">
            <span className="legend-dot blue" /> Entrevista
          </span>
          <span className="legend-pill pill-gold">
            <span className="legend-dot gold" /> Revisión Documental
          </span>
          <span className="legend-pill pill-purple">
            <span className="legend-dot purple" /> Junta Directiva / Operativa
          </span>
          <span className="legend-pill pill-red">
            <span className="legend-dot red" /> Vencimiento de Contrato
          </span>
          <span className="legend-pill pill-emerald">
            <span className="legend-dot emerald" /> Inducción / SIL-3
          </span>
          <span className="legend-pill pill-slate">
            <span className="legend-dot slate" /> Auditoría / Inspección
          </span>
        </div>

        {/* Contenedor del Carrusel Estilo Steam con Flechas Flotantes */}
        <div className="steam-carousel-wrapper">
          {/* Flecha Lateral Flotante Izquierda estilo Steam */}
          <button
            type="button"
            className={`steam-paddle-btn paddle-left ${agendaSlideIndex === 0 ? 'disabled' : ''}`}
            disabled={agendaSlideIndex === 0}
            onClick={() => setAgendaSlideIndex((prev) => Math.max(0, prev - 1))}
            aria-label="Página anterior del carrusel"
            title="Semana anterior"
          >
            <IconChevronLeft size={24} />
          </button>

          {/* Viewport del Carrusel */}
          <div className="steam-carousel-viewport">
            <div
              className="steam-carousel-track"
              style={{ transform: `translateX(-${agendaSlideIndex * 100}%)` }}
            >
              {/* ==============================================================
                  SLIDE 1: 25 Sep - 28 Sep (HOY Y FIN DE SEMANA)
                  ============================================================== */}
              <div className="steam-carousel-slide">
                {/* Columna 1: HOY Viernes 25 Sep */}
                <div className="agenda-day-col col-active-today">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-orange">HOY</span>
                      <span className="day-name-bold">Viernes 25 Sep</span>
                    </div>
                    <span className="day-task-count">5 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t1') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t1')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t1') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Inducción PEMEX Tula II</strong>
                        <span className="task-badge badge-urgent">Urgente</span>
                      </div>
                      <p className="task-desc">2 técnicos F&amp;G asignados a cuadrilla</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-sil3">Inducción SIL-3</span>
                        <span className="task-time-label">09:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t2') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t2')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t2') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Junta Coordinación Minatitlán</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Revisión de cuadrillas Base Mapachapa</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-junta">Junta Operativa</span>
                        <span className="task-time-label">14:30 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t3') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t3')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t3') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Entrevista Ing. Mecatrónico</strong>
                        <span className="task-badge badge-pending">Pendiente</span>
                      </div>
                      <p className="task-desc">Candidato: Ing. Miguel Torres</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-interview">Entrevista</span>
                        <span className="task-time-label">16:00 hrs</span>
                      </div>
                    </div>

                    {/* Tareas expandibles */}
                    {expandedFriday && (
                      <>
                        <div
                          className={`agenda-task-card ${completedTaskIds.has('t4') ? 'completed' : ''}`}
                          onClick={() => toggleTaskCompletion('t4')}
                        >
                          <div className="task-top-row">
                            <div className="task-checkbox-ring">
                              {completedTaskIds.has('t4') && <IconCheck size={12} />}
                            </div>
                            <strong className="task-title">Inspección Sensores Gas H2S</strong>
                            <span className="task-badge badge-active">Activo</span>
                          </div>
                          <p className="task-desc">Plataforma Enlace Pemex</p>
                          <div className="task-footer-tags">
                            <span className="task-cat-pill cat-doc">Revisión Doc</span>
                            <span className="task-time-label">17:30 hrs</span>
                          </div>
                        </div>

                        <div
                          className={`agenda-task-card ${completedTaskIds.has('t5') ? 'completed' : ''}`}
                          onClick={() => toggleTaskCompletion('t5')}
                        >
                          <div className="task-top-row">
                            <div className="task-checkbox-ring">
                              {completedTaskIds.has('t5') && <IconCheck size={12} />}
                            </div>
                            <strong className="task-title">Validación Nómina Operativa</strong>
                            <span className="task-badge badge-pending">Pendiente</span>
                          </div>
                          <p className="task-desc">Cierre quincenal de cuadrillas</p>
                          <div className="task-footer-tags">
                            <span className="task-cat-pill cat-junta">Junta Operativa</span>
                            <span className="task-time-label">18:30 hrs</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-ver-mas-tasks"
                    onClick={() => setExpandedFriday(!expandedFriday)}
                  >
                    <span>{expandedFriday ? 'Ver menos ∧' : 'Ver más (+2 actividades) ⌵'}</span>
                  </button>
                </div>

                {/* Columna 2: MAÑANA Sábado 26 Sep */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">MAÑANA</span>
                      <span className="day-name-bold">Sábado 26 Sep</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t6') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t6')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t6') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Guardias de Fin de Semana</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">4 brigadistas asignados a Refinería</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-turno">Turno 24h</span>
                        <span className="task-time-label">08:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t7') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t7')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t7') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Checklist EPP Cuadrilla Sur</strong>
                        <span className="task-badge badge-pending">Pendiente</span>
                      </div>
                      <p className="task-desc">Firma de resguardos contra incendio</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-doc">Revisión Doc</span>
                        <span className="task-time-label">11:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Turno B asignado a guardia</div>
                </div>

                {/* Columna 3: DOMINGO 27 Sep */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">DOMINGO</span>
                      <span className="day-name-bold">27 Sep</span>
                    </div>
                    <span className="day-task-count">1 tarea</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t8') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t8')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t8') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Entrega de Guardias Relevo</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Relevo Comalcalco &amp; Minatitlán</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-junta">Junta Operativa</span>
                        <span className="task-time-label">19:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Personal de Relevo en Base</div>
                </div>

                {/* Columna 4: LUNES 28 Sep */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">LUNES</span>
                      <span className="day-name-bold">28 Sep</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t9') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t9')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t9') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Acreditación SIL-3 Anual</strong>
                        <span className="task-badge badge-urgent">Urgente</span>
                      </div>
                      <p className="task-desc">Auditoría externa TÜV Rheinland en planta</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-sil3">Certificación SIL-3</span>
                        <span className="task-time-label">08:30 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t10') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t10')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t10') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Entrevista Ing. Instrumentista</strong>
                        <span className="task-badge badge-pending">Pendiente</span>
                      </div>
                      <p className="task-desc">Candidata: Mtra. Lucía Fernández</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-interview">Entrevista</span>
                        <span className="task-time-label">15:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Inicio de semana operativa</div>
                </div>
              </div>

              {/* ==============================================================
                  SLIDE 2: 29 Sep - 02 Oct (LANZAMIENTOS Y AUDITORÍAS PROGRAMADAS)
                  ============================================================== */}
              <div className="steam-carousel-slide">
                {/* Columna 5: MARTES 29 Sep */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">MARTES</span>
                      <span className="day-name-bold">Martes 29 Sep</span>
                    </div>
                    <span className="day-task-count">3 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t11') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t11')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t11') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Auditoría STPS Norma-035</strong>
                        <span className="task-badge badge-urgent">Urgente</span>
                      </div>
                      <p className="task-desc">Inspección de factores de riesgo psicosocial</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-doc">Revisión Doc</span>
                        <span className="task-time-label">09:30 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t12') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t12')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t12') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Despliegue SCADA Fire &amp; Gas</strong>
                        <span className="task-badge badge-corp-blue">Programado</span>
                      </div>
                      <p className="task-desc">Activación del sistema centralizado de alarmas</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-corp-blue">SCADA / F&amp;G</span>
                        <span className="task-time-label">12:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t13') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t13')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t13') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Junta Seguridad Cuadrilla Norte</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Evaluación de protocolos de respuesta rápida</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-junta">Junta Operativa</span>
                        <span className="task-time-label">16:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Despliegue operativo en planta</div>
                </div>

                {/* Columna 6: MIÉRCOLES 30 Sep */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">MIÉRCOLES</span>
                      <span className="day-name-bold">Miércoles 30 Sep</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card border-contract ${completedTaskIds.has('t14') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t14')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t14') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Fin Contrato Laura Gómez</strong>
                        <span className="task-badge badge-urgent">Crítico</span>
                      </div>
                      <p className="task-desc">Plataforma Marina Pemex • Trámite de renovación</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-contract">Vencimiento</span>
                        <span className="task-time-label">LÍMITE HOY</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t15') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t15')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t15') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Cierre de Nóminas Quincenales</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Revisión de tiempo extra y bonos de guardia</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-doc">Revisión Doc</span>
                        <span className="task-time-label">17:30 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Cierre contractual y finiquitos</div>
                </div>

                {/* Columna 7: JUEVES 01 Oct */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">JUEVES</span>
                      <span className="day-name-bold">Jueves 01 Oct</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t16') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t16')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t16') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Relevo Programado Guardias Mina</strong>
                        <span className="task-badge badge-active">Guardia</span>
                      </div>
                      <p className="task-desc">Ingreso oficial de la cuadrilla Gamma a campo</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-turno">Turno 24h</span>
                        <span className="task-time-label">08:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t17') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t17')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t17') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Simulacro F&amp;G Cuadrilla Bravo</strong>
                        <span className="task-badge badge-urgent">Urgente</span>
                      </div>
                      <p className="task-desc">Prueba de conatos en quemadores de refinería</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-sil3">Inducción SIL-3</span>
                        <span className="task-time-label">14:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Inicio de rol mensual de guardias</div>
                </div>

                {/* Columna 8: VIERNES 02 Oct */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">VIERNES</span>
                      <span className="day-name-bold">Viernes 02 Oct</span>
                    </div>
                    <span className="day-task-count">3 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t18') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t18')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t18') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Certificación DC-3 Espacios Conf.</strong>
                        <span className="task-badge badge-urgent">Urgente</span>
                      </div>
                      <p className="task-desc">Evaluación para 8 técnicos en base Comalcalco</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-sil3">Certificación SIL-3</span>
                        <span className="task-time-label">09:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t19') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t19')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t19') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Entrevista Coordinador QHSE</strong>
                        <span className="task-badge badge-pending">Pendiente</span>
                      </div>
                      <p className="task-desc">Candidata: Ing. Patricia Salgado</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-interview">Entrevista</span>
                        <span className="task-time-label">12:30 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t20') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t20')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t20') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Evaluación de Desempeño Operativo</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Métricas mensuales de efectividad en respuesta</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-junta">Junta Operativa</span>
                        <span className="task-time-label">16:30 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Cierre semanal de acreditaciones</div>
                </div>
              </div>

              {/* ==============================================================
                  SLIDE 3: 03 Oct - 06 Oct (SIGUIENTE PROGRAMACIÓN MENSUAL)
                  ============================================================== */}
              <div className="steam-carousel-slide">
                {/* Columna 9: SÁBADO 03 Oct */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">SÁBADO</span>
                      <span className="day-name-bold">Sábado 03 Oct</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t21') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t21')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t21') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Calibración Sensores H2S</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Base Mapachapa • Mantenimiento preventivo</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-doc">Revisión Doc</span>
                        <span className="task-time-label">09:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t22') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t22')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t22') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Mantenimiento Red F&amp;G Scada</strong>
                        <span className="task-badge badge-pending">Pendiente</span>
                      </div>
                      <p className="task-desc">Supervisión de enlaces de fibra óptica</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-turno">Turno 24h</span>
                        <span className="task-time-label">15:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Guardia de telecomunicaciones</div>
                </div>

                {/* Columna 10: DOMINGO 04 Oct */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">DOMINGO</span>
                      <span className="day-name-bold">Domingo 04 Oct</span>
                    </div>
                    <span className="day-task-count">1 tarea</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t23') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t23')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t23') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Relevo Dominical de Plataforma</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Traslado aéreo de brigada sur desde Dos Bocas</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-junta">Junta Operativa</span>
                        <span className="task-time-label">19:30 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Vuelo logístico programado</div>
                </div>

                {/* Columna 11: LUNES 05 Oct */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">LUNES</span>
                      <span className="day-name-bold">Lunes 05 Oct</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t24') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t24')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t24') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Examen Médico Periódico Cuadrilla B</strong>
                        <span className="task-badge badge-pending">Pendiente</span>
                      </div>
                      <p className="task-desc">Clínica ocupacional Minatitlán</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-doc">Revisión Doc</span>
                        <span className="task-time-label">08:30 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t25') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t25')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t25') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Programa Acreditación SIL-3 F2</strong>
                        <span className="task-badge badge-corp-blue">Capacitación</span>
                      </div>
                      <p className="task-desc">Nuevo programa de certificación técnica para contratistas</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-sil3">Certificación SIL-3</span>
                        <span className="task-time-label">11:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Nueva fase normativa SIL-3</div>
                </div>

                {/* Columna 12: MARTES 06 Oct */}
                <div className="agenda-day-col">
                  <div className="day-col-header">
                    <div className="header-day-info">
                      <span className="day-pill-gray">MARTES</span>
                      <span className="day-name-bold">Martes 06 Oct</span>
                    </div>
                    <span className="day-task-count">2 tareas</span>
                  </div>

                  <div className="day-col-cards-list">
                    <div
                      className={`agenda-task-card border-contract ${completedTaskIds.has('t26') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t26')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t26') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Renovación Seguro Colectivo</strong>
                        <span className="task-badge badge-urgent">Crítico</span>
                      </div>
                      <p className="task-desc">Vencimiento de póliza brigadistas de alto riesgo</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-contract">Vencimiento</span>
                        <span className="task-time-label">13:00 hrs</span>
                      </div>
                    </div>

                    <div
                      className={`agenda-task-card ${completedTaskIds.has('t27') ? 'completed' : ''}`}
                      onClick={() => toggleTaskCompletion('t27')}
                    >
                      <div className="task-top-row">
                        <div className="task-checkbox-ring">
                          {completedTaskIds.has('t27') && <IconCheck size={12} />}
                        </div>
                        <strong className="task-title">Entrega de Reporte Trimestral Pemex</strong>
                        <span className="task-badge badge-active">Activo</span>
                      </div>
                      <p className="task-desc">Informe ejecutivo de paros no programados</p>
                      <div className="task-footer-tags">
                        <span className="task-cat-pill cat-doc">Revisión Doc</span>
                        <span className="task-time-label">17:00 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="day-col-footer-note">Cumplimiento regulatorio Pemex</div>
                </div>
              </div>
            </div>
          </div>

          {/* Flecha Lateral Flotante Derecha estilo Steam */}
          <button
            type="button"
            className={`steam-paddle-btn paddle-right ${agendaSlideIndex === 2 ? 'disabled' : ''}`}
            disabled={agendaSlideIndex === 2}
            onClick={() => setAgendaSlideIndex((prev) => Math.min(2, prev + 1))}
            aria-label="Página siguiente del carrusel"
            title="Semana siguiente"
          >
            <IconChevronRight size={24} />
          </button>
        </div>

        {/* Barra de pestañas inferiores de acceso rápido */}
        <div className="steam-carousel-bottom-bar">
          <div className="steam-bottom-indicators">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                className={`steam-bottom-tab ${agendaSlideIndex === idx ? 'active' : ''}`}
                onClick={() => setAgendaSlideIndex(idx)}
              >
                <span className="bottom-tab-dot" />
                <span className="bottom-tab-title">
                  {idx === 0 && 'Semana 1 (25 - 28 Sep)'}
                  {idx === 1 && 'Semana 2 (29 Sep - 02 Oct)'}
                  {idx === 2 && 'Semana 3 (03 - 06 Oct)'}
                </span>
                <span className="bottom-tab-badge">
                  {idx === 0 ? 'Actual' : idx === 1 ? 'Próxima' : 'Planeada'}
                </span>
              </button>
            ))}
          </div>
          <span className="steam-carousel-hint">
            Navega entre semanas usando las flechas laterales &lt; &gt; o los botones de semana
          </span>
        </div>
      </section>

      {/* ====================================================================
          4. TABLA DE COLABORADORES
          ==================================================================== */}
      <section className="rh-collaborators-section" aria-label="Colaboradores">
        <div className="rh-table-header-row">
          <div>
            <div className="table-title-lockup">
              <h2 className="table-main-title">Colaboradores</h2>
              <span className="table-badge-totals">128 Totales</span>
            </div>
            <p className="table-subtext">
              Control de acreditaciones SIL-3/DC-3, puestos y vigencia contractual.
            </p>
          </div>

          <div className="table-top-actions">
            {/* Depto Selector */}
            <div className="depto-selector-box">
              <span className="depto-label">Depto:</span>
              <select
                className="depto-select"
                value={activeDepto}
                onChange={(e) => setActiveDepto(e.target.value)}
              >
                <option value="Todos los Deptos">Todos los Deptos</option>
                <option value="Seguridad & F&G">Seguridad &amp; F&amp;G</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Mantenimiento SCADA">Mantenimiento SCADA</option>
                <option value="Nóminas & RH">Nóminas &amp; RH</option>
              </select>
            </div>

            {/* Pestañas de Filtro de Sede */}
            <div className="sede-tabs-group">
              {['Todos', 'Minatitlán', 'Comalcalco', 'Mapachapa'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`sede-tab-btn ${activeSedeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveSedeTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Botón Alta de Colaborador */}
            <button
              type="button"
              className="btn-alta-colaborador"
              onClick={() => alert('Abrir formulario para dar de alta a un nuevo colaborador')}
            >
              + + Alta de Colaborador
            </button>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="rh-table-responsive-wrapper">
          <table className="rh-custom-table">
            <thead>
              <tr>
                <th>COLABORADOR</th>
                <th>PUESTO &amp; ESPECIALIDAD</th>
                <th>SEDE &amp; CUADRILLA</th>
                <th>ESTATUS SIL-3 / DC-3</th>
                <th>INGRESO</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredColaboradores.map((colab) => (
                <tr key={colab.id}>
                  {/* Colaborador */}
                  <td>
                    <div className="colab-avatar-cell">
                      <div
                        className="colab-avatar-bubble"
                        style={{ backgroundColor: colab.avatarColor }}
                      >
                        {colab.initials}
                      </div>
                      <div className="colab-names-block">
                        <strong className="colab-name">{colab.name}</strong>
                        <span className="colab-email">{colab.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Puesto & Especialidad */}
                  <td>
                    <div className="colab-position-block">
                      <strong className="colab-position">{colab.position}</strong>
                      <span className="colab-specialty">{colab.specialty}</span>
                    </div>
                  </td>

                  {/* Sede & Cuadrilla */}
                  <td>
                    <div className="colab-location-block">
                      <span className="colab-sede-highlight">{colab.sede}</span>
                      <span className="colab-cuadrilla">{colab.cuadrilla}</span>
                    </div>
                  </td>

                  {/* Estatus SIL-3 / DC-3 */}
                  <td>
                    <span className={`colab-status-badge ${colab.statusType}`}>
                      <span className="status-dot-mini" />
                      {colab.statusText}
                    </span>
                  </td>

                  {/* Ingreso */}
                  <td>
                    <span className="colab-date-text">{colab.fechaIngreso}</span>
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className="colab-actions-cluster">
                      <button
                        type="button"
                        className="btn-action-icon"
                        title="Ver detalle del colaborador"
                        aria-label="Ver detalle"
                        onClick={() => alert(`Visualizando expediente de ${colab.name}`)}
                      >
                        <IconEye size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon"
                        title="Editar expediente"
                        aria-label="Editar colaborador"
                        onClick={() => alert(`Editando datos de ${colab.name}`)}
                      >
                        <IconEdit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="rh-table-pagination-row">
          <span className="pagination-info-text">
            Mostrando 1 - {filteredColaboradores.length} de 128 colaboradores
          </span>

          <div className="pagination-controls">
            <button
              type="button"
              className="page-nav-arrow"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <IconChevronLeft size={16} />
            </button>

            <button
              type="button"
              className={`page-num-btn ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button
              type="button"
              className={`page-num-btn ${currentPage === 2 ? 'active' : ''}`}
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button
              type="button"
              className={`page-num-btn ${currentPage === 3 ? 'active' : ''}`}
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <span className="page-ellipsis">...</span>
            <button
              type="button"
              className={`page-num-btn ${currentPage === 13 ? 'active' : ''}`}
              onClick={() => setCurrentPage(13)}
            >
              13
            </button>

            <button
              type="button"
              className="page-nav-arrow"
              onClick={() => setCurrentPage((p) => Math.min(13, p + 1))}
              aria-label="Página siguiente"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. MODAL DE CALENDARIO GENERAL (Ventana emergente)
          ==================================================================== */}
      <CalendarModalRH
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
};

export default HomeRH;
