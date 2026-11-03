import { useState, useEffect } from 'react';
import { Employee, DepartmentItem } from '../types';

// ============================================================================
// GLOSARIO TÉCNICO APLICADO EN ESTE MÓDULO (formShield.ts):
// 1. Input Filtering (Filtrado en vivo): Bloquea caracteres inválidos al teclear.
// 2. Input Masking (Máscara de entrada): Embellece números con guiones/comas.
// 3. Data Sanitization (Normalización): Separa el valor visual del valor crudo (BD).
// 4. Client-Side Persistence: Guarda y recupera datos en formato JSON (localStorage).
// ============================================================================

const EMPLOYEES_STORAGE_KEY = 'sifygsa_erp_employees_v1';
const DEPARTMENTS_STORAGE_KEY = 'sifygsa_erp_departments_v1';

/**
 * Detecta si el usuario intentó escribir caracteres prohibidos para mostrar
 * un micro-toast educativo ("¡Solo números!", "¡Solo letras!").
 */
export const hasForbiddenNumericChars = (raw: string, allowedRegex: RegExp): boolean => {
  return allowedRegex.test(raw);
};

/**
 * 1. INPUT FILTERING: Nombres de personas (Nombre, Apellidos, Supervisor, Contacto)
 * Permite únicamente letras (incluyendo acentos y ñ/ü), espacios y punto abreviado.
 * Bloquea números y símbolos como ¡ ' + } { - @ # $ % & * =
 */
export const sanitizePersonName = (raw: string): { value: string; hadInvalid: boolean } => {
  const invalidPattern = /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.]/g;
  const hadInvalid = invalidPattern.test(raw);
  const cleaned = raw
    .replace(invalidPattern, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 60);
  return { value: cleaned, hadInvalid };
};

/**
 * 2. INPUT FILTERING: Puestos, Proyectos, Parentesco o Departamentos
 * Permite letras, números básicos y conectores empresariales (&, /, ., ,),
 * bloqueando símbolos basura como ¡ ' + } { [ ] < > | \ ~ ^ ? !
 */
export const sanitizeCleanText = (raw: string, maxLen = 80): { value: string; hadInvalid: boolean } => {
  const invalidPattern = /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,&/()-]/g;
  const hadInvalid = invalidPattern.test(raw);
  const cleaned = raw
    .replace(invalidPattern, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLen);
  return { value: cleaned, hadInvalid };
};

/**
 * 3. INPUT MASKING: Teléfonos a 10 dígitos (Formato visual: 922-145-8890)
 * El usuario solo teclea los 10 números y el sistema inserta los guiones.
 */
export const formatPhoneMask = (raw: string): { formatted: string; rawDigits: string; hadInvalid: boolean } => {
  // Ignorar guiones o espacios propios de la máscara para detectar si metió letras/símbolos
  const hadInvalid = /[^0-9-\s]/.test(raw);
  const digits = raw.replace(/\D/g, '').slice(0, 10);

  let formatted = digits;
  if (digits.length > 6) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else if (digits.length > 3) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
  }

  return { formatted, rawDigits: digits, hadInvalid };
};

/**
 * 4. INPUT MASKING: NSS IMSS a 11 dígitos (Formato oficial: 34-12-88-9412-1)
 */
