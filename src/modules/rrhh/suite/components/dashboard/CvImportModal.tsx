'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardPaste,
  Award,
  Loader2,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { CvImportDraft, parseCvFile, parseCvText, splitSpanishFullName } from '../../utils/cvParser';

interface CvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToExcel?: () => void;
  departments: string[];
  onConfirmImport: (draft: CvImportDraft) => void;
}

const WORK_LOCATIONS = [
  'Minatitlán, Ver.',
  'Mapachapa, Ver.',
  'Comalcalco, Tab.',
  'Xalapa, Ver.',
  'Ciudad del Carmen, Camp.',
  'Mérida, Yuc.'
];

type ExtraFieldKey =
  | 'nss'
  | 'contractType'
  | 'grossSalary'
  | 'assignedProject'
  | 'laborCategory'
  | 'institutionalEmail'
  | 'landlinePhone'
  | 'postalCode'
  | 'streetAddress'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'bloodType'
  | 'shoeSize'
  | 'overallSize'
  | 'bankName'
  | 'clabe';

interface ExtraFieldDefinition {
  key: ExtraFieldKey;
  label: string;
  group: string;
  placeholder?: string;
  mono?: boolean;
  options?: string[];
}

const EXTRA_EMPLOYEE_FIELDS: ExtraFieldDefinition[] = [
  { key: 'nss', label: 'NSS (IMSS)', group: 'Datos Personales', placeholder: '11 dígitos', mono: true },
  {
    key: 'contractType',
    label: 'Tipo de Contrato',
    group: 'Datos Laborales',
    options: [
      'Tiempo Indeterminado',
      'Tiempo Determinado',
      'Por Obra Determinada',
      'Periodo de Prueba',
      'Capacitación Inicial'
    ]
  },
  { key: 'grossSalary', label: 'Sueldo Mensual Bruto (MXN)', group: 'Datos Laborales', placeholder: 'Ej. 18500' },
  { key: 'assignedProject', label: 'Proyecto Asignado', group: 'Datos Laborales', placeholder: 'Ej. Mantenimiento Preventivo' },
  {
    key: 'laborCategory',
    label: 'Categoría Laboral',
    group: 'Datos Personales',
    options: ['Confianza', 'Sindicalizado', 'Eventual', 'Becario']
  },
  { key: 'institutionalEmail', label: 'Correo Institucional', group: 'Contacto y Domicilio', placeholder: 'nombre@sifygsa.com.mx' },
  { key: 'landlinePhone', label: 'Teléfono Fijo', group: 'Contacto y Domicilio', placeholder: '922 000 0000' },
  { key: 'postalCode', label: 'Código Postal', group: 'Contacto y Domicilio', placeholder: '5 dígitos', mono: true },
  { key: 'streetAddress', label: 'Calle / Domicilio', group: 'Contacto y Domicilio', placeholder: 'Calle y número' },
  { key: 'emergencyContactName', label: 'Contacto de Emergencia', group: 'Contacto y Domicilio', placeholder: 'Nombre completo' },
  { key: 'emergencyContactPhone', label: 'Tel. de Emergencia', group: 'Contacto y Domicilio', placeholder: '10 dígitos' },
  {
    key: 'bloodType',
    label: 'Tipo de Sangre',
    group: 'Salud y Uniformes',
    options: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  },
  { key: 'shoeSize', label: 'Calzado (MEX)', group: 'Salud y Uniformes', placeholder: 'Ej. 27.5' },
  {
    key: 'overallSize',
    label: 'Talla Overol',
    group: 'Salud y Uniformes',
    options: ['CH', 'M', 'G', 'XG', '2XG', '3XG']
  },
  {
    key: 'bankName',
    label: 'Banco de Nómina',
    group: 'Nómina y Banco',
    options: ['BBVA México', 'Banamex', 'Santander', 'Banorte', 'HSBC', 'Scotiabank', 'BanCoppel', 'Banco Azteca']
  },
  { key: 'clabe', label: 'CLABE Interbancaria', group: 'Nómina y Banco', placeholder: '18 dígitos', mono: true }
];

