'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Square,
  Search,
  ArrowUpRight,
  X
} from 'lucide-react';
import { KpiMetric, AgendaDay, AgendaTask, Employee } from '../../types';
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
  onNavigateSubmenu?: (submenuId: string, title: string) => void;
}

interface KpiPreviewRow {
  name: string;
  meta: string;
  tone?: 'danger' | 'warning' | 'info' | 'neutral';
  employeeId?: string;
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

const AGENDA_STORAGE_KEY = 'sifygsa_rrhh_agenda_days_v1';

// Si un indicador tiene menos de 10 elementos, se muestra su micro-lista de nombres y fechas/estados.
// Si tiene 10 o más, solo se muestra el resumen numérico para no saturar visualmente.
const MAX_KPI_LIST_THRESHOLD = 9;

const KPI_PREVIEW_ITEMS: Record<string, KpiPreviewRow[]> = {
  eventuales: [
    { name: 'Alan Montiel', meta: 'Evaluación', tone: 'warning', employeeId: 'EMP-007' },
    { name: 'Alejandra Sujías', meta: 'Evaluación', tone: 'warning', employeeId: 'EMP-009' },
    { name: 'Roberto Méndez', meta: 'Evaluación', tone: 'warning', employeeId: 'EMP-006' },
    { name: 'Carlos Hernández', meta: 'Campo', tone: 'neutral', employeeId: 'EMP-005' },
    { name: 'Luis A. Gómez', meta: 'Obra', tone: 'neutral' },
    { name: 'Sofía Torres', meta: 'Apoyo', tone: 'neutral' }
  ],
  cumpleanos: [
    { name: 'Aurelio Palacios', meta: '03 Nov', tone: 'neutral', employeeId: 'EMP-002' },
    { name: 'Sofía Morales', meta: '12 Nov', tone: 'neutral', employeeId: 'EMP-004' },
    { name: 'Carlos Hernández', meta: '18 Nov', tone: 'info', employeeId: 'EMP-005' },
    { name: 'Roberto Méndez', meta: '22 Nov', tone: 'info', employeeId: 'EMP-006' },
    { name: 'Mariana Valdez', meta: '29 Nov', tone: 'info', employeeId: 'EMP-011' }
  ],
  'contratos-vencer': [
    { name: 'Alejandra Sujías', meta: '12 días', tone: 'danger', employeeId: 'EMP-009' },
    { name: 'Alan Montiel', meta: '18 días', tone: 'danger', employeeId: 'EMP-007' },
    { name: 'Roberto Méndez', meta: '24 días', tone: 'warning', employeeId: 'EMP-006' },
    { name: 'Carlos Hernández', meta: '28 días', tone: 'warning', employeeId: 'EMP-005' },
    { name: 'Mariana Valdez', meta: '30 días', tone: 'neutral', employeeId: 'EMP-011' }
  ]
};

export const RrhhDashboard: React.FC<RrhhDashboardProps> = ({
  kpis,
  agendaDays: initialDays,
  employees,
  selectedLocation,
  departments,
  onOpenNewEmployee,
  onNavigateToBirthdays,
  onNavigateSubmenu
}) => {
  const syncedDepartments = useSyncedDepartments(INITIAL_DEPARTMENTS);
  const availableDepartments = useMemo(() => {
    const names =
      syncedDepartments.length > 0
        ? syncedDepartments.filter((d) => d.status === 'active').map((d) => d.name)
        : departments || DEPARTMENTS;
    return Array.from(new Set(names));
  }, [syncedDepartments, departments]);

  // 1. Estado para el carrusel de la agenda (persistente en localStorage)
  const carouselRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState<AgendaDay[]>(() => {
    try {
      const raw = window.localStorage.getItem(AGENDA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialDays;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(days));
    } catch {
      // ignore
    }
  }, [days]);

  // Estado para formulario rápido "+ Nueva Actividad" en la Agenda
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [newTaskDayId, setNewTaskDayId] = useState<string>(initialDays[0]?.id || 'dia-1');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskCategory, setNewTaskCategory] = useState<AgendaTask['category']>('Junta');
  const [newTaskStatus, setNewTaskStatus] = useState<AgendaTask['status']>('Activo');
  const [newTaskDetails, setNewTaskDetails] = useState<string>('');
  const [newTaskTime, setNewTaskTime] = useState<string>('10:00 hrs');

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

