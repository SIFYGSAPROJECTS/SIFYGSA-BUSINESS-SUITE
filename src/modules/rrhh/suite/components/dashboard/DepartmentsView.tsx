'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Eye,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  PhoneCall,
  MapPin,
  Check,
  Palette,
  Award,
  SlidersHorizontal,
  BookmarkPlus,
  RotateCcw,
  Briefcase,
  Package,
  ShoppingCart,
  Compass,
  ShieldCheck,
  Server,
  Cpu,
  BarChart3,
  Wrench,
  TrendingUp,
  Layers
} from 'lucide-react';
import { DepartmentItem, Employee } from '../../types';
import { EMPLOYEES } from '../../data/mockData';
import { ExtensionsCatalogView } from './ExtensionsCatalogView';
import {
  sanitizeCleanText,
  sanitizePersonName,
  savePersistedDepartments,
  useSyncedDepartments,
  useSyncedEmployees,
  useSyncedExtensions,
  getDepartmentCode,
  getDepartmentTheme,
  suggestDepartmentCode,
  DEPARTMENT_COLOR_SWATCHES,
  downloadCsvFile,
  logHrAuditAction
} from '../../utils/formShield';

interface DepartmentsViewProps {
  departments: DepartmentItem[];
  onAddDepartment: (newDept: DepartmentItem) => void;
  onUpdateDepartment: (updatedDept: DepartmentItem) => void;
  onDeleteDepartment?: (id: string) => void;
}

const SITE_OPTIONS = [
  'Minatitlán, Ver.',
  'Mapachapa, Ver.',
  'Comalcalco, Tab.',
  'Xalapa, Ver.',
  'Ciudad del Carmen, Camp.',
  'Mérida, Yuc.'
];

const normalizeText = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

type HeadcountFilter = 'todos' | 'sin_personal' | 'pequeno' | 'mediano' | 'grande';
type ExtensionFilter = 'todas' | 'con_ext' | 'sin_ext';
type StatusFilter = 'active' | 'inactive' | 'all';
type SortField = 'name' | 'code' | 'employeeCount' | 'location';
type TableDensity = 'comfortable' | 'compact';

interface DeptColumnVisibility {
  code: boolean;
  lead: boolean;
  headcount: boolean;
  extensions: boolean;
  location: boolean;
  status: boolean;
}

interface DeptSavedView {
  id: string;
  name: string;
  builtIn?: boolean;
  filters: {
    site: string;
    headcount: HeadcountFilter;
    extension: ExtensionFilter;
    status: StatusFilter;
    lead: string;
    sortField: SortField;
    sortAsc: boolean;
  };
}

interface DeptUserPrefs {
  columns: DeptColumnVisibility;
  density: TableDensity;
  savedViews: DeptSavedView[];
}

const DEPT_PREFS_STORAGE_KEY = 'sifygsa_dept_user_prefs_v1';

const DEFAULT_COLUMNS: DeptColumnVisibility = {
  code: true,
  lead: true,
  headcount: true,
  extensions: true,
  location: true,
  status: true
};

const BUILTIN_VIEWS: DeptSavedView[] = [
  {
    id: 'all-active',
    name: 'Todas las áreas',
    builtIn: true,
    filters: {
      site: 'todas',
      headcount: 'todos',
      extension: 'todas',
      status: 'active',
      lead: 'todos',
      sortField: 'code',
      sortAsc: true
    }
  },
  {
    id: 'top-headcount',
    name: 'Mayor plantilla',
    builtIn: true,
    filters: {
      site: 'todas',
      headcount: 'todos',
      extension: 'todas',
      status: 'active',
      lead: 'todos',
      sortField: 'employeeCount',
      sortAsc: false
    }
  },
  {
    id: 'with-extensions',
    name: 'Con extensiones',
    builtIn: true,
    filters: {
      site: 'todas',
      headcount: 'todos',
      extension: 'con_ext',
      status: 'active',
      lead: 'todos',
      sortField: 'code',
      sortAsc: true
    }
  },
  {
    id: 'empty-areas',
    name: 'Sin personal (0)',
    builtIn: true,
    filters: {
      site: 'todas',
      headcount: 'sin_personal',
      extension: 'todas',
      status: 'active',
      lead: 'todos',
      sortField: 'name',
      sortAsc: true
    }
  }
];

const DEFAULT_DEPT_PREFS: DeptUserPrefs = {
  columns: DEFAULT_COLUMNS,
  density: 'comfortable',
  savedViews: []
};

let cachedPrefsRaw: string | null = null;
let cachedPrefsObj: DeptUserPrefs = DEFAULT_DEPT_PREFS;

const subscribeDeptPrefs = (cb: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('sifygsa-dept-prefs-update', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('sifygsa-dept-prefs-update', cb);
    window.removeEventListener('storage', cb);
  };
};

const getDeptPrefsSnapshot = (): DeptUserPrefs => {
  if (typeof window === 'undefined') return DEFAULT_DEPT_PREFS;
  try {
    const raw = window.localStorage.getItem(DEPT_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_DEPT_PREFS;
    if (raw === cachedPrefsRaw) return cachedPrefsObj;
    const parsed = JSON.parse(raw) as Partial<DeptUserPrefs>;
    cachedPrefsRaw = raw;
    cachedPrefsObj = {
      columns: { ...DEFAULT_COLUMNS, ...(parsed.columns || {}) },
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      savedViews: Array.isArray(parsed.savedViews) ? parsed.savedViews : []
    };
    return cachedPrefsObj;
  } catch {
    return DEFAULT_DEPT_PREFS;
  }
};

const saveDeptPrefs = (next: DeptUserPrefs): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(next);
    cachedPrefsRaw = raw;
    cachedPrefsObj = next;
    window.localStorage.setItem(DEPT_PREFS_STORAGE_KEY, raw);
    window.dispatchEvent(new Event('sifygsa-dept-prefs-update'));
  } catch {
    // ignore storage quota errors
  }
};