export const formatNssMask = (raw: string): { formatted: string; rawDigits: string; hadInvalid: boolean } => {
  const hadInvalid = /[^0-9-]/.test(raw);
  const digits = raw.replace(/\D/g, '').slice(0, 11);

  let formatted = digits;
  if (digits.length > 10) {
    formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 11)}`;
  } else if (digits.length > 6) {
    formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return { formatted, rawDigits: digits, hadInvalid };
};

/**
 * 5. INPUT MASKING: CLABE Interbancaria a 18 dígitos
 * Formato visual embellecido en bloques: 0121-8000-1234-5678-90
 * En Base de Datos / JSON se guarda únicamente los 18 dígitos puros (rawDigits).
 */
export const formatClabeMask = (raw: string): { formatted: string; rawDigits: string; hadInvalid: boolean } => {
  const hadInvalid = /[^0-9-\s]/.test(raw);
  const digits = raw.replace(/\D/g, '').slice(0, 18);

  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  const formatted = parts.join('-');

  return { formatted, rawDigits: digits, hadInvalid };
};

/**
 * 6. INPUT MASKING: Moneda / Sueldo Mensual Bruto (Ej. 18,500.00)
 */
export const formatCurrencyMask = (raw: string): { formatted: string; rawNumber: string; hadInvalid: boolean } => {
  const hadInvalid = /[^0-9.,]/.test(raw);
  let clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  const [integerPartRaw, decimalPart] = clean.split('.');
  const integerPart = (integerPartRaw || '').slice(0, 7); // Máx 9,999,999

  if (!integerPart && decimalPart === undefined) {
    return { formatted: '', rawNumber: '', hadInvalid };
  }

  const formattedInteger = integerPart ? Number(integerPart).toLocaleString('en-US') : '0';
  const formatted = decimalPart !== undefined ? `${formattedInteger}.${decimalPart.slice(0, 2)}` : formattedInteger;
  const rawNumber = decimalPart !== undefined ? `${integerPart || '0'}.${decimalPart.slice(0, 2)}` : integerPart;

  return { formatted, rawNumber, hadInvalid };
};

/**
 * 7. INPUT FILTERING: RFC (12 o 13 caracteres alfanuméricos en mayúsculas)
 */
export const formatRfcMask = (raw: string): { value: string; hadInvalid: boolean } => {
  const hadInvalid = /[^a-zA-Z0-9ñÑ&]/.test(raw);
  const value = raw.toUpperCase().replace(/[^A-Z0-9Ñ&]/g, '').slice(0, 13);
  return { value, hadInvalid };
};

/**
 * 8. INPUT FILTERING: CURP (18 caracteres alfanuméricos en mayúsculas)
 */
export const formatCurpMask = (raw: string): { value: string; hadInvalid: boolean } => {
  const hadInvalid = /[^a-zA-Z0-9]/.test(raw);
  const value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
  return { value, hadInvalid };
};

/**
 * 9. INPUT FILTERING: Talla de calzado (solo números y medio punto, ej. 27.5)
 */
export const sanitizeShoeSize = (raw: string): { value: string; hadInvalid: boolean } => {
  const hadInvalid = /[^0-9.]/.test(raw);
  let clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  const [intPart, decPart] = clean.split('.');
  const limitedInt = (intPart || '').slice(0, 2);
  const value = decPart !== undefined ? `${limitedInt}.${decPart.slice(0, 1)}` : limitedInt;
  return { value, hadInvalid };
};

/**
 * 10. INPUT FILTERING: Extensión telefónica (solo dígitos, máx 5)
 */
export const sanitizeExtension = (raw: string): { value: string; hadInvalid: boolean } => {
  const hadInvalid = /[^0-9]/.test(raw);
  const value = raw.replace(/\D/g, '').slice(0, 5);
  return { value, hadInvalid };
};

/**
 * Extrae solo los dígitos puros para guardar limpio en Base de Datos / JSON (Raw Value)
 */
export const toRawDigits = (val: string): string => val.replace(/\D/g, '');

/**
 * Validación de formato de correo electrónico
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

// ============================================================================
// PERSISTENCIA TEMPORAL EN CLIENTE (JSON en localStorage)
// ============================================================================

export const loadPersistedEmployees = (fallback: Employee[]): Employee[] => {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // En caso de JSON corrupto, usar fallback
  }
  return fallback;
};

export const savePersistedEmployees = (employees: Employee[]): void => {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    window.dispatchEvent(new Event('sifygsa-storage-update'));
  } catch {
    // Ignorar si el almacenamiento está lleno
  }
};

export const loadPersistedDepartments = (fallback: DepartmentItem[]): DepartmentItem[] => {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Usar fallback
  }
  return fallback;
};

export const savePersistedDepartments = (departments: DepartmentItem[]): void => {
  try {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(departments));
    window.dispatchEvent(new Event('sifygsa-storage-update'));
  } catch {
    // Ignorar errores de cuota
  }
};

export const useSyncedEmployees = (fallback: Employee[]): Employee[] => {
  const [list, setList] = useState<Employee[]>(() => loadPersistedEmployees(fallback));

  useEffect(() => {
    const sync = () => setList(loadPersistedEmployees(fallback));
    sync();
    window.addEventListener('sifygsa-storage-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sifygsa-storage-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, [fallback]);

  return list;
};

export const useSyncedDepartments = (fallback: DepartmentItem[]): DepartmentItem[] => {
  const [list, setList] = useState<DepartmentItem[]>(() => loadPersistedDepartments(fallback));

  useEffect(() => {
    const sync = () => setList(loadPersistedDepartments(fallback));
    sync();
    window.addEventListener('sifygsa-storage-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sifygsa-storage-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, [fallback]);

  return list;
};

/**
 * Calcula el siguiente folio consecutivo automáticamente (Ej. EMP-2026-085 -> EMP-2026-086)
 */
export const getNextEmployeeFolio = (employees?: Employee[]): string => {
  try {
    const list = employees || loadPersistedEmployees([]);
    let maxNum = 84;
    for (const emp of list) {
      const match = emp.id?.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum && num < 9000) {
          maxNum = num;
        }
      }
    }
    return `EMP-2026-${String(maxNum + 1).padStart(3, '0')}`;
  } catch {
    return 'EMP-2026-085';
  }
};

// ============================================================================
// DESAMBIGUACIÓN DE HOMÓNIMOS Y VALIDACIÓN DE LLAVES ÚNICAS (RFC / CURP / NSS)
// ============================================================================

export interface DuplicateCheckResult {
  hasConflict: boolean;
  conflictField?: 'rfc' | 'curp' | 'nss';
  toastMessage?: string;
  isHomonym?: boolean;
  homonymEmployee?: Employee;
}

/**
 * Permite que existan empleados con el mismo nombre completo (Homónimos),
 * pero bloquea estrictamente si el RFC, CURP o NSS ya pertenece a otro colaborador.
 */
export const checkDuplicateEmployeeIdentifiers = (
  candidate: { id?: string; name: string; rfc?: string; curp?: string; nss?: string },
  existingList: Employee[]
): DuplicateCheckResult => {
  const cleanRfc = (candidate.rfc || '').trim().toUpperCase();
  const cleanCurp = (candidate.curp || '').trim().toUpperCase();
  const cleanNss = toRawDigits(candidate.nss || '');
  const cleanName = candidate.name.trim().toLowerCase();

  let homonymEmployee: Employee | undefined;

  for (const emp of existingList) {
    if (candidate.id && emp.id === candidate.id) continue;

    if (cleanRfc && emp.rfc && emp.rfc.trim().toUpperCase() === cleanRfc) {
      return {
        hasConflict: true,
        conflictField: 'rfc',
        toastMessage: '¡RFC ya existe!'
      };
    }

    if (cleanCurp && emp.curp && emp.curp.trim().toUpperCase() === cleanCurp) {
      return {
        hasConflict: true,
        conflictField: 'curp',
        toastMessage: '¡CURP duplicada!'
      };
    }

    if (cleanNss && emp.nss && toRawDigits(emp.nss) === cleanNss) {
      return {
        hasConflict: true,
        conflictField: 'nss',
        toastMessage: '¡NSS duplicado!'
      };
    }

    if (cleanName && emp.name.trim().toLowerCase() === cleanName) {
      homonymEmployee = emp;
    }
  }

  return {
    hasConflict: false,
    isHomonym: Boolean(homonymEmployee),
    homonymEmployee
  };
};

// ============================================================================
// EXPORTACIÓN REAL A EXCEL (.CSV CON CODIFICACIÓN UTF-8 BOM)
// ============================================================================

export const downloadCsvFile = (
  filenameBase: string,
  headers: string[],
  rows: (string | number | undefined)[][]
): void => {
  const escapeCell = (val: string | number | undefined): string => {
    const str = val === undefined || val === null ? '' : String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(','))
  ];

  // \uFEFF es el Byte Order Mark (BOM) para que Microsoft Excel en Windows reconozca acentos y ñ
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanFileName = filenameBase.endsWith('.csv') ? filenameBase : `${filenameBase}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', cleanFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// BITÁCORA DE AUDITORÍA GERENCIAL DE RRHH (AUDIT TRAIL & RBAC)
// Exclusiva para la Gerente de Recursos Humanos (Valeria Méndez Albores)
// ============================================================================

