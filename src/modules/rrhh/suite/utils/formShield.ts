import { useSyncExternalStore } from 'react';
import { Employee, EmployeeBankAccount, DepartmentItem, ExtensionDirectoryItem } from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_EXTENSIONS_DIRECTORY,
  EMPLOYEES
} from '../data/mockData';

// ============================================================================
// GLOSARIO TÉCNICO APLICADO EN ESTE MÓDULO (formShield.ts):
// 1. Input Filtering (Filtrado en vivo): Bloquea caracteres inválidos al teclear.
// 2. Input Masking (Máscara de entrada): Embellece números con guiones/comas.
// 3. Data Sanitization (Normalización): Separa el valor visual del valor crudo (BD).
// 4. Client-Side Persistence: Guarda y recupera datos en formato JSON (localStorage).
// ============================================================================

const EMPLOYEES_STORAGE_KEY = 'sifygsa_erp_employees_v1';
const DEPARTMENTS_STORAGE_KEY = 'sifygsa_erp_departments_v2';
const EXTENSIONS_STORAGE_KEY = 'sifygsa_extensions_catalog_v1';

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
 * 5.1 INPUT MASKING: Número de Tarjeta de Débito / Nómina a 16 dígitos
 * Formato visual en bloques: 1234-5678-9012-3456
 */
export const formatCardMask = (raw: string): { formatted: string; rawDigits: string; hadInvalid: boolean } => {
  const hadInvalid = /[^0-9-\s]/.test(raw);
  const digits = raw.replace(/\D/g, '').slice(0, 16);

  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  const formatted = parts.join('-');

  return { formatted, rawDigits: digits, hadInvalid };
};

export const DEFAULT_BANKS: string[] = [
  'BBVA México',
  'Banorte',
  'Santander México',
  'Citibanamex',
  'HSBC México',
  'Scotiabank',
  'Banco Azteca',
  'BanCoppel',
  'Inbursa',
  'Afirme',
  'BanRegio',
  'Nu México',
  'Hey Banco'
];

const BANKS_STORAGE_KEY = 'sifygsa_erp_banks_v1';

export const loadPersistedBanks = (): string[] => {
  try {
    const raw = localStorage.getItem(BANKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...parsed, ...DEFAULT_BANKS]));
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_BANKS;
};

export const savePersistedBanks = (banks: string[]): void => {
  try {
    localStorage.setItem(BANKS_STORAGE_KEY, JSON.stringify(banks));
  } catch {
    // ignore
  }
};

export const SHOE_SIZE_OPTIONS: string[] = [
  '22.0',
  '22.5',
  '23.0',
  '23.5',
  '24.0',
  '24.5',
  '25.0',
  '25.5',
  '26.0',
  '26.5',
  '27.0',
  '27.5',
  '28.0',
  '28.5',
  '29.0',
  '29.5',
  '30.0',
  '30.5',
  '31.0'
];

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

const subscribeStorage = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('sifygsa-storage-update', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('sifygsa-storage-update', callback);
    window.removeEventListener('storage', callback);
  };
};

const parsedSnapshotCache = new Map<string, { raw: string; value: unknown }>();

const getCachedStoreSnapshot = <T>(
  storageKey: string,
  fallback: T,
  loader: () => T
): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const cached = parsedSnapshotCache.get(storageKey);
    if (cached && cached.raw === raw) {
      return cached.value as T;
    }
    const value = loader();
    if (value === fallback) return fallback;
    parsedSnapshotCache.set(storageKey, { raw, value });
    return value;
  } catch {
    return fallback;
  }
};

const deduplicateById = <T extends { id?: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const key = (item.id || '').trim();
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    result.push(item);
  }
  return result;
};

export const normalizeOfficialDepartmentName = (dept?: string): string => {
  const clean = (dept || '').trim();
  const lower = clean.toLowerCase();
  if (lower === 'medición y control de contratos' || lower === 'medicion y control de contratos') {
    return 'Medición y Control de Proyectos';
  }
  if (lower === 'qhse') {
    return 'HSE';
  }
  if (lower === 'capacitación' || lower === 'capacitacion') {
    return 'Recursos Humanos';
  }
  if (lower === 'definición de soluciones' || lower === 'definicion de soluciones') {
    return 'Ventas';
  }
  return clean;
};

const isCorruptedBinaryText = (text?: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD]/.test(trimmed)) return true;
  if (/^(%PDF-|PK\u0003\u0004|endobj|endstream|xref)/i.test(trimmed)) return true;
  const weirdChars = (trimmed.match(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s.,'()\/&:#+_-]/g) || []).length;
  if (weirdChars >= 2) return true;
  return false;
};

const isCorruptedBinaryEmployeeName = (name?: string): boolean => {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (isCorruptedBinaryText(trimmed)) return true;
  const validChars = (trimmed.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]/g) || []).length;
  if (trimmed.length >= 4 && validChars / trimmed.length < 0.6) return true;
  return false;
};

const sanitizeLoadedEmployees = (list: Employee[]): { cleaned: Employee[]; changed: boolean } => {
  let changed = false;
  const deduped = deduplicateById(list);
  const cleaned: Employee[] = [];

  for (const emp of deduped) {
    if (isCorruptedBinaryEmployeeName(emp.name)) {
      changed = true;
      continue;
    }
    const rawDept = emp.department || '';
    const safeDept = isCorruptedBinaryText(rawDept)
      ? 'Por asignar'
      : normalizeOfficialDepartmentName(rawDept);
    const safePosition = isCorruptedBinaryText(emp.position) ? 'Por asignar' : emp.position;
    const safeLocation = isCorruptedBinaryText(emp.location) ? 'Minatitlán, Ver.' : emp.location;

    if (
      safeDept !== emp.department ||
      safePosition !== emp.position ||
      safeLocation !== emp.location
    ) {
      changed = true;
    }

    cleaned.push({
      ...emp,
      department: safeDept,
      position: safePosition,
      location: safeLocation
    });
  }

  return { cleaned, changed };
};

const syncPatchToLocalJsonDb = (patch: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  void fetch('/api/local-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  }).catch(() => {
    // En producción estática sin servidor dev, localStorage sigue operando normalmente
  });
};

let localJsonDbBootstrapped = false;

export const bootstrapLocalJsonDb = async (defaults: {
  employees: Employee[];
  departments: DepartmentItem[];
  extensions?: ExtensionDirectoryItem[];
}): Promise<void> => {
  if (typeof window === 'undefined' || localJsonDbBootstrapped) return;
  localJsonDbBootstrapped = true;

  try {
    const res = await fetch('/api/local-db');
    if (!res.ok) return;
    const remote = (await res.json()) as {
      employees?: Employee[];
      departments?: DepartmentItem[];
      extensions?: ExtensionDirectoryItem[];
    };

    const patchToSeed: Record<string, unknown> = {};
    let shouldNotify = false;

    if (Array.isArray(remote.employees) && remote.employees.length > 0) {
      const { cleaned } = sanitizeLoadedEmployees(remote.employees);
      if (cleaned.length > 0) {
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(cleaned));
        shouldNotify = true;
      }
    } else {
      patchToSeed.employees = loadPersistedEmployees(defaults.employees);
    }

    if (Array.isArray(remote.departments) && remote.departments.length > 0) {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(deduplicateById(remote.departments)));
      shouldNotify = true;
    } else {
      patchToSeed.departments = loadPersistedDepartments(defaults.departments);
    }

    if (Array.isArray(remote.extensions) && remote.extensions.length > 0) {
      localStorage.setItem(EXTENSIONS_STORAGE_KEY, JSON.stringify(deduplicateById(remote.extensions)));
      shouldNotify = true;
    } else if (defaults.extensions) {
      patchToSeed.extensions = loadPersistedExtensions(defaults.extensions);
    }

    if (Object.keys(patchToSeed).length > 0) {
      syncPatchToLocalJsonDb(patchToSeed);
    }
    if (shouldNotify) {
      window.dispatchEvent(new Event('sifygsa-storage-update'));
    }
  } catch {
    // Silencioso si no hay servidor dev
  }
};

export const loadPersistedEmployees = (fallback: Employee[]): Employee[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const { cleaned, changed } = sanitizeLoadedEmployees(parsed as Employee[]);
      if (changed) {
        const finalClean = cleaned.length > 0 ? cleaned : fallback;
        try {
          localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(finalClean));
          syncPatchToLocalJsonDb({ employees: finalClean });
        } catch {
          // ignore
        }
      }
      return cleaned.length > 0 ? cleaned : fallback;
    }
  } catch {
    // En caso de JSON corrupto, usar fallback
  }
  return fallback;
};

export const savePersistedEmployees = (employees: Employee[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const { cleaned } = sanitizeLoadedEmployees(employees);
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new Event('sifygsa-storage-update'));
    syncPatchToLocalJsonDb({ employees: cleaned });
  } catch {
    // Ignorar si el almacenamiento está lleno
  }
};

const LEGACY_DEPARTMENT_LEADS_MAP: Record<string, string> = {
  'Ing. Carlos Ortiz': 'Ing. Agustín Anastacio Martínez',
  'Lic. Patricia Reyes': 'Lic. Marlem Campos García',
  'Ing. Roberto Martínez Alor': 'Ing. Carlos Enrique Cossío Ruiz',
  'Ing. Gabriel Solís': 'Ing. Pablo Vázquez Culebro',
  'Ing. Agustín Anastacio': 'Ing. Miguel Guzmán Reyes',
  'Lic. Ana Martínez / Pablo Vázquez': 'Lic. Valeria Méndez Albores',
  'Ing. Mario Zúñiga': 'Ing. Emmanuel Mendoza Ramírez',
  'Ing. Raúl Pech': 'Ing. Guillermo Sánchez Escobar'
};

const LEGACY_DEPARTMENT_CODES_MAP: Record<string, string> = {
  'DEP-001': 'DIR',
  'DEP-002': 'ADM',
  'DEP-003': 'CAL',
  'DEP-004': 'COM',
  'DEP-005': 'HSE-MIN',
  'DEP-006': 'ALM',
  'DEP-007': 'INF',
  'DEP-008': 'ING',
  'DEP-009': 'MCP',
  'DEP-010': 'HSE-COM',
  'DEP-011': 'RH',
  'DEP-012': 'SRV',
  'DEP-013': 'VTA',
  'DEP-014': 'GSAPE'
};

export interface DepartmentColorTheme {
  accent: string;
  softBg: string;
  softBorder: string;
  solidText: string;
  label: string;
}