export const CvImportModal: React.FC<CvImportModalProps> = ({
  isOpen,
  onClose,
  onSwitchToExcel,
  departments,
  onConfirmImport
}) => {
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [draft, setDraft] = useState<CvImportDraft | null>(null);
  const [activeExtraFields, setActiveExtraFields] = useState<ExtraFieldKey[]>([]);
  const [fieldToAdd, setFieldToAdd] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const autoActivateDetectedExtras = (parsed: CvImportDraft) => {
    const detectedExtras: ExtraFieldKey[] = [];
    EXTRA_EMPLOYEE_FIELDS.forEach((f) => {
      const val = parsed[f.key];
      if (typeof val === 'string' && val.trim().length > 0) {
        detectedExtras.push(f.key);
      }
    });
    setActiveExtraFields((prev) => Array.from(new Set([...prev, ...detectedExtras])));
  };

  const resetState = () => {
    setErrorMsg(null);
    setDraft(null);
    setPastedText('');
    setActiveExtraFields([]);
    setFieldToAdd('');
    setIsParsing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setIsParsing(true);
    try {
      const parsed = await parseCvFile(file);
      setDraft(parsed);
      autoActivateDetectedExtras(parsed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar el archivo.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleAnalyzePaste = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Pega el texto del CV para extraer los datos.');
      return;
    }
    setErrorMsg(null);
    const parsed = parseCvText(pastedText, draft ? {
      fileName: draft.fileName,
      fileDataUrl: draft.fileDataUrl,
      fileSize: draft.fileSize,
      fileMimeType: draft.fileMimeType
    } : undefined);
    setDraft(parsed);
    autoActivateDetectedExtras(parsed);
  };

  const handleAddExtraField = (key: string) => {
    if (!key) return;
    const typedKey = key as ExtraFieldKey;
    setActiveExtraFields((prev) => (prev.includes(typedKey) ? prev : [...prev, typedKey]));
    setFieldToAdd('');
  };

  const handleRemoveExtraField = (key: ExtraFieldKey) => {
    setActiveExtraFields((prev) => prev.filter((k) => k !== key));
    updateDraftField(key, '');
  };

  const updateDraftField = (field: keyof CvImportDraft, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (field === 'fullName') {
        const split = splitSpanishFullName(value);
        return {
          ...prev,
          fullName: value,
          firstName: split.firstName,
          paternalSurname: split.paternalSurname,
          maternalSurname: split.maternalSurname
        };
      }
      if (field === 'firstName' || field === 'paternalSurname' || field === 'maternalSurname') {
        const next = { ...prev, [field]: value };
        next.fullName = [next.firstName, next.paternalSurname, next.maternalSurname]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(' ');
        return next;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleContinue = () => {
    if (!draft) return;
    onConfirmImport(draft);
    resetState();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.58)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: '16px'
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
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
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                Importar CV de Colaborador
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Extrae datos del currículum y prellena el Registro del Personal
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Selector unificado Excel / CV */}
          {onSwitchToExcel && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '4px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)'
              }}
            >
              <button
                type="button"
                onClick={onSwitchToExcel}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid transparent',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Importar Excel (.xlsx) / CSV</span>
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'var(--brand-50)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'default'
                }}
              >
                <FileUp className="w-4 h-4" />
                <span>Importar CV (Individual)</span>
              </button>
            </div>
          )}

          {/* Switch de modo */}
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              backgroundColor: 'var(--surface-alt)',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => setMode('file')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: mode === 'file' ? 700 : 600,
                backgroundColor: mode === 'file' ? 'var(--surface)' : 'transparent',
                color: mode === 'file' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'file' ? 'var(--shadow-xs)' : 'none',
                cursor: 'pointer'
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Subir archivo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: mode === 'paste' ? 700 : 600,
                backgroundColor: mode === 'paste' ? 'var(--surface)' : 'transparent',
                color: mode === 'paste' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'paste' ? 'var(--shadow-xs)' : 'none',
                cursor: 'pointer'
              }}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Pegar texto</span>
            </button>
          </div>

          {mode === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '22px 18px',
                textAlign: 'center',
                backgroundColor: isDragging ? 'var(--brand-50)' : 'var(--surface-alt)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.csv,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {isParsing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Leyendo currículum...
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <FileUp className="w-7 h-7" style={{ color: 'var(--primary)' }} />
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {draft?.fileName ? `Archivo cargado: ${draft.fileName}` : 'Arrastra tu CV aquí o haz clic para seleccionarlo'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Soporta PDF, Word (.docx), Excel (.xlsx), texto (.txt) o imagen · Se adjunta automáticamente al expediente
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                className="input-text"
                placeholder="Pega aquí el contenido del CV (nombre, puesto, correo, teléfono, CURP, cursos...)"
                style={{ resize: 'vertical', fontSize: '12.5px', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAnalyzePaste}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--primary)',
                    borderColor: 'var(--brand-200)'
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extraer datos</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.22)',
                color: 'var(--danger)',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vista previa editable de datos detectados */}
          {draft && (
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Datos detectados del CV
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--brand-50)',
                    color: 'var(--primary)',
                    border: '1px solid var(--brand-200)'
                  }}
                >
                  {draft.detectedFields.length > 0
                    ? `${draft.detectedFields.length} campos detectados`
                    : 'Archivo listo para adjuntar'}
                </span>
              </div>

              {draft.detectedFields.length === 0 && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface-alt)',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  El archivo parece ser una imagen o PDF escaneado sin texto seleccionable. Se adjuntará al expediente y puedes capturar los datos aquí o directamente en Registro del Personal.
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '10px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Nombre(s)
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.firstName}
                    onChange={(e) => updateDraftField('firstName', e.target.value)}
                    placeholder="Ej. Adrián José"
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellido Paterno
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.paternalSurname}
                    onChange={(e) => updateDraftField('paternalSurname', e.target.value)}
                    placeholder="Ej. Rodríguez"
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.maternalSurname}
                    onChange={(e) => updateDraftField('maternalSurname', e.target.value)}
                    placeholder="Ej. Hernández"
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Puesto / Perfil
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.position}
                    onChange={(e) => updateDraftField('position', e.target.value)}
                    placeholder="Ej. Ingeniero de Servicio"
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Departamento Sugerido
                  </label>
                  <select
                    className="input-text"
                    value={draft.department}
                    onChange={(e) => updateDraftField('department', e.target.value)}
                    style={{ fontSize: '12.5px' }}
                  >
                    <option value="">Seleccionar después...</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Base de Trabajo
                  </label>
                  <select
                    className="input-text"
                    value={draft.location || 'Minatitlán, Ver.'}
                    onChange={(e) => updateDraftField('location', e.target.value)}
                    style={{ fontSize: '12.5px' }}
                  >
                    {WORK_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="input-text"
                    value={draft.email}
                    onChange={(e) => updateDraftField('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Teléfono Celular
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.phone}
                    onChange={(e) => updateDraftField('phone', e.target.value)}
                    placeholder="922 000 0000"
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    CURP
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.curp}
                    onChange={(e) => updateDraftField('curp', e.target.value.toUpperCase())}
                    placeholder="Opcional"
                    style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    RFC
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    value={draft.rfc}
                    onChange={(e) => updateDraftField('rfc', e.target.value.toUpperCase())}
                    placeholder="Opcional"
                    style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                {/* Campos adicionales seleccionados o detectados */}
                {activeExtraFields.map((key) => {
                  const def = EXTRA_EMPLOYEE_FIELDS.find((f) => f.key === key);
                  if (!def) return null;
                  const val = (draft[key] as string) || '';
                  return (
                    <div key={key}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}
                      >
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {def.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraField(key)}
                          title="Quitar campo"
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            lineHeight: 1
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {def.options ? (
                        <select
                          className="input-text"
                          value={val}
                          onChange={(e) => updateDraftField(key, e.target.value)}
                          style={{ fontSize: '12.5px' }}
                        >
                          <option value="">Seleccionar...</option>
                          {def.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input-text"
                          value={val}
                          onChange={(e) => updateDraftField(key, e.target.value)}
                          placeholder={def.placeholder || ''}
                          style={{
                            fontSize: '12.5px',
                            fontFamily: def.mono ? 'var(--font-mono)' : undefined
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selector para agregar más campos del expediente del empleado */}
              {activeExtraFields.length < EXTRA_EMPLOYEE_FIELDS.length && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '6px',
                    borderTop: '1px dashed var(--border-subtle)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro campo:</span>
                  </div>
                  <select
                    className="input-text"
                    value={fieldToAdd}
                    onChange={(e) => handleAddExtraField(e.target.value)}
                    style={{
                      fontSize: '12px',
                      maxWidth: '280px',
                      padding: '5px 10px',
                      height: '32px'
                    }}
                  >
                    <option value="">Elegir campo del empleado...</option>
                    {['Datos Laborales', 'Datos Personales', 'Contacto y Domicilio', 'Salud y Uniformes', 'Nómina y Banco'].map(
                      (groupName) => {
                        const groupItems = EXTRA_EMPLOYEE_FIELDS.filter(
                          (f) => f.group === groupName && !activeExtraFields.includes(f.key)
                        );
                        if (groupItems.length === 0) return null;
                        return (
                          <optgroup key={groupName} label={groupName}>
                            {groupItems.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </optgroup>
                        );
                      }
                    )}
                  </select>
                </div>
              )}

              {draft.certifications.length > 0 && (
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Award className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                    <span>Cursos y certificaciones detectadas ({draft.certifications.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {draft.certifications.map((cert, idx) => (
                      <span
                        key={`${cert.name}-${idx}`}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {cert.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: 'var(--surface)'
          }}
        >
          <button type="button" onClick={handleClose} className="btn btn-secondary" style={{ fontSize: '12.5px' }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!draft}
            className="btn btn-primary"
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: draft ? 1 : 0.5,
              cursor: draft ? 'pointer' : 'not-allowed'
            }}
          >
            <span>Cargar en Registro del Personal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
