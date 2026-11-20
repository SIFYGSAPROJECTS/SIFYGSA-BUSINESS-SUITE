'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Edit2,
  Eye,
  Mail,
  ShieldCheck,
  Building2,
  MapPin,
  X,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  ArrowUpDown,
  SlidersHorizontal,
  MoreHorizontal,
  Upload,
  UserPlus,
  Download,
  Phone,
  UserCheck,
  Calendar,
  FolderCheck,
  RotateCcw,
  FileUp,
  GitBranch
} from 'lucide-react';
import { Employee } from '../../types';
import { INITIAL_DEPARTMENTS } from '../../data/mockData';
import {
  useSyncedEmployees,
  useSyncedDepartments,
  downloadCsvFile,
  logHrAuditAction,
  getEmployeeProfileCompleteness,
  getDepartmentCode,
  EmployeeCompletenessInfo
} from '../../utils/formShield';
import { HrAuditLogModal } from './HrAuditLogModal';
import { EmployeeBatchImportModal } from './EmployeeBatchImportModal';
import { CvImportModal } from './CvImportModal';
import { OrgChartView } from './OrgChartView';
import { CvImportDraft } from '../../utils/cvParser';

interface EmployeesCatalogViewProps {
  employees: Employee[];
  onOpenNewEmployee: () => void;
  onImportCv?: (draft: CvImportDraft) => void;
  onEditEmployee: (employee: Employee) => void;
  onViewEmployee: (employee: Employee) => void;
}

type DensityMode = 'comfortable' | 'compact';
type CompletenessFilter = 'all' | 'complete' | 'incomplete' | 'missingPhoto';
type SortField = 'name' | 'position' | 'department' | 'completeness';

interface CatalogColumnPrefs {
  showAvatar: boolean;
  showPosition: boolean;
  showDepartment: boolean;
  showSupervisor: boolean;
  showLocation: boolean;
  showContact: boolean;
  showFiscalIds: boolean;
  showHireDate: boolean;
  showCompleteness: boolean;
}

interface CatalogViewPrefs {
  viewMode: 'list' | 'cards' | 'orgchart';
  density: DensityMode;
  columns: CatalogColumnPrefs;
}

const CATALOG_VIEW_PREFS_KEY = 'sifygsa_catalog_view_prefs_v1';

const DEFAULT_COLUMN_PREFS: CatalogColumnPrefs = {
  showAvatar: true,
  showPosition: true,
  showDepartment: true,
  showSupervisor: true,
  showLocation: true,
  showContact: true,
  showFiscalIds: false,
  showHireDate: false,
  showCompleteness: true
};

const DEFAULT_VIEW_PREFS: CatalogViewPrefs = {
  viewMode: 'list',
  density: 'comfortable',
  columns: DEFAULT_COLUMN_PREFS
};

const loadCatalogPrefs = (): CatalogViewPrefs => {
  try {
    const raw = localStorage.getItem(CATALOG_VIEW_PREFS_KEY);
    if (!raw) return DEFAULT_VIEW_PREFS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        viewMode: parsed.viewMode === 'cards' ? 'cards' : 'list',
        density: parsed.density === 'compact' ? 'compact' : 'comfortable',
        columns: {
          ...DEFAULT_COLUMN_PREFS,
          ...(parsed.columns || {})
        }
      };
    }
  } catch {
    // Usar valores predeterminados
  }
  return DEFAULT_VIEW_PREFS;
};

const saveCatalogPrefs = (prefs: CatalogViewPrefs): void => {
  try {
    localStorage.setItem(CATALOG_VIEW_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignorar errores de almacenamiento
  }
};

const COLUMN_TOGGLE_ITEMS: { key: keyof CatalogColumnPrefs; label: string }[] = [
  { key: 'showAvatar', label: 'Fotografía / Iniciales' },
  { key: 'showPosition', label: 'Puesto de Trabajo' },
  { key: 'showDepartment', label: 'Departamento' },
  { key: 'showSupervisor', label: 'Jefe Asignado' },
  { key: 'showLocation', label: 'Sede Operativa' },
  { key: 'showContact', label: 'Correo y Teléfonos' },
  { key: 'showFiscalIds', label: 'RFC y CURP' },
  { key: 'showHireDate', label: 'Fecha de Ingreso' },
  { key: 'showCompleteness', label: 'Estado de Expediente' }
];

const DEPT_BADGE_STYLES = [
  { bg: 'var(--brand-50)', text: 'var(--primary)', border: 'var(--brand-200)' },
  { bg: 'var(--info-bg)', text: 'var(--info-text)', border: 'var(--info-border)' },
  { bg: 'var(--success-bg)', text: 'var(--success-text)', border: 'var(--success-border)' },
  { bg: 'var(--warning-bg)', text: 'var(--warning-text)', border: 'var(--warning-border)' }
];

const getDepartmentBadgeStyle = (dept: string) => {
  if (!dept || dept === 'Por asignar' || dept === 'Sin asignar') {
    return {
      bg: 'var(--surface-alt)',
      text: 'var(--text-muted)',
      border: 'var(--border)'
    };
  }
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = (hash * 31 + dept.charCodeAt(i)) >>> 0;
  }
  return DEPT_BADGE_STYLES[hash % DEPT_BADGE_STYLES.length];
};

