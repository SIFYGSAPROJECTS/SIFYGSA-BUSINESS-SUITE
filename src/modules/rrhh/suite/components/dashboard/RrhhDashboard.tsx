import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  CalendarDays,
  CheckCircle2,
  Eye,
  Edit2,
  CheckSquare,
  Square
} from 'lucide-react';
import { KpiMetric, AgendaDay, Employee } from '../../types';
import { DEPARTMENTS, INITIAL_DEPARTMENTS } from '../../data/mockData';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { EmployeeEditModal } from './EmployeeEditModal';
import { CalendarModal } from './CalendarModal';
import { HrAuditLogModal } from './HrAuditLogModal';
import {
  useSyncedEmployees,
  useSyncedDepartments,
  savePersistedEmployees
} from '../../utils/formShield';

interface RrhhDashboardProps {
  kpis: KpiMetric[];
  agendaDays: AgendaDay[];
  employees: Employee[];
  selectedLocation: string;
  departments?: string[];
  onOpenNewEmployee: () => void;
  onNavigateToBirthdays?: () => void;
}

const KPI_ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck
};

// Categorías de filtro disponibles para la agenda
const AGENDA_FILTERS = [
  { id: 'entrevista', label: 'Entrevistas' },
  { id: 'capacitación', label: 'Capacitación' },
  { id: 'expedientes', label: 'Expedientes' },
  { id: 'nómina', label: 'Nómina' },
  { id: 'junta', label: 'Juntas' }
];

