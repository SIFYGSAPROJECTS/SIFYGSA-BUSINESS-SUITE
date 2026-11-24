'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Camera,
  Trash2,
  User,
  MapPin,
  Briefcase,
  CreditCard,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  Upload,
  Award,
  Link as LinkIcon,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Employee, EmployeeBankAccount, EmployeeDocumentItem } from '../../types';
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
  toRawDigits,
  isValidEmail,
  loadPersistedEmployees,
  savePersistedEmployees,
  useSyncedDepartments,
  checkDuplicateEmployeeIdentifiers,
  logHrAuditAction,
  loadPersistedBanks,
  savePersistedBanks,
  SHOE_SIZE_OPTIONS,
  analyzeTaxCertificateFile,
  PRIMARY_BANK_ALIAS,
  syncBankAccountsConsistency,
  getEmployeeProfileCompleteness
} from '../../utils/formShield';

interface EmployeeEditModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (updated: Employee) => void;
}

type TabType = 'general' | 'contacto' | 'laboral' | 'nomina' | 'documentos';

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  employee,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Employee>(() =>
    employee ? { ...employee } : ({ ...EMPLOYEES[0] } as Employee)
  );
  const syncedDepartments = useSyncedDepartments(INITIAL_DEPARTMENTS);
  const departmentOptions = Array.from(
    new Set([
      ...syncedDepartments.filter((d) => d.status === 'active').map((d) => d.name),
      ...DEPARTMENTS,
      'Por asignar',
      ...(formData.department ? [formData.department] : [])
    ])
  );
  const locationOptions = Array.from(
    new Set([
      'Minatitlán, Ver.',
      'Mapachapa, Ver.',
      'Comalcalco, Tab.',
      'Xalapa, Ver.',
      'Ciudad del Carmen, Camp.',
      'Mérida, Yuc.',
      'Por definir',
      ...(formData.location ? [formData.location] : [])
    ])
  );
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLegalUnlocked, setIsLegalUnlocked] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [savedBanks, setSavedBanks] = useState<string[]>(() => loadPersistedBanks());
  const [bankAccounts, setBankAccounts] = useState<EmployeeBankAccount[]>([]);
  const [addingBankForAccId, setAddingBankForAccId] = useState<string | null>(null);
  const [newBankInput, setNewBankInput] = useState('');

  const [newDocCategory, setNewDocCategory] = useState<EmployeeDocumentItem['category']>('Certificación Técnica / DC-3');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocIssuer, setNewDocIssuer] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocFileUrl, setNewDocFileUrl] = useState('');
  const [newDocMimeType, setNewDocMimeType] = useState('');
  const [newDocExternalUrl, setNewDocExternalUrl] = useState('');
  const [csfFileMime, setCsfFileMime] = useState('');
  const [isAnalyzingCsf, setIsAnalyzingCsf] = useState(false);
  const [csfFeedback, setCsfFeedback] = useState<{
    tone: 'success' | 'warning' | 'error';
    title: string;
    detail: string;
  } | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    if (employee) {
      const formattedClabe = employee.clabe ? formatClabeMask(employee.clabe).formatted : '';
      const initialAccounts: EmployeeBankAccount[] =
        employee.bankAccounts && employee.bankAccounts.length > 0
          ? employee.bankAccounts.map((acc) => ({
              ...acc,
              clabe: acc.clabe ? formatClabeMask(acc.clabe).formatted : '',
              cardNumber: acc.cardNumber ? formatCardMask(acc.cardNumber).formatted : ''
            }))
          : [
              {
                id: 'bank-1',
                bank: employee.bank || '',
                clabe: formattedClabe,
                cardNumber: employee.cardNumber ? formatCardMask(employee.cardNumber).formatted : '',
                alias: 'Nómina',
                isPrimary: true
              }
            ];

      setFormData({
        ...employee,
        clabe: formattedClabe
      });
      setBankAccounts(syncBankAccountsConsistency(initialAccounts));
      setActiveTab('general');
      setIsLegalUnlocked(false);
      setCsfFileMime(employee.taxCertificateFileUrl?.startsWith('data:image/') ? 'image/*' : '');
      setIsAnalyzingCsf(false);
      setCsfFeedback(null);
    }
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [employee]);

  if (!employee) return null;

  const liveCompleteness = getEmployeeProfileCompleteness({
    ...formData,
    bankAccounts
  });
  const missingByTab: Record<TabType, number> = {
    general: 0,
    contacto: 0,
    laboral: 0,
    nomina: 0,
    documentos: 0
  };
  liveCompleteness.missingItems.forEach((item) => {
    missingByTab[item.tab] = (missingByTab[item.tab] || 0) + 1;
  });

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

  // Manejo de carga de fotografía
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileAsDataUrl(file, (dataUrl) => {
        setFormData((prev) => ({
          ...prev,
          photoUrl: dataUrl
        }));
      });
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: undefined
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateBankAccount = (accId: string, patch: Partial<EmployeeBankAccount>) => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === accId ? { ...acc, ...patch } : acc))
    );
  };

  const handleConfirmNewBank = (accId: string) => {
    const clean = newBankInput.trim();
    if (clean.length < 2) {
      triggerToast('¡Escribe el nombre del banco!');
      return;
    }
    const exists = savedBanks.some((b) => b.toLowerCase() === clean.toLowerCase());
    const nextBanks = exists ? savedBanks : [...savedBanks, clean];
    setSavedBanks(nextBanks);
    savePersistedBanks(nextBanks);
    updateBankAccount(accId, { bank: clean });
    setAddingBankForAccId(null);
    setNewBankInput('');
  };

  const handleCsfFileSelect = async (file: File | undefined | null) => {
    if (!file) return;
    setIsAnalyzingCsf(true);
    try {
      const analysis = await analyzeTaxCertificateFile(file, formData.rfc);
      if (analysis.status === 'rejected') {
        setCsfFileMime('');
        setFormData((prev) => ({
          ...prev,
          taxCertificateFileUrl: undefined,
          taxCertificateFileName: undefined,
          taxCertificateStatus: 'Pendiente'
        }));
        setCsfFeedback({
          tone: 'error',
          title: analysis.detectedType ? `Detectado: ${analysis.detectedType}` : 'Documento no compatible',
          detail: analysis.reason
        });
        triggerToast(analysis.toastMessage);
        return;
      }

      readFileAsDataUrl(file, (dataUrl, name, mime) => {
        setCsfFileMime(mime);
        const nextStatus: 'Vigente' | 'En Revisión' =
          analysis.status === 'verified' ? 'Vigente' : 'En Revisión';
        setFormData((prev) => ({
          ...prev,
          taxCertificateFileUrl: dataUrl,
          taxCertificateFileName: name,
          taxCertificateStatus: nextStatus
        }));
        if (analysis.status === 'verified') {
          setCsfFeedback({
            tone: 'success',
            title: 'Constancia de Situación Fiscal Verificada (SAT)',
            detail: analysis.reason
          });
        } else {
          setCsfFeedback({
            tone: 'warning',
            title: `${analysis.detectedType || 'Archivo'} adjunto · Requiere confirmación`,
            detail: analysis.reason
          });
        }
        triggerToast(analysis.toastMessage);
      });
    } finally {
      setIsAnalyzingCsf(false);
    }
  };

  const handleNewDocFilesSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (files.length === 1) {
      const file = files[0];
      readFileAsDataUrl(file, (dataUrl, name, mime) => {
        setNewDocFileUrl(dataUrl);
        setNewDocFileName(name);
        setNewDocMimeType(mime);
        if (!newDocTitle.trim()) {
          setNewDocTitle(name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
        }
        triggerToast('Archivo listo para agregar');
      });
      return;
    }

    Promise.all(
      files.map(
        (file, index) =>
          new Promise<EmployeeDocumentItem>((resolve) => {
            readFileAsDataUrl(file, (dataUrl, name, mime) => {
              resolve({
                id: `doc-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
                category: newDocCategory,
                title: name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ') || `Documento #${index + 1}`,
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
      setFormData((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), ...batchItems]
      }));
      triggerToast(`¡${batchItems.length} archivos agregados!`);
    });
  };

  const handleAddDocumentItem = () => {
    const cleanTitle = newDocTitle.trim() || newDocFileName.trim();
    if (!cleanTitle && !newDocExternalUrl.trim()) {
      triggerToast('¡Indica nombre o adjunta archivo!');
      return;
    }
    const newItem: EmployeeDocumentItem = {
      id: `doc-${Date.now()}`,
      category: newDocCategory,
      title: cleanTitle || 'Documento Adjunto',
      issuer: newDocIssuer.trim() || undefined,
      issueDate: new Date().toLocaleDateString('es-MX'),
      fileName: newDocFileName || undefined,
      fileDataUrl: newDocFileUrl || undefined,
      fileMimeType: newDocMimeType || undefined,
      externalUrl: newDocExternalUrl.trim() || undefined
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newItem]
    }));
    setNewDocTitle('');
    setNewDocIssuer('');
    setNewDocFileName('');
    setNewDocFileUrl('');
    setNewDocMimeType('');
    setNewDocExternalUrl('');
  };

  const handleRemoveDocumentItem = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((d) => d.id !== docId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.trim().length < 3) {
      setActiveTab('general');
      triggerToast('¡Falta nombre!');
      return;
    }
    if (formData.position.trim().length < 2) {
      setActiveTab('general');
      triggerToast('¡Falta puesto!');
      return;
    }
    if (formData.email.trim() && !isValidEmail(formData.email)) {
      setActiveTab('contacto');
      triggerToast('¡Correo inválido!');
      return;
    }

    for (const acc of bankAccounts) {
      const rawC = toRawDigits(acc.clabe);
      const rawCard = toRawDigits(acc.cardNumber || '');
      if ((rawC.length > 0 || rawCard.length > 0) && !acc.bank.trim()) {
        setActiveTab('nomina');
        triggerToast('¡Elige banco!');
        return;
      }
      if (rawC.length > 0 && rawC.length !== 18) {
        setActiveTab('nomina');
        triggerToast('¡CLABE a 18 dígitos!');
        return;
      }
      if (rawCard.length > 0 && rawCard.length !== 16) {
        setActiveTab('nomina');
        triggerToast('¡Tarjeta a 16 dígitos!');
        return;
      }
    }

    const currentList = loadPersistedEmployees(EMPLOYEES);
    const dupCheck = checkDuplicateEmployeeIdentifiers(
      {
        id: formData.id,
        name: formData.name,
        rfc: formData.rfc,
        curp: formData.curp,
        nss: formData.nss
      },
      currentList
    );

    if (dupCheck.hasConflict) {
      setActiveTab('laboral');
      triggerToast(dupCheck.toastMessage || '¡Dato duplicado!');
      return;
    }

    // Recalcular iniciales si cambió el nombre
    const names = formData.name.trim().split(' ');
    const newInitials = names.length >= 2
      ? `${names[0][0] || ''}${names[1][0] || ''}`.toUpperCase()
      : (formData.name.slice(0, 2).toUpperCase() || 'EM');

    const rawSanitizedAccounts: EmployeeBankAccount[] = bankAccounts
      .filter((acc) => toRawDigits(acc.clabe).length > 0 || toRawDigits(acc.cardNumber || '').length > 0)
      .map((acc) => ({
        ...acc,
        clabe: toRawDigits(acc.clabe),
        cardNumber: acc.cardNumber ? formatCardMask(acc.cardNumber).formatted : undefined
      }));
    const sanitizedAccounts = syncBankAccountsConsistency(rawSanitizedAccounts);

    const primaryAcc = sanitizedAccounts.find((b) => b.isPrimary) || sanitizedAccounts[0];
    const rawNewClabe = primaryAcc?.clabe ? toRawDigits(primaryAcc.clabe) : undefined;
    const rawOldClabe = employee.clabe ? toRawDigits(employee.clabe) : undefined;

    const finalDocs = [...(formData.documents || [])];
    if (newDocTitle.trim() || newDocFileUrl || newDocExternalUrl.trim()) {
      finalDocs.push({
        id: `doc-${Date.now()}`,
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

    const effectiveCsfStatus: 'Vigente' | 'Pendiente' | 'En Revisión' = formData.taxCertificateFileUrl
      ? formData.taxCertificateStatus || 'Vigente'
      : 'Pendiente';

    const updatedEmployee: Employee = {
      ...formData,
      name: formData.name.trim(),
      position: formData.position.trim(),
      initials: newInitials,
      bank: primaryAcc?.bank || formData.bank,
      clabe: rawNewClabe,
      cardNumber: primaryAcc?.cardNumber || undefined,
      bankAccounts: sanitizedAccounts.length > 0 ? sanitizedAccounts : undefined,
      taxCertificateExternalUrl: undefined,
      taxCertificateStatus: effectiveCsfStatus,
      documents: finalDocs
    };

    savePersistedEmployees(currentList.map((item) => (item.id === updatedEmployee.id ? updatedEmployee : item)));

    // Registrar en la Bitácora del Gerente de RRHH según el tipo de modificación
    const legalChanged =
      (employee.rfc || '') !== (updatedEmployee.rfc || '') ||
      (employee.curp || '') !== (updatedEmployee.curp || '') ||
      (employee.nss || '') !== (updatedEmployee.nss || '');

    const bankChanged =
      (rawOldClabe || '') !== (rawNewClabe || '') ||
      (employee.bank || '') !== (updatedEmployee.bank || '');

    if (legalChanged) {
      logHrAuditAction({
        actionType: 'Corrección Dato Oficial',
        targetRecord: `${updatedEmployee.id} · ${updatedEmployee.name}`,
        details: 'Desbloqueo de candado oficial para corrección de RFC / CURP / NSS.',
        previousValue: `RFC: ${employee.rfc || 'S/D'} · NSS: ${employee.nss || 'S/D'}`,
        newValue: `RFC: ${updatedEmployee.rfc || 'S/D'} · NSS: ${updatedEmployee.nss || 'S/D'}`,
        severity: 'critico'
      });
    } else if (bankChanged) {
      logHrAuditAction({
        actionType: 'Cambio Bancario CLABE',
        targetRecord: `${updatedEmployee.id} · ${updatedEmployee.name}`,
        details: 'Actualización de tarjeta / CLABE interbancaria para dispersión de nómina.',
        previousValue: `${employee.bank || 'Banco'} · ****${(rawOldClabe || '0000').slice(-4)}`,
        newValue: `${updatedEmployee.bank || 'Banco'} · ****${(rawNewClabe || '0000').slice(-4)}`,
        severity: 'sensible'
      });
    } else {
      logHrAuditAction({
        actionType: 'Edición de Expediente',
        targetRecord: `${updatedEmployee.id} · ${updatedEmployee.name}`,
        details: 'Actualización de datos operativos, contacto, uniformes EPP o documentos fiscales/cursos.',
        previousValue: `${employee.position} (${employee.location})`,
        newValue: `${updatedEmployee.position} (${updatedEmployee.location})`,
        severity: 'normal'
      });
    }

    onSave(updatedEmployee);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '780px',
          width: '100%',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: '14px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '14px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Editar Registro de Colaborador
              </h3>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-200)'
                }}
              >
                {formData.id}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Edición de expediente y datos laborales.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Completitud en Vivo (15 requisitos obligatorios · opcionales no penalizan) */}
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: liveCompleteness.isComplete
              ? '1px solid var(--success-border)'
              : '1px solid var(--border)',
            backgroundColor: liveCompleteness.isComplete
              ? 'var(--success-bg)'
              : 'var(--surface-alt)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: liveCompleteness.isComplete ? 'var(--success-text)' : 'var(--text-primary)'
                }}
              >
                {liveCompleteness.isComplete
                  ? '✓ Expediente base completo (100%)'
                  : `Expediente al ${liveCompleteness.percent}%`}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: liveCompleteness.isComplete ? 'var(--success-text)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {liveCompleteness.completedCount}/{liveCompleteness.totalCount} obligatorios
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Campos marcados con <strong style={{ color: 'var(--danger)' }}>*</strong> suman al 100% · Opcionales no penalizan
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '999px',
              backgroundColor: 'var(--divider)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${liveCompleteness.percent}%`,
                height: '100%',
                borderRadius: '999px',
                backgroundColor: liveCompleteness.isComplete
                  ? 'var(--success)'
                  : liveCompleteness.percent >= 70
                    ? 'var(--primary)'
                    : 'var(--warning)',
                transition: 'width 0.25s ease, background-color 0.25s ease'
              }}
            />
          </div>

          {liveCompleteness.missingItems.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '2px' }}>
                Faltan ({liveCompleteness.missingItems.length}):
              </span>
              {liveCompleteness.missingItems.map((item) => {
                const isOnThisTab = activeTab === item.tab;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    title={`Ir a la pestaña de ${item.label}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isOnThisTab ? '1px solid var(--primary)' : '1px solid var(--warning-border, #F59E0B)',
                      backgroundColor: isOnThisTab ? 'var(--brand-50)' : 'var(--warning-bg)',
                      color: isOnThisTab ? 'var(--primary)' : 'var(--warning-text)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            backgroundColor: 'var(--surface-alt)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            marginBottom: '16px',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'general' as TabType, label: 'General & Foto', icon: User },
            { id: 'contacto' as TabType, label: 'Contacto & Emergencia', icon: MapPin },
            { id: 'laboral' as TabType, label: 'Laboral & Fiscal', icon: Briefcase },
            { id: 'nomina' as TabType, label: 'Salud, Uniformes & Bancos', icon: CreditCard },
            { id: 'documentos' as TabType, label: 'Constancia & Cursos', icon: FileText }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;
            const pendingCount = missingByTab[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '7px',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--brand-50)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {pendingCount > 0 ? (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--warning-bg)',
                      color: 'var(--warning-text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {pendingCount}
                  </span>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Cuerpo del Formulario con scroll independiente */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px',
            gap: '16px'
          }}
        >
          {/* ========================================================= */}
          {/* PESTAÑA 1: GENERAL & FOTOGRAFÍA                          */}
          {/* ========================================================= */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sección de Fotografía */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: formData.avatarBg || 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '20px',
                    flexShrink: 0,
                    border: '2px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt={formData.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    formData.initials
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Fotografía de Credencial / Perfil <span style={{ color: 'var(--danger)' }}>*</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Foto de frente en JPG, PNG o WEBP.
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formData.photoUrl ? 'Cambiar Foto' : 'Agregar Foto'}</span>
                    </button>

                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger-text)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px'
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {toast && (
                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    color: '#92400E',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}

              {/* Nombre Completo */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  NOMBRE COMPLETO <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const { value, hadInvalid } = sanitizePersonName(e.target.value);
                    if (hadInvalid) triggerToast('¡Solo letras!');
                    setFormData({ ...formData, name: value });
                  }}
                  className="input-text"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Puesto y Departamento */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    PUESTO OFICIAL <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeCleanText(e.target.value, 70);
                      if (hadInvalid) triggerToast('¡Carácter inválido!');
                      setFormData({ ...formData, position: value });
                    }}
                    className="input-text"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    DEPARTAMENTO ASIGNADO <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Empresa (Bloqueada), Base de Trabajo y Estatus */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    EMPRESA
                  </label>
                  <input
                    type="text"
                    value="SIFYGSA S.A de C.V"
                    readOnly
                    disabled
                    className="input-text"
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-alt)',
                      fontWeight: 700,
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    BASE DE TRABAJO <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    {locationOptions.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ESTADO LABORAL
                  </label>
                  <select
                    value={formData.employmentStatus || 'Activo'}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as 'Activo' | 'Inactivo' })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Cuadrilla y Estatus SIL */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    CUADRILLA ASIGNADA <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.squad || ''}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeCleanText(e.target.value, 50);
                      if (hadInvalid) triggerToast('¡Carácter inválido!');
                      setFormData({ ...formData, squad: value });
                    }}
                    className="input-text"
                    placeholder="Ej. Cuadrilla Alfa, Cuadrilla Frente CT1"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ACREDITACIÓN TÉCNICA SIL / STPS
                  </label>
                  <select
                    value={formData.silStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      let silType: 'success' | 'warning' | 'info' = 'success';
                      if (val.includes('Renovar')) silType = 'warning';
                      else if (val.includes('Trámite')) silType = 'info';
                      setFormData({
                        ...formData,
                        silStatus: val,
                        silStatusType: silType
                      });
                    }}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="Vigente SIL-3">Vigente SIL-3 (Certificación Plena)</option>
                    <option value="Certificación Vigente">Certificación Vigente</option>
                    <option value="DC-3 Acreditado">DC-3 Acreditado (STPS)</option>
                    <option value="Por Renovar">Por Renovar (Próximo a Vencer)</option>
                    <option value="En Trámite">En Trámite de Evaluación</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 2: CONTACTO & DOMICILIO                           */}
          {/* ========================================================= */}
          {activeTab === 'contacto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toast && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}
              {/* Domicilio Particular Estructurado */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)'
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Domicilio Particular <span style={{ color: 'var(--danger)' }}>*</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.75fr 0.75fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Calle
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Av. Institutos Tecnológicos"
                      value={formData.addressStreet || ''}
                      onChange={(e) => {
                        const street = e.target.value;
                        const num = formData.addressNumber || '';
                        const intNum = formData.addressInterior ? ` Int. ${formData.addressInterior}` : '';
                        const col = formData.addressColony || '';
                        const zip = formData.addressZip || '';
                        const city = formData.addressCity || 'Minatitlán';
                        const st = formData.addressState || 'Veracruz';
                        setFormData({
                          ...formData,
                          addressStreet: street,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Número Exterior
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 412"
                      value={formData.addressNumber || ''}
                      onChange={(e) => {
                        const num = e.target.value;
                        const intNum = formData.addressInterior ? ` Int. ${formData.addressInterior}` : '';
                        const street = formData.addressStreet || '';
                        const col = formData.addressColony || '';
                        const zip = formData.addressZip || '';
                        const city = formData.addressCity || 'Minatitlán';
                        const st = formData.addressState || 'Veracruz';
                        setFormData({
                          ...formData,
                          addressNumber: num,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Número Interior
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Int. B"
                      value={formData.addressInterior || ''}
                      onChange={(e) => {
                        const intVal = e.target.value;
                        const intNum = intVal ? ` Int. ${intVal}` : '';
                        const num = formData.addressNumber || '';
                        const street = formData.addressStreet || '';
                        const col = formData.addressColony || '';
                        const zip = formData.addressZip || '';
                        const city = formData.addressCity || 'Minatitlán';
                        const st = formData.addressState || 'Veracruz';
                        setFormData({
                          ...formData,
                          addressInterior: intVal,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Colonia o Fraccionamiento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Buena Vista Norte"
                      value={formData.addressColony || ''}
                      onChange={(e) => {
                        const col = e.target.value;
                        const street = formData.addressStreet || '';
                        const num = formData.addressNumber || '';
                        const intNum = formData.addressInterior ? ` Int. ${formData.addressInterior}` : '';
                        const zip = formData.addressZip || '';
                        const city = formData.addressCity || 'Minatitlán';
                        const st = formData.addressState || 'Veracruz';
                        setFormData({
                          ...formData,
                          addressColony: col,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Código Postal (C.P.)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="Ej. 96730"
                      value={formData.addressZip || ''}
                      onChange={(e) => {
                        const zip = e.target.value.replace(/\D/g, '').slice(0, 5);
                        const street = formData.addressStreet || '';
                        const num = formData.addressNumber || '';
                        const intNum = formData.addressInterior ? ` Int. ${formData.addressInterior}` : '';
                        const col = formData.addressColony || '';
                        const city = formData.addressCity || 'Minatitlán';
                        const st = formData.addressState || 'Veracruz';
                        setFormData({
                          ...formData,
                          addressZip: zip,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Municipio / Ciudad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Minatitlán"
                      value={formData.addressCity || ''}
                      onChange={(e) => {
                        const city = e.target.value;
                        const street = formData.addressStreet || '';
                        const num = formData.addressNumber || '';
                        const intNum = formData.addressInterior ? ` Int. ${formData.addressInterior}` : '';
                        const col = formData.addressColony || '';
                        const zip = formData.addressZip || '';
                        const st = formData.addressState || 'Veracruz';
                        setFormData({
                          ...formData,
                          addressCity: city,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Estado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Veracruz"
                      value={formData.addressState || ''}
                      onChange={(e) => {
                        const st = e.target.value;
                        const street = formData.addressStreet || '';
                        const num = formData.addressNumber || '';
                        const intNum = formData.addressInterior ? ` Int. ${formData.addressInterior}` : '';
                        const col = formData.addressColony || '';
                        const zip = formData.addressZip || '';
                        const city = formData.addressCity || 'Minatitlán';
                        setFormData({
                          ...formData,
                          addressState: st,
                          address: `${street} #${num}${intNum}, Col. ${col}, C.P. ${zip}, ${city}, ${st}`
                        });
                      }}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Teléfonos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TELÉFONO MÓVIL / CELULAR <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={12}
                    value={formData.phoneCell || ''}
                    onChange={(e) => {
                      const { formatted, hadInvalid } = formatPhoneMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo dígitos!');
                      setFormData({ ...formData, phoneCell: formatted });
                    }}
                    placeholder="Ej. 922-123-4567"
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TELÉFONO FIJO / SECUNDARIO
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={12}
                    value={formData.phonePrimary || ''}
                    onChange={(e) => {
                      const { formatted, hadInvalid } = formatPhoneMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo dígitos!');
                      setFormData({ ...formData, phonePrimary: formatted });
                    }}
                    placeholder="Ej. 922-223-4000"
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Correos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    CORREO CORPORATIVO <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    placeholder="colaborador@sifygsa.com.mx"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '').toLowerCase() })}
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    CORREO PERSONAL
                  </label>
                  <input
                    type="email"
                    value={formData.emailPersonal || ''}
                    onChange={(e) => setFormData({ ...formData, emailPersonal: e.target.value.replace(/\s/g, '').toLowerCase() })}
                    placeholder="colaborador@gmail.com"
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Contacto de Emergencia (Integrado en Contacto & Emergencia) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Contacto en Caso de Emergencia <span style={{ color: 'var(--danger)' }}>*</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.85fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact || ''}
                      onChange={(e) => {
                        const { value, hadInvalid } = sanitizePersonName(e.target.value);
                        if (hadInvalid) triggerToast('¡Solo letras!');
                        setFormData({ ...formData, emergencyContact: value });
                      }}
                      placeholder="Ej. María Elena Pérez"
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Parentesco
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyRelationship || ''}
                      onChange={(e) => {
                        const { value, hadInvalid } = sanitizePersonName(e.target.value);
                        if (hadInvalid) triggerToast('¡Solo letras!');
                        setFormData({ ...formData, emergencyRelationship: value });
                      }}
                      placeholder="Ej. Cónyuge, Padre"
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Teléfono de Emergencia
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}
                      value={formData.emergencyPhone || ''}
                      onChange={(e) => {
                        const { formatted, hadInvalid } = formatPhoneMask(e.target.value);
                        if (hadInvalid) triggerToast('¡Solo dígitos!');
                        setFormData({ ...formData, emergencyPhone: formatted });
                      }}
                      placeholder="Ej. 922-987-6543"
                      className="input-text"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 3: LABORAL & FISCAL                               */}
          {/* ========================================================= */}
          {activeTab === 'laboral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toast && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}

              {/* Banner de Protección de Datos Oficiales (Inmutabilidad por defecto) */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '9px',
                  backgroundColor: isLegalUnlocked ? '#FEF3C7' : 'var(--surface-alt)',
                  border: `1px solid ${isLegalUnlocked ? '#F59E0B' : 'var(--border)'}`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                  {isLegalUnlocked ? (
                    <Unlock className="w-4 h-4" style={{ color: '#B45309' }} />
                  ) : (
                    <Lock className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  )}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {isLegalUnlocked
                      ? 'Modo corrección oficial activo (Se notificará en Bitácora de Gerencia RRHH)'
                      : 'Identificadores legales protegidos contra edición accidental (RFC, CURP, NSS)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isLegalUnlocked;
                    setIsLegalUnlocked(next);
                    triggerToast(next ? '¡Candado abierto!' : '¡Datos protegidos!');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px', fontWeight: 700 }}
                >
                  {isLegalUnlocked ? 'Bloquear Candado' : 'Desbloquear Corrección'}
                </button>
              </div>

              {/* RFC, CURP, NSS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    R.F.C. <span style={{ color: 'var(--danger)' }}>*</span> {!isLegalUnlocked && '🔒'}
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    readOnly={!isLegalUnlocked}
                    value={formData.rfc || ''}
                    onChange={(e) => {
                      const { value, hadInvalid } = formatRfcMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Sin símbolos!');
                      setFormData({ ...formData, rfc: value });
                    }}
                    placeholder="ABCD900101XYZ"
                    className="input-text"
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: !isLegalUnlocked ? 'var(--surface-alt)' : undefined,
                      cursor: !isLegalUnlocked ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    C.U.R.P. <span style={{ color: 'var(--danger)' }}>*</span> {!isLegalUnlocked && '🔒'}
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    readOnly={!isLegalUnlocked}
                    value={formData.curp || ''}
                    onChange={(e) => {
                      const { value, hadInvalid } = formatCurpMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Sin símbolos!');
                      setFormData({ ...formData, curp: value });
                    }}
                    placeholder="ABCD900101HVERRN01"
                    className="input-text"
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: !isLegalUnlocked ? 'var(--surface-alt)' : undefined,
                      cursor: !isLegalUnlocked ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    N.S.S. (IMSS) <span style={{ color: 'var(--danger)' }}>*</span> {!isLegalUnlocked && '🔒'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={15}
                    readOnly={!isLegalUnlocked}
                    value={formData.nss || ''}
                    onChange={(e) => {
                      const { formatted, hadInvalid } = formatNssMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo dígitos!');
                      setFormData({ ...formData, nss: formatted });
                    }}
                    placeholder="34-12-88-9412-1"
                    className="input-text"
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: !isLegalUnlocked ? 'var(--surface-alt)' : undefined,
                      cursor: !isLegalUnlocked ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>

              {/* Supervisor y Tipo de Contrato */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    JEFE ASIGNADO
                  </label>
                  <input
                    type="text"
                    value={formData.supervisor || ''}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizePersonName(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo letras!');
                      setFormData({ ...formData, supervisor: value });
                    }}
                    placeholder="Ej. Ing. Miguel Ángel Guzmán Reyes"
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TIPO DE CONTRATO
                  </label>
                  <input
                    type="text"
                    value={formData.contractType || 'Tiempo Indeterminado'}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    placeholder="Ej. Tiempo Indeterminado"
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Sueldo y Fecha de Ingreso */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    SUELDO MENSUAL BRUTO (MXN)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.salary || ''}
                    onChange={(e) => {
                      const { formatted, hadInvalid } = formatCurrencyMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo números!');
                      setFormData({ ...formData, salary: formatted });
                    }}
                    placeholder="Ej. 38,500.00"
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    FECHA DE INGRESO
                  </label>
                  <input
                    type="text"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value.replace(/[^0-9/]/g, '').slice(0, 10) })}
                    placeholder="DD/MM/AAAA"
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 4: SALUD, UNIFORMES EPP & CUENTAS BANCARIAS       */}
          {/* ========================================================= */}
          {activeTab === 'nomina' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toast && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}

              {/* Uniformes y Tallas de Protección Personal Separadas (Opcional) */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Uniformes y Tallas de Protección Personal (EPP) (Opcional)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Talla Calzado (MEX)
                    </label>
                    <input
                      list="edit-shoe-sizes"
                      type="text"
                      value={formData.shoeSize || ''}
                      onChange={(e) => setFormData({ ...formData, shoeSize: e.target.value })}
                      placeholder="Ej. 27.5"
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                    <datalist id="edit-shoe-sizes">
                      {SHOE_SIZE_OPTIONS.map((sz) => (
                        <option key={sz} value={sz} />
                      ))}
                      <option value="No aplica" />
                      <option value="Sin especificar" />
                    </datalist>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Talla de Overol
                    </label>
                    <input
                      type="text"
                      value={formData.coverallSize || ''}
                      onChange={(e) => setFormData({ ...formData, coverallSize: e.target.value })}
                      placeholder="Ej. Talla 40 (G)"
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Salud, Discapacidad y Alergias */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    TIPO DE SANGRE <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={formData.bloodType || ''}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="" disabled>
                      Seleccionar grupo...
                    </option>
                    <option value="O Positivo (O+)">O Positivo (O+)</option>
                    <option value="O Negativo (O-)">O Negativo (O-)</option>
                    <option value="A Positivo (A+)">A Positivo (A+)</option>
                    <option value="A Negativo (A-)">A Negativo (A-)</option>
                    <option value="B Positivo (B+)">B Positivo (B+)</option>
                    <option value="B Negativo (B-)">B Negativo (B-)</option>
                    <option value="AB Positivo (AB+)">AB Positivo (AB+)</option>
                    <option value="AB Negativo (AB-)">AB Negativo (AB-)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    DISCAPACIDAD O AJUSTE <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.disabilityInfo || ''}
                    onChange={(e) => setFormData({ ...formData, disabilityInfo: e.target.value })}
                    placeholder="Ninguna o especificar..."
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    PADECIMIENTOS CRÓNICOS <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.chronicConditions || ''}
                    onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                    placeholder="Ninguno o especificar..."
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  ALERGIAS <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.allergies || ''}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ninguna o listar alergias separadas por coma..."
                  className="input-text"
                  style={{ width: '100%', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              {/* Cuentas Bancarias (Múltiples Bancos + Uso único por cuenta + Agregar Nuevo Banco) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bankAccounts.slice(0, 1).map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Nómina <span style={{ color: 'var(--danger)' }}>*</span>
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          Banco
                        </label>
                        <select
                          value={acc.bank}
                          onChange={(e) => {
                            if (e.target.value === '__new_bank__') {
                              setAddingBankForAccId(acc.id);
                              setNewBankInput('');
                            } else {
                              updateBankAccount(acc.id, { bank: e.target.value });
                            }
                          }}
                          className="select-control"
                          style={{ width: '100%', height: '35px' }}
                        >
                          <option value="" disabled>
                            Seleccionar banco...
                          </option>
                          {savedBanks.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                          <option value="__new_bank__">+ Agregar nuevo banco...</option>
                        </select>
                        {addingBankForAccId === acc.id && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            <input
                              type="text"
                              placeholder="Nuevo banco..."
                              value={newBankInput}
                              onChange={(e) => setNewBankInput(e.target.value)}
                              className="input-text"
                              style={{ flex: 1, height: '32px', fontSize: '11px' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleConfirmNewBank(acc.id)}
                              className="btn btn-primary"
                              style={{ padding: '2px 8px', fontSize: '10.5px' }}
                            >
                              OK
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          CLABE (18 dígitos)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={22}
                          value={acc.clabe}
                          onChange={(e) => {
                            const { formatted, hadInvalid } = formatClabeMask(e.target.value);
                            if (hadInvalid) triggerToast('¡Solo dígitos!');
                            updateBankAccount(acc.id, { clabe: formatted });
                          }}
                          placeholder="0121-8000-1234-5678-90"
                          className="input-text"
                          style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          Tarjeta (16 dígitos) <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={19}
                          value={acc.cardNumber || ''}
                          onChange={(e) => {
                            const { formatted, hadInvalid } = formatCardMask(e.target.value);
                            if (hadInvalid) triggerToast('¡Solo dígitos!');
                            updateBankAccount(acc.id, { cardNumber: formatted });
                          }}
                          placeholder="1234-5678-9012-3456"
                          className="input-text"
                          style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          Uso de la Cuenta 🔒
                        </label>
                        <select
                          value={PRIMARY_BANK_ALIAS}
                          disabled
                          className="select-control"
                          style={{
                            width: '100%',
                            height: '35px',
                            cursor: 'not-allowed',
                            opacity: 0.8
                          }}
                        >
                          <option value={PRIMARY_BANK_ALIAS}>{PRIMARY_BANK_ALIAS}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 5: CONSTANCIA FISCAL (SAT) Y CURSOS (NO OBLIGATORIO)*/}
          {/* ========================================================= */}
          {activeTab === 'documentos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toast && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}

              {/* Constancia de Situación Fiscal con Detección Inteligente */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleCsfFileSelect(e.dataTransfer.files?.[0]);
                }}
                onPaste={(e) => {
                  if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                    handleCsfFileSelect(e.clipboardData.files[0]);
                  }
                }}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Constancia de Situación Fiscal (CSF - SAT) <span style={{ color: 'var(--danger)' }}>*</span>
                      </span>
                    </div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      PDF o foto de constancia SAT (requerida para 100%).
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                      backgroundColor: isAnalyzingCsf
                        ? 'var(--brand-50)'
                        : formData.taxCertificateStatus === 'Vigente'
                        ? 'var(--success-bg)'
                        : formData.taxCertificateStatus === 'En Revisión'
                        ? '#FEF3C7'
                        : 'var(--surface)',
                      color: isAnalyzingCsf
                        ? 'var(--primary)'
                        : formData.taxCertificateStatus === 'Vigente'
                        ? 'var(--success-text)'
                        : formData.taxCertificateStatus === 'En Revisión'
                        ? '#92400E'
                        : 'var(--text-muted)',
                      border:
                        formData.taxCertificateStatus === 'Vigente'
                          ? '1px solid var(--success-border)'
                          : formData.taxCertificateStatus === 'En Revisión'
                          ? '1px solid #F59E0B'
                          : '1px solid var(--border)'
                    }}
                  >
                    {isAnalyzingCsf
                      ? 'Revisando...'
                      : formData.taxCertificateStatus === 'Vigente'
                      ? '✓ Verificada SAT'
                      : formData.taxCertificateStatus === 'En Revisión'
                      ? 'Por Confirmar'
                      : 'Pendiente'}
                  </span>
                </div>

                {formData.taxCertificateFileName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: formData.taxCertificateStatus === 'Vigente' ? 'var(--success-bg)' : '#FEF3C7',
                        border: formData.taxCertificateStatus === 'Vigente' ? '1px solid var(--success-border)' : '1px solid #F59E0B'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {(csfFileMime.startsWith('image/') || formData.taxCertificateFileUrl?.startsWith('data:image/')) && formData.taxCertificateFileUrl ? (
                          <img
                            src={formData.taxCertificateFileUrl}
                            alt="Vista previa CSF"
                            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                          />
                        ) : (
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: formData.taxCertificateStatus === 'Vigente' ? 'var(--success-text)' : '#B45309', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: formData.taxCertificateStatus === 'Vigente' ? 'var(--success-text)' : '#92400E',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formData.taxCertificateFileName}
                          </div>
                          <div style={{ fontSize: '10px', color: formData.taxCertificateStatus === 'Vigente' ? 'var(--success-text)' : '#92400E' }}>
                            {formData.taxCertificateStatus === 'Vigente' ? 'Constancia validada' : 'Pendiente de confirmación visual'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {formData.taxCertificateFileUrl && (
                          <a
                            href={formData.taxCertificateFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={formData.taxCertificateFileName}
                            style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
                          >
                            Abrir
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCsfFileMime('');
                            setCsfFeedback(null);
                            setFormData((prev) => ({
                              ...prev,
                              taxCertificateFileName: undefined,
                              taxCertificateFileUrl: undefined,
                              taxCertificateExternalUrl: undefined,
                              taxCertificateStatus: 'Pendiente'
                            }));
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontWeight: 800, fontSize: '11.5px' }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>

                    {formData.taxCertificateStatus === 'En Revisión' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, taxCertificateStatus: 'Vigente' }));
                            setCsfFeedback({
                              tone: 'success',
                              title: 'Constancia Confirmada por RRHH',
                              detail: `Se confirmó visualmente que "${formData.taxCertificateFileName}" corresponde a la CSF.`
                            });
                            triggerToast('¡CSF confirmada!');
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                        >
                          ✓ Confirmar que sí es CSF
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label className="btn btn-secondary" style={{ fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir archivo PDF / Imagen CSF</span>
                      <input
                        type="file"
                        accept=".pdf,image/*,.docx"
                        onChange={(e) => {
                          handleCsfFileSelect(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      También puedes arrastrar el archivo aquí
                    </span>
                  </div>
                )}

                {csfFeedback && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      backgroundColor:
                        csfFeedback.tone === 'success'
                          ? 'var(--success-bg)'
                          : csfFeedback.tone === 'warning'
                          ? '#FEF3C7'
                          : 'rgba(239, 68, 68, 0.08)',
                      border:
                        csfFeedback.tone === 'success'
                          ? '1px solid var(--success-border)'
                          : csfFeedback.tone === 'warning'
                          ? '1px solid #F59E0B'
                          : '1px solid rgba(239, 68, 68, 0.35)',
                      color:
                        csfFeedback.tone === 'success'
                          ? 'var(--success-text)'
                          : csfFeedback.tone === 'warning'
                          ? '#92400E'
                          : 'var(--danger-text)'
                    }}
                  >
                    {csfFeedback.tone === 'success' ? (
                      <ShieldCheck className="w-4 h-4" style={{ flexShrink: 0, marginTop: '1px' }} />
                    ) : (
                      <AlertTriangle className="w-4 h-4" style={{ flexShrink: 0, marginTop: '1px' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 800 }}>{csfFeedback.title}</div>
                      <div style={{ opacity: 0.92 }}>{csfFeedback.detail}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cursos, Certificaciones DC-3 y Cartas de Recomendación (Varios archivos) */}
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
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Cursos, Certificaciones DC-3 y Cartas ({(formData.documents || []).length}){' '}
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>(Opcional)</span>
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--brand-50)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--brand-200)', whiteSpace: 'nowrap' }}>
                    Varios archivos
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '10px' }}>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as EmployeeDocumentItem['category'])}
                    className="select-control"
                    style={{ width: '100%', height: '35px', fontSize: '11.5px' }}
                  >
                    <option value="Certificación Técnica / DC-3">Certificación Técnica / DC-3</option>
                    <option value="Curso de Seguridad / Brigada">Curso de Seguridad / Brigada</option>
                    <option value="Carta de Recomendación">Carta de Recomendación</option>
                    <option value="Título / Cédula Profesional">Título / Cédula Profesional</option>
                    <option value="Otro Anexo">Otro Anexo</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Nombre del curso o carta..."
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="input-text"
                    style={{ width: '100%', height: '35px', fontSize: '11.5px' }}
                  />

                  <input
                    type="text"
                    placeholder="Emisor / Trabajo anterior..."
                    value={newDocIssuer}
                    onChange={(e) => setNewDocIssuer(e.target.value)}
                    className="input-text"
                    style={{ width: '100%', height: '35px', fontSize: '11.5px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                  <label className="btn btn-secondary" style={{ fontSize: '11px', height: '35px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Upload className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {newDocFileName || 'Subir uno o varios archivos'}
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

                  <div style={{ position: 'relative' }}>
                    <LinkIcon className="w-3.5 h-3.5 text-muted" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="url"
                      placeholder="Enlace del certificado (Opcional)"
                      value={newDocExternalUrl}
                      onChange={(e) => setNewDocExternalUrl(e.target.value)}
                      className="input-text"
                      style={{ width: '100%', paddingLeft: '28px', height: '35px', fontSize: '11.5px' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDocumentItem}
                    className="btn btn-primary"
                    style={{ fontSize: '11px', height: '35px', padding: '0 12px', fontWeight: 700 }}
                  >
                    + Agregar
                  </button>
                </div>

                {(formData.documents || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {(formData.documents || []).map((doc, idx) => (
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
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--brand-50)',
                              color: 'var(--primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong>{doc.title}</strong>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '10.5px' }}>
                              ({doc.category}{doc.issuer ? ` · ${doc.issuer}` : ''}{doc.fileName ? ` · 📎 ${doc.fileName}` : ''})
                            </span>
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
                )}
              </div>
            </div>
          )}

          {/* Botones de acción del pie */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
