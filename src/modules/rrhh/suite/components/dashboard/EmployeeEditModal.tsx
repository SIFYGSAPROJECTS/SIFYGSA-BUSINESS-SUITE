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
  Unlock
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
  toRawDigits,
  isValidEmail,
  loadPersistedEmployees,
  savePersistedEmployees,
  checkDuplicateEmployeeIdentifiers,
  logHrAuditAction
} from '../../utils/formShield';

interface EmployeeEditModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (updated: Employee) => void;
}

type TabType = 'general' | 'contacto' | 'laboral' | 'nomina';

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  employee,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Employee>(() =>
    employee ? { ...employee } : ({ ...EMPLOYEES[0] } as Employee)
  );
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLegalUnlocked, setIsLegalUnlocked] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        clabe: employee.clabe ? formatClabeMask(employee.clabe).formatted : employee.clabe
      });
      setActiveTab('general');
      setIsLegalUnlocked(false);
    }
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [employee]);

  if (!employee) return null;

  // Manejo de carga de fotografía
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          photoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
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
    if (!isValidEmail(formData.email)) {
      setActiveTab('contacto');
      triggerToast('¡Correo inválido!');
      return;
    }
    if (formData.clabe && toRawDigits(formData.clabe).length > 0 && toRawDigits(formData.clabe).length !== 18) {
      setActiveTab('nomina');
      triggerToast('¡CLABE a 18 dígitos!');
      return;
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

    const rawNewClabe = formData.clabe ? toRawDigits(formData.clabe) : undefined;
    const rawOldClabe = employee.clabe ? toRawDigits(employee.clabe) : undefined;

    const updatedEmployee: Employee = {
      ...formData,
      name: formData.name.trim(),
      position: formData.position.trim(),
      initials: newInitials,
      clabe: rawNewClabe
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
        details: 'Actualización de datos operativos, contacto o dotación EPP.',
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
          maxWidth: '720px',
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
              Actualización de ficha técnica, fotografía, domicilio particular y asignaciones operativas
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

        {/* Pestañas de Navegación del Modal */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            backgroundColor: 'var(--surface-alt)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            marginBottom: '18px',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'general' as TabType, label: 'General & Foto', icon: User },
            { id: 'contacto' as TabType, label: 'Contacto & Domicilio', icon: MapPin },
            { id: 'laboral' as TabType, label: 'Laboral & Fiscal', icon: Briefcase },
            { id: 'nomina' as TabType, label: 'EPP, Salud & Nómina', icon: CreditCard }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;
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
                    Fotografía de Credencial / Perfil
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Sube una foto clara de frente en formato JPG, PNG o WEBP para su credencialización.
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
                    DEPARTAMENTO ASIGNADO
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subsidiaria y Ubicación / Sucursal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    EMPRESA / SUBSIDIARIA
                  </label>
                  <select
                    value={formData.subsidiary || 'SIFYGSA'}
                    onChange={(e) => setFormData({ ...formData, subsidiary: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="SIFYGSA">SIFYGSA S.A. de C.V.</option>
                    <option value="VIPSA">VIPSA S.A. de C.V.</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    BASE DE TRABAJO / SUCURSAL
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="Minatitlán, Ver.">Minatitlán, Ver. (Almacén Principal)</option>
                    <option value="Mapachapa, Ver.">Base Mapachapa Km 18 (Minatitlán, Ver.)</option>
                    <option value="Comalcalco, Tab.">Comalcalco, Tab. (Base Operativa)</option>
                    <option value="Xalapa, Ver.">Xalapa, Ver. (Corporativo Regional)</option>
                    <option value="Ciudad del Carmen, Camp.">Ciudad del Carmen, Camp. (Base Marina)</option>
                  </select>
                </div>
              </div>

              {/* Cuadrilla y Estatus SIL */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    CUADRILLA ASIGNADA
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
              {/* Domicilio Particular */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  DOMICILIO PARTICULAR / DIRECCIÓN COMPLETA
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, número exterior/interior, colonia, C.P., municipio y estado..."
                  rows={3}
                  className="input-text"
                  style={{ width: '100%', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              {/* Teléfonos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TELÉFONO MÓVIL / CELULAR
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '').toLowerCase() })}
                    className="input-text"
                    style={{ width: '100%' }}
                    required
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
                    R.F.C. {!isLegalUnlocked && '🔒'}
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
                    C.U.R.P. {!isLegalUnlocked && '🔒'}
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
                    N.S.S. (IMSS) {!isLegalUnlocked && '🔒'}
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
                    SUPERVISOR / TITULAR INMEDIATO
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
                  <select
                    value={formData.contractType || 'Tiempo Indeterminado (Planta)'}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="Tiempo Indeterminado (Planta)">Tiempo Indeterminado (Planta)</option>
                    <option value="Determinado por Obra">Determinado por Obra</option>
                    <option value="Eventual de Guardia">Eventual de Guardia</option>
                  </select>
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
          {/* PESTAÑA 4: EPP, SALUD & NÓMINA                            */}
          {/* ========================================================= */}
          {activeTab === 'nomina' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {toast && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}
              {/* Dotación EPP */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TALLA CALZADO (MEX)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    maxLength={4}
                    value={formData.shoeSize || ''}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeShoeSize(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo números!');
                      setFormData({ ...formData, shoeSize: value });
                    }}
                    placeholder="Ej. 27.5"
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TALLA DE OVEROL
                  </label>
                  <input
                    type="text"
                    value={formData.coverallSize || ''}
                    onChange={(e) => {
                      const { value, hadInvalid } = sanitizeCleanText(e.target.value, 40);
                      if (hadInvalid) triggerToast('¡Carácter inválido!');
                      setFormData({ ...formData, coverallSize: value });
                    }}
                    placeholder="Ej. Talla 40 / L"
                    className="input-text"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TIPO DE SANGRE
                  </label>
                  <select
                    value={formData.bloodType || 'O Positivo (O+)'}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="O Positivo (O+)">O Positivo (O+)</option>
                    <option value="O Negativo (O-)">O Negativo (O-)</option>
                    <option value="A Positivo (A+)">A Positivo (A+)</option>
                    <option value="A Negativo (A-)">A Negativo (A-)</option>
                    <option value="B Positivo (B+)">B Positivo (B+)</option>
                    <option value="AB Positivo (AB+)">AB Positivo (AB+)</option>
                  </select>
                </div>
              </div>

              {/* Banco y CLABE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    INSTITUCIÓN BANCARIA
                  </label>
                  <select
                    value={formData.bank || 'BBVA México (Bancomer)'}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="BBVA México (Bancomer)">BBVA México (Bancomer)</option>
                    <option value="Banorte">Banorte</option>
                    <option value="Santander México">Santander México</option>
                    <option value="Citibanamex">Citibanamex</option>
                    <option value="HSBC México">HSBC México</option>
                    <option value="Scotiabank">Scotiabank</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    CLABE INTERBANCARIA (18 DÍGITOS)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={22}
                    value={formData.clabe || ''}
                    onChange={(e) => {
                      const { formatted, hadInvalid } = formatClabeMask(e.target.value);
                      if (hadInvalid) triggerToast('¡Solo dígitos!');
                      setFormData({ ...formData, clabe: formatted });
                    }}
                    placeholder="0121-8000-1234-5678-90"
                    className="input-text"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    NOMBRE CONTACTO DE EMERGENCIA
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
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TELÉFONO DE EMERGENCIA
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