  // KPIs reactivos: suma automáticamente los nuevos colaboradores y sincroniza el conteo de cumpleaños
  const extraEmployeesCount = Math.max(0, employeeList.length - employees.length);
  const reactiveKpis = kpis.map((kpi) => {
    if (kpi.id === 'total-empleados' || kpi.id === 'plantilla') {
      const baseVal = parseInt(kpi.value, 10) || 128;
      return {
        ...kpi,
        value: String(baseVal + extraEmployeesCount),
        trend: extraEmployeesCount > 0 ? `↗ +${extraEmployeesCount} nuevo(s)` : kpi.trend
      };
    }
    if (kpi.id === 'cumpleanos') {
      return {
        ...kpi,
        value: String(KPI_PREVIEW_ITEMS.cumpleanos.length),
        trend: 'Noviembre'
      };
    }
    return kpi;
  });

  // Estadísticas de tareas de la agenda semanal
  const agendaStats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const d of days) {
      for (const t of d.tasks) {
        total += 1;
        if (t.isDone) done += 1;
      }
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [days]);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
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

  const handleAddAgendaTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim().length < 2) return;
    const newTask: AgendaTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      details: newTaskDetails.trim() || selectedLocation || 'Minatitlán, Ver.',
      category: newTaskCategory,
      time: newTaskTime.trim() || '10:00 hrs',
      isDone: false
    };
    setDays((prev) =>
      prev.map((d) => (d.id === newTaskDayId ? { ...d, tasks: [newTask, ...d.tasks] } : d))
    );
    setNewTaskTitle('');
    setNewTaskDetails('');
    setIsAddingTask(false);
  };

  // 4. Filtros de tabla colaboradores (Minatitlán, Ver. visible por defecto)
  const [selectedDepto, setSelectedDepto] = useState<string>('todos');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState<string>('');
  const [isDeptoDropdownOpen, setIsDeptoDropdownOpen] = useState<boolean>(false);
  const deptoDropdownRef = useRef<HTMLDivElement>(null);
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>('Minatitlán, Ver.');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptoDropdownRef.current && !deptoDropdownRef.current.contains(event.target as Node)) {
        setIsDeptoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar ubicación si el usuario cambia la sede en el header corporativo
  useEffect(() => {
    if (selectedLocation) {
      setActiveLocationFilter(selectedLocation);
    }
  }, [selectedLocation]);

  // Filtrado de colaboradores
  const filteredEmployees = useMemo(() => {
    const q = searchEmployeeQuery.trim().toLowerCase();
    return employeeList.filter((emp) => {
      const matchesDepto =
        selectedDepto === 'todos' || emp.department.toLowerCase() === selectedDepto.toLowerCase();
      const matchesLoc =
        activeLocationFilter === 'Todas' ||
        emp.location.toLowerCase().includes(activeLocationFilter.split(',')[0].toLowerCase());
      const matchesQuery =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q);
      return matchesDepto && matchesLoc && matchesQuery;
    });
  }, [employeeList, selectedDepto, activeLocationFilter, searchEmployeeQuery]);

  const handleKpiClick = (kpiId: string) => {
    if (kpiId === 'cumpleanos') {
      if (onNavigateToBirthdays) onNavigateToBirthdays();
      else onNavigateSubmenu?.('rrhh-cumpleanos', 'Cumpleaños');
    } else if (kpiId === 'total-empleados' || kpiId === 'eventuales') {
      onNavigateSubmenu?.('rrhh-catalogos', 'Directorio de Personal');
    } else if (kpiId === 'contratos-vencer' || kpiId === 'acreditados-sil') {
      onNavigateSubmenu?.('rrhh-formatos', 'Formatos SGI');
    }
  };

  const handleOpenPreviewEmployee = (e: React.MouseEvent, employeeId?: string) => {
    if (!employeeId) return;
    const found = employeeList.find((emp) => emp.id === employeeId);
    if (found) {
      e.stopPropagation();
      setSelectedEmployeeDetail(found);
    }
  };

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO EJECUTIVO DE RECURSOS HUMANOS                               */}
      {/* ========================================================================= */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Recursos Humanos <span style={{ margin: '0 4px' }}>/</span>{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Menú Principal</strong>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 9px',
                borderRadius: '999px',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success-text)',
                border: '1px solid var(--success-border)'
              }}
            >
              <span className="status-badge-dot" style={{ margin: 0, width: '6px', height: '6px' }} />
              SGI Activo · {selectedLocation || 'Minatitlán, Ver.'}
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Recursos Humanos
          </h1>
          <p className="page-subtitle">
            Control de plantilla, programación semanal y directorio operativo.
          </p>
        </div>

        <div className="page-header-actions" style={{ flexWrap: 'wrap' }}>
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <CalendarDays className="w-4 h-4 text-muted" />
            <span>Calendario</span>
          </button>

          {/* Botón Principal de Registro del Personal */}
          <button
            type="button"
            onClick={onOpenNewEmployee}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Registro del Personal</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INDICADORES CLAVE CON MICRO-RESUMEN (LISTA COMPACTA CUANDO < 10)       */}
      {/* ========================================================================= */}
      <div className="section-meta-header">
        <div className="section-label-group">
          <span>Resumen General de Personal</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Haz clic en un colaborador o indicador para ver el detalle
        </span>
      </div>

      <div className="kpi-grid" style={{ alignItems: 'stretch' }}>
        {reactiveKpis.map((kpi) => {
          const IconComp = KPI_ICON_MAP[kpi.iconName] || Users;
          const numericVal = parseInt(kpi.value, 10) || 0;
          const previewList = KPI_PREVIEW_ITEMS[kpi.id] || [];
          const showCompactList = previewList.length > 0 && numericVal <= MAX_KPI_LIST_THRESHOLD;

          const accentColor =
            kpi.id === 'total-empleados'
              ? 'var(--primary)'
              : kpi.id === 'eventuales'
              ? 'var(--warning)'
              : kpi.id === 'cumpleanos'
              ? 'var(--info)'
              : kpi.id === 'contratos-vencer'
              ? 'var(--danger)'
              : 'var(--success)';

          return (
            <div
              key={kpi.id}
              className="card card-hoverable kpi-card"
              onClick={() => handleKpiClick(kpi.id)}
              style={{
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                borderTop: `3.5px solid ${accentColor}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
              title={`Abrir módulo de ${kpi.title}`}
            >
              <div>
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

                <div className="kpi-value-row" style={{ marginBottom: '6px' }}>
                  <span className="kpi-main-number">{kpi.value}</span>
                  {kpi.fraction && <span className="kpi-sub-fraction">{kpi.fraction}</span>}
                </div>

                {/* Micro-resumen en lista compacta solo cuando el total es < 10 */}
                {showCompactList ? (
                  <div
                    style={{
                      borderTop: '1px dashed var(--border-subtle)',
                      paddingTop: '7px',
                      marginTop: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '112px',
                      overflowY: 'auto',
                      paddingRight: '2px'
                    }}
                  >
                    {previewList.map((row, idx) => (
                      <div
                        key={`${kpi.id}-${idx}`}
                        onClick={(e) => handleOpenPreviewEmployee(e, row.employeeId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          fontSize: '11px',
                          lineHeight: 1.25,
                          padding: '2px 4px',
                          borderRadius: '5px',
                          backgroundColor: idx % 2 === 0 ? 'var(--surface-alt)' : 'transparent',
                          cursor: row.employeeId ? 'pointer' : 'default'
                        }}
                        title={row.employeeId ? `Ver expediente de ${row.name}` : row.name}
                      >
                        <span
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {row.name}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            flexShrink: 0,
                            color:
                              row.tone === 'danger'
                                ? 'var(--danger)'
                                : row.tone === 'warning'
                                ? 'var(--warning)'
                                : row.tone === 'info'
                                ? 'var(--primary)'
                                : 'var(--text-muted)'
                          }}
                        >
                          {row.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Resumen visual compacto para indicadores con >= 10 registros */
                  <div
                    style={{
                      borderTop: '1px dashed var(--border-subtle)',
                      paddingTop: '8px',
                      marginTop: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '5px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--surface-alt)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div
                        style={{
                          width: kpi.id === 'acreditados-sil' ? '72%' : '88%',
                          height: '100%',
                          backgroundColor: accentColor,
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <span>{kpi.id === 'acreditados-sil' ? 'SIL-3: 28 · DC-3: 14' : 'Mina · Comalcalco · Otras'}</span>
                      <span style={{ color: accentColor, fontWeight: 700 }}>
                        {kpi.id === 'acreditados-sil' ? '72%' : 'Activos'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="kpi-footer-row" style={{ paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
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
                    color: 'var(--primary)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '11px'
                  }}
                >
                  <span>{kpi.id === 'cumpleanos' ? 'Ver Mural' : kpi.subtitle}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. AGENDA SEMANAL DE ACTIVIDADES (CARRUSEL + CREADOR DE ACTIVIDADES)      */}
      {/* ========================================================================= */}
      <div className="card agenda-section">
        <div className="agenda-header">
          <div>
            <div className="agenda-title-box" style={{ flexWrap: 'wrap' }}>
              <span className="agenda-bullet" />
              <h2 className="agenda-title">Agenda Semanal</h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '999px',
                  backgroundColor: agendaStats.done === agendaStats.total && agendaStats.total > 0 ? 'var(--success-bg)' : 'var(--brand-50)',
                  color: agendaStats.done === agendaStats.total && agendaStats.total > 0 ? 'var(--success-text)' : 'var(--primary)',
                  border: agendaStats.done === agendaStats.total && agendaStats.total > 0 ? '1px solid var(--success-border)' : '1px solid var(--brand-200)'
                }}
              >
                ✓ {agendaStats.done} de {agendaStats.total} completadas ({agendaStats.pct}%)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Actividades, inducciones SIL-3, juntas y guardias programadas de la semana
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

            {/* Botón funcional para agregar nueva actividad */}
            <button
              type="button"
              onClick={() => setIsAddingTask((prev) => !prev)}
              className="btn btn-primary"
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              {isAddingTask ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAddingTask ? 'Cerrar' : 'Nueva Actividad'}</span>
            </button>
          </div>
        </div>

        {/* Panel desplegable para registrar una Nueva Actividad en la Agenda Semanal */}
        {isAddingTask && (
          <form
            onSubmit={handleAddAgendaTask}
            style={{
              marginTop: '14px',
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--brand-200)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
              gap: '10px',
              alignItems: 'end'
            }}
          >
            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Día de la Semana
              </label>
              <select
                value={newTaskDayId}
                onChange={(e) => setNewTaskDayId(e.target.value)}
                className="select-control"
                style={{ width: '100%', height: '34px', fontSize: '12px' }}
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dayName} ({d.badgeLabel})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Actividad o Guardia *
              </label>
              <input
                type="text"
                placeholder="Ej. Inducción Rig Pass / Revisión de Expedientes..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="input-text"
                style={{ width: '100%', height: '34px', fontSize: '12px', paddingLeft: '10px' }}
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Categoría
              </label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as AgendaTask['category'])}
                className="select-control"
                style={{ width: '100%', height: '34px', fontSize: '12px' }}
              >
                <option value="Junta">Junta</option>
                <option value="Capacitación">Capacitación</option>
                <option value="Entrevista">Entrevista</option>
                <option value="Expedientes">Expedientes</option>
                <option value="Nómina">Nómina</option>
                <option value="SIL-3">SIL-3</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Prioridad
              </label>
              <select
                value={newTaskStatus}
                onChange={(e) => setNewTaskStatus(e.target.value as AgendaTask['status'])}
                className="select-control"
                style={{ width: '100%', height: '34px', fontSize: '12px' }}
              >
                <option value="Activo">Activo</option>
                <option value="Urgente">Urgente</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Sede / Detalle
              </label>
              <input
                type="text"
                placeholder="Ej. Sala Minatitlán"
                value={newTaskDetails}
                onChange={(e) => setNewTaskDetails(e.target.value)}
                className="input-text"
                style={{ width: '100%', height: '34px', fontSize: '12px', paddingLeft: '10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Horario
              </label>
              <input
                type="text"
                placeholder="Ej. 10:00 hrs"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="input-text"
                style={{ width: '100%', height: '34px', fontSize: '12px', paddingLeft: '10px' }}
              />
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '34px', fontSize: '12px', fontWeight: 700 }}
              >
                + Guardar
              </button>
            </div>
          </form>
        )}

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
                                opacity: task.isDone ? 0.55 : 1
                              }}
                            >
                              <div className="task-top">
                                <div
                                  className="task-checkbox-title"
                                  onClick={() => toggleTaskDone(day.id, task.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {task.isDone ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-primary" style={{ flexShrink: 0 }} />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-muted" style={{ flexShrink: 0 }} />
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
      {/* 4. DIRECTORIO RÁPIDO DE COLABORADORES (MINATITLÁN POR DEFAULT)            */}
      {/* ========================================================================= */}
      <div className="card table-section">
        <div className="table-header-toolbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Directorio Rápido de Colaboradores
              </h3>
              <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                {filteredEmployees.length} de {employeeList.length}
              </span>
              {selectedDepto !== 'todos' && (
                <button
                  type="button"
                  onClick={() => setSelectedDepto('todos')}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--brand-50)',
                    color: 'var(--primary)',
                    border: '1px solid var(--brand-200)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Depto: {selectedDepto}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Consulta rápida de expedientes, puestos y estado de acreditaciones técnicas
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Buscador rápido de colaboradores */}
            <div style={{ position: 'relative', minWidth: '210px' }}>
              <Search
                className="w-3.5 h-3.5 text-muted"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Buscar colaborador o puesto..."
                value={searchEmployeeQuery}
                onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                className="input-text"
                style={{ width: '100%', height: '36px', paddingLeft: '30px', paddingRight: '26px', fontSize: '12px' }}
              />
              {searchEmployeeQuery && (
                <button
                  type="button"
                  onClick={() => setSearchEmployeeQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
                    minWidth: '185px',
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
                    maxHeight: '230px',
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

            {/* Ubicaciones Pills (Minatitlán, Ver. activo por defecto) */}
            <div className="filter-tabs-group">
              {['Minatitlán, Ver.', 'Comalcalco, Tab.', 'Xalapa, Ver.', 'Mapachapa, Ver.', 'Todas'].map((loc) => (
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

            <button
              type="button"
              onClick={() => onNavigateSubmenu?.('rrhh-catalogos', 'Directorio de Personal')}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', height: '36px', fontWeight: 700, color: 'var(--primary)' }}
            >
              Directorio Completo →
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="corporate-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Puesto &amp; Departamento</th>
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
                    No se encontraron colaboradores con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="colaborador-cell">
                        <div
                          className="colaborador-avatar"
                          style={{ backgroundColor: emp.avatarBg, overflow: 'hidden' }}
                        >
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            emp.initials
                          )}
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
                      <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                        {emp.department}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
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
      {/* 5. MODALES INTERACTIVOS (EXPEDIENTE, EDICIÓN Y CALENDARIO)                */}
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