export const DEPARTMENT_COLOR_SWATCHES: readonly { hex: string; name: string }[] = [
  { hex: '#1E3A8A', name: 'Azul Marino Dirección' },
  { hex: '#1D4ED8', name: 'Azul SIFYGSA Ingeniería' },
  { hex: '#0369A1', name: 'Azul Acero Infraestructura' },
  { hex: '#0E7490', name: 'Petróleo Servicios' },
  { hex: '#0F766E', name: 'Turquesa Calidad' },
  { hex: '#15803D', name: 'Verde Seguridad HSE' },
  { hex: '#047857', name: 'Esmeralda HSE' },
  { hex: '#4338CA', name: 'Índigo Proyectos' },
  { hex: '#6D28D9', name: 'Violeta Ventas' },
  { hex: '#7E22CE', name: 'Púrpura GSAPE' },
  { hex: '#BE185D', name: 'Vino RRHH' },
  { hex: '#C2410C', name: 'Terracota Almacén' },
  { hex: '#B45309', name: 'Ámbar Compras' },
  { hex: '#475569', name: 'Pizarra Administración' }
];

const DEPARTMENT_DEFAULT_COLORS: Record<string, { hex: string; label: string }> = {
  DIR: { hex: '#1E3A8A', label: 'Azul Marino Dirección' },
  ADM: { hex: '#475569', label: 'Pizarra Administración' },
  CAL: { hex: '#0F766E', label: 'Turquesa Calidad' },
  COM: { hex: '#B45309', label: 'Ámbar Compras' },
  'HSE-MIN': { hex: '#15803D', label: 'Verde Seguridad HSE' },
  'HSE-COM': { hex: '#047857', label: 'Esmeralda HSE' },
  ALM: { hex: '#C2410C', label: 'Terracota Almacén' },
  INF: { hex: '#0369A1', label: 'Azul Acero Infraestructura' },
  ING: { hex: '#1D4ED8', label: 'Azul SIFYGSA Ingeniería' },
  MCP: { hex: '#4338CA', label: 'Índigo Proyectos' },
  RH: { hex: '#BE185D', label: 'Vino RRHH' },
  SRV: { hex: '#0E7490', label: 'Petróleo Servicios' },
  VTA: { hex: '#6D28D9', label: 'Violeta Ventas' },
  GSAPE: { hex: '#7E22CE', label: 'Púrpura GSAPE' }
};

export const getDepartmentTheme = (
  codeOrName?: string,
  location?: string,
  customColor?: string
): DepartmentColorTheme => {
  const upperRaw = (codeOrName || '').trim().toUpperCase();
  const resolvedCode = DEPARTMENT_DEFAULT_COLORS[upperRaw]
    ? upperRaw
    : getDepartmentCode(codeOrName, location);

  const fallbackMeta = DEPARTMENT_DEFAULT_COLORS[resolvedCode] || {
    hex: '#2563EB',
    label: 'Azul Corporativo'
  };
  const accent =
    customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor.trim())
      ? customColor.trim()
      : fallbackMeta.hex;

  return {
    accent,
    softBg: `color-mix(in srgb, ${accent} 10%, var(--surface))`,
    softBorder: `color-mix(in srgb, ${accent} 26%, var(--border))`,
    solidText: '#FFFFFF',
    label: fallbackMeta.label
  };
};

export const suggestDepartmentCode = (name: string): string => {
  const clean = (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();
  if (!clean) return '';
  const words = clean
    .split(/\s+/)
    .filter((w) => w.length > 0 && !['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'a'].includes(w.toLowerCase()));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 5)
    .toUpperCase();
};

export const getDepartmentCode = (departmentName?: string, location?: string): string => {
  const clean = (departmentName || '').trim().toLowerCase();
  if (!clean) return 'GEN';
  if (clean.includes('direcci')) return 'DIR';
  if (clean.includes('administraci')) return 'ADM';
  if (clean.includes('calidad')) return 'CAL';
  if (clean.includes('compra')) return 'COM';
  if (clean.includes('hse') || clean.includes('seguridad')) {
    const loc = (location || '').toLowerCase();
    if (loc.includes('comalcalco') || loc.includes('tabasco') || loc.includes('paraíso') || loc.includes('paraiso') || loc.includes('villahermosa')) {
      return 'HSE-COM';
    }
    return 'HSE-MIN';
  }
  if (clean.includes('almac')) return 'ALM';
  if (clean.includes('infraestructura') || clean.includes('sistemas')) return 'INF';
  if (clean.includes('ingenier')) return 'ING';
  if (clean.includes('medici') || clean.includes('control de proyecto')) return 'MCP';
  if (clean.includes('recursos humanos') || clean.includes('rrhh') || clean.includes('capacitaci')) return 'RH';
  if (clean.includes('servicio')) return 'SRV';
  if (clean.includes('venta') || clean.includes('comercial') || clean.includes('soluciones')) return 'VTA';
  if (clean.includes('gsape') || clean.includes('soporte a proyecto')) return 'GSAPE';
  return clean.slice(0, 3).toUpperCase();
};

export const loadPersistedDepartments = (
  fallback: DepartmentItem[] = INITIAL_DEPARTMENTS
): DepartmentItem[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let changed = false;
      const migrated = deduplicateById(parsed as DepartmentItem[]).map((dept: DepartmentItem) => {
        const migratedLead = LEGACY_DEPARTMENT_LEADS_MAP[dept.lead];
        const migratedCode = LEGACY_DEPARTMENT_CODES_MAP[dept.code];
        const nextLead = migratedLead || dept.lead;
        const nextCode = migratedCode || dept.code;
        if (nextLead !== dept.lead || nextCode !== dept.code) {
          changed = true;
          return { ...dept, lead: nextLead, code: nextCode };
        }
        return dept;
      });
      if (changed) {
        try {
          localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(migrated));
        } catch {
          // ignore
        }
      }
      return migrated.length > 0 ? migrated : fallback;
    }
  } catch {
    // Usar fallback
  }
  return fallback;
};

export const savePersistedDepartments = (departments: DepartmentItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const cleanDepts = deduplicateById(departments);
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(cleanDepts));
    window.dispatchEvent(new Event('sifygsa-storage-update'));
    syncPatchToLocalJsonDb({ departments: cleanDepts });
  } catch {
    // Ignorar errores de cuota
  }
};

export const useSyncedEmployees = (fallback: Employee[]): Employee[] => {
  return useSyncExternalStore(
    subscribeStorage,
    () => getCachedStoreSnapshot(EMPLOYEES_STORAGE_KEY, fallback, () => loadPersistedEmployees(fallback)),
    () => fallback
  );
};

export const useSyncedDepartments = (fallback: DepartmentItem[]): DepartmentItem[] => {
  return useSyncExternalStore(
    subscribeStorage,
    () => getCachedStoreSnapshot(DEPARTMENTS_STORAGE_KEY, fallback, () => loadPersistedDepartments(fallback)),
    () => fallback
  );
};

// ============================================================================
// CATÁLOGO PERSISTENTE DE EXTENSIONES TELEFÓNICAS POR DEPARTAMENTO
// ============================================================================

export const loadPersistedExtensions = (
  fallback: ExtensionDirectoryItem[] = INITIAL_EXTENSIONS_DIRECTORY
): ExtensionDirectoryItem[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(EXTENSIONS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const deduped = deduplicateById(parsed as ExtensionDirectoryItem[]);
      return deduped.length > 0 ? deduped : fallback;
    }
  } catch {
    // Usar fallback
  }
  return fallback;
};

export const savePersistedExtensions = (extensions: ExtensionDirectoryItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const cleanExts = deduplicateById(extensions);
    localStorage.setItem(EXTENSIONS_STORAGE_KEY, JSON.stringify(cleanExts));
    window.dispatchEvent(new Event('sifygsa-storage-update'));
    syncPatchToLocalJsonDb({ extensions: cleanExts });
  } catch {
    // Ignorar errores de cuota
  }
};

export const useSyncedExtensions = (
  fallback: ExtensionDirectoryItem[] = INITIAL_EXTENSIONS_DIRECTORY
): ExtensionDirectoryItem[] => {
  return useSyncExternalStore(
    subscribeStorage,
    () => getCachedStoreSnapshot(EXTENSIONS_STORAGE_KEY, fallback, () => loadPersistedExtensions(fallback)),
    () => fallback
  );
};

/**
 * Resuelve la extensión telefónica correspondiente al departamento y base seleccionada
 */
export const resolveDepartmentExtension = (
  departmentName: string,
  locationName?: string,
  catalog: ExtensionDirectoryItem[] = loadPersistedExtensions()
): { primaryExtension: string; allDeptExtensions: ExtensionDirectoryItem[] } => {
  const cleanDept = departmentName.trim().toLowerCase();
  if (!cleanDept) return { primaryExtension: '', allDeptExtensions: [] };

  const activeItems = catalog.filter((item) => item.status === 'active');

  // Coincidencia directa o parcial por nombre de departamento
  const matches = activeItems.filter((item) => {
    const itemDept = item.department.trim().toLowerCase();
    return (
      itemDept === cleanDept ||
      cleanDept.includes(itemDept) ||
      itemDept.includes(cleanDept) ||
      (cleanDept === 'qhse' && itemDept === 'hse')
    );
  });

  if (matches.length === 0) {
    return { primaryExtension: '', allDeptExtensions: [] };
  }

  // Si hay base seleccionada (ej. Comalcalco, Tab.), priorizar extensión de esa sede si existe
  if (locationName) {
    const cleanLoc = locationName.toLowerCase();
    const locMatch = matches.find(
      (m) =>
        (cleanLoc.includes('comalcalco') && m.location.toLowerCase().includes('comalcalco')) ||
        (cleanLoc.includes('mapachapa') && m.location.toLowerCase().includes('mapachapa'))
    );
    if (locMatch) {
      return { primaryExtension: locMatch.extension, allDeptExtensions: matches };
    }
  }

  const defaultMatch = matches.find((m) => m.isDefaultForDept) || matches[0];
  return {
    primaryExtension: defaultMatch ? defaultMatch.extension : '',
    allDeptExtensions: matches
  };
};

const isUsablePersonName = (candidate?: string): candidate is string => {
  if (!candidate) return false;
  const clean = candidate.trim();
  if (!clean) return false;
  const lower = clean.toLowerCase();
  if (
    lower.includes('por asignar') ||
    lower.includes('provisional') ||
    lower.includes('&') ||
    lower.includes('/')
  ) {
    return false;
  }
  return true;
};

