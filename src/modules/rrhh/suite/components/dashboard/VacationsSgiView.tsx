import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Printer,
  Download,
  Upload,
  Search,
  Plus,
  Users,
  FileText,
  X,
  FileSpreadsheet,
  Check,
  Award,
  ArrowLeft,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Employee } from '../../types';
import {
  useSyncedEmployees,
  sanitizePersonName,
  sanitizeCleanText,
  formatCurrencyMask,
  logHrAuditAction
} from '../../utils/formShield';

export interface VacationRecord {
  id: string;
  employeeName: string;
  department: string;
  position: string;
  hireDate: string;
  antiquityText: string;
  antiquityYears: number;
  periodYear: string;
  daysByLaw: number; // Días que corresponden según LFT
  daysTaken: number; // Días ya gozados
  daysRemaining: number; // Días que restan
  lastRequestDate?: string;
  status: 'active' | 'exhausted' | 'pending';
}

// Datos iniciales extraídos directamente del archivo oficial "CONTROL DE VACACIONES DEL PERSONAL.xlsx"
export const INITIAL_VACATIONS: VacationRecord[] = [
  {
    id: 'vac-01',
    employeeName: 'Adrián José Rodríguez Hernández',
    department: 'Servicios',
    position: 'Supervisor de Obra Sr',
    hireDate: '08/08/2022',
    antiquityText: '4 años 1 mes 19 días',
    antiquityYears: 4,
    periodYear: '2025 - 2026',
    daysByLaw: 18,
    daysTaken: 10,
    daysRemaining: 8,
    lastRequestDate: '15/09/2026',
    status: 'active'
  },
  {
    id: 'vac-02',
    employeeName: 'Agustín Anastacio Martínez',
    department: 'Dirección',
    position: 'Director General',
    hireDate: '15/01/2019',
    antiquityText: '7 años 8 meses',
    antiquityYears: 7,
    periodYear: '2025 - 2026',
    daysByLaw: 22,
    daysTaken: 12,
    daysRemaining: 10,
    lastRequestDate: '20/07/2026',
    status: 'active'
  },
  {
    id: 'vac-03',
    employeeName: 'Alejandra Sujias Ricardez',
    department: 'Recursos Humanos',
    position: 'Coordinadora de Nóminas',
    hireDate: '01/07/2024',
    antiquityText: '2 años 1 mes 27 días',
    antiquityYears: 2,
    periodYear: '2025 - 2026',
    daysByLaw: 14,
    daysTaken: 11,
    daysRemaining: 3,
    lastRequestDate: '10/08/2026',
    status: 'active'
  },
  {
    id: 'vac-04',
    employeeName: 'Amado Reyes Peña',
    department: 'Infraestructura',
    position: 'Técnico de Mantenimiento',
    hireDate: '12/04/2026',
    antiquityText: '5 meses 14 días',
    antiquityYears: 0,
    periodYear: '2026 - 2027',
    daysByLaw: 12,
    daysTaken: 0,
    daysRemaining: 12,
    lastRequestDate: '—',
    status: 'active'
  },
  {
    id: 'vac-05',
    employeeName: 'Bartolo Torres Guarda',
    department: 'Operaciones Técnicas',
    position: 'Especialista en Sistemas F&G',
    hireDate: '05/08/2023',
    antiquityText: '3 años 1 mes 21 días',
    antiquityYears: 3,
    periodYear: '2025 - 2026',
    daysByLaw: 16,
    daysTaken: 8,
    daysRemaining: 8,
    lastRequestDate: '02/09/2026',
    status: 'active'
  },
  {
    id: 'vac-06',
    employeeName: 'Basilio Mendoza Ramírez',
    department: 'Almacén',
    position: 'Encargado de Suministros y EPP',
    hireDate: '18/01/2022',
    antiquityText: '4 años 8 meses 8 días',
    antiquityYears: 4,
    periodYear: '2025 - 2026',
    daysByLaw: 18,
    daysTaken: 18,
    daysRemaining: 0,
    lastRequestDate: '14/06/2026',
    status: 'exhausted'
  },
  {
    id: 'vac-07',
    employeeName: 'Carlos Alberto Tun Culebro',
    department: 'Ingeniería',
    position: 'Diseñador de Planos de Detección',
    hireDate: '20/03/2023',
    antiquityText: '3 años 6 meses 4 días',
    antiquityYears: 3,
    periodYear: '2025 - 2026',
    daysByLaw: 16,
    daysTaken: 6,
    daysRemaining: 10,
    lastRequestDate: '04/05/2026',
    status: 'active'
  },
  {
    id: 'vac-08',
    employeeName: 'Christian del Carmen Pérez de los Santos',
    department: 'Seguridad HSE',
    position: 'Supervisor de Seguridad en Planta',
    hireDate: '18/05/2025',
    antiquityText: '1 año 4 meses',
    antiquityYears: 1,
    periodYear: '2025 - 2026',
    daysByLaw: 12,
    daysTaken: 4,
    daysRemaining: 8,
    lastRequestDate: '18/08/2026',
    status: 'active'
  },
  {
    id: 'vac-09',
    employeeName: 'Valeria Méndez Albores',
    department: 'Recursos Humanos',
    position: 'Gerente de Recursos Humanos',
    hireDate: '01/03/2020',
    antiquityText: '6 años 7 meses',
    antiquityYears: 6,
    periodYear: '2025 - 2026',
    daysByLaw: 22,
    daysTaken: 14,
    daysRemaining: 8,
    lastRequestDate: '10/07/2026',
    status: 'active'
  },
  {
    id: 'vac-10',
    employeeName: 'Sheyla Irais Troncoso Vidal',
    department: 'Recursos Humanos',
    position: 'Auxiliar de RRHH & Control de Asistencia',
    hireDate: '02/01/2023',
    antiquityText: '3 años 8 meses',
    antiquityYears: 3,
    periodYear: '2025 - 2026',
    daysByLaw: 16,
    daysTaken: 6,
    daysRemaining: 10,
    lastRequestDate: '06/04/2026',
    status: 'active'
  }
];

// Cálculo oficial de Ley Federal del Trabajo (Reforma Vacaciones Dignas 2023)
export const calculateLftDays = (years: number): number => {
  if (years < 1) return 12; // 1er año anticipado o estimado
  if (years === 1) return 12;
  if (years === 2) return 14;
  if (years === 3) return 16;
  if (years === 4) return 18;
  if (years === 5) return 20;
  if (years >= 6 && years <= 10) return 22;
  if (years >= 11 && years <= 15) return 24;
  if (years >= 16 && years <= 20) return 26;
  if (years >= 21 && years <= 25) return 28;
  return 30;
};