const HR_AUDIT_STORAGE_KEY = 'sifygsa_erp_hr_audit_v1';
const HR_ACTIVE_OPERATOR_KEY = 'sifygsa_erp_hr_operator_v1';

export interface HrOperatorProfile {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
  isManager?: boolean;
}

export const HR_TEAM_OPERATORS: HrOperatorProfile[] = [
  {
    id: 'EMP-2026-009',
    name: 'Valeria Méndez Albores',
    role: 'Gerente de Recursos Humanos',
    initials: 'VM',
    avatarBg: '#1D4ED8',
    isManager: true
  },
  {
    id: 'EMP-2026-007',
    name: 'Carlos Alberto Tun Culebro',
    role: 'Generalista de Recursos Humanos',
    initials: 'CT',
    avatarBg: '#D97706'
  },
  {
    id: 'EMP-2026-003',
    name: 'Alejandra Sujias Ricardez',
    role: 'Coordinadora de Nóminas',
    initials: 'AS',
    avatarBg: '#047857'
  },
  {
    id: 'EMP-2026-010',
    name: 'Sheyla Irais Troncoso Vidal',
    role: 'Auxiliar de RRHH & Asistencia',
    initials: 'ST',
    avatarBg: '#7C3AED'
  }
];

export interface HrAuditLogEntry {
  id: string;
  timestamp: string;
  operatorName: string;
  operatorRole: string;
  operatorInitials: string;
  operatorColor: string;
  actionType:
    | 'Alta de Empleado'
    | 'Cambio Bancario CLABE'
    | 'Edición de Expediente'
    | 'Corrección Dato Oficial'
    | 'Catálogo Departamentos'
    | 'Solicitud Vacaciones'
    | 'Exportación Excel';
  targetRecord: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  severity: 'normal' | 'sensible' | 'critico';
  managerDecision: 'Pendiente' | 'Aprobado' | 'En Revisión';
  managerNote?: string;
}