/**
 * Resuelve el nombre completo del Gerente / Jefe Asignado para un departamento.
 * Prioriza el titular registrado en el catálogo vivo de Departamentos.
 */
export const resolveDepartmentManager = (
  departmentName: string,
  locationName?: string,
  departmentsCatalog: DepartmentItem[] = loadPersistedDepartments(INITIAL_DEPARTMENTS),
  employeesCatalog: Employee[] = loadPersistedEmployees(EMPLOYEES),
  extensionsCatalog: ExtensionDirectoryItem[] = loadPersistedExtensions(INITIAL_EXTENSIONS_DIRECTORY)
): string => {
  const cleanDept = departmentName.trim().toLowerCase();
  if (!cleanDept) return '';

  const cleanLoc = (locationName || '').trim().toLowerCase();

  // 1. Buscar titular/gerente directo en el catálogo vivo de Departamentos (priorizando sede cuando hay varias como HSE Mina / Comalcalco)
  const deptMatch =
    (cleanLoc
      ? departmentsCatalog.find(
          (d) =>
            d.status === 'active' &&
            d.name.trim().toLowerCase() === cleanDept &&
            ((cleanLoc.includes('comalcalco') && d.location.toLowerCase().includes('comalcalco')) ||
              (cleanLoc.includes('minatitl') && d.location.toLowerCase().includes('minatitl')) ||
              (cleanLoc.includes('mapachapa') && d.location.toLowerCase().includes('mapachapa')))
        )
      : undefined) ||
    departmentsCatalog.find(
      (d) => d.status === 'active' && d.name.trim().toLowerCase() === cleanDept
    ) ||
    departmentsCatalog.find((d) => d.name.trim().toLowerCase() === cleanDept) ||
    departmentsCatalog.find(
      (d) =>
        d.status === 'active' &&
        (cleanDept.includes(d.name.trim().toLowerCase()) ||
          d.name.trim().toLowerCase().includes(cleanDept))
    );

  if (deptMatch && isUsablePersonName(deptMatch.lead)) {
    return deptMatch.lead.trim();
  }

  // 2. Respaldo: buscar gerente/director activo en el catálogo de Empleados
  const managerEmp = employeesCatalog.find((emp) => {
    const empDept = (emp.department || '').trim().toLowerCase();
    const empPos = (emp.position || '').toLowerCase();
    return (
      empDept === cleanDept &&
      (empPos.includes('gerente') ||
        empPos.includes('director') ||
        empPos.includes('coordinador') ||
        empPos.includes('jefe')) &&
      isUsablePersonName(emp.name)
    );
  });

  if (managerEmp) {
    return managerEmp.name.trim();
  }

  // 3. Respaldo: buscar responsable en el catálogo de Extensiones Telefónicas
  const extMatches = extensionsCatalog.filter((ext) => {
    const extDept = ext.department.trim().toLowerCase();
    return (
      ext.status === 'active' &&
      (extDept === cleanDept || cleanDept.includes(extDept) || extDept.includes(cleanDept)) &&
      isUsablePersonName(ext.assignedTo)
    );
  });

  if (extMatches.length > 0) {
    if (locationName) {
      const cleanLoc = locationName.toLowerCase();
      const locExt = extMatches.find(
        (m) =>
          (cleanLoc.includes('comalcalco') && m.location.toLowerCase().includes('comalcalco')) ||
          (cleanLoc.includes('mapachapa') && m.location.toLowerCase().includes('mapachapa'))
      );
      if (locExt) return locExt.assignedTo.trim();
    }
    const defaultExt = extMatches.find((m) => m.isDefaultForDept) || extMatches[0];
    if (defaultExt) return defaultExt.assignedTo.trim();
  }

  return '';
};

// ============================================================================
// CONSULTA DE CÓDIGOS POSTALES DE MÉXICO (API SEPOMEX / ZIPPOPOTAM + CATÁLOGO LOCAL)
// ============================================================================

export interface MexicanZipCodeInfo {
  zip: string;
  state: string;
  municipality: string;
  colonies: string[];
}

const LOCAL_SEPOMEX_FALLBACK: Record<string, { state: string; municipality: string; colonies: string[] }> = {
  '96700': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['Minatitlán Centro', 'Playón Sur', 'Obrera']
  },
  '96710': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['20 de Noviembre', 'Cuauhtémoc', 'Petrolera']
  },
  '96720': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['18 de Marzo', 'Guayacanal', 'Hidalgo']
  },
  '96730': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['Buena Vista Sur', 'Santa Clara', 'Nueva Mina']
  },
  '96740': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['Ruiz Cortines', 'Salubridad', 'Gravera']
  },
  '96848': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['Buena Vista Norte', 'Insurgentes Norte']
  },
  '96850': {
    state: 'Veracruz',
    municipality: 'Minatitlán',
    colonies: ['El Palmar', 'Jardines de la Concepción', 'Praderas del Jagüey']
  },
  '96340': {
    state: 'Veracruz',
    municipality: 'Cosoleacaque',
    colonies: ['Cosoleacaque Centro', 'Congregación Mapachapa', 'El Naranjito']
  },
  '96400': {
    state: 'Veracruz',
    municipality: 'Coatzacoalcos',
    colonies: ['Coatzacoalcos Centro', 'María de la Piedad', 'Puerto México']
  },
  '86300': {
    state: 'Tabasco',
    municipality: 'Comalcalco',
    colonies: ['Comalcalco Centro', 'San Isidro', 'Vicente Guerrero', 'Morelos']
  },
  '86320': {
    state: 'Tabasco',
    municipality: 'Comalcalco',
    colonies: ['Santa Amalia', 'Gustavo de la Fuente', 'Lázaro Cárdenas']
  },
  '91000': {
    state: 'Veracruz',
    municipality: 'Xalapa',
    colonies: ['Xalapa Centro', 'Zona Centro']
  },
  '24100': {
    state: 'Campeche',
    municipality: 'Ciudad del Carmen',
    colonies: ['Ciudad del Carmen Centro', 'Puntilla', 'Guanal']
  },
  '97000': {
    state: 'Yucatán',
    municipality: 'Mérida',
    colonies: ['Mérida Centro', 'La Quinta', 'Los Cocos', 'Privada del Maestro']
  }
};

const normalizeMexicanStateName = (rawState: string): string => {
  const s = rawState.trim();
  if (/veracruz/i.test(s)) return 'Veracruz';
  if (/yucat/i.test(s)) return 'Yucatán';
  if (/michoac/i.test(s)) return 'Michoacán';
  if (/quer[eé]taro/i.test(s)) return 'Querétaro';
  if (/nuevo le/i.test(s)) return 'Nuevo León';
  if (/san luis potos/i.test(s)) return 'San Luis Potosí';
  if (/distrito federal|ciudad de m/i.test(s)) return 'Ciudad de México';
  if (/^mexico$/i.test(s)) return 'Estado de México';
  if (/coahuila/i.test(s)) return 'Coahuila';
  return s;
};

const inferMunicipalityByZipRange = (zip: string, colonies: string[], stateName: string): string => {
  const n = parseInt(zip, 10);
  if (n >= 96700 && n <= 96899) return 'Minatitlán';
  if (n >= 96340 && n <= 96399) return 'Cosoleacaque';
  if (n >= 96400 && n <= 96599) return 'Coatzacoalcos';
  if (n >= 96600 && n <= 96699) return 'Jáltipan';
  if (n >= 96000 && n <= 96199) return 'Acayucan';
  if (n >= 91000 && n <= 91199) return 'Xalapa';
  if (n >= 91700 && n <= 91999) return 'Veracruz';
  if (n >= 94290 && n <= 94299) return 'Boca del Río';
  if (n >= 93200 && n <= 93399) return 'Poza Rica de Hidalgo';
  if (n >= 94300 && n <= 94409) return 'Orizaba';
  if (n >= 94500 && n <= 94699) return 'Córdoba';
  if (n >= 86300 && n <= 86399) return 'Comalcalco';
  if (n >= 86600 && n <= 86699) return 'Paraíso';
  if (n >= 86000 && n <= 86299) return 'Centro (Villahermosa)';
  if (n >= 86500 && n <= 86599) return 'Cárdenas';
  if (n >= 24100 && n <= 24199) return 'Ciudad del Carmen';
  if (n >= 24000 && n <= 24099) return 'Campeche';
  if (n >= 97000 && n <= 97399) return 'Mérida';

  // Si alguna colonia termina en "Centro", extraer el nombre de la ciudad
  const centroCol = colonies.find((c) => /\s+centro$/i.test(c));
  if (centroCol) {
    return centroCol.replace(/\s+centro$/i, '').trim();
  }
  return stateName;
};

export const lookupMexicanPostalCode = async (zip: string): Promise<MexicanZipCodeInfo | null> => {
  const cleanZip = zip.replace(/\D/g, '');
  if (cleanZip.length !== 5) return null;

  const localEntry = LOCAL_SEPOMEX_FALLBACK[cleanZip];

  try {
    const response = await fetch(`https://api.zippopotam.us/MX/${cleanZip}`);
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.places) && data.places.length > 0) {
        const apiColonies = data.places
          .map((p: { 'place name'?: string }) => (p['place name'] || '').trim())
          .filter(Boolean);
        const mergedColonies = Array.from(
          new Set([...(localEntry?.colonies || []), ...apiColonies])
        );
        const rawState = data.places[0]?.state || localEntry?.state || '';
        const state = normalizeMexicanStateName(rawState);
        const municipality =
          localEntry?.municipality || inferMunicipalityByZipRange(cleanZip, mergedColonies, state);

        return {
          zip: cleanZip,
          state,
          municipality,
          colonies: mergedColonies
        };
      }
    }
  } catch {
    // Fallback a base local si no hay red
  }

  if (localEntry) {
    return {
      zip: cleanZip,
      state: localEntry.state,
      municipality: localEntry.municipality,
      colonies: localEntry.colonies
    };
  }

  return null;
};

/**
 * Calcula el siguiente folio consecutivo automáticamente (Ej. EMP-2026-085 -> EMP-2026-086)
 */