interface VacationsSgiViewProps {
  employees: Employee[];
}

const VACATIONS_STORAGE_KEY = 'sifygsa_erp_vacations_v1';

export const VacationsSgiView: React.FC<VacationsSgiViewProps> = ({ employees }) => {
  const syncedEmployees = useSyncedEmployees(employees);

  // Tabs: Matriz de Vacaciones, Formatos Oficiales SGI, Auditoría Documental SGI
  const [activeTab, setActiveTab] = useState<'matriz' | 'formatos' | 'auditoria'>('matriz');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('todos');
  const [vacationRecords, setVacationRecords] = useState<VacationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(VACATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_VACATIONS;
  });

  // Sincronizar en localStorage e incorporar nuevos empleados dados de alta
  useEffect(() => {
    setVacationRecords((prev) => {
      const existingNames = new Set(prev.map((r) => r.employeeName.toLowerCase()));
      const additions: VacationRecord[] = [];
      for (const emp of syncedEmployees) {
        if (!existingNames.has(emp.name.toLowerCase())) {
          additions.push({
            id: `vac-${emp.id}`,
            employeeName: emp.name,
            department: emp.department,
            position: emp.position,
            hireDate: emp.hireDate || new Date().toLocaleDateString('es-MX'),
            antiquityText: '1er Año (Nuevo Ingreso)',
            antiquityYears: 1,
            periodYear: '2026 - 2027',
            daysByLaw: 12,
            daysTaken: 0,
            daysRemaining: 12,
            lastRequestDate: '—',
            status: 'active'
          });
        }
      }
      const merged = additions.length > 0 ? [...additions, ...prev] : prev;
      try {
        localStorage.setItem(VACATIONS_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignore quota error
      }
      return merged;
    });
  }, [syncedEmployees]);

  // Selector de Formato Oficial Activo
  const [activeFormatCode, setActiveFormatCode] = useState<'SGI-FR-RH-06' | 'SGI-FR-RH-01' | 'SGI-FR-RH-02' | 'SGI-FR-RH-13' | 'SGI-FR-RH-15'>('SGI-FR-RH-06');

  // Estados del Formulario SGI-FR-RH-06 (Vacaciones)
  const [formEmployeeName, setFormEmployeeName] = useState(INITIAL_VACATIONS[0].employeeName);
  const [formPeriod, setFormPeriod] = useState('2025 - 2026');
  const [formDaysToTake, setFormDaysToTake] = useState<number | ''>(5);
  const [daysValidationError, setDaysValidationError] = useState<string | null>(null);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formExitDate, setFormExitDate] = useState('');
  const [formReturnDate, setFormReturnDate] = useState('');
  const [formApprover, setFormApprover] = useState('Ing. Miguel Ángel Guzmán Reyes');
  const [formHrReceiver, setFormHrReceiver] = useState('Valeria Méndez Albores (Gerente RRHH)');

  // Paginación interactiva de la Matriz de Colaboradores
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Estados Formatos Adicionales
  // SGI-FR-RH-01: Requisición de Personal
  const [reqPuesto, setReqPuesto] = useState('Técnico Instrumentista Sr.');
  const [reqArea, setReqArea] = useState('Operaciones Técnicas');
  const [reqMotivo, setReqMotivo] = useState('Incremento de Operaciones y Proyecto Refinería');
  const [reqSueldo, setReqSueldo] = useState('$24,000.00 MXN Mensual');
  const [reqEscolaridad, setReqEscolaridad] = useState('Ingeniería Mecatrónica / Electrónica / Afín');

  // SGI-FR-RH-02: Capacitación DC-3
  const [capCurso, setCapCurso] = useState('Seguridad en Espacios Confinados & Atmosferas Peligrosas');
  const [capInstructor, setCapInstructor] = useState('ICIC / Agente Capacitador Externo STPS');
  const [capHoras, setCapHoras] = useState('16 Horas Teórico-Prácticas');
  const [capFecha, setCapFecha] = useState('18 y 19 de Noviembre 2026');

  // SGI-FR-RH-15: Vale de No Adeudo
  const [adeudoEmp, setAdeudoEmp] = useState(INITIAL_VACATIONS[0].employeeName);
  const [adeudoMotivo, setAdeudoMotivo] = useState('Término de Contrato Laboral');
  const [adeudoFecha, setAdeudoFecha] = useState(new Date().toLocaleDateString('es-MX'));

  // Modales
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado de Importación CSV / Excel
  const [parsedImportRows, setParsedImportRows] = useState<Partial<VacationRecord>[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Buscar registro del colaborador seleccionado en el formulario
  const currentRecord = useMemo(() => {
    return (
      vacationRecords.find((v) => v.employeeName === formEmployeeName) ||
      vacationRecords[0]
    );
  }, [vacationRecords, formEmployeeName]);

  // Cálculos automáticos del formato de vacaciones
  const daysByLaw = currentRecord ? currentRecord.daysByLaw : 12;
  const daysTakenPreviously = currentRecord ? currentRecord.daysTaken : 0;
  const numericDaysToTake = typeof formDaysToTake === 'number' ? formDaysToTake : 0;
  const daysRemainingCalculated = Math.max(0, daysByLaw - daysTakenPreviously - numericDaysToTake);

  // Filtrado de la Matriz de Saldos
  const filteredRecords = useMemo(() => {
    return vacationRecords.filter((rec) => {
      const matchesDept = selectedDeptFilter === 'todos' || rec.department === selectedDeptFilter;
      const matchesSearch =
        rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.position.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [vacationRecords, searchQuery, selectedDeptFilter]);

  // Paginación y control de volumen para cientos de colaboradores
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, safeCurrentPage, rowsPerPage]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDeptFilterChange = (dept: string) => {
    setSelectedDeptFilter(dept);
    setCurrentPage(1);
  };

  // Formateador de fechas para reporte e impresión oficial SGI (DD/MM/AAAA)
  const formatPrintDate = (isoDate: string) => {
    if (!isoDate) return '—';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Cálculo inteligente y automático de calendario de ausencia
  const calculateVacationDates = (startDateStr: string, daysCount: number) => {
    if (!startDateStr || daysCount <= 0) return;
    try {
      const [year, month, day] = startDateStr.split('-').map(Number);
      if (!year || !month || !day) return;
      const start = new Date(year, month - 1, day);

      // 1. Último día laborado: día anterior (si cae en domingo, mover a sábado)
      const exit = new Date(start);
      exit.setDate(exit.getDate() - 1);
      if (exit.getDay() === 0) {
        exit.setDate(exit.getDate() - 1);
      }
      const exitYear = exit.getFullYear();
      const exitMonth = String(exit.getMonth() + 1).padStart(2, '0');
      const exitDay = String(exit.getDate()).padStart(2, '0');
      setFormExitDate(`${exitYear}-${exitMonth}-${exitDay}`);

      // 2. Término de vacaciones: fecha de inicio + (días - 1)
      const end = new Date(start);
      end.setDate(end.getDate() + (daysCount - 1));
      const endYear = end.getFullYear();
      const endMonth = String(end.getMonth() + 1).padStart(2, '0');
      const endDay = String(end.getDate()).padStart(2, '0');
      setFormEndDate(`${endYear}-${endMonth}-${endDay}`);

      // 3. Regreso a labores: día natural siguiente al término (si cae en domingo, mover a lunes)
      const returnDate = new Date(end);
      returnDate.setDate(returnDate.getDate() + 1);
      if (returnDate.getDay() === 0) {
        returnDate.setDate(returnDate.getDate() + 1);
      }
      const retYear = returnDate.getFullYear();
      const retMonth = String(returnDate.getMonth() + 1).padStart(2, '0');
      const retDay = String(returnDate.getDate()).padStart(2, '0');
      setFormReturnDate(`${retYear}-${retMonth}-${retDay}`);
    } catch (err) {
      console.error('Error calculando fechas automáticas:', err);
    }
  };

  // Manejador de selección de fecha de inicio
  const handleStartDateChange = (selectedDate: string) => {
    setFormStartDate(selectedDate);
    if (selectedDate) {
      const days = typeof formDaysToTake === 'number' && formDaysToTake > 0 ? formDaysToTake : 1;
      calculateVacationDates(selectedDate, days);
    }
  };

  // Anti-trucos: bloqueo de caracteres especiales, notación científica y símbolos
  const handleDaysKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Validación reactiva con auto-restablecimiento instantáneo (error corto: 2 a 3 palabras en rojo)
  const handleDaysToTakeChange = (rawVal: string) => {
    if (rawVal === '') {
      setFormDaysToTake('');
      setDaysValidationError(null);
      return;
    }

    const numVal = parseInt(rawVal, 10);
    const maxAllowed = currentRecord ? currentRecord.daysRemaining : 12;

    if (isNaN(numVal) || numVal <= 0 || numVal > maxAllowed) {
      // 1. Limpiar el campo AL INSTANTE para que el usuario pueda escribir de inmediato
      setFormDaysToTake('');

      // 2. Mensaje corto, preciso y concreto: 2 o máximo 3 palabras en rojo
      const errorMsg = numVal <= 0 ? '¡Mínimo 1 día!' : '¡Saldo excedido!';
      setDaysValidationError(errorMsg);

      // 3. El mensaje se oculta automáticamente tras 2.5 segundos
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      validationTimerRef.current = setTimeout(() => {
        setDaysValidationError(null);
      }, 2500);
      return;
    }

    // Valor válido
    setDaysValidationError(null);
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    setFormDaysToTake(numVal);

    // Recalcular fechas automáticamente si ya hay fecha de inicio seleccionada
    if (formStartDate) {
      calculateVacationDates(formStartDate, numVal);
    }
  };

  // Totales y métricas orientadas a colaboradores (Ciclo Vigente 2025-2026)
  const activeCount = useMemo(() => vacationRecords.filter((r) => r.daysRemaining > 0).length, [vacationRecords]);
  const exhaustedCount = useMemo(() => vacationRecords.filter((r) => r.daysRemaining === 0).length, [vacationRecords]);
  const avgDaysByLaw = useMemo(() => {
    if (vacationRecords.length === 0) return 0;
    const sum = vacationRecords.reduce((acc, r) => acc + r.daysByLaw, 0);
    return Math.round((sum / vacationRecords.length) * 10) / 10;
  }, [vacationRecords]);

  // Registrar solicitud y descontar saldo
  const handleSaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDaysToTake || Number(formDaysToTake) <= 0) {
      setDaysValidationError('¡Ingrese días!');
      return;
    }
    if (!formStartDate || !formEndDate || !formExitDate || !formReturnDate) {
      showToast('¡Seleccione el calendario de fechas completo!');
      return;
    }
    const daysNum = Number(formDaysToTake);
    const prevRem = currentRecord ? currentRecord.daysRemaining : 12;
    const nextRem = Math.max(0, prevRem - daysNum);

    setVacationRecords((prev) => {
      const updated = prev.map((rec) => {
        if (rec.employeeName === formEmployeeName) {
          const newTaken = rec.daysTaken + daysNum;
          const newRemaining = Math.max(0, rec.daysByLaw - newTaken);
          return {
            ...rec,
            daysTaken: newTaken,
            daysRemaining: newRemaining,
            lastRequestDate: new Date().toLocaleDateString('es-MX'),
            status: newRemaining === 0 ? ('exhausted' as const) : ('active' as const)
          };
        }
        return rec;
      });
      try {
        localStorage.setItem(VACATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    logHrAuditAction({
      actionType: 'Solicitud Vacaciones',
      targetRecord: `SGI-FR-RH-06 · ${formEmployeeName}`,
      details: `Registro de solicitud de vacaciones por ${formDaysToTake} día(s) (${formStartDate} al ${formEndDate}).`,
      previousValue: `Saldo: ${prevRem} días`,
      newValue: `Saldo: ${nextRem} días`,
      severity: 'normal'
    });

    showToast('¡Guardado!');
    setIsPreviewModalOpen(true);
  };

  // Exportar Matriz a CSV (Compatible con Excel UTF-8)
  const handleExportCsv = () => {
    const bom = '\uFEFF';
    const headers = 'No,Colaborador,Departamento,Puesto,Fecha Ingreso,Antigüedad,Días Ley (LFT),Días Gozados,Días Restantes,Estado\n';
    const rows = vacationRecords.map((r, i) =>
      `"${i + 1}","${r.employeeName}","${r.department}","${r.position}","${r.hireDate}","${r.antiquityText}",${r.daysByLaw},${r.daysTaken},${r.daysRemaining},"${r.status === 'exhausted' ? 'Agotado' : 'Activo'}"\n`
    );
    const blob = new Blob([bom + headers + rows.join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Vacaciones_SIFYGSA.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logHrAuditAction({
      actionType: 'Exportación Excel',
      targetRecord: `Matriz de Vacaciones (${vacationRecords.length} colaboradores)`,
      details: 'Descarga de archivo Vacaciones_SIFYGSA.csv.',
      newValue: 'Vacaciones_SIFYGSA.csv',
      severity: 'normal'
    });
    showToast('¡Excel descargado!');
  };

  // Descargar Plantilla CSV Oficial SGI para Importación
  const handleDownloadTemplate = () => {
    const bom = '\uFEFF';
    const templateContent =
      'Colaborador,Departamento,Puesto,Fecha Ingreso (DD/MM/AAAA),Días Gozados\n' +
      '"Ing. Roberto Gómez Morales","Operaciones Técnicas","Especialista en Automatización","15/03/2021",6\n' +
      '"Lic. Claudia Morán Santos","Recursos Humanos","Coordinadora de Capacitación","10/01/2023",2\n' +
      '"Téc. Javier Estrada Peña","Almacén","Auxiliar de Inventarios","01/06/2024",0\n';
    const blob = new Blob([bom + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Oficial_Importacion_Vacaciones_SGI.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Plantilla oficial CSV descargada para llenado masivo.');
  };

  // Manejar archivo subido para importación
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  // Parser de CSV
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length <= 1) {
      setParsedImportRows([]);
      return;
    }

    // Saltar encabezados
    const dataRows = lines.slice(1);
    const parsed: Partial<VacationRecord>[] = [];

    dataRows.forEach((row, idx) => {
      // Split respetando comillas
      const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

      if (cleanCols.length >= 4) {
        const name = cleanCols[0] || `Colaborador ${idx + 1}`;
        const dept = cleanCols[1] || 'General';
        const position = cleanCols[2] || 'Operativo';
        const hire = cleanCols[3] || '01/01/2024';
        const taken = parseInt(cleanCols[4] || '0', 10) || 0;

        // Estimar años a partir de la fecha
        const parts = hire.split('/');
        let years = 1;
        if (parts.length === 3) {
          const hireYear = parseInt(parts[2], 10);
          if (!isNaN(hireYear)) {
            years = Math.max(0, 2026 - hireYear);
          }
        }

        const lawDays = calculateLftDays(years);
        const rem = Math.max(0, lawDays - taken);

        parsed.push({
          id: `import-${Date.now()}-${idx}`,
          employeeName: name,
          department: dept,
          position: position,
          hireDate: hire,
          antiquityYears: years,
          antiquityText: `${years} año${years === 1 ? '' : 's'} (Calculado)`,
          periodYear: '2025 - 2026',
          daysByLaw: lawDays,
          daysTaken: taken,
          daysRemaining: rem,
          status: rem === 0 ? 'exhausted' : 'active'
        });
      }
    });

    setParsedImportRows(parsed);
  };

  // Confirmar Importación e Integrar a la Matriz
  const handleConfirmImport = () => {
    if (parsedImportRows.length === 0) return;

    setVacationRecords((prev) => {
      // Reemplazar o agregar
      const updated = [...prev];
      parsedImportRows.forEach((newRec) => {
        const existingIdx = updated.findIndex((r) => r.employeeName.toLowerCase() === newRec.employeeName?.toLowerCase());
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], ...(newRec as VacationRecord) };
        } else {
          updated.push(newRec as VacationRecord);
        }
      });
      return updated;
    });

    showToast(`✓ Se integraron ${parsedImportRows.length} registros exitosamente a la Matriz de Vacaciones.`);
    setIsImportModalOpen(false);
    setParsedImportRows([]);
    setImportFileName(null);
  };

  // Sincronización automática silenciosa con el catálogo general de colaboradores ERP
  useEffect(() => {
    setVacationRecords((prev) => {
      let hasChanges = false;
      const updated = [...prev];
      employees.forEach((emp) => {
        const exists = updated.some((r) => r.employeeName.toLowerCase() === emp.name.toLowerCase());
        if (!exists) {
          hasChanges = true;
          const hireYear = emp.hireDate ? parseInt(emp.hireDate.slice(0, 4), 10) : 2024;
          const years = Math.max(0, 2026 - hireYear);
          const lawDays = calculateLftDays(years);

          updated.push({
            id: `vac-erp-${emp.id}`,
            employeeName: emp.name,
            department: emp.department,
            position: emp.position,
            hireDate: emp.hireDate || '01/01/2024',
            antiquityYears: years,
            antiquityText: `${years} año${years === 1 ? '' : 's'}`,
            periodYear: '2025 - 2026',
            daysByLaw: lawDays,
            daysTaken: 0,
            daysRemaining: lawDays,
            status: 'active'
          });
        }
      });
      return hasChanges ? updated : prev;
    });
  }, [employees]);



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast de Notificaciones */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #1E293B'
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER INSTITUCIONAL DEL SISTEMA DE GESTIÓN INTEGRADO (SGI)            */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderLeft: '4px solid var(--primary)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-200)'
              }}
            >
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Control de Vacaciones
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    border: '1px solid var(--success-border)'
                  }}
                >
                  LFT 2023
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Saldos de Ley LFT y Solicitudes
              </p>
            </div>
          </div>

          {/* Botones de Acción (Conciso: 1 a 3 palabras) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsImportModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Importar Excel</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportCsv}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveTab('formatos')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Solicitud</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE RESUMEN EJECUTIVO (CONTROL DE PLANTILLA CICLO 2025-2026)   */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
        {/* Tarjeta 1: Total Plantilla */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--brand-200)', flexShrink: 0 }}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Plantilla en Control
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '2px' }}>
              {vacationRecords.length} Colaboradores
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Padrón activo · Ciclo 2025-2026
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Con Saldo Disponible */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--brand-200)', flexShrink: 0 }}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Con Saldo Disponible
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2, marginTop: '2px' }}>
              {activeCount} Colaboradores
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Tienen vacaciones por disfrutar
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Periodo Concluido */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--success-border)', flexShrink: 0 }}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Vacaciones Concluidas
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--success-text)', lineHeight: 1.2, marginTop: '2px' }}>
              {exhaustedCount} {exhaustedCount === 1 ? 'Colaborador' : 'Colaboradores'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Completaron el 100% de su periodo
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Días de Ley Promedio */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Días de Ley Promedio
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '2px' }}>
              {avgDaysByLaw} Días / Persona
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Calculado por antigüedad LFT
            </div>
          </div>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* PESTAÑA A: MATRIZ DE CONTROL Y SALDOS (SUSTITUYE AL EXCEL MANUAL)         */}
      {/* ========================================================================= */}
      {activeTab === 'matriz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Barra de Filtros */}
          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search className="w-3.5 h-3.5 text-muted" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar colaborador o puesto..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '32px', width: '100%', height: '34px', fontSize: '12px' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => handleDeptFilterChange(e.target.value)}
                className="select-control"
                style={{ height: '34px', fontSize: '12px', minWidth: '170px' }}
              >
                <option value="todos">Todos los Departamentos</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Servicios">Servicios</option>
                <option value="Operaciones Técnicas">Operaciones Técnicas</option>
                <option value="Almacén">Almacén</option>
                <option value="Ingeniería">Ingeniería</option>
                <option value="Seguridad HSE">Seguridad HSE</option>
                <option value="Dirección">Dirección</option>
                <option value="Infraestructura">Infraestructura</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>
                Mostrando{' '}
                <strong>
                  {filteredRecords.length === 0
                    ? 0
                    : `${(safeCurrentPage - 1) * rowsPerPage + 1}–${Math.min(filteredRecords.length, safeCurrentPage * rowsPerPage)}`}
                </strong>{' '}
                de <strong>{filteredRecords.length}</strong> colaboradores
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px' }}>Filas:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="select-control"
                  style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Control de Vacaciones con Scroll Interno y sin columna redundante */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowX: 'auto', maxHeight: '520px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>COLABORADOR</th>
                    <th style={{ padding: '12px 14px' }}>DEPARTAMENTO</th>
                    <th style={{ padding: '12px 14px' }}>FECHA INGRESO</th>
                    <th style={{ padding: '12px 14px' }}>ANTIGÜEDAD</th>
                    <th style={{ padding: '12px 14px', minWidth: '170px' }}>CONSUMO DE SALDO (GOZADOS / LEY)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>SALDO RESTANTE</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No se encontraron colaboradores que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((rec, index) => {
                      const isEven = index % 2 === 0;
                      const percentUsed = Math.min(100, Math.round((rec.daysTaken / rec.daysByLaw) * 100));

                      return (
                        <tr
                          key={rec.id}
                          style={{
                            backgroundColor: isEven ? 'var(--surface)' : 'var(--surface-alt)',
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background-color var(--transition-fast)'
                          }}
                        >
                          {/* Colaborador */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rec.employeeName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.position}</div>
                          </td>

                          {/* Departamento */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{rec.department}</span>
                          </td>

                          {/* Ingreso */}
                          <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {rec.hireDate}
                          </td>

                          {/* Antigüedad */}
                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                            {rec.antiquityText}
                          </td>

                          {/* Barra de Consumo (Gozados vs Ley LFT) */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '7px',
                                  backgroundColor: 'var(--border-subtle)',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${percentUsed}%`,
                                    height: '100%',
                                    backgroundColor: percentUsed >= 90 ? 'var(--danger)' : percentUsed >= 60 ? 'var(--warning)' : 'var(--primary)',
                                    borderRadius: '4px',
                                    transition: 'width 0.4s ease'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', minWidth: '55px' }}>
                                {rec.daysTaken} / {rec.daysByLaw} Días
                              </span>
                            </div>
                          </td>

                          {/* Saldo Restante */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '11.5px',
                                backgroundColor: rec.daysRemaining > 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: rec.daysRemaining > 0 ? 'var(--success-text)' : 'var(--danger-text)',
                                border: rec.daysRemaining > 0 ? '1px solid var(--success-border)' : '1px solid var(--danger-border)'
                              }}
                            >
                              {rec.daysRemaining} Días
                            </span>
                          </td>

                          {/* Acciones */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setFormEmployeeName(rec.employeeName);
                                setActiveTab('formatos');
                                setActiveFormatCode('SGI-FR-RH-06');
                              }}
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText className="w-3 h-3" />
                              <span>Solicitar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación y Controles de Navegación */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--surface-alt)'
                }}
              >
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Página <strong>{safeCurrentPage}</strong> de <strong>{totalPages}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                      if (
                        pg === 1 ||
                        pg === totalPages ||
                        (pg >= safeCurrentPage - 1 && pg <= safeCurrentPage + 1)
                      ) {
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: pg === safeCurrentPage ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                              backgroundColor: pg === safeCurrentPage ? 'var(--primary)' : 'var(--surface)',
                              color: pg === safeCurrentPage ? '#FFFFFF' : 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {pg}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA B: CENTRO DE FORMATOS OFICIALES SGI (6 FORMATOS)                  */}
      {/* ========================================================================= */}
      {activeTab === 'formatos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Barra Superior con Botón para Volver a Vacaciones (Conciso: 3 palabras) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveTab('matriz')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '6px 14px', fontWeight: 700 }}
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>← Volver a Vacaciones</span>
            </button>
          </div>

          {/* Formulario Oficial SGI-FR-RH-06 (Vacaciones) */}
          {activeFormatCode === 'SGI-FR-RH-06' && (
            <form onSubmit={handleSaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Formato de Solicitud de Vacaciones (SGI-FR-RH-06 Rev. 02)
                    </h3>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Elaborar mínimo con 15 días de anticipación de acuerdo con el Art. 76 de la Ley Federal del Trabajo.
                    </p>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Fecha de Elaboración: <strong>{new Date().toLocaleDateString('es-MX')}</strong>
                  </span>
                </div>

                {/* Bloque 1: Datos del Colaborador */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      NOMBRE DEL COLABORADOR <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      value={formEmployeeName}
                      onChange={(e) => setFormEmployeeName(e.target.value)}
                      className="select-control"
                      style={{ width: '100%', height: '38px', fontSize: '12.5px', fontWeight: 600 }}
                      required
                    >
                      {vacationRecords.map((v) => (
                        <option key={v.id} value={v.employeeName}>
                          {v.employeeName} — {v.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      DEPARTAMENTO & PUESTO
                    </label>
                    <input
                      type="text"
                      value={`${currentRecord?.department} · ${currentRecord?.position}`}
                      disabled
                      className="input-text"
                      style={{ width: '100%', backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      FECHA INGRESO & ANTIGÜEDAD CALCULADA
                    </label>
                    <input
                      type="text"
                      value={`${currentRecord?.hireDate} (${currentRecord?.antiquityText})`}
                      disabled
                      className="input-text"
                      style={{ width: '100%', backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)' }}
                    />
                  </div>
                </div>

                {/* Bloque 2: Balance de Días de Vacaciones */}
                <div style={{ padding: '16px', backgroundColor: 'var(--surface-alt)', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Balance de Días de Vacaciones (LFT Reforma 2023)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, 1.3fr) 1fr 1fr minmax(130px, auto) 1.1fr', gap: '14px', alignItems: 'start' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Período Correspondiente <span style={{ color: 'var(--primary)' }}>*</span>
                      </span>
                      <select
                        value={formPeriod}
                        onChange={(e) => setFormPeriod(e.target.value)}
                        className="select-control"
                        style={{ width: '100%', height: '36px', fontSize: '12px', fontWeight: 700 }}
                        required
                      >
                        <option value="2025 - 2026">2025 - 2026 (Ciclo Vigente)</option>
                        <option value="2024 - 2025">2024 - 2025 (Acumulado)</option>
                        <option value="2026 - 2027">2026 - 2027 (Anticipado)</option>
                        <option value="2023 - 2024">2023 - 2024 (Histórico)</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Días que corresponden</span>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginTop: '6px' }}>
                        {daysByLaw} Días
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Días Disfrutados Previos</span>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '6px' }}>
                        {daysTakenPreviously} Días
                      </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                        Días a Disfrutar <span style={{ color: 'var(--danger)' }}>*</span>
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={currentRecord ? currentRecord.daysRemaining : 12}
                        value={formDaysToTake}
                        onKeyDown={handleDaysKeyDown}
                        onChange={(e) => handleDaysToTakeChange(e.target.value)}
                        placeholder="Ej. 5"
                        className="input-text"
                        style={{
                          width: '95px',
                          height: '36px',
                          fontWeight: 800,
                          textAlign: 'center',
                          color: daysValidationError ? '#DC2626' : 'var(--primary)',
                          border: daysValidationError ? '2px solid #EF4444' : undefined,
                          backgroundColor: daysValidationError ? 'rgba(239, 68, 68, 0.08)' : undefined,
                          transition: 'all 0.2s ease'
                        }}
                        required
                      />

                      {daysValidationError && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 20,
                            marginTop: '4px',
                            padding: '3px 8px',
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
                            animation: 'fadeIn 0.15s ease'
                          }}
                        >
                          <AlertTriangle className="w-3 h-3" style={{ flexShrink: 0 }} />
                          <span>{daysValidationError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Saldo Resultante Posterior</span>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: daysRemainingCalculated > 0 ? 'var(--success-text)' : 'var(--danger-text)',
                          marginTop: '6px'
                        }}
                      >
                        {daysRemainingCalculated} Días
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Calendario de Fechas de la Ausencia (Selector Limpio & Anti-trucos) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      ÚLTIMO DÍA LABORADO (SALIDA)
                    </label>
                    <input
                      type="date"
                      value={formExitDate}
                      onChange={(e) => setFormExitDate(e.target.value)}
                      className="input-text"
                      style={{ width: '100%', height: '36px', cursor: 'pointer' }}
                      required
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                      Cierre de jornada previo a descanso
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--primary)' }}>
                      INICIO DE VACACIONES *
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="input-text"
                      style={{ width: '100%', height: '36px', cursor: 'pointer', borderColor: 'var(--brand-300)' }}
                      required
                    />
                    <span style={{ fontSize: '10px', color: 'var(--brand-400)', marginTop: '3px', display: 'block', fontWeight: 600 }}>
                      ⚡ Calcula salida, término y regreso
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      TÉRMINO DE VACACIONES
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="input-text"
                      style={{ width: '100%', height: '36px', cursor: 'pointer' }}
                      required
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                      Último día de descanso otorgado
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      FECHA DE REGRESO A LABORES
                    </label>
                    <input
                      type="date"
                      value={formReturnDate}
                      onChange={(e) => setFormReturnDate(e.target.value)}
                      className="input-text"
                      style={{ width: '100%', height: '36px', cursor: 'pointer' }}
                      required
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                      Reincorporación oficial al trabajo
                    </span>
                  </div>
                </div>

                {/* Bloque 4: Firmas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      SOLICITANTE
                    </label>
                    <input
                      type="text"
                      value={formEmployeeName}
                      disabled
                      className="input-text"
                      style={{ width: '100%', backgroundColor: 'var(--surface-alt)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      JEFE INMEDIATO QUE AUTORIZA
                    </label>
                    <input
                      type="text"
                      value={formApprover}
                      onChange={(e) => {
                        const { value, hadInvalid } = sanitizePersonName(e.target.value);
                        if (hadInvalid) showToast('¡Solo letras!');
                        setFormApprover(value);
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      RECIBE (RECURSOS HUMANOS)
                    </label>
                    <input
                      type="text"
                      value={formHrReceiver}
                      onChange={(e) => {
                        const { value, hadInvalid } = sanitizeCleanText(e.target.value, 65);
                        if (hadInvalid) showToast('¡Carácter inválido!');
                        setFormHrReceiver(value);
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('matriz')}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsPreviewModalOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir PDF</span>
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 16px' }}
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Solicitud</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Formato 2: SGI-FR-RH-01 (Requisición de Personal) */}
          {activeFormatCode === 'SGI-FR-RH-01' && (
            <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Requisición y Solicitud de Personal (SGI-FR-RH-01 Rev. 02)
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Solicitud formal de vacante para contratación técnica, operativa o administrativa
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Fecha: <strong>{new Date().toLocaleDateString('es-MX')}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    PUESTO SOLICITADO
                  </label>
                  <input
                    type="text"
                    value={reqPuesto}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeCleanText(e.target.value, 70);
                      if (hadInvalid) showToast('¡Carácter inválido!');
                      setReqPuesto(value);
                    }}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ÁREA / DEPARTAMENTO
                  </label>
                  <select
                    value={reqArea}
                    onChange={(e) => setReqArea(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="Operaciones Técnicas">Operaciones Técnicas</option>
                    <option value="Ingeniería">Ingeniería</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Seguridad HSE">Seguridad HSE</option>
                    <option value="Almacén">Almacén</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    SUELDO PROPUESTO BRUTO
                  </label>
                  <input
                    type="text"
                    value={reqSueldo}
                    onChange={(e) => {
                      const { formatted, hadInvalid } = formatCurrencyMask(e.target.value);
                      if (hadInvalid) showToast('¡Solo números!');
                      setReqSueldo(formatted);
                    }}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ESCOLARIDAD & PERFIL TÉCNICO
                  </label>
                  <input
                    type="text"
                    value={reqEscolaridad}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeCleanText(e.target.value, 80);
                      if (hadInvalid) showToast('¡Carácter inválido!');
                      setReqEscolaridad(value);
                    }}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    JUSTIFICACIÓN / MOTIVO DE LA VACANTE
                  </label>
                  <input
                    type="text"
                    value={reqMotivo}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeCleanText(e.target.value, 90);
                      if (hadInvalid) showToast('¡Carácter inválido!');
                      setReqMotivo(value);
                    }}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    showToast('✓ Requisición SGI-FR-RH-01 registrada en flujo de aprobación.');
                    window.print();
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Guardar e Imprimir Formato SGI-FR-RH-01</span>
                </button>
              </div>
            </div>
          )}

          {/* Formato 3: SGI-FR-RH-02 (Capacitación & DC-3) */}
          {activeFormatCode === 'SGI-FR-RH-02' && (
            <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Solicitud de Capacitación & Acreditación STPS DC-3 (SGI-FR-RH-02 Rev. 02)
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Detección de necesidades de adiestramiento normativo para personal de campo y planta
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Norma STPS / ISO 9001
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    NOMBRE DEL CURSO O CERTIFICACIÓN
                  </label>
                  <input
                    type="text"
                    value={capCurso}
                    onChange={(e) => setCapCurso(e.target.value)}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    INSTRUCTOR O INSTITUCIÓN CAPACITADORA
                  </label>
                  <input
                    type="text"
                    value={capInstructor}
                    onChange={(e) => setCapInstructor(e.target.value)}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    DURACIÓN / HORAS LECTIVAS
                  </label>
                  <input
                    type="text"
                    value={capHoras}
                    onChange={(e) => setCapHoras(e.target.value)}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    FECHA PROGRAMADA
                  </label>
                  <input
                    type="text"
                    value={capFecha}
                    onChange={(e) => setCapFecha(e.target.value)}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    showToast('✓ Solicitud de Capacitación SGI-FR-RH-02 guardada con éxito.');
                    window.print();
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Award className="w-4 h-4" />
                  <span>Emitir Solicitud de Capacitación & DC-3</span>
                </button>
              </div>
            </div>
          )}



          {/* Formato 5: SGI-FR-RH-15 (Vale de No Adeudo) */}
          {activeFormatCode === 'SGI-FR-RH-15' && (
            <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Vale de No Adeudo de Salida (SGI-FR-RH-15 Rev. 02)
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Liberación institucional de 9 departamentos para liquidación o finiquito laboral
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Baja / Finiquito
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    COLABORADOR QUE CAUSA BAJA
                  </label>
                  <select
                    value={adeudoEmp}
                    onChange={(e) => setAdeudoEmp(e.target.value)}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    {vacationRecords.map((v) => (
                      <option key={v.id} value={v.employeeName}>
                        {v.employeeName} ({v.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    MOTIVO DE LA BAJA
                  </label>
                  <input
                    type="text"
                    value={adeudoMotivo}
                    onChange={(e) => setAdeudoMotivo(e.target.value)}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    FECHA EFECTIVA DE RETIRO
                  </label>
                  <input
                    type="text"
                    value={adeudoFecha}
                    onChange={(e) => setAdeudoFecha(e.target.value)}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* 9 Departamentos para Liberación */}
              <div style={{ padding: '14px', backgroundColor: 'var(--surface-alt)', borderRadius: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  DEPARTAMENTOS QUE LIBERAN (NO ADEUDO DE HERRAMIENTAS, EPP O EQUIPOS):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 1. Almacén (Herramientas)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 2. Seguridad HSE (EPP)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 3. TI & Sistemas (Laptop/Cel)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 4. Operaciones (Vehículo/Llaves)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 5. Compras (Facturas/Gastos)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 6. Contabilidad (Viáticos)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 7. Nóminas (Préstamos Fonacot)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 8. RRHH (Credencial/Expediente)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 9. Dirección General (Vobo)</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    showToast(`✓ Vale de No Adeudo emitido para ${adeudoEmp}.`);
                    window.print();
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Formato Oficial SGI-FR-RH-15</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 1: IMPORTAR EXCEL / CSV INTERACTIVO                                 */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Header del Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--brand-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Importar Matriz de Vacaciones / Planilla
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Cargue un archivo CSV / Excel o descargue la plantilla oficial SGI
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zona de Arrastrar y Soltar o Selector de Archivo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--brand-300)',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '12px',
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'background-color 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .txt, .xlsx"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <FileSpreadsheet className="w-10 h-10 text-primary" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {importFileName ? importFileName : 'Haga clic para seleccionar o arrastre su archivo aquí'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Formatos compatibles: .CSV (Valores separados por comas) o archivo exportado de Excel
              </div>
            </div>

            {/* Botón para descargar plantilla de ejemplo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDownloadTemplate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Descargar Plantilla CSV Oficial SGI</span>
              </button>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Calcula automáticamente días LFT 2023 por antigüedad
              </span>
            </div>

            {/* Vista previa de registros detectados */}
            {parsedImportRows.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  ✓ {parsedImportRows.length} Registros detectados y validados para importar:
                </div>
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Colaborador</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Departamento</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Ingreso</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Días LFT</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Gozados</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Restantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedImportRows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.employeeName}</td>
                          <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{r.department}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{r.hireDate}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>{r.daysByLaw}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.daysTaken}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--success-text)' }}>{r.daysRemaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Acciones del Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedImportRows([]);
                  setImportFileName(null);
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={parsedImportRows.length === 0}
                onClick={handleConfirmImport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Integrar {parsedImportRows.length} Registros a la Matriz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VISTA PREVIA OFICIAL SGI-FR-RH-06 (HOJA MEMBRETADA PARA IMPRIMIR) */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Barra de Acciones del Formato */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8' }}>
                  FORMATO OFICIAL SGI-FR-RH-06
                </span>
                <span style={{ fontSize: '11px', backgroundColor: '#F3F4F6', padding: '2px 8px', borderRadius: '4px', color: '#4B5563', fontWeight: 600 }}>
                  Revisión 02 · Aprobado
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento Membretado Oficial */}
            <div
              style={{
                border: '1.5px solid #000',
                padding: '20px',
                backgroundColor: '#FFFFFF',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            >
              {/* Encabezado Corporativo Oficial */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '16px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '22%', border: '1px solid #000', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 900, fontSize: '15px', color: '#1D4ED8', letterSpacing: '0.5px' }}>
                        SIFYGSA
                      </div>
                      <div style={{ fontSize: '8px', color: '#4B5563', fontWeight: 700 }}>
                        SISTEMAS INTEGRALES DE FLUIDOS Y GAS S.A. DE C.V.
                      </div>
                    </td>
                    <td style={{ width: '56%', border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                        SISTEMA DE GESTIÓN INTEGRADO (SGI)
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '2px' }}>
                        SOLICITUD DE VACACIONES
                      </div>
                    </td>
                    <td style={{ width: '22%', border: '1px solid #000', padding: '6px', fontSize: '9px' }}>
                      <div><strong>CÓDIGO:</strong> SGI-FR-RH-06</div>
                      <div><strong>REVISIÓN:</strong> 02</div>
                      <div><strong>FECHA:</strong> ABRIL 2026</div>
                      <div><strong>PÁGINA:</strong> 1 DE 1</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Fecha de Emisión */}
              <div style={{ textAlign: 'right', fontSize: '11px', marginBottom: '14px', fontWeight: 600 }}>
                Minatitlán, Ver., a <strong>{new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>

              {/* Datos del Colaborador */}
              <div style={{ backgroundColor: '#F3F4F6', padding: '6px 10px', fontWeight: 800, fontSize: '11.5px', border: '1px solid #000', marginBottom: '-1px' }}>
                DATOS GENERALES DEL TRABAJADOR
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '16px', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', width: '30%', fontWeight: 700 }}>NOMBRE COMPLETO:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', width: '70%', fontWeight: 800 }}>{formEmployeeName}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>DEPARTAMENTO / ÁREA:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{currentRecord?.department}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>PUESTO OFICIAL:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{currentRecord?.position}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>FECHA DE INGRESO:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{currentRecord?.hireDate}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>ANTIGÜEDAD ACREDITADA:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{currentRecord?.antiquityText}</td>
                  </tr>
                </tbody>
              </table>

              {/* Balance de Vacaciones */}
              <div style={{ backgroundColor: '#F3F4F6', padding: '6px 10px', fontWeight: 800, fontSize: '11.5px', border: '1px solid #000', marginBottom: '-1px' }}>
                DESGLOSE DEL PERIODO Y DÍAS DE VACACIONES
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '16px', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', width: '60%', fontWeight: 700 }}>AÑO / PERIODO VACACIONAL:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', width: '40%', fontWeight: 700 }}>{formPeriod}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>NÚMERO DE DÍAS QUE CORRESPONDE AL PERIODO:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{daysByLaw} DÍAS (LEY LFT)</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>DÍAS A DISFRUTAR EN ESTA SOLICITUD:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 800, color: '#1D4ED8' }}>{formDaysToTake} DÍAS</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>NÚMERO DE DÍAS DISFRUTADOS PREVIAMENTE:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{daysTakenPreviously} DÍAS</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>NÚMERO DE DÍAS QUE RESTAN:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 800 }}>{daysRemainingCalculated} DÍAS</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>FECHA EFECTIVA DE SALIDA (ÚLTIMO DÍA LABORADO):</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{formatPrintDate(formExitDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>INICIO DE VACACIONES:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{formatPrintDate(formStartDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>TÉRMINO DE VACACIONES:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{formatPrintDate(formEndDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700 }}>FECHA EFECTIVA DE REGRESO A LABORES:</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{formatPrintDate(formReturnDate)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Leyenda Legal LFT */}
              <div style={{ fontSize: '10px', fontStyle: 'italic', textAlign: 'center', margin: '14px 0', color: '#4B5563' }}>
                "POR MEDIO DE LA PRESENTE EXPRESO MI CONFORMIDAD DE SOLICITAR Y GOZAR MIS VACACIONES DE ACUERDO CON LO QUE ESTABLECE EL ARTÍCULO 76 DE LA LEY FEDERAL DEL TRABAJO."
              </div>

              {/* Firmas de Autorización */}
              <div style={{ backgroundColor: '#F3F4F6', padding: '6px 10px', fontWeight: 800, fontSize: '11.5px', border: '1px solid #000', marginBottom: '-1px' }}>
                FIRMAS DE AUTORIZACIÓN
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', textAlign: 'center', fontSize: '10.5px' }}>
                <tbody>
                  <tr style={{ height: '70px' }}>
                    <td style={{ border: '1px solid #000', width: '33.3%', verticalAlign: 'bottom', paddingBottom: '6px' }}>
                      <div style={{ borderBottom: '1px dashed #9CA3AF', margin: '0 20px 4px 20px' }}></div>
                      <strong>{formEmployeeName}</strong>
                      <div style={{ fontSize: '9px', color: '#4B5563' }}>SOLICITANTE</div>
                    </td>
                    <td style={{ border: '1px solid #000', width: '33.3%', verticalAlign: 'bottom', paddingBottom: '6px' }}>
                      <div style={{ borderBottom: '1px dashed #9CA3AF', margin: '0 20px 4px 20px' }}></div>
                      <strong>{formApprover}</strong>
                      <div style={{ fontSize: '9px', color: '#4B5563' }}>AUTORIZA (JEFE INMEDIATO)</div>
                    </td>
                    <td style={{ border: '1px solid #000', width: '33.3%', verticalAlign: 'bottom', paddingBottom: '6px' }}>
                      <div style={{ borderBottom: '1px dashed #9CA3AF', margin: '0 20px 4px 20px' }}></div>
                      <strong>{formHrReceiver}</strong>
                      <div style={{ fontSize: '9px', color: '#4B5563' }}>RECIBE (RECURSOS HUMANOS)</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '14px', fontSize: '8.5px', color: '#6B7280', lineHeight: 1.3 }}>
                * Nota: Documento emitido mediante la Suite Digital SIFYGSA. Conservar copia en expediente físico del trabajador y enviar digitalizado a la gerencia de Recursos Humanos.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