const INITIAL_HR_AUDIT_LOGS: HrAuditLogEntry[] = [
  {
    id: 'AUD-2026-104',
    timestamp: '02/11/2026 · 18:15 hrs',
    operatorName: 'Alejandra Sujias Ricardez',
    operatorRole: 'Coordinadora de Nóminas',
    operatorInitials: 'AS',
    operatorColor: '#047857',
    actionType: 'Cambio Bancario CLABE',
    targetRecord: 'EMP-2026-081 · Ing. Roberto Méndez Cruz',
    details: 'Actualización de cuenta bancaria por reposición de tarjeta de nómina.',
    previousValue: 'Banorte · CLABE ****4410',
    newValue: 'BBVA México · CLABE ****8921',
    severity: 'sensible',
    managerDecision: 'Pendiente'
  },
  {
    id: 'AUD-2026-103',
    timestamp: '02/11/2026 · 16:40 hrs',
    operatorName: 'Carlos Alberto Tun Culebro',
    operatorRole: 'Generalista de Recursos Humanos',
    operatorInitials: 'CT',
    operatorColor: '#D97706',
    actionType: 'Alta de Empleado',
    targetRecord: 'EMP-2026-084 · Téc. Marco Antonio Silva',
    details: 'Registro de alta con expediente de 18 documentos verificado para Base Mapachapa.',
    previousValue: 'Sin registro previo',
    newValue: 'Alta activa · Operaciones Técnicas',
    severity: 'normal',
    managerDecision: 'Aprobado'
  },
  {
    id: 'AUD-2026-102',
    timestamp: '02/11/2026 · 13:10 hrs',
    operatorName: 'Sheyla Irais Troncoso Vidal',
    operatorRole: 'Auxiliar de RRHH & Asistencia',
    operatorInitials: 'ST',
    operatorColor: '#7C3AED',
    actionType: 'Solicitud Vacaciones',
    targetRecord: 'SGI-FR-RH-06 · Adrián José Rodríguez Hernández',
    details: 'Captura de formato oficial de vacaciones (5 días hábiles autorizados).',
    previousValue: 'Saldo: 13 días disponibles',
    newValue: 'Saldo: 8 días disponibles',
    severity: 'normal',
    managerDecision: 'Aprobado'
  },
  {
    id: 'AUD-2026-101',
    timestamp: '01/11/2026 · 17:05 hrs',
    operatorName: 'Carlos Alberto Tun Culebro',
    operatorRole: 'Generalista de Recursos Humanos',
    operatorInitials: 'CT',
    operatorColor: '#D97706',
    actionType: 'Corrección Dato Oficial',
    targetRecord: 'EMP-2026-079 · Ing. Carlos Hernández',
    details: 'Desbloqueo de candado legal para corregir homoclave de RFC según Constancia SAT.',
    previousValue: 'RFC: HECA880512XX1',
    newValue: 'RFC: HECA8805129A4',
    severity: 'critico',
    managerDecision: 'En Revisión',
    managerNote: 'Verificar constancia física firmada en expediente.'
  }
];