export const getNextEmployeeFolio = (employees?: Employee[]): string => {
  try {
    const list = employees || loadPersistedEmployees([]);
    let maxNum = 0;
    for (const emp of list) {
      const match = emp.id?.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum && num < 9999) {
          maxNum = num;
        }
      }
    }
    return `SFG-${String(maxNum + 1).padStart(4, '0')}`;
  } catch {
    return 'SFG-0001';
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
    timestamp: '02/11/2026 · 18:15:32 hrs',
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
    timestamp: '02/11/2026 · 16:40:19 hrs',
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
    timestamp: '02/11/2026 · 13:10:45 hrs',
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
    timestamp: '01/11/2026 · 17:05:08 hrs',
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
  if (typeof window === 'undefined') return HR_TEAM_OPERATORS[1];
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
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HR_ACTIVE_OPERATOR_KEY, operatorId);
    window.dispatchEvent(new Event('sifygsa-storage-update'));
  } catch {
    // Ignorar error
  }
};

export const loadHrAuditLogs = (): HrAuditLogEntry[] => {
  if (typeof window === 'undefined') return INITIAL_HR_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(HR_AUDIT_STORAGE_KEY);
    if (!raw) return INITIAL_HR_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const deduped = deduplicateById(parsed as HrAuditLogEntry[]);
      return deduped.length > 0 ? deduped : INITIAL_HR_AUDIT_LOGS;
    }
  } catch {
    // Usar bitácora inicial
  }
  return INITIAL_HR_AUDIT_LOGS;
};

export const saveHrAuditLogs = (logs: HrAuditLogEntry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HR_AUDIT_STORAGE_KEY, JSON.stringify(deduplicateById(logs)));
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
    second: '2-digit',
    hour12: false
  });

  const maxNumber = currentLogs.reduce((acc, log) => {
    const match = log.id?.match(/AUD-\d{4}-(\d+)/i) || log.id?.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > acc) return n;
    }
    return acc;
  }, 100);
  const nextNumber = maxNumber + 1;
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
  return useSyncExternalStore(
    subscribeStorage,
    () => getCachedStoreSnapshot(HR_AUDIT_STORAGE_KEY, INITIAL_HR_AUDIT_LOGS, loadHrAuditLogs),
    () => INITIAL_HR_AUDIT_LOGS
  );
};

// ============================================================================
// DETECCIÓN INTELIGENTE DE CONSTANCIA DE SITUACIÓN FISCAL (CSF - SAT)
// Analiza PDF (flujos sin comprimir y FlateDecode), DOCX y nombres de archivo
// para marcar automáticamente CSF válidas o rechazar documentos equivocados
// (CFE, INE, CV, Acta, Estado de cuenta, etc.).
// ============================================================================

export interface CsfAnalysisResult {
  status: 'verified' | 'rejected' | 'needs_confirmation';
  toastMessage: string;
  reason: string;
  detectedType?: string;
}

const normalizeForDocMatch = (raw: string): string =>
  raw
    .replace(/\u0000/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trim();

const tryDecompressBuffer = async (
  chunk: Uint8Array,
  format: 'deflate' | 'deflate-raw'
): Promise<string> => {
  if (typeof DecompressionStream === 'undefined' || chunk.byteLength < 6) return '';
  try {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    const ds = new DecompressionStream(format);
    const stream = new Blob([copy]).stream().pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    return new TextDecoder('latin1').decode(new Uint8Array(buf));
  } catch {
    return '';
  }
};

const extractPdfReadableText = async (bytes: Uint8Array): Promise<string> => {
  const maxInspect = Math.min(bytes.byteLength, 3 * 1024 * 1024);
  const rawLatin1 = new TextDecoder('latin1').decode(bytes.subarray(0, maxInspect));
  const chunks: string[] = [];

  const collectPdfOperators = (source: string) => {
    // 1. Texto literal entre paréntesis (...) Tj / TJ y metadatos
    const parenRegex = /\(([^()]{2,200})\)/g;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = parenRegex.exec(source)) !== null && count < 1500) {
      const cleaned = m[1].replace(/\\([()\\nrt])/g, ' ').replace(/\u0000/g, '');
      if (/[a-zA-Z0-9]{2}/.test(cleaned)) {
        chunks.push(cleaned);
      }
      count++;
    }

    // 2. Cadenas hexadecimales UTF-16 o ASCII comunes en reportes SAT
    const hexRegex = /<([0-9A-Fa-f]{8,240})>/g;
    let hCount = 0;
    while ((m = hexRegex.exec(source)) !== null && hCount < 600) {
      const hex = m[1];
      let decoded = '';
      if (hex.startsWith('FEFF') || /^00[2-7][0-9A-F]00/i.test(hex)) {
        for (let i = hex.startsWith('FEFF') ? 4 : 0; i + 3 < hex.length; i += 4) {
          const code = parseInt(hex.slice(i, i + 4), 16);
          if (code >= 32 && code <= 255) decoded += String.fromCharCode(code);
        }
      }
      if (decoded.trim().length >= 3) chunks.push(decoded);
      hCount++;
    }
  };

  collectPdfOperators(
    rawLatin1.replace(/stream[\r\n]+[\s\S]*?endstream/g, ' ')
  );

  // 3. Descomprimir streams FlateDecode de PDF en navegador (JasperReports / SAT)
  const streamToken = 'stream';
  const endStreamToken = 'endstream';
  let searchPos = 0;
  let streamCount = 0;

  while (streamCount < 25) {
    const startIdx = rawLatin1.indexOf(streamToken, searchPos);
    if (startIdx === -1) break;
    let dataStart = startIdx + streamToken.length;
    if (rawLatin1[dataStart] === '\r' && rawLatin1[dataStart + 1] === '\n') {
      dataStart += 2;
    } else if (rawLatin1[dataStart] === '\n' || rawLatin1[dataStart] === '\r') {
      dataStart += 1;
    } else {
      searchPos = dataStart;
      continue;
    }

    const endIdx = rawLatin1.indexOf(endStreamToken, dataStart);
    if (endIdx === -1) break;

    if (endIdx > dataStart && endIdx - dataStart < 600000) {
      const slice = bytes.subarray(dataStart, endIdx);
      const decodedStream =
        (await tryDecompressBuffer(slice, 'deflate')) ||
        (await tryDecompressBuffer(slice, 'deflate-raw'));
      if (decodedStream) {
        collectPdfOperators(decodedStream);
        // También preservar palabras planas ASCII por si no venían entre ()
        chunks.push(decodedStream.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s:/.-]/g, ' ').slice(0, 6000));
      } else {
        // Si el stream venía sin comprimir (texto plano BT...ET), analizarlo directo
        const plainChunk = rawLatin1.slice(dataStart, Math.min(endIdx, dataStart + 60000));
        if (plainChunk.includes('BT') || plainChunk.includes('Tj') || plainChunk.includes('TJ')) {
          collectPdfOperators(plainChunk);
        }
      }
    }

    searchPos = endIdx + endStreamToken.length;
    streamCount++;
  }

  return normalizeForDocMatch(chunks.join(' '));
};

const extractDocxReadableText = async (bytes: Uint8Array): Promise<string> => {
  // Buscar entrada ZIP word/document.xml e inflar su contenido
  const raw = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.byteLength, 2 * 1024 * 1024)));
  const docEntryName = 'word/document.xml';
  let idx = raw.indexOf('PK\x03\x04');
  let safety = 0;

  while (idx !== -1 && safety < 60) {
    if (idx + 30 > bytes.byteLength) break;
    const compressionMethod = bytes[idx + 8] | (bytes[idx + 9] << 8);
    const compressedSize =
      (bytes[idx + 18] |
        (bytes[idx + 19] << 8) |
        (bytes[idx + 20] << 16) |
        (bytes[idx + 21] << 24)) >>>
      0;
    const nameLen = bytes[idx + 26] | (bytes[idx + 27] << 8);
    const extraLen = bytes[idx + 28] | (bytes[idx + 29] << 8);
    const nameStart = idx + 30;
    const entryName = raw.slice(nameStart, nameStart + nameLen);
    const dataStart = nameStart + nameLen + extraLen;

    if (entryName === docEntryName && compressedSize > 0 && dataStart + compressedSize <= bytes.byteLength) {
      const payload = bytes.subarray(dataStart, dataStart + compressedSize);
      let xml = '';
      if (compressionMethod === 0) {
        xml = new TextDecoder('utf-8').decode(payload);
      } else if (compressionMethod === 8) {
        xml = await tryDecompressBuffer(payload, 'deflate-raw');
      }
      if (xml) {
        return normalizeForDocMatch(xml.replace(/<[^>]+>/g, ' '));
      }
    }

    idx = raw.indexOf('PK\x03\x04', idx + 4);
    safety++;
  }

  return '';
};

