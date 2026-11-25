'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  UserPlus,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileUp
} from 'lucide-react';
import { Employee } from '../../types';
import { EMPLOYEES } from '../../data/mockData';
import {
  readCsvFileWithEncoding,
  parseEmployeesFromCsvOrText,
  buildQuickEmployeeRecord,
  getNextEmployeeFolio,
  downloadCsvFile,
  loadPersistedEmployees,
  savePersistedEmployees,
  logHrAuditAction,
  matchesNormalizedSearch
} from '../../utils/formShield';

interface QuickEntryRow {
  key: string;
  name: string;
  position: string;
  department: string;
  location: string;
  email: string;
  phoneCell: string;
}

const createEmptyQuickRow = (): QuickEntryRow => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  position: '',
  department: '',
  location: 'Minatitlán, Ver.',
  email: '',
  phoneCell: ''
});

interface EmployeeBatchImportModalProps {
  isOpen: boolean;
  initialMode?: 'csv' | 'quick';
  existingEmployees: Employee[];
  availableDepartments: string[];
  onClose: () => void;
  onSwitchToCv?: () => void;
  onImported: (addedCount: number, skippedCount: number, modeLabel: string) => void;
}

export const EmployeeBatchImportModal: React.FC<EmployeeBatchImportModalProps> = ({
  isOpen,
  initialMode = 'csv',
  existingEmployees,
  availableDepartments,
  onClose,
  onSwitchToCv,
  onImported
}) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'quick'>(initialMode);
  const [rawCsvText, setRawCsvText] = useState('');
  const [loadedFileName, setLoadedFileName] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExistingMissing, setUpdateExistingMissing] = useState(true);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'new' | 'dup'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [quickRows, setQuickRows] = useState<QuickEntryRow[]>(() => [
    createEmptyQuickRow(),
    createEmptyQuickRow(),
    createEmptyQuickRow()
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMsg(null);
    }
  }, [isOpen, initialMode]);

  const parsedCsv = useMemo(() => {
    if (!rawCsvText.trim()) {
      return {
        rows: [],
        detectedHeader: false,
        detectedColumns: [] as string[],
        totalParsed: 0,
        readyToImportCount: 0,
        duplicateCount: 0
      };
    }
    return parseEmployeesFromCsvOrText(rawCsvText, existingEmployees, availableDepartments);
  }, [rawCsvText, existingEmployees, availableDepartments]);

  const filteredPreviewRows = useMemo(() => {
    return parsedCsv.rows.filter((item) => {
      if (previewFilter === 'new' && item.isDuplicate) return false;
      if (previewFilter === 'dup' && !item.isDuplicate) return false;
      return matchesNormalizedSearch(
        previewSearch,
        item.employee.name,
        item.employee.department,
        item.employee.position,
        item.employee.nss,
        item.employee.curp
      );
    });
  }, [parsedCsv.rows, previewFilter, previewSearch]);

  const validQuickRows = useMemo(
    () => quickRows.filter((r) => r.name.trim().length > 0),
    [quickRows]
  );

  if (!isOpen) return null;

  const handleFileChange = async (file: File | undefined | null) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();

    if (/\.(pdf|docx?|png|jpe?g|webp)$/i.test(lowerName) || file.type === 'application/pdf' || file.type.startsWith('image/')) {
      setRawCsvText('');
      setLoadedFileName('');
      setErrorMsg(
        'Este archivo es un documento o CV (PDF/Word/Imagen), no un listado CSV. Para subir un CV usa el botón "Importar CV" arriba en el Directorio de Personal.'
      );
      return;
    }

    if (/\.(xlsx?|ods)$/i.test(lowerName)) {
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName =
          workbook.SheetNames.find((name) => {
            const ws = workbook.Sheets[name];
            return ws && XLSX.utils.sheet_to_csv(ws, { blankrows: false }).trim().length > 0;
          }) || workbook.SheetNames[0];

        if (!firstSheetName || !workbook.Sheets[firstSheetName]) {
          setErrorMsg('El archivo de Excel no contiene hojas con datos legibles.');
          return;
        }

        const sheet = workbook.Sheets[firstSheetName];
        const csvFromExcel = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim();
        if (!csvFromExcel) {
          setErrorMsg('La hoja de Excel está vacía.');
          return;
        }

        setRawCsvText(csvFromExcel);
        setLoadedFileName(`${file.name} (${firstSheetName})`);
        setErrorMsg(null);
      } catch {
        setRawCsvText('');
        setLoadedFileName('');
        setErrorMsg('No se pudo leer el archivo de Excel. Verifica que no esté protegido con contraseña.');
      }
      return;
    }

    try {
      const text = await readCsvFileWithEncoding(file);
      if (/[\u0000-\u0008\u000E-\u001F]/.test(text.slice(0, 2000)) || text.startsWith('%PDF-') || text.startsWith('PK\u0003\u0004')) {
        setRawCsvText('');
        setLoadedFileName('');
        setErrorMsg(
          'El archivo contiene datos binarios no legibles como CSV. Verifica que sea un archivo de texto .csv o usa el botón "Importar CV" si es un currículum.'
        );
        return;
      }
      setRawCsvText(text);
      setLoadedFileName(file.name);
      setErrorMsg(null);
    } catch {
      setErrorMsg('No se pudo leer el archivo seleccionado. Verifica que sea un CSV o texto válido.');
    }
  };

  const handleDownloadTemplate = () => {
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
  };

  const handleConfirmCsvImport = () => {
    if (parsedCsv.rows.length === 0) {
      setErrorMsg('Sube un archivo CSV o pega al menos un nombre en el cuadro de texto.');
      return;
    }

    const rawCandidates = skipDuplicates
      ? parsedCsv.rows.filter((r) => !r.isDuplicate).map((r) => r.employee)
      : parsedCsv.rows.map((r) => r.employee);

    const duplicateRowsToEnrich =
      skipDuplicates && updateExistingMissing
        ? parsedCsv.rows.filter((r) => r.isDuplicate && r.matchedExistingId)
        : [];

    if (rawCandidates.length === 0 && duplicateRowsToEnrich.length === 0) {
      setErrorMsg('Todos los registros detectados ya se encuentran guardados (puedes activar "Completar datos faltantes" o desmarcar "Omitir repetidos").');
      return;
    }

    let currentList = loadPersistedEmployees(EMPLOYEES);
    let enrichedCount = 0;

    if (duplicateRowsToEnrich.length > 0) {
      const enrichById = new Map(
        duplicateRowsToEnrich.map((r) => [r.matchedExistingId as string, r.employee])
      );
      currentList = currentList.map((existing) => {
        const incoming = enrichById.get(existing.id);
        if (!incoming) return existing;
        enrichedCount += 1;
        return {
          ...existing,
          firstName: existing.firstName || incoming.firstName,
          paternalSurname: existing.paternalSurname || incoming.paternalSurname,
          maternalSurname: existing.maternalSurname || incoming.maternalSurname,
          nss: existing.nss || incoming.nss,
          rfc: existing.rfc || incoming.rfc,
          curp: existing.curp || incoming.curp,
          bloodType: existing.bloodType || incoming.bloodType,
          position:
            !existing.position || existing.position === 'Por definir'
              ? incoming.position
              : existing.position,
          department:
            !existing.department || existing.department === 'Por asignar'
              ? incoming.department
              : existing.department,
          location: existing.location || incoming.location,
          email: existing.email || incoming.email,
          phoneCell: existing.phoneCell || incoming.phoneCell
        };
      });
    }

    const seenIds = new Set(currentList.map((e) => e.id.trim().toLowerCase()));
    const running = [...currentList];
    const candidates = rawCandidates.map((cand) => {
      if (!seenIds.has(cand.id.trim().toLowerCase())) {
        seenIds.add(cand.id.trim().toLowerCase());
        running.unshift(cand);
        return cand;
      }
      const uniqueId = getNextEmployeeFolio(running);
      const updatedCand = { ...cand, id: uniqueId };
      seenIds.add(uniqueId.toLowerCase());
      running.unshift(updatedCand);
      return updatedCand;
    });

    const updatedList = [...candidates, ...currentList];
    savePersistedEmployees(updatedList);

    if (enrichedCount > 0) {
      logHrAuditAction({
        actionType: 'Edición de Expediente',
        targetRecord: `Actualización inteligente (${enrichedCount} colaboradores)`,
        details: `Se completaron campos faltantes (NSS, RFC, CURP, Sangre, Nombres separados) desde ${loadedFileName || 'Excel/CSV'}.`
      });
    }

    logHrAuditAction({
      actionType: 'Alta de Empleado',
      targetRecord: `${candidates.length} colaborador(es) agregado(s)`,
      details: loadedFileName
        ? `Importación desde archivo "${loadedFileName}". Los datos faltantes quedan listos para completarse desde Editar.`
        : 'Importación directa desde tabla / listado pegado en el Catálogo de Personal.',
      previousValue: `${currentList.length} registros`,
      newValue: `${updatedList.length} registros`,
      severity: 'normal'
    });

    const skippedCount = parsedCsv.rows.length - candidates.length;
    setRawCsvText('');
    setLoadedFileName('');
    onImported(candidates.length, skippedCount, 'CSV');
    onClose();
  };

  const handleConfirmQuickAdd = () => {
    if (validQuickRows.length === 0) {
      setErrorMsg('Escribe al menos el nombre de un colaborador.');
      return;
    }

    const currentList = loadPersistedEmployees(EMPLOYEES);
    const running = [...currentList];
    const newEmployees: Employee[] = [];

    for (const row of validQuickRows) {
      const built = buildQuickEmployeeRecord(
        {
          name: row.name.trim(),
          position: row.position.trim() || 'Por definir',
          department: row.department.trim() || 'Por asignar',
          location: row.location.trim() || 'Minatitlán, Ver.',
          email: row.email.trim().toLowerCase(),
          phoneCell: row.phoneCell.trim() || undefined
        },
        running
      );
      running.unshift(built);
      newEmployees.push(built);
    }

    const updatedList = [...newEmployees, ...currentList];
    savePersistedEmployees(updatedList);

    logHrAuditAction({
      actionType: 'Alta de Empleado',
      targetRecord: `${newEmployees.length} colaborador(es) agregado(s)`,
      details: 'Registro rápido en lote desde el Catálogo de Personal (pendiente de completar expediente en Editar).',
      previousValue: `${currentList.length} registros`,
      newValue: `${updatedList.length} registros`,
      severity: 'normal'
    });

    setQuickRows([createEmptyQuickRow(), createEmptyQuickRow(), createEmptyQuickRow()]);
    onImported(newEmployees.length, 0, 'Captura rápida');
    onClose();
  };

  const updateQuickRow = (key: string, patch: Partial<QuickEntryRow>) => {
    setErrorMsg(null);
    setQuickRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '22px 24px',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-xl)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '14px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Agregar Personal desde Excel, CSV o Lista Rápida
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Importa Excel/CSV y completa datos faltantes en <strong>Editar</strong>.
            </p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            borderRadius: '10px',
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            marginBottom: '14px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('csv');
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '8px 12px',
              borderRadius: '7px',
              border: activeTab === 'csv' ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: activeTab === 'csv' ? 'var(--brand-50)' : 'transparent',
              color: activeTab === 'csv' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTab === 'csv' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel (.xlsx) / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quick');
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '8px 12px',
              borderRadius: '7px',
              border: activeTab === 'quick' ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: activeTab === 'quick' ? 'var(--brand-50)' : 'transparent',
              color: activeTab === 'quick' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTab === 'quick' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Captura Rápida en Lista</span>
          </button>

          {onSwitchToCv && (
            <button
              type="button"
              onClick={onSwitchToCv}
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
              <FileUp className="w-4 h-4" />
              <span>Importar CV (Individual)</span>
            </button>
          )}
        </div>

        {errorMsg && (
          <div
            style={{
              marginBottom: '12px',
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              color: '#92400E',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle className="w-4 h-4" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Contenido Scrolleable */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
          {activeTab === 'csv' ? (
            <>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileChange(e.dataTransfer.files?.[0]);
                }}
                style={{
                  border: '1.5px dashed var(--brand-300)',
                  backgroundColor: 'rgba(37, 99, 235, 0.03)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {loadedFileName ? `Archivo cargado: ${loadedFileName}` : 'Sube tu archivo Excel (.xlsx / .xls) o .CSV aquí'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Acepta cualquier orden o cantidad de columnas (incluso si solo trae nombres y puestos).
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(e) => {
                      handleFileChange(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDownloadTemplate}
                    style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Plantilla CSV</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Elegir Excel / CSV</span>
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    O pega aquí las filas directamente desde Excel / listado:
                  </label>
                  {rawCsvText && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawCsvText('');
                        setLoadedFileName('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-text)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Limpiar texto
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={rawCsvText}
                  onChange={(e) => {
                    setRawCsvText(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder={'Ejemplo:\nNombre, Puesto, Departamento, Correo\nAna Laura Gómez, Auxiliar de Compras, Compras, ana.gomez@sifygsa.com.mx\nLuis Ángel Herrera, Técnico de Campo, Servicios'}
                  className="input-text"
                  style={{
                    width: '100%',
                    height: 'auto',
                    padding: '10px 12px',
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono)',
                    resize: 'vertical'
                  }}
                />
              </div>

              {parsedCsv.rows.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Columnas detectadas automáticamente del Excel/CSV */}
                  {parsedCsv.detectedColumns.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Columnas detectadas:
                      </span>
                      {parsedCsv.detectedColumns.map((col) => (
                        <span
                          key={col}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--brand-50)',
                            color: 'var(--primary)',
                            border: '1px solid var(--brand-200)'
                          }}
                        >
                          ✓ {col}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('all')}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 9px',
                          borderRadius: '999px',
                          border: `1px solid ${previewFilter === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: previewFilter === 'all' ? 'var(--brand-50)' : 'var(--surface)',
                          color: previewFilter === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        Todos ({parsedCsv.totalParsed})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('new')}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 9px',
                          borderRadius: '999px',
                          border: `1px solid ${previewFilter === 'new' ? 'var(--success)' : 'var(--border)'}`,
                          backgroundColor: previewFilter === 'new' ? 'var(--success-bg)' : 'var(--surface)',
                          color: previewFilter === 'new' ? 'var(--success-text)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        Nuevos ({parsedCsv.readyToImportCount})
                      </button>
                      {parsedCsv.duplicateCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewFilter('dup')}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '999px',
                            border: `1px solid ${previewFilter === 'dup' ? '#D97706' : 'var(--border)'}`,
                            backgroundColor: previewFilter === 'dup' ? '#FEF3C7' : 'var(--surface)',
                            color: previewFilter === 'dup' ? '#92400E' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          Ya registrados ({parsedCsv.duplicateCount})
                        </button>
                      )}
                      <input
                        type="text"
                        className="input-text"
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        placeholder="Filtrar vista previa..."
                        style={{ fontSize: '11.5px', height: '28px', width: '165px', padding: '0 9px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                        />
                        <span>Omitir repetidos</span>
                      </label>
                      {skipDuplicates && parsedCsv.duplicateCount > 0 && (
                        <label
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                          title="Completa NSS, RFC, CURP, Tipo de Sangre y nombres separados en los empleados ya registrados sin duplicarlos"
                        >
                          <input
                            type="checkbox"
                            checked={updateExistingMissing}
                            onChange={(e) => setUpdateExistingMissing(e.target.checked)}
                          />
                          <span>Completar datos faltantes en ya registrados</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflowX: 'auto', maxHeight: '240px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '10.5px', fontWeight: 800 }}>
                          <th style={{ padding: '7px 10px' }}>Folio</th>
                          <th style={{ padding: '7px 10px' }}>Nombre(s)</th>
                          <th style={{ padding: '7px 10px' }}>Ap. Paterno</th>
                          <th style={{ padding: '7px 10px' }}>Ap. Materno</th>
                          <th style={{ padding: '7px 10px' }}>Departamento</th>
                          <th style={{ padding: '7px 10px' }}>Puesto</th>
                          <th style={{ padding: '7px 10px' }}>NSS / Sangre</th>
                          <th style={{ padding: '7px 10px' }}>Sede</th>
                          <th style={{ padding: '7px 10px' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPreviewRows.map((item, idx) => (
                          <tr key={`${item.employee.id}-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: skipDuplicates && item.isDuplicate && !updateExistingMissing ? 0.55 : 1 }}>
                            <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.employee.id}</td>
                            <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {item.employee.firstName || item.employee.name}
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {item.employee.paternalSurname || '—'}
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {item.employee.maternalSurname || '—'}
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.employee.department}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.employee.position}>
                              {item.employee.position}
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                              {item.employee.nss || item.employee.curp || '—'}
                              {item.employee.bloodType ? ` · ${item.employee.bloodType}` : ''}
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.employee.location}</td>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                              {item.isDuplicate ? (
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', backgroundColor: updateExistingMissing && skipDuplicates ? 'var(--brand-50)' : '#FEF3C7', color: updateExistingMissing && skipDuplicates ? 'var(--primary)' : '#92400E' }}>
                                  {updateExistingMissing && skipDuplicates ? 'Actualizar faltantes' : item.duplicateReason || 'Repetido'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                                  Listo para agregar
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Solo el <strong>Nombre</strong> es necesario; lo demás puedes dejarlo vacío y completarlo después en <strong>Editar</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setQuickRows((prev) => [...prev, createEmptyQuickRow()])}
                  className="btn btn-secondary"
                  style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar otra fila</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowX: 'auto' }}>
                {quickRows.map((row, idx) => (
                  <div
                    key={row.key}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 1.3fr) minmax(120px, 1fr) minmax(130px, 1fr) minmax(110px, 0.9fr) minmax(130px, 1fr) minmax(105px, 0.85fr) auto',
                      gap: '8px',
                      alignItems: 'center',
                      minWidth: '780px'
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`#${idx + 1} Nombre completo *`}
                      value={row.name}
                      onChange={(e) => updateQuickRow(row.key, { name: e.target.value })}
                      className="input-text"
                      style={{ height: '34px', fontSize: '11.5px', paddingLeft: '8px' }}
                    />
                    <input
                      type="text"
                      placeholder="Puesto (opcional)"
                      value={row.position}
                      onChange={(e) => updateQuickRow(row.key, { position: e.target.value })}
                      className="input-text"
                      style={{ height: '34px', fontSize: '11.5px', paddingLeft: '8px' }}
                    />
                    <select
                      value={row.department}
                      onChange={(e) => updateQuickRow(row.key, { department: e.target.value })}
                      className="select-control"
                      style={{ height: '34px', fontSize: '11.5px' }}
                    >
                      <option value="">Departamento (opc.)</option>
                      {availableDepartments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Sede"
                      value={row.location}
                      onChange={(e) => updateQuickRow(row.key, { location: e.target.value })}
                      className="input-text"
                      style={{ height: '34px', fontSize: '11.5px', paddingLeft: '8px' }}
                    />
                    <input
                      type="email"
                      placeholder="Correo (opcional)"
                      value={row.email}
                      onChange={(e) => updateQuickRow(row.key, { email: e.target.value.replace(/\s/g, '') })}
                      className="input-text"
                      style={{ height: '34px', fontSize: '11.5px', paddingLeft: '8px' }}
                    />
                    <input
                      type="tel"
                      placeholder="Celular (opc.)"
                      value={row.phoneCell}
                      onChange={(e) => updateQuickRow(row.key, { phoneCell: e.target.value })}
                      className="input-text"
                      style={{ height: '34px', fontSize: '11.5px', paddingLeft: '8px' }}
                    />
                    <button
                      type="button"
                      disabled={quickRows.length <= 1}
                      onClick={() => setQuickRows((prev) => prev.filter((r) => r.key !== row.key))}
                      className="btn-icon"
                      title="Quitar fila"
                      style={{
                        color: quickRows.length <= 1 ? 'var(--text-muted)' : 'var(--danger-text)',
                        opacity: quickRows.length <= 1 ? 0.4 : 1,
                        cursor: quickRows.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Los nuevos registros se agregan al catálogo y quedan editables de inmediato.
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            {activeTab === 'csv' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmCsvImport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Agregar {skipDuplicates ? parsedCsv.readyToImportCount : parsedCsv.totalParsed} al Directorio
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmQuickAdd}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar {validQuickRows.length} colaborador(es)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
