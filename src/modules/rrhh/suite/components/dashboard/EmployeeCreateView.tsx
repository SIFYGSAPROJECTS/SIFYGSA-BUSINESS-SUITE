'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserPlus,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Image as ImageIcon,
  Lock,
  Check,
  Plus,
  CreditCard,
  FileText,
  Upload,
  Award,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  HeartPulse,
  MapPin,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  User,
  Folder,
  FolderOpen,
  FolderPlus
} from 'lucide-react';
import { Employee, EmployeeBankAccount, EmployeeDocumentItem } from '../../types';
import { CvImportDraft } from '../../utils/cvParser';
import { DEPARTMENTS, INITIAL_DEPARTMENTS, EMPLOYEES } from '../../data/mockData';
import {
  sanitizePersonName,
  sanitizeCleanText,
  formatPhoneMask,
  formatNssMask,
  formatClabeMask,
  formatCardMask,
  formatCurrencyMask,
  formatRfcMask,
  formatCurpMask,
  sanitizeShoeSize,
  sanitizeExtension,
  toRawDigits,
  isValidEmail,
  loadPersistedEmployees,
  savePersistedEmployees,
  getNextEmployeeFolio,
  checkDuplicateEmployeeIdentifiers,
  logHrAuditAction,
  useSyncedDepartments,
  useSyncedEmployees,
  useSyncedExtensions,
  resolveDepartmentExtension,
  resolveDepartmentManager,
  lookupMexicanPostalCode,
  loadPersistedBanks,
  savePersistedBanks,
  SHOE_SIZE_OPTIONS,
  PRIMARY_BANK_ALIAS
} from '../../utils/formShield';

const CONTRACT_TYPES_STORAGE_KEY = 'sifygsa_contract_types_catalog_v1';
const JOB_POSITIONS_STORAGE_KEY = 'sifygsa_job_positions_catalog_v1';

const DEFAULT_CONTRACT_TYPES = [
  'Tiempo Indeterminado',
  'Tiempo Determinado',
  'Por Obra Determinada',
  'Periodo de Prueba',
  'Capacitación Inicial'
];

const DEFAULT_JOB_POSITIONS = [
  'Becario',
  'Auxiliar Administrativo',
  'Auxiliar de TI',
  'Técnico Especialista F&G',
  'Ingeniero de Servicio',
  'Supervisor de Seguridad (HSE)',
  'Analista de Compras',
  'Coordinador Operativo',
  'Gerente de Área'
];

let docSeq = 0;
const createLocalDocId = () => {
  docSeq += 1;
  return `doc-${Date.now()}-${docSeq}`;
};

const getFocusableFormControls = (form: HTMLFormElement): HTMLElement[] => {
  const candidates = Array.from(
    form.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([readonly]):not([type="checkbox"]):not([type="file"]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button.input-text:not([disabled])'
    )
  );
  return candidates.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
  });
};

const moveFocusNext = (currentEl: HTMLElement | null) => {
  if (!currentEl) return;
  const form = currentEl.closest('form') as HTMLFormElement | null;
  if (!form) return;
  const focusable = getFocusableFormControls(form);
  const index = focusable.indexOf(currentEl);
  if (index > -1 && index < focusable.length - 1) {
    const nextEl = focusable[index + 1];
    nextEl.focus();
    if (nextEl.dataset.autoOpenOnFocus === 'true') {
      window.setTimeout(() => {
        nextEl.dispatchEvent(new CustomEvent('sifygsa-auto-open'));
      }, 15);
    }
  }
};

const WORK_LOCATIONS = [
  { value: 'Minatitlán, Ver.', label: 'Minatitlán, Ver.' },
  { value: 'Mapachapa, Ver.', label: 'Mapachapa, Ver.' },
  { value: 'Comalcalco, Tab.', label: 'Comalcalco, Tab.' },
  { value: 'Xalapa, Ver.', label: 'Xalapa, Ver.' },
  { value: 'Ciudad del Carmen, Camp.', label: 'Ciudad del Carmen, Camp.' },
  { value: 'Mérida, Yuc.', label: 'Mérida, Yuc.' }
];

// =========================================================================
// COMPONENTE: SELECT PERSONALIZADO CON FLECHA ANIMADA Y NAVEGACIÓN POR TECLADO
// =========================================================================
interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface CustomSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  dataField?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  onAfterSelect?: (selectedValue: string, buttonEl: HTMLElement | null) => void;
  autoOpenOnEnterFocus?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  dataField,
  onKeyDown,
  onAfterSelect,
  autoOpenOnEnterFocus = true,
  hasError = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const findNextEnabledIndex = (start: number, step: 1 | -1): number => {
    if (options.length === 0) return 0;
    for (let i = 0; i < options.length; i++) {
      const candidate = (start + step * i + options.length * 2) % options.length;
      if (!options[candidate]?.disabled) return candidate;
    }
    return start;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const handleAutoOpen = () => {
      if (disabled) return;
      const idx = options.findIndex((opt) => opt.value === value && !opt.disabled);
      setHighlightedIndex(idx >= 0 ? idx : findNextEnabledIndex(0, 1));
      setIsOpen(true);
      window.requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    };
    btn.addEventListener('sifygsa-auto-open', handleAutoOpen);
    return () => btn.removeEventListener('sifygsa-auto-open', handleAutoOpen);
  }, [options, value, disabled]);

  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlightedIndex]);

  const selectedOption = options.find((opt) => opt.value === value);

  const openMenu = (preferredIndex?: number) => {
    if (disabled) return;
    const currentIdx = options.findIndex((opt) => opt.value === value && !opt.disabled);
    const baseIdx =
      preferredIndex !== undefined
        ? preferredIndex
        : currentIdx >= 0
        ? currentIdx
        : findNextEnabledIndex(0, 1);
    setHighlightedIndex(options[baseIdx]?.disabled ? findNextEnabledIndex(baseIdx, 1) : baseIdx);
    setIsOpen(true);
  };

  const selectAndAdvance = (optValue: string) => {
    const btn = buttonRef.current;
    onChange(optValue);
    setIsOpen(false);
    window.setTimeout(() => {
      if (onAfterSelect) {
        onAfterSelect(optValue, btn);
      } else {
        moveFocusNext(btn);
      }
    }, 25);
  };

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: isOpen ? 60 : 1 }} ref={containerRef}>
      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        data-field={dataField}
        data-auto-open-on-focus={!disabled && autoOpenOnEnterFocus ? 'true' : undefined}
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Tab') {
            setIsOpen(false);
            return;
          }

          if (e.key === 'Escape') {
            if (isOpen) {
              e.preventDefault();
              setIsOpen(false);
            }
            return;
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
              openMenu();
            } else if (options.length > 0) {
              setHighlightedIndex((prev) => findNextEnabledIndex(prev + 1, 1));
            }
            return;
          }

          if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
              openMenu(findNextEnabledIndex(options.length - 1, -1));
            } else if (options.length > 0) {
              setHighlightedIndex((prev) => findNextEnabledIndex(prev - 1, -1));
            }
            return;
          }

          if (isOpen && e.key === 'Home') {
            e.preventDefault();
            setHighlightedIndex(findNextEnabledIndex(0, 1));
            return;
          }

          if (isOpen && e.key === 'End' && options.length > 0) {
            e.preventDefault();
            setHighlightedIndex(findNextEnabledIndex(options.length - 1, -1));
            return;
          }

          if (e.key === ' ' && !isOpen) {
            e.preventDefault();
            openMenu();
            return;
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen) {
              const targetOpt = options[highlightedIndex];
              if (targetOpt && !targetOpt.disabled) {
                selectAndAdvance(targetOpt.value);
              } else {
                setIsOpen(false);
              }
            } else if (!selectedOption) {
              openMenu();
            } else if (onKeyDown) {
              onKeyDown(e);
            } else {
              moveFocusNext(buttonRef.current);
            }
            return;
          }

          if (onKeyDown) {
            onKeyDown(e);
          }
        }}
        className="input-text"
        style={{
          width: '100%',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0 12px',
          textAlign: 'left',
          backgroundColor: disabled ? 'var(--surface-alt)' : 'var(--surface)',
          borderColor: hasError ? 'var(--danger)' : isOpen ? 'var(--primary)' : 'var(--border)',
          boxShadow: hasError
            ? '0 0 0 3px rgba(239, 68, 68, 0.2)'
            : isOpen
            ? '0 0 0 3px var(--brand-100)'
            : 'none',
          transition: 'all var(--transition-fast)'
        }}
        title={disabled ? `${label} (Asignado automáticamente)` : `Seleccionar ${label}`}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '12.5px',
            color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: selectedOption ? 600 : 400
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {disabled ? (
          <Lock className="w-3.5 h-3.5 text-muted" style={{ flexShrink: 0, marginLeft: '8px' }} />
        ) : (
          <ChevronDown
            className="w-4 h-4 text-muted"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
              marginLeft: '8px'
            }}
          />
        )}
      </button>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 999,
            maxHeight: '265px',
            overflowY: 'auto',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--brand-200)',
            borderRadius: '12px',
            boxShadow: '0 14px 34px -6px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            padding: '5px'
          }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = !opt.disabled && idx === highlightedIndex;
            return (
              <div
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!opt.disabled) selectAndAdvance(opt.value);
                }}
                onMouseEnter={() => {
                  if (!opt.disabled) setHighlightedIndex(idx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isSelected || isHighlighted ? 700 : 500,
                  color: opt.disabled
                    ? 'var(--text-muted)'
                    : isSelected || isHighlighted
                    ? 'var(--primary)'
                    : 'var(--text-primary)',
                  backgroundColor: isHighlighted
                    ? 'var(--brand-100)'
                    : isSelected
                    ? 'var(--brand-50)'
                    : 'transparent',
                  opacity: opt.disabled ? 0.55 : 1,
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {opt.disabled ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    <Lock className="w-3 h-3" />
                    <span>{opt.disabledReason || 'En uso'}</span>
                  </span>
                ) : (
                  isSelected && <Check className="w-3.5 h-3.5 text-primary" style={{ flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// COMPONENTE: CAMPO CON AUTOCOMPLETADO EN LÍNEA ESTILO PLACEHOLDER + TAB
// =========================================================================
interface AutocompleteTextInputProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  dataField: string;
  value: string;
  onChangeValue: (nextVal: string) => void;
  suggestions: string[];
  placeholder: string;
  hasError?: boolean;
  required?: boolean;
  onAdvanceNext: (currentEl: HTMLElement | null) => void;
  onAutoCompleted?: (acceptedValue: string) => void;
}

const AutocompleteTextInput: React.FC<AutocompleteTextInputProps> = ({
  inputRef,
  dataField,
  value,
  onChangeValue,
  suggestions,
  placeholder,
  hasError = false,
  required = false,
  onAdvanceNext,
  onAutoCompleted
}) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const resolvedRef = inputRef || internalRef;
  const [isFocused, setIsFocused] = useState(false);

  const suggestion = useMemo(() => {
    if (!value.trim()) return null;
    const lowerVal = value.toLowerCase();
    const match = suggestions.find((item) => {
      const lowerItem = item.toLowerCase();
      return lowerItem.startsWith(lowerVal) && lowerItem !== lowerVal;
    });
    return match || null;
  }, [value, suggestions]);

  const showSuggestion = Boolean(suggestion && isFocused);
  const remainingText = showSuggestion && suggestion ? suggestion.slice(value.length) : '';

  const acceptSuggestion = () => {
    if (!suggestion) return;
    onChangeValue(suggestion);
    onAutoCompleted?.(suggestion);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '38px',
        borderRadius: 'var(--radius-control)',
        backgroundColor: hasError ? 'rgba(239, 68, 68, 0.03)' : 'var(--surface)'
      }}
    >
      {showSuggestion && remainingText && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            border: '1px solid transparent',
            padding: '7px 54px 7px 12px',
            fontSize: '12.5px',
            fontFamily: 'inherit',
            fontWeight: 400,
            lineHeight: '22px',
            letterSpacing: 'normal',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{ whiteSpace: 'pre', overflow: 'hidden', maxWidth: '100%' }}>
            <span style={{ color: 'transparent', userSelect: 'none' }}>{value}</span>
            <span style={{ color: 'var(--text-muted)' }}>{remainingText}</span>
          </div>
        </div>
      )}

      <input
        ref={resolvedRef}
        data-field={dataField}
        type="text"
        placeholder={placeholder}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        onChange={(e) => {
          if (!isFocused) setIsFocused(true);
          onChangeValue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && !e.shiftKey && suggestion) {
            e.preventDefault();
            acceptSuggestion();
            return;
          }
          if (
            e.key === 'ArrowRight' &&
            suggestion &&
            e.currentTarget.selectionStart === value.length &&
            e.currentTarget.selectionEnd === value.length
          ) {
            e.preventDefault();
            acceptSuggestion();
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdvanceNext(e.currentTarget);
          }
        }}
        className="input-text"
        style={{
          width: '100%',
          height: '38px',
          padding: showSuggestion ? '7px 54px 7px 12px' : '7px 12px',
          fontSize: '12.5px',
          fontWeight: 400,
          lineHeight: '22px',
          letterSpacing: 'normal',
          backgroundColor: 'transparent',
          position: 'relative',
          zIndex: 2,
          ...(hasError
            ? {
                borderColor: 'var(--danger)',
                boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)'
              }
            : {})
        }}
        required={required}
      />

      {showSuggestion && suggestion && (
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            acceptSuggestion();
            resolvedRef.current?.focus();
          }}
          title={`Presiona Tab para completar: ${suggestion}`}
          style={{
            position: 'absolute',
            right: '8px',
            zIndex: 3,
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--primary)',
            backgroundColor: 'var(--brand-50)',
            padding: '2px 7px',
            borderRadius: '4px',
            border: '1px solid var(--brand-200)',
            cursor: 'pointer',
            lineHeight: 1.3
          }}
        >
          Tab
        </button>
      )}
    </div>
  );
};

// =========================================================================
// VISTA PRINCIPAL: ALTA DE EMPLEADO
// =========================================================================
interface EmployeeCreateViewProps {
  onSuccess: (newEmployee: Employee) => void;
  onCancel: () => void;
  departments?: string[];
  initialCvDraft?: CvImportDraft | null;
  onConsumeCvDraft?: () => void;
}