export const analyzeTaxCertificateFile = async (
  file: File,
  expectedRfc?: string
): Promise<CsfAnalysisResult> => {
  const fileName = file.name || '';
  const upperName = normalizeForDocMatch(fileName);
  const lowerName = fileName.toLowerCase();
  const mime = (file.type || '').toLowerCase();

  const isPdf = mime.includes('pdf') || lowerName.endsWith('.pdf');
  const isDocx =
    lowerName.endsWith('.docx') ||
    mime.includes('wordprocessingml');
  const isImage = mime.startsWith('image/') || /\.(jpe?g|png|webp|bmp|heic)$/i.test(lowerName);

  if (!isPdf && !isImage && !isDocx) {
    return {
      status: 'rejected',
      toastMessage: '¡Archivo no válido!',
      detectedType: 'Formato no admitido',
      reason: `El archivo "${fileName}" no es PDF ni imagen de Constancia de Situación Fiscal.`
    };
  }

  // Verificar nombres de archivo que evidentemente pertenecen a otros documentos
  const nonCsfNameRules: { pattern: RegExp; label: string }[] = [
    { pattern: /\b(INE|IFE|CREDENCIAL)\b/i, label: 'Credencial INE' },
    { pattern: /\b(CURP)\b/i, label: 'Documento CURP' },
    { pattern: /\b(CFE|RECIBO|LUZ|AGUA|TELMEX|IZZI|TOTALPLAY|COMPROBANTE\s+DE\s+DOMICILIO)\b/i, label: 'Comprobante de Domicilio / Recibo' },
    { pattern: /\b(CV|CURRICULUM|SOLICITUD\s+DE\s+EMPLEO)\b/i, label: 'Currículum Vitae (CV)' },
    { pattern: /\b(ACTA\s+DE\s+NACIMIENTO|ACTA)\b/i, label: 'Acta de Nacimiento' },
    { pattern: /\b(ESTADO\s+DE\s+CUENTA|CLABE|TARJETA\s+BANCARIA)\b/i, label: 'Estado de Cuenta Bancario' },
    { pattern: /\b(DC3|DC-3|CERTIFICADO\s+CURSO|DIPLOMA)\b/i, label: 'Certificado DC-3 / Curso' },
    { pattern: /\b(CARTA\s+DE\s+RECOMENDACION|RECOMENDACION)\b/i, label: 'Carta de Recomendación' },
    { pattern: /\b(LICENCIA|PASAPORTE|SELFIE)\b/i, label: 'Otro Documento' }
  ];

  const matchedNonCsfName = nonCsfNameRules.find((rule) => rule.pattern.test(upperName));

  let extractedText = '';
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (isPdf) {
      extractedText = await extractPdfReadableText(bytes);
    } else if (isDocx) {
      extractedText = await extractDocxReadableText(bytes);
    }
  } catch {
    extractedText = '';
  }

  const positiveMarkers = [
    'CONSTANCIA DE SITUACION FISCAL',
    'CEDULA DE IDENTIFICACION FISCAL',
    'SERVICIO DE ADMINISTRACION TRIBUTARIA',
    'ADMINISTRACION GENERAL DE SERVICIOS AL CONTRIBUYENTE',
    'DATOS DE IDENTIFICACION DEL CONTRIBUYENTE',
    'DATOS DEL DOMICILIO REGISTRADO',
    'ACTIVIDADES ECONOMICAS',
    'REGIMENES',
    'REGISTRO FEDERAL DE CONTRIBUYENTES',
    'VALIDA TU INFORMACION FISCAL',
    'IDCIF'
  ];

  const positiveHits = positiveMarkers.filter((kw) => extractedText.includes(kw));

  const nonCsfTextRules: { keywords: string[]; label: string }[] = [
    {
      keywords: ['INSTITUTO NACIONAL ELECTORAL', 'CREDENCIAL PARA VOTAR', 'CLAVE DE ELECTOR'],
      label: 'Credencial INE'
    },
    {
      keywords: ['COMISION FEDERAL DE ELECTRICIDAD', 'CFE SUMINISTRADOR', 'TOTAL A PAGAR', 'NO. DE SERVICIO'],
      label: 'Recibo de Luz / Domicilio (CFE)'
    },
    {
      keywords: ['CURRICULUM VITAE', 'EXPERIENCIA LABORAL', 'FORMACION ACADEMICA', 'OBJETIVO PROFESIONAL'],
      label: 'Currículum Vitae (CV)'
    },
    {
      keywords: ['ACTA DE NACIMIENTO', 'OFICIALIA DEL REGISTRO CIVIL', 'REGISTRO CIVIL'],
      label: 'Acta de Nacimiento'
    },
    {
      keywords: ['ESTADO DE CUENTA', 'SALDO PROMEDIO', 'PERIODO DEL', 'CLABE INTERBANCARIA'],
      label: 'Estado de Cuenta Bancario'
    },
    {
      keywords: ['CONSTANCIA DE COMPETENCIAS O DE HABILIDADES LABORALES', 'DC-3', 'STPS'],
      label: 'Formato DC-3 / Capacitación'
    },
    {
      keywords: ['A QUIEN CORRESPONDA', 'CARTA DE RECOMENDACION', 'POR MEDIO DE LA PRESENTE RECOMIENDO'],
      label: 'Carta de Recomendación'
    },
    {
      keywords: ['CONTRATO INDIVIDUAL DE TRABAJO', 'DECLARACIONES', 'CLAUSULAS'],
      label: 'Contrato Laboral'
    },
    {
      keywords: ['CLAVE UNICA DE REGISTRO DE POBLACION', 'SOY MEXICANO'],
      label: 'Constancia de CURP'
    }
  ];

  // Si NO tiene marcadores SAT CSF pero SÍ marcadores claros de otro documento, rechazar
  if (positiveHits.length === 0) {
    for (const rule of nonCsfTextRules) {
      const hitCount = rule.keywords.filter((kw) => extractedText.includes(kw)).length;
      if (hitCount >= 1 && (rule.keywords[0] !== 'CONTRATO INDIVIDUAL DE TRABAJO' || hitCount >= 2)) {
        return {
          status: 'rejected',
          toastMessage: '¡No es una CSF!',
          detectedType: rule.label,
          reason: `Se detectó contenido de "${rule.label}" en lugar de una Constancia de Situación Fiscal del SAT.`
        };
      }
    }

    if (matchedNonCsfName) {
      return {
        status: 'rejected',
        toastMessage: '¡No es una CSF!',
        detectedType: matchedNonCsfName.label,
        reason: `El archivo "${fileName}" indica ser "${matchedNonCsfName.label}", no una Constancia de Situación Fiscal (SAT).`
      };
    }

    // Si es un PDF/DOCX con suficiente prosa legible (>350 chars y varias palabras en español),
    // pero sin ningún término SAT/Fiscal/Contribuyente/RFC, rechazar con seguridad sin falsos positivos en PDFs CID.
    const hasBasicFiscalHints =
      extractedText.includes('SAT') ||
      extractedText.includes('SHCP') ||
      extractedText.includes('HACIENDA') ||
      extractedText.includes('CONTRIBUYENTE') ||
      extractedText.includes('FISCAL') ||
      extractedText.includes('RFC');

    const proseMarkers = [' DE ', ' DEL ', ' LA ', ' EL ', ' PARA ', ' CON ', ' POR ', ' LOS '];
    const proseHitCount = proseMarkers.filter((w) => extractedText.includes(w)).length;

    if ((isPdf || isDocx) && extractedText.length > 350 && proseHitCount >= 4 && !hasBasicFiscalHints) {
      return {
        status: 'rejected',
        toastMessage: '¡No parece CSF SAT!',
        detectedType: 'Otro documento con texto',
        reason: `El documento "${fileName}" contiene texto legible pero no incluye términos fiscales del SAT ni RFC.`
      };
    }
  }

  // Verificar coincidencia de RFC si ya fue capturado y aparece un RFC explícito en el PDF
  const cleanExpectedRfc = (expectedRfc || '').trim().toUpperCase();
  if (positiveHits.length >= 1 && cleanExpectedRfc.length >= 12) {
    if (!extractedText.includes(cleanExpectedRfc)) {
      const rfcExplicitMatch = extractedText.match(/RFC\s*:?\s*([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/);
      if (rfcExplicitMatch && rfcExplicitMatch[1] && rfcExplicitMatch[1] !== cleanExpectedRfc) {
        return {
          status: 'rejected',
          toastMessage: '¡RFC no coincide!',
          detectedType: 'CSF de otra persona',
          reason: `La Constancia pertenece al RFC ${rfcExplicitMatch[1]}, distinto al capturado (${cleanExpectedRfc}).`
        };
      }
    }
  }

  // Confirmación automática como CSF SAT válida
  if (
    positiveHits.length >= 2 ||
    (positiveHits.length === 1 && (extractedText.includes('SAT') || extractedText.includes('RFC') || extractedText.includes('SHCP'))) ||
    (cleanExpectedRfc.length >= 12 && extractedText.includes(cleanExpectedRfc) && (extractedText.includes('SAT') || extractedText.includes('FISCAL')))
  ) {
    return {
      status: 'verified',
      toastMessage: '¡CSF verificada!',
      detectedType: 'Constancia de Situación Fiscal (SAT)',
      reason: 'Documento verificado automáticamente con marcadores oficiales del SAT.'
    };
  }

  // Imagen o PDF escaneado sin texto extraíble (no rechazar falsamente; pedir confirmación visual)
  return {
    status: 'needs_confirmation',
    toastMessage: '¡Revisa vista previa!',
    detectedType: isImage ? 'Imagen / Captura' : 'PDF Escaneado',
    reason: isImage
      ? 'Archivo de imagen adjunto. Verifica visualmente y confirma que corresponde a la CSF del colaborador.'
      : 'PDF escaneado sin texto seleccionable. Revisa el documento y confirma si corresponde a la CSF.'
  };
};

// ============================================================================
// GESTIÓN COHERENTE DE CUENTAS BANCARIAS (PRINCIPAL ÚNICA Y USOS SIN REPETICIÓN)
// ============================================================================

export const PRIMARY_BANK_ALIAS = 'Nómina';

export const SECONDARY_BANK_ALIASES = [
  'Cuenta Secundaria / Viáticos',
  'Fondo de Ahorro / Bonos',
  'Cuenta de Reembolsos',
  'Cuenta Alterna de Respaldo'
];

export const pickNextAvailableBankAlias = (
  existingAccounts: EmployeeBankAccount[],
  nextNumber?: number
): string => {
  const used = new Set(
    existingAccounts
      .map((a) => (a.alias || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const available = SECONDARY_BANK_ALIASES.find((opt) => !used.has(opt.toLowerCase()));
  if (available) return available;

  let counter = nextNumber && nextNumber > 1 ? nextNumber : existingAccounts.length + 1;
  while (used.has(`cuenta adicional #${counter}`)) {
    counter++;
  }
  return `Cuenta Adicional #${counter}`;
};

export const syncBankAccountsConsistency = (
  accounts: EmployeeBankAccount[]
): EmployeeBankAccount[] => {
  if (accounts.length === 0) return [];
  const primaryIdx = Math.max(0, accounts.findIndex((a) => a.isPrimary));
  const usedAliases = new Set<string>([PRIMARY_BANK_ALIAS.toLowerCase()]);

  return accounts.map((acc, idx) => {
    if (idx === primaryIdx) {
      return {
        ...acc,
        isPrimary: true,
        alias: PRIMARY_BANK_ALIAS
      };
    }

    const currentAlias = (acc.alias || '').trim();
    const isValidUniqueSecondary =
      Boolean(currentAlias) &&
      currentAlias.toLowerCase() !== PRIMARY_BANK_ALIAS.toLowerCase() &&
      !usedAliases.has(currentAlias.toLowerCase());

    let resolvedAlias = currentAlias;
    if (!isValidUniqueSecondary) {
      const candidate = SECONDARY_BANK_ALIASES.find((opt) => !usedAliases.has(opt.toLowerCase()));
      if (candidate) {
        resolvedAlias = candidate;
      } else {
        let counter = idx + 1;
        while (usedAliases.has(`cuenta adicional #${counter}`)) {
          counter++;
        }
        resolvedAlias = `Cuenta Adicional #${counter}`;
      }
    }

    usedAliases.add(resolvedAlias.toLowerCase());
    return {
      ...acc,
      isPrimary: false,
      alias: resolvedAlias
    };
  });
};

export const reassignBankAccountsOnSetPrimary = (
  accounts: EmployeeBankAccount[],
  targetAccountId: string
): EmployeeBankAccount[] => {
  const targetAcc = accounts.find((a) => a.id === targetAccountId);
  if (!targetAcc) return accounts;

  const targetOldAlias =
    targetAcc.alias && targetAcc.alias.trim().toLowerCase() !== PRIMARY_BANK_ALIAS.toLowerCase()
      ? targetAcc.alias.trim()
      : '';

  const updated = accounts.map((acc) => {
    if (acc.id === targetAccountId) {
      return { ...acc, isPrimary: true, alias: PRIMARY_BANK_ALIAS };
    }
    if (acc.isPrimary) {
      return { ...acc, isPrimary: false, alias: targetOldAlias };
    }
    return { ...acc, isPrimary: false };
  });

  return syncBankAccountsConsistency(updated);
};

export const normalizeBankAccountsAfterRemoval = (
  accounts: EmployeeBankAccount[],
  removedId: string
): EmployeeBankAccount[] => {
  const remaining = accounts.filter((a) => a.id !== removedId);
  return syncBankAccountsConsistency(remaining);
};

export const getAvailableBankAliasOptions = (
  accounts: EmployeeBankAccount[],
  currentAccount: EmployeeBankAccount
): { value: string; label: string; disabled?: boolean; disabledReason?: string }[] => {
  if (currentAccount.isPrimary) {
    return [{ value: PRIMARY_BANK_ALIAS, label: PRIMARY_BANK_ALIAS }];
  }

  const usedByOthers = new Map<string, number>();
  accounts.forEach((acc, idx) => {
    if (acc.id !== currentAccount.id && acc.alias) {
      usedByOthers.set(acc.alias.trim().toLowerCase(), idx + 1);
    }
  });

  const currentAlias = (currentAccount.alias || '').trim();
  const baseList = [...SECONDARY_BANK_ALIASES];
  if (
    currentAlias &&
    currentAlias.toLowerCase() !== PRIMARY_BANK_ALIAS.toLowerCase() &&
    !baseList.some((b) => b.toLowerCase() === currentAlias.toLowerCase())
  ) {
    baseList.push(currentAlias);
  }

  return baseList.map((opt) => {
    const ownerNumber = usedByOthers.get(opt.toLowerCase());
    return {
      value: opt,
      label: opt,
      disabled: ownerNumber !== undefined,
      disabledReason: ownerNumber !== undefined ? `En Cuenta #${ownerNumber}` : undefined
    };
  });
};

// ============================================================================
// COMPLETITUD DE EXPEDIENTES Y CARGA FLEXIBLE DE PERSONAL (CSV / EXCEL / LOTE)
// ============================================================================

const AVATAR_COLOR_PALETTE = [
  '#1D4ED8',
  '#0284C7',
  '#059669',
  '#7C3AED',
  '#D97706',
  '#DC2626',
  '#BE185D',
  '#0891B2'
];

export const pickAvatarColor = (seedText: string): string => {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLOR_PALETTE[hash % AVATAR_COLOR_PALETTE.length];
};

export const computeInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const titles = new Set(['ing.', 'ing', 'lic.', 'lic', 'mtra.', 'mtra', 'mtro.', 'mtro', 'dr.', 'dr', 'tec.', 'téc.']);
  const meaningful = parts.filter((p) => !titles.has(p.toLowerCase()));
  const src = meaningful.length >= 2 ? meaningful : parts;
  return `${src[0][0] || ''}${src[1][0] || ''}`.toUpperCase();
};

export type EmployeeEditTabKey = 'general' | 'contacto' | 'laboral' | 'nomina' | 'documentos';

export interface EmployeeMissingFieldItem {
  key: string;
  label: string;
  tab: EmployeeEditTabKey;
}

export interface EmployeeCompletenessInfo {
  percent: number;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  hasPhoto: boolean;
  missingFields: string[];
  missingItems: EmployeeMissingFieldItem[];
}

export const getEmployeeProfileCompleteness = (emp: Employee): EmployeeCompletenessInfo => {
  const missingItems: EmployeeMissingFieldItem[] = [];
  const addMissing = (key: string, label: string, tab: EmployeeEditTabKey) => {
    missingItems.push({ key, label, tab });
  };

  // 1-5: Identidad laboral y fotografía (General & Foto)
  const hasName = Boolean(emp.name && emp.name.trim().length >= 3);
  if (!hasName) addMissing('name', 'Nombre', 'general');

  const hasPosition = Boolean(emp.position && emp.position.trim() && emp.position !== 'Por definir');
  if (!hasPosition) addMissing('position', 'Puesto', 'general');

  const hasDepartment = Boolean(
    emp.department &&
    emp.department.trim() &&
    emp.department !== 'Por asignar' &&
    emp.department !== 'Sin asignar'
  );
  if (!hasDepartment) addMissing('department', 'Departamento', 'general');

  const hasLocation = Boolean(emp.location && emp.location.trim() && emp.location !== 'Por definir');
  if (!hasLocation) addMissing('location', 'Sede', 'general');

  const hasPhoto = Boolean(emp.photoUrl);
  if (!hasPhoto) addMissing('photo', 'Fotografía', 'general');

  // 6-9: Contacto, domicilio y emergencia (Contacto & Emergencia)
  const hasEmail = isValidEmail(emp.email || '') || isValidEmail(emp.emailPersonal || '');
  if (!hasEmail) addMissing('email', 'Correo', 'contacto');

  const hasPhone = Boolean(toRawDigits(emp.phoneCell || emp.phonePrimary || '').length >= 10);
  if (!hasPhone) addMissing('phone', 'Teléfono', 'contacto');

  const hasStructuredAddress = Boolean(
    (emp.addressStreet || '').trim().length >= 2 &&
    Boolean(
      (emp.addressColony || '').trim() ||
      (emp.addressCity || '').trim() ||
      (emp.addressZip || '').trim().length === 5
    )
  );
  const cleanedAddress = (emp.address || '').replace(/[#,\s]|Col\.|C\.P\./gi, '').trim();
  const hasAddress = hasStructuredAddress || cleanedAddress.length >= 10;
  if (!hasAddress) addMissing('address', 'Domicilio', 'contacto');

  const hasEmergencyContact = Boolean(
    (emp.emergencyContact || '').trim().length >= 3 &&
    toRawDigits(emp.emergencyPhone || '').length >= 10
  );
  if (!hasEmergencyContact) addMissing('emergency', 'Emergencia', 'contacto');

  // 10-12: Identificadores fiscales y seguro social (Laboral & Fiscal)
  const hasRfc = Boolean((emp.rfc || '').trim().length >= 12);
  if (!hasRfc) addMissing('rfc', 'RFC', 'laboral');

  const hasCurp = Boolean((emp.curp || '').trim().length === 18);
  if (!hasCurp) addMissing('curp', 'CURP', 'laboral');

  const hasNss = Boolean(toRawDigits(emp.nss || '').length === 11);
  if (!hasNss) addMissing('nss', 'NSS', 'laboral');

  // 13-14: Salud básica y cuenta de nómina (Salud, Uniformes & Bancos)
  const hasBloodType = Boolean((emp.bloodType || '').trim());
  if (!hasBloodType) addMissing('bloodType', 'Tipo de sangre', 'nomina');

  const hasDirectPayroll = Boolean(
    (emp.bank || '').trim().length >= 2 &&
    toRawDigits(emp.clabe || '').length === 18
  );
  const hasAccountPayroll =
    Array.isArray(emp.bankAccounts) &&
    emp.bankAccounts.some(
      (acc) => (acc.bank || '').trim().length >= 2 && toRawDigits(acc.clabe || '').length === 18
    );
  if (!hasDirectPayroll && !hasAccountPayroll) {
    addMissing('payroll', 'Nómina (Banco y CLABE)', 'nomina');
  }

  // 15: Constancia de Situación Fiscal SAT (Constancia & Cursos)
  const hasCsfDoc =
    Array.isArray(emp.documents) &&
    emp.documents.some(
      (d) =>
        d.category.toLowerCase().includes('constancia') &&
        d.category.toLowerCase().includes('fiscal') &&
        Boolean(d.fileDataUrl || d.fileName || d.externalUrl)
    );
  const hasCsf = Boolean(
    emp.taxCertificateFileUrl ||
    emp.taxCertificateStatus === 'Vigente' ||
    hasCsfDoc
  );
  if (!hasCsf) addMissing('csf', 'Constancia Fiscal (CSF)', 'documentos');

  // Campos opcionales (NO afectan el 100%): Cursos/DC-3, Uniformes EPP,
  // Discapacidad/Padecimientos/Alergias, Tarjeta 16 dígitos, Jefe, Cuadrilla.
  const totalCount = 15;
  const completedCount = totalCount - missingItems.length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const isComplete = missingItems.length === 0;
  const missingFields = missingItems.map((item) => item.label);

  return {
    percent,
    completedCount,
    totalCount,
    isComplete,
    hasPhoto,
    missingFields,
    missingItems
  };
};

export const readCsvFileWithEncoding = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const utf8Text = new TextDecoder('utf-8').decode(buffer);
  if (utf8Text.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(buffer);
  }
  return utf8Text.replace(/^\uFEFF/, '');
};

const normalizeCsvToken = (text: string): string =>
  text
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const detectCsvDelimiter = (sampleText: string): ',' | ';' | '\t' => {
  const firstLine = sampleText.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  const countOutsideQuotes = (char: string) => {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === '"') inQuotes = !inQuotes;
      else if (!inQuotes && firstLine[i] === char) count++;
    }
    return count;
  };
  const tabs = countOutsideQuotes('\t');
  const semis = countOutsideQuotes(';');
  const commas = countOutsideQuotes(',');
  if (tabs >= semis && tabs >= commas && tabs > 0) return '\t';
  if (semis > commas && semis > 0) return ';';
  return ',';
};

const parseDelimitedRows = (rawText: string, delimiter: string): string[][] => {
  const cleaned = rawText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
};

type CsvMappedField =
  | 'id'
  | 'name'
  | 'lastName1'
  | 'lastName2'
  | 'lastNames'
  | 'position'
  | 'department'
  | 'subsidiary'
  | 'location'
  | 'squad'
  | 'email'
  | 'emailPersonal'
  | 'phoneCell'
  | 'phonePrimary'
  | 'officeExtension'
  | 'supervisor'
  | 'rfc'
  | 'curp'
  | 'nss'
  | 'bank'
  | 'clabe'
  | 'cardNumber'
  | 'salary'
  | 'contractType'
  | 'hireDate'
  | 'bloodType'
  | 'address'
  | 'emergencyContact'
  | 'emergencyPhone'
  | 'employmentStatus'
  | 'stateProvince';

const CSV_HEADER_MAP: Record<string, CsvMappedField> = {
  id: 'id',
  folio: 'id',
  folio_empleado: 'id',
  clave: 'id',
  no_empleado: 'id',
  numero_empleado: 'id',
  num_empleado: 'id',
  nombre: 'name',
  nombres: 'name',
  nombre_s: 'name',
  nombre_completo: 'name',
  colaborador: 'name',
  empleado: 'name',
  name: 'name',
  apellido_paterno: 'lastName1',
  primer_apellido: 'lastName1',
  paterno: 'lastName1',
  apellido_materno: 'lastName2',
  segundo_apellido: 'lastName2',
  materno: 'lastName2',
  apellidos: 'lastNames',
  puesto: 'position',
  puesto_oficial: 'position',
  puesto_de_trabajo: 'position',
  cargo: 'position',
  especialidad: 'position',
  position: 'position',
  departamento: 'department',
  depto: 'department',
  area: 'department',
  gerencia: 'department',
  department: 'department',
  empresa: 'subsidiary',
  subsidiaria: 'subsidiary',
  razon_social: 'subsidiary',
  ubicacion: 'location',
  sede: 'location',
  base: 'location',
  base_ubicacion: 'location',
  ciudad: 'location',
  location: 'location',
  provincia: 'stateProvince',
  estado_provincia: 'stateProvince',
  entidad: 'stateProvince',
  entidad_federativa: 'stateProvince',
  cuadrilla: 'squad',
  categoria: 'squad',
  categoria_de_puesto: 'squad',
  correo: 'email',
  correo_electronico: 'email',
  correo_corporativo: 'email',
  email: 'email',
  mail: 'email',
  e_mail: 'email',
  correo_personal: 'emailPersonal',
  email_personal: 'emailPersonal',
  celular: 'phoneCell',
  telefono_celular: 'phoneCell',
  tel_celular: 'phoneCell',
  movil: 'phoneCell',
  whatsapp: 'phoneCell',
  telefono: 'phonePrimary',
  tel: 'phonePrimary',
  tel_fijo: 'phonePrimary',
  telefono_fijo: 'phonePrimary',
  extension: 'officeExtension',
  ext: 'officeExtension',
  extension_telefonica: 'officeExtension',
  supervisor: 'supervisor',
  jefe: 'supervisor',
  jefe_asignado: 'supervisor',
  jefe_inmediato: 'supervisor',
  lider: 'supervisor',
  rfc: 'rfc',
  curp: 'curp',
  nss: 'nss',
  imss: 'nss',
  nss_imss: 'nss',
  numero_seguro_social: 'nss',
  numero_de_seguridad_social: 'nss',
  no_de_seguridad_social: 'nss',
  n_de_seguridad_social: 'nss',
  no_seguridad_social: 'nss',
  n_seguridad_social: 'nss',
  num_seguridad_social: 'nss',
  seguridad_social: 'nss',
  banco: 'bank',
  institucion_bancaria: 'bank',
  clabe: 'clabe',
  clabe_interbancaria: 'clabe',
  tarjeta: 'cardNumber',
  numero_tarjeta: 'cardNumber',
  sueldo: 'salary',
  salario: 'salary',
  contrato: 'contractType',
  tipo_contrato: 'contractType',
  fecha_ingreso: 'hireDate',
  fecha_de_ingreso: 'hireDate',
  ingreso: 'hireDate',
  tipo_sangre: 'bloodType',
  sangre: 'bloodType',
  domicilio: 'address',
  direccion: 'address',
  contacto_emergencia: 'emergencyContact',
  tel_emergencia: 'emergencyPhone',
  telefono_emergencia: 'emergencyPhone',
  estatus: 'employmentStatus',
  estado: 'employmentStatus'
};

const MEXICAN_STATE_ABBR_MAP: Record<string, string> = {
  ver: 'Ver.',
  veracruz: 'Ver.',
  tab: 'Tab.',
  tabasco: 'Tab.',
  camp: 'Camp.',
  campeche: 'Camp.',
  yuc: 'Yuc.',
  yucatan: 'Yuc.',
  cdmx: 'CDMX',
  df: 'CDMX',
  oax: 'Oax.',
  oaxaca: 'Oax.',
  chis: 'Chis.',
  chiapas: 'Chis.',
  pue: 'Pue.',
  puebla: 'Pue.',
  nl: 'N.L.',
  tamps: 'Tamps.',
  tamaulipas: 'Tamps.',
  qroo: 'Q. Roo',
  jal: 'Jal.',
  mex: 'Edo. Méx.'
};

const formatCityAndState = (city?: string, stateProvince?: string): string => {
  const cleanCity = (city || '').trim();
  const cleanState = (stateProvince || '').trim();
  if (!cleanCity && !cleanState) return 'Minatitlán, Ver.';
  if (!cleanState) return cleanCity;
  if (cleanCity.includes(',')) return cleanCity;
  const stateKey = cleanState
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  const formattedState = MEXICAN_STATE_ABBR_MAP[stateKey] || cleanState;
  return cleanCity ? `${cleanCity}, ${formattedState}` : formattedState;
};

const matchDepartmentName = (rawDept: string, availableDepartments: string[]): string => {
  const clean = rawDept.trim();
  if (!clean) return 'Por asignar';

  const aliasMap: Record<string, string> = {
    rh: 'Recursos Humanos',
    rrhh: 'Recursos Humanos',
    recursos_humanos: 'Recursos Humanos',
    capacitacion: 'Recursos Humanos',
    ti: 'Infraestructura',
    sistemas: 'Infraestructura',
    it: 'Infraestructura',
    infraestructura: 'Infraestructura',
    sh: 'HSE',
    seguridad: 'HSE',
    salud_ocupacional: 'HSE',
    hse_mina: 'HSE',
    hse_minatitlan: 'HSE',
    hse_comalcalco: 'HSE',
    definicion_de_soluciones: 'Ventas',
    medicion_y_control: 'Medición y Control de Proyectos',
    control_de_proyectos: 'Medición y Control de Proyectos'
  };

  // Si viene en formato jerárquico ("Dirección : Servicios", "Dirección : Recursos Humanos : Capacitación"),
  // evaluamos desde el segmento más específico (el de la derecha) hacia la izquierda.
  const hierarchySegments = clean
    .split(/[:>/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .reverse();

  const candidatesToCheck = hierarchySegments.length > 0 ? hierarchySegments : [clean];

  for (const segment of candidatesToCheck) {
    const norm = normalizeCsvToken(segment);
    if (!norm) continue;

    if (aliasMap[norm]) {
      const foundAlias = availableDepartments.find(
        (d) => normalizeCsvToken(d) === normalizeCsvToken(aliasMap[norm])
      );
      return foundAlias || aliasMap[norm];
    }

    const exact = availableDepartments.find((d) => normalizeCsvToken(d) === norm);
    if (exact) return exact;
  }

  // Fallback por coincidencia parcial priorizando el segmento más específico y el nombre más largo
  const sortedDepts = [...availableDepartments].sort((a, b) => b.length - a.length);
  for (const segment of candidatesToCheck) {
    const norm = normalizeCsvToken(segment);
    if (!norm) continue;
    const partial = sortedDepts.find(
      (d) => normalizeCsvToken(d).includes(norm) || norm.includes(normalizeCsvToken(d))
    );
    if (partial) return partial;
  }

  return candidatesToCheck[0] || clean;
};

export interface CsvImportRowResult {
  employee: Employee;
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedExistingId?: string;
}

export interface CsvParseSummary {
  rows: CsvImportRowResult[];
  detectedHeader: boolean;
  detectedColumns: string[];
  totalParsed: number;
  readyToImportCount: number;
  duplicateCount: number;
}

const SPANISH_NAME_PARTICLES = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'san',
  'santa',
  'da',
  'do',
  'mc',
  'mac'
]);

/**
 * Divide un nombre completo mexicano en Nombre(s), Apellido Paterno y Apellido Materno,
 * preservando partículas compuestas ("de la", "del", "de los", "San", etc.).
 */
export const splitMexicanFullName = (
  fullName: string
): { firstName: string; paternalSurname: string; maternalSurname: string } => {
  const cleaned = fullName.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return { firstName: '', paternalSurname: '', maternalSurname: '' };
  }

  const rawTokens = cleaned.split(' ').filter(Boolean);
  const tokens: string[] = [];
  let i = 0;
  while (i < rawTokens.length) {
    let chunk = rawTokens[i];
    while (SPANISH_NAME_PARTICLES.has(chunk.toLowerCase()) && i + 1 < rawTokens.length) {
      i += 1;
      chunk = `${chunk} ${rawTokens[i]}`;
    }
    tokens.push(chunk);
    i += 1;
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], paternalSurname: '', maternalSurname: '' };
  }
  if (tokens.length === 2) {
    return { firstName: tokens[0], paternalSurname: tokens[1], maternalSurname: '' };
  }
  if (tokens.length === 3) {
    return { firstName: tokens[0], paternalSurname: tokens[1], maternalSurname: tokens[2] };
  }
  return {
    firstName: tokens.slice(0, tokens.length - 2).join(' '),
    paternalSurname: tokens[tokens.length - 2],
    maternalSurname: tokens[tokens.length - 1]
  };
};