const getLeadInitials = (lead?: string): string => {
  const cleaned = (lead || '')
    .replace(/\b(Ing|Lic|Mtra|Mtro|Dr|Dra|Arq|C\.P\.|CP|Téc|Tec)\.?\s+/gi, '')
    .trim();
  if (!cleaned || cleaned.toLowerCase() === 'por asignar') return '—';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const HEADCOUNT_LABELS: Record<HeadcountFilter, string> = {
  todos: 'Todos los tamaños',
  sin_personal: 'Sin personal (0)',
  pequeno: 'Pequeño (1–5)',
  mediano: 'Mediano (6–15)',
  grande: 'Frente grande (16+)'
};

const EXTENSION_LABELS: Record<ExtensionFilter, string> = {
  todas: 'Todas',
  con_ext: 'Con extensión',
  sin_ext: 'Sin extensión'
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  active: 'Solo activos',
  inactive: 'Solo inactivos',
  all: 'Activos e inactivos'
};

const COLUMN_META: readonly { key: keyof DeptColumnVisibility; label: string }[] = [
  { key: 'code', label: 'Código' },
  { key: 'lead', label: 'Titular / Responsable' },
  { key: 'headcount', label: 'Plantilla Real' },
  { key: 'extensions', label: 'Extensiones' },
  { key: 'location', label: 'Sede Principal' },
  { key: 'status', label: 'Estado' }
];

const renderDepartmentIcon = (codeOrName?: string, className = 'w-4 h-4'): React.ReactNode => {
  const code = getDepartmentCode(codeOrName).toUpperCase();
  switch (code) {
    case 'DIR':
      return <Compass className={className} />;
    case 'ADM':
      return <Briefcase className={className} />;
    case 'ALM':
      return <Package className={className} />;
    case 'CAL':
      return <Award className={className} />;
    case 'COM':
      return <ShoppingCart className={className} />;
    case 'HSE-MIN':
    case 'HSE-COM':
      return <ShieldCheck className={className} />;
    case 'INF':
      return <Server className={className} />;
    case 'ING':
      return <Cpu className={className} />;
    case 'MCP':
      return <BarChart3 className={className} />;
    case 'RH':
      return <Users className={className} />;
    case 'SRV':
      return <Wrench className={className} />;
    case 'VTA':
      return <TrendingUp className={className} />;
    case 'GSAPE':
      return <Layers className={className} />;
    default:
      return <Building2 className={className} />;
  }
};

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments: initialDepartments,
  onAddDepartment,
  onUpdateDepartment
}) => {
  const departments = useSyncedDepartments(initialDepartments);
  const allEmployees = useSyncedEmployees(EMPLOYEES);
  const allExtensions = useSyncedExtensions();
  const userPrefs = useSyncExternalStore(
    subscribeDeptPrefs,
    getDeptPrefsSnapshot,
    () => DEFAULT_DEPT_PREFS
  );

  // Estados de Vista y Filtros Personalizables
  const [activeCatalogTab, setActiveCatalogTab] = useState<'departamentos' | 'extensiones'>('departamentos');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('todas');
  const [headcountFilter, setHeadcountFilter] = useState<HeadcountFilter>('todos');
  const [extensionFilter, setExtensionFilter] = useState<ExtensionFilter>('todas');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [selectedLead, setSelectedLead] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string>('all-active');
  const [isSavingView, setIsSavingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const visibleCols = userPrefs.columns;
  const density = userPrefs.density;
  const allSavedViews = useMemo(
    () => [...BUILTIN_VIEWS, ...userPrefs.savedViews],
    [userPrefs.savedViews]
  );

  // Estados de Modal (Crear / Editar / Ver)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentItem | null>(null);

  // Formulario de Crear / Editar
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCodeTouched, setFormCodeTouched] = useState(false);
  const [formLead, setFormLead] = useState('');
  const [formLocation, setFormLocation] = useState('Minatitlán, Ver.');
  const [formSubsidiary, setFormSubsidiary] = useState('SIFYGSA');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<string>(DEPARTMENT_COLOR_SWATCHES[0].hex);
  const [formActive, setFormActive] = useState(true);

  // Toast de confirmación / advertencia
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const getDepartmentBranchLabel = (dept: DepartmentItem): string | null => {
    const cleanName = dept.name.trim().toLowerCase();
    const cleanLoc = (dept.location || '').toLowerCase();
    if (cleanName === 'hse') {
      return cleanLoc.includes('comalcalco') ? 'Comalcalco' : 'Minatitlán';
    }
    if (cleanName === 'recursos humanos') {
      return 'Rama: Capacitación';
    }
    if (cleanName === 'ventas') {
      return 'Rama: Definición de Soluciones';
    }
    return null;
  };

  // Colaboradores activos reales agrupados por departamento
  const activeEmployees = useMemo(
    () => allEmployees.filter((e) => (e.employmentStatus || 'Activo') === 'Activo'),
    [allEmployees]
  );

  const employeesByDeptId = useMemo(() => {
    const map = new Map<string, Employee[]>();
    departments.forEach((d) => map.set(d.id, []));

    activeEmployees.forEach((emp) => {
      const empCode = getDepartmentCode(emp.department, emp.location);
      const empDeptNorm = normalizeText(emp.department);

      // 1. Coincidencia exacta por código (distingue HSE-MIN vs HSE-COM)
      let matched = departments.find((d) => d.code.toUpperCase() === empCode.toUpperCase());

      // 2. Respaldo por nombre normalizado
      if (!matched) {
        matched = departments.find((d) => normalizeText(d.name) === empDeptNorm);
      }

      if (matched) {
        const list = map.get(matched.id) || [];
        list.push(emp);
        map.set(matched.id, list);
      }
    });

    return map;
  }, [departments, activeEmployees]);

  // Enriquecer departamentos con conteo real y tema de color
  const enrichedDepartments = useMemo(() => {
    return departments.map((dept) => {
      const members = employeesByDeptId.get(dept.id) || [];
      const liveCount = members.length;
      const theme = getDepartmentTheme(dept.code || dept.name, dept.location, dept.color);
      const deptExts = allExtensions.filter(
        (ext) =>
          ext.status === 'active' &&
          (getDepartmentCode(ext.department, ext.location) === dept.code.toUpperCase() ||
            normalizeText(ext.department) === normalizeText(dept.name))
      );
      return {
        ...dept,
        liveEmployeeCount: liveCount,
        members,
        theme,
        extensions: deptExts
      };
    });
  }, [departments, employeesByDeptId, allExtensions]);

  const availableSites = useMemo(() => {
    const set = new Set<string>();
    departments.forEach((d) => {
      if (d.location?.trim()) set.add(d.location.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [departments]);

  const availableLeads = useMemo(() => {
    const set = new Set<string>();
    departments.forEach((d) => {
      if (d.lead?.trim()) set.add(d.lead.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [departments]);

  // Filtrado y ordenación multi-campo
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedDepartments
      .filter((dept) => {
        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
              ? dept.status === 'active'
              : dept.status !== 'active';
        const matchesSite = selectedSite === 'todas' || dept.location === selectedSite;
        const matchesLead = selectedLead === 'todos' || dept.lead === selectedLead;
        const matchesHeadcount =
          headcountFilter === 'todos'
            ? true
            : headcountFilter === 'sin_personal'
              ? dept.liveEmployeeCount === 0
              : headcountFilter === 'pequeno'
                ? dept.liveEmployeeCount >= 1 && dept.liveEmployeeCount <= 5
                : headcountFilter === 'mediano'
                  ? dept.liveEmployeeCount >= 6 && dept.liveEmployeeCount <= 15
                  : dept.liveEmployeeCount >= 16;
        const matchesExt =
          extensionFilter === 'todas'
            ? true
            : extensionFilter === 'con_ext'
              ? dept.extensions.length > 0
              : dept.extensions.length === 0;
        const matchesSearch =
          !q ||
          dept.name.toLowerCase().includes(q) ||
          dept.code.toLowerCase().includes(q) ||
          dept.lead.toLowerCase().includes(q) ||
          dept.location.toLowerCase().includes(q) ||
          (dept.description || '').toLowerCase().includes(q) ||
          dept.extensions.some((ext) => ext.extension.includes(q));
        return matchesStatus && matchesSite && matchesLead && matchesHeadcount && matchesExt && matchesSearch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'name') comp = a.name.localeCompare(b.name, 'es');
        if (sortField === 'code') comp = a.code.localeCompare(b.code, 'es');
        if (sortField === 'employeeCount') comp = a.liveEmployeeCount - b.liveEmployeeCount;
        if (sortField === 'location') comp = a.location.localeCompare(b.location, 'es');
        return sortAsc ? comp : -comp;
      });
  }, [
    enrichedDepartments,
    searchQuery,
    statusFilter,
    selectedSite,
    selectedLead,
    headcountFilter,
    extensionFilter,
    sortField,
    sortAsc
  ]);

  // KPIs 100% reales y dinámicos
  const activeDepartmentsCount = useMemo(
    () => enrichedDepartments.filter((d) => d.status === 'active').length,
    [enrichedDepartments]
  );

  const totalLiveEmployees = activeEmployees.length;

  const largestDepartment = useMemo(() => {
    if (enrichedDepartments.length === 0) return null;
    return enrichedDepartments.reduce((top, cur) =>
      cur.liveEmployeeCount > top.liveEmployeeCount ? cur : top
    );
  }, [enrichedDepartments]);

  const maxDeptCount = Math.max(largestDepartment?.liveEmployeeCount || 1, 1);

  const activeFiltersCount =
    (selectedSite !== 'todas' ? 1 : 0) +
    (headcountFilter !== 'todos' ? 1 : 0) +
    (extensionFilter !== 'todas' ? 1 : 0) +
    (statusFilter !== 'active' ? 1 : 0) +
    (selectedLead !== 'todos' ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedSite('todas');
    setHeadcountFilter('todos');
    setExtensionFilter('todas');
    setStatusFilter('active');
    setSelectedLead('todos');
    setSortField('code');
    setSortAsc(true);
    setSearchQuery('');
    setActiveSavedViewId('all-active');
  };

  const applySavedView = (view: DeptSavedView) => {
    setSelectedSite(view.filters.site);
    setHeadcountFilter(view.filters.headcount);
    setExtensionFilter(view.filters.extension);
    setStatusFilter(view.filters.status);
    setSelectedLead(view.filters.lead);
    setSortField(view.filters.sortField);
    setSortAsc(view.filters.sortAsc);
    setActiveSavedViewId(view.id);
  };

  const handleSaveCustomView = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newViewName.trim();
    if (cleanName.length < 2) {
      showToast('Escribe un nombre para tu vista personalizada', 'warning');
      return;
    }
    const created: DeptSavedView = {
      id: `custom-${Date.now()}`,
      name: cleanName.slice(0, 32),
      filters: {
        site: selectedSite,
        headcount: headcountFilter,
        extension: extensionFilter,
        status: statusFilter,
        lead: selectedLead,
        sortField,
        sortAsc
      }
    };
    saveDeptPrefs({
      ...userPrefs,
      savedViews: [...userPrefs.savedViews, created]
    });
    setActiveSavedViewId(created.id);
    setNewViewName('');
    setIsSavingView(false);
    showToast(`Vista "${created.name}" guardada`, 'success');
  };

  const handleDeleteCustomView = (viewId: string) => {
    const remaining = userPrefs.savedViews.filter((v) => v.id !== viewId);
    saveDeptPrefs({ ...userPrefs, savedViews: remaining });
    if (activeSavedViewId === viewId) {
      setActiveSavedViewId('custom');
    }
    showToast('Vista personalizada eliminada', 'success');
  };

  const toggleColumnVisibility = (key: keyof DeptColumnVisibility) => {
    saveDeptPrefs({
      ...userPrefs,
      columns: { ...visibleCols, [key]: !visibleCols[key] }
    });
  };

  const setTableDensity = (nextDensity: TableDensity) => {
    saveDeptPrefs({ ...userPrefs, density: nextDensity });
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormCode('');
    setFormCodeTouched(false);
    setFormLead('');
    setFormLocation('Minatitlán, Ver.');
    setFormSubsidiary('SIFYGSA');
    setFormDescription('');
    setFormColor(DEPARTMENT_COLOR_SWATCHES[departments.length % DEPARTMENT_COLOR_SWATCHES.length].hex);
    setFormActive(true);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentItem) => {
    const currentTheme = getDepartmentTheme(dept.code || dept.name, dept.location, dept.color);
    setCurrentDepartment(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormCodeTouched(true);
    setFormLead(dept.lead);
    setFormLocation(dept.location);
    setFormSubsidiary(dept.subsidiary);
    setFormDescription(dept.description || '');
    setFormColor(dept.color || currentTheme.accent);
    setFormActive(dept.status === 'active');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (dept: DepartmentItem) => {
    setCurrentDepartment(dept);
    setIsDetailModalOpen(true);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (formName.trim().length < 2) {
      showToast('¡Falta nombre del departamento!', 'warning');
      return;
    }

    const finalCode =
      formCode.trim() ||
      suggestDepartmentCode(formName.trim()) ||
      `AREA-${departments.length + 1}`;

    const newDept: DepartmentItem = {
      id: `dep-${Date.now()}`,
      name: formName.trim(),
      code: finalCode.toUpperCase(),
      lead: formLead.trim() || 'Por Asignar',
      employeeCount: 0,
      subsidiary: formSubsidiary,
      location: formLocation,
      status: formActive ? 'active' : 'inactive',
      description: formDescription.trim(),
      color: formColor,
      createdAt: new Date().toLocaleDateString('es-MX')
    };

    savePersistedDepartments([newDept, ...departments]);
    logHrAuditAction({
      actionType: 'Catálogo Departamentos',
      targetRecord: `${newDept.code} · ${newDept.name}`,
      details: `Alta de nuevo departamento operativo con titular ${newDept.lead}.`,
      previousValue: 'Sin registro',
      newValue: `${newDept.name} (${newDept.location})`,
      severity: 'normal'
    });
    onAddDepartment(newDept);
    setIsCreateModalOpen(false);
    showToast('¡Departamento creado!', 'success');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDepartment || formName.trim().length < 2) {
      showToast('¡Falta nombre del departamento!', 'warning');
      return;
    }

    const updated: DepartmentItem = {
      ...currentDepartment,
      name: formName.trim(),
      code: formCode.trim().toUpperCase() || currentDepartment.code,
      lead: formLead.trim() || 'Por Asignar',
      location: formLocation,
      subsidiary: formSubsidiary,
      status: formActive ? 'active' : 'inactive',
      description: formDescription.trim(),
      color: formColor
    };

    savePersistedDepartments(departments.map((d) => (d.id === updated.id ? updated : d)));
    logHrAuditAction({
      actionType: 'Catálogo Departamentos',
      targetRecord: `${updated.code} · ${updated.name}`,
      details: 'Actualización de departamento, color corporativo y titular de área.',
      previousValue: `${currentDepartment.name} · ${currentDepartment.lead}`,
      newValue: `${updated.name} · ${updated.lead}`,
      severity: 'normal'
    });
    onUpdateDepartment(updated);
    setIsEditModalOpen(false);
    showToast('¡Cambios guardados!', 'success');
  };

  const toggleSort = (field: SortField) => {
    setActiveSavedViewId('custom');
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field !== 'employeeCount');
    }
  };

  const handleExport = (type: 'excel' | 'pdf' | 'print') => {
    if (type === 'print' || type === 'pdf') {
      window.print();
    } else {
      downloadCsvFile(
        'Departamentos_SIFYGSA.csv',
        [
          'Código',
          'Nombre del Departamento',
          'Titular / Responsable',
          'Colaboradores Activos',
          'Empresa',
          'Sede Principal',
          'Estatus'
        ],
        filteredDepartments.map((d) => [
          d.code,
          d.name,
          d.lead,
          d.liveEmployeeCount,
          d.subsidiary,
          d.location,
          d.status === 'active' ? 'Activo' : 'Inactivo'
        ])
      );
      logHrAuditAction({
        actionType: 'Exportación Excel',
        targetRecord: `Catálogo de Departamentos (${filteredDepartments.length} áreas)`,
        details: 'Descarga de archivo Departamentos_SIFYGSA.csv.',
        newValue: 'Departamentos_SIFYGSA.csv',
        severity: 'normal'
      });
      showToast('¡Excel descargado!', 'success');
    }
  };

  const selectedDetailEnriched = useMemo(() => {
    if (!currentDepartment) return null;
    return enrichedDepartments.find((d) => d.id === currentDepartment.id) || null;
  }, [currentDepartment, enrichedDepartments]);

  const previewTheme = getDepartmentTheme(formCode || formName, formLocation, formColor);

  return (
    <div className="rrhh-dept-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastType === 'success' ? '#047857' : '#D97706',
            color: '#FFFFFF',
            padding: '11px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 700,
            border: toastType === 'success' ? '1px solid #34D399' : '1px solid #FBBF24'
          }}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5" style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle className="w-5 h-5" style={{ flexShrink: 0 }} />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ENCABEZADO EJECUTIVO LIMPIO (ESTÁNDAR SIFYGSA SUITE)                   */}
      {/* ========================================================================= */}
      <div className="rrhh-wizard-header">
        <div>
          <nav aria-label="Migas de pan" className="rrhh-wizard-breadcrumbs">
            <span>Recursos Humanos</span>
            <span>/</span>
            <span>Catálogos</span>
            <span>/</span>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {activeCatalogTab === 'extensiones' ? 'Extensiones Telefónicas' : 'Departamentos'}
            </strong>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              className="rrhh-dept-icon-badge is-tonal"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                '--dept-accent': '#1D4ED8'
              } as React.CSSProperties}
            >
              {activeCatalogTab === 'extensiones' ? (
                <PhoneCall className="w-5 h-5" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="rrhh-wizard-title">
                {activeCatalogTab === 'extensiones' ? 'Extensiones Telefónicas' : 'Departamentos'}
              </h1>
              <p className="rrhh-wizard-subtitle">
                {activeCatalogTab === 'extensiones'
                  ? 'Extensiones internas por área.'
                  : 'Áreas oficiales, titulares y plantilla.'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              setActiveCatalogTab(activeCatalogTab === 'departamentos' ? 'extensiones' : 'departamentos')
            }
            className="rrhh-btn-outline"
            style={
              activeCatalogTab === 'extensiones'
                ? {
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    backgroundColor: 'var(--brand-50)'
                  }
                : undefined
            }
          >
            <PhoneCall className="w-4 h-4" />
            <span>
              {activeCatalogTab === 'extensiones' ? 'Volver a Departamentos' : 'Extensiones Telefónicas'}
            </span>
          </button>

          {activeCatalogTab === 'departamentos' && (
            <button type="button" onClick={handleOpenCreate} className="rrhh-btn-primary">
              <Plus className="w-4 h-4" />
              <span>Crear Departamento</span>
            </button>
          )}
        </div>
      </div>

      {activeCatalogTab === 'extensiones' ? (
        <ExtensionsCatalogView departments={departments.map((d) => d.name)} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. TARJETAS KPI SOBRIAS Y SINCRONIZADAS CON LA PLANTILLA REAL             */}
          {/* ========================================================================= */}
          <div className="rrhh-dept-kpis">
            <div className="rrhh-dept-kpi-card">
              <div
                className="rrhh-dept-icon-badge is-tonal"
                style={{ width: '40px', height: '40px', borderRadius: '10px', '--dept-accent': '#1D4ED8' } as React.CSSProperties}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Departamentos
                </div>
                <div style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {departments.length} Áreas
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeDepartmentsCount} activas en operación
                </div>
              </div>
            </div>

            <div className="rrhh-dept-kpi-card">
              <div
                className="rrhh-dept-icon-badge is-tonal"
                style={{ width: '40px', height: '40px', borderRadius: '10px', '--dept-accent': '#059669' } as React.CSSProperties}
              >
                <Users className="w-5 h-5" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Plantilla Activa Real
                </div>
                <div style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {totalLiveEmployees} Personas
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--success-text)', fontWeight: 600, marginTop: '2px' }}>
                  Sincronizado con Directorio
                </div>
              </div>
            </div>

            <div className="rrhh-dept-kpi-card">
              <div
                className="rrhh-dept-icon-badge is-tonal"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  '--dept-accent': largestDepartment?.theme.accent || '#0E7490'
                } as React.CSSProperties}
              >
                <Award className="w-5 h-5" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Área con Mayor Frente
                </div>
                <div
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.25
                  }}
                >
                  {largestDepartment
                    ? `${largestDepartment.name} (${largestDepartment.liveEmployeeCount})`
                    : 'Sin datos'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {largestDepartment && totalLiveEmployees > 0
                    ? `${Math.round((largestDepartment.liveEmployeeCount / totalLiveEmployees) * 100)}% de la plantilla total`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="rrhh-dept-kpi-card">
              <div
                className="rrhh-dept-icon-badge is-tonal"
                style={{ width: '40px', height: '40px', borderRadius: '10px', '--dept-accent': '#475569' } as React.CSSProperties}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cobertura de Sedes
                </div>
                <div style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {availableSites.length} {availableSites.length === 1 ? 'Sede' : 'Sedes'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {availableSites.slice(0, 3).join(' · ')}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. BARRA DE VISTAS RÁPIDAS Y PERSONALIZADAS POR USUARIO                   */}
          {/* ========================================================================= */}
          <div className="rrhh-dept-views-bar">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '2px' }}>
                Vistas:
              </span>
              {allSavedViews.map((view) => {
                const isActive = activeSavedViewId === view.id;
                return (
                  <span key={view.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => applySavedView(view)}
                      className={`rrhh-dept-view-pill ${isActive ? 'is-active' : ''}`}
                    >
                      <span>{view.name}</span>
                      {!view.builtIn && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Eliminar vista ${view.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomView(view.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              handleDeleteCustomView(view.id);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            opacity: 0.78,
                            marginLeft: '2px'
                          }}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  </span>
                );
              })}
            </div>

            {isSavingView ? (
              <form
                onSubmit={handleSaveCustomView}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Nombre de tu vista (ej. Sede Mina)..."
                  className="input-text"
                  style={{ height: '30px', fontSize: '0.74rem', width: '210px', padding: '0 8px' }}
                  autoFocus
                />
                <button type="submit" className="rrhh-btn-primary" style={{ padding: '0.32rem 0.7rem', fontSize: '0.73rem' }}>
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSavingView(false);
                    setNewViewName('');
                  }}
                  className="rrhh-btn-outline"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem' }}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsSavingView(true)}
                className="rrhh-dept-action-btn"
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                title="Guarda tu combinación actual de filtros y ordenamiento"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Guardar vista personal</span>
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 4. BARRA DE HERRAMIENTAS, FILTROS ACTIVOS Y PERSONALIZACIÓN               */}
          {/* ========================================================================= */}
          <div className="rrhh-dept-toolbar">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.55rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowFiltersPanel((prev) => !prev);
                  setShowColumnsPanel(false);
                }}
                className="rrhh-btn-outline"
                style={{
                  padding: '0.4rem 0.78rem',
                  fontSize: '0.76rem',
                  ...(showFiltersPanel || activeFiltersCount > 0
                    ? {
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)',
                        backgroundColor: 'var(--brand-50)'
                      }
                    : {})
                }}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowColumnsPanel((prev) => !prev);
                  setShowFiltersPanel(false);
                }}
                className="rrhh-btn-outline"
                style={{
                  padding: '0.4rem 0.78rem',
                  fontSize: '0.76rem',
                  ...(showColumnsPanel
                    ? {
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)',
                        backgroundColor: 'var(--brand-50)'
                      }
                    : {})
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Personalizar</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  borderLeft: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  padding: '0 0.45rem'
                }}
              >
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleExport('excel')}
                  title="Exportar a CSV / Excel"
                  style={{ color: '#059669' }}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleExport('pdf')}
                  title="Exportar / Imprimir PDF"
                  style={{ color: '#DC2626' }}
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleExport('print')}
                  title="Imprimir Catálogo"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={statusFilter === 'all'}
                  onChange={(e) => {
                    setStatusFilter(e.target.checked ? 'all' : 'active');
                    setActiveSavedViewId('custom');
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span>Mostrar inactivos</span>
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.7rem' }}>
              {/* Buscador */}
              <div style={{ position: 'relative', width: '250px', maxWidth: '100%' }}>
                <Search
                  className="w-3.5 h-3.5 text-muted"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Buscar área, código, titular o ext..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '30px', paddingRight: searchQuery ? '26px' : '10px', height: '34px', fontSize: '0.78rem', width: '100%' }}
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
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Toggle Lista / Tarjetas */}
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  backgroundColor: 'var(--surface-alt)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}
              >
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setViewMode('list')}
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none'
                  }}
                  title="Vista Tabla"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setViewMode('cards')}
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: viewMode === 'cards' ? 'var(--surface)' : 'transparent',
                    color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'cards' ? 'var(--shadow-xs)' : 'none'
                  }}
                  title="Vista Tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.03em'
                }}
              >
                TOTAL: <span style={{ color: 'var(--primary)' }}>{filteredDepartments.length}</span>
              </div>
            </div>
          </div>

          {/* Panel desplegable de Filtros Multi-Campo */}
          {showFiltersPanel && (
            <div className="rrhh-dept-filter-panel">
              <div className="rrhh-dept-filter-grid">
                <div className="rrhh-dept-filter-field">
                  <label className="rrhh-dept-filter-label" htmlFor="dept-filter-site">
                    Sede Principal
                  </label>
                  <select
                    id="dept-filter-site"
                    value={selectedSite}
                    onChange={(e) => {
                      setSelectedSite(e.target.value);
                      setActiveSavedViewId('custom');
                    }}
                    className="rrhh-dept-filter-select"
                  >
                    <option value="todas">Todas las sedes ({availableSites.length})</option>
                    {availableSites.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rrhh-dept-filter-field">
                  <label className="rrhh-dept-filter-label" htmlFor="dept-filter-headcount">
                    Tamaño de Plantilla
                  </label>
                  <select
                    id="dept-filter-headcount"
                    value={headcountFilter}
                    onChange={(e) => {
                      setHeadcountFilter(e.target.value as HeadcountFilter);
                      setActiveSavedViewId('custom');
                    }}
                    className="rrhh-dept-filter-select"
                  >
                    {(Object.keys(HEADCOUNT_LABELS) as HeadcountFilter[]).map((key) => (
                      <option key={key} value={key}>
                        {HEADCOUNT_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rrhh-dept-filter-field">
                  <label className="rrhh-dept-filter-label" htmlFor="dept-filter-status">
                    Estado Operativo
                  </label>
                  <select
                    id="dept-filter-status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as StatusFilter);
                      setActiveSavedViewId('custom');
                    }}
                    className="rrhh-dept-filter-select"
                  >
                    {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
                      <option key={key} value={key}>
                        {STATUS_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rrhh-dept-filter-field">
                  <label className="rrhh-dept-filter-label" htmlFor="dept-filter-ext">
                    Extensiones Telefónicas
                  </label>
                  <select
                    id="dept-filter-ext"
                    value={extensionFilter}
                    onChange={(e) => {
                      setExtensionFilter(e.target.value as ExtensionFilter);
                      setActiveSavedViewId('custom');
                    }}
                    className="rrhh-dept-filter-select"
                  >
                    {(Object.keys(EXTENSION_LABELS) as ExtensionFilter[]).map((key) => (
                      <option key={key} value={key}>
                        {EXTENSION_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rrhh-dept-filter-field">
                  <label className="rrhh-dept-filter-label" htmlFor="dept-filter-lead">
                    Titular / Responsable
                  </label>
                  <select
                    id="dept-filter-lead"
                    value={selectedLead}
                    onChange={(e) => {
                      setSelectedLead(e.target.value);
                      setActiveSavedViewId('custom');
                    }}
                    className="rrhh-dept-filter-select"
                  >
                    <option value="todos">Todos los titulares</option>
                    {availableLeads.map((lead) => (
                      <option key={lead} value={lead}>
                        {lead}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Ordenar por:
                  </span>
                  {(
                    [
                      { key: 'code', label: 'Código' },
                      { key: 'name', label: 'Nombre' },
                      { key: 'employeeCount', label: 'Plantilla' },
                      { key: 'location', label: 'Sede' }
                    ] as const
                  ).map((opt) => {
                    const active = sortField === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleSort(opt.key)}
                        className={`rrhh-dept-col-pill ${active ? 'is-on' : ''}`}
                      >
                        {opt.label} {active ? (sortAsc ? '↑' : '↓') : ''}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsSavingView(true)}
                    className="rrhh-dept-action-btn"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Guardar como vista</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="rrhh-dept-action-btn"
                    style={{ color: 'var(--danger)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Panel de Personalización de Columnas y Densidad (persistente por usuario) */}
          {showColumnsPanel && (
            <div className="rrhh-dept-filter-panel">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <span className="rrhh-dept-filter-label">Columnas visibles en tabla</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {COLUMN_META.map((col) => {
                      const on = visibleCols[col.key];
                      return (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => toggleColumnVisibility(col.key)}
                          className={`rrhh-dept-col-pill ${on ? 'is-on' : ''}`}
                        >
                          {on && <Check className="w-3.5 h-3.5" />}
                          <span>{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <span className="rrhh-dept-filter-label">Densidad de filas</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setTableDensity('comfortable')}
                      className={`rrhh-dept-col-pill ${density === 'comfortable' ? 'is-on' : ''}`}
                    >
                      Cómoda (con resumen)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableDensity('compact')}
                      className={`rrhh-dept-col-pill ${density === 'compact' ? 'is-on' : ''}`}
                    >
                      Compacta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chips de filtros activos (siempre visibles al filtrar) */}
          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Filtros activos:
              </span>
              {selectedSite !== 'todas' && (
                <span className="rrhh-dept-active-chip">
                  Sede: {selectedSite}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSite('todas');
                      setActiveSavedViewId('custom');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}
                    aria-label="Quitar filtro de sede"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {headcountFilter !== 'todos' && (
                <span className="rrhh-dept-active-chip">
                  Plantilla: {HEADCOUNT_LABELS[headcountFilter]}
                  <button
                    type="button"
                    onClick={() => {
                      setHeadcountFilter('todos');
                      setActiveSavedViewId('custom');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}
                    aria-label="Quitar filtro de plantilla"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {extensionFilter !== 'todas' && (
                <span className="rrhh-dept-active-chip">
                  Extensiones: {EXTENSION_LABELS[extensionFilter]}
                  <button
                    type="button"
                    onClick={() => {
                      setExtensionFilter('todas');
                      setActiveSavedViewId('custom');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}
                    aria-label="Quitar filtro de extensiones"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'active' && (
                <span className="rrhh-dept-active-chip">
                  Estado: {STATUS_LABELS[statusFilter]}
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('active');
                      setActiveSavedViewId('custom');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}
                    aria-label="Quitar filtro de estado"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedLead !== 'todos' && (
                <span className="rrhh-dept-active-chip">
                  Titular: {selectedLead}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLead('todos');
                      setActiveSavedViewId('custom');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}
                    aria-label="Quitar filtro de titular"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--danger)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. TABLA O CUADRÍCULA DE DEPARTAMENTOS CON CONTENIDO CORPORATIVO          */}
          {/* ========================================================================= */}
          {viewMode === 'list' ? (
            <div
              className="card"
              style={{
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                padding: 0
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr
                      className="rrhh-corp-thead"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      <th
                        style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => toggleSort('name')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Departamento</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                        </div>
                      </th>
                      {visibleCols.code && (
                        <th
                          style={{ padding: '12px 14px', width: '115px', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => toggleSort('code')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Código</span>
                            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                          </div>
                        </th>
                      )}
                      {visibleCols.lead && <th style={{ padding: '12px 14px' }}>Titular / Responsable</th>}
                      {visibleCols.headcount && (
                        <th
                          style={{ padding: '12px 14px', width: '185px', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => toggleSort('employeeCount')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Plantilla Real</span>
                            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                          </div>
                        </th>
                      )}
                      {visibleCols.extensions && (
                        <th style={{ padding: '12px 14px', width: '130px' }}>Extensiones</th>
                      )}
                      {visibleCols.location && (
                        <th
                          style={{ padding: '12px 14px', width: '160px', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => toggleSort('location')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Sede Principal</span>
                            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                          </div>
                        </th>
                      )}
                      {visibleCols.status && (
                        <th style={{ padding: '12px 14px', width: '92px', textAlign: 'center' }}>Estado</th>
                      )}
                      <th style={{ padding: '12px 16px', width: '142px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((dept, index) => {
                      const isEven = index % 2 === 0;
                      const barPct = Math.max(
                        dept.liveEmployeeCount > 0 ? 8 : 0,
                        Math.round((dept.liveEmployeeCount / maxDeptCount) * 100)
                      );
                      const branchLabel = getDepartmentBranchLabel(dept);
                      const cellPadY = density === 'compact' ? '8px' : '12px';

                      return (
                        <tr
                          key={dept.id}
                          className="rrhh-dept-row"
                          style={{
                            backgroundColor: isEven ? 'var(--surface)' : 'var(--surface-alt)',
                            borderBottom: '1px solid var(--border-subtle)'
                          }}
                        >
                          {/* Departamento + Insignia tonal + Resumen operativo */}
                          <td style={{ padding: `${cellPadY} 16px`, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                className="rrhh-dept-icon-badge is-tonal"
                                style={{
                                  width: density === 'compact' ? '30px' : '36px',
                                  height: density === 'compact' ? '30px' : '36px',
                                  '--dept-accent': dept.theme.accent
                                } as React.CSSProperties}
                                title={dept.theme.label}
                              >
                                {renderDepartmentIcon(dept.code || dept.name, 'w-4 h-4')}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                                    {dept.name}
                                  </span>
                                  {branchLabel && (
                                    <span
                                      style={{
                                        fontSize: '0.66rem',
                                        fontWeight: 600,
                                        padding: '1px 7px',
                                        borderRadius: '999px',
                                        backgroundColor: 'var(--surface-alt)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border)'
                                      }}
                                    >
                                      {branchLabel}
                                    </span>
                                  )}
                                </div>
                                {density === 'comfortable' && (
                                  <div
                                    style={{
                                      fontSize: '0.71rem',
                                      color: 'var(--text-muted)',
                                      marginTop: '2px',
                                      maxWidth: '340px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {dept.description || `${dept.subsidiary} · Área operativa oficial`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Código Oficial completo con punto de color */}
                          {visibleCols.code && (
                            <td style={{ padding: `${cellPadY} 14px`, whiteSpace: 'nowrap' }}>
                              <span className="rrhh-dept-code-chip">
                                <span
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    backgroundColor: dept.theme.accent,
                                    flexShrink: 0
                                  }}
                                />
                                {dept.code}
                              </span>
                            </td>
                          )}

                          {/* Titular / Responsable con avatar de iniciales */}
                          {visibleCols.lead && (
                            <td style={{ padding: `${cellPadY} 14px` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                                <span
                                  className="rrhh-dept-lead-avatar"
                                  style={{ '--dept-accent': dept.theme.accent } as React.CSSProperties}
                                >
                                  {getLeadInitials(dept.lead)}
                                </span>
                                <span
                                  style={{
                                    color: 'var(--text-primary)',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {dept.lead}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Plantilla Real clickeable + Barra proporcional */}
                          {visibleCols.headcount && (
                            <td
                              style={{ padding: `${cellPadY} 14px`, cursor: 'pointer' }}
                              onClick={() => handleOpenDetail(dept)}
                              title="Clic para ver integrantes de esta área"
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: '0.78rem',
                                      color: dept.liveEmployeeCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)'
                                    }}
                                  >
                                    {dept.liveEmployeeCount} {dept.liveEmployeeCount === 1 ? 'persona' : 'personas'}
                                  </span>
                                  {totalLiveEmployees > 0 && (
                                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                      {Math.round((dept.liveEmployeeCount / totalLiveEmployees) * 100)}%
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    width: '100%',
                                    height: '5px',
                                    borderRadius: '999px',
                                    backgroundColor: 'var(--divider)',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${barPct}%`,
                                      height: '100%',
                                      borderRadius: '999px',
                                      backgroundColor: dept.theme.accent,
                                      transition: 'width 0.35s ease'
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Extensiones Telefónicas del área */}
                          {visibleCols.extensions && (
                            <td style={{ padding: `${cellPadY} 14px`, whiteSpace: 'nowrap' }}>
                              {dept.extensions.length > 0 ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--surface-alt)',
                                      border: '1px solid var(--border)',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '0.71rem',
                                      fontWeight: 700,
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <PhoneCall className="w-3 h-3" style={{ color: dept.theme.accent }} />
                                    {dept.extensions[0].extension}
                                  </span>
                                  {dept.extensions.length > 1 && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                      +{dept.extensions.length - 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                          )}

                          {/* Sede Principal */}
                          {visibleCols.location && (
                            <td style={{ padding: `${cellPadY} 14px`, whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.77rem'
                                }}
                              >
                                <MapPin className="w-3.5 h-3.5 text-muted" style={{ flexShrink: 0 }} />
                                {dept.location}
                              </span>
                            </td>
                          )}

                          {/* Estado */}
                          {visibleCols.status && (
                            <td style={{ padding: `${cellPadY} 14px`, textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '2px 9px',
                                  borderRadius: '999px',
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  backgroundColor: dept.status === 'active' ? 'var(--success-bg)' : 'var(--surface-alt)',
                                  color: dept.status === 'active' ? 'var(--success-text)' : 'var(--text-secondary)',
                                  border: dept.status === 'active' ? '1px solid var(--success-border)' : '1px solid var(--border)'
                                }}
                              >
                                <span
                                  style={{
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    backgroundColor: dept.status === 'active' ? 'var(--success)' : 'var(--text-muted)'
                                  }}
                                />
                                {dept.status === 'active' ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          )}

                          {/* Acciones limpias */}
                          <td style={{ padding: `${cellPadY} 16px`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(dept)}
                                className="rrhh-dept-action-btn"
                                title="Ver detalle y equipo asignado"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(dept)}
                                className="rrhh-dept-action-btn"
                                title="Editar departamento y color"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDepartments.length === 0 && (
                      <tr>
                        <td
                          colSpan={2 + Object.values(visibleCols).filter(Boolean).length}
                          style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                            <span>No se encontraron departamentos con los filtros aplicados.</span>
                            <button type="button" onClick={resetAllFilters} className="rrhh-dept-action-btn">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restablecer filtros</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="rrhh-corp-table-footer">
                <span>
                  Mostrando <strong>{filteredDepartments.length}</strong> de <strong>{departments.length}</strong>{' '}
                  departamentos
                </span>
                <span className="rrhh-corp-table-footer-meta">
                  <span className="rrhh-corp-live-dot" />
                  Fuente: Directorio de Personal · {totalLiveEmployees} colaboradores activos · SIFYGSA S.A. de C.V.
                </span>
              </div>
            </div>
          ) : (
            /* Vista en Cuadrícula / Tarjetas con Franja Superior de Color */
            <div className="rrhh-dept-cards-grid">
              {filteredDepartments.map((dept) => {
                const branchLabel = getDepartmentBranchLabel(dept);
                const barPct = Math.max(
                  dept.liveEmployeeCount > 0 ? 8 : 0,
                  Math.round((dept.liveEmployeeCount / maxDeptCount) * 100)
                );

                return (
                  <div key={dept.id} className="rrhh-dept-card">
                    {/* Franja superior con color oficial */}
                    <div style={{ height: '4px', backgroundColor: dept.theme.accent }} />

                    <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            className="rrhh-dept-icon-badge is-tonal"
                            style={{ width: '32px', height: '32px', '--dept-accent': dept.theme.accent } as React.CSSProperties}
                          >
                            {renderDepartmentIcon(dept.code || dept.name, 'w-4 h-4')}
                          </div>
                          <span className="rrhh-dept-code-chip">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dept.theme.accent }} />
                            {dept.code}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: dept.status === 'active' ? 'var(--success-text)' : 'var(--text-muted)'
                          }}
                        >
                          ● {dept.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {dept.name}
                          </h3>
                          {branchLabel && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: 'var(--surface-alt)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              {branchLabel}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45, minHeight: '2.15rem' }}>
                          {dept.description || 'Área operativa SIFYGSA.'}
                        </p>
                      </div>

                      {/* Barra de plantilla real */}
                      <div
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '10px',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {dept.liveEmployeeCount} {dept.liveEmployeeCount === 1 ? 'colaborador' : 'colaboradores'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {dept.location}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', borderRadius: '999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${barPct}%`, height: '100%', borderRadius: '999px', backgroundColor: dept.theme.accent }} />
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.75rem',
                          marginTop: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Titular
                          </div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dept.lead}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(dept)}
                            className="rrhh-dept-action-btn"
                            title="Ver equipo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dept)}
                            className="rrhh-dept-action-btn"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR DEPARTAMENTO (CON SELECTOR DE COLOR CORPORATIVO)    */}
      {/* ========================================================================= */}
      {(isCreateModalOpen || (isEditModalOpen && currentDepartment)) && (
        <div
          className="rrhh-modal-backdrop"
          onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          <div
            className="rrhh-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px', padding: 0, textAlign: 'left', overflow: 'hidden' }}
          >
            {/* Franja superior con color elegido en vivo */}
            <div style={{ height: '6px', backgroundColor: previewTheme.accent }} />

            <div
              style={{
                padding: '1rem 1.35rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                backgroundColor: 'var(--surface-alt)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className="rrhh-dept-icon-badge"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: previewTheme.accent
                  }}
                >
                  {renderDepartmentIcon(formCode || formName, 'w-5 h-5')}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isCreateModalOpen ? 'Crear Departamento' : 'Editar Departamento'}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {isCreateModalOpen
                      ? 'Sincronizado automáticamente con Registro, Organigrama y Directorio.'
                      : currentDepartment?.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={isCreateModalOpen ? handleSaveNew : handleSaveEdit}
              style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
            >
              <div className="rrhh-field">
                <label className="rrhh-field-label">
                  <span>Nombre del Departamento</span>
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Automatización & SCADA"
                  value={formName}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizeCleanText(e.target.value, 65);
                    if (hadInvalid) showToast('¡Carácter inválido!', 'warning');
                    setFormName(value);
                    if (isCreateModalOpen && !formCodeTouched) {
                      setFormCode(suggestDepartmentCode(value));
                    }
                  }}
                  className="input-text"
                  required
                  autoFocus
                />
              </div>

              <div className="rrhh-grid-2">
                <div className="rrhh-field">
                  <div className="rrhh-field-label-row">
                    <label className="rrhh-field-label">Código / Sigla</label>
                    <span className="rrhh-field-hint">Nemotécnico</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. AUTO"
                    value={formCode}
                    onChange={(e) => {
                      setFormCodeTouched(true);
                      setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10));
                    }}
                    className="input-text"
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: previewTheme.accent }}
                  />
                </div>

                <div className="rrhh-field">
                  <label className="rrhh-field-label">Sede Principal</label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '38px' }}
                  >
                    {SITE_OPTIONS.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rrhh-field">
                <label className="rrhh-field-label">Titular / Responsable del Área</label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Carlos Hernández Vega"
                  value={formLead}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizePersonName(e.target.value);
                    if (hadInvalid) showToast('¡Solo letras!', 'warning');
                    setFormLead(value);
                  }}
                  className="input-text"
                />
              </div>

              {/* Selector de Color Corporativo del Departamento */}
              <div className="rrhh-field">
                <div className="rrhh-field-label-row">
                  <label className="rrhh-field-label" style={{ gap: '5px' }}>
                    <Palette className="w-3.5 h-3.5" style={{ color: previewTheme.accent }} />
                    <span>Color Identificador del Área</span>
                  </label>
                  <span className="rrhh-field-hint" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formColor}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '7px',
                    padding: '0.6rem 0.7rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {DEPARTMENT_COLOR_SWATCHES.map((swatch) => {
                    const selected = formColor.toUpperCase() === swatch.hex.toUpperCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setFormColor(swatch.hex)}
                        className={`rrhh-color-swatch ${selected ? 'is-selected' : ''}`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                        aria-label={`Color ${swatch.name}`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rrhh-field">
                <label className="rrhh-field-label">Descripción u Objetivo Operativo</label>
                <textarea
                  rows={2}
                  placeholder="Funciones clave, alcance técnico o cuadrillas a su cargo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input-text"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <span>Departamento activo (disponible en Registro del Personal)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="rrhh-btn-outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="rrhh-btn-primary">
                  {isCreateModalOpen ? 'Guardar Departamento' : 'Actualizar Departamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLE DEL DEPARTAMENTO + PLANTILLA REAL                      */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedDetailEnriched && (
        <div className="rrhh-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div
            className="rrhh-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', padding: 0, textAlign: 'left', overflow: 'hidden' }}
          >
            {/* Cabecera con color del departamento */}
            <div style={{ height: '6px', backgroundColor: selectedDetailEnriched.theme.accent }} />
            <div
              style={{
                padding: '1rem 1.35rem',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className="rrhh-dept-icon-badge"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '11px',
                    backgroundColor: selectedDetailEnriched.theme.accent
                  }}
                >
                  {renderDepartmentIcon(selectedDetailEnriched.code || selectedDetailEnriched.name, 'w-5 h-5')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedDetailEnriched.name}
                    </h3>
                    <span className="rrhh-dept-code-chip">
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: selectedDetailEnriched.theme.accent }} />
                      {selectedDetailEnriched.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedDetailEnriched.subsidiary} · {selectedDetailEnriched.location}
                  </div>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rrhh-grid-2">
                <div style={{ backgroundColor: 'var(--surface-alt)', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Titular / Responsable
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px' }}>
                    {selectedDetailEnriched.lead}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--surface-alt)', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Plantilla Activa Real
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: selectedDetailEnriched.theme.accent, marginTop: '3px' }}>
                    {selectedDetailEnriched.liveEmployeeCount}{' '}
                    {selectedDetailEnriched.liveEmployeeCount === 1 ? 'Colaborador' : 'Colaboradores'}
                  </div>
                </div>
              </div>

              {selectedDetailEnriched.description && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Misión / Alcance Operativo
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                    {selectedDetailEnriched.description}
                  </p>
                </div>
              )}

              {/* Extensiones telefónicas del área */}
              {selectedDetailEnriched.extensions.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Extensiones Telefónicas ({selectedDetailEnriched.extensions.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedDetailEnriched.extensions.map((ext) => (
                      <span
                        key={ext.id}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '8px',
                          backgroundColor: selectedDetailEnriched.theme.softBg,
                          color: selectedDetailEnriched.theme.accent,
                          border: `1px solid ${selectedDetailEnriched.theme.softBorder}`,
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        Ext. {ext.extension} · {ext.assignedTo || ext.areaLabel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista real de integrantes del departamento */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Integrantes Adscritos ({selectedDetailEnriched.members.length})
                </div>
                {selectedDetailEnriched.members.length > 0 ? (
                  <div
                    style={{
                      maxHeight: '210px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      paddingRight: '4px'
                    }}
                  >
                    {selectedDetailEnriched.members.map((emp) => (
                      <div
                        key={emp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '7px 10px',
                          borderRadius: '9px',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              backgroundColor: selectedDetailEnriched.theme.accent,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {emp.initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {emp.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {emp.position}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            flexShrink: 0
                          }}
                        >
                          {emp.id}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center' }}>
                    Sin colaboradores adscritos actualmente en esta área.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '4px' }}>
                <button type="button" className="rrhh-btn-outline" onClick={() => setIsDetailModalOpen(false)}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="rrhh-btn-primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedDetailEnriched);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Departamento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