export const EmployeesCatalogView: React.FC<EmployeesCatalogViewProps> = ({
  employees: initialEmployees,
  onOpenNewEmployee,
  onImportCv,
  onEditEmployee,
  onViewEmployee
}) => {
  const employees = useSyncedEmployees(initialEmployees);
  const syncedDepartments = useSyncedDepartments(INITIAL_DEPARTMENTS);

  // Preferencias persistentes de vista y personalización de columnas
  const [viewPrefs, setViewPrefs] = useState<CatalogViewPrefs>(DEFAULT_VIEW_PREFS);
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);

  // Filtros y ordenación
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptoFilter, setSelectedDeptoFilter] = useState('todos');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('todas');
  const [completenessFilter, setCompletenessFilter] = useState<CompletenessFilter>('all');
  const [showInactives, setShowInactives] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modales y notificaciones
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCvImportOpen, setIsCvImportOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [batchImportMode, setBatchImportMode] = useState<'csv' | 'quick'>('csv');

  const customizeRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3200);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setViewPrefs(loadCatalogPrefs());
      setPrefsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prefsHydrated) {
      saveCatalogPrefs(viewPrefs);
    }
  }, [viewPrefs, prefsHydrated]);

  // Cierre de popovers al hacer clic fuera o presionar Escape, más atajo discreto Alt+I
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (customizeRef.current && !customizeRef.current.contains(target)) {
        setIsCustomizeOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(target)) {
        setIsOverflowMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCustomizeOpen(false);
        setIsOverflowMenuOpen(false);
      } else if (event.altKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setBatchImportMode('csv');
        setIsBatchImportOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Departamentos oficiales activos + departamentos adicionales presentes en personal importado
  const activeDepartments = useMemo(
    () => syncedDepartments.filter((d) => d.status === 'active'),
    [syncedDepartments]
  );

  const departmentFilterOptions = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((emp) => {
      const isActive = (emp.employmentStatus || 'Activo') === 'Activo';
      if (!showInactives && !isActive) return;
      const dept = emp.department?.trim() || 'Por asignar';
      counts.set(dept, (counts.get(dept) || 0) + 1);
    });

    const orderedNames = Array.from(
      new Set([
        ...activeDepartments.map((d) => d.name),
        ...Array.from(counts.keys())
      ])
    );

    return orderedNames.map((name) => ({
      name,
      count: counts.get(name) || 0
    }));
  }, [employees, activeDepartments, showInactives]);

  const officialDepartmentNames = useMemo(
    () => activeDepartments.map((d) => d.name),
    [activeDepartments]
  );

  // Sedes únicas reales
  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const loc = (e.location || e.codeLocation || '').trim();
      if (loc) set.add(loc);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  // Cálculo de completitud por colaborador
  const completenessMap = useMemo(() => {
    const map = new Map<string, EmployeeCompletenessInfo>();
    employees.forEach((emp) => {
      map.set(emp.id, getEmployeeProfileCompleteness(emp));
    });
    return map;
  }, [employees]);

  // Métricas ejecutivas reales (sin porcentajes ficticios)
  const kpiStats = useMemo(() => {
    const activeEmployees = employees.filter((e) => (e.employmentStatus || 'Activo') === 'Activo');
    const inactiveCount = employees.length - activeEmployees.length;

    const coveredDeptSet = new Set(
      activeEmployees
        .map((e) => e.department?.trim())
        .filter((d): d is string => Boolean(d && d !== 'Por asignar' && d !== 'Sin asignar'))
    );
    const activeDeptNames = new Set(activeDepartments.map((d) => d.name));
    const coveredOfficialDepts = Array.from(coveredDeptSet).filter((d) => activeDeptNames.has(d)).length;

    const activeLocationsSet = new Set(
      activeEmployees.map((e) => (e.location || e.codeLocation || '').trim()).filter(Boolean)
    );

    let completeCount = 0;
    let incompleteCount = 0;
    activeEmployees.forEach((emp) => {
      const info = completenessMap.get(emp.id);
      if (info?.isComplete) completeCount++;
      else incompleteCount++;
    });

    return {
      activeCount: activeEmployees.length,
      inactiveCount,
      totalDepts: activeDepartments.length,
      coveredOfficialDepts,
      locationsCount: activeLocationsSet.size,
      completeCount,
      incompleteCount
    };
  }, [employees, activeDepartments, completenessMap]);

  // Filtrado y ordenación real
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return employees
      .filter((emp) => {
        const status = emp.employmentStatus || 'Activo';
        if (!showInactives && status === 'Inactivo') return false;

        const deptName = emp.department?.trim() || 'Por asignar';
        if (selectedDeptoFilter !== 'todos' && deptName !== selectedDeptoFilter) return false;

        const locName = (emp.location || emp.codeLocation || '').trim();
        if (selectedLocationFilter !== 'todas' && locName !== selectedLocationFilter) return false;

        const info = completenessMap.get(emp.id);
        if (completenessFilter === 'complete' && !info?.isComplete) return false;
        if (completenessFilter === 'incomplete' && info?.isComplete) return false;
        if (completenessFilter === 'missingPhoto' && info?.hasPhoto) return false;

        if (!q) return true;
        return (
          emp.name.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q) ||
          (emp.position && emp.position.toLowerCase().includes(q)) ||
          (emp.department && emp.department.toLowerCase().includes(q)) ||
          (emp.email && emp.email.toLowerCase().includes(q)) ||
          (emp.supervisor && emp.supervisor.toLowerCase().includes(q)) ||
          (emp.phoneCell && emp.phoneCell.toLowerCase().includes(q)) ||
          (emp.phonePrimary && emp.phonePrimary.toLowerCase().includes(q)) ||
          (emp.location && emp.location.toLowerCase().includes(q)) ||
          (emp.codeLocation && emp.codeLocation.toLowerCase().includes(q)) ||
          (emp.rfc && emp.rfc.toLowerCase().includes(q)) ||
          (emp.curp && emp.curp.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') {
          comp = a.name.localeCompare(b.name);
        } else if (sortField === 'position') {
          comp = (a.position || '').localeCompare(b.position || '');
        } else if (sortField === 'department') {
          comp = (a.department || '').localeCompare(b.department || '');
        } else if (sortField === 'completeness') {
          const pctA = completenessMap.get(a.id)?.percent ?? 0;
          const pctB = completenessMap.get(b.id)?.percent ?? 0;
          comp = pctA - pctB;
        }
        return sortAsc ? comp : -comp;
      });
  }, [
    employees,
    showInactives,
    selectedDeptoFilter,
    selectedLocationFilter,
    completenessFilter,
    searchQuery,
    sortField,
    sortAsc,
    completenessMap
  ]);

  const activeExtraFiltersCount =
    (selectedLocationFilter !== 'todas' ? 1 : 0) +
    (completenessFilter !== 'all' ? 1 : 0);

  const hasAnyFilter =
    activeExtraFiltersCount > 0 ||
    selectedDeptoFilter !== 'todos' ||
    searchQuery.trim().length > 0 ||
    showInactives;

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedDeptoFilter('todos');
    setSelectedLocationFilter('todas');
    setCompletenessFilter('all');
    setShowInactives(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const applyViewPreset = (preset: 'standard' | 'compact' | 'full') => {
    if (preset === 'standard') {
      setViewPrefs((prev) => ({
        ...prev,
        density: 'comfortable',
        columns: { ...DEFAULT_COLUMN_PREFS }
      }));
    } else if (preset === 'compact') {
      setViewPrefs((prev) => ({
        ...prev,
        density: 'compact',
        columns: {
          showAvatar: true,
          showPosition: true,
          showDepartment: true,
          showSupervisor: false,
          showLocation: false,
          showContact: true,
          showFiscalIds: false,
          showHireDate: false,
          showCompleteness: false
        }
      }));
    } else {
      setViewPrefs((prev) => ({
        ...prev,
        density: 'comfortable',
        columns: {
          showAvatar: true,
          showPosition: true,
          showDepartment: true,
          showSupervisor: true,
          showLocation: true,
          showContact: true,
          showFiscalIds: true,
          showHireDate: true,
          showCompleteness: true
        }
      }));
    }
  };

  const toggleColumnPref = (key: keyof CatalogColumnPrefs) => {
    setViewPrefs((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [key]: !prev.columns[key]
      }
    }));
  };

  const handleDownloadCsvTemplate = () => {
    downloadCsvFile(
      'Plantilla_Personal_SIFYGSA.csv',
      [
        'Nombre Completo',
        'Puesto',
        'Departamento',
        'Sede',
        'Correo',
        'Celular',
        'Jefe Asignado',
        'RFC',
        'CURP',
        'NSS',
        'Fecha de Ingreso'
      ],
      [
        [
          'Juan Carlos Pérez López',
          'Técnico Especialista',
          'Ingeniería',
          'Minatitlán, Ver.',
          'juan.perez@sifygsa.com.mx',
          '922-123-4567',
          'Ing. Miguel Guzmán Reyes',
          '',
          '',
          '',
          new Date().toLocaleDateString('es-MX')
        ],
        [
          'María Fernanda Díaz Torres',
          'Auxiliar Administrativo',
          'Recursos Humanos',
          'Minatitlán, Ver.',
          '',
          '922-765-4321',
          'Lic. Valeria Méndez Albores',
          '',
          '',
          '',
          ''
        ]
      ]
    );
    showToast('Plantilla CSV descargada');
  };

  const handleExport = (type: 'excel' | 'print') => {
    if (type === 'print') {
      window.print();
      return;
    }

    downloadCsvFile(
      'Empleados_SIFYGSA.csv',
      [
        'Folio',
        'Nombre Completo',
        'Estado',
        'RFC',
        'CURP',
        'NSS',
        'Puesto',
        'Departamento',
        'Jefe Asignado',
        'Empresa',
        'Sede / Ubicación',
        'Correo Corporativo',
        'Teléfono Celular',
        'Fecha de Ingreso',
        'Completitud Expediente'
      ],
      filteredEmployees.map((emp) => {
        const comp = completenessMap.get(emp.id);
        return [
          emp.id,
          emp.name,
          emp.employmentStatus || 'Activo',
          emp.rfc || '',
          emp.curp || '',
          emp.nss || '',
          emp.position,
          emp.department,
          emp.supervisor || '',
          emp.subsidiary || 'SIFYGSA',
          emp.location || emp.codeLocation || '',
          emp.email || '',
          emp.phoneCell || emp.phonePrimary || '',
          emp.hireDate || '',
          `${comp?.percent ?? 0}%`
        ];
      })
    );
    logHrAuditAction({
      actionType: 'Exportación Excel',
      targetRecord: `Directorio de Personal (${filteredEmployees.length} registros)`,
      details: 'Descarga del listado Empleados_SIFYGSA.csv desde el Directorio de Personal.',
      newValue: 'Empleados_SIFYGSA.csv',
      severity: 'normal'
    });
    showToast(`Excel descargado (${filteredEmployees.length} colaboradores)`);
  };

  const openBatchImportModal = (mode: 'csv' | 'quick') => {
    setIsOverflowMenuOpen(false);
    setBatchImportMode(mode);
    setIsBatchImportOpen(true);
  };

  const cellPad = viewPrefs.density === 'compact' ? '8px 12px' : '12px 14px';
  const cols = viewPrefs.columns;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      {/* Toast Notificación */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 120,
            backgroundColor: '#047857',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ENCABEZADO PRINCIPAL Y PERSONALIZACIÓN DE VISTA                        */}
      {/* ========================================================================= */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Recursos Humanos</span> <span style={{ margin: '0 4px' }}>/</span>{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>Directorio de Personal</strong>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              onDoubleClick={() => openBatchImportModal('csv')}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '11px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-200)',
                flexShrink: 0,
                cursor: 'default'
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}
              >
                Directorio de Personal
              </h1>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Consulta de colaboradores, áreas asignadas y expedientes digitales
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Personalizar Vista (Columnas + Densidad + Presets) */}
            <div ref={customizeRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCustomizeOpen((prev) => !prev)}
                style={{
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: isCustomizeOpen ? 'var(--primary)' : undefined,
                  color: isCustomizeOpen ? 'var(--primary)' : undefined
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Personalizar vista</span>
              </button>

              {isCustomizeOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    zIndex: 60,
                    width: '290px',
                    padding: '14px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Campos y apariencia
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        applyViewPreset('standard');
                        showToast('Vista restablecida al formato estándar');
                      }}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer</span>
                    </button>
                  </div>

                  {/* Presets rápidos */}
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Estilos rápidos
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => applyViewPreset('standard')}
                        className="btn btn-secondary"
                        style={{ padding: '5px 6px', fontSize: '11px' }}
                      >
                        Estándar
                      </button>
                      <button
                        type="button"
                        onClick={() => applyViewPreset('compact')}
                        className="btn btn-secondary"
                        style={{ padding: '5px 6px', fontSize: '11px' }}
                      >
                        Directorio
                      </button>
                      <button
                        type="button"
                        onClick={() => applyViewPreset('full')}
                        className="btn btn-secondary"
                        style={{ padding: '5px 6px', fontSize: '11px' }}
                      >
                        Completa
                      </button>
                    </div>
                  </div>

                  {/* Densidad */}
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Espaciado
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        backgroundColor: 'var(--surface-alt)',
                        padding: '3px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setViewPrefs((p) => ({ ...p, density: 'comfortable' }))}
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          fontWeight: viewPrefs.density === 'comfortable' ? 700 : 500,
                          backgroundColor: viewPrefs.density === 'comfortable' ? 'var(--surface)' : 'transparent',
                          color: viewPrefs.density === 'comfortable' ? 'var(--primary)' : 'var(--text-secondary)',
                          boxShadow: viewPrefs.density === 'comfortable' ? 'var(--shadow-xs)' : 'none'
                        }}
                      >
                        Cómodo
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewPrefs((p) => ({ ...p, density: 'compact' }))}
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          fontWeight: viewPrefs.density === 'compact' ? 700 : 500,
                          backgroundColor: viewPrefs.density === 'compact' ? 'var(--surface)' : 'transparent',
                          color: viewPrefs.density === 'compact' ? 'var(--primary)' : 'var(--text-secondary)',
                          boxShadow: viewPrefs.density === 'compact' ? 'var(--shadow-xs)' : 'none'
                        }}
                      >
                        Compacto
                      </button>
                    </div>
                  </div>

                  {/* Checkboxes de campos */}
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Información visible
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {COLUMN_TOGGLE_ITEMS.map((item) => (
                        <label
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={viewPrefs.columns[item.key]}
                            onChange={() => toggleColumnPref(item.key)}
                            style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Bitácora Gerencia RRHH */}
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="btn btn-secondary"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'var(--brand-200)',
                color: 'var(--primary)'
              }}
              title="Bitácora de Auditoría de Recursos Humanos"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bitácora Gerencia</span>
            </button>

            {/* Botón Unificado Importar (Excel / CSV / CV) */}
            <button
              type="button"
              onClick={() => openBatchImportModal('csv')}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderColor: 'var(--brand-200)',
                color: 'var(--primary)',
                backgroundColor: 'var(--brand-50)'
              }}
              title="Importar personal desde Excel (.xlsx), CSV o un CV individual (PDF/Word)"
            >
              <FileUp className="w-4 h-4" />
              <span>Importar</span>
            </button>

            {/* Botón Crear Empleado */}
            <button
              type="button"
              onClick={onOpenNewEmployee}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 700
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Crear Empleado</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE RESUMEN EJECUTIVO                                          */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          className="card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand-50)',
              color: 'var(--primary)',
              border: '1px solid var(--brand-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Personal Activo
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {kpiStats.activeCount} {kpiStats.activeCount === 1 ? 'Colaborador' : 'Colaboradores'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {kpiStats.inactiveCount > 0
                ? `${kpiStats.inactiveCount} inactivo(s) registrado(s)`
                : 'Plantilla activa registrada'}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info-text)',
              border: '1px solid var(--info-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Áreas de la Empresa
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {kpiStats.totalDepts} Departamentos
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {kpiStats.coveredOfficialDepts >= kpiStats.totalDepts
                ? 'Cobertura total en todas las áreas'
                : `${kpiStats.coveredOfficialDepts} de ${kpiStats.totalDepts} con personal asignado`}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--primary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <MapPin className="w-5 h-5" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Sedes Operativas
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {kpiStats.locationsCount || 1} {kpiStats.locationsCount === 1 ? 'Sede' : 'Sedes'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Matriz: Minatitlán, Ver.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setCompletenessFilter((prev) => (prev === 'incomplete' ? 'all' : 'incomplete'))
          }
          className="card card-hoverable"
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            borderColor: completenessFilter === 'incomplete' ? 'var(--warning)' : undefined
          }}
          title="Haz clic para filtrar colaboradores con datos o fotografía por completar"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: kpiStats.incompleteCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
              color: kpiStats.incompleteCount > 0 ? 'var(--warning-text)' : 'var(--success-text)',
              border: `1px solid ${kpiStats.incompleteCount > 0 ? 'var(--warning-border)' : 'var(--success-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FolderCheck className="w-5 h-5" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Estado de Expedientes
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {kpiStats.completeCount} Completos
            </div>
            <div
              style={{
                fontSize: '11px',
                color: kpiStats.incompleteCount > 0 ? 'var(--warning-text)' : 'var(--success-text)',
                fontWeight: 600,
                marginTop: '2px'
              }}
            >
              {kpiStats.incompleteCount > 0
                ? `${kpiStats.incompleteCount} por completar datos`
                : 'Fichas y documentos al 100%'}
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS, FILTROS Y OPCIONES DEL CATÁLOGO                 */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--surface)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Botón Filtros Avanzados */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              style={{
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 11px',
                borderColor: isFiltersOpen || activeExtraFiltersCount > 0 ? 'var(--primary)' : undefined,
                color: isFiltersOpen || activeExtraFiltersCount > 0 ? 'var(--primary)' : undefined,
                backgroundColor: activeExtraFiltersCount > 0 ? 'var(--brand-50)' : undefined
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeExtraFiltersCount > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    borderRadius: '999px',
                    padding: '0 6px',
                    lineHeight: '16px'
                  }}
                >
                  {activeExtraFiltersCount}
                </span>
              )}
            </button>

            {/* Filtro por Departamento con conteo real */}
            <select
              value={selectedDeptoFilter}
              onChange={(e) => setSelectedDeptoFilter(e.target.value)}
              className="select-control"
              style={{ height: '33px', fontSize: '12px', minWidth: '205px' }}
              aria-label="Filtrar por departamento"
            >
              <option value="todos">Todos los Departamentos</option>
              {departmentFilterOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} ({item.count})
                </option>
              ))}
            </select>

            {/* Exportación + Menú discreto de herramientas */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                padding: '0 8px'
              }}
            >
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleExport('excel')}
                title="Descargar listado en Excel (CSV)"
                style={{ color: 'var(--success-text)' }}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleExport('print')}
                title="Imprimir o guardar en PDF"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Menú discreto ··· (carga por CSV / captura rápida de personal) */}
              <div ref={overflowRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setIsOverflowMenuOpen((prev) => !prev)}
                  title="Opciones adicionales del catálogo"
                  aria-label="Opciones adicionales del catálogo"
                  style={{
                    color: isOverflowMenuOpen ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: isOverflowMenuOpen ? 'var(--brand-50)' : undefined
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isOverflowMenuOpen && (
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      zIndex: 60,
                      minWidth: '230px',
                      padding: '6px',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openBatchImportModal('csv')}
                      className="btn-ghost"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left'
                      }}
                    >
                      <Upload className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      <span>Importar archivo CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openBatchImportModal('quick')}
                      className="btn-ghost"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left'
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      <span>Captura rápida de personal</span>
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setIsOverflowMenuOpen(false);
                        handleDownloadCsvTemplate();
                      }}
                      className="btn-ghost"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left'
                      }}
                    >
                      <Download className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      <span>Descargar plantilla CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox Mostrar Inactivos */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={showInactives}
                onChange={(e) => setShowInactives(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <span>Mostrar inactivos</span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Buscador Rápido */}
            <div style={{ position: 'relative', width: '250px' }}>
              <Search
                className="w-3.5 h-3.5"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, puesto, área, RFC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-text"
                style={{ paddingLeft: '30px', paddingRight: searchQuery ? '28px' : '12px', height: '33px', fontSize: '12px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Tabla / Tarjetas */}
            <div
              style={{
                display: 'flex',
                gap: '2px',
                backgroundColor: 'var(--surface-alt)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                type="button"
                onClick={() => setViewPrefs((p) => ({ ...p, viewMode: 'list' }))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: viewPrefs.viewMode === 'list' ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewPrefs.viewMode === 'list' ? 'var(--surface)' : 'transparent',
                  color: viewPrefs.viewMode === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: viewPrefs.viewMode === 'list' ? 'var(--shadow-xs)' : 'none'
                }}
                title="Vista en Tabla"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewPrefs((p) => ({ ...p, viewMode: 'cards' }))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: viewPrefs.viewMode === 'cards' ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewPrefs.viewMode === 'cards' ? 'var(--surface)' : 'transparent',
                  color: viewPrefs.viewMode === 'cards' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: viewPrefs.viewMode === 'cards' ? 'var(--shadow-xs)' : 'none'
                }}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewPrefs((p) => ({ ...p, viewMode: 'orgchart' }))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: viewPrefs.viewMode === 'orgchart' ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewPrefs.viewMode === 'orgchart' ? 'var(--surface)' : 'transparent',
                  color: viewPrefs.viewMode === 'orgchart' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: viewPrefs.viewMode === 'orgchart' ? 'var(--shadow-xs)' : 'none'
                }}
                title="Vista de Organigrama en Árbol"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Organigrama</span>
              </button>
            </div>

            {/* Contador visible */}
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}
            >
              Mostrando: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{filteredEmployees.length}</span>
            </div>
          </div>
        </div>

        {/* Barra Expandible de Filtros Adicionales */}
        {isFiltersOpen && (
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '185px' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Sede Operativa
              </label>
              <select
                value={selectedLocationFilter}
                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                className="select-control"
                style={{ height: '33px', fontSize: '12px' }}
              >
                <option value="todas">Todas las sedes</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estado de Expediente
              </label>
              <select
                value={completenessFilter}
                onChange={(e) => setCompletenessFilter(e.target.value as CompletenessFilter)}
                className="select-control"
                style={{ height: '33px', fontSize: '12px' }}
              >
                <option value="all">Todos los expedientes</option>
                <option value="complete">Expedientes al 100%</option>
                <option value="incomplete">Con datos por completar</option>
                <option value="missingPhoto">Sin fotografía registrada</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '190px' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Ordenar listado por
              </label>
              <select
                value={`${sortField}:${sortAsc ? 'asc' : 'desc'}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(':') as [SortField, 'asc' | 'desc'];
                  setSortField(field);
                  setSortAsc(dir === 'asc');
                }}
                className="select-control"
                style={{ height: '33px', fontSize: '12px' }}
              >
                <option value="name:asc">Nombre (A → Z)</option>
                <option value="name:desc">Nombre (Z → A)</option>
                <option value="department:asc">Departamento (A → Z)</option>
                <option value="position:asc">Puesto (A → Z)</option>
                <option value="completeness:asc">Menor % de expediente primero</option>
                <option value="completeness:desc">Mayor % de expediente primero</option>
              </select>
            </div>

            {hasAnyFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn btn-secondary"
                style={{ height: '33px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. CONTENIDO: TABLA CORPORATIVA O TARJETAS DE DIRECTORIO                  */}
      {/* ========================================================================= */}
      {filteredEmployees.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '44px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'var(--brand-50)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--brand-200)'
            }}
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              No se encontraron colaboradores con esos filtros
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ajusta tu búsqueda o limpia los filtros activos para ver todo el directorio.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
            {hasAnyFilter && (
              <button type="button" className="btn btn-secondary" onClick={resetAllFilters}>
                Limpiar filtros
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onOpenNewEmployee}>
              <Plus className="w-4 h-4" />
              <span>Crear Empleado</span>
            </button>
          </div>
        </div>
      ) : viewPrefs.viewMode === 'orgchart' ? (
        <OrgChartView employees={employees} onViewEmployee={onViewEmployee} />
      ) : viewPrefs.viewMode === 'list' ? (
        <div
          className="card"
          style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: cellPad, width: '130px' }}>ACCIONES</th>
                  {cols.showAvatar && (
                    <th style={{ padding: cellPad, width: '58px', textAlign: 'center' }}>FOTO</th>
                  )}
                  <th
                    style={{ padding: cellPad, cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleSort('name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>COLABORADOR</span>
                      <ArrowUpDown className="w-3.5 h-3.5" style={{ opacity: sortField === 'name' ? 1 : 0.45 }} />
                    </div>
                  </th>
                  {cols.showPosition && (
                    <th
                      style={{ padding: cellPad, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleSort('position')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>PUESTO</span>
                        <ArrowUpDown className="w-3.5 h-3.5" style={{ opacity: sortField === 'position' ? 1 : 0.45 }} />
                      </div>
                    </th>
                  )}
                  {cols.showDepartment && (
                    <th
                      style={{ padding: cellPad, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleSort('department')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>DEPARTAMENTO</span>
                        <ArrowUpDown className="w-3.5 h-3.5" style={{ opacity: sortField === 'department' ? 1 : 0.45 }} />
                      </div>
                    </th>
                  )}
                  {cols.showSupervisor && <th style={{ padding: cellPad }}>JEFE ASIGNADO</th>}
                  {cols.showLocation && <th style={{ padding: cellPad }}>SEDE</th>}
                  {cols.showContact && <th style={{ padding: cellPad }}>CONTACTO</th>}
                  {cols.showFiscalIds && <th style={{ padding: cellPad }}>RFC / CURP</th>}
                  {cols.showHireDate && <th style={{ padding: cellPad }}>INGRESO</th>}
                  {cols.showCompleteness && (
                    <th
                      style={{ padding: cellPad, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleSort('completeness')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>EXPEDIENTE</span>
                        <ArrowUpDown
                          className="w-3.5 h-3.5"
                          style={{ opacity: sortField === 'completeness' ? 1 : 0.45 }}
                        />
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => {
                  const isEven = index % 2 === 0;
                  const deptStyle = getDepartmentBadgeStyle(emp.department);
                  const comp = completenessMap.get(emp.id) || {
                    percent: 0,
                    isComplete: false,
                    hasPhoto: false,
                    missingFields: []
                  };
                  const isInactive = emp.employmentStatus === 'Inactivo';
                  const hasEmail = Boolean(emp.email && emp.email.trim());
                  const isMissingPosition = !emp.position || emp.position === 'Por definir';
                  const phoneDisplay = emp.phoneCell || emp.phonePrimary;

                  return (
                    <tr
                      key={emp.id}
                      style={{
                        backgroundColor: isEven ? 'var(--surface)' : 'var(--surface-alt)',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color var(--transition-fast)',
                        opacity: isInactive ? 0.72 : 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--brand-50)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isEven ? 'var(--surface)' : 'var(--surface-alt)';
                      }}
                    >
                      {/* Acciones Ver / Editar */}
                      <td style={{ padding: cellPad, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onViewEmployee(emp)}
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 9px',
                              fontSize: '11px',
                              gap: '4px'
                            }}
                            title="Ver expediente completo"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            style={{
                              padding: '4px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-control)',
                              backgroundColor: 'var(--brand-50)',
                              color: 'var(--primary)',
                              border: '1px solid var(--brand-200)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Editar datos o agregar fotografía"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </td>

                      {/* Fotografía / Avatar */}
                      {cols.showAvatar && (
                        <td style={{ padding: cellPad, textAlign: 'center' }}>
                          <div
                            onClick={() => onViewEmployee(emp)}
                            style={{
                              width: viewPrefs.density === 'compact' ? '32px' : '38px',
                              height: viewPrefs.density === 'compact' ? '32px' : '38px',
                              borderRadius: '9px',
                              overflow: 'hidden',
                              backgroundColor: emp.avatarBg || 'var(--primary)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              margin: '0 auto',
                              border: '1.5px solid var(--border)',
                              cursor: 'pointer'
                            }}
                            title="Ver ficha"
                          >
                            {emp.photoUrl ? (
                              <img
                                src={emp.photoUrl}
                                alt={emp.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              emp.initials
                            )}
                          </div>
                        </td>
                      )}

                      {/* Colaborador */}
                      <td style={{ padding: cellPad }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => onViewEmployee(emp)}
                            style={{
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              textAlign: 'left',
                              padding: 0
                            }}
                          >
                            {emp.name}
                          </button>
                          {isInactive && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '999px',
                                backgroundColor: 'var(--danger-bg)',
                                color: 'var(--danger-text)',
                                border: '1px solid var(--danger-border)'
                              }}
                            >
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--brand-50)',
                              color: 'var(--primary)',
                              border: '1px solid var(--brand-200)',
                              letterSpacing: '0.03em'
                            }}
                          >
                            {getDepartmentCode(emp.department, emp.location)}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {emp.id}
                          </span>
                        </div>
                      </td>

                      {/* Puesto */}
                      {cols.showPosition && (
                        <td
                          style={{
                            padding: cellPad,
                            color: isMissingPosition ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontWeight: isMissingPosition ? 500 : 600,
                            fontStyle: isMissingPosition ? 'italic' : 'normal'
                          }}
                        >
                          {emp.position || 'Por definir'}
                        </td>
                      )}

                      {/* Departamento */}
                      {cols.showDepartment && (
                        <td style={{ padding: cellPad }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: deptStyle.bg,
                              color: deptStyle.text,
                              border: `1px solid ${deptStyle.border}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {emp.department || 'Por asignar'}
                          </span>
                        </td>
                      )}

                      {/* Jefe Asignado */}
                      {cols.showSupervisor && (
                        <td
                          style={{
                            padding: cellPad,
                            fontSize: '11.5px',
                            color: emp.supervisor ? 'var(--text-secondary)' : 'var(--text-muted)',
                            fontStyle: emp.supervisor ? 'normal' : 'italic'
                          }}
                        >
                          {emp.supervisor || 'Sin asignar'}
                        </td>
                      )}

                      {/* Sede */}
                      {cols.showLocation && (
                        <td style={{ padding: cellPad, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {emp.location || emp.codeLocation || 'Por definir'}
                        </td>
                      )}

                      {/* Contacto */}
                      {cols.showContact && (
                        <td style={{ padding: cellPad }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {hasEmail ? (
                              <a
                                href={`mailto:${emp.email}`}
                                style={{
                                  color: 'var(--primary)',
                                  fontWeight: 600,
                                  fontSize: '11.5px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {emp.email}
                              </a>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Sin correo registrado
                              </span>
                            )}
                            {(phoneDisplay || emp.officeExtension) && (
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                                {phoneDisplay && <span>{phoneDisplay}</span>}
                                {emp.officeExtension && <span>Ext. {emp.officeExtension}</span>}
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* RFC / CURP */}
                      {cols.showFiscalIds && (
                        <td style={{ padding: cellPad, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          <div style={{ color: emp.rfc ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {emp.rfc || 'RFC pendiente'}
                          </div>
                          {emp.curp && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.curp}</div>
                          )}
                        </td>
                      )}

                      {/* Ingreso */}
                      {cols.showHireDate && (
                        <td style={{ padding: cellPad, fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {emp.hireDate || '—'}
                        </td>
                      )}

                      {/* Estado de Expediente */}
                      {cols.showCompleteness && (
                        <td style={{ padding: cellPad, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {comp.isComplete ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success-text)',
                                border: '1px solid var(--success-border)'
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completa</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onEditEmployee(emp)}
                              title={`Faltan: ${comp.missingFields.join(', ')}. Clic para completar.`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: 'var(--warning-bg)',
                                color: 'var(--warning-text)',
                                border: '1px solid var(--warning-border)'
                              }}
                            >
                              <span>{comp.percent}% · Completar</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista de Tarjetas Corporativas */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(305px, 1fr))',
            gap: '14px'
          }}
        >
          {filteredEmployees.map((emp) => {
            const deptStyle = getDepartmentBadgeStyle(emp.department);
            const comp = completenessMap.get(emp.id) || {
              percent: 0,
              isComplete: false,
              hasPhoto: false,
              missingFields: []
            };
            const isInactive = emp.employmentStatus === 'Inactivo';
            const phoneDisplay = emp.phoneCell || emp.phonePrimary;

            return (
              <div
                key={emp.id}
                className="card card-hoverable"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isInactive ? 0.78 : 1
                }}
              >
                {/* Franja superior corporativa */}
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: emp.avatarBg || 'var(--primary)'
                  }}
                />

                <div
                  style={{
                    padding: viewPrefs.density === 'compact' ? '12px 14px' : '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flex: 1
                  }}
                >
                  {/* Folio + Estado */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        backgroundColor: 'var(--surface-alt)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        padding: '2px 7px',
                        borderRadius: '6px'
                      }}
                    >
                      {emp.id}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isInactive && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--danger-bg)',
                            color: 'var(--danger-text)',
                            border: '1px solid var(--danger-border)'
                          }}
                        >
                          Inactivo
                        </span>
                      )}

                      {cols.showCompleteness &&
                        (comp.isComplete ? (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: 'var(--success-text)',
                              backgroundColor: 'var(--success-bg)',
                              border: '1px solid var(--success-border)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completa</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            title={`Faltan: ${comp.missingFields.join(', ')}`}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: 'var(--warning-text)',
                              backgroundColor: 'var(--warning-bg)',
                              border: '1px solid var(--warning-border)',
                              padding: '2px 8px',
                              borderRadius: '999px'
                            }}
                          >
                            {comp.percent}% · Faltan {comp.missingFields.length}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Identidad principal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {cols.showAvatar && (
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: emp.avatarBg || 'var(--primary)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '16px',
                          flexShrink: 0,
                          boxShadow: 'var(--shadow-xs)',
                          border: '1.5px solid var(--border)'
                        }}
                      >
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt={emp.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          emp.initials
                        )}
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                          lineHeight: 1.25
                        }}
                      >
                        {emp.name}
                      </h3>
                      {cols.showPosition && (
                        <div
                          style={{
                            fontSize: '12px',
                            color:
                              !emp.position || emp.position === 'Por definir'
                                ? 'var(--text-muted)'
                                : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontStyle: !emp.position || emp.position === 'Por definir' ? 'italic' : 'normal',
                            marginTop: '2px'
                          }}
                        >
                          {emp.position || 'Por definir'}
                        </div>
                      )}
                      {cols.showDepartment && (
                        <div style={{ marginTop: '6px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              backgroundColor: deptStyle.bg,
                              color: deptStyle.text,
                              border: `1px solid ${deptStyle.border}`
                            }}
                          >
                            {emp.department || 'Por asignar'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalles configurables */}
                  {(cols.showSupervisor ||
                    cols.showLocation ||
                    cols.showContact ||
                    cols.showFiscalIds ||
                    cols.showHireDate) && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {cols.showSupervisor && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Jefe: <strong>{emp.supervisor || 'Sin asignar'}</strong>
                          </span>
                        </div>
                      )}

                      {cols.showLocation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>{emp.location || emp.codeLocation || 'Por definir'}</span>
                        </div>
                      )}

                      {cols.showContact && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: emp.email ? 'var(--primary)' : 'var(--text-muted)',
                                fontStyle: emp.email ? 'normal' : 'italic'
                              }}
                            >
                              {emp.email || 'Sin correo registrado'}
                            </span>
                          </div>
                          {(phoneDisplay || emp.officeExtension) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              <span>
                                {phoneDisplay || ''}
                                {phoneDisplay && emp.officeExtension ? ' · ' : ''}
                                {emp.officeExtension ? `Ext. ${emp.officeExtension}` : ''}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {cols.showFiscalIds && (
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          RFC: {emp.rfc || 'Pendiente'}
                          {emp.curp ? ` · CURP: ${emp.curp}` : ''}
                        </div>
                      )}

                      {cols.showHireDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>Ingreso: {emp.hireDate || '—'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pie de Tarjeta con acciones */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--surface-alt)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onViewEmployee(emp)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '11.5px', width: '100%' }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Expediente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditEmployee(emp)}
                    className="btn btn-primary"
                    style={{ padding: '6px 10px', fontSize: '11.5px', width: '100%' }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{comp.isComplete ? 'Editar' : 'Completar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Bitácora Gerencial Exclusiva RRHH */}
      <HrAuditLogModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />

      {/* Modal de Importación de CV */}
      <CvImportModal
        isOpen={isCvImportOpen}
        onClose={() => setIsCvImportOpen(false)}
        departments={officialDepartmentNames}
        onSwitchToExcel={() => {
          setIsCvImportOpen(false);
          openBatchImportModal('csv');
        }}
        onConfirmImport={(draft) => {
          setIsCvImportOpen(false);
          if (onImportCv) {
            onImportCv(draft);
          } else {
            onOpenNewEmployee();
          }
        }}
      />

      {/* Modal de Carga desde Excel / CSV y Captura Rápida en Lote */}
      <EmployeeBatchImportModal
        isOpen={isBatchImportOpen}
        initialMode={batchImportMode}
        existingEmployees={employees}
        availableDepartments={officialDepartmentNames}
        onClose={() => setIsBatchImportOpen(false)}
        onSwitchToCv={() => {
          setIsBatchImportOpen(false);
          setIsCvImportOpen(true);
        }}
        onImported={(addedCount, skippedCount) => {
          const skipText = skippedCount > 0 ? ` (${skippedCount} repetido(s) omitido(s))` : '';
          showToast(
            `${addedCount} ${addedCount === 1 ? 'colaborador agregado' : 'colaboradores agregados'} al directorio${skipText}`
          );
        }}
      />
    </div>
  );
};