export const buildQuickEmployeeRecord = (
  partial: Partial<Employee> & { name: string },
  existingEmployees: Employee[]
): Employee => {
  const cleanName = partial.name.trim();
  const autoSplit = splitMexicanFullName(cleanName);
  const firstName = partial.firstName?.trim() || autoSplit.firstName || undefined;
  const paternalSurname = partial.paternalSurname?.trim() || autoSplit.paternalSurname || undefined;
  const maternalSurname = partial.maternalSurname?.trim() || autoSplit.maternalSurname || undefined;
  const folio = partial.id?.trim() || getNextEmployeeFolio(existingEmployees);
  const rawClabe = partial.clabe ? toRawDigits(partial.clabe) : '';
  const bankName = partial.bank?.trim() || '';

  return {
    id: folio,
    name: cleanName,
    firstName,
    paternalSurname,
    maternalSurname,
    email: (partial.email || '').trim().toLowerCase(),
    emailPersonal: partial.emailPersonal?.trim().toLowerCase() || undefined,
    initials: computeInitials(cleanName),
    avatarBg: pickAvatarColor(cleanName + folio),
    position: partial.position?.trim() || 'Por definir',
    department: partial.department?.trim() || 'Por asignar',
    subsidiary: partial.subsidiary?.trim() || 'SIFYGSA',
    location: partial.location?.trim() || 'Minatitlán, Ver.',
    squad: partial.squad?.trim() || '',
    silStatus: partial.silStatus?.trim() || 'En Trámite',
    silStatusType: partial.silStatusType || 'info',
    employmentStatus: partial.employmentStatus || 'Activo',
    hireDate: partial.hireDate?.trim() || new Date().toLocaleDateString('es-MX'),
    phoneCell: partial.phoneCell?.trim() || undefined,
    phonePrimary: partial.phonePrimary?.trim() || undefined,
    officeExtension: partial.officeExtension?.trim() || undefined,
    supervisor: partial.supervisor?.trim() || undefined,
    rfc: partial.rfc?.trim().toUpperCase() || undefined,
    curp: partial.curp?.trim().toUpperCase() || undefined,
    nss: partial.nss?.trim() || undefined,
    salary: partial.salary?.trim() || undefined,
    contractType: partial.contractType?.trim() || undefined,
    bloodType: partial.bloodType?.trim() || undefined,
    address: partial.address?.trim() || undefined,
    emergencyContact: partial.emergencyContact?.trim() || undefined,
    emergencyPhone: partial.emergencyPhone?.trim() || undefined,
    bank: bankName || undefined,
    clabe: rawClabe || undefined,
    cardNumber: partial.cardNumber?.trim() || undefined,
    bankAccounts:
      bankName || rawClabe
        ? [
            {
              id: `bank-${Date.now()}`,
              bank: bankName,
              clabe: rawClabe,
              cardNumber: partial.cardNumber?.trim() || undefined,
              alias: PRIMARY_BANK_ALIAS,
              isPrimary: true
            }
          ]
        : undefined
  };
};