export const EmployeeCreateView: React.FC<EmployeeCreateViewProps> = ({
  onCancel,
  departments,
  initialCvDraft,
  onConsumeCvDraft
}) => {
  const departmentsCatalog = useSyncedDepartments(INITIAL_DEPARTMENTS);
  const employeesCatalog = useSyncedEmployees(EMPLOYEES);
  const extensionsCatalog = useSyncedExtensions();

  const availableDepartments = useMemo(() => {
    const activeNames = departmentsCatalog
      .filter((d) => d.status === 'active')
      .map((d) => d.name);
    if (activeNames.length > 0) {
      return Array.from(new Set([...(departments || []), ...activeNames]));
    }
    return departments || DEPARTMENTS;
  }, [departmentsCatalog, departments]);

  const firstInputRef = useRef<HTMLInputElement>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepDirection, setStepDirection] = useState<'next' | 'prev'>('next');

  const handleSelectStep = (index: number) => {
    setStepDirection(index >= currentStepIndex ? 'next' : 'prev');
    setCurrentStepIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const STEP_IDS = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
    const idx = STEP_IDS.indexOf(sectionId);
    if (idx !== -1) {
      handleSelectStep(idx);
    }
  };

  const handleNextStep = () => {
    const STEP_IDS = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
    if (currentStepIndex < STEP_IDS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setStepDirection('next');
      setCurrentStepIndex(nextIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setStepDirection('prev');
      setCurrentStepIndex(prevIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [isAutoFolio, setIsAutoFolio] = useState(true);
  const [empId, setEmpId] = useState(() => getNextEmployeeFolio(loadPersistedEmployees(EMPLOYEES)));

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warning' = 'warning', durationMs = 2600) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, durationMs);
  };

  const getFieldStyle = (fieldName: string, extraStyle: React.CSSProperties = {}): React.CSSProperties => {
    if (errorField === fieldName) {
      return {
        ...extraStyle,
        borderColor: 'var(--danger)',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)',
        backgroundColor: 'rgba(239, 68, 68, 0.03)'
      };
    }
    return extraStyle;
  };

  // Catálogo persistente de Tipos de Contrato en BD/localStorage
  const [savedContractTypes, setSavedContractTypes] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(CONTRACT_TYPES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONTRACT_TYPES;
  });

  // Catálogo persistente de Puestos de Trabajo en BD/localStorage
  const [savedJobPositions, setSavedJobPositions] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(JOB_POSITIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_JOB_POSITIONS;
  });

  const jobPositionSuggestions = useMemo(() => {
    const dynamicPositions = employeesCatalog
      .map((emp) => (emp.position || '').trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const pos of [...savedJobPositions, ...dynamicPositions]) {
      const key = pos.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(pos);
      }
    }
    return merged;
  }, [savedJobPositions, employeesCatalog]);

  // Sección 1: Datos Laborales
  // Empresa fija y bloqueada en SIFYGSA S.A de C.V
  const subsidiary = 'SIFYGSA S.A de C.V';
  const [deptTecnico, setDeptTecnico] = useState('');
  const [baseDespliegue, setBaseDespliegue] = useState('Minatitlán, Ver.');
  const [tipoContrato, setTipoContrato] = useState('');
  const [salarioBruto, setSalarioBruto] = useState('');
  const [proyectoAsignado, setProyectoAsignado] = useState('');

  // Sección 2: Datos Personales
  const [categoriaLaboral, setCategoriaLaboral] = useState('');
  const [puestoOficial, setPuestoOficial] = useState('');
  const [nombrePila, setNombrePila] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [rfc, setRfc] = useState('');
  const [curp, setCurp] = useState('');
  const [nss, setNss] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [notasContratacion, setNotasContratacion] = useState('');

  // Sección 3: Contacto y Domicilio (Estructurado por campos para BD)
  const [telMovil, setTelMovil] = useState('');
  const [emailInstitucional, setEmailInstitucional] = useState('');
  const [emailPersonal, setEmailPersonal] = useState('');
  const [telFijo, setTelFijo] = useState('');
  const [extOficina, setExtOficina] = useState('');

  const [calle, setCalle] = useState('');
  const [numeroDomicilio, setNumeroDomicilio] = useState('');
  const [numeroInterior, setNumeroInterior] = useState('');
  const [colonia, setColonia] = useState('');
  const [coloniasPorCp, setColoniasPorCp] = useState<string[]>([]);
  const [isCustomColonia, setIsCustomColonia] = useState(false);
  const [isLoadingCp, setIsLoadingCp] = useState(false);
  const [codigoPostal, setCodigoPostal] = useState('');
  const [municipio, setMunicipio] = useState('Minatitlán');
  const [estadoDomicilio, setEstadoDomicilio] = useState('Veracruz');

  // Autollenar extensión telefónica y Jefe Asignado (gerente del depto) al seleccionar Departamento
  const handleSelectDepartment = (deptName: string) => {
    setErrorField((prev) => (prev === 'deptTecnico' ? null : prev));
    setDeptTecnico(deptName);

    const { primaryExtension } = resolveDepartmentExtension(deptName, baseDespliegue, extensionsCatalog);
    if (primaryExtension) {
      setExtOficina(primaryExtension);
    }

    const managerName = resolveDepartmentManager(
      deptName,
      baseDespliegue,
      departmentsCatalog,
      employeesCatalog,
      extensionsCatalog
    );
    setSupervisor(managerName);
  };

  const handleSelectBaseLocation = (locName: string) => {
    setBaseDespliegue(locName);
    if (deptTecnico) {
      const { primaryExtension } = resolveDepartmentExtension(deptTecnico, locName, extensionsCatalog);
      if (primaryExtension) {
        setExtOficina(primaryExtension);
      }
      const managerName = resolveDepartmentManager(
        deptTecnico,
        locName,
        departmentsCatalog,
        employeesCatalog,
        extensionsCatalog
      );
      if (managerName) {
        setSupervisor(managerName);
      }
    }
  };

  // Contacto de Emergencia (Integrado en Sección 3: Contacto y Domicilio)
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState('');
  const [contactoEmergenciaParentesco, setContactoEmergenciaParentesco] = useState('');
  const [contactoEmergenciaTel, setContactoEmergenciaTel] = useState('');

  // Sección 4: Salud y Uniformes (Calzado y Overol + salud ampliada)
  const [calzado, setCalzado] = useState('');
  const [isCustomCalzado, setIsCustomCalzado] = useState(false);
  const [camisa] = useState('');
  const [pantalon] = useState('');
  const [overol, setOverol] = useState('');
  const [isCustomOverol, setIsCustomOverol] = useState(false);
  const [tipoSangre, setTipoSangre] = useState('');
  const [discapacidad, setDiscapacidad] = useState('');
  const [discapacidadDetalle, setDiscapacidadDetalle] = useState('');
  const [padecimientos, setPadecimientos] = useState('');
  const [alergias, setAlergias] = useState('');

  // Sección 5: Nómina y Banco (Múltiples cuentas bancarias, alta de nuevo banco y tarjeta 16 dígitos)
  const [savedBanks, setSavedBanks] = useState<string[]>(() => loadPersistedBanks());
  const [bankAccounts, setBankAccounts] = useState<EmployeeBankAccount[]>([
    {
      id: 'bank-1',
      bank: '',
      clabe: '',
      cardNumber: '',
      alias: 'Nómina',
      isPrimary: true
    }
  ]);
  const [addingBankForAccountId, setAddingBankForAccountId] = useState<string | null>(null);
  const [newBankNameInput, setNewBankNameInput] = useState('');

  // Sección 6: Expediente Digital por Subcarpetas (Documentos, Certificaciones y Carpetas Personalizadas)
  const DEFAULT_EXPEDIENTE_FOLDERS = ['Documentos', 'Certificaciones', 'Contratos y Anexos'];
  const EXPEDIENTE_FOLDERS_STORAGE_KEY = 'sifygsa_expediente_folders_v1';

  const [expedienteFolders, setExpedienteFolders] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(EXPEDIENTE_FOLDERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...DEFAULT_EXPEDIENTE_FOLDERS, ...parsed]));
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_EXPEDIENTE_FOLDERS;
  });
  const [activeFolder, setActiveFolder] = useState<string>('Documentos');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  const [csfStatus, setCsfStatus] = useState<'Vigente' | 'Pendiente' | 'En Revisión'>('Pendiente');
  const [csfFileName, setCsfFileName] = useState('');
  const [csfFileUrl, setCsfFileUrl] = useState('');

  const [documents, setDocuments] = useState<EmployeeDocumentItem[]>([]);
  const [newDocCategory, setNewDocCategory] = useState<EmployeeDocumentItem['category']>('Identificación (INE)');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocIssuer, setNewDocIssuer] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocFileUrl, setNewDocFileUrl] = useState('');
  const [newDocMimeType, setNewDocMimeType] = useState('');
  const [newDocExternalUrl, setNewDocExternalUrl] = useState('');

  // Prellenado automático cuando se importa un CV desde Directorio de Personal
  useEffect(() => {
    if (!initialCvDraft) return;

    const locationToUse = initialCvDraft.location || 'Minatitlán, Ver.';
    if (initialCvDraft.location) {
      setBaseDespliegue(initialCvDraft.location);
    }

    if (initialCvDraft.department) {
      setDeptTecnico(initialCvDraft.department);
      const { primaryExtension } = resolveDepartmentExtension(
        initialCvDraft.department,
        locationToUse,
        extensionsCatalog
      );
      if (primaryExtension) setExtOficina(primaryExtension);

      const managerName = resolveDepartmentManager(
        initialCvDraft.department,
        locationToUse,
        departmentsCatalog,
        employeesCatalog,
        extensionsCatalog
      );
      if (managerName) setSupervisor(managerName);
    }

    if (initialCvDraft.position) setPuestoOficial(initialCvDraft.position);
    if (initialCvDraft.contractType) setTipoContrato(initialCvDraft.contractType);
    if (initialCvDraft.grossSalary) setSalarioBruto(formatCurrencyMask(initialCvDraft.grossSalary).formatted);
    if (initialCvDraft.assignedProject) setProyectoAsignado(initialCvDraft.assignedProject);
    if (initialCvDraft.laborCategory) setCategoriaLaboral(initialCvDraft.laborCategory);
    if (initialCvDraft.firstName) setNombrePila(initialCvDraft.firstName);
    if (initialCvDraft.paternalSurname) setApellidoPaterno(initialCvDraft.paternalSurname);
    if (initialCvDraft.maternalSurname) setApellidoMaterno(initialCvDraft.maternalSurname);
    if (initialCvDraft.rfc) setRfc(formatRfcMask(initialCvDraft.rfc).value);
    if (initialCvDraft.curp) setCurp(formatCurpMask(initialCvDraft.curp).value);
    if (initialCvDraft.nss) setNss(formatNssMask(initialCvDraft.nss).formatted);
    if (initialCvDraft.phone) setTelMovil(formatPhoneMask(initialCvDraft.phone).formatted);
    if (initialCvDraft.landlinePhone) setTelFijo(formatPhoneMask(initialCvDraft.landlinePhone).formatted);
    if (initialCvDraft.email) setEmailPersonal(initialCvDraft.email);
    if (initialCvDraft.institutionalEmail) setEmailInstitucional(initialCvDraft.institutionalEmail);
    if (initialCvDraft.streetAddress) setCalle(initialCvDraft.streetAddress);
    if (initialCvDraft.emergencyContactName) setContactoEmergenciaNombre(initialCvDraft.emergencyContactName);
    if (initialCvDraft.emergencyContactPhone) setContactoEmergenciaTel(formatPhoneMask(initialCvDraft.emergencyContactPhone).formatted);
    if (initialCvDraft.bloodType) setTipoSangre(initialCvDraft.bloodType);
    if (initialCvDraft.shoeSize) setCalzado(sanitizeShoeSize(initialCvDraft.shoeSize).value);
    if (initialCvDraft.overallSize) setOverol(initialCvDraft.overallSize);
    if (initialCvDraft.bankName || initialCvDraft.clabe) {
      setBankAccounts((prev) =>
        prev.map((acc, idx) =>
          idx === 0
            ? {
                ...acc,
                bank: initialCvDraft.bankName || acc.bank,
                clabe: initialCvDraft.clabe ? formatClabeMask(initialCvDraft.clabe).formatted : acc.clabe
              }
            : acc
        )
      );
    }
    if (initialCvDraft.summaryNotes) setNotasContratacion(initialCvDraft.summaryNotes);

    if (initialCvDraft.postalCode && initialCvDraft.postalCode.length === 5) {
      setCodigoPostal(initialCvDraft.postalCode);
      void lookupMexicanPostalCode(initialCvDraft.postalCode).then((cpInfo) => {
        if (!cpInfo) return;
        if (cpInfo.municipality) setMunicipio(cpInfo.municipality);
        if (cpInfo.state) setEstadoDomicilio(cpInfo.state);
        if (cpInfo.colonies.length > 0) {
          setColoniasPorCp(cpInfo.colonies);
          setColonia(cpInfo.colonies[0]);
          setIsCustomColonia(false);
        }
      });
    }

    const importedDocs: EmployeeDocumentItem[] = [];
    const todayIso = new Date().toISOString().split('T')[0];

    if (initialCvDraft.fileName && initialCvDraft.fileDataUrl) {
      importedDocs.push({
        id: createLocalDocId(),
        folder: 'Documentos',
        category: 'Currículum Vitae (CV)',
        title: `CV - ${initialCvDraft.fullName || initialCvDraft.fileName}`,
        issuer: 'Candidato / Ingreso',
        issueDate: todayIso,
        fileName: initialCvDraft.fileName,
        fileDataUrl: initialCvDraft.fileDataUrl,
        fileMimeType: initialCvDraft.fileMimeType || 'application/pdf'
      });
    }

    if (initialCvDraft.certifications.length > 0) {
      initialCvDraft.certifications.forEach((cert) => {
        importedDocs.push({
          id: createLocalDocId(),
          folder: 'Certificaciones',
          category: cert.docType || 'Certificación Técnica / DC-3',
          title: cert.name,
          issuer: cert.institution || 'Detectado en CV',
          issueDate: todayIso
        });
      });
    }

    if (importedDocs.length > 0) {
      setDocuments((prev) => [...importedDocs, ...prev]);
    }

    triggerToast(
      initialCvDraft.fileName
        ? `Datos prellenados desde ${initialCvDraft.fileName} (CV adjunto en Etapa 6).`
        : 'Datos prellenados desde el CV. Revisa y completa los campos faltantes.',
      'success',
      4200
    );

    onConsumeCvDraft?.();
  }, [initialCvDraft]);

  // =========================================================================
  // VALIDACIÓN DINÁMICA DE COMPLETITUD POR SECCIÓN
  // =========================================================================
  const isSection1Done = Boolean(
    subsidiary &&
    tipoContrato.trim().length >= 3 &&
    deptTecnico &&
    !deptTecnico.toLowerCase().includes('seleccionar') &&
    salarioBruto.trim() &&
    salarioBruto !== '0' &&
    salarioBruto !== '0.00'
  );

  const isSection2Done = Boolean(
    categoriaLaboral.trim().length >= 2 &&
    nombrePila.trim().length >= 2 &&
    apellidoPaterno.trim().length >= 2 &&
    puestoOficial.trim().length >= 2 &&
    rfc.trim().length >= 12 &&
    curp.trim().length === 18 &&
    toRawDigits(nss).length === 11
  );

  const isSection3Done = Boolean(
    toRawDigits(telMovil).length === 10 &&
    isValidEmail(emailPersonal) &&
    (!emailInstitucional.trim() || isValidEmail(emailInstitucional)) &&
    calle.trim().length >= 2 &&
    numeroDomicilio.trim().length >= 1 &&
    colonia.trim().length >= 2 &&
    codigoPostal.trim().length === 5 &&
    municipio.trim().length >= 2 &&
    estadoDomicilio.trim().length >= 2 &&
    contactoEmergenciaNombre.trim().length >= 2 &&
    toRawDigits(contactoEmergenciaTel).length === 10
  );

  // Tallas de prendas son opcionales; Sección 4 se marca completa al definir Tipo de Sangre
  const isSection4Done = Boolean(tipoSangre.trim());

  const primaryBankAccount = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
  const isSection5Done = Boolean(
    primaryBankAccount &&
    primaryBankAccount.bank.trim() &&
    toRawDigits(primaryBankAccount.clabe).length === 18
  );

  const isSection6Done = Boolean(csfStatus === 'Vigente' || documents.length > 0);

  const steps = [
    {
      id: 'section1',
      stepNumber: 1,
      label: 'Datos Laborales',
      fullLabel: '1. Datos Laborales',
      isDone: isSection1Done,
      icon: Briefcase,
      description: 'Empresa, departamento, base y sueldo.'
    },
    {
      id: 'section2',
      stepNumber: 2,
      label: 'Datos Personales',
      fullLabel: '2. Datos Personales',
      isDone: isSection2Done,
      icon: User,
      description: 'Nombre, RFC, CURP, NSS y fotografía.'
    },
    {
      id: 'section3',
      stepNumber: 3,
      label: 'Contacto & Domicilio',
      fullLabel: '3. Contacto & Domicilio',
      isDone: isSection3Done,
      icon: MapPin,
      description: 'Teléfonos, correo, emergencia y dirección.'
    },
    {
      id: 'section4',
      stepNumber: 4,
      label: 'Salud & Uniformes',
      fullLabel: '4. Salud & Uniformes',
      isDone: isSection4Done,
      icon: HeartPulse,
      description: 'Tallas de EPP, tipo de sangre y alergias.'
    },
    {
      id: 'section5',
      stepNumber: 5,
      label: 'Nómina & Banco',
      fullLabel: '5. Nómina & Banco',
      isDone: isSection5Done,
      icon: CreditCard,
      description: 'Cuenta bancaria y CLABE de 18 dígitos.'
    },
    {
      id: 'section6',
      stepNumber: 6,
      label: 'Expediente & Resumen',
      fullLabel: '6. Expediente & Resumen',
      isDone: isSection6Done,
      icon: Award,
      description: 'Constancia fiscal SAT, cursos y credencial.'
    }
  ];

  const completedCount = steps.filter((s) => s.isDone).length;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.localStorage.removeItem('sifygsa_rrhh_employee_draft_v1');
    } catch {
      // ignore
    }
    if (firstInputRef.current) {
      firstInputRef.current.focus({ preventScroll: true });
    }
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guardar Registro Final con Ctrl + S / Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Atajos de navegación entre etapas
      // Ctrl + Enter avanza al siguiente paso (o guarda si es el último)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentStepIndex < steps.length - 1) {
          handleNextStep();
        } else {
          handleSubmit();
        }
        return;
      }

      // Alt + Flecha Derecha avanza
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStepIndex < steps.length - 1) {
          handleNextStep();
        }
        return;
      }

      // Alt + Flecha Izquierda retrocede
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStepIndex > 0) {
          handlePrevStep();
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, steps]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentEl = e.currentTarget as HTMLElement;
      const form = currentEl.closest('form');
      if (form) {
        const focusable = getFocusableFormControls(form);
        const index = focusable.indexOf(currentEl);
        if (index > -1 && index < focusable.length - 1) {
          moveFocusNext(currentEl);
        } else if (currentStepIndex < steps.length - 1) {
          handleNextStep();
        }
      }
    }
  };

  const renderStepFooter = (stepIndex: number) => {
    const isLast = stepIndex === steps.length - 1;
    const isFirst = stepIndex === 0;
    const nextStep = !isLast ? steps[stepIndex + 1] : null;
    const currentStep = steps[stepIndex];
    const isStepDone = currentStep.isDone;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '16px 24px',
          marginTop: '14px',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border-subtle)',
          borderRadius: '0 0 16px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isFirst && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="wizard-pill-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 700,
                padding: '9px 20px',
                borderRadius: '999px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer'
              }}
              title="Anterior (Alt + ←)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          )}

          {!isLast ? (
            <button
              type="button"
              onClick={handleNextStep}
              className={`wizard-pill-btn ${isStepDone ? 'step-continue-bounce' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                padding: '10px 24px',
                borderRadius: '999px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: isStepDone
                  ? '0 6px 18px rgba(37, 99, 235, 0.35)'
                  : '0 2px 8px rgba(37, 99, 235, 0.22)',
                cursor: 'pointer'
              }}
              title="Continuar (Ctrl + Enter)"
            >
              <span>Continuar a {nextStep?.label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className={`wizard-pill-btn ${completedCount >= 5 ? 'step-continue-bounce' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                padding: '10px 24px',
                borderRadius: '999px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: '0 6px 18px rgba(5, 150, 105, 0.32)',
                cursor: 'pointer'
              }}
              title="Guardar (Ctrl + S)"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar y Guardar Colaborador</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // INPUT MASKING & INPUT FILTERING EN TIEMPO REAL
  // =========================================================================
  const handleSalarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField(null);
    const { formatted, hadInvalid } = formatCurrencyMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo números!', 'warning', 2200);
    setSalarioBruto(formatted);
  };

  const handlePersonNameChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldKey: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === fieldKey ? null : prev));
    const { value, hadInvalid } = sanitizePersonName(e.target.value);
    if (hadInvalid) triggerToast('¡Solo letras!', 'warning', 2200);
    setter(value);
  };

  const handleCleanTextChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldKey: string,
    maxLen = 80
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === fieldKey ? null : prev));
    const { value, hadInvalid } = sanitizeCleanText(e.target.value, maxLen);
    if (hadInvalid) triggerToast('¡Carácter inválido!', 'warning', 2200);
    setter(value);
  };

  const handleRfcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'rfc' ? null : prev));
    const { value, hadInvalid } = formatRfcMask(e.target.value);
    if (hadInvalid) triggerToast('¡Sin símbolos!', 'warning', 2200);
    setRfc(value);
  };

  const handleCurpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'curp' ? null : prev));
    const { value, hadInvalid } = formatCurpMask(e.target.value);
    if (hadInvalid) triggerToast('¡Sin símbolos!', 'warning', 2200);
    setCurp(value);
  };

  const handleNssChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'nss' ? null : prev));
    const { formatted, hadInvalid } = formatNssMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setNss(formatted);
  };

  // Manejo de cuenta bancaria de nómina
  const updateBankAccount = (accId: string, patch: Partial<EmployeeBankAccount>) => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === accId ? { ...acc, ...patch } : acc))
    );
  };

  const handleConfirmNewBank = (accountId: string) => {
    const clean = newBankNameInput.trim();
    if (clean.length < 2) {
      triggerToast('¡Escribe el nombre del banco!', 'warning', 2000);
      return;
    }
    const exists = savedBanks.some((b) => b.toLowerCase() === clean.toLowerCase());
    const nextBanks = exists ? savedBanks : [...savedBanks, clean];
    setSavedBanks(nextBanks);
    savePersistedBanks(nextBanks);
    updateBankAccount(accountId, { bank: clean });
    setAddingBankForAccountId(null);
    setNewBankNameInput('');
    triggerToast('¡Banco agregado!', 'success', 1600);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-field="clabe-${accountId}"]`)?.focus();
    }, 35);
  };

  const handlePhoneChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldKey?: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (fieldKey) setErrorField((prev) => (prev === fieldKey ? null : prev));
    const { formatted, hadInvalid } = formatPhoneMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setter(formatted);
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'codigoPostal' ? null : prev));
    const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCodigoPostal(digits);

    if (digits.length === 5) {
      setIsLoadingCp(true);
      const info = await lookupMexicanPostalCode(digits);
      setIsLoadingCp(false);
      if (info && info.colonies.length > 0) {
        setColoniasPorCp(info.colonies);
        setIsCustomColonia(false);
        setColonia(info.colonies[0]);
        setMunicipio(info.municipality);
        setEstadoDomicilio(info.state);
        triggerToast(`C.P. ${digits} localizado`, 'success', 1500);
      } else {
        setColoniasPorCp([]);
        setIsCustomColonia(true);
      }
    } else {
      setColoniasPorCp([]);
    }
  };

  const handleShoeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, hadInvalid } = sanitizeShoeSize(e.target.value);
    if (hadInvalid) triggerToast('¡Solo números!', 'warning', 2200);
    setCalzado(value);
  };

  const handleExtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, hadInvalid } = sanitizeExtension(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setExtOficina(value);
  };

  const readFileAsDataUrl = (
    file: File,
    onLoaded: (dataUrl: string, fileName: string, mimeType: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      onLoaded(reader.result as string, file.name, file.type || 'application/octet-stream');
    };
    reader.readAsDataURL(file);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileAsDataUrl(file, (dataUrl) => {
        setFotoPreview(dataUrl);
        triggerToast('Fotografía cargada', 'success', 1400);
      });
    }
  };

  const handleFotoPasteOrDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
      readFileAsDataUrl(file, (dataUrl) => {
        setFotoPreview(dataUrl);
        triggerToast('Fotografía adjuntada', 'success', 1400);
      });
    }
  };

  const getDocTypeOptionsForFolder = (folderName: string) => {
    const clean = folderName.trim().toLowerCase();
    if (clean === 'documentos') {
      return [
        { value: 'Identificación (INE)', label: 'Identificación Oficial (INE)' },
        { value: 'CURP', label: 'CURP' },
        { value: 'Constancia Fiscal (SAT)', label: 'RFC / Constancia Fiscal (SAT)' },
        { value: 'NSS / IMSS', label: 'Número de Seguro Social (NSS)' },
        { value: 'Comprobante de Domicilio', label: 'Comprobante de Domicilio' },
        { value: 'Acta de Nacimiento', label: 'Acta de Nacimiento' },
        { value: 'Otro Documento', label: 'Otro Documento Oficial' }
      ];
    }
    if (clean === 'certificaciones') {
      return [
        { value: 'Certificación Técnica / DC-3', label: 'Certificación Técnica / DC-3' },
        { value: 'Curso de Seguridad / Brigada', label: 'Curso Rig Pass / Seguridad' },
        { value: 'Título / Cédula Profesional', label: 'Título / Cédula Profesional' },
        { value: 'Carta de Recomendación', label: 'Carta de Recomendación' },
        { value: 'Otro Anexo', label: 'Otro Certificado / Curso' }
      ];
    }
    return [
      { value: 'Carta de Recomendación', label: 'Carta de Recomendación' },
      { value: 'Otro Anexo', label: 'Contrato / Anexo Laboral' },
      { value: 'Identificación (INE)', label: 'Identificación Oficial (INE)' },
      { value: 'Certificación Técnica / DC-3', label: 'Certificación Técnica / DC-3' },
      { value: 'Otro Documento', label: 'Documento General' }
    ];
  };

  const handleSelectFolder = (folderName: string) => {
    setActiveFolder(folderName);
    const options = getDocTypeOptionsForFolder(folderName);
    if (options.length > 0 && !options.some((o) => o.value === newDocCategory)) {
      setNewDocCategory(options[0].value);
    }
  };

  const handleCreateFolder = () => {
    const clean = newFolderName.trim();
    if (clean.length < 2) {
      triggerToast('¡Escribe el nombre de la carpeta!', 'warning', 2000);
      return;
    }
    if (expedienteFolders.some((f) => f.toLowerCase() === clean.toLowerCase())) {
      triggerToast('¡Esa carpeta ya existe!', 'warning', 2000);
      return;
    }
    const updated = [...expedienteFolders, clean];
    setExpedienteFolders(updated);
    try {
      window.localStorage.setItem(EXPEDIENTE_FOLDERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewFolderName('');
    setIsCreatingFolder(false);
    handleSelectFolder(clean);
    triggerToast(`Carpeta "${clean}" creada`, 'success', 1600);
  };

  const handleDeleteCustomFolder = (folderName: string) => {
    if (DEFAULT_EXPEDIENTE_FOLDERS.includes(folderName)) return;
    const updated = expedienteFolders.filter((f) => f !== folderName);
    setExpedienteFolders(updated);
    try {
      window.localStorage.setItem(EXPEDIENTE_FOLDERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setDocuments((prev) =>
      prev.map((d) => (d.folder === folderName ? { ...d, folder: 'Documentos' } : d))
    );
    if (activeFolder === folderName) {
      handleSelectFolder('Documentos');
    }
    triggerToast('Carpeta eliminada', 'warning', 1600);
  };

  // Carga múltiple (uno o varios archivos) dentro de la subcarpeta seleccionada
  const handleNewDocFilesSelect = (fileList: FileList | null, targetFolderOverride?: string) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const targetFolder = targetFolderOverride || activeFolder;

    if (files.length === 1 && !targetFolderOverride) {
      const file = files[0];
      readFileAsDataUrl(file, (dataUrl, name, mime) => {
        setNewDocFileUrl(dataUrl);
        setNewDocFileName(name);
        setNewDocMimeType(mime);
        if (!newDocTitle.trim()) {
          const baseName = name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
          setNewDocTitle(baseName);
        }
        triggerToast('Archivo listo para guardar', 'success', 1500);
      });
      return;
    }

    // Múltiples archivos seleccionados o arrastrados directo a una carpeta -> guardarlos en lote
    Promise.all(
      files.map(
        (file, index) =>
          new Promise<EmployeeDocumentItem>((resolve) => {
            readFileAsDataUrl(file, (dataUrl, name, mime) => {
              const baseTitle = name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
              resolve({
                id: `doc-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
                folder: targetFolder,
                category: newDocCategory,
                title: baseTitle || `Documento #${index + 1}`,
                issuer: newDocIssuer.trim() || undefined,
                issueDate: new Date().toLocaleDateString('es-MX'),
                fileName: name,
                fileDataUrl: dataUrl,
                fileMimeType: mime
              });
            });
          })
      )
    ).then((batchItems) => {
      setDocuments((prev) => [...prev, ...batchItems]);
      const csfDoc = batchItems.find((b) => b.category === 'Constancia Fiscal (SAT)');
      if (csfDoc) {
        setCsfStatus('Vigente');
        if (csfDoc.fileName) setCsfFileName(csfDoc.fileName);
        if (csfDoc.fileDataUrl) setCsfFileUrl(csfDoc.fileDataUrl);
      }
      triggerToast(`¡${batchItems.length} archivo(s) en "${targetFolder}"!`, 'success', 2000);
    });
  };

  const handleAddDocumentItem = () => {
    const cleanTitle = newDocTitle.trim() || newDocFileName.trim();
    if (!cleanTitle && !newDocExternalUrl.trim()) {
      triggerToast('¡Indica nombre o selecciona archivo!', 'warning', 2200);
      return;
    }
    const newItem: EmployeeDocumentItem = {
      id: createLocalDocId(),
      folder: activeFolder,
      category: newDocCategory,
      title: cleanTitle || newDocCategory,
      issuer: newDocIssuer.trim() || undefined,
      issueDate: new Date().toLocaleDateString('es-MX'),
      fileName: newDocFileName || undefined,
      fileDataUrl: newDocFileUrl || undefined,
      fileMimeType: newDocMimeType || undefined,
      externalUrl: newDocExternalUrl.trim() || undefined
    };
    setDocuments((prev) => [...prev, newItem]);
    if (newDocCategory === 'Constancia Fiscal (SAT)') {
      setCsfStatus('Vigente');
      if (newDocFileName) setCsfFileName(newDocFileName);
      if (newDocFileUrl) setCsfFileUrl(newDocFileUrl);
    }
    setNewDocTitle('');
    setNewDocIssuer('');
    setNewDocFileName('');
    setNewDocFileUrl('');
    setNewDocMimeType('');
    setNewDocExternalUrl('');
    triggerToast(`Guardado en "${activeFolder}"`, 'success', 1600);
  };

  const handleRemoveDocumentItem = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const toggleAllergyChip = (chip: string) => {
    if (chip === 'Sin alergias conocidas') {
      setAlergias('Sin alergias conocidas');
      return;
    }
    const current = alergias === 'Sin alergias conocidas' ? '' : alergias.trim();
    const parts = current
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.some((p) => p.toLowerCase() === chip.toLowerCase())) {
      setAlergias(parts.filter((p) => p.toLowerCase() !== chip.toLowerCase()).join(', '));
    } else {
      setAlergias([...parts, chip].join(', '));
    }
  };

  const resetAllFields = (nextFolio?: string) => {
    setCategoriaLaboral('');
    setNombrePila('');
    setApellidoPaterno('');
    setApellidoMaterno('');
    setDeptTecnico('');
    setTipoContrato('');
    setSalarioBruto('');
    setProyectoAsignado('');
    setPuestoOficial('');
    setRfc('');
    setCurp('');
    setNss('');
    setSupervisor('');
    setTelMovil('');
    setEmailInstitucional('');
    setEmailPersonal('');
    setTelFijo('');
    setExtOficina('');
    setCalle('');
    setNumeroDomicilio('');
    setNumeroInterior('');
    setColonia('');
    setColoniasPorCp([]);
    setIsCustomColonia(false);
    setCodigoPostal('');
    setMunicipio('Minatitlán');
    setEstadoDomicilio('Veracruz');
    setCalzado('');
    setIsCustomCalzado(false);
    setOverol('');
    setIsCustomOverol(false);
    setTipoSangre('');
    setDiscapacidad('');
    setDiscapacidadDetalle('');
    setPadecimientos('');
    setAlergias('');
    setContactoEmergenciaNombre('');
    setContactoEmergenciaParentesco('');
    setContactoEmergenciaTel('');
    setBankAccounts([
      {
        id: 'bank-1',
        bank: '',
        clabe: '',
        cardNumber: '',
        alias: 'Nómina',
        isPrimary: true
      }
    ]);
    setAddingBankForAccountId(null);
    setNewBankNameInput('');
    setCsfStatus('Pendiente');
    setCsfFileName('');
    setCsfFileUrl('');
    setDocuments([]);
    setActiveFolder('Documentos');
    setIsCreatingFolder(false);
    setNewFolderName('');
    setNewDocTitle('');
    setNewDocIssuer('');
    setNewDocFileName('');
    setNewDocFileUrl('');
    setNewDocMimeType('');
    setNewDocExternalUrl('');
    setFotoPreview(null);
    setNotasContratacion('');
    setErrorField(null);
    setCurrentStepIndex(0);
    setStepDirection('next');
    if (nextFolio && isAutoFolio) {
      setEmpId(nextFolio);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus({ preventScroll: true });
      }
    }, 80);
  };

  const focusErrorField = (sectionId: string, fieldKey: string, message: string) => {
    setErrorField(fieldKey);
    scrollToSection(sectionId);
    triggerToast(message, 'warning', 2800);
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-field="${fieldKey}"]`);
      if (el) el.focus();
    }, 180);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!deptTecnico || deptTecnico.toLowerCase().includes('seleccionar')) {
      focusErrorField('section1', 'deptTecnico', '¡Selecciona departamento!');
      return;
    }
    if (tipoContrato.trim().length < 3) {
      focusErrorField('section1', 'tipoContrato', '¡Indica tipo de contrato!');
      return;
    }
    if (!salarioBruto.trim() || salarioBruto === '0' || salarioBruto === '0.00') {
      focusErrorField('section1', 'salarioBruto', '¡Ingresa sueldo!');
      return;
    }
    if (puestoOficial.trim().length < 2) {
      focusErrorField('section2', 'puestoOficial', '¡Falta puesto!');
      return;
    }
    if (!categoriaLaboral.trim()) {
      focusErrorField('section2', 'categoriaLaboral', '¡Elige categoría!');
      return;
    }
    if (nombrePila.trim().length < 2) {
      focusErrorField('section2', 'nombrePila', '¡Falta nombre!');
      return;
    }
    if (apellidoPaterno.trim().length < 2) {
      focusErrorField('section2', 'apellidoPaterno', '¡Falta apellido!');
      return;
    }
    if (rfc.trim().length < 12) {
      focusErrorField('section2', 'rfc', '¡RFC incompleto!');
      return;
    }
    if (curp.trim().length !== 18) {
      focusErrorField('section2', 'curp', '¡CURP incompleta!');
      return;
    }
    if (toRawDigits(nss).length !== 11) {
      focusErrorField('section2', 'nss', '¡NSS a 11 dígitos!');
      return;
    }
    if (toRawDigits(telMovil).length !== 10) {
      focusErrorField('section3', 'telMovil', '¡Celular a 10 dígitos!');
      return;
    }
    if (!isValidEmail(emailPersonal)) {
      focusErrorField('section3', 'emailPersonal', '¡Falta correo personal!');
      return;
    }
    if (emailInstitucional.trim() && !isValidEmail(emailInstitucional)) {
      focusErrorField('section3', 'emailInstitucional', '¡Correo corporativo inválido!');
      return;
    }
    if (telFijo.trim() && toRawDigits(telFijo).length !== 10) {
      focusErrorField('section3', 'telFijo', '¡Teléfono a 10 dígitos!');
      return;
    }
    if (calle.trim().length < 2) {
      focusErrorField('section3', 'calle', '¡Falta calle!');
      return;
    }
    if (numeroDomicilio.trim().length < 1) {
      focusErrorField('section3', 'numeroDomicilio', '¡Falta número exterior!');
      return;
    }
    if (codigoPostal.trim().length !== 5) {
      focusErrorField('section3', 'codigoPostal', '¡C.P. a 5 dígitos!');
      return;
    }
    if (colonia.trim().length < 2) {
      focusErrorField('section3', 'colonia', '¡Falta colonia!');
      return;
    }
    if (municipio.trim().length < 2) {
      focusErrorField('section3', 'municipio', '¡Falta municipio!');
      return;
    }
    if (estadoDomicilio.trim().length < 2) {
      focusErrorField('section3', 'estadoDomicilio', '¡Falta estado!');
      return;
    }
    if (contactoEmergenciaNombre.trim().length < 2) {
      focusErrorField('section3', 'contactoEmergenciaNombre', '¡Falta contacto emergencia!');
      return;
    }
    if (toRawDigits(contactoEmergenciaTel).length !== 10) {
      focusErrorField('section3', 'contactoEmergenciaTel', '¡Tel. emergencia a 10 dígitos!');
      return;
    }
    if (!tipoSangre.trim()) {
      focusErrorField('section4', 'tipoSangre', '¡Falta tipo de sangre!');
      return;
    }

    // Validar cuentas bancarias (Sección 5)
    for (let i = 0; i < bankAccounts.length; i++) {
      const acc = bankAccounts[i];
      const rawAccClabe = toRawDigits(acc.clabe);
      const rawAccCard = toRawDigits(acc.cardNumber || '');
      if (i === 0 || acc.isPrimary || rawAccClabe.length > 0) {
        if (!acc.bank.trim()) {
          focusErrorField('section5', `bank-${acc.id}`, '¡Elige banco!');
          return;
        }
        if (rawAccClabe.length !== 18) {
          focusErrorField('section5', `clabe-${acc.id}`, '¡CLABE a 18 dígitos!');
          return;
        }
      }
      if (rawAccCard.length > 0 && rawAccCard.length !== 16) {
        focusErrorField('section5', `card-${acc.id}`, '¡Tarjeta a 16 dígitos!');
        return;
      }
    }

    // Guardar nuevo Tipo de Contrato en el listado persistente si no existía
    const cleanContract = tipoContrato.trim();
    const existsContract = savedContractTypes.some(
      (c) => c.toLowerCase() === cleanContract.toLowerCase()
    );
    if (!existsContract) {
      const updatedContracts = [cleanContract, ...savedContractTypes];
      setSavedContractTypes(updatedContracts);
      try {
        window.localStorage.setItem(CONTRACT_TYPES_STORAGE_KEY, JSON.stringify(updatedContracts));
      } catch {
        // ignore
      }
    }

    // Guardar nuevo Puesto de Trabajo en el listado persistente si no existía
    const cleanPosition = puestoOficial.trim();
    const existsPosition = jobPositionSuggestions.some(
      (p) => p.toLowerCase() === cleanPosition.toLowerCase()
    );
    if (!existsPosition) {
      const updatedPositions = [cleanPosition, ...savedJobPositions];
      setSavedJobPositions(updatedPositions);
      try {
        window.localStorage.setItem(JOB_POSITIONS_STORAGE_KEY, JSON.stringify(updatedPositions));
      } catch {
        // ignore
      }
    }

    const fullName = `${nombrePila.trim()} ${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`.trim();
    const initials = `${nombrePila.trim()[0] || ''}${apellidoPaterno.trim()[0] || ''}`.toUpperCase();
    const interiorPart = numeroInterior.trim() ? ` Int. ${numeroInterior.trim()}` : '';
    const formattedAddress = `${calle.trim()} #${numeroDomicilio.trim()}${interiorPart}, Col. ${colonia.trim()}, C.P. ${codigoPostal.trim()}, ${municipio.trim()}, ${estadoDomicilio.trim()}`;

    const currentStored = loadPersistedEmployees(EMPLOYEES);
    const dupCheck = checkDuplicateEmployeeIdentifiers(
      {
        id: empId,
        name: fullName,
        rfc: rfc.trim(),
        curp: curp.trim(),
        nss: nss.trim()
      },
      currentStored
    );

    if (dupCheck.hasConflict) {
      focusErrorField(
        'section2',
        dupCheck.conflictField || 'rfc',
        dupCheck.toastMessage || '¡Dato duplicado!'
      );
      return;
    }

    const sanitizedBankAccounts: EmployeeBankAccount[] = bankAccounts
      .filter((acc) => toRawDigits(acc.clabe).length === 18 || toRawDigits(acc.cardNumber || '').length === 16)
      .map((acc) => ({
        ...acc,
        bank: acc.bank || savedBanks[0] || 'BBVA México',
        clabe: toRawDigits(acc.clabe),
        cardNumber: acc.cardNumber ? formatCardMask(acc.cardNumber).formatted : undefined
      }));

    const mainAccount = sanitizedBankAccounts.find((b) => b.isPrimary) || sanitizedBankAccounts[0];
    const resolvedDisability =
      discapacidad === 'Otra condición (especificar)...'
        ? discapacidadDetalle.trim() || 'Otra condición'
        : discapacidad && discapacidad !== 'Sin especificar'
        ? discapacidad
        : undefined;

    const cleanSize = (val: string) => (val && val !== 'Sin especificar' ? val.trim() || undefined : undefined);

    // Si dejó escrito un curso/certificado en los inputs de Sección 6 sin pulsar "+ Agregar", lo incluimos automáticamente
    const finalDocs = [...documents];
    if (newDocTitle.trim() || newDocFileUrl || newDocExternalUrl.trim()) {
      finalDocs.push({
        id: createLocalDocId(),
        folder: activeFolder,
        category: newDocCategory,
        title: newDocTitle.trim() || newDocFileName || 'Documento Adjunto',
        issuer: newDocIssuer.trim() || undefined,
        issueDate: new Date().toLocaleDateString('es-MX'),
        fileName: newDocFileName || undefined,
        fileDataUrl: newDocFileUrl || undefined,
        fileMimeType: newDocMimeType || undefined,
        externalUrl: newDocExternalUrl.trim() || undefined
      });
    }

    const hasCsfDoc = finalDocs.some((d) => d.category === 'Constancia Fiscal (SAT)');
    const effectiveCsfStatus: 'Vigente' | 'Pendiente' | 'En Revisión' =
      hasCsfDoc || csfFileUrl ? 'Vigente' : 'Pendiente';

    const nuevoColaborador: Employee = {
      id: empId,
      name: fullName,
      firstName: nombrePila.trim() || undefined,
      paternalSurname: apellidoPaterno.trim() || undefined,
      maternalSurname: apellidoMaterno.trim() || undefined,
      email: (emailInstitucional.trim() || emailPersonal.trim()).toLowerCase(),
      emailPersonal: emailPersonal.trim().toLowerCase() || undefined,
      initials: initials || 'SF',
      avatarBg: '#1D4ED8',
      position: puestoOficial.trim(),
      department: deptTecnico.includes('-') ? deptTecnico.split('-')[1].trim() : deptTecnico,
      subsidiary: 'SIFYGSA S.A de C.V',
      location: baseDespliegue || 'Minatitlán, Ver.',
      squad: categoriaLaboral,
      silStatus: 'Certificación Vigente',
      silStatusType: 'success',
      hireDate: new Date().toLocaleDateString('es-MX'),
      photoUrl: fotoPreview || undefined,
      phoneCell: telMovil,
      phonePrimary: telFijo || undefined,
      officeExtension: extOficina.trim() || undefined,
      supervisor: supervisor.trim() || undefined,
      address: formattedAddress,
      addressStreet: calle.trim(),
      addressNumber: numeroDomicilio.trim(),
      addressInterior: numeroInterior.trim() || undefined,
      addressColony: colonia.trim(),
      addressZip: codigoPostal.trim(),
      addressCity: municipio.trim(),
      addressState: estadoDomicilio.trim(),
      rfc: rfc.trim(),
      curp: curp.trim(),
      nss: nss.trim(),
      salary: salarioBruto,
      contractType: cleanContract,
      emergencyContact: contactoEmergenciaNombre.trim() || undefined,
      emergencyPhone: contactoEmergenciaTel || undefined,
      emergencyRelationship: contactoEmergenciaParentesco.trim() || undefined,
      bank: mainAccount?.bank || 'BBVA México',
      clabe: mainAccount?.clabe || '',
      cardNumber: mainAccount?.cardNumber || undefined,
      bankAccounts: sanitizedBankAccounts,
      bloodType: tipoSangre || undefined,
      shoeSize: cleanSize(calzado),
      shirtSize: cleanSize(camisa),
      pantsSize: cleanSize(pantalon),
      coverallSize: cleanSize(overol),
      disabilityInfo: resolvedDisability,
      chronicConditions: padecimientos.trim() || undefined,
      allergies: alergias.trim() || undefined,
      taxCertificateStatus: effectiveCsfStatus,
      taxCertificateFileUrl: csfFileUrl || undefined,
      taxCertificateFileName: csfFileName || undefined,
      documents: finalDocs.length > 0 ? finalDocs : undefined
    };

    const updatedList = [nuevoColaborador, ...currentStored.filter((item) => item.id !== nuevoColaborador.id)];
    savePersistedEmployees(updatedList);

    logHrAuditAction({
      actionType: 'Alta de Empleado',
      targetRecord: `${nuevoColaborador.id} · ${nuevoColaborador.name}`,
      details: dupCheck.isHomonym
        ? `Alta con homonimia detectada (diferenciado por CURP ${nuevoColaborador.curp} y RFC ${nuevoColaborador.rfc}).`
        : `Alta de colaborador en ${nuevoColaborador.department} (${nuevoColaborador.location}).`,
      previousValue: 'Nuevo Ingreso',
      newValue: `${nuevoColaborador.position} · RFC ${nuevoColaborador.rfc}`,
      severity: dupCheck.isHomonym ? 'sensible' : 'normal'
    });

    const nextFolio = getNextEmployeeFolio(updatedList);
    resetAllFields(nextFolio);
    triggerToast('¡Guardado!', 'success', 2800);
  };

  const handleLimpiar = () => {
    resetAllFields();
    triggerToast('¡Campos limpios!', 'warning', 2000);
  };

  return (
    <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '22px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#047857' : '#D97706',
            color: '#FFFFFF',
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '0.01em',
            border: toast.type === 'success' ? '1px solid #34D399' : '1px solid #FBBF24',
            transition: 'all 0.25s ease'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle className="w-5 h-5" style={{ flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ENCABEZADO SUPERIOR: REGISTRO DEL PERSONAL             */}
      {/* ========================================================= */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Recursos Humanos</span> <span style={{ margin: '0 4px' }}>/</span>{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>Registro del Personal</strong>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                border: '1px solid var(--brand-200)',
                flexShrink: 0
              }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  Registro del Personal
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--brand-50)',
                    color: 'var(--primary)',
                    border: '1px solid var(--brand-200)'
                  }}
                >
                  Nuevo Ingreso
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Captura de expediente laboral, fiscal y bancario.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Volver al panel principal"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLimpiar}
              className="btn btn-secondary"
              style={{ fontSize: '12.5px' }}
            >
              Limpiar Formulario
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}
              title="Guardar Registro (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Registro</span>
              <span style={{ fontSize: '10.5px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '4px', marginLeft: '2px' }}>
                Ctrl+S
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ETAPA ACTIVA & TIMELINE CONECTADO (ESTÁNDAR SIFYGSA)   */}
      {/* ========================================================= */}
      <div
        className="card"
        style={{
          padding: '22px 28px',
          borderRadius: '18px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Cabecera de Etapa Actual + Progreso General (Idéntico al estándar visual) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#DBEAFE',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                flexShrink: 0,
                marginTop: '1px'
              }}
            >
              {currentStepIndex + 1}
            </div>
            <div>
              <h2 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                Etapa {currentStepIndex + 1} de {steps.length}: {steps[currentStepIndex]?.label}
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>
                {steps[currentStepIndex]?.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Progreso General</span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: completedCount === steps.length ? '#059669' : '#2563EB'
                }}
              >
                {Math.round((completedCount / steps.length) * 100)}% Completado
              </span>
            </div>
            <div
              style={{
                width: '120px',
                height: '7px',
                borderRadius: '999px',
                backgroundColor: '#E2E8F0',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${Math.max((completedCount / steps.length) * 100, currentStepIndex > 0 ? 12 : 6)}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background:
                    completedCount === steps.length
                      ? '#059669'
                      : 'linear-gradient(90deg, #2563EB 0%, #0EA5E9 100%)',
                  transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Timeline Horizontal con Círculos Verdes/Azules, Extremos y Cola de Progreso */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
            overflowX: 'auto',
            padding: '10px 8px 6px 8px'
          }}
        >
          {/* Extremo inicial izquierdo de la línea */}
          <div
            style={{
              width: '32px',
              height: '3.5px',
              borderRadius: '999px 0 0 999px',
              marginTop: '20.5px',
              marginRight: '-6px',
              backgroundColor: steps[0]?.isDone ? '#059669' : '#2563EB',
              flexShrink: 0,
              transition: 'background-color 0.3s ease'
            }}
          />

          {steps.map((step, idx) => {
            const isDone = step.isDone;
            const isCurrent = currentStepIndex === idx;
            const isNextCurrent = currentStepIndex === idx + 1;

            return (
              <React.Fragment key={step.id}>
                {/* Nodo de la etapa */}
                <button
                  type="button"
                  onClick={() => handleSelectStep(idx)}
                  className="stepper-node-btn"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                    minWidth: '100px',
                    flexShrink: 0,
                    outline: 'none',
                    position: 'relative',
                    zIndex: 2
                  }}
                  title={`Ir a Etapa ${step.stepNumber}: ${step.label}`}
                >
                  {/* Círculo */}
                  <div
                    className={
                      isCurrent && !isDone
                        ? 'stepper-circle-active'
                        : isDone
                        ? 'stepper-circle-done'
                        : 'stepper-circle-pending'
                    }
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 800,
                      backgroundColor: isDone
                        ? '#059669' // Verde esmeralda cuando está listo
                        : isCurrent
                        ? '#2563EB' // Azul real cuando está en curso
                        : '#F8FAFC',
                      color: isDone || isCurrent ? '#FFFFFF' : '#94A3B8',
                      border: isDone
                        ? 'none'
                        : isCurrent
                        ? 'none'
                        : '1.5px solid #CBD5E1',
                      boxShadow:
                        isDone && isCurrent
                          ? '0 0 0 3px #ffffff, 0 0 0 6px rgba(5, 150, 105, 0.28)'
                          : isDone
                          ? '0 4px 10px rgba(5, 150, 105, 0.22)'
                          : undefined,
                      transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      step.stepNumber
                    )}
                  </div>

                  {/* Etiqueta del paso */}
                  <span
                    style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      fontWeight: isCurrent || isDone ? 700 : 600,
                      color: isCurrent
                        ? '#1D4ED8'
                        : isDone
                        ? '#047857'
                        : '#334155',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {step.label}
                  </span>

                  {/* Estado textual */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isCurrent ? 700 : 600,
                      marginTop: '2px',
                      color: isDone
                        ? '#059669'
                        : isCurrent
                        ? '#2563EB'
                        : '#94A3B8'
                    }}
                  >
                    {isDone ? 'Listo' : isCurrent ? 'En curso' : 'Pendiente'}
                  </span>
                </button>

                {/* Línea conectora entre círculos con cola activa azul */}
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '3.5px',
                      marginTop: '20.5px',
                      marginLeft: '-14px',
                      marginRight: '-14px',
                      backgroundColor: '#E2E8F0',
                      position: 'relative',
                      overflow: 'hidden',
                      minWidth: '28px',
                      zIndex: 1
                    }}
                  >
                    <div
                      style={{
                        width: isDone ? '100%' : isCurrent ? '38%' : '0%',
                        height: '100%',
                        borderRadius: isCurrent && !isDone ? '0 999px 999px 0' : '0',
                        background:
                          isDone && isNextCurrent
                            ? 'linear-gradient(90deg, #059669 0%, #1D4ED8 100%)'
                            : isDone
                            ? '#059669'
                            : '#2563EB',
                        transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease'
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Extremo final derecho de la línea */}
          <div
            style={{
              width: '32px',
              height: '3.5px',
              borderRadius: '0 999px 999px 0',
              marginTop: '20.5px',
              marginLeft: '-6px',
              backgroundColor: steps[steps.length - 1]?.isDone ? '#059669' : '#E2E8F0',
              flexShrink: 0,
              transition: 'background-color 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* CONTENEDOR ANIMADO POR ETAPA */}
      <div
        key={`stage-panel-${currentStepIndex}`}
        className={stepDirection === 'next' ? 'step-stage-enter-next' : 'step-stage-enter-prev'}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
      {/* ========================================================= */}
      {/* PROCESO 1: DATOS LABORALES                                */}
      {/* ========================================================= */}
      {currentStepIndex === 0 && (
        <div id="section1" className="card" style={{ borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)' }}>
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px 16px 0 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--brand-200)',
                  flexShrink: 0
                }}
              >
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Asignación Laboral & Puesto
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Departamento, base, contrato y sueldo.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: isSection1Done ? 'var(--success-bg)' : 'var(--surface)',
                color: isSection1Done ? 'var(--success-text)' : 'var(--text-muted)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: isSection1Done ? '1px solid var(--success-border)' : '1px solid var(--border)'
              }}
            >
              {isSection1Done ? '✓ Completado' : 'Pendiente'}
            </span>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* 1. Empresa (Bloqueado con SIFYGSA) */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Empresa <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={subsidiary}
                    readOnly
                    disabled
                    className="input-text"
                    style={{
                      width: '100%',
                      paddingLeft: '12px',
                      paddingRight: '34px',
                      backgroundColor: 'var(--surface-alt)',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      cursor: 'not-allowed'
                    }}
                  />
                  <Lock
                    className="w-3.5 h-3.5 text-muted"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                </div>
              </div>

              {/* 2. Departamento Asignado */}
              <div>
                <CustomSelect
                  label="Departamento Asignado"
                  dataField="deptTecnico"
                  required
                  placeholder="Seleccionar departamento..."
                  value={deptTecnico}
                  onChange={handleSelectDepartment}
                  options={availableDepartments.map((d) => ({ value: d, label: d }))}
                  onKeyDown={handleInputKeyDown}
                  hasError={errorField === 'deptTecnico'}
                />
                {deptTecnico === 'HSE' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>División:</span>
                    {(['Minatitlán, Ver.', 'Comalcalco, Tab.'] as const).map((loc) => {
                      const active = baseDespliegue === loc;
                      const label = loc.startsWith('Minatitlán') ? 'Mina' : 'Comalcalco';
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleSelectBaseLocation(loc)}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 9px',
                            borderRadius: '999px',
                            border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: active ? 'var(--brand-50)' : 'var(--surface)',
                            color: active ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {deptTecnico === 'Recursos Humanos' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Rama:</span>
                    {(['RH General', 'Capacitación'] as const).map((branch) => {
                      const active = branch === 'Capacitación' ? proyectoAsignado === 'Capacitación' : proyectoAsignado !== 'Capacitación';
                      return (
                        <button
                          key={branch}
                          type="button"
                          onClick={() => setProyectoAsignado(branch === 'Capacitación' ? 'Capacitación' : '')}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 9px',
                            borderRadius: '999px',
                            border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: active ? 'var(--brand-50)' : 'var(--surface)',
                            color: active ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {branch}
                        </button>
                      );
                    })}
                  </div>
                )}
                {deptTecnico === 'Ventas' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Rama:</span>
                    {(['Ventas', 'Definición de Soluciones'] as const).map((branch) => {
                      const active = branch === 'Definición de Soluciones' ? proyectoAsignado === 'Definición de Soluciones' : proyectoAsignado !== 'Definición de Soluciones';
                      return (
                        <button
                          key={branch}
                          type="button"
                          onClick={() => setProyectoAsignado(branch === 'Definición de Soluciones' ? 'Definición de Soluciones' : '')}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 9px',
                            borderRadius: '999px',
                            border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: active ? 'var(--brand-50)' : 'var(--surface)',
                            color: active ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {branch}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Base de Trabajo (Municipio, Est.) */}
              <CustomSelect
                label="Base de Trabajo"
                value={baseDespliegue}
                onChange={handleSelectBaseLocation}
                options={WORK_LOCATIONS}
                onKeyDown={handleInputKeyDown}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {/* 4. Tipo de Contrato (Campo de texto con autocompletado estilo placeholder y Tab) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Tipo de Contrato <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                </div>

                <AutocompleteTextInput
                  inputRef={firstInputRef}
                  dataField="tipoContrato"
                  value={tipoContrato}
                  onChangeValue={(raw) => {
                    setErrorField((prev) => (prev === 'tipoContrato' ? null : prev));
                    const { value, hadInvalid } = sanitizeCleanText(raw, 60);
                    if (hadInvalid) triggerToast('¡Carácter inválido!', 'warning', 2200);
                    setTipoContrato(value);
                  }}
                  suggestions={savedContractTypes}
                  placeholder="Ej. Tiempo Indeterminado"
                  hasError={errorField === 'tipoContrato'}
                  required
                  onAdvanceNext={moveFocusNext}
                  onAutoCompleted={() => triggerToast('Autocompletado', 'success', 1200)}
                />
              </div>

              {/* 5. Sueldo Mensual Bruto */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Sueldo Mensual Bruto (MXN) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    $
                  </span>
                  <input
                    data-field="salarioBruto"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={salarioBruto}
                    onChange={handleSalarioChange}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('salarioBruto', { paddingLeft: '26px', width: '100%', height: '38px', fontWeight: 700 })}
                    required
                  />
                </div>
              </div>

              {/* 6. Proyecto o Área Asignada */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Proyecto Asignado
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mantenimiento Preventivo"
                  value={proyectoAsignado}
                  onChange={handleCleanTextChange(setProyectoAsignado, 'proyectoAsignado', 90)}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%', height: '38px', paddingLeft: '12px' }}
                />
              </div>
            </div>
          </div>
          {renderStepFooter(0)}
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCESO 2: DATOS PERSONALES                               */}
      {/* ========================================================= */}
      {currentStepIndex === 1 && (
        <div id="section2" className="card" style={{ borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)' }}>
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px 16px 0 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--brand-200)',
                  flexShrink: 0
                }}
              >
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Identificación & Expediente Personal
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Nombre, RFC, CURP, NSS y fotografía.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: isSection2Done ? 'var(--success-bg)' : 'var(--surface)',
                color: isSection2Done ? 'var(--success-text)' : 'var(--text-muted)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: isSection2Done ? '1px solid var(--success-border)' : '1px solid var(--border)'
              }}
            >
              {isSection2Done ? '✓ Completado' : 'Pendiente'}
            </span>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '24px' }}>
            {/* Formulario Izquierdo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Fila 1: Folio, Puesto de Trabajo y Categoría de Puesto */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.2fr 1fr', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Folio de Empleado <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16))}
                      onKeyDown={handleInputKeyDown}
                      disabled={isAutoFolio}
                      className="input-text"
                      style={{
                        paddingLeft: '10px',
                        flex: 1,
                        height: '38px',
                        backgroundColor: isAutoFolio ? 'var(--surface-alt)' : 'var(--surface)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={isAutoFolio}
                        onChange={(e) => {
                          setIsAutoFolio(e.target.checked);
                          if (e.target.checked) setEmpId(getNextEmployeeFolio());
                        }}
                      />
                      <span>AUTO</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Puesto de Trabajo <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <AutocompleteTextInput
                    dataField="puestoOficial"
                    value={puestoOficial}
                    onChangeValue={(raw) => {
                      setErrorField((prev) => (prev === 'puestoOficial' ? null : prev));
                      const { value, hadInvalid } = sanitizeCleanText(raw, 70);
                      if (hadInvalid) triggerToast('¡Carácter inválido!', 'warning', 2200);
                      setPuestoOficial(value);
                    }}
                    suggestions={jobPositionSuggestions}
                    placeholder="Ej. Analista de Operaciones"
                    hasError={errorField === 'puestoOficial'}
                    required
                    onAdvanceNext={moveFocusNext}
                    onAutoCompleted={() => triggerToast('Autocompletado', 'success', 1200)}
                  />
                </div>

                <CustomSelect
                  label="Categoría de Puesto"
                  dataField="categoriaLaboral"
                  required
                  placeholder="Seleccionar categoría..."
                  value={categoriaLaboral}
                  onChange={(val) => {
                    setErrorField((prev) => (prev === 'categoriaLaboral' ? null : prev));
                    setCategoriaLaboral(val);
                  }}
                  options={[
                    { value: 'Técnico Especialista', label: 'Técnico Especialista' },
                    { value: 'Operativo de Campo', label: 'Operativo de Campo' },
                    { value: 'Administrativo', label: 'Administrativo' },
                    { value: 'Ingeniería', label: 'Ingeniería' },
                    { value: 'Supervisión', label: 'Supervisión' },
                    { value: 'Coordinación', label: 'Coordinación' },
                    { value: 'Gerencia', label: 'Gerencia' },
                    { value: 'Dirección', label: 'Dirección' }
                  ]}
                  hasError={errorField === 'categoriaLaboral'}
                  onKeyDown={handleInputKeyDown}
                />
              </div>

              {/* Fila 2: Nombre(s) y Apellidos (Sin texto repetido debajo ni "Nombre de pila") */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Nombre(s) y Apellidos <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <input
                    data-field="nombrePila"
                    type="text"
                    placeholder="Nombre(s)"
                    value={nombrePila}
                    onChange={handlePersonNameChange(setNombrePila, 'nombrePila')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('nombrePila', { paddingLeft: '10px', width: '100%' })}
                    required
                  />
                  <input
                    data-field="apellidoPaterno"
                    type="text"
                    placeholder="Apellido paterno"
                    value={apellidoPaterno}
                    onChange={handlePersonNameChange(setApellidoPaterno, 'apellidoPaterno')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('apellidoPaterno', { paddingLeft: '10px', width: '100%' })}
                    required
                  />
                  <input
                    data-field="apellidoMaterno"
                    type="text"
                    placeholder="Apellido materno"
                    value={apellidoMaterno}
                    onChange={handlePersonNameChange(setApellidoMaterno, 'apellidoMaterno')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('apellidoMaterno', { paddingLeft: '10px', width: '100%' })}
                  />
                </div>
              </div>

              {/* Fila 3: RFC y CURP (Sin la palabra "Oficial" y con placeholders limpios) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    RFC <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="rfc"
                    type="text"
                    placeholder="Ej. GAVM950412H8A"
                    value={rfc}
                    onChange={handleRfcChange}
                    onKeyDown={handleInputKeyDown}
                    maxLength={13}
                    className="input-text"
                    style={getFieldStyle('rfc', { paddingLeft: '10px', width: '100%', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    CURP <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="curp"
                    type="text"
                    placeholder="Ej. GAVM950412HVERRN01"
                    value={curp}
                    onChange={handleCurpChange}
                    onKeyDown={handleInputKeyDown}
                    maxLength={18}
                    className="input-text"
                    style={getFieldStyle('curp', { paddingLeft: '10px', width: '100%', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' })}
                    required
                  />
                </div>
              </div>

              {/* Fila 4: NSS y Jefe Asignado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Número de Seguro Social (NSS) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="nss"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 34-12-88-9412-1"
                    value={nss}
                    onChange={handleNssChange}
                    onKeyDown={handleInputKeyDown}
                    maxLength={15}
                    className="input-text"
                    style={getFieldStyle('nss', { paddingLeft: '10px', width: '100%', height: '38px', fontFamily: 'var(--font-mono)' })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Jefe Asignado
                  </label>
                  <input
                    data-field="supervisor"
                    type="text"
                    placeholder="Nombre del jefe directo"
                    value={supervisor}
                    onChange={handlePersonNameChange(setSupervisor, 'supervisor')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ paddingLeft: '10px', width: '100%', height: '38px', fontWeight: supervisor ? 600 : 400 }}
                  />
                </div>
              </div>
            </div>

            {/* Zona Derecha: Fotografía */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Fotografía del Colaborador
                </h4>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Opcional
                </span>
              </div>

              <div
                tabIndex={0}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFotoPasteOrDrop(e.dataTransfer.files);
                }}
                onPaste={(e) => {
                  handleFotoPasteOrDrop(e.clipboardData.files);
                }}
                style={{
                  border: '2px dashed var(--brand-300)',
                  backgroundColor: 'rgba(59, 130, 246, 0.03)',
                  borderRadius: '12px',
                  padding: '18px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '6px',
                  minHeight: '175px',
                  outline: 'none'
                }}
              >
                {fotoPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={fotoPreview}
                      alt="Fotografía"
                      style={{ width: '105px', height: '105px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFotoPreview(null)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: 'var(--danger)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800
                      }}
                      title="Eliminar foto"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--brand-50)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Fotografía para credencial
                    </div>
                    <label
                      className="btn btn-secondary"
                      style={{ fontSize: '11.5px', marginTop: '4px', cursor: 'pointer', padding: '6px 14px' }}
                    >
                      Seleccionar archivo
                      <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} />
                    </label>
                  </>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Observaciones de Contratación
                  </label>
                  {notasContratacion && (
                    <button
                      type="button"
                      onClick={() => setNotasContratacion('')}
                      style={{ fontSize: '10px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <textarea
                  value={notasContratacion}
                  onChange={(e) => setNotasContratacion(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Comentarios adicionales del expediente..."
                  rows={2}
                  className="input-text"
                  style={{ width: '100%', fontSize: '11.5px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
          {renderStepFooter(1)}
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCESO 3: CONTACTO Y DOMICILIO                           */}
      {/* ========================================================= */}
      {currentStepIndex === 2 && (
        <div id="section3" className="card" style={{ borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)' }}>
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px 16px 0 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--brand-200)',
                  flexShrink: 0
                }}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Contacto & Domicilio Particular
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Teléfonos, correo, emergencia y dirección.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: isSection3Done ? 'var(--success-bg)' : 'var(--surface)',
                color: isSection3Done ? 'var(--success-text)' : 'var(--text-muted)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: isSection3Done ? '1px solid var(--success-border)' : '1px solid var(--border)'
              }}
            >
              {isSection3Done ? '✓ Completado' : 'Pendiente'}
            </span>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '24px' }}>
            {/* Columna Izquierda: Medios de Contacto + Contacto de Emergencia */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Medios de Contacto del Colaborador
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Teléfono Celular <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      data-field="telMovil"
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ej. 922-145-8890"
                      value={telMovil}
                      onChange={handlePhoneChange(setTelMovil, 'telMovil')}
                      onKeyDown={handleInputKeyDown}
                      maxLength={12}
                      className="input-text"
                      style={getFieldStyle('telMovil', { paddingLeft: '10px', width: '100%', fontFamily: 'var(--font-mono)' })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Teléfono Fijo
                    </label>
                    <input
                      data-field="telFijo"
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ej. 921-213-4402"
                      value={telFijo}
                      onChange={handlePhoneChange(setTelFijo, 'telFijo')}
                      onKeyDown={handleInputKeyDown}
                      maxLength={12}
                      className="input-text"
                      style={getFieldStyle('telFijo', { paddingLeft: '10px', width: '100%', fontFamily: 'var(--font-mono)' })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Correo Personal <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      data-field="emailPersonal"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={emailPersonal}
                      onChange={(e) => {
                        setErrorField((prev) => (prev === 'emailPersonal' ? null : prev));
                        setEmailPersonal(e.target.value.replace(/\s/g, '').toLowerCase());
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="input-text"
                      style={getFieldStyle('emailPersonal', { paddingLeft: '10px', width: '100%' })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Correo Corporativo
                    </label>
                    <input
                      data-field="emailInstitucional"
                      type="email"
                      placeholder="colaborador@sifygsa.com.mx"
                      value={emailInstitucional}
                      onChange={(e) => {
                        setErrorField((prev) => (prev === 'emailInstitucional' ? null : prev));
                        setEmailInstitucional(e.target.value.replace(/\s/g, '').toLowerCase());
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="input-text"
                      style={getFieldStyle('emailInstitucional', { paddingLeft: '10px', width: '100%' })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Extensión Telefónica
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 111"
                    value={extOficina}
                    onChange={handleExtChange}
                    onKeyDown={handleInputKeyDown}
                    maxLength={5}
                    className="input-text"
                    style={{ paddingLeft: '10px', width: '100%', fontFamily: 'var(--font-mono)', fontWeight: extOficina ? 700 : 400 }}
                  />
                </div>
              </div>

              {/* Contacto de Emergencia integrado en Sección 3 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Contacto en Caso de Emergencia
                  </h4>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Nombre Completo del Contacto <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="contactoEmergenciaNombre"
                    type="text"
                    placeholder="Ej. María Elena Pérez Gómez"
                    value={contactoEmergenciaNombre}
                    onChange={handlePersonNameChange(setContactoEmergenciaNombre, 'contactoEmergenciaNombre')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('contactoEmergenciaNombre', { width: '100%', paddingLeft: '10px' })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Parentesco
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cónyuge, Padre, Madre"
                      value={contactoEmergenciaParentesco}
                      onChange={handlePersonNameChange(setContactoEmergenciaParentesco, 'contactoEmergenciaParentesco')}
                      onKeyDown={handleInputKeyDown}
                      className="input-text"
                      style={{ width: '100%', paddingLeft: '10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Teléfono de Emergencia <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      data-field="contactoEmergenciaTel"
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ej. 922-145-8890"
                      value={contactoEmergenciaTel}
                      onChange={handlePhoneChange(setContactoEmergenciaTel, 'contactoEmergenciaTel')}
                      onKeyDown={handleInputKeyDown}
                      maxLength={12}
                      className="input-text"
                      style={getFieldStyle('contactoEmergenciaTel', { width: '100%', paddingLeft: '10px', fontFamily: 'var(--font-mono)' })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Domicilio Particular Estructurado para Base de Datos con API de C.P. */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Domicilio Particular
                </h4>
                {isLoadingCp && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--primary)' }}>
                    Consultando C.P. en SEPOMEX...
                  </span>
                )}
              </div>

              {/* Fila 1: Calle (*), Número Exterior (*) y Número Interior (Opcional) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.75fr 0.75fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Calle <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="calle"
                    type="text"
                    placeholder="Ej. Av. Institutos Tecnológicos"
                    value={calle}
                    onChange={handleCleanTextChange(setCalle, 'calle', 90)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('calle', { paddingLeft: '10px', width: '100%', height: '38px' })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Número Exterior <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="numeroDomicilio"
                    type="text"
                    placeholder="Ej. 412"
                    value={numeroDomicilio}
                    onChange={handleCleanTextChange(setNumeroDomicilio, 'numeroDomicilio', 15)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('numeroDomicilio', { paddingLeft: '10px', width: '100%', height: '38px' })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Número Interior
                  </label>
                  <input
                    data-field="numeroInterior"
                    type="text"
                    placeholder="Ej. Int. B"
                    value={numeroInterior}
                    onChange={handleCleanTextChange(setNumeroInterior, 'numeroInterior', 15)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ paddingLeft: '10px', width: '100%', height: '38px' }}
                  />
                </div>
              </div>

              {/* Fila 2: Código Postal + Colonia (Combo Box dinámico por C.P. o texto libre) */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.65fr', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Código Postal (C.P.) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="codigoPostal"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 96730"
                    value={codigoPostal}
                    onChange={handleZipChange}
                    onKeyDown={handleInputKeyDown}
                    maxLength={5}
                    className="input-text"
                    style={getFieldStyle('codigoPostal', { paddingLeft: '10px', width: '100%', height: '38px', fontFamily: 'var(--font-mono)', fontWeight: 700 })}
                    required
                  />
                </div>

                <div>
                  {coloniasPorCp.length > 0 && !isCustomColonia ? (
                    <CustomSelect
                      label="Colonia o Fraccionamiento"
                      required
                      value={colonia}
                      onChange={(val) => {
                        setErrorField((prev) => (prev === 'colonia' ? null : prev));
                        if (val === '__custom__') {
                          setIsCustomColonia(true);
                          setColonia('');
                        } else {
                          setColonia(val);
                        }
                      }}
                      options={[
                        ...coloniasPorCp.map((c) => ({ value: c, label: c })),
                        { value: '__custom__', label: 'Otra colonia (escribir manualmente)...' }
                      ]}
                      onAfterSelect={(val, btnEl) => {
                        if (val === '__custom__') {
                          window.setTimeout(() => {
                            document.querySelector<HTMLElement>('[data-field="colonia"]')?.focus();
                          }, 40);
                        } else {
                          moveFocusNext(btnEl);
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                      hasError={errorField === 'colonia'}
                    />
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Colonia o Fraccionamiento <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        {coloniasPorCp.length > 0 && isCustomColonia && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomColonia(false);
                              setColonia(coloniasPorCp[0]);
                            }}
                            style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Ver lista del C.P.
                          </button>
                        )}
                      </div>
                      <input
                        data-field="colonia"
                        type="text"
                        placeholder="Ingresa el C.P. o escribe la colonia"
                        value={colonia}
                        onChange={handleCleanTextChange(setColonia, 'colonia', 70)}
                        onKeyDown={handleInputKeyDown}
                        className="input-text"
                        style={getFieldStyle('colonia', { paddingLeft: '10px', width: '100%', height: '38px' })}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Fila 3: Municipio / Localidad y Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Municipio / Localidad <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="municipio"
                    type="text"
                    placeholder="Ej. Minatitlán"
                    value={municipio}
                    onChange={handlePersonNameChange(setMunicipio, 'municipio')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('municipio', { paddingLeft: '10px', width: '100%', height: '38px' })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Estado <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="estadoDomicilio"
                    type="text"
                    placeholder="Ej. Veracruz"
                    value={estadoDomicilio}
                    onChange={handlePersonNameChange(setEstadoDomicilio, 'estadoDomicilio')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('estadoDomicilio', { paddingLeft: '10px', width: '100%', height: '38px' })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          {renderStepFooter(2)}
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCESO 4: SALUD Y UNIFORMES                              */}
      {/* ========================================================= */}
      {currentStepIndex === 3 && (
        <div id="section4" className="card" style={{ borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)' }}>
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px 16px 0 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--brand-200)',
                  flexShrink: 0
                }}
              >
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Salud & Uniformes
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Tallas de EPP, tipo de sangre y alergias.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: isSection4Done ? 'var(--success-bg)' : 'var(--surface)',
                color: isSection4Done ? 'var(--success-text)' : 'var(--text-muted)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: isSection4Done ? '1px solid var(--success-border)' : '1px solid var(--border)'
              }}
            >
              {isSection4Done ? '✓ Completado' : 'Pendiente'}
            </span>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Sub-bloque 1: Tallas de Calzado y Overol (No obligatorias) */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Uniformes y Equipo de Protección Personal (EPP)
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Opcional
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* 1. Talla de Calzado (MEX) con Combo Box o entrada manual */}
                <div>
                  {!isCustomCalzado ? (
                    <CustomSelect
                      label="Talla de Calzado (MEX)"
                      dataField="calzado"
                      value={calzado}
                      placeholder="Ej. 27.5"
                      onChange={(val) => {
                        if (val === '__custom_shoe__') {
                          setIsCustomCalzado(true);
                          setCalzado('');
                        } else {
                          setCalzado(val);
                        }
                      }}
                      onAfterSelect={(val, btnEl) => {
                        if (val === '__custom_shoe__') {
                          window.setTimeout(() => {
                            document.querySelector<HTMLElement>('[data-field="calzadoInput"]')?.focus();
                          }, 35);
                        } else {
                          moveFocusNext(btnEl);
                        }
                      }}
                      options={[
                        ...SHOE_SIZE_OPTIONS.map((sz) => ({ value: sz, label: `${sz} MEX` })),
                        { value: '__custom_shoe__', label: 'Escribir otra talla...' },
                        { value: 'No aplica', label: 'No aplica' },
                        { value: 'Sin especificar', label: 'Sin especificar' }
                      ]}
                      onKeyDown={handleInputKeyDown}
                    />
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Talla de Calzado (MEX)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomCalzado(false)}
                          style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Ver lista
                        </button>
                      </div>
                      <input
                        data-field="calzadoInput"
                        type="text"
                        inputMode="decimal"
                        placeholder="Ej. 27.5"
                        value={calzado}
                        onChange={handleShoeSizeChange}
                        onKeyDown={handleInputKeyDown}
                        maxLength={6}
                        className="input-text"
                        style={{ width: '100%', paddingLeft: '10px', height: '38px' }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Talla de Overol */}
                <div>
                  {!isCustomOverol ? (
                    <CustomSelect
                      label="Talla de Overol"
                      dataField="overol"
                      value={overol}
                      placeholder="Ej. Talla 40 (G)"
                      onChange={(val) => {
                        if (val === '__custom_coverall__') {
                          setIsCustomOverol(true);
                          setOverol('');
                        } else {
                          setOverol(val);
                        }
                      }}
                      onAfterSelect={(val, btnEl) => {
                        if (val === '__custom_coverall__') {
                          window.setTimeout(() => {
                            document.querySelector<HTMLElement>('[data-field="overolInput"]')?.focus();
                          }, 35);
                        } else {
                          moveFocusNext(btnEl);
                        }
                      }}
                      options={[
                        { value: 'Talla 36 (CH)', label: 'Talla 36 (CH)' },
                        { value: 'Talla 38 (M)', label: 'Talla 38 (M)' },
                        { value: 'Talla 40 (G)', label: 'Talla 40 (G)' },
                        { value: 'Talla 42 (XG)', label: 'Talla 42 (XG)' },
                        { value: 'Talla 44 (2XG)', label: 'Talla 44 (2XG)' },
                        { value: 'Talla 46 (3XG)', label: 'Talla 46 (3XG)' },
                        { value: '__custom_coverall__', label: 'Escribir otra talla...' },
                        { value: 'No aplica', label: 'No aplica' },
                        { value: 'Sin especificar', label: 'Sin especificar' }
                      ]}
                      onKeyDown={handleInputKeyDown}
                    />
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Talla de Overol
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomOverol(false)}
                          style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Ver lista
                        </button>
                      </div>
                      <input
                        data-field="overolInput"
                        type="text"
                        placeholder="Ej. Talla 40"
                        value={overol}
                        onChange={handleCleanTextChange(setOverol, 'overol', 35)}
                        onKeyDown={handleInputKeyDown}
                        className="input-text"
                        style={{ width: '100%', paddingLeft: '10px', height: '38px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-bloque 2: Información Médica, Discapacidad y Alergias Detalladas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'start' }}>
              <CustomSelect
                label="Tipo de Sangre"
                dataField="tipoSangre"
                required
                placeholder="Seleccionar grupo..."
                value={tipoSangre}
                onChange={(val) => {
                  setErrorField((prev) => (prev === 'tipoSangre' ? null : prev));
                  setTipoSangre(val);
                }}
                options={[
                  { value: 'O Positivo (O+)', label: 'O Positivo (O+)' },
                  { value: 'A Positivo (A+)', label: 'A Positivo (A+)' },
                  { value: 'B Positivo (B+)', label: 'B Positivo (B+)' },
                  { value: 'AB Positivo (AB+)', label: 'AB Positivo (AB+)' },
                  { value: 'O Negativo (O-)', label: 'O Negativo (O-)' },
                  { value: 'A Negativo (A-)', label: 'A Negativo (A-)' },
                  { value: 'B Negativo (B-)', label: 'B Negativo (B-)' },
                  { value: 'AB Negativo (AB-)', label: 'AB Negativo (AB-)' }
                ]}
                hasError={errorField === 'tipoSangre'}
                onKeyDown={handleInputKeyDown}
              />

              <div>
                <CustomSelect
                  label="Discapacidad o Ajuste Razonable"
                  dataField="discapacidad"
                  placeholder="Seleccionar..."
                  value={discapacidad}
                  onChange={setDiscapacidad}
                  onAfterSelect={(val, btnEl) => {
                    if (val === 'Otra condición (especificar)...') {
                      window.setTimeout(() => {
                        document.querySelector<HTMLElement>('[data-field="discapacidadDetalle"]')?.focus();
                      }, 35);
                    } else {
                      moveFocusNext(btnEl);
                    }
                  }}
                  options={[
                    { value: 'Ninguna', label: 'Ninguna' },
                    { value: 'Visual (uso de lentes graduados)', label: 'Visual (uso de lentes graduados)' },
                    { value: 'Auditiva', label: 'Auditiva' },
                    { value: 'Motriz', label: 'Motriz' },
                    { value: 'Otra condición (especificar)...', label: 'Otra condición (especificar)...' },
                    { value: 'Sin especificar', label: 'Sin especificar' }
                  ]}
                  onKeyDown={handleInputKeyDown}
                />
                {discapacidad === 'Otra condición (especificar)...' && (
                  <input
                    data-field="discapacidadDetalle"
                    type="text"
                    placeholder="Especificar discapacidad o ajuste requerido..."
                    value={discapacidadDetalle}
                    onChange={handleCleanTextChange(setDiscapacidadDetalle, 'discapacidadDetalle', 100)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ width: '100%', paddingLeft: '10px', marginTop: '8px', height: '36px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Padecimientos Crónicos / Medicación Continua
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ninguno, Hipertensión controlada, Diabetes, Asma..."
                  value={padecimientos}
                  onChange={handleCleanTextChange(setPadecimientos, 'padecimientos', 140)}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%', paddingLeft: '10px', height: '38px' }}
                />
              </div>
            </div>

            {/* Campo amplio para múltiples alergias con etiquetas rápidas */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Alergias (Medicamentos, Alimentos o Ambientales)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {[
                    'Sin alergias conocidas',
                    'Penicilina',
                    'AINES / Aspirina',
                    'Sulfas',
                    'Polvo / Polen',
                    'Mariscos',
                    'Látex'
                  ].map((chip) => {
                    const isSelected = alergias.toLowerCase().includes(chip.toLowerCase());
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleAllergyChip(chip)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--brand-50)' : 'var(--surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        + {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
              <textarea
                data-field="alergias"
                placeholder="Especificar alergias o seleccionar arriba..."
                value={alergias}
                onChange={(e) => setAlergias(e.target.value.slice(0, 350))}
                onKeyDown={handleInputKeyDown}
                rows={2}
                className="input-text"
                style={{ width: '100%', padding: '8px 12px', fontSize: '12px', resize: 'vertical' }}
              />
            </div>
          </div>
          {renderStepFooter(3)}
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCESO 5: NÓMINA Y BANCO                                 */}
      {/* ========================================================= */}
      {currentStepIndex === 4 && (
        <div id="section5" className="card" style={{ borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)' }}>
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px 16px 0 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--brand-200)',
                  flexShrink: 0
                }}
              >
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Nómina & Banco
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Cuenta bancaria y CLABE de 18 dígitos.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: isSection5Done ? 'var(--success-bg)' : 'var(--surface)',
                color: isSection5Done ? 'var(--success-text)' : 'var(--text-muted)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: isSection5Done ? '1px solid var(--success-border)' : '1px solid var(--border)'
              }}
            >
              {isSection5Done ? '✓ Completado' : 'Pendiente'}
            </span>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {bankAccounts.slice(0, 1).map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Nómina
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '12px', alignItems: 'start' }}>
                    {/* Institución Bancaria + Opción de Agregar Nuevo Banco */}
                    <div>
                      <CustomSelect
                        label="Institución Bancaria"
                        dataField={`bank-${acc.id}`}
                        required={acc.isPrimary}
                        placeholder="Seleccionar banco..."
                        value={acc.bank}
                        hasError={errorField === `bank-${acc.id}`}
                        onChange={(val) => {
                          setErrorField((prev) => (prev === `bank-${acc.id}` ? null : prev));
                          if (val === '__new_bank__') {
                            setAddingBankForAccountId(acc.id);
                            setNewBankNameInput('');
                          } else {
                            updateBankAccount(acc.id, { bank: val });
                          }
                        }}
                        onAfterSelect={(val, btnEl) => {
                          if (val === '__new_bank__') {
                            window.setTimeout(() => {
                              document.querySelector<HTMLElement>(`[data-field="new-bank-${acc.id}"]`)?.focus();
                            }, 35);
                          } else {
                            moveFocusNext(btnEl);
                          }
                        }}
                        options={[
                          ...savedBanks.map((b) => ({ value: b, label: b })),
                          { value: '__new_bank__', label: '+ Agregar nuevo banco...' }
                        ]}
                        onKeyDown={handleInputKeyDown}
                      />

                      {addingBankForAccountId === acc.id && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <input
                            data-field={`new-bank-${acc.id}`}
                            type="text"
                            placeholder="Nombre del nuevo banco (Ej. BanBajío, Nu)"
                            value={newBankNameInput}
                            onChange={(e) => setNewBankNameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmNewBank(acc.id);
                              }
                            }}
                            className="input-text"
                            style={{ flex: 1, height: '34px', fontSize: '11.5px', paddingLeft: '8px' }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmNewBank(acc.id)}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingBankForAccountId(null)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CLABE Interbancaria (18 dígitos) */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                        CLABE Interbancaria (18 dígitos) {acc.isPrimary && <span style={{ color: 'var(--danger)' }}>*</span>}
                      </label>
                      <input
                        data-field={`clabe-${acc.id}`}
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej. 0121-8000-1234-5678-90"
                        value={acc.clabe}
                        onChange={(e) => {
                          setErrorField((prev) => (prev === `clabe-${acc.id}` ? null : prev));
                          const { formatted, hadInvalid } = formatClabeMask(e.target.value);
                          if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
                          updateBankAccount(acc.id, { clabe: formatted });
                        }}
                        onKeyDown={handleInputKeyDown}
                        maxLength={22}
                        className="input-text"
                        style={getFieldStyle(`clabe-${acc.id}`, {
                          width: '100%',
                          height: '38px',
                          paddingLeft: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600
                        })}
                      />
                    </div>

                    {/* Número de Tarjeta (16 dígitos) */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                        Número de Tarjeta / Débito (16 dígitos)
                      </label>
                      <input
                        data-field={`card-${acc.id}`}
                        type="text"
                        inputMode="numeric"
                        placeholder="Opcional · 1234-5678-9012-3456"
                        value={acc.cardNumber || ''}
                        onChange={(e) => {
                          setErrorField((prev) => (prev === `card-${acc.id}` ? null : prev));
                          const { formatted, hadInvalid } = formatCardMask(e.target.value);
                          if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
                          updateBankAccount(acc.id, { cardNumber: formatted });
                        }}
                        onKeyDown={handleInputKeyDown}
                        maxLength={19}
                        className="input-text"
                        style={getFieldStyle(`card-${acc.id}`, {
                          width: '100%',
                          height: '38px',
                          paddingLeft: '10px',
                          fontFamily: 'var(--font-mono)'
                        })}
                      />
                    </div>

                    {/* Uso de la Cuenta: Fijo en Nómina */}
                    <CustomSelect
                      label="Uso de la Cuenta"
                      value={PRIMARY_BANK_ALIAS}
                      disabled
                      autoOpenOnEnterFocus={false}
                      onChange={() => {}}
                      options={[{ value: PRIMARY_BANK_ALIAS, label: PRIMARY_BANK_ALIAS }]}
                      onKeyDown={handleInputKeyDown}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderStepFooter(4)}
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCESO 6: CONSTANCIA Y CURSOS                            */}
      {/* ========================================================= */}
      {currentStepIndex === 5 && (
        <div id="section6" className="card" style={{ borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)' }}>
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px 16px 0 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--brand-200)',
                  flexShrink: 0
                }}
              >
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Expediente Digital &amp; Certificaciones
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Organización por subcarpetas (Documentos, Certificaciones y anexos).
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: isSection6Done ? 'var(--success-bg)' : 'var(--surface)',
                  color: isSection6Done ? 'var(--success-text)' : 'var(--text-muted)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: isSection6Done ? '1px solid var(--success-border)' : '1px solid var(--border)'
                }}
              >
                {isSection6Done ? `✓ ${documents.length} Archivo${documents.length === 1 ? '' : 's'}` : 'Opcional'}
              </span>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '20px' }}>
            {/* Sub-bloque Izquierdo: Subcarpetas del Expediente (Creables y Seleccionables) */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <FolderOpen className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Subcarpetas del Expediente ({expedienteFolders.length})
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingFolder((prev) => !prev)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: 'var(--primary)',
                    borderColor: 'var(--brand-200)',
                    backgroundColor: 'var(--brand-50)'
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Nueva Carpeta</span>
                </button>
              </div>

              {isCreatingFolder && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--brand-200)'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nombre de la carpeta (Ej. Médicos, Licencias...)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value.slice(0, 40))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateFolder();
                      }
                    }}
                    className="input-text"
                    style={{ flex: 1, height: '32px', fontSize: '11.5px', paddingLeft: '10px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="btn btn-primary"
                    style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 700 }}
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Cuadrícula de Subcarpetas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '8px' }}>
                {expedienteFolders.map((folderName) => {
                  const isSelected = activeFolder === folderName;
                  const count = documents.filter((d) => (d.folder || 'Documentos') === folderName).length;
                  const isCustom = !DEFAULT_EXPEDIENTE_FOLDERS.includes(folderName);
                  const subtitle =
                    folderName === 'Documentos'
                      ? 'INE, CURP, RFC, NSS...'
                      : folderName === 'Certificaciones'
                      ? 'DC-3, Rig Pass, Cursos...'
                      : folderName === 'Contratos y Anexos'
                      ? 'Cartas, Contrato...'
                      : 'Carpeta personalizada';

                  return (
                    <div
                      key={folderName}
                      onClick={() => handleSelectFolder(folderName)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleSelectFolder(folderName);
                        handleNewDocFilesSelect(e.dataTransfer.files, folderName);
                      }}
                      style={{
                        position: 'relative',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--brand-50)' : 'var(--surface-alt)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          {isSelected ? (
                            <FolderOpen className="w-4 h-4" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          ) : (
                            <Folder className="w-4 h-4" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {folderName}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '999px',
                              backgroundColor: count > 0 ? 'var(--primary)' : 'var(--surface)',
                              color: count > 0 ? '#FFFFFF' : 'var(--text-muted)',
                              border: count > 0 ? 'none' : '1px solid var(--border)'
                            }}
                          >
                            {count}
                          </span>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomFolder(folderName);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '12px',
                                padding: '0 2px',
                                lineHeight: 1
                              }}
                              title="Eliminar carpeta"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {subtitle}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Contenido de la subcarpeta seleccionada */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleNewDocFilesSelect(e.dataTransfer.files, activeFolder);
                }}
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flex: 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    Archivos en &ldquo;{activeFolder}&rdquo; ({documents.filter((d) => (d.folder || 'Documentos') === activeFolder).length})
                  </span>
                </div>

                {documents.filter((d) => (d.folder || 'Documentos') === activeFolder).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '190px', overflowY: 'auto' }}>
                    {documents
                      .filter((d) => (d.folder || 'Documentos') === activeFolder)
                      .map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--surface-alt)',
                            border: '1px solid var(--border)',
                            fontSize: '11.5px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.title}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {doc.category} {doc.issuer ? `· ${doc.issuer}` : ''} {doc.fileName ? `· 📎 ${doc.fileName}` : ''}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {(doc.fileDataUrl || doc.externalUrl) && (
                              <a
                                href={doc.fileDataUrl || doc.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.fileName || undefined}
                                style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Ver</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDocumentItem(doc.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontWeight: 700, fontSize: '11px' }}
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1.5px dashed var(--border)',
                      borderRadius: '10px',
                      padding: '18px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      backgroundColor: 'var(--surface-alt)'
                    }}
                  >
                    Carpeta vacía · Arrastra archivos aquí o agrégalos a la derecha
                  </div>
                )}
              </div>
            </div>

            {/* Sub-bloque Derecho: Formulario limpio para subir documentos a la carpeta seleccionada */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleNewDocFilesSelect(e.dataTransfer.files);
              }}
              onPaste={(e) => {
                if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                  handleNewDocFilesSelect(e.clipboardData.files);
                }
              }}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Subir Documento o Certificado
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--brand-50)',
                    color: 'var(--primary)',
                    border: '1px solid var(--brand-200)'
                  }}
                >
                  📁 {activeFolder}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <CustomSelect
                  label="Subcarpeta Destino"
                  value={activeFolder}
                  onChange={handleSelectFolder}
                  options={expedienteFolders.map((f) => ({ value: f, label: f }))}
                />

                <CustomSelect
                  label="Tipo de Documento"
                  value={newDocCategory}
                  onChange={(val) => setNewDocCategory(val as EmployeeDocumentItem['category'])}
                  options={getDocTypeOptionsForFolder(activeFolder)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Nombre o Descripción
                  </label>
                  <input
                    type="text"
                    placeholder={
                      activeFolder === 'Documentos'
                        ? 'Ej. INE Vigente / CURP / RFC'
                        : activeFolder === 'Certificaciones'
                        ? 'Ej. Curso Rig Pass / DC-3'
                        : 'Ej. Carta de Recomendación'
                    }
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ width: '100%', paddingLeft: '10px', height: '38px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Institución / Emisor (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      activeFolder === 'Documentos'
                        ? 'Ej. INE, SAT, IMSS...'
                        : 'Ej. STPS, PEMEX...'
                    }
                    value={newDocIssuer}
                    onChange={(e) => setNewDocIssuer(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ width: '100%', paddingLeft: '10px', height: '38px' }}
                  />
                </div>
              </div>

              <label
                style={{
                  border: '1.5px dashed var(--brand-300)',
                  backgroundColor: 'rgba(59, 130, 246, 0.03)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--primary)'
                }}
              >
                <Upload className="w-4 h-4" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {newDocFileName ? `📎 ${newDocFileName}` : 'Seleccionar o arrastrar archivo(s) (PDF / Imagen)'}
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*,.doc,.docx"
                  onChange={(e) => {
                    handleNewDocFilesSelect(e.target.files);
                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="button"
                onClick={handleAddDocumentItem}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  height: '38px',
                  borderColor: 'var(--brand-200)',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)'
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar en &ldquo;{activeFolder}&rdquo;</span>
              </button>
            </div>
          </div>
          {renderStepFooter(5)}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA PREVIA DE CREDENCIAL Y FICHA DEL EMPLEADO            */}
      {/* ========================================================= */}
      {currentStepIndex === 5 && (
    <div
      className="card"
      style={{
        borderRadius: '16px',
        border: '1px solid var(--brand-200)',
        background: 'linear-gradient(145deg, var(--surface) 0%, var(--surface-alt) 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
        {/* Cabecera concreta de la vista previa */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-200)'
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Vista Previa de Credencial y Ficha
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Resumen visual del colaborador.
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: completedCount === steps.length ? 'var(--success-text)' : 'var(--primary)',
              backgroundColor: completedCount === steps.length ? 'var(--success-bg)' : 'var(--brand-50)',
              padding: '4px 12px',
              borderRadius: '999px',
              border: completedCount === steps.length ? '1px solid var(--success-border)' : '1px solid var(--brand-200)'
            }}
          >
            {completedCount === steps.length ? '✓ Listo para Guardar' : `${completedCount} de ${steps.length} apartados listos`}
          </span>
        </div>

        {/* Layout Simétrico: Credencial Laboral Izquierda + Cuadrícula 2x2 Derecha */}
        <div className="employee-preview-shell">
          {/* 1. CREDENCIAL LABORAL SIFYGSA */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-md)',
              height: '100%'
            }}
          >
            {/* Banner Superior Corporativo con Ranura de Portagafete */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0B1220 0%, #1E3A8A 55%, #2563EB 100%)',
                padding: '10px 16px 28px 16px',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* Destello decorativo */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '-28px',
                  right: '-24px',
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(147, 197, 253, 0.28) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Ranura de portagafete centrada */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: '44px',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.28)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', position: 'relative' }}>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.12em', color: '#93C5FD' }}>
                    CREDENCIAL LABORAL
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 900, letterSpacing: '0.02em' }}>
                    SIFYGSA · FIRE &amp; GAS
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.28)'
                    }}
                  >
                    {empId}
                  </span>
                  {tipoSangre && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(220, 38, 38, 0.85)',
                        color: '#FFFFFF',
                        padding: '1px 7px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      🩸 {tipoSangre.match(/\(([^)]+)\)/)?.[1] || tipoSangre}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cuerpo Credencial con Foto Sobre-puesta */}
            <div style={{ padding: '0 16px 14px 16px', marginTop: '-22px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '14px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '21px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '3px solid var(--surface)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Foto del empleado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    `${nombrePila.trim()[0] || 'S'}${apellidoPaterno.trim()[0] || 'F'}`.toUpperCase()
                  )}
                </div>

                <div style={{ paddingBottom: '2px', overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {`${nombrePila} ${apellidoPaterno} ${apellidoMaterno}`.trim() || 'Nuevo Colaborador'}
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {puestoOficial || 'Puesto por definir'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '10.5px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {deptTecnico || 'Sin Departamento'}
                </span>
                {categoriaLaboral && (
                  <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--brand-50)', border: '1px solid var(--brand-200)', fontWeight: 700, color: 'var(--primary)' }}>
                    {categoriaLaboral}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 10px', fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                  <MapPin className="w-3.5 h-3.5 text-muted" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{baseDespliegue}</span>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {extOficina ? `Ext. ${extOficina}` : 'Sin Ext.'}
                </div>
                <div style={{ gridColumn: '1 / -1', fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Jefe: <strong style={{ color: 'var(--text-primary)' }}>{supervisor || 'Por asignar'}</strong>
                </div>
                {(emailInstitucional || emailPersonal) && (
                  <div style={{ gridColumn: '1 / -1', fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Correo: <strong style={{ color: 'var(--text-primary)' }}>{(emailInstitucional || emailPersonal).toLowerCase()}</strong>
                  </div>
                )}
              </div>

              {/* Pie de Credencial: Código de Barras + Mini QR + Contrato */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', flexShrink: 0, color: 'var(--text-primary)' }} aria-hidden="true">
                    <rect x="1" y="1" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="3.2" y="3.2" width="2.6" height="2.6" fill="currentColor" />
                    <rect x="16" y="1" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="18.2" y="3.2" width="2.6" height="2.6" fill="currentColor" />
                    <rect x="1" y="16" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="3.2" y="18.2" width="2.6" height="2.6" fill="currentColor" />
                    <rect x="10.5" y="2" width="2.5" height="2.5" fill="currentColor" />
                    <rect x="10.5" y="7" width="2.5" height="5" fill="currentColor" />
                    <rect x="15" y="11" width="3" height="3" fill="currentColor" />
                    <rect x="20" y="12" width="3" height="6" fill="currentColor" />
                    <rect x="11" y="16" width="6" height="2.5" fill="currentColor" />
                    <rect x="15" y="20" width="4" height="3" fill="currentColor" />
                  </svg>

                  <svg viewBox="0 0 112 20" style={{ height: '18px', flex: 1, maxWidth: '140px', color: 'var(--text-primary)' }} aria-hidden="true">
                    {[2, 4, 2, 1, 3, 2, 1, 4, 2, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 4, 1, 2, 3].map((w, i) => {
                      const x = [2, 6, 12, 16, 20, 25, 29, 32, 38, 42, 46, 51, 55, 59, 65, 68, 73, 77, 81, 86, 91, 97, 101, 106][i];
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={1}
                          width={w}
                          height={18}
                          rx={0.5}
                          fill="currentColor"
                          opacity={i % 2 === 0 ? 0.72 : 0.36}
                        />
                      );
                    })}
                  </svg>
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {tipoContrato || 'CONTRATO'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. COLUMNA DERECHA: CUADRÍCULA SIMÉTRICA 2x2 */}
          <div className="employee-preview-bento">
            {/* Tarjeta A: Datos Oficiales y SAT */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Datos Oficiales y SAT
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                    backgroundColor: csfStatus === 'Vigente' ? 'var(--success-bg)' : csfStatus === 'En Revisión' ? '#FEF3C7' : 'var(--surface-alt)',
                    color: csfStatus === 'Vigente' ? 'var(--success-text)' : csfStatus === 'En Revisión' ? '#92400E' : 'var(--text-muted)'
                  }}
                >
                  CSF: {csfStatus === 'Vigente' ? 'Verificada ✓' : csfStatus}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>RFC:</span>
                  <strong style={{ color: rfc.length >= 12 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{rfc || 'Pendiente'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CURP:</span>
                  <strong style={{ color: curp.length === 18 ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '10.5px' }}>{curp || 'Pendiente'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>NSS:</span>
                  <strong style={{ color: toRawDigits(nss).length === 11 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{nss || 'Pendiente'}</strong>
                </div>
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {csfFileName ? `📎 CSF: ${csfFileName}` : 'Sin archivo CSF'}
              </div>
            </div>

            {/* Tarjeta B: Salud, Tallas y Emergencia */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeartPulse className="w-4 h-4" style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Salud y Uniformes
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: tipoSangre ? 'var(--danger-text)' : 'var(--text-muted)' }}>
                  {tipoSangre || 'Sangre pendiente'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '10.5px' }}>
                <span style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                  Calzado: <strong>{calzado || '—'}</strong>
                </span>
                <span style={{ padding: '3px 7px', borderRadius: '6px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                  Overol: <strong>{overol || '—'}</strong>
                </span>
              </div>

              <div
                style={{
                  fontSize: '10.5px',
                  padding: '6px 8px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <strong style={{ color: 'var(--danger-text)' }}>Emergencia:</strong> {contactoEmergenciaNombre || 'Sin contacto'}{' '}
                {contactoEmergenciaTel ? `· ${contactoEmergenciaTel}` : ''}
              </div>
            </div>

            {/* Tarjeta C: Cuentas de Nómina (Estilo Tarjeta Metálica) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
                color: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #334155',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Nómina
                </span>
                {/* Chip EMV + Contactless */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 28 20" style={{ width: '24px', height: '16px' }} aria-hidden="true">
                    <rect x="1" y="1" width="26" height="18" rx="4" fill="#FBBF24" opacity="0.9" />
                    <path d="M1 8h26M1 12h26M10 1v18M18 1v18" stroke="#92400E" strokeWidth="1" fill="none" />
                  </svg>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>
                  {primaryBankAccount?.bank || 'Banco por seleccionar'}
                </div>
                <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#CBD5E1', marginTop: '3px' }}>
                  CLABE: {primaryBankAccount?.clabe || 'Pendiente 18 dígitos'}
                </div>
                {primaryBankAccount?.cardNumber && (
                  <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#93C5FD', marginTop: '2px' }}>
                    Tarjeta: •••• •••• •••• {toRawDigits(primaryBankAccount.cardNumber).slice(-4)}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed rgba(148, 163, 184, 0.3)', paddingTop: '6px', fontSize: '10px', color: '#94A3B8', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                <span>Cuenta de nómina</span>
              </div>
            </div>

            {/* Tarjeta D: Cursos y Ubicación */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award className="w-4 h-4" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Cursos y Domicilio
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--primary)' }}>
                  {documents.length} adjunto{documents.length === 1 ? '' : 's'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {documents.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {documents.slice(0, 3).map((d) => (
                      <span
                        key={d.id}
                        style={{
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--brand-50)',
                          color: 'var(--primary)',
                          border: '1px solid var(--brand-200)',
                          fontWeight: 700,
                          maxWidth: '160px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {d.title}
                      </span>
                    ))}
                    {documents.length > 3 && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        +{documents.length - 3} más
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Sin cursos o cartas agregadas aún</span>
                )}
              </div>

              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🏠 {calle ? `${colonia || ''}, ${municipio}, ${estadoDomicilio}` : `${municipio}, ${estadoDomicilio}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
      </div>
    </form>
  );
};