export const RrhhDashboard: React.FC<RrhhDashboardProps> = ({
  kpis,
  agendaDays: initialDays,
  employees,
  selectedLocation,
  departments,
  onOpenNewEmployee,
  onNavigateToBirthdays
}) => {
  const syncedDepartments = useSyncedDepartments(INITIAL_DEPARTMENTS);
  const availableDepartments =
    syncedDepartments.length > 0
      ? syncedDepartments.map((d) => d.name)
      : departments || DEPARTMENTS;

  // 1. Estado para el carrusel de la agenda
  const carouselRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState<AgendaDay[]>(initialDays);

  // 2. Filtros multi-selección para la agenda
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // 3. Estados para Modales Interactivos sincronizados con JSON en tiempo real
  const employeeList = useSyncedEmployees(employees);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [selectedEmployeeEdit, setSelectedEmployeeEdit] = useState<Employee | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const handleSaveEmployee = (updated: Employee) => {
    const nextList = employeeList.map((emp) => (emp.id === updated.id ? updated : emp));
    savePersistedEmployees(nextList);
  };

  // KPIs reactivos: suma automáticamente los nuevos colaboradores dados de alta
  const extraEmployeesCount = Math.max(0, employeeList.length - employees.length);
  const reactiveKpis = kpis.map((kpi) => {
    if (kpi.id === 'plantilla') {
      const baseVal = parseInt(kpi.value, 10) || 84;
      return {
        ...kpi,
        value: String(baseVal + extraEmployeesCount),
        trend: extraEmployeesCount > 0 ? `+${extraEmployeesCount} alta(s) reciente(s)` : kpi.trend
      };
    }
    return kpi;
  });

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((id) => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Alternar checkbox de tarea realizada
  const toggleTaskDone = (dayId: string, taskId: string) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          tasks: day.tasks.map((task) =>
            task.id === taskId ? { ...task, isDone: !task.isDone } : task
          )
        };
      })
    );
  };

  // 4. Filtros de tabla colaboradores
  const [selectedDepto, setSelectedDepto] = useState<string>('todos');
  const [isDeptoDropdownOpen, setIsDeptoDropdownOpen] = useState<boolean>(false);
  const deptoDropdownRef = useRef<HTMLDivElement>(null);
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>(selectedLocation || 'Todas');

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptoDropdownRef.current && !deptoDropdownRef.current.contains(event.target as Node)) {
        setIsDeptoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar automáticamente la ubicación por defecto con la seleccionada en la cabecera
  useEffect(() => {
    if (selectedLocation) {
      setActiveLocationFilter(selectedLocation);
    }
  }, [selectedLocation]);

  // Filtrado de colaboradores
  const filteredEmployees = employeeList.filter((emp) => {
    const matchesDepto =
      selectedDepto === 'todos' || emp.department.toLowerCase() === selectedDepto.toLowerCase();
    const matchesLoc =
      activeLocationFilter === 'Todas' || emp.location.toLowerCase().includes(activeLocationFilter.toLowerCase());
    return matchesDepto && matchesLoc;
  });

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO DE PÁGINA */}
      {/* ========================================================================= */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Recursos Humanos</h1>
          <p className="page-subtitle">
            Gestión y control de colaboradores, actividades y asignación operativa.
          </p>
        </div>

        <div className="page-header-actions">
          {/* Botón Bitácora Exclusiva Gerente RRHH */}
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'var(--brand-200)',
              color: 'var(--primary)',
              fontWeight: 700
            }}
            title="Bitácora de Auditoría exclusiva para Gerencia de Recursos Humanos"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Bitácora Gerencia</span>
          </button>

          {/* Botón Calendario General */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarDays className="w-4 h-4 text-muted" />
            <span>Calendario</span>
          </button>

          {/* Botón Principal de Alta de Empleado */}
          <button
            type="button"
            onClick={onOpenNewEmployee}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus className="w-4 h-4" />
            <span>Alta de Empleado</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RESUMEN GENERAL DE PERSONAL (KPIS) */}
      {/* ========================================================================= */}
      <div className="section-meta-header">
        <div className="section-label-group">
          <span>Resumen General de Personal</span>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        {reactiveKpis.map((kpi) => {
          const IconComp = KPI_ICON_MAP[kpi.iconName] || Users;

          return (
            <div
              key={kpi.id}
              className="card card-hoverable kpi-card"
              onClick={() => {
                if (kpi.id === 'cumpleanos' && onNavigateToBirthdays) {
                  onNavigateToBirthdays();
                }
              }}
              style={{
                cursor: kpi.id === 'cumpleanos' ? 'pointer' : 'default',
                transition: 'all var(--transition-fast)'
              }}
              title={kpi.id === 'cumpleanos' ? 'Ver Mural de Cumpleaños SIFYGSA' : undefined}
            >
              <div className="kpi-top-row">
                <span className="kpi-title">{kpi.title}</span>
                <div
                  className="kpi-icon-box"
                  style={{
                    backgroundColor: kpi.iconBg,
                    color: kpi.iconColor
                  }}
                >
                  <IconComp className="w-4 h-4" />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-main-number">{kpi.value}</span>
                {kpi.fraction && <span className="kpi-sub-fraction">{kpi.fraction}</span>}
              </div>

              <div className="kpi-footer-row">
                <span
                  style={{
                    color:
                      kpi.trendType === 'positive'
                        ? 'var(--success)'
                        : kpi.trendType === 'urgent'
                        ? 'var(--danger)'
                        : 'var(--text-secondary)'
                  }}
                >
                  {kpi.trend}
                </span>
                <span
                  style={{
                    color: kpi.id === 'cumpleanos' ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: kpi.id === 'cumpleanos' ? 700 : 500
                  }}
                >
                  {kpi.id === 'cumpleanos' ? 'Ver Mural ➔' : kpi.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. AGENDA SEMANAL DE ACTIVIDADES (CARRUSEL) */}
      {/* ========================================================================= */}
      <div className="card agenda-section">
        <div className="agenda-header">
          <div>
            <div className="agenda-title-box">
              <span className="agenda-bullet" />
              <h2 className="agenda-title">Agenda Semanal</h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Actividades y guardias programadas de la semana
            </p>
          </div>

          <div className="agenda-toolbar-actions">
            {/* Botones de Navegación del Carrusel de Días */}
            <div className="agenda-nav-buttons">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="btn-icon"
                style={{ width: '30px', height: '30px' }}
                title="Días Anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="btn-icon"
                style={{ width: '30px', height: '30px' }}
                title="Siguientes Días"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Único botón de acción de la agenda */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Actividad</span>
            </button>
          </div>
        </div>

        {/* Fila de Filtros Rápidos (Multi-selección) */}
        <div className="agenda-filter-row">
          <div className="agenda-filter-chips">
            <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
              FILTRO:
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className={`filter-chip ${selectedFilters.length === 0 ? 'active' : ''}`}
            >
              • Todas
            </button>
            {AGENDA_FILTERS.map((filter) => {
              const isSelected = selectedFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => toggleFilter(filter.id)}
                  className={`filter-chip ${isSelected ? 'active' : ''}`}
                >
                  • {filter.label}
                </button>
              );
            })}
          </div>

          {selectedFilters.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
              {selectedFilters.length} {selectedFilters.length === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
        </div>

        {/* Carrusel Desplazable de Días */}
        <div className="agenda-days-carousel-container">
          <div className="agenda-days-carousel" ref={carouselRef}>
            {days.map((day) => {
              // Filtrar tareas del día si hay filtros activos
              const visibleTasks = day.tasks.filter((task) => {
                if (selectedFilters.length === 0) return true;
                return selectedFilters.some((f) => {
                  const cat = (task.category || '').toLowerCase();
                  const title = (task.title || '').toLowerCase();
                  return cat.includes(f) || title.includes(f);
                });
              });

              return (
                <div
                  key={day.id}
                  className={`day-column-card ${day.isToday ? 'is-today' : ''}`}
                >
                  <div>
                    <div className="day-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {day.badgeLabel === 'HOY' ? (
                          <span className="day-badge-today">HOY</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
                            {day.badgeLabel}
                          </span>
                        )}
                        <span>{day.dayName}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {visibleTasks.length} {visibleTasks.length === 1 ? 'actividad' : 'actividades'}
                      </span>
                    </div>

                    <div className="day-tasks-stack">
                      {visibleTasks.length === 0 ? (
                        <div
                          style={{
                            padding: '16px 8px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '11.5px',
                            fontStyle: 'italic'
                          }}
                        >
                          Sin actividades para el filtro seleccionado
                        </div>
                      ) : (
                        visibleTasks.map((task) => {
                          const taskTintClass =
                            task.status === 'Urgente'
                              ? 'task-urgent'
                              : task.status === 'Activo'
                              ? 'task-active'
                              : task.status === 'Pendiente'
                              ? 'task-pending'
                              : 'task-success';

                          const badgeClass =
                            task.status === 'Urgente'
                              ? 'badge-danger'
                              : task.status === 'Activo'
                              ? 'badge-primary'
                              : 'badge-warning';

                          return (
                            <div
                              key={task.id}
                              className={`day-task-item ${taskTintClass}`}
                              style={{
                                opacity: task.isDone ? 0.5 : 1
                              }}
                            >
                              <div className="task-top">
                                <div
                                  className="task-checkbox-title"
                                  onClick={() => toggleTaskDone(day.id, task.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {task.isDone ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-muted" />
                                  )}
                                  <span
                                    style={{
                                      textDecoration: task.isDone ? 'line-through' : 'none'
                                    }}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                <span className={`badge ${badgeClass}`} style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                                  {task.status}
                                </span>
                              </div>

                              <div className="task-details">
                                <span>{task.details}</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                                  {task.time}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {day.footerNote && (
                    <div className="day-card-footer">
                      <span>{day.footerNote}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA DE COLABORADORES */}
      {/* ========================================================================= */}
      <div className="card table-section">
        <div className="table-header-toolbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Colaboradores
              </h3>
              <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                {filteredEmployees.length} de {employees.length}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Directorio de personal, especialidad y estado de acreditaciones técnicas
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Custom Dropdown Depto */}
            <div style={{ position: 'relative' }} ref={deptoDropdownRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Depto:</span>
                <button
                  type="button"
                  onClick={() => setIsDeptoDropdownOpen(!isDeptoDropdownOpen)}
                  className="custom-dropdown-trigger select-control"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '6px 12px',
                    height: '36px',
                    minWidth: '190px',
                    cursor: 'pointer'
                  }}
                  title="Filtrar por Departamento"
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {selectedDepto === 'todos' ? 'Todos los Deptos' : selectedDepto}
                  </span>
                  <ChevronDown
                    className="w-3.5 h-3.5 text-muted"
                    style={{
                      transform: isDeptoDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--transition-fast)',
                      flexShrink: 0
                    }}
                  />
                </button>
              </div>

              {/* Menú Flotante con Scroll Limitado para n departamentos */}
              {isDeptoDropdownOpen && (
                <div
                  className="custom-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: '50px',
                    zIndex: 50,
                    minWidth: '220px',
                    maxWidth: '260px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '4px'
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedDepto('todos');
                      setIsDeptoDropdownOpen(false);
                    }}
                    className={`dropdown-item ${selectedDepto === 'todos' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: selectedDepto === 'todos' ? 700 : 500,
                      color: selectedDepto === 'todos' ? 'var(--primary)' : 'var(--text-primary)',
                      backgroundColor: selectedDepto === 'todos' ? 'var(--brand-50)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Todos los Deptos</span>
                    {selectedDepto === 'todos' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                  {availableDepartments.map((dept) => {
                    const isSelected = selectedDepto === dept;
                    return (
                      <div
                        key={dept}
                        onClick={() => {
                          setSelectedDepto(dept);
                          setIsDeptoDropdownOpen(false);
                        }}
                        className={`dropdown-item ${isSelected ? 'active' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          backgroundColor: isSelected ? 'var(--brand-50)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dept}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ubicaciones Pills (Con preselección de la ubicación activa) */}
            <div className="filter-tabs-group">
              {['Todas', 'Minatitlán, Ver.', 'Comalcalco, Tab.', 'Xalapa, Ver.', 'Mapachapa, Ver.'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setActiveLocationFilter(loc)}
                  className={`filter-tab-pill ${activeLocationFilter === loc ? 'active' : ''}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table (con scroll vertical y vista fija de 5 filas) */}
        <div className="data-table-wrapper">
          <table className="corporate-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Puesto &amp; Especialidad</th>
                <th>Ubicación / Sucursal</th>
                <th>Acreditación Técnica</th>
                <th>Ingreso</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No se encontraron colaboradores en esta sucursal o departamento.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="colaborador-cell">
                        <div
                          className="colaborador-avatar"
                          style={{ backgroundColor: emp.avatarBg }}
                        >
                          {emp.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{emp.position}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {emp.department}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {emp.location}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {emp.squad}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          emp.silStatusType === 'success'
                            ? 'badge-success'
                            : emp.silStatusType === 'warning'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {emp.silStatus}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {emp.hireDate}
                    </td>

                    <td>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Ver Expediente"
                          onClick={() => setSelectedEmployeeDetail(emp)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Editar Registro"
                          onClick={() => setSelectedEmployeeEdit(emp)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALES INTERACTIVOS (EXPEDIENTE, EDICIÓN Y CALENDARIO) */}
      {/* ========================================================================= */}
      <EmployeeDetailModal
        employee={selectedEmployeeDetail}
        onClose={() => setSelectedEmployeeDetail(null)}
        onEdit={(emp) => setSelectedEmployeeEdit(emp)}
      />

      <EmployeeEditModal
        employee={selectedEmployeeEdit}
        onClose={() => setSelectedEmployeeEdit(null)}
        onSave={handleSaveEmployee}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedLocation={selectedLocation}
      />

      <HrAuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};