export const getActiveHrOperator = (): HrOperatorProfile => {
  try {
    const savedId = localStorage.getItem(HR_ACTIVE_OPERATOR_KEY);
    if (savedId) {
      const found = HR_TEAM_OPERATORS.find((op) => op.id === savedId);
      if (found) return found;
    }
  } catch {
    // Usar operador por defecto
  }
  return HR_TEAM_OPERATORS[1]; // Por defecto: Carlos Alberto Tun Culebro (Generalista RRHH)
};

export const setActiveHrOperator = (operatorId: string): void => {
  try {
    localStorage.setItem(HR_ACTIVE_OPERATOR_KEY, operatorId);
    window.dispatchEvent(new Event('sifygsa-storage-update'));
  } catch {
    // Ignorar error
  }
};

export const loadHrAuditLogs = (): HrAuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(HR_AUDIT_STORAGE_KEY);
    if (!raw) return INITIAL_HR_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Usar bitácora inicial
  }
  return INITIAL_HR_AUDIT_LOGS;
};

export const saveHrAuditLogs = (logs: HrAuditLogEntry[]): void => {
  try {
    localStorage.setItem(HR_AUDIT_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event('sifygsa-storage-update'));
  } catch {
    // Ignorar error
  }
};

export const logHrAuditAction = (params: {
  actionType: HrAuditLogEntry['actionType'];
  targetRecord: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  severity?: HrAuditLogEntry['severity'];
}): void => {
  const operator = getActiveHrOperator();
  const currentLogs = loadHrAuditLogs();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const nextNumber = 101 + currentLogs.length;
  const newEntry: HrAuditLogEntry = {
    id: `AUD-2026-${nextNumber}`,
    timestamp: `${dateStr} · ${timeStr} hrs`,
    operatorName: operator.name,
    operatorRole: operator.role,
    operatorInitials: operator.initials,
    operatorColor: operator.avatarBg,
    actionType: params.actionType,
    targetRecord: params.targetRecord,
    details: params.details,
    previousValue: params.previousValue,
    newValue: params.newValue,
    severity: params.severity || 'normal',
    managerDecision: operator.isManager ? 'Aprobado' : 'Pendiente'
  };

  saveHrAuditLogs([newEntry, ...currentLogs]);
};

export const updateHrAuditDecision = (
  logId: string,
  decision: HrAuditLogEntry['managerDecision'],
  managerNote?: string
): void => {
  const currentLogs = loadHrAuditLogs();
  const updated = currentLogs.map((log) =>
    log.id === logId
      ? {
          ...log,
          managerDecision: decision,
          managerNote: managerNote !== undefined ? managerNote : log.managerNote
        }
      : log
  );
  saveHrAuditLogs(updated);
};

export const useSyncedHrAuditLogs = (): HrAuditLogEntry[] => {
  const [logs, setLogs] = useState<HrAuditLogEntry[]>(() => loadHrAuditLogs());

  useEffect(() => {
    const sync = () => setLogs(loadHrAuditLogs());
    sync();
    window.addEventListener('sifygsa-storage-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sifygsa-storage-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return logs;
};

