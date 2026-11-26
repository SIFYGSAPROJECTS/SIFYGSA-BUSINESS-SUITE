import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MapPin,
  Building2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Employee } from '../../types';
import { DEPARTMENTS, EMPLOYEES } from '../../data/mockData';
import {
  sanitizePersonName,
  sanitizeCleanText,
  formatPhoneMask,
  formatNssMask,
  formatClabeMask,
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
  logHrAuditAction
} from '../../utils/formShield';

// =========================================================================
// COMPONENTE: SELECT PERSONALIZADO CON FLECHA ANIMADA Y SCROLL FLUIDO
// =========================================================================
interface CustomSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  hasError?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  onKeyDown,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: isOpen ? 60 : 1 }} ref={containerRef}>
      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
          if (e.key === 'Enter' && isOpen) {
            e.preventDefault();
            setIsOpen(false);
          } else if (onKeyDown) {
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
          cursor: 'pointer',
          padding: '0 12px',
          textAlign: 'left',
          backgroundColor: 'var(--surface)',
          borderColor: hasError ? 'var(--danger)' : isOpen ? 'var(--primary)' : 'var(--border)',
          boxShadow: hasError
            ? '0 0 0 3px rgba(239, 68, 68, 0.2)'
            : isOpen
            ? '0 0 0 3px var(--brand-100)'
            : 'none',
          transition: 'all var(--transition-fast)'
        }}
        title={`Seleccionar ${label}`}
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

        {/* Flechita animada que rota 180 grados suavemente */}
        <ChevronDown
          className="w-4 h-4 text-muted"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
            marginLeft: '8px'
          }}
        />
      </button>

      {/* Menú flotante con animación y scroll limitado */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-xl)',
            padding: '4px'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  backgroundColor: isSelected ? 'var(--brand-50)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// VISTA PRINCIPAL: ALTA DE EMPLEADO (5.1 RH)
// =========================================================================
interface EmployeeCreateViewProps {
  onSuccess: (newEmployee: Employee) => void;
  onCancel: () => void;
  departments?: string[];
}

