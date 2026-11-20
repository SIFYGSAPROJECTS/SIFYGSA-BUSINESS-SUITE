'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Check,
  CheckCircle2,
  Plus,
  Search,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  FolderCheck,
  Eye,
  X,
  UserPlus,
  Trash2,
  Download
} from 'lucide-react';
import { Employee, EmployeeDocumentItem } from '../../types';
import { INITIAL_DEPARTMENTS, EMPLOYEES } from '../../data/mockData';
import {
  useSyncedEmployees,
  useSyncedDepartments,
  savePersistedEmployees,
  formatCurrencyMask,
  logHrAuditAction,
  downloadCsvFile
} from '../../utils/formShield';

export interface SgiFormatsViewProps {
  employees: Employee[];
  onOpenNewEmployee?: () => void;
}

type ProcessTab = 'RH-01' | 'RH-13-08' | 'RH-02' | 'RH-15';

// ============================================================================
// 1. TIPOS DE PROCESOS DIGITALES SGI
// ============================================================================

export interface StaffRequisitionRecord {
  id: string;
  folio: string;
  elaborationDate: string;
  applicantName: string;
  department: string;
  positionRequested: string;
  requiredDate: string;
  maritalStatus: string;
  gender: string;
  ageRange: string;
  workSchedule: string;
  proposedSalary: string;
  academicFormation: string;
  basicTraining: string;
  experienceTime: string;
  knowledge: string;
  skills: string;
  language: string;
  justification: string;
  reqInfrastructure: boolean;
  reqHse: boolean;
  reqOther: boolean;
  reqOtherDetail: string;
  status: 'En Revisión RRHH' | 'Autorizada Dirección' | 'Plaza Cubierta';
}

export interface TrainingRequestRecord {
  id: string;
  folio: string;
  elaborationDate: string;
  trainingType: 'Interna' | 'Externa';
  contractNumber: string;
  applicantName: string;
  targetPositions: string;
  participantIds: string[];
  participantNames: string[];
  objectives: string;
  topics: string;
  requiredDates: string;
  trainingNeeds: string;
  trainingCenter: string;
  placeAndSchedule: string;
  estimatedCost: string;
  obtainedDocuments: string;
  extraRequirements: string;
  observations: string;
  status: 'Solicitada' | 'Vo.Bo. RRHH' | 'Autorizada Dirección' | 'Impartida y Acreditada';
  creditedToFiles?: boolean;
}

export interface DossierChecklistState {
  employeeId: string;
  mode: 'general' | 'becario';
  items: Record<string, boolean>;
  // Campos exclusivos SGI-FR-RH-08 (Becarios)
  schoolName?: string;
  enrollmentNumber?: string;
  majorSpecialty?: string;
  generation?: string;
  gpaAverage?: string;
  internalAdvisor?: string;
  workSchedule?: string;
  monthlySupport?: string;
  endDate?: string;
  updatedAt: string;
}

export interface NoDebtAreaCheck {
  areaId: number;
  department: string;
  responsible: string;
  hasDebt: boolean;
  cleared: boolean;
  notes?: string;
}

export interface NoDebtChargeItem {
  id: string;
  department: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
}

export interface NoDebtClearanceRecord {
  id: string;
  folio: string;
  elaborationDate: string;
  employeeId: string;
  employeeName: string;
  categoryPosition: string;
  contractType: string;
  department: string;
  immediateBoss: string;
  terminationDate: string;
  terminationReason: string;
  areaChecks: NoDebtAreaCheck[];
  debtItems: NoDebtChargeItem[];
  status: 'En Liberación' | 'Liberado Sin Adeudo' | 'Liberado Con Descuento';
  appliedInactiveInCatalog?: boolean;
}

// ============================================================================
// 2. CATÁLOGOS OFICIALES BASADOS EN LOS DOCUMENTOS DE SIFYGSA
// ============================================================================

const STORAGE_KEY_RH01 = 'sifygsa_rrhh_sgi_rh01_v2';
const STORAGE_KEY_RH02 = 'sifygsa_rrhh_sgi_rh02_v2';
const STORAGE_KEY_DOSSIER = 'sifygsa_rrhh_sgi_dossier_v2';
const STORAGE_KEY_RH15 = 'sifygsa_rrhh_sgi_rh15_v2';

export const RH13_GENERAL_DOCUMENTS: { key: string; label: string }[] = [
  { key: 'cv_solicitud', label: 'Solicitud de empleo y Currículum Vitae' },
  { key: 'afiliacion_imss', label: 'Hoja de afiliación al Seguro Social (NSS)' },
  { key: 'acta_nacimiento', label: 'Acta de nacimiento' },
  { key: 'comprobante_estudios', label: 'Comprobante de estudios' },
  { key: 'ine_ife', label: 'Identificación oficial vigente (INE / IFE)' },
  { key: 'cedula_profesional', label: 'Cédula profesional' },
  { key: 'curp_doc', label: 'Clave Única de Registro de Población (CURP)' },
  { key: 'carta_recomendacion', label: 'Carta de recomendación' },
  { key: 'csf_sat', label: 'Constancia de Situación Fiscal (CSF)' },
  { key: 'carta_infonavit', label: 'Carta de retención INFONAVIT (si aplica)' },
  { key: 'comprobante_domicilio', label: 'Comprobante de domicilio vigente' },
  { key: 'libreta_mar', label: 'Libreta de Mar (personal costa afuera)' },
  { key: 'foto_digital', label: 'Fotografía digital para credencial' },
  { key: 'licencia_conducir', label: 'Licencia para conducir vigente' }
];