export const parseEmployeesFromCsvOrText = (
  rawText: string,
  existingEmployees: Employee[],
  availableDepartments: string[]
): CsvParseSummary => {
  const delimiter = detectCsvDelimiter(rawText);
  const rawRows = parseDelimitedRows(rawText, delimiter);
  if (rawRows.length === 0) {
    return { rows: [], detectedHeader: false, detectedColumns: [], totalParsed: 0, readyToImportCount: 0, duplicateCount: 0 };
  }

  const firstRowNormalized = rawRows[0].map(normalizeCsvToken);
  const mappedHeaders: (CsvMappedField | null)[] = firstRowNormalized.map(
    (token) => CSV_HEADER_MAP[token] || null
  );
  const detectedHeader = mappedHeaders.some(Boolean);

  const FIELD_LABELS: Partial<Record<CsvMappedField, string>> = {
    name: 'Nombre → Separado',
    lastName1: 'Ap. Paterno',
    lastName2: 'Ap. Materno',
    nss: 'NSS',
    rfc: 'RFC',
    curp: 'CURP',
    department: 'Departamento',
    position: 'Puesto',
    bloodType: 'Tipo de Sangre',
    location: 'Ciudad / Sede',
    stateProvince: 'Estado',
    email: 'Correo',
    phoneCell: 'Celular',
    salary: 'Sueldo',
    contractType: 'Contrato',
    bank: 'Banco',
    clabe: 'CLABE',
    hireDate: 'Fecha Ingreso'
  };
  const detectedColumns = Array.from(
    new Set(
      mappedHeaders
        .filter((f): f is CsvMappedField => Boolean(f))
        .map((f) => FIELD_LABELS[f] || f)
    )
  );
  const dataRows = detectedHeader ? rawRows.slice(1) : rawRows;

  const runningList = [...existingEmployees];
  const results: CsvImportRowResult[] = [];

  for (const cells of dataRows) {
    const record: Partial<Record<CsvMappedField, string>> = {};

    if (detectedHeader) {
      mappedHeaders.forEach((fieldKey, colIdx) => {
        if (fieldKey && cells[colIdx] !== undefined) {
          const val = cells[colIdx].trim();
          if (val && !record[fieldKey]) {
            record[fieldKey] = val;
          }
        }
      });
    } else {
      // Sin encabezados: heurística flexible (acepta desde 1 sola columna con Nombre hasta tablas sin título)
      const unassigned: string[] = [];
      for (const rawCell of cells) {
        const val = rawCell.trim();
        if (!val) continue;
        if (!record.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          record.email = val;
        } else if (!record.curp && /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(val.replace(/\s+/g, ''))) {
          record.curp = val.toUpperCase();
        } else if (!record.rfc && /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(val.replace(/\s+/g, ''))) {
          record.rfc = val.toUpperCase();
        } else if (!record.phoneCell && val.replace(/\D/g, '').length === 10 && !/[a-zA-Z]/.test(val)) {
          record.phoneCell = formatPhoneMask(val).formatted;
        } else {
          unassigned.push(val);
        }
      }
      if (unassigned[0]) record.name = unassigned[0];
      if (unassigned[1]) record.position = unassigned[1];
      if (unassigned[2]) record.department = unassigned[2];
      if (unassigned[3]) record.location = unassigned[3];
    }

    const composedName = [record.name, record.lastName1, record.lastName2, record.lastNames]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const fallbackName =
      composedName ||
      (record.email ? record.email.split('@')[0].replace(/[._-]+/g, ' ') : '') ||
      record.id ||
      '';

    if (!fallbackName.trim()) continue;

    const cleanPhoneCell = record.phoneCell
      ? toRawDigits(record.phoneCell).length >= 10
        ? formatPhoneMask(record.phoneCell).formatted
        : record.phoneCell
      : undefined;

    const cleanPhonePrimary = record.phonePrimary
      ? toRawDigits(record.phonePrimary).length >= 10
        ? formatPhoneMask(record.phonePrimary).formatted
        : record.phonePrimary
      : undefined;

    const resolvedDept = record.department
      ? matchDepartmentName(record.department, availableDepartments)
      : 'Por asignar';

    const statusLower = (record.employmentStatus || '').toLowerCase();
    const employmentStatus: 'Activo' | 'Inactivo' =
      statusLower.includes('inactivo') || statusLower.includes('baja') ? 'Inactivo' : 'Activo';

    const explicitSplit =
      record.lastName1 || record.lastName2
        ? {
            firstName: (record.name || '').trim(),
            paternalSurname: (record.lastName1 || '').trim(),
            maternalSurname: (record.lastName2 || '').trim()
          }
        : splitMexicanFullName(fallbackName);

    const candidate = buildQuickEmployeeRecord(
      {
        id: record.id?.trim() || undefined,
        name: fallbackName,
        firstName: explicitSplit.firstName || undefined,
        paternalSurname: explicitSplit.paternalSurname || undefined,
        maternalSurname: explicitSplit.maternalSurname || undefined,
        position: record.position?.trim() || 'Por definir',
        department: resolvedDept,
        subsidiary: record.subsidiary?.trim() || 'SIFYGSA',
        location: formatCityAndState(record.location, record.stateProvince),
        squad: record.squad?.trim() || '',
        email: (record.email || '').trim().toLowerCase(),
        emailPersonal: record.emailPersonal?.trim().toLowerCase() || undefined,
        phoneCell: cleanPhoneCell,
        phonePrimary: cleanPhonePrimary,
        officeExtension: record.officeExtension?.trim() || undefined,
        supervisor: record.supervisor?.trim() || undefined,
        rfc: record.rfc ? formatRfcMask(record.rfc).value : undefined,
        curp: record.curp ? formatCurpMask(record.curp).value : undefined,
        nss: record.nss ? formatNssMask(record.nss).formatted : undefined,
        bank: record.bank?.trim() || undefined,
        clabe: record.clabe || undefined,
        cardNumber: record.cardNumber ? formatCardMask(record.cardNumber).formatted : undefined,
        salary: record.salary?.trim() || undefined,
        contractType: record.contractType?.trim() || undefined,
        hireDate: record.hireDate?.trim() || undefined,
        bloodType: record.bloodType?.trim() || undefined,
        address: record.address?.trim() || undefined,
        emergencyContact: record.emergencyContact?.trim() || undefined,
        emergencyPhone: record.emergencyPhone?.trim() || undefined,
        employmentStatus
      },
      runningList
    );

    const matchedById = runningList.find(
      (e) => e.id.trim().toLowerCase() === candidate.id.trim().toLowerCase()
    );
    const duplicateId = Boolean(matchedById);
    const identifierDup = checkDuplicateEmployeeIdentifiers(
      {
        name: candidate.name,
        rfc: candidate.rfc,
        curp: candidate.curp,
        nss: candidate.nss
      },
      runningList
    );

    const matchedByExisting =
      matchedById ||
      existingEmployees.find(
        (e) =>
          (candidate.curp && e.curp && e.curp.toUpperCase() === candidate.curp.toUpperCase()) ||
          (candidate.rfc && e.rfc && e.rfc.toUpperCase() === candidate.rfc.toUpperCase()) ||
          (candidate.nss && e.nss && toRawDigits(e.nss) === toRawDigits(candidate.nss)) ||
          e.name.trim().toLowerCase() === candidate.name.trim().toLowerCase()
      );

    const isDuplicate = duplicateId || identifierDup.hasConflict || Boolean(identifierDup.isHomonym);
    const duplicateReason = duplicateId
      ? `Folio ${candidate.id} repetido`
      : identifierDup.hasConflict
      ? identifierDup.toastMessage
      : identifierDup.isHomonym
      ? 'Nombre ya registrado'
      : undefined;

    runningList.unshift(candidate);

    results.push({
      employee: candidate,
      isDuplicate,
      duplicateReason,
      matchedExistingId: matchedByExisting?.id
    });
  }

  const readyToImportCount = results.filter((r) => !r.isDuplicate).length;
  const duplicateCount = results.length - readyToImportCount;

  return {
    rows: results,
    detectedHeader,
    detectedColumns,
    totalParsed: results.length,
    readyToImportCount,
    duplicateCount
  };
};