export const EmployeeCreateView: React.FC<EmployeeCreateViewProps> = ({
  onCancel,
  departments
}) => {
  const availableDepartments = departments || DEPARTMENTS;
  // Referencia para el primer campo de captura
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Estados de acordeones colapsables
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    section1: true,
    section2: true,
    section3: true,
    section4: true,
    section5: true
  });

  const [activeSectionId, setActiveSectionId] = useState<string>('section1');

  const toggleSection = (sectionKey: string) => {
    setActiveSectionId(sectionKey);
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Estados del Formulario
  const [isAutoFolio, setIsAutoFolio] = useState(true);
  const [empId, setEmpId] = useState(() => getNextEmployeeFolio(loadPersistedEmployees(EMPLOYEES)));

  // Estado de Toast Notification (Éxito / Advertencia de 1 a 3 palabras) y Campo con Error
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

  // Sección 1: Datos Laborales
  const [subsidiary, setSubsidiary] = useState('SIFYGSA S.A. de C.V.');
  const [deptTecnico, setDeptTecnico] = useState('');
  const [baseDespliegue, setBaseDespliegue] = useState('Minatitlán, Ver. (Almacén Principal)');
  const [tipoContrato, setTipoContrato] = useState('Tiempo Indeterminado (Planta)');
  const [salarioBruto, setSalarioBruto] = useState('');
  const [proyectoAsignado, setProyectoAsignado] = useState('');

  // Sección 2: Datos Personales
  const [formularioPersonalizado, setFormularioPersonalizado] = useState('SFG - Empleado Técnico');
  const [plantillaPuesto, setPlantillaPuesto] = useState('Plantilla Especialista Fire & Gas SIL-3');
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

  // Sección 3: Contacto y Domicilio
  const [telMovil, setTelMovil] = useState('');
  const [emailInstitucional, setEmailInstitucional] = useState('');
  const [emailPersonal, setEmailPersonal] = useState('');
  const [telFijo, setTelFijo] = useState('');
  const [extOficina, setExtOficina] = useState('');
  const [direccion, setDireccion] = useState('');

  // Sección 4: Salud y Seguridad
  const [calzado, setCalzado] = useState('');
  const [overol, setOverol] = useState('');
  const [tipoSangre, setTipoSangre] = useState('O Positivo (O+)');
  const [respirador, setRespirador] = useState('');
  const [alergias, setAlergias] = useState('');

  // Sección 5: Nómina y Banco
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState('');
  const [contactoEmergenciaParentesco, setContactoEmergenciaParentesco] = useState('');
  const [contactoEmergenciaTel, setContactoEmergenciaTel] = useState('');
  const [banco, setBanco] = useState('BBVA México (Bancomer)');
  const [clabe, setClabe] = useState('');

  // =========================================================================
  // VALIDACIÓN DINÁMICA DE COMPLETITUD POR SECCIÓN
  // =========================================================================
  const isSection1Done = Boolean(
    subsidiary &&
    tipoContrato &&
    deptTecnico && !deptTecnico.toLowerCase().includes('seleccionar') &&
    salarioBruto.trim() && salarioBruto !== '0' && salarioBruto !== '0.00'
  );

  const isSection2Done = Boolean(
    nombrePila.trim().length >= 2 &&
    apellidoPaterno.trim().length >= 2 &&
    puestoOficial.trim().length >= 2 &&
    rfc.trim().length >= 12 &&
    curp.trim().length === 18 &&
    toRawDigits(nss).length === 11
  );

  const isSection3Done = Boolean(
    toRawDigits(telMovil).length === 10 &&
    direccion.trim() &&
    isValidEmail(emailInstitucional)
  );

  const isSection4Done = Boolean(
    calzado.trim() &&
    overol.trim()
  );

  const isSection5Done = Boolean(
    toRawDigits(clabe).length === 18 &&
    contactoEmergenciaNombre.trim() &&
    toRawDigits(contactoEmergenciaTel).length === 10
  );

  const steps = [
    { id: 'section1', label: '1. Datos Laborales', isDone: isSection1Done },
    { id: 'section2', label: '2. Datos Personales', isDone: isSection2Done },
    { id: 'section3', label: '3. Contacto y Domicilio', isDone: isSection3Done },
    { id: 'section4', label: '4. Salud y Seguridad', isDone: isSection4Done },
    { id: 'section5', label: '5. Nómina y Banco', isDone: isSection5Done }
  ];

  const completedCount = steps.filter((s) => s.isDone).length;

  // Mantener vista en la parte superior sin salto brusco al montar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (firstInputRef.current) {
      firstInputRef.current.focus({ preventScroll: true });
    }
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Atajo global Ctrl+S para guardar inmediatamente desde cualquier campo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Salto al siguiente campo con la tecla Enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest('form');
      if (form) {
        const focusable = Array.from(
          form.querySelectorAll<HTMLElement>(
            'input:not([disabled]):not([type="checkbox"]), select:not([disabled]), textarea:not([disabled]), button.input-text'
          )
        );
        const index = focusable.indexOf(e.target as HTMLElement);
        if (index > -1 && index < focusable.length - 1) {
          focusable[index + 1].focus();
        }
      }
    }
  };

  // =========================================================================
  // INPUT MASKING & INPUT FILTERING EN TIEMPO REAL
  // =========================================================================

  // Salario: solo números y un punto decimal, con comas de millares en tiempo real
  const handleSalarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField(null);
    const { formatted, hadInvalid } = formatCurrencyMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo números!', 'warning', 2200);
    setSalarioBruto(formatted);
  };

  // Nombres y Apellidos: solo letras y espacios, sin números ni símbolos raros
  const handlePersonNameChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldKey: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === fieldKey ? null : prev));
    const { value, hadInvalid } = sanitizePersonName(e.target.value);
    if (hadInvalid) triggerToast('¡Solo letras!', 'warning', 2200);
    setter(value);
  };

  // Textos limpios (Puesto, Proyecto, Overol, Respirador, Alergias)
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

  // RFC: Solo alfanumérico en mayúsculas, longitud máxima 13
  const handleRfcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'rfc' ? null : prev));
    const { value, hadInvalid } = formatRfcMask(e.target.value);
    if (hadInvalid) triggerToast('¡Sin símbolos!', 'warning', 2200);
    setRfc(value);
  };

  // CURP: Solo alfanumérico en mayúsculas, longitud máxima 18
  const handleCurpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'curp' ? null : prev));
    const { value, hadInvalid } = formatCurpMask(e.target.value);
    if (hadInvalid) triggerToast('¡Sin símbolos!', 'warning', 2200);
    setCurp(value);
  };

  // NSS: Máscara automática 34-12-88-9412-1 (11 dígitos)
  const handleNssChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'nss' ? null : prev));
    const { formatted, hadInvalid } = formatNssMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setNss(formatted);
  };

  // CLABE: Máscara automática 0121-8000-1234-5678-90 (18 dígitos)
  const handleClabeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorField((prev) => (prev === 'clabe' ? null : prev));
    const { formatted, hadInvalid } = formatClabeMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setClabe(formatted);
  };

  // Teléfonos: Máscara automática 922-145-8890 (10 dígitos)
  const handlePhoneChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldKey?: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (fieldKey) setErrorField((prev) => (prev === fieldKey ? null : prev));
    const { formatted, hadInvalid } = formatPhoneMask(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setter(formatted);
  };

  // Calzado: Solo números y punto decimal (Ej. 28.0)
  const handleShoeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, hadInvalid } = sanitizeShoeSize(e.target.value);
    if (hadInvalid) triggerToast('¡Solo números!', 'warning', 2200);
    setCalzado(value);
  };

  // Extensión: Solo dígitos (Ej. 108)
  const handleExtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, hadInvalid } = sanitizeExtension(e.target.value);
    if (hadInvalid) triggerToast('¡Solo dígitos!', 'warning', 2200);
    setExtOficina(value);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetAllFields = (nextFolio?: string) => {
    setNombrePila('');
    setApellidoPaterno('');
    setApellidoMaterno('');
    setDeptTecnico('');
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
    setDireccion('');
    setCalzado('');
    setOverol('');
    setRespirador('');
    setAlergias('');
    setContactoEmergenciaNombre('');
    setContactoEmergenciaParentesco('');
    setContactoEmergenciaTel('');
    setClabe('');
    setFotoPreview(null);
    setNotasContratacion('');
    setErrorField(null);
    if (nextFolio && isAutoFolio) {
      setEmpId(nextFolio);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // 1. Validación No Destructiva (No borra los campos; señala el error exacto)
    if (!deptTecnico || deptTecnico.toLowerCase().includes('seleccionar')) {
      focusErrorField('section1', 'deptTecnico', '¡Selecciona departamento!');
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
    if (!isValidEmail(emailInstitucional)) {
      focusErrorField('section3', 'emailInstitucional', '¡Correo inválido!');
      return;
    }
    if (emailPersonal.trim() && !isValidEmail(emailPersonal)) {
      focusErrorField('section3', 'emailPersonal', '¡Correo inválido!');
      return;
    }
    if (telFijo.trim() && toRawDigits(telFijo).length !== 10) {
      focusErrorField('section3', 'telFijo', '¡Teléfono a 10 dígitos!');
      return;
    }
    if (direccion.trim().length < 5) {
      focusErrorField('section3', 'direccion', '¡Falta dirección!');
      return;
    }
    if (contactoEmergenciaTel.trim() && toRawDigits(contactoEmergenciaTel).length !== 10) {
      focusErrorField('section5', 'contactoEmergenciaTel', '¡Teléfono a 10 dígitos!');
      return;
    }
    if (toRawDigits(clabe).length !== 18) {
      focusErrorField('section5', 'clabe', '¡CLABE a 18 dígitos!');
      return;
    }

    // 2. Normalización / Sanitización de datos para almacenamiento JSON (Raw vs Formatted)
    const fullName = `${nombrePila.trim()} ${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`.trim();
    const initials = `${nombrePila.trim()[0] || ''}${apellidoPaterno.trim()[0] || ''}`.toUpperCase();
    const cleanClabe = toRawDigits(clabe); // Se guarda sin guiones en la BD/JSON

    // 2.1 Validación de Identificadores Únicos vs Homónimos (Permite mismo nombre, bloquea mismo RFC/CURP/NSS)
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

    const nuevoColaborador: Employee = {
      id: empId,
      name: fullName,
      email: emailInstitucional.trim().toLowerCase(),
      emailPersonal: emailPersonal.trim().toLowerCase() || undefined,
      initials: initials || 'SF',
      avatarBg: '#1D4ED8',
      position: puestoOficial.trim(),
      department: deptTecnico.includes('-') ? deptTecnico.split('-')[1].trim() : deptTecnico,
      subsidiary: subsidiary.includes('SIFYGSA') ? 'SIFYGSA' : 'VIPSA',
      location: baseDespliegue || 'Minatitlán, Ver.',
      squad: 'Cuadrilla Alfa',
      silStatus: 'Vigente SIL-3',
      silStatusType: 'success',
      hireDate: new Date().toLocaleDateString('es-MX'),
      photoUrl: fotoPreview || undefined,
      phoneCell: telMovil,
      phonePrimary: telFijo || undefined,
      supervisor: supervisor.trim() || undefined,
      address: direccion.trim(),
      rfc: rfc.trim(),
      curp: curp.trim(),
      nss: nss.trim(),
      salary: salarioBruto,
      contractType: tipoContrato || undefined,
      emergencyContact: contactoEmergenciaNombre.trim() || undefined,
      emergencyPhone: contactoEmergenciaTel || undefined,
      emergencyRelationship: contactoEmergenciaParentesco.trim() || undefined,
      bank: banco || undefined,
      clabe: cleanClabe,
      bloodType: tipoSangre || undefined,
      shoeSize: calzado || undefined,
      coverallSize: overol.trim() || undefined,
      allergies: alergias.trim() || undefined
    };

    // 3. Guardar en JSON local (localStorage)
    const updatedList = [nuevoColaborador, ...currentStored.filter((item) => item.id !== nuevoColaborador.id)];
    savePersistedEmployees(updatedList);

    // 3.1 Registrar movimiento en la Bitácora del Gerente de RRHH
    logHrAuditAction({
      actionType: 'Alta de Empleado',
      targetRecord: `${nuevoColaborador.id} · ${nuevoColaborador.name}`,
      details: dupCheck.isHomonym
        ? `Alta con homonimia detectada (diferenciado por CURP ${nuevoColaborador.curp} y RFC ${nuevoColaborador.rfc}).`
        : `Alta de nuevo colaborador en ${nuevoColaborador.department} (${nuevoColaborador.location}).`,
      previousValue: 'Nuevo Ingreso',
      newValue: `${nuevoColaborador.position} · RFC ${nuevoColaborador.rfc}`,
      severity: dupCheck.isHomonym ? 'sensible' : 'normal'
    });

    // 4. Mostrar Toast "¡Guardado!" en verde por 2.8s y reiniciar formulario para nueva captura
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
      {/* ========================================================= */}
      {/* TOAST NOTIFICATION FLOTANTE (MICROCOPY 1 A 3 PALABRAS)     */}
      {/* ========================================================= */}
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
      {/* 1. ENCABEZADO SUPERIOR & BREADCRUMBS                     */}
      {/* ========================================================= */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Recursos Humanos</span> <span style={{ margin: '0 4px' }}>/</span> <strong style={{ color: 'var(--text-secondary)' }}>Alta de Empleado</strong>
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
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Alta de Empleado
              </h1>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Registro de personal y asignación técnica de cuadrilla operativa
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleLimpiar}
              className="btn btn-secondary"
              style={{ fontSize: '12.5px' }}
            >
              Cancelar / Limpiar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}
              title="Guardar Colaborador (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Empleado</span>
              <span style={{ fontSize: '10.5px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '4px', marginLeft: '2px' }}>
                Ctrl+S
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BARRA DE PROGRESO / WIZARD STEPS                       */}
      {/* ========================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Progreso de Captura:</span>
            <strong style={{ color: completedCount === 5 ? 'var(--success-text)' : 'var(--primary)', transition: 'color var(--transition-fast)' }}>
              {completedCount} de 5 secciones completadas ({Math.round((completedCount / 5) * 100)}%)
            </strong>
          </div>
          <div style={{ width: '140px', height: '6px', backgroundColor: 'var(--surface-alt)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div
              style={{
                width: `${(completedCount / 5) * 100}%`,
                height: '100%',
                backgroundColor: completedCount === 5 ? 'var(--success)' : 'var(--primary)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease'
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '8px',
            padding: '6px',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}
        >
          {steps.map((step) => {
            const isActive = activeSectionId === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => scrollToSection(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: step.isDone
                    ? '1px solid var(--success-border)'
                    : isActive
                    ? '1.5px solid var(--primary)'
                    : '1px solid var(--border)',
                  backgroundColor: step.isDone
                    ? 'var(--success-bg)'
                    : isActive
                    ? 'var(--brand-50)'
                    : 'var(--surface)',
                  color: step.isDone
                    ? 'var(--success-text)'
                    : isActive
                    ? 'var(--primary)'
                    : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: step.isDone || isActive ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {step.isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success-text)', flexShrink: 0 }} />
                ) : isActive ? (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)', flexShrink: 0 }} />
                ) : (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border)', flexShrink: 0 }} />
                )}
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 1: DATOS LABORALES                                */}
      {/* ========================================================= */}
      <div id="section1" className="card" onFocusCapture={() => setActiveSectionId('section1')} style={{ borderRadius: '12px', overflow: 'visible' }}>
        <div
          onClick={() => toggleSection('section1')}
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface-alt)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomLeftRadius: openSections.section1 ? '0' : '12px',
            borderBottomRightRadius: openSections.section1 ? '0' : '12px',
            borderBottom: openSections.section1 ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {openSections.section1 ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              1. DATOS LABORALES
            </h3>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: isSection1Done ? 'var(--success-bg)' : 'var(--brand-50)',
              color: isSection1Done ? 'var(--success-text)' : 'var(--primary)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: isSection1Done ? '1px solid var(--success-border)' : '1px solid var(--brand-200)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSection1Done ? '✓ COMPLETADO' : 'CONDICIONES DE CONTRATACIÓN'}
          </span>
        </div>

        {openSections.section1 && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Empresa / Subsidiaria */}
              <CustomSelect
                label="Empresa Contratante"
                required
                value={subsidiary}
                onChange={setSubsidiary}
                options={[
                  { value: 'SIFYGSA S.A. de C.V.', label: 'SIFYGSA S.A. de C.V.' },
                  { value: 'VIPSA S.A. de C.V.', label: 'VIPSA S.A. de C.V.' }
                ]}
                onKeyDown={handleInputKeyDown}
              />

              {/* Departamento Asignado */}
              <CustomSelect
                label="Departamento Asignado"
                required
                value={deptTecnico}
                onChange={(val) => {
                  setErrorField((prev) => (prev === 'deptTecnico' ? null : prev));
                  setDeptTecnico(val);
                }}
                options={availableDepartments.map((d) => ({ value: d, label: d }))}
                onKeyDown={handleInputKeyDown}
                hasError={errorField === 'deptTecnico'}
              />

              {/* Base de Trabajo */}
              <CustomSelect
                label="Base de Trabajo"
                value={baseDespliegue}
                onChange={setBaseDespliegue}
                options={[
                  { value: 'Minatitlán, Ver. (Almacén Principal)', label: 'Minatitlán, Ver. (Almacén Principal)' },
                  { value: 'Base Mapachapa Km 18 (Minatitlán, Ver.)', label: 'Base Mapachapa Km 18 (Minatitlán, Ver.)' },
                  { value: 'Comalcalco, Tab. (Base Operativa)', label: 'Comalcalco, Tab. (Base Operativa)' },
                  { value: 'Xalapa, Ver. (Corporativo Regional)', label: 'Xalapa, Ver. (Corporativo Regional)' },
                  { value: 'Ciudad del Carmen, Camp. (Base Marina)', label: 'Ciudad del Carmen, Camp. (Base Marina)' }
                ]}
                onKeyDown={handleInputKeyDown}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Tipo de Contrato */}
              <CustomSelect
                label="Tipo de Contrato"
                required
                value={tipoContrato}
                onChange={setTipoContrato}
                options={[
                  { value: 'Tiempo Indeterminado (Planta)', label: 'Tiempo Indeterminado (Planta)' },
                  { value: 'Determinado por Obra', label: 'Determinado por Obra' },
                  { value: 'Eventual de Guardia', label: 'Eventual de Guardia' }
                ]}
                onKeyDown={handleInputKeyDown}
              />

              {/* Sueldo Mensual Bruto con formateo en tiempo real */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Sueldo Mensual Bruto (MXN) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    $
                  </span>
                  <input
                    ref={firstInputRef}
                    data-field="salarioBruto"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={salarioBruto}
                    onChange={handleSalarioChange}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('salarioBruto', { paddingLeft: '26px', width: '100%', fontWeight: 700 })}
                    required
                  />
                </div>
              </div>

              {/* Proyecto Asignado */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Proyecto Asignado
                </label>
                <input
                  type="text"
                  placeholder="Ej. Servicio de Mantenimiento Integral F&G"
                  value={proyectoAsignado}
                  onChange={handleCleanTextChange(setProyectoAsignado, 'proyectoAsignado', 90)}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 2: DATOS PERSONALES                               */}
      {/* ========================================================= */}
      <div id="section2" className="card" onFocusCapture={() => setActiveSectionId('section2')} style={{ borderRadius: '12px', overflow: 'visible' }}>
        <div
          onClick={() => toggleSection('section2')}
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface-alt)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomLeftRadius: openSections.section2 ? '0' : '12px',
            borderBottomRightRadius: openSections.section2 ? '0' : '12px',
            borderBottom: openSections.section2 ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {openSections.section2 ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              2. DATOS PERSONALES
            </h3>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: isSection2Done ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: isSection2Done ? 'var(--success-text)' : 'var(--danger-text)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: isSection2Done ? '1px solid var(--success-border)' : '1px solid var(--danger-border)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSection2Done ? '✓ COMPLETADO' : 'INFORMACIÓN OBLIGATORIA'}
          </span>
        </div>

        {openSections.section2 && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            {/* Formulario Izquierdo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <CustomSelect
                  label="Perfil de Puesto"
                  required
                  value={formularioPersonalizado}
                  onChange={setFormularioPersonalizado}
                  options={[
                    { value: 'SFG - Empleado Técnico', label: 'SFG - Empleado Técnico' },
                    { value: 'SFG - Personal Administrativo', label: 'SFG - Personal Administrativo' }
                  ]}
                  onKeyDown={handleInputKeyDown}
                />

                <CustomSelect
                  label="Plantilla Especializada"
                  value={plantillaPuesto}
                  onChange={setPlantillaPuesto}
                  options={[
                    { value: 'Plantilla Especialista Fire & Gas SIL-3', label: 'Plantilla Especialista Fire & Gas SIL-3' },
                    { value: 'Plantilla Instrumentación y Control', label: 'Plantilla Instrumentación y Control' },
                    { value: 'Plantilla Supervisión HSE', label: 'Plantilla Supervisión HSE' }
                  ]}
                  onKeyDown={handleInputKeyDown}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
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
                        backgroundColor: isAutoFolio ? 'var(--surface-alt)' : 'var(--surface)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
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
                  <input
                    data-field="puestoOficial"
                    type="text"
                    placeholder="Ej. Técnico Especialista en F&G"
                    value={puestoOficial}
                    onChange={handleCleanTextChange(setPuestoOficial, 'puestoOficial', 70)}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('puestoOficial', { paddingLeft: '10px', width: '100%' })}
                    required
                  />
                </div>
              </div>

              {/* Nombre Secuencial */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Nombre(s) y Apellidos (Captura Secuencial) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <input
                      data-field="nombrePila"
                      type="text"
                      placeholder="Nombre de pila"
                      value={nombrePila}
                      onChange={handlePersonNameChange(setNombrePila, 'nombrePila')}
                      onKeyDown={handleInputKeyDown}
                      className="input-text"
                      style={getFieldStyle('nombrePila', { paddingLeft: '10px', width: '100%' })}
                      required
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nombre de pila</span>
                  </div>
                  <div>
                    <input
                      data-field="apellidoPaterno"
                      type="text"
                      placeholder="Apellido Paterno"
                      value={apellidoPaterno}
                      onChange={handlePersonNameChange(setApellidoPaterno, 'apellidoPaterno')}
                      onKeyDown={handleInputKeyDown}
                      className="input-text"
                      style={getFieldStyle('apellidoPaterno', { paddingLeft: '10px', width: '100%' })}
                      required
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Apellido Paterno</span>
                  </div>
                  <div>
                    <input
                      data-field="apellidoMaterno"
                      type="text"
                      placeholder="Apellido Materno"
                      value={apellidoMaterno}
                      onChange={handlePersonNameChange(setApellidoMaterno, 'apellidoMaterno')}
                      onKeyDown={handleInputKeyDown}
                      className="input-text"
                      style={getFieldStyle('apellidoMaterno', { paddingLeft: '10px', width: '100%' })}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Apellido Materno</span>
                  </div>
                </div>
              </div>

              {/* Identificadores Fiscales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    RFC Oficial <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="rfc"
                    type="text"
                    placeholder="13 caracteres (Ej. HEVC8809241H2)"
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
                    CURP Oficial <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="curp"
                    type="text"
                    placeholder="18 caracteres (Ej. HEVC880924HDFRRN09)"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Nº Seguridad Social (NSS) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="nss"
                    type="text"
                    inputMode="numeric"
                    placeholder="11 dígitos (Ej. 34-12-88-9412-1)"
                    value={nss}
                    onChange={handleNssChange}
                    onKeyDown={handleInputKeyDown}
                    maxLength={15}
                    className="input-text"
                    style={getFieldStyle('nss', { paddingLeft: '10px', width: '100%', fontFamily: 'var(--font-mono)' })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Supervisor Inmediato
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ing. Roberto Martínez Alor"
                    value={supervisor}
                    onChange={handlePersonNameChange(setSupervisor, 'supervisor')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ paddingLeft: '10px', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Zona Derecha: Fotografía Oficial */}
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
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Fotografía para Credencial
              </h4>

              <div
                style={{
                  border: '2px dashed var(--brand-300)',
                  backgroundColor: 'rgba(59, 130, 246, 0.03)',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  minHeight: '190px'
                }}
              >
                {fotoPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={fotoPreview}
                      alt="Credencial"
                      style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--primary)' }}
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
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--brand-50)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Arrastre fotografía credencial o presione Tab
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Formatos JPG, PNG máx. 5MB (Para Carnet SIL-3)
                    </div>
                    <label
                      className="btn btn-secondary"
                      style={{ fontSize: '11.5px', marginTop: '4px', cursor: 'pointer', padding: '6px 14px' }}
                    >
                      Examinar equipo
                      <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} />
                    </label>
                  </>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Notas de Contratación
                  </label>
                  <button
                    type="button"
                    onClick={() => setNotasContratacion('')}
                    style={{ fontSize: '10px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Limpiar
                  </button>
                </div>
                <textarea
                  value={notasContratacion}
                  onChange={(e) => setNotasContratacion(e.target.value)}
                  placeholder="Observaciones de ingreso, aptitudes técnicas..."
                  rows={3}
                  className="input-text"
                  style={{ width: '100%', fontSize: '11.5px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 3: CONTACTO Y DOMICILIO                           */}
      {/* ========================================================= */}
      <div id="section3" className="card" onFocusCapture={() => setActiveSectionId('section3')} style={{ borderRadius: '12px', overflow: 'visible' }}>
        <div
          onClick={() => toggleSection('section3')}
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface-alt)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomLeftRadius: openSections.section3 ? '0' : '12px',
            borderBottomRightRadius: openSections.section3 ? '0' : '12px',
            borderBottom: openSections.section3 ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {openSections.section3 ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              3. CONTACTO Y DOMICILIO
            </h3>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: isSection3Done ? 'var(--success-bg)' : 'var(--brand-50)',
              color: isSection3Done ? 'var(--success-text)' : 'var(--primary)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: isSection3Done ? '1px solid var(--success-border)' : '1px solid var(--brand-200)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSection3Done ? '✓ COMPLETADO' : 'COMUNICACIÓN Y RESIDENCIA'}
          </span>
        </div>

        {openSections.section3 && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Teléfono Móvil <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    data-field="telMovil"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10 dígitos (Ej. 922-145-8890)"
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
                    Correo Institucional <span style={{ color: 'var(--danger)' }}>*</span>
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
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Correo Personal
                  </label>
                  <input
                    data-field="emailPersonal"
                    type="email"
                    placeholder="personal@gmail.com"
                    value={emailPersonal}
                    onChange={(e) => {
                      setErrorField((prev) => (prev === 'emailPersonal' ? null : prev));
                      setEmailPersonal(e.target.value.replace(/\s/g, '').toLowerCase());
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={getFieldStyle('emailPersonal', { paddingLeft: '10px', width: '100%' })}
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

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Extensión Telefónica
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 108"
                  value={extOficina}
                  onChange={handleExtChange}
                  onKeyDown={handleInputKeyDown}
                  maxLength={5}
                  className="input-text"
                  style={{ paddingLeft: '10px', width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* Panel de Dirección */}
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
                  Dirección Particular <span style={{ color: 'var(--danger)' }}>*</span>
                </h4>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion || 'Minatitlán, Veracruz')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                    fontWeight: 700
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ver en Mapa</span>
                </a>
              </div>

              <textarea
                data-field="direccion"
                value={direccion}
                onChange={(e) => {
                  setErrorField((prev) => (prev === 'direccion' ? null : prev));
                  setDireccion(e.target.value);
                }}
                placeholder="Calle, número, colonia, C.P., municipio y estado..."
                rows={4}
                className="input-text"
                style={getFieldStyle('direccion', { width: '100%', fontSize: '11.5px', resize: 'vertical' })}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Building2 className="w-3.5 h-3.5 text-muted" />
                  <span>Sede Operativa Base:</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  17.9942° N, 94.5441° W
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 4: SALUD Y SEGURIDAD                              */}
      {/* ========================================================= */}
      <div id="section4" className="card" onFocusCapture={() => setActiveSectionId('section4')} style={{ borderRadius: '12px', overflow: 'visible' }}>
        <div
          onClick={() => toggleSection('section4')}
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface-alt)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomLeftRadius: openSections.section4 ? '0' : '12px',
            borderBottomRightRadius: openSections.section4 ? '0' : '12px',
            borderBottom: openSections.section4 ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {openSections.section4 ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              4. SALUD Y SEGURIDAD
            </h3>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: isSection4Done ? 'var(--success-bg)' : 'var(--brand-50)',
              color: isSection4Done ? 'var(--success-text)' : 'var(--primary)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: isSection4Done ? '1px solid var(--success-border)' : '1px solid var(--brand-200)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSection4Done ? '✓ COMPLETADO' : 'PROTECCIÓN Y MÉDICO'}
          </span>
        </div>

        {openSections.section4 && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Talla de Calzado (MEX)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej. 28.0"
                  value={calzado}
                  onChange={handleShoeSizeChange}
                  onKeyDown={handleInputKeyDown}
                  maxLength={4}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Talla de Overol
                </label>
                <input
                  type="text"
                  placeholder="Ej. Talla 42 / L - Industrial"
                  value={overol}
                  onChange={handleCleanTextChange(setOverol, 'overol', 40)}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <CustomSelect
                label="Tipo de Sangre"
                required
                value={tipoSangre}
                onChange={setTipoSangre}
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
                onKeyDown={handleInputKeyDown}
              />

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Equipo de Respiración
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mascarilla Full Face Serie 6800"
                  value={respirador}
                  onChange={handleCleanTextChange(setRespirador, 'respirador', 60)}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  Alergias o Condiciones Médicas
                </label>
                <input
                  type="text"
                  placeholder="Padecimientos, alergias a medicamentos, o 'Ninguna'..."
                  value={alergias}
                  onChange={handleCleanTextChange(setAlergias, 'alergias', 120)}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  marginTop: '18px'
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-success" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#047857' }}>
                  Apto para Espacios Confinados & Alturas
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 5: NÓMINA Y BANCO                                 */}
      {/* ========================================================= */}
      <div id="section5" className="card" onFocusCapture={() => setActiveSectionId('section5')} style={{ borderRadius: '12px', overflow: 'visible' }}>
        <div
          onClick={() => toggleSection('section5')}
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface-alt)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomLeftRadius: openSections.section5 ? '0' : '12px',
            borderBottomRightRadius: openSections.section5 ? '0' : '12px',
            borderBottom: openSections.section5 ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {openSections.section5 ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              5. NÓMINA Y BANCO
            </h3>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: isSection5Done ? 'var(--success-bg)' : 'var(--brand-50)',
              color: isSection5Done ? 'var(--success-text)' : 'var(--primary)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: isSection5Done ? '1px solid var(--success-border)' : '1px solid var(--brand-200)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSection5Done ? '✓ COMPLETADO' : 'DISPERSIÓN SPEI'}
          </span>
        </div>

        {openSections.section5 && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Contacto de Emergencia */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Contacto de Emergencia
                </h4>
                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px' }}>
                  Prioridad Alta
                </span>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Nombre del Contacto
                </label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={contactoEmergenciaNombre}
                  onChange={handlePersonNameChange(setContactoEmergenciaNombre, 'contactoEmergenciaNombre')}
                  onKeyDown={handleInputKeyDown}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Parentesco
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cónyuge"
                    value={contactoEmergenciaParentesco}
                    onChange={handlePersonNameChange(setContactoEmergenciaParentesco, 'contactoEmergenciaParentesco')}
                    onKeyDown={handleInputKeyDown}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Teléfono Móvil
                  </label>
                  <input
                    data-field="contactoEmergenciaTel"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10 dígitos (922-000-0000)"
                    value={contactoEmergenciaTel}
                    onChange={handlePhoneChange(setContactoEmergenciaTel, 'contactoEmergenciaTel')}
                    onKeyDown={handleInputKeyDown}
                    maxLength={12}
                    className="input-text"
                    style={getFieldStyle('contactoEmergenciaTel', { width: '100%', fontFamily: 'var(--font-mono)' })}
                  />
                </div>
              </div>
            </div>

            {/* Datos Bancarios SPEI */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Dispersión SPEI
                </h4>
                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: '4px' }}>
                  Validada
                </span>
              </div>

              <CustomSelect
                label="Institución Bancaria"
                required
                value={banco}
                onChange={setBanco}
                options={[
                  { value: 'BBVA México (Bancomer)', label: 'BBVA México (Bancomer)' },
                  { value: 'Citibanamex', label: 'Citibanamex' },
                  { value: 'Santander México', label: 'Santander México' },
                  { value: 'Banorte', label: 'Banorte' },
                  { value: 'HSBC México', label: 'HSBC México' },
                  { value: 'Scotiabank', label: 'Scotiabank' }
                ]}
                onKeyDown={handleInputKeyDown}
              />

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  CLABE Interbancaria (18 Dígitos) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  data-field="clabe"
                  type="text"
                  inputMode="numeric"
                  placeholder="0121-8000-1234-5678-90"
                  value={clabe}
                  onChange={handleClabeChange}
                  onKeyDown={handleInputKeyDown}
                  maxLength={22}
                  className="input-text"
                  style={getFieldStyle('clabe', { width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 600 })}
                  required
                />
              </div>
            </div>

            {/* Competencias Técnicas y Seguridad */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Acreditaciones Técnicas</span>
                </h4>
                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--brand-50)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>
                  Técnico Acreditado
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Signatario de Seguridad STPS:</span>
                  <strong style={{ color: '#047857' }}>VIGENTE (2027)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rig Pass / Libreta de Mar:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>A-49201-MX</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Certificación TÜV SIL-3:</span>
                  <strong style={{ color: 'var(--primary)' }}>SIL-3 Safety</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. FOOTER DE ACCIONES INFERIOR                            */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
          >
            <Save className="w-4 h-4" />
            <span>Guardar Empleado</span>
            <span style={{ fontSize: '10.5px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '4px' }}>
              Ctrl+S
            </span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancelar / Volver
          </button>
        </div>

        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
          <span>Campos marcados con <strong style={{ color: 'var(--danger)' }}>*</strong> son obligatorios para cumplimiento normativo interno.</span>
        </div>
      </div>
    </form>
  );
};