export const RH08_INTERN_DOCUMENTS: { key: string; label: string }[] = [
  { key: 'cv_becario', label: 'Currículum Vitae actualizado' },
  { key: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
  { key: 'acta_nacimiento', label: 'Acta de nacimiento' },
  { key: 'afiliacion_imss', label: 'Hoja de afiliación al Seguro Social / Seguro Facultativo' },
  { key: 'ine_credencial', label: 'Credencial de elector (INE)' },
  { key: 'constancia_promedio', label: 'Constancia de estudios / promedio emitida por la escuela' },
  { key: 'curp_doc', label: 'CURP actualizado' },
  { key: 'foto_digital', label: 'Fotografía digital' }
];

export const RH15_OFFICIAL_AREAS: { areaId: number; department: string; defaultRole: string; deptMatch: string }[] = [
  { areaId: 1, department: 'ALMACÉN', defaultRole: 'Responsable de Almacén', deptMatch: 'Almacén' },
  { areaId: 2, department: 'COMPRAS', defaultRole: 'Lic. Marlem Campos García', deptMatch: 'Compras' },
  { areaId: 3, department: 'SERVICIOS', defaultRole: 'Ing. Emmanuel Mendoza Ramírez', deptMatch: 'Servicios' },
  { areaId: 4, department: 'INGENIERÍA', defaultRole: 'Ing. Miguel Guzmán Reyes', deptMatch: 'Ingeniería' },
  { areaId: 5, department: 'HSE', defaultRole: 'Ing. Carlos Enrique Cossío Ruiz', deptMatch: 'HSE' },
  { areaId: 6, department: 'INFRAESTRUCTURA', defaultRole: 'Ing. Pablo Vázquez Culebro', deptMatch: 'Infraestructura' },
  { areaId: 7, department: 'CALIDAD', defaultRole: 'Gerente de Calidad / SGI', deptMatch: 'Calidad' },
  { areaId: 8, department: 'RECURSOS HUMANOS', defaultRole: 'Lic. Valeria Méndez Albores', deptMatch: 'Recursos Humanos' },
  { areaId: 9, department: 'ADMINISTRACIÓN', defaultRole: 'Lic. Daniela C. & Lic. Lorena H.', deptMatch: 'Administración' }
];

const INITIAL_REQUISITIONS: StaffRequisitionRecord[] = [
  {
    id: 'req-001',
    folio: 'SGI-RH01-2026-001',
    elaborationDate: '04/11/2026',
    applicantName: 'Ing. Miguel Guzmán Reyes',
    department: 'Ingeniería',
    positionRequested: 'Ingeniero Especialista en Sistemas Fire & Gas',
    requiredDate: '20/11/2026',
    maritalStatus: 'Indistinto',
    gender: 'Indistinto',
    ageRange: '25 a 42 años',
    workSchedule: 'Lunes a Viernes 08:00 a 18:00 hrs / Sábado 08:00 a 13:00 hrs',
    proposedSalary: '24,000.00',
    academicFormation: 'Ingeniería Electrónica, Instrumentación, Mecatrónica o afín',
    basicTraining: 'Curso básico de seguridad industrial, Rig Pass y manejo de detectores F&G',
    experienceTime: '2 años en mantenimiento o puesta en marcha de sistemas de detección',
    knowledge: 'Protocolos HART, Modbus, paneles de control Fire & Gas y lectura de DTI',
    skills: 'Diagnóstico en campo, trabajo en equipo, redacción de reportes técnicos',
    language: 'Inglés técnico (lectura de manuales)',
    justification: 'Incremento de actividades operativas por arranque de frente de mantenimiento en activo regional.',
    reqInfrastructure: true,
    reqHse: true,
    reqOther: false,
    reqOtherDetail: '',
    status: 'Autorizada Dirección'
  },
  {
    id: 'req-002',
    folio: 'SGI-RH01-2026-002',
    elaborationDate: '10/11/2026',
    applicantName: 'Ing. Pablo Vázquez Culebro',
    department: 'Infraestructura',
    positionRequested: 'Becario de Desarrollo y Soporte TI',
    requiredDate: '25/11/2026',
    maritalStatus: 'Indistinto',
    gender: 'Indistinto',
    ageRange: '20 a 25 años',
    workSchedule: 'Lunes a Viernes 08:00 a 14:00 hrs',
    proposedSalary: '4,500.00',
    academicFormation: 'Estudiante activo de Ing. en Sistemas Computacionales / TICS',
    basicTraining: 'Desarrollo web moderno, bases de datos relacionales y soporte técnico',
    experienceTime: 'Residencia profesional / Prácticas',
    knowledge: 'TypeScript, React / Next.js, PostgreSQL y redes LAN',
    skills: 'Orden, proactividad, análisis de procesos y documentación',
    language: 'Inglés básico',
    justification: 'Apoyo en digitalización de módulos internos de la suite empresarial SIFYGSA.',
    reqInfrastructure: true,
    reqHse: false,
    reqOther: false,
    reqOtherDetail: '',
    status: 'En Revisión RRHH'
  }
];

const INITIAL_TRAININGS: TrainingRequestRecord[] = [
  {
    id: 'cap-001',
    folio: 'SGI-RH02-2026-001',
    elaborationDate: '05/11/2026',
    trainingType: 'Externa',
    contractNumber: 'CT-SIFYGSA-2026-04',
    applicantName: 'Ing. Carlos Enrique Cossío Ruiz',
    targetPositions: 'Técnicos Especialistas F&G e Ingenieros de Campo',
    participantIds: ['EMP-2026-001', 'EMP-2026-002'],
    participantNames: ['Ing. Roberto Méndez Cruz', 'Téc. Marco Antonio Silva'],
    objectives: 'Acreditar al personal técnico en seguridad para trabajos en espacios confinados y atmósfera peligrosa.',
    topics: '1. Normativa NOM-033-STPS · 2. Monitoreo de gases · 3. Rescate y procedimientos de emergencia.',
    requiredDates: '18 y 19 de Noviembre 2026',
    trainingNeeds: 'Requerimiento normativo STPS y requisito de ingreso a instalaciones del cliente.',
    trainingCenter: 'ICIC / Centro Capacitador Certificado STPS',
    placeAndSchedule: 'Sala de Capacitación Minatitlán · 08:00 a 16:00 hrs (16 horas)',
    estimatedCost: '8,500.00',
    obtainedDocuments: 'Constancia de Competencias Laborales DC-3 (STPS) y Credencial de Acreditación',
    extraRequirements: 'Sala de juntas climatizada, proyector HDMI, pintarrón y equipo detector portátil para práctica.',
    observations: 'El personal participante ya cuenta con examen médico vigente.',
    status: 'Autorizada Dirección',
    creditedToFiles: false
  }
];

let sgiSeq = 100;
function nextLocalId(prefix: string): string {
  sgiSeq += 1;
  return `${prefix}-${sgiSeq}`;
}

function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function computeNextFolio(prefix: string, existingFolios: string[]): string {
  let maxNum = 0;
  for (const f of existingFolios) {
    const match = f.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

function buildAutoDetectedDossierItems(emp: Employee, mode: 'general' | 'becario'): Record<string, boolean> {
  const hasRfc = Boolean(emp.rfc && emp.rfc.trim().length >= 10);
  const hasCurp = Boolean(emp.curp && emp.curp.trim().length >= 16);
  const hasNss = Boolean(emp.nss && emp.nss.trim().length >= 10);
  const hasPhoto = Boolean(emp.photoUrl);
  const hasAddress = Boolean(emp.addressStreet || emp.address);
  const hasCsf = emp.taxCertificateStatus === 'Vigente' || Boolean(emp.taxCertificateFileUrl);
  const docs = emp.documents || [];
  const hasIneDoc = docs.some((d) => d.category.toLowerCase().includes('ine') || d.title.toLowerCase().includes('ine'));
  const hasCedulaDoc = docs.some((d) => d.category.toLowerCase().includes('cédula') || d.category.toLowerCase().includes('titulo'));
  const hasRecDoc = docs.some((d) => d.category.toLowerCase().includes('recomendación'));

  if (mode === 'becario') {
    return {
      cv_becario: true,
      comprobante_domicilio: hasAddress,
      acta_nacimiento: true,
      afiliacion_imss: hasNss,
      ine_credencial: hasIneDoc || hasCurp,
      constancia_promedio: false,
      curp_doc: hasCurp,
      foto_digital: hasPhoto
    };
  }

  return {
    cv_solicitud: true,
    afiliacion_imss: hasNss,
    acta_nacimiento: true,
    comprobante_estudios: true,
    ine_ife: hasIneDoc || hasCurp,
    cedula_profesional: hasCedulaDoc,
    curp_doc: hasCurp,
    carta_recomendacion: hasRecDoc,
    csf_sat: hasCsf || hasRfc,
    carta_infonavit: false,
    comprobante_domicilio: hasAddress,
    libreta_mar: false,
    foto_digital: hasPhoto,
    licencia_conducir: false
  };
}

export const SgiFormatsView: React.FC<SgiFormatsViewProps> = ({
  employees: initialEmployees,
  onOpenNewEmployee
}) => {
  const employees = useSyncedEmployees(initialEmployees.length > 0 ? initialEmployees : EMPLOYEES);
  const departments = useSyncedDepartments(INITIAL_DEPARTMENTS);

  const [activeTab, setActiveTab] = useState<ProcessTab>('RH-01');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Estados principales de los 4 procesos
  const [requisitions, setRequisitions] = useState<StaffRequisitionRecord[]>(INITIAL_REQUISITIONS);
  const [trainings, setTrainings] = useState<TrainingRequestRecord[]>(INITIAL_TRAININGS);
  const [dossierMap, setDossierMap] = useState<Record<string, DossierChecklistState>>({});
  const [clearances, setClearances] = useState<NoDebtClearanceRecord[]>([]);

  // Modal de vista previa oficial imprimible SGI
  const [previewDoc, setPreviewDoc] = useState<{
    code: 'SGI-FR-RH-01' | 'SGI-FR-RH-02' | 'SGI-FR-RH-08' | 'SGI-FR-RH-13' | 'SGI-FR-RH-15';
    title: string;
    revision: string;
    dateLabel: string;
    payload:
      | { kind: 'RH-01'; data: StaffRequisitionRecord }
      | { kind: 'RH-02'; data: TrainingRequestRecord }
      | { kind: 'DOSSIER'; employee: Employee; state: DossierChecklistState }
      | { kind: 'RH-15'; data: NoDebtClearanceRecord };
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3200);
  };

  // Hidratación diferida segura para SSR
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedRh01 = window.localStorage.getItem(STORAGE_KEY_RH01);
        if (savedRh01) setRequisitions(JSON.parse(savedRh01));

        const savedRh02 = window.localStorage.getItem(STORAGE_KEY_RH02);
        if (savedRh02) setTrainings(JSON.parse(savedRh02));

        const savedDossier = window.localStorage.getItem(STORAGE_KEY_DOSSIER);
        if (savedDossier) setDossierMap(JSON.parse(savedDossier));

        const savedRh15 = window.localStorage.getItem(STORAGE_KEY_RH15);
        if (savedRh15) setClearances(JSON.parse(savedRh15));
      } catch {
        // Usar valores iniciales
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY_RH01, JSON.stringify(requisitions));
    } catch {
      // ignore
    }
  }, [requisitions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY_RH02, JSON.stringify(trainings));
    } catch {
      // ignore
    }
  }, [trainings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY_DOSSIER, JSON.stringify(dossierMap));
    } catch {
      // ignore
    }
  }, [dossierMap, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY_RH15, JSON.stringify(clearances));
    } catch {
      // ignore
    }
  }, [clearances, hydrated]);

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status === 'active'),
    [departments]
  );

  // ==========================================================================
  // PROCESO 1: SOLICITUD DE PERSONAL / VACANTES (SGI-FR-RH-01)
  // ==========================================================================
  const [showNewReqForm, setShowNewReqForm] = useState(false);
  const [reqDept, setReqDept] = useState('Ingeniería');
  const [reqApplicant, setReqApplicant] = useState('Ing. Miguel Guzmán Reyes');
  const [reqPosition, setReqPosition] = useState('');
  const [reqRequiredDate, setReqRequiredDate] = useState('25/11/2026');
  const [reqMarital, setReqMarital] = useState('Indistinto');
  const [reqGender, setReqGender] = useState('Indistinto');
  const [reqAge, setReqAge] = useState('22 a 45 años');
  const [reqSchedule, setReqSchedule] = useState('Lunes a Viernes 08:00 a 18:00 hrs / Sábado 08:00 a 13:00 hrs');
  const [reqSalary, setReqSalary] = useState('');
  const [reqAcademic, setReqAcademic] = useState('Ingeniería o Carrera Técnica afín');
  const [reqBasicTraining, setReqBasicTraining] = useState('Seguridad Industrial básica / Normativa STPS');
  const [reqExperience, setReqExperience] = useState('1 a 2 años en puesto similar');
  const [reqKnowledge, setReqKnowledge] = useState('');
  const [reqSkills, setReqSkills] = useState('Trabajo en equipo, análisis técnico y enfoque a resultados');
  const [reqLanguage, setReqLanguage] = useState('Inglés técnico básico');
  const [reqJustification, setReqJustification] = useState('');
  const [reqInfra, setReqInfra] = useState(true);
  const [reqHse, setReqHse] = useState(true);
  const [reqOther, setReqOther] = useState(false);
  const [reqOtherDetail, setReqOtherDetail] = useState('');

  const handleReqDepartmentChange = (deptName: string) => {
    setReqDept(deptName);
    const found = departments.find((d) => d.name.toLowerCase() === deptName.toLowerCase());
    if (found && found.lead) {
      setReqApplicant(found.lead);
    }
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqPosition.trim().length < 3) {
      showToast('Indica el nombre del puesto solicitado');
      return;
    }
    if (reqJustification.trim().length < 5) {
      showToast('Describe brevemente la justificación de la vacante');
      return;
    }

    const folio = computeNextFolio(
      'SGI-RH01-2026',
      requisitions.map((r) => r.folio)
    );

    const newRec: StaffRequisitionRecord = {
      id: nextLocalId('req'),
      folio,
      elaborationDate: getTodayFormatted(),
      applicantName: reqApplicant.trim() || 'Gerencia de Área',
      department: reqDept,
      positionRequested: reqPosition.trim(),
      requiredDate: reqRequiredDate.trim() || getTodayFormatted(),
      maritalStatus: reqMarital,
      gender: reqGender,
      ageRange: reqAge.trim() || 'Indistinto',
      workSchedule: reqSchedule.trim(),
      proposedSalary: reqSalary.trim() || 'Por definir según tabulador',
      academicFormation: reqAcademic.trim(),
      basicTraining: reqBasicTraining.trim(),
      experienceTime: reqExperience.trim(),
      knowledge: reqKnowledge.trim() || 'Propios del puesto',
      skills: reqSkills.trim(),
      language: reqLanguage.trim() || 'Español',
      justification: reqJustification.trim(),
      reqInfrastructure: reqInfra,
      reqHse: reqHse,
      reqOther: reqOther,
      reqOtherDetail: reqOtherDetail.trim(),
      status: 'En Revisión RRHH'
    };

    setRequisitions((prev) => [newRec, ...prev]);
    logHrAuditAction({
      actionType: 'Edición de Expediente',
      targetRecord: `${folio} · ${newRec.positionRequested}`,
      details: `Registro de Solicitud de Personal (SGI-FR-RH-01) para el departamento de ${newRec.department}.`,
      newValue: `Solicita: ${newRec.applicantName} · Sueldo: $${newRec.proposedSalary}`,
      severity: 'normal'
    });
    setReqPosition('');
    setReqSalary('');
    setReqKnowledge('');
    setReqJustification('');
    setShowNewReqForm(false);
    showToast(`Solicitud de Personal ${folio} registrada`);
  };

  const advanceRequisitionStatus = (id: string, nextStatus: StaffRequisitionRecord['status']) => {
    setRequisitions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
    showToast(`Estatus actualizado a: ${nextStatus}`);
  };

  // ==========================================================================
  // PROCESO 2: INTEGRACIÓN Y CHECKLIST DE EXPEDIENTE (SGI-FR-RH-13 Y RH-08)
  // ==========================================================================
  const [selectedDossierEmpId, setSelectedDossierEmpId] = useState<string>(
    () => employees[0]?.id || 'EMP-2026-001'
  );
  const [dossierSearch, setDossierSearch] = useState('');

  const selectedDossierEmployee = useMemo(
    () => employees.find((e) => e.id === selectedDossierEmpId) || employees[0],
    [employees, selectedDossierEmpId]
  );

  const currentDossierState: DossierChecklistState = useMemo(() => {
    if (!selectedDossierEmployee) {
      return {
        employeeId: '',
        mode: 'general',
        items: {},
        updatedAt: getTodayFormatted()
      };
    }
    const existing = dossierMap[selectedDossierEmployee.id];
    const defaultMode: 'general' | 'becario' = selectedDossierEmployee.position
      .toLowerCase()
      .includes('becario')
      ? 'becario'
      : 'general';
    const mode = existing?.mode || defaultMode;
    const autoItems = buildAutoDetectedDossierItems(selectedDossierEmployee, mode);

    return {
      employeeId: selectedDossierEmployee.id,
      mode,
      items: { ...autoItems, ...(existing?.items || {}) },
      schoolName: existing?.schoolName || 'Instituto Tecnológico de Minatitlán',
      enrollmentNumber: existing?.enrollmentNumber || '',
      majorSpecialty: existing?.majorSpecialty || 'Ingeniería en Sistemas Computacionales',
      generation: existing?.generation || '2022 - 2026',
      gpaAverage: existing?.gpaAverage || '92',
      internalAdvisor: existing?.internalAdvisor || selectedDossierEmployee.supervisor || 'Ing. Pablo Vázquez Culebro',
      workSchedule: existing?.workSchedule || 'Lunes a Viernes 08:00 a 14:00 hrs',
      monthlySupport: existing?.monthlySupport || selectedDossierEmployee.salary || '4,500.00',
      endDate: existing?.endDate || '18/12/2026',
      updatedAt: existing?.updatedAt || getTodayFormatted()
    };
  }, [selectedDossierEmployee, dossierMap]);

  const updateCurrentDossier = (patch: Partial<DossierChecklistState>) => {
    if (!selectedDossierEmployee) return;
    setDossierMap((prev) => {
      const nextMode = patch.mode || currentDossierState.mode;
      const baseItems =
        patch.mode && patch.mode !== currentDossierState.mode
          ? buildAutoDetectedDossierItems(selectedDossierEmployee, nextMode)
          : currentDossierState.items;
      return {
        ...prev,
        [selectedDossierEmployee.id]: {
          ...currentDossierState,
          ...patch,
          mode: nextMode,
          items: patch.items ? patch.items : baseItems,
          updatedAt: getTodayFormatted()
        }
      };
    });
  };

  const toggleDossierDocItem = (docKey: string) => {
    const nextItems = {
      ...currentDossierState.items,
      [docKey]: !currentDossierState.items[docKey]
    };
    updateCurrentDossier({ items: nextItems });
  };

  const activeChecklistDocs =
    currentDossierState.mode === 'becario' ? RH08_INTERN_DOCUMENTS : RH13_GENERAL_DOCUMENTS;
  const deliveredDocsCount = activeChecklistDocs.filter((d) => currentDossierState.items[d.key]).length;
  const deliveredPercent = Math.round((deliveredDocsCount / activeChecklistDocs.length) * 100);

  // ==========================================================================
  // PROCESO 3: SOLICITUD DE CAPACITACIÓN (SGI-FR-RH-02)
  // ==========================================================================
  const [showNewCapForm, setShowNewCapForm] = useState(false);
  const [capType, setCapType] = useState<'Interna' | 'Externa'>('Externa');
  const [capContract, setCapContract] = useState('N/A');
  const [capApplicant, setCapApplicant] = useState('Ing. Carlos Enrique Cossío Ruiz');
  const [capTargetPositions, setCapTargetPositions] = useState('Técnicos e Ingenieros de Servicio');
  const [capParticipantIds, setCapParticipantIds] = useState<string[]>([]);
  const [capObjectives, setCapObjectives] = useState('');
  const [capTopics, setCapTopics] = useState('');
  const [capDates, setCapDates] = useState('');
  const [capNeeds, setCapNeeds] = useState('Actualización técnica y cumplimiento normativo STPS');
  const [capCenter, setCapCenter] = useState('');
  const [capPlaceSchedule, setCapPlaceSchedule] = useState('Base Minatitlán · 08:00 a 16:00 hrs');
  const [capCost, setCapCost] = useState('');
  const [capObtainedDocs, setCapObtainedDocs] = useState('Constancia DC-3 STPS y Certificado de Aprobación');
  const [capExtras, setCapExtras] = useState('Sala de juntas, proyector y material impreso');
  const [capObs, setCapObs] = useState('');

  const toggleCapParticipant = (empId: string) => {
    setCapParticipantIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleCreateTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (capTopics.trim().length < 3) {
      showToast('Indica el tema o nombre del curso');
      return;
    }
    if (capParticipantIds.length === 0) {
      showToast('Selecciona al menos 1 participante del catálogo');
      return;
    }

    const folio = computeNextFolio(
      'SGI-RH02-2026',
      trainings.map((t) => t.folio)
    );
    const selectedNames = employees
      .filter((emp) => capParticipantIds.includes(emp.id))
      .map((emp) => emp.name);

    const newTraining: TrainingRequestRecord = {
      id: nextLocalId('cap'),
      folio,
      elaborationDate: getTodayFormatted(),
      trainingType: capType,
      contractNumber: capContract.trim() || 'N/A',
      applicantName: capApplicant.trim() || 'Jefe de Área',
      targetPositions: capTargetPositions.trim(),
      participantIds: capParticipantIds,
      participantNames: selectedNames,
      objectives: capObjectives.trim() || 'Fortalecer competencias técnicas operativas del personal.',
      topics: capTopics.trim(),
      requiredDates: capDates.trim() || 'Por programar',
      trainingNeeds: capNeeds.trim(),
      trainingCenter: capCenter.trim() || 'Instructor Interno SIFYGSA',
      placeAndSchedule: capPlaceSchedule.trim(),
      estimatedCost: capCost.trim() || '0.00',
      obtainedDocuments: capObtainedDocs.trim(),
      extraRequirements: capExtras.trim(),
      observations: capObs.trim(),
      status: 'Solicitada',
      creditedToFiles: false
    };

    setTrainings((prev) => [newTraining, ...prev]);
    logHrAuditAction({
      actionType: 'Edición de Expediente',
      targetRecord: `${folio} · ${newTraining.topics}`,
      details: `Solicitud de Capacitación ${newTraining.trainingType} (SGI-FR-RH-02) para ${selectedNames.length} participante(s).`,
      newValue: `${selectedNames.join(', ')}`,
      severity: 'normal'
    });
    setCapTopics('');
    setCapObjectives('');
    setCapDates('');
    setCapCost('');
    setCapParticipantIds([]);
    setShowNewCapForm(false);
    showToast(`Solicitud de Capacitación ${folio} registrada`);
  };

  const handleCreditTrainingToParticipants = (training: TrainingRequestRecord) => {
    const newDocItem: EmployeeDocumentItem = {
      id: nextLocalId('doc-cap'),
      category: 'Certificación Técnica / DC-3',
      title: `${training.topics} (${training.folio})`,
      issuer: training.trainingCenter,
      issueDate: getTodayFormatted(),
      notes: `Acreditado mediante ${training.folio} · Documento: ${training.obtainedDocuments}`
    };

    const updatedEmployees = employees.map((emp) => {
      if (!training.participantIds.includes(emp.id)) return emp;
      const existingDocs = emp.documents || [];
      const alreadyAdded = existingDocs.some((d) => d.title.includes(training.folio));
      if (alreadyAdded) return emp;
      return {
        ...emp,
        silStatus: 'DC-3 Acreditado',
        silStatusType: 'success' as const,
        documents: [...existingDocs, newDocItem]
      };
    });

    savePersistedEmployees(updatedEmployees);
    setTrainings((prev) =>
      prev.map((t) =>
        t.id === training.id
          ? { ...t, status: 'Impartida y Acreditada', creditedToFiles: true }
          : t
      )
    );
    logHrAuditAction({
      actionType: 'Edición de Expediente',
      targetRecord: `${training.folio} · ${training.participantNames.length} colaboradores`,
      details: `Curso acreditado e integrado automáticamente al expediente de los participantes (${training.topics}).`,
      newValue: training.participantNames.join(', '),
      severity: 'normal'
    });
    showToast(`Constancia agregada al expediente de ${training.participantNames.length} colaborador(es)`);
  };

  // ==========================================================================
  // PROCESO 4: VALE DE NO ADEUDO Y LIBERACIÓN DE 9 ÁREAS (SGI-FR-RH-15)
  // ==========================================================================
  const [selectedClearanceEmpId, setSelectedClearanceEmpId] = useState<string>(
    () => employees[0]?.id || 'EMP-2026-001'
  );
  const [terminationDate, setTerminationDate] = useState<string>(() => getTodayFormatted());
  const [terminationReason, setTerminationReason] = useState<string>('Término de Contrato');

  const buildInitialAreaChecks = (): NoDebtAreaCheck[] =>
    RH15_OFFICIAL_AREAS.map((area) => {
      const matchedDept = departments.find(
        (d) => d.name.toLowerCase() === area.deptMatch.toLowerCase()
      );
      return {
        areaId: area.areaId,
        department: area.department,
        responsible: matchedDept?.lead || area.defaultRole,
        hasDebt: false,
        cleared: true,
        notes: ''
      };
    });

  const [areaChecks, setAreaChecks] = useState<NoDebtAreaCheck[]>(buildInitialAreaChecks);
  const [debtItems, setDebtItems] = useState<NoDebtChargeItem[]>([]);
  const [newDebtDept, setNewDebtDept] = useState('ALMACÉN');
  const [newDebtDesc, setNewDebtDesc] = useState('');
  const [newDebtUnit, setNewDebtUnit] = useState('PZA');
  const [newDebtQty, setNewDebtQty] = useState('1');
  const [newDebtCost, setNewDebtCost] = useState('');

  const selectedClearanceEmp = useMemo(
    () => employees.find((e) => e.id === selectedClearanceEmpId) || employees[0],
    [employees, selectedClearanceEmpId]
  );

  const toggleAreaDebtStatus = (areaId: number, hasDebt: boolean) => {
    setAreaChecks((prev) =>
      prev.map((a) =>
        a.areaId === areaId ? { ...a, hasDebt, cleared: !hasDebt } : a
      )
    );
  };

  const handleAddDebtItem = () => {
    const qty = Math.max(1, parseFloat(newDebtQty) || 1);
    const cost = parseFloat(newDebtCost.replace(/,/g, '')) || 0;
    if (!newDebtDesc.trim() || cost <= 0) {
      showToast('Indica la descripción del adeudo y su costo factura');
      return;
    }
    setDebtItems((prev) => [
      ...prev,
      {
        id: nextLocalId('adeudo'),
        department: newDebtDept,
        description: newDebtDesc.trim(),
        unit: newDebtUnit.trim() || 'PZA',
        quantity: qty,
        unitCost: cost
      }
    ]);
    setNewDebtDesc('');
    setNewDebtCost('');
  };

  const debtSubtotal = useMemo(
    () => debtItems.reduce((acc, item) => acc + item.quantity * item.unitCost, 0),
    [debtItems]
  );
  const debtIva = debtSubtotal * 0.16;
  const debtTotal = debtSubtotal + debtIva;

  const handleEmitNoDebtClearance = (markEmployeeInactive: boolean) => {
    if (!selectedClearanceEmp) return;

    const folio = computeNextFolio(
      'SGI-RH15-2026',
      clearances.map((c) => c.folio)
    );
    const hasAnyDebt = areaChecks.some((a) => a.hasDebt) || debtItems.length > 0;

    const newRecord: NoDebtClearanceRecord = {
      id: nextLocalId('rh15'),
      folio,
      elaborationDate: getTodayFormatted(),
      employeeId: selectedClearanceEmp.id,
      employeeName: selectedClearanceEmp.name,
      categoryPosition: selectedClearanceEmp.position,
      contractType: selectedClearanceEmp.contractType || 'Tiempo Indeterminado',
      department: selectedClearanceEmp.department,
      immediateBoss: selectedClearanceEmp.supervisor || 'Gerencia de Área',
      terminationDate,
      terminationReason,
      areaChecks: [...areaChecks],
      debtItems: [...debtItems],
      status: hasAnyDebt ? 'Liberado Con Descuento' : 'Liberado Sin Adeudo',
      appliedInactiveInCatalog: markEmployeeInactive
    };

    setClearances((prev) => [newRecord, ...prev]);

    if (markEmployeeInactive) {
      const updatedList = employees.map((emp) =>
        emp.id === selectedClearanceEmp.id
          ? { ...emp, employmentStatus: 'Inactivo' as const }
          : emp
      );
      savePersistedEmployees(updatedList);
    }

    logHrAuditAction({
      actionType: 'Edición de Expediente',
      targetRecord: `${folio} · ${selectedClearanceEmp.name}`,
      details: `Emisión de Vale de No Adeudo (SGI-FR-RH-15) por ${terminationReason}.${markEmployeeInactive ? ' Se actualizó estatus del colaborador a Inactivo en el Catálogo.' : ''}`,
      newValue: hasAnyDebt ? `Adeudo Total: $${debtTotal.toFixed(2)} MXN` : '9 de 9 Departamentos Sin Adeudo',
      severity: markEmployeeInactive ? 'critico' : 'normal'
    });

    setDebtItems([]);
    setAreaChecks(buildInitialAreaChecks());
    showToast(
      markEmployeeInactive
        ? `Vale ${folio} emitido y colaborador marcado como Inactivo`
        : `Vale de No Adeudo ${folio} emitido correctamente`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '36px' }}>
      {/* Notificación Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#047857',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ENCABEZADO DEL MÓDULO Y FLUJO DE CICLO DE VIDA RRHH                    */}
      {/* ===================================================================== */}
      <div className="card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
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
                flexShrink: 0
              }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Gestión de Procesos y Trámites SGI
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--brand-50)',
                    color: 'var(--primary)',
                    border: '1px solid var(--brand-200)'
                  }}
                >
                  Digitalización Operativa RRHH · Rev. 0 (Marzo 2026)
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Flujo digital ordenado del personal: 1. Apertura de Vacante → 2. Verificación de Expediente → 3. Capacitación → 4. Liberación de No Adeudo
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                downloadCsvFile(
                  'Resumen_Procesos_SGI_RRHH.csv',
                  ['Proceso', 'Folio', 'Fecha', 'Área / Colaborador', 'Detalle', 'Estatus'],
                  [
                    ...requisitions.map((r) => [
                      'SGI-FR-RH-01 Solicitud de Personal',
                      r.folio,
                      r.elaborationDate,
                      r.department,
                      r.positionRequested,
                      r.status
                    ]),
                    ...trainings.map((t) => [
                      'SGI-FR-RH-02 Capacitación',
                      t.folio,
                      t.elaborationDate,
                      t.trainingType,
                      t.topics,
                      t.status
                    ]),
                    ...clearances.map((c) => [
                      'SGI-FR-RH-15 Vale de No Adeudo',
                      c.folio,
                      c.elaborationDate,
                      c.employeeName,
                      c.terminationReason,
                      c.status
                    ])
                  ]
                );
                showToast('Reporte de trámites SGI exportado a Excel');
              }}
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Resumen CSV</span>
            </button>
          </div>
        </div>

        {/* Selector de las 4 Etapas en Orden Cronológico */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            marginTop: '16px'
          }}
        >
          {[
            {
              id: 'RH-01' as ProcessTab,
              step: '1. Contratación',
              code: 'SGI-FR-RH-01',
              title: 'Solicitud de Personal',
              count: `${requisitions.length} vacante(s)`,
              icon: Briefcase
            },
            {
              id: 'RH-13-08' as ProcessTab,
              step: '2. Ingreso y Documentos',
              code: 'SGI-FR-RH-13 / 08',
              title: 'Integración de Expediente',
              count: `${employees.length} colaboradores`,
              icon: FolderCheck
            },
            {
              id: 'RH-02' as ProcessTab,
              step: '3. Desarrollo y STPS',
              code: 'SGI-FR-RH-02',
              title: 'Solicitud de Capacitación',
              count: `${trainings.length} curso(s)`,
              icon: GraduationCap
            },
            {
              id: 'RH-15' as ProcessTab,
              step: '4. Egreso y Liberación',
              code: 'SGI-FR-RH-15',
              title: 'Vale de No Adeudo (9 Áreas)',
              count: `${clearances.length} emitido(s)`,
              icon: ShieldCheck
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isActive ? 'var(--brand-50)' : 'var(--surface-alt)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                    >
                      {tab.step}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: isActive ? '#FFFFFF' : 'var(--surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {tab.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {tab.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                    {tab.count}
                  </div>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PESTAÑA 1: SGI-FR-RH-01 · SOLICITUD DE PERSONAL (VACANTES)            */}
      {/* ===================================================================== */}
      {activeTab === 'RH-01' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  1. Solicitud de Personal y Apertura de Vacantes (SGI-FR-RH-01)
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Requisición de nueva plaza o reemplazo con validación de perfil del puesto, requerimientos de Infraestructura/HSE y autorización de Dirección General.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewReqForm((prev) => !prev)}
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus className="w-4 h-4" />
                <span>{showNewReqForm ? 'Ocultar Formulario' : 'Nueva Solicitud de Personal'}</span>
              </button>
            </div>

            {showNewReqForm && (
              <form
                onSubmit={handleCreateRequisition}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  marginBottom: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                  Datos de la Vacante (Formato Oficial SGI-FR-RH-01)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      DEPARTAMENTO SOLICITANTE *
                    </label>
                    <select
                      value={reqDept}
                      onChange={(e) => handleReqDepartmentChange(e.target.value)}
                      className="select-control"
                      style={{ width: '100%', height: '36px' }}
                    >
                      {activeDepartments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      NOMBRE DEL SOLICITANTE (GERENTE / JEFE) *
                    </label>
                    <input
                      type="text"
                      value={reqApplicant}
                      onChange={(e) => setReqApplicant(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. Ing. Miguel Guzmán Reyes"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      NOMBRE DEL PUESTO SOLICITADO *
                    </label>
                    <input
                      type="text"
                      value={reqPosition}
                      onChange={(e) => setReqPosition(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. Técnico Especialista en Fire & Gas"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      FECHA REQUERIDA DE INGRESO
                    </label>
                    <input
                      type="text"
                      value={reqRequiredDate}
                      onChange={(e) => setReqRequiredDate(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      SALARIO MENSUAL PROPUESTO (MXN)
                    </label>
                    <input
                      type="text"
                      value={reqSalary}
                      onChange={(e) => setReqSalary(formatCurrencyMask(e.target.value).formatted)}
                      className="input-text"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                      placeholder="Ej. 18,000.00"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      HORARIO LABORAL
                    </label>
                    <input
                      type="text"
                      value={reqSchedule}
                      onChange={(e) => setReqSchedule(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      ESTADO CIVIL / SEXO / EDAD
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <input
                        type="text"
                        value={reqMarital}
                        onChange={(e) => setReqMarital(e.target.value)}
                        className="input-text"
                        placeholder="Est. Civil"
                        title="Estado Civil"
                      />
                      <input
                        type="text"
                        value={reqGender}
                        onChange={(e) => setReqGender(e.target.value)}
                        className="input-text"
                        placeholder="Sexo"
                        title="Sexo"
                      />
                      <input
                        type="text"
                        value={reqAge}
                        onChange={(e) => setReqAge(e.target.value)}
                        className="input-text"
                        placeholder="Edad"
                        title="Rango de Edad"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      FORMACIÓN ACADÉMICA
                    </label>
                    <input
                      type="text"
                      value={reqAcademic}
                      onChange={(e) => setReqAcademic(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      TIEMPO DE EXPERIENCIA LABORAL
                    </label>
                    <input
                      type="text"
                      value={reqExperience}
                      onChange={(e) => setReqExperience(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      CAPACITACIÓN BÁSICA REQUERIDA
                    </label>
                    <input
                      type="text"
                      value={reqBasicTraining}
                      onChange={(e) => setReqBasicTraining(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      IDIOMA
                    </label>
                    <input
                      type="text"
                      value={reqLanguage}
                      onChange={(e) => setReqLanguage(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      CONOCIMIENTOS TÉCNICOS
                    </label>
                    <input
                      type="text"
                      value={reqKnowledge}
                      onChange={(e) => setReqKnowledge(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. Instrumentación, normas STPS, ERP..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      HABILIDADES
                    </label>
                    <input
                      type="text"
                      value={reqSkills}
                      onChange={(e) => setReqSkills(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    JUSTIFICACIÓN DE LA CONTRATACIÓN *
                  </label>
                  <textarea
                    rows={2}
                    value={reqJustification}
                    onChange={(e) => setReqJustification(e.target.value)}
                    className="input-text"
                    style={{ width: '100%', height: 'auto', padding: '8px 12px' }}
                    placeholder="Motivo de apertura de plaza, proyecto asignado o reemplazo de personal..."
                  />
                </div>

                {/* Requerimientos adicionales SGI-FR-RH-01: Infraestructura | HSE | Otro */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Requerimientos adicionales para el ingreso:
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reqInfra} onChange={(e) => setReqInfra(e.target.checked)} />
                    <span>Infraestructura / TI (Equipo, Correo, Extensión)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reqHse} onChange={(e) => setReqHse(e.target.checked)} />
                    <span>HSE (EPP, Overol, Botas e Inducción)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={reqOther} onChange={(e) => setReqOther(e.target.checked)} />
                    <span>Otro</span>
                  </label>
                  {reqOther && (
                    <input
                      type="text"
                      value={reqOtherDetail}
                      onChange={(e) => setReqOtherDetail(e.target.value)}
                      className="input-text"
                      placeholder="Especificar requerimiento..."
                      style={{ height: '30px', fontSize: '11.5px', minWidth: '220px' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewReqForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check className="w-4 h-4" />
                    <span>Registrar Solicitud SGI-FR-RH-01</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tabla / Bandeja de Solicitudes de Personal */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px' }}>Folio / Fecha</th>
                    <th style={{ padding: '10px 12px' }}>Puesto Solicitado</th>
                    <th style={{ padding: '10px 12px' }}>Departamento / Solicitante</th>
                    <th style={{ padding: '10px 12px' }}>Sueldo / Ingreso</th>
                    <th style={{ padding: '10px 12px' }}>Áreas Notificadas</th>
                    <th style={{ padding: '10px 12px' }}>Estatus</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>
                          {req.folio}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.elaborationDate}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{req.positionRequested}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.academicFormation}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.department}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{req.applicantName}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${req.proposedSalary}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Req: {req.requiredDate}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {req.reqInfrastructure && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}>
                              Infraestructura
                            </span>
                          )}
                          {req.reqHse && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                              HSE
                            </span>
                          )}
                          {req.reqOther && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                              Otro
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '999px',
                            backgroundColor:
                              req.status === 'Plaza Cubierta'
                                ? 'var(--success-bg)'
                                : req.status === 'Autorizada Dirección'
                                ? 'var(--brand-50)'
                                : 'var(--warning-bg)',
                            color:
                              req.status === 'Plaza Cubierta'
                                ? 'var(--success-text)'
                                : req.status === 'Autorizada Dirección'
                                ? 'var(--primary)'
                                : 'var(--warning-text)'
                          }}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {req.status === 'En Revisión RRHH' && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => advanceRequisitionStatus(req.id, 'Autorizada Dirección')}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Registrar autorización de Dirección General (Ing. Agustín Anastacio Martínez)"
                            >
                              Autorizar Dirección
                            </button>
                          )}
                          {req.status === 'Autorizada Dirección' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                advanceRequisitionStatus(req.id, 'Plaza Cubierta');
                                if (onOpenNewEmployee) onOpenNewEmployee();
                              }}
                              style={{ padding: '4px 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Contratar y abrir Alta de Empleado"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Dar de Alta</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              setPreviewDoc({
                                code: 'SGI-FR-RH-01',
                                title: 'SOLICITUD DE PERSONAL',
                                revision: '0',
                                dateLabel: 'Marzo 2026',
                                payload: { kind: 'RH-01', data: req }
                              })
                            }
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Ver e imprimir formato oficial SGI-FR-RH-01"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hoja SGI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 2: SGI-FR-RH-13 Y RH-08 · INTEGRACIÓN DE EXPEDIENTE           */}
      {/* ===================================================================== */}
      {activeTab === 'RH-13-08' && selectedDossierEmployee && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          {/* Lista lateral de colaboradores */}
          <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '680px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Seleccionar Colaborador ({employees.length})
            </div>
            <div style={{ position: 'relative' }}>
              <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={dossierSearch}
                onChange={(e) => setDossierSearch(e.target.value)}
                placeholder="Buscar por nombre, folio o área..."
                className="input-text"
                style={{ width: '100%', paddingLeft: '30px', height: '34px', fontSize: '12px' }}
              />
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              {employees
                .filter(
                  (e) =>
                    e.name.toLowerCase().includes(dossierSearch.toLowerCase()) ||
                    e.id.toLowerCase().includes(dossierSearch.toLowerCase()) ||
                    e.department.toLowerCase().includes(dossierSearch.toLowerCase())
                )
                .map((emp) => {
                  const isSel = emp.id === selectedDossierEmployee.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedDossierEmpId(emp.id)}
                      style={{
                        textAlign: 'left',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: isSel ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSel ? 'var(--brand-50)' : 'var(--surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{emp.name}</span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{emp.id}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {emp.position} · <strong>{emp.department}</strong>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Panel derecho: Checklist interactivo RH-13 / RH-08 */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedDossierEmployee.name}
                  </h2>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                    {selectedDossierEmployee.id}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 9px',
                      borderRadius: '999px',
                      backgroundColor: deliveredPercent === 100 ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: deliveredPercent === 100 ? 'var(--success-text)' : 'var(--warning-text)'
                    }}
                  >
                    {deliveredDocsCount} de {activeChecklistDocs.length} documentos ({deliveredPercent}%)
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  {selectedDossierEmployee.position} · Departamento: <strong>{selectedDossierEmployee.department}</strong> · Jefe Inmediato: <strong>{selectedDossierEmployee.supervisor || 'Por asignar'}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', backgroundColor: 'var(--surface-alt)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => updateCurrentDossier({ mode: 'general' })}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: currentDossierState.mode === 'general' ? 800 : 600,
                      borderRadius: '6px',
                      backgroundColor: currentDossierState.mode === 'general' ? 'var(--primary)' : 'transparent',
                      color: currentDossierState.mode === 'general' ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    Personal General (RH-13)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentDossier({ mode: 'becario' })}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: currentDossierState.mode === 'becario' ? 800 : 600,
                      borderRadius: '6px',
                      backgroundColor: currentDossierState.mode === 'becario' ? 'var(--primary)' : 'transparent',
                      color: currentDossierState.mode === 'becario' ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    Becarios / Residentes (RH-08)
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    setPreviewDoc({
                      code: currentDossierState.mode === 'becario' ? 'SGI-FR-RH-08' : 'SGI-FR-RH-13',
                      title:
                        currentDossierState.mode === 'becario'
                          ? 'INTEGRACIÓN DE EXPEDIENTE BECARIOS'
                          : 'INTEGRACIÓN DE EXPEDIENTE',
                      revision: '0',
                      dateLabel: 'Marzo 2026',
                      payload: {
                        kind: 'DOSSIER',
                        employee: selectedDossierEmployee,
                        state: currentDossierState
                      }
                    })
                  }
                  style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    Ver Hoja Oficial {currentDossierState.mode === 'becario' ? 'SGI-FR-RH-08' : 'SGI-FR-RH-13'}
                  </span>
                </button>
              </div>
            </div>

            {/* Si es modo Becario (SGI-FR-RH-08), mostrar Datos Escolares reales del formato */}
            {currentDossierState.mode === 'becario' && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                  Datos Escolares y de Residencia / Estadía (Exclusivo Formato SGI-FR-RH-08)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      NOMBRE DE LA ESCUELA / INSTITUCIÓN
                    </label>
                    <input
                      type="text"
                      value={currentDossierState.schoolName || ''}
                      onChange={(e) => updateCurrentDossier({ schoolName: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', height: '32px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      NO. DE MATRÍCULA / CONTROL
                    </label>
                    <input
                      type="text"
                      value={currentDossierState.enrollmentNumber || ''}
                      onChange={(e) => updateCurrentDossier({ enrollmentNumber: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', height: '32px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                      placeholder="Ej. 22230706"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      ESPECIALIDAD / CARRERA
                    </label>
                    <input
                      type="text"
                      value={currentDossierState.majorSpecialty || ''}
                      onChange={(e) => updateCurrentDossier({ majorSpecialty: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', height: '32px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      GENERACIÓN Y PROMEDIO
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '6px' }}>
                      <input
                        type="text"
                        value={currentDossierState.generation || ''}
                        onChange={(e) => updateCurrentDossier({ generation: e.target.value })}
                        className="input-text"
                        style={{ height: '32px', fontSize: '12px' }}
                        placeholder="2022-2026"
                      />
                      <input
                        type="text"
                        value={currentDossierState.gpaAverage || ''}
                        onChange={(e) => updateCurrentDossier({ gpaAverage: e.target.value })}
                        className="input-text"
                        style={{ height: '32px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                        placeholder="Prom."
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      ASESOR ASIGNADO EN SIFYGSA
                    </label>
                    <input
                      type="text"
                      value={currentDossierState.internalAdvisor || ''}
                      onChange={(e) => updateCurrentDossier({ internalAdvisor: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', height: '32px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                      APOYO ECONÓMICO MENSUAL / TÉRMINO
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="text"
                        value={currentDossierState.monthlySupport || ''}
                        onChange={(e) => updateCurrentDossier({ monthlySupport: e.target.value })}
                        className="input-text"
                        style={{ height: '32px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                        placeholder="$ Apoyo"
                      />
                      <input
                        type="text"
                        value={currentDossierState.endDate || ''}
                        onChange={(e) => updateCurrentDossier({ endDate: e.target.value })}
                        className="input-text"
                        style={{ height: '32px', fontSize: '12px' }}
                        placeholder="Fecha término"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid de Documentación Entregada (SÍ / NO) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Control de Documentación Entregada (Haz clic para marcar SÍ / NO)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const allChecked: Record<string, boolean> = {};
                    activeChecklistDocs.forEach((d) => {
                      allChecked[d.key] = true;
                    });
                    updateCurrentDossier({ items: allChecked });
                    showToast('Todos los documentos marcados como entregados');
                  }}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Marcar todos como Entregados (SÍ)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '8px' }}>
                {activeChecklistDocs.map((doc) => {
                  const delivered = Boolean(currentDossierState.items[doc.key]);
                  return (
                    <div
                      key={doc.key}
                      onClick={() => toggleDossierDocItem(doc.key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '9px',
                        border: delivered ? '1px solid var(--success-border)' : '1px solid var(--border)',
                        backgroundColor: delivered ? 'var(--success-bg)' : 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {doc.label}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: delivered ? '#059669' : 'var(--surface-alt)',
                          color: delivered ? '#FFFFFF' : 'var(--text-muted)',
                          flexShrink: 0
                        }}
                      >
                        {delivered ? 'SÍ · Entregado' : 'NO · Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 3: SGI-FR-RH-02 · SOLICITUD DE CAPACITACIÓN                   */}
      {/* ===================================================================== */}
      {activeTab === 'RH-02' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  3. Solicitud y Acreditación de Capacitación (SGI-FR-RH-02)
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Programación de cursos internos o externos, asignación de participantes del catálogo y acreditación directa de constancias DC-3 al expediente de cada participante.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewCapForm((prev) => !prev)}
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus className="w-4 h-4" />
                <span>{showNewCapForm ? 'Ocultar Formulario' : 'Nueva Solicitud de Capacitación'}</span>
              </button>
            </div>

            {showNewCapForm && (
              <form
                onSubmit={handleCreateTraining}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  marginBottom: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                  Captura de Solicitud de Capacitación (SGI-FR-RH-02)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      TIPO DE CAPACITACIÓN *
                    </label>
                    <select
                      value={capType}
                      onChange={(e) => setCapType(e.target.value as 'Interna' | 'Externa')}
                      className="select-control"
                      style={{ width: '100%', height: '36px' }}
                    >
                      <option value="Externa">Externa (Agente Capacitador / Proveedor)</option>
                      <option value="Interna">Interna (Instructor SIFYGSA)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      NÚM. DE CONTRATO (O N/A)
                    </label>
                    <input
                      type="text"
                      value={capContract}
                      onChange={(e) => setCapContract(e.target.value)}
                      className="input-text"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      NOMBRE DEL SOLICITANTE *
                    </label>
                    <input
                      type="text"
                      value={capApplicant}
                      onChange={(e) => setCapApplicant(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      PUESTO(S) AL CUAL VA DIRIGIDO
                    </label>
                    <input
                      type="text"
                      value={capTargetPositions}
                      onChange={(e) => setCapTargetPositions(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      TEMA(S) / NOMBRE DEL CURSO *
                    </label>
                    <input
                      type="text"
                      value={capTopics}
                      onChange={(e) => setCapTopics(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. Seguridad en Trabajos en Altura NOM-009-STPS"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      CENTRO DE CAPACITACIÓN / INSTRUCTOR
                    </label>
                    <input
                      type="text"
                      value={capCenter}
                      onChange={(e) => setCapCenter(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. ICIC / Agente Capacitador STPS"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      FECHA(S) REQUERIDA(S)
                    </label>
                    <input
                      type="text"
                      value={capDates}
                      onChange={(e) => setCapDates(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. 24 y 25 de Noviembre 2026"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      COSTO ESTIMADO (MXN)
                    </label>
                    <input
                      type="text"
                      value={capCost}
                      onChange={(e) => setCapCost(formatCurrencyMask(e.target.value).formatted)}
                      className="input-text"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Selección de Participantes reales del catálogo */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    SELECCIONAR PARTICIPANTES DEL CATÁLOGO DE PERSONAL ({capParticipantIds.length} seleccionados) *
                  </label>
                  <div
                    style={{
                      maxHeight: '130px',
                      overflowY: 'auto',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}
                  >
                    {employees.map((emp) => {
                      const selected = capParticipantIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => toggleCapParticipant(emp.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: selected ? 800 : 600,
                            border: selected ? '1px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: selected ? 'var(--brand-50)' : 'var(--surface-alt)',
                            color: selected ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {selected ? '✓ ' : '+ '}
                          {emp.name} ({emp.department})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      OBJETIVO(S) DE LA CAPACITACIÓN
                    </label>
                    <input
                      type="text"
                      value={capObjectives}
                      onChange={(e) => setCapObjectives(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Objetivo de aprendizaje o certificación..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      NECESIDAD(ES) QUE CUBRE LA CAPACITACIÓN
                    </label>
                    <input
                      type="text"
                      value={capNeeds}
                      onChange={(e) => setCapNeeds(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Ej. Licitación cliente, normativa STPS, actualización..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      LUGAR Y HORARIO
                    </label>
                    <input
                      type="text"
                      value={capPlaceSchedule}
                      onChange={(e) => setCapPlaceSchedule(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      DOCUMENTOS QUE SE OBTENDRÁN
                    </label>
                    <input
                      type="text"
                      value={capObtainedDocs}
                      onChange={(e) => setCapObtainedDocs(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      REQUERIMIENTOS EXTRAS (SALA, PROYECTOR, PAPELERÍA)
                    </label>
                    <input
                      type="text"
                      value={capExtras}
                      onChange={(e) => setCapExtras(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      OBSERVACIONES ADICIONALES
                    </label>
                    <input
                      type="text"
                      value={capObs}
                      onChange={(e) => setCapObs(e.target.value)}
                      className="input-text"
                      style={{ width: '100%' }}
                      placeholder="Notas adicionales para RRHH..."
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    color: '#92400E',
                    fontSize: '11.5px',
                    fontWeight: 600
                  }}
                >
                  <strong>IMPORTANTE (Normativa SGI-FR-RH-02):</strong> En caso de requerir hospedaje, vuelos u otros viáticos, deberá solicitarse al departamento correspondiente (RRHH no realiza trámites de asignación de viáticos).
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewCapForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check className="w-4 h-4" />
                    <span>Registrar Solicitud SGI-FR-RH-02</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tabla de Capacitaciones */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px' }}>Folio / Tipo</th>
                    <th style={{ padding: '10px 12px' }}>Curso / Tema</th>
                    <th style={{ padding: '10px 12px' }}>Participantes</th>
                    <th style={{ padding: '10px 12px' }}>Fechas y Costo</th>
                    <th style={{ padding: '10px 12px' }}>Estatus</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((cap) => (
                    <tr key={cap.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>
                          {cap.folio}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {cap.trainingType} · Cont: {cap.contractNumber}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{cap.topics}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {cap.trainingCenter} · {cap.obtainedDocuments}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {cap.participantNames.length} colaborador(es)
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {cap.participantNames.slice(0, 2).join(', ')}
                          {cap.participantNames.length > 2 ? ` +${cap.participantNames.length - 2}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700 }}>{cap.requiredDates}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          Costo: ${cap.estimatedCost} MXN
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '999px',
                            backgroundColor:
                              cap.status === 'Impartida y Acreditada'
                                ? 'var(--success-bg)'
                                : cap.status === 'Autorizada Dirección'
                                ? 'var(--brand-50)'
                                : 'var(--warning-bg)',
                            color:
                              cap.status === 'Impartida y Acreditada'
                                ? 'var(--success-text)'
                                : cap.status === 'Autorizada Dirección'
                                ? 'var(--primary)'
                                : 'var(--warning-text)'
                          }}
                        >
                          {cap.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!cap.creditedToFiles && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleCreditTrainingToParticipants(cap)}
                              style={{ padding: '4px 9px', fontSize: '11px' }}
                              title="Marcar como impartida y agregar constancia DC-3 al expediente de cada participante"
                            >
                              Acreditar en Expedientes
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              setPreviewDoc({
                                code: 'SGI-FR-RH-02',
                                title: 'SOLICITUD DE CAPACITACIÓN',
                                revision: '0',
                                dateLabel: 'Marzo 2026',
                                payload: { kind: 'RH-02', data: cap }
                              })
                            }
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hoja SGI</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 4: SGI-FR-RH-15 · VALE DE NO ADEUDO (9 DEPARTAMENTOS)         */}
      {/* ===================================================================== */}
      {activeTab === 'RH-15' && selectedClearanceEmp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                4. Vale de No Adeudo y Liberación por las 9 Áreas (SGI-FR-RH-15)
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Verificación patrimonial en Almacén, Compras, Servicios, Ingeniería, HSE, Infraestructura, Calidad, RRHH y Administración con cálculo automático de adeudos.
              </p>
            </div>

            {/* Selección del Trabajador y Datos Automáticos */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}
            >
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  NOMBRE DEL TRABAJADOR *
                </label>
                <select
                  value={selectedClearanceEmpId}
                  onChange={(e) => setSelectedClearanceEmpId(e.target.value)}
                  className="select-control"
                  style={{ width: '100%', height: '36px' }}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  CATEGORÍA / PUESTO Y CONTRATO
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedClearanceEmp.position} · ${selectedClearanceEmp.contractType || 'Tiempo Indeterminado'}`}
                  className="input-text"
                  style={{ width: '100%', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  JEFE INMEDIATO ({selectedClearanceEmp.department})
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedClearanceEmp.supervisor || 'Gerencia de Área'}
                  className="input-text"
                  style={{ width: '100%', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  FECHA DE BAJA Y MOTIVO DE BAJA *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.2fr', gap: '6px' }}>
                  <input
                    type="text"
                    value={terminationDate}
                    onChange={(e) => setTerminationDate(e.target.value)}
                    className="input-text"
                    placeholder="DD/MM/AAAA"
                  />
                  <select
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    className="select-control"
                    style={{ height: '36px' }}
                  >
                    <option value="Término de Contrato">Término de Contrato</option>
                    <option value="Renuncia Voluntaria">Renuncia Voluntaria</option>
                    <option value="Fin de Proyecto / Obra">Fin de Proyecto / Obra</option>
                    <option value="Conclusión de Residencia / Becario">Conclusión de Residencia</option>
                    <option value="Baja Administrativa">Baja Administrativa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matriz de las 9 Áreas Oficiales del Documento SGI-FR-RH-15 */}
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Liberación Patrimonial de los 9 Departamentos de SIFYGSA (SGI-FR-RH-15)
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px 12px', width: '48px' }}>ID</th>
                      <th style={{ padding: '8px 12px' }}>DEPARTAMENTO</th>
                      <th style={{ padding: '8px 12px' }}>RESPONSABLE DE LIBERACIÓN</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}> ¿ADEUDA? (SÍ / NO)</th>
                      <th style={{ padding: '8px 12px' }}>DICTAMEN DE LIBERACIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaChecks.map((row) => (
                      <tr key={row.areaId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {row.areaId}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {row.department}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                          {row.responsible}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => toggleAreaDebtStatus(row.areaId, false)}
                              style={{
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                border: !row.hasDebt ? '1px solid #059669' : '1px solid var(--border)',
                                backgroundColor: !row.hasDebt ? 'var(--success-bg)' : 'var(--surface)',
                                color: !row.hasDebt ? 'var(--success-text)' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              NO (Sin Adeudo)
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleAreaDebtStatus(row.areaId, true)}
                              style={{
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                border: row.hasDebt ? '1px solid #DC2626' : '1px solid var(--border)',
                                backgroundColor: row.hasDebt ? '#FEE2E2' : 'var(--surface)',
                                color: row.hasDebt ? '#991B1B' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              SÍ (Con Adeudo)
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.hasDebt ? (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626' }}>
                              Pendiente de descuento / devolución
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success-text)' }}>
                              ✓ Liberado por {row.department}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose de Adeudos con Subtotal, IVA y Total (SGI-FR-RH-15) */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Indicar la Descripción e Importe del Adeudo (Solo si alguna área reportó equipo o herramienta no entregada)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 0.6fr 0.6fr 0.9fr auto', gap: '8px', alignItems: 'center' }}>
                <select
                  value={newDebtDept}
                  onChange={(e) => setNewDebtDept(e.target.value)}
                  className="select-control"
                  style={{ height: '34px', fontSize: '11.5px' }}
                >
                  {RH15_OFFICIAL_AREAS.map((a) => (
                    <option key={a.areaId} value={a.department}>
                      {a.department}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newDebtDesc}
                  onChange={(e) => setNewDebtDesc(e.target.value)}
                  placeholder="Descripción del equipo, herramienta o pendiente..."
                  className="input-text"
                  style={{ height: '34px', fontSize: '11.5px' }}
                />
                <input
                  type="text"
                  value={newDebtUnit}
                  onChange={(e) => setNewDebtUnit(e.target.value)}
                  placeholder="Unidad"
                  className="input-text"
                  style={{ height: '34px', fontSize: '11.5px' }}
                />
                <input
                  type="number"
                  min={1}
                  value={newDebtQty}
                  onChange={(e) => setNewDebtQty(e.target.value)}
                  placeholder="Cant."
                  className="input-text"
                  style={{ height: '34px', fontSize: '11.5px' }}
                />
                <input
                  type="text"
                  value={newDebtCost}
                  onChange={(e) => setNewDebtCost(formatCurrencyMask(e.target.value).formatted)}
                  placeholder="Costo Factura $"
                  className="input-text"
                  style={{ height: '34px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  onClick={handleAddDebtItem}
                  className="btn btn-secondary"
                  style={{ height: '34px', fontSize: '11.5px' }}
                >
                  + Agregar Partida
                </button>
              </div>

              {debtItems.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', fontWeight: 800 }}>
                        <th style={{ padding: '6px 10px' }}>ID</th>
                        <th style={{ padding: '6px 10px' }}>DEPARTAMENTO</th>
                        <th style={{ padding: '6px 10px' }}>DESCRIPCIÓN</th>
                        <th style={{ padding: '6px 10px' }}>UNIDAD</th>
                        <th style={{ padding: '6px 10px' }}>CANT.</th>
                        <th style={{ padding: '6px 10px' }}>COSTO FACTURA</th>
                        <th style={{ padding: '6px 10px' }}>IMPORTE</th>
                        <th style={{ padding: '6px 10px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {debtItems.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{item.department}</td>
                          <td style={{ padding: '6px 10px' }}>{item.description}</td>
                          <td style={{ padding: '6px 10px' }}>{item.unit}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>{item.quantity}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>
                            ${item.unitCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                            ${(item.quantity * item.unitCost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setDebtItems((prev) => prev.filter((d) => d.id !== item.id))}
                              className="btn-icon"
                              style={{ color: 'var(--danger-text)' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end', gap: '20px', fontSize: '12px', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border)' }}>
                    <span>SUBTOTAL: <strong>${debtSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
                    <span>IVA (16%): <strong>${debtIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                      TOTAL ADEUDO: ${debtTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleEmitNoDebtClearance(false)}
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check className="w-4 h-4" />
                <span>Emitir Vale de No Adeudo (Conservar Activo)</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleEmitNoDebtClearance(true)}
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Emitir Vale SGI-FR-RH-15 y Aplicar Baja en Catálogo (Pasar a Inactivo)</span>
              </button>
            </div>

            {/* Historial de Vales de No Adeudo Emitidos */}
            {clearances.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Vales de No Adeudo Emitidos ({clearances.length})
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px 12px' }}>Folio / Fecha</th>
                        <th style={{ padding: '8px 12px' }}>Trabajador</th>
                        <th style={{ padding: '8px 12px' }}>Motivo y Fecha de Baja</th>
                        <th style={{ padding: '8px 12px' }}>Dictamen</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Hoja Oficial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clearances.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>
                            {c.folio}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 800 }}>{c.employeeName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {c.categoryPosition} · {c.department}
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 700 }}>{c.terminationReason}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Baja: {c.terminationDate}</div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: c.status === 'Liberado Sin Adeudo' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                color: c.status === 'Liberado Sin Adeudo' ? 'var(--success-text)' : 'var(--warning-text)'
                              }}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() =>
                                setPreviewDoc({
                                  code: 'SGI-FR-RH-15',
                                  title: 'VALE DE NO ADEUDO',
                                  revision: '0',
                                  dateLabel: 'Marzo 2026',
                                  payload: { kind: 'RH-15', data: c }
                                })
                              }
                              style={{ padding: '4px 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Ver / Imprimir SGI-FR-RH-15</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE HOJA MEMBRETADA OFICIAL SIFYGSA PARA IMPRESIÓN LIMPIA         */}
      {/* ===================================================================== */}
      {previewDoc && (
        <div
          onClick={() => setPreviewDoc(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 130,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px'
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Barra de acciones superior (no estorba lectura) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                  {previewDoc.code}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                  Vista Oficial del Registro SGI
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                  style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Documento Oficial</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Encabezado Membretado Oficial SIFYGSA */}
            <div style={{ border: '1.5px solid #1E293B', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.1fr', borderBottom: '1px solid #1E293B', fontSize: '11px' }}>
                <div style={{ padding: '10px 12px', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '13px', color: '#1D4ED8' }}>SIFYGSA</div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#475569' }}>
                    SOLUCIONES INTEGRALES EN FIRE & GAS S.A. DE C.V.
                  </div>
                </div>
                <div style={{ padding: '10px 12px', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                    SISTEMA DE GESTIÓN INTEGRADO · RECURSOS HUMANOS
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {previewDoc.title}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
                  <div><strong>Código:</strong> {previewDoc.code}</div>
                  <div><strong>Revisión:</strong> {previewDoc.revision}</div>
                  <div><strong>Fecha:</strong> {previewDoc.dateLabel}</div>
                </div>
              </div>

              {/* Cuerpo según tipo de documento */}
              <div style={{ padding: '16px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previewDoc.payload.kind === 'RH-01' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <div><strong>Folio:</strong> {previewDoc.payload.data.folio}</div>
                      <div><strong>Fecha elaboración:</strong> {previewDoc.payload.data.elaborationDate}</div>
                      <div><strong>Fecha requerida:</strong> {previewDoc.payload.data.requiredDate}</div>
                      <div><strong>Solicitante:</strong> {previewDoc.payload.data.applicantName}</div>
                      <div><strong>Departamento:</strong> {previewDoc.payload.data.department}</div>
                      <div><strong>Puesto:</strong> {previewDoc.payload.data.positionRequested}</div>
                      <div><strong>Salario:</strong> ${previewDoc.payload.data.proposedSalary}</div>
                      <div><strong>Horario:</strong> {previewDoc.payload.data.workSchedule}</div>
                      <div><strong>Edad / Sexo / Est. Civil:</strong> {previewDoc.payload.data.ageRange} · {previewDoc.payload.data.gender} · {previewDoc.payload.data.maritalStatus}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><strong>Formación Académica:</strong> {previewDoc.payload.data.academicFormation}</div>
                      <div><strong>Experiencia Laboral:</strong> {previewDoc.payload.data.experienceTime}</div>
                      <div><strong>Capacitación Básica:</strong> {previewDoc.payload.data.basicTraining}</div>
                      <div><strong>Idioma:</strong> {previewDoc.payload.data.language}</div>
                      <div><strong>Conocimientos:</strong> {previewDoc.payload.data.knowledge}</div>
                      <div><strong>Habilidades:</strong> {previewDoc.payload.data.skills}</div>
                    </div>
                    <div>
                      <strong>Justificación de la Contratación:</strong>
                      <div style={{ marginTop: '4px', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}>
                        {previewDoc.payload.data.justification}
                      </div>
                    </div>
                    <div>
                      <strong>Requerimientos adicionales:</strong>{' '}
                      Infraestructura: [{previewDoc.payload.data.reqInfrastructure ? 'X' : ' '}] · HSE: [{previewDoc.payload.data.reqHse ? 'X' : ' '}] · Otro: [{previewDoc.payload.data.reqOther ? 'X' : ' '}] {previewDoc.payload.data.reqOtherDetail}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px', textAlign: 'center', paddingTop: '16px' }}>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>{previewDoc.payload.data.applicantName}</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Nombre y firma del solicitante</div>
                      </div>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>Ing. Agustín Anastacio Martínez</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Nombre y firma del Director General</div>
                      </div>
                    </div>
                  </>
                )}

                {previewDoc.payload.kind === 'RH-02' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <div><strong>Folio:</strong> {previewDoc.payload.data.folio}</div>
                      <div><strong>Tipo de Capacitación:</strong> {previewDoc.payload.data.trainingType}</div>
                      <div><strong>Núm. Contrato:</strong> {previewDoc.payload.data.contractNumber}</div>
                      <div><strong>Solicitante:</strong> {previewDoc.payload.data.applicantName}</div>
                      <div><strong>Puestos dirigidos:</strong> {previewDoc.payload.data.targetPositions}</div>
                      <div><strong>Fechas requeridas:</strong> {previewDoc.payload.data.requiredDates}</div>
                    </div>
                    <div><strong>Tema(s) del Curso:</strong> {previewDoc.payload.data.topics}</div>
                    <div><strong>Objetivo(s):</strong> {previewDoc.payload.data.objectives}</div>
                    <div><strong>Participantes ({previewDoc.payload.data.participantNames.length}):</strong> {previewDoc.payload.data.participantNames.join(', ')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><strong>Centro de Capacitación:</strong> {previewDoc.payload.data.trainingCenter}</div>
                      <div><strong>Lugar y Horario:</strong> {previewDoc.payload.data.placeAndSchedule}</div>
                      <div><strong>Costo Estimado:</strong> ${previewDoc.payload.data.estimatedCost} MXN</div>
                      <div><strong>Documentos que se obtendrán:</strong> {previewDoc.payload.data.obtainedDocuments}</div>
                    </div>
                    <div><strong>Requerimientos extras:</strong> {previewDoc.payload.data.extraRequirements}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginTop: '24px', textAlign: 'center', paddingTop: '16px' }}>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>{previewDoc.payload.data.applicantName}</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Nombre y firma Solicitante</div>
                      </div>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>Lic. Valeria Méndez Albores</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Gerente de Recursos Humanos</div>
                      </div>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>Ing. Agustín Anastacio Martínez</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Director General</div>
                      </div>
                    </div>
                  </>
                )}

                {previewDoc.payload.kind === 'DOSSIER' && (() => {
                  const dossierPayload = previewDoc.payload;
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                        <div><strong>Nombre:</strong> {dossierPayload.employee.name}</div>
                        <div><strong>Folio:</strong> {dossierPayload.employee.id}</div>
                        <div><strong>Departamento:</strong> {dossierPayload.employee.department}</div>
                        <div><strong>Puesto / Categoría:</strong> {dossierPayload.employee.position}</div>
                        <div><strong>RFC / CURP:</strong> {dossierPayload.employee.rfc || 'S/D'} · {dossierPayload.employee.curp || 'S/D'}</div>
                        <div><strong>NSS / Sangre:</strong> {dossierPayload.employee.nss || 'S/D'} · {dossierPayload.employee.bloodType || 'S/D'}</div>
                      </div>
                      {dossierPayload.state.mode === 'becario' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
                          <div><strong>Escuela:</strong> {dossierPayload.state.schoolName}</div>
                          <div><strong>Matrícula:</strong> {dossierPayload.state.enrollmentNumber || 'S/D'}</div>
                          <div><strong>Especialidad:</strong> {dossierPayload.state.majorSpecialty}</div>
                          <div><strong>Generación / Promedio:</strong> {dossierPayload.state.generation} · Prom: {dossierPayload.state.gpaAverage}</div>
                          <div><strong>Asesor Interno:</strong> {dossierPayload.state.internalAdvisor}</div>
                          <div><strong>Apoyo Mensual:</strong> ${dossierPayload.state.monthlySupport}</div>
                        </div>
                      )}
                      <div>
                        <strong>DOCUMENTACIÓN ENTREGADA:</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
                          {(dossierPayload.state.mode === 'becario' ? RH08_INTERN_DOCUMENTS : RH13_GENERAL_DOCUMENTS).map((d) => (
                            <div key={d.key} style={{ padding: '4px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{d.label}</span>
                              <strong>{dossierPayload.state.items[d.key] ? 'SÍ' : 'NO'}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px', textAlign: 'center', paddingTop: '16px' }}>
                        <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                          <div style={{ fontWeight: 800 }}>{dossierPayload.employee.supervisor || 'Responsable de Área'}</div>
                          <div style={{ fontSize: '10.5px', color: '#475569' }}>Solicita · Departamento Solicitante</div>
                        </div>
                        <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                          <div style={{ fontWeight: 800 }}>Lic. Valeria Méndez Albores</div>
                          <div style={{ fontSize: '10.5px', color: '#475569' }}>Revisa · Departamento de Recursos Humanos</div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {previewDoc.payload.kind === 'RH-15' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <div><strong>Trabajador:</strong> {previewDoc.payload.data.employeeName}</div>
                      <div><strong>Categoría:</strong> {previewDoc.payload.data.categoryPosition}</div>
                      <div><strong>Contrato:</strong> {previewDoc.payload.data.contractType}</div>
                      <div><strong>Jefe Inmediato:</strong> {previewDoc.payload.data.immediateBoss}</div>
                      <div><strong>Fecha de Baja:</strong> {previewDoc.payload.data.terminationDate}</div>
                      <div><strong>Motivo de Baja:</strong> {previewDoc.payload.data.terminationReason}</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #CBD5E1' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                          <th style={{ padding: '5px 8px' }}>ID</th>
                          <th style={{ padding: '5px 8px' }}>DEPARTAMENTO</th>
                          <th style={{ padding: '5px 8px' }}>RESPONSABLE</th>
                          <th style={{ padding: '5px 8px' }}>ADEUDA</th>
                          <th style={{ padding: '5px 8px' }}>ESTATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewDoc.payload.data.areaChecks.map((a) => (
                          <tr key={a.areaId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '4px 8px' }}>{a.areaId}</td>
                            <td style={{ padding: '4px 8px', fontWeight: 700 }}>{a.department}</td>
                            <td style={{ padding: '4px 8px' }}>{a.responsible}</td>
                            <td style={{ padding: '4px 8px', fontWeight: 800 }}>{a.hasDebt ? 'SÍ' : 'NO'}</td>
                            <td style={{ padding: '4px 8px' }}>{a.hasDebt ? 'Con adeudo' : 'Liberado'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginTop: '24px', textAlign: 'center', paddingTop: '16px' }}>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>{previewDoc.payload.data.immediateBoss}</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Jefe Inmediato</div>
                      </div>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>{previewDoc.payload.data.employeeName}</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Trabajador</div>
                      </div>
                      <div style={{ borderTop: '1px solid #0F172A', paddingTop: '6px' }}>
                        <div style={{ fontWeight: 800 }}>Recibe · Administración / RRHH</div>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>Nombre Completo y Firma</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ borderTop: '1px solid #1E293B', padding: '6px 12px', fontSize: '10px', color: '#475569', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
                <span>SOLUCIONES INTEGRALES EN FIRE & GAS S.A. de C.V.</span>
                <span>Registro controlado · SGI-FR-CA-10 · Punto de la norma: 7.5 Información documentada</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
