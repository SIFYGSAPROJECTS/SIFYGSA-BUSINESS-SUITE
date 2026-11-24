'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Mail,
  Calendar,
  ShieldCheck,
  Printer,
  Edit2,
  CreditCard,
  HeartPulse,
  FileCheck2,
  Award,
  FileText,
  ExternalLink,
  PhoneCall,
  MapPin,
  Copy,
  Check,
  User,
  Briefcase,
  FolderOpen,
  Phone,
  Droplets,
  AlertCircle
} from 'lucide-react';
import { Employee } from '../../types';
import {
  formatClabeMask,
  formatCardMask,
  getEmployeeProfileCompleteness,
  getDepartmentCode
} from '../../utils/formShield';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

type DetailTab = 'resumen' | 'expediente' | 'salud_nomina';

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('resumen');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('Todas');

  useEffect(() => {
    setActiveTab('resumen');
    setSelectedFolder('Todas');
    setCopiedKey(null);
  }, [employee?.id]);

  useEffect(() => {
    if (!employee) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [employee, onClose]);

  const docsList = employee?.documents || [];

  const folderGroups = useMemo(() => {
    const folders = new Map<string, number>();
    docsList.forEach((doc) => {
      const folderName = (doc.folder || '').trim() || (
        doc.category?.toLowerCase().includes('certificaci') || doc.category?.toLowerCase().includes('curso')
          ? 'Certificaciones'
          : 'Documentos'
      );
      folders.set(folderName, (folders.get(folderName) || 0) + 1);
    });
    return Array.from(folders.entries());
  }, [docsList]);

  const visibleDocs = useMemo(() => {
    if (selectedFolder === 'Todas') return docsList;
    return docsList.filter((doc) => {
      const folderName = (doc.folder || '').trim() || (
        doc.category?.toLowerCase().includes('certificaci') || doc.category?.toLowerCase().includes('curso')
          ? 'Certificaciones'
          : 'Documentos'
      );
      return folderName === selectedFolder;
    });
  }, [docsList, selectedFolder]);

  if (!employee) return null;

  const completeness = getEmployeeProfileCompleteness(employee);
  const isActive = (employee.employmentStatus || 'Activo') === 'Activo';
  const csfStatus =
    employee.taxCertificateStatus || (employee.taxCertificateFileUrl ? 'Vigente' : 'Pendiente');

  const primaryBankAccount =
    employee.bankAccounts && employee.bankAccounts.length > 0
      ? employee.bankAccounts.find((b) => b.isPrimary) || employee.bankAccounts[0]
      : {
          id: 'primary-default',
          bank: employee.bank || 'Pendiente de asignar',
          clabe: employee.clabe || '',
          cardNumber: employee.cardNumber || '',
          alias: 'Nómina',
          isPrimary: true
        };

  const handleCopy = (key: string, value?: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {
      // ignore clipboard errors
    });
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1600);
  };

  const renderCopyBtn = (key: string, value?: string, label = 'Copiar') => {
    if (!value) return null;
    const isCopied = copiedKey === key;
    return (
      <button
        type="button"
        onClick={() => handleCopy(key, value)}
        title={isCopied ? 'Copiado' : label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          border: `1px solid ${isCopied ? 'var(--success-border)' : 'var(--border-subtle)'}`,
          backgroundColor: isCopied ? 'var(--success-bg)' : 'var(--surface)',
          color: isCopied ? 'var(--success)' : 'var(--text-muted)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
      >
        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    );
  };

  const totalDocsCount = docsList.length + (employee.taxCertificateFileUrl ? 1 : 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.62)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(5px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '820px',
          width: '100%',
          padding: 0,
          boxShadow: '0 24px 50px -12px rgba(15, 23, 42, 0.35)',
          borderRadius: '18px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* 1. CABECERA EJECUTIVA (SIN RECORTES NI CÓDIGO DE BARRAS)          */}
        {/* ================================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 58%, #1D4ED8 100%)',
            padding: '22px 24px 20px 24px',
            color: '#FFFFFF',
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          {/* Brillo geométrico sutil en esquina superior derecha */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-40px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(96, 165, 250, 0.24) 0%, rgba(96, 165, 250, 0) 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Fila superior: Empresa + Folio + Botón Cerrar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: '#BFDBFE'
                }}
              >
                Ficha de Colaborador · {employee.subsidiary || 'SIFYGSA'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(147, 197, 253, 0.22)',
                  color: '#EFF6FF',
                  padding: '4px 8px',
                  borderRadius: '7px',
                  border: '1px solid rgba(147, 197, 253, 0.35)',
                  letterSpacing: '0.04em'
                }}
              >
                {getDepartmentCode(employee.department, employee.location)}
              </span>

              <button
                type="button"
                onClick={() => handleCopy('folio', employee.id)}
                title="Copiar folio"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.24)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <span>{employee.id}</span>
                {copiedKey === 'folio' ? (
                  <Check className="w-3 h-3" style={{ color: '#86EFAC' }} />
                ) : (
                  <Copy className="w-3 h-3" style={{ opacity: 0.75 }} />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Cerrar (Esc)"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Identidad principal: Avatar + Nombre completo + Puesto + Meta pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: employee.avatarBg || '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '23px',
                  fontWeight: 700,
                  border: '2.5px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28)'
                }}
              >
                {employee.photoUrl ? (
                  <img
                    src={employee.photoUrl}
                    alt={employee.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  employee.initials
                )}
              </div>
              <span
                title={isActive ? 'Colaborador Activo' : 'Colaborador Inactivo'}
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#22C55E' : '#94A3B8',
                  border: '2.5px solid #1E3A8A'
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    fontSize: '21px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: 0,
                    lineHeight: 1.25,
                    letterSpacing: '-0.015em'
                  }}
                >
                  {employee.name}
                </h2>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    backgroundColor: isActive
                      ? 'rgba(34, 197, 94, 0.22)'
                      : 'rgba(148, 163, 184, 0.25)',
                    color: isActive ? '#BBF7D0' : '#E2E8F0',
                    border: `1px solid ${
                      isActive ? 'rgba(134, 239, 172, 0.35)' : 'rgba(203, 213, 225, 0.3)'
                    }`
                  }}
                >
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '13.5px',
                  color: '#DBEAFE',
                  fontWeight: 500,
                  marginTop: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{employee.position}</span>
                <span style={{ opacity: 0.55 }}>·</span>
                <span>{employee.department}</span>
              </div>

              {/* Badges informativos compactos */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '10px'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    color: '#E0E7FF',
                    backgroundColor: 'rgba(255, 255, 255, 0.11)',
                    padding: '3px 9px',
                    borderRadius: '7px'
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#93C5FD' }} />
                  <span>{employee.location || 'Minatitlán, Ver.'}</span>
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    color: '#E0E7FF',
                    backgroundColor: 'rgba(255, 255, 255, 0.11)',
                    padding: '3px 9px',
                    borderRadius: '7px'
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" style={{ color: '#93C5FD' }} />
                  <span>Ingreso: {employee.hireDate || 'Sin fecha'}</span>
                </span>

                {employee.supervisor && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      color: '#E0E7FF',
                      backgroundColor: 'rgba(255, 255, 255, 0.11)',
                      padding: '3px 9px',
                      borderRadius: '7px'
                    }}
                  >
                    <User className="w-3.5 h-3.5" style={{ color: '#93C5FD' }} />
                    <span>Jefe: {employee.supervisor}</span>
                  </span>
                )}

                {employee.officeExtension && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: '#E0E7FF',
                      backgroundColor: 'rgba(255, 255, 255, 0.11)',
                      padding: '3px 9px',
                      borderRadius: '7px'
                    }}
                  >
                    <Phone className="w-3 h-3" style={{ color: '#93C5FD' }} />
                    <span>Ext. {employee.officeExtension}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. BARRA DE PESTAÑAS INTERACTIVAS                                 */}
        {/* ================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface)',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { id: 'resumen' as const, label: 'Resumen General', icon: User },
              {
                id: 'expediente' as const,
                label: `Expediente Digital (${totalDocsCount})`,
                icon: FolderOpen
              },
              { id: 'salud_nomina' as const, label: 'Salud, EPP y Nómina', icon: HeartPulse }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                    borderBottom: `2.5px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                    marginBottom: '-1px',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease, border-color 0.15s ease'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Badge de Acreditación Técnica en la esquina de tabs */}
          <div style={{ padding: '6px 0' }}>
            <span
              className={`badge ${
                employee.silStatusType === 'success'
                  ? 'badge-success'
                  : employee.silStatusType === 'warning'
                  ? 'badge-warning'
                  : 'badge-info'
              }`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{employee.silStatus || 'En Trámite'}</span>
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. CONTENIDO PRINCIPAL SCROLLEABLE                                */}
        {/* ================================================================= */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: 'var(--app-bg)'
          }}
        >
          {activeTab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Fila 1: Identificación Oficial (3 columnas limpias con Copiar) */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '15px 16px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <FileCheck2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Identificación Oficial
                    </span>
                  </div>
                  {(employee.firstName || employee.paternalSurname) && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {[employee.firstName, employee.paternalSurname, employee.maternalSurname]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {[
                    { key: 'rfc', label: 'RFC (SAT)', value: employee.rfc },
                    { key: 'curp', label: 'CURP', value: employee.curp },
                    { key: 'nss', label: 'NSS (IMSS)', value: employee.nss }
                  ].map((item) => (
                    <div
                      key={item.key}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '9px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: item.value ? 'var(--text-primary)' : 'var(--text-muted)',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.value || 'Sin capturar'}
                        </div>
                      </div>
                      {renderCopyBtn(item.key, item.value, `Copiar ${item.label}`)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fila 2: Bento Grid 2 columnas (Contacto + Datos Laborales) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: '14px'
                }}
              >
                {/* Tarjeta Contacto y Domicilio */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '15px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Mail className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Contacto y Domicilio
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Correo</div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: employee.email ? 'var(--text-primary)' : 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {employee.email || 'Sin correo registrado'}
                        </div>
                        {employee.emailPersonal && employee.emailPersonal !== employee.email && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Personal: {employee.emailPersonal}
                          </div>
                        )}
                      </div>
                      {renderCopyBtn('email', employee.email, 'Copiar correo')}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Teléfonos</div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: employee.phoneCell || employee.phonePrimary ? 'var(--text-primary)' : 'var(--text-muted)'
                          }}
                        >
                          {employee.phoneCell || employee.phonePrimary || 'Sin teléfono'}
                          {employee.phoneCell && employee.phonePrimary ? ` · Fijo: ${employee.phonePrimary}` : ''}
                        </div>
                      </div>
                      {renderCopyBtn('phone', employee.phoneCell || employee.phonePrimary, 'Copiar teléfono')}
                    </div>

                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Domicilio</div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: employee.address ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: 500,
                          lineHeight: 1.4
                        }}
                      >
                        {employee.address || 'Sin domicilio capturado'}
                      </div>
                    </div>

                    {employee.emergencyContact && (
                      <div
                        style={{
                          marginTop: '2px',
                          padding: '9px 11px',
                          borderRadius: '9px',
                          backgroundColor: 'rgba(220, 38, 38, 0.06)',
                          border: '1px solid rgba(220, 38, 38, 0.18)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}
                      >
                        <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--danger)', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ fontSize: '11.5px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--danger-text)', fontSize: '10.5px', textTransform: 'uppercase' }}>
                            Emergencia
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {employee.emergencyContact}
                            {employee.emergencyRelationship ? ` (${employee.emergencyRelationship})` : ''}
                          </div>
                          {employee.emergencyPhone && (
                            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {employee.emergencyPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarjeta Asignación Laboral */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '15px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Briefcase className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Asignación Laboral
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Departamento</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {employee.department}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Tipo de Contrato</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {employee.contractType || 'Tiempo Indeterminado'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Categoría / Cuadrilla</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {employee.squad || 'Sin asignar'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Fecha de Ingreso</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {employee.hireDate || '—'}
                      </div>
                    </div>

                    {employee.salary && (
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Sueldo Mensual</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success-text)', marginTop: '2px' }}>
                          {employee.salary}
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Base / Sede</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {employee.location || 'Minatitlán, Ver.'}
                      </div>
                    </div>
                  </div>

                  {/* Mini resumen rápido de Salud y Nómina al pie de esta tarjeta */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: employee.bloodType ? 'rgba(220, 38, 38, 0.08)' : 'var(--surface-alt)',
                          color: employee.bloodType ? 'var(--danger-text)' : 'var(--text-muted)'
                        }}
                      >
                        <Droplets className="w-3 h-3" />
                        <span>Sangre: {employee.bloodType || 'N/E'}</span>
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--surface-alt)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <CreditCard className="w-3 h-3" style={{ color: 'var(--primary)' }} />
                        <span>{primaryBankAccount.bank}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('salud_nomina')}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                    >
                      Ver detalle →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: EXPEDIENTE DIGITAL (SUBCARPETAS Y ARCHIVOS)              */}
          {/* =============================================================== */}
          {activeTab === 'expediente' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
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
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Documentos y Certificaciones del Expediente
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '999px',
                        backgroundColor:
                          csfStatus === 'Vigente'
                            ? 'var(--success-bg)'
                            : csfStatus === 'En Revisión'
                            ? 'var(--warning-bg)'
                            : 'var(--surface-alt)',
                        color:
                          csfStatus === 'Vigente'
                            ? 'var(--success-text)'
                            : csfStatus === 'En Revisión'
                            ? 'var(--warning-text)'
                            : 'var(--text-muted)',
                        border: `1px solid ${
                          csfStatus === 'Vigente'
                            ? 'var(--success-border)'
                            : csfStatus === 'En Revisión'
                            ? 'var(--warning-border)'
                            : 'var(--border)'
                        }`
                      }}
                    >
                      CSF SAT: {csfStatus === 'Vigente' ? 'Vigente ✓' : csfStatus}
                    </span>

                    {employee.taxCertificateFileUrl && (
                      <a
                        href={employee.taxCertificateFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={employee.taxCertificateFileName || undefined}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--primary)'
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir CSF</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Pills de subcarpetas */}
                {folderGroups.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedFolder('Todas')}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '4px 11px',
                        borderRadius: '999px',
                        border: `1px solid ${selectedFolder === 'Todas' ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: selectedFolder === 'Todas' ? 'var(--brand-50)' : 'var(--surface)',
                        color: selectedFolder === 'Todas' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Todas ({docsList.length})
                    </button>
                    {folderGroups.map(([folderName, count]) => (
                      <button
                        key={folderName}
                        type="button"
                        onClick={() => setSelectedFolder(folderName)}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '4px 11px',
                          borderRadius: '999px',
                          border: `1px solid ${selectedFolder === folderName ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: selectedFolder === folderName ? 'var(--brand-50)' : 'var(--surface)',
                          color: selectedFolder === folderName ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {folderName} ({count})
                      </button>
                    ))}
                  </div>
                )}

                {visibleDocs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {visibleDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--brand-50)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {doc.category?.toLowerCase().includes('certificaci') ||
                            doc.category?.toLowerCase().includes('curso') ? (
                              <Award className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {doc.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {doc.folder ? `${doc.folder} · ` : ''}
                              {doc.category}
                              {doc.issuer ? ` · ${doc.issuer}` : ''}
                            </div>
                          </div>
                        </div>

                        {(doc.fileDataUrl || doc.externalUrl) && (
                          <a
                            href={doc.fileDataUrl || doc.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.fileName || undefined}
                            className="btn btn-secondary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              flexShrink: 0
                            }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '28px 18px',
                      textAlign: 'center',
                      borderRadius: '10px',
                      border: '1px dashed var(--border)',
                      backgroundColor: 'var(--surface-alt)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FolderOpen className="w-8 h-8" style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Sin archivos cargados en el expediente
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '360px' }}>
                      Puedes subir INE, CURP, CSF, CV o certificaciones DC-3 directamente desde la edición del colaborador.
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        onClose();
                        onEdit(employee);
                      }}
                      style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        borderColor: 'var(--brand-200)'
                      }}
                    >
                      Subir documentos en Editar →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: SALUD, EPP Y NÓMINA                                      */}
          {/* =============================================================== */}
          {activeTab === 'salud_nomina' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Salud y Uniformes EPP */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <HeartPulse className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Salud y Uniformes EPP
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: employee.bloodType ? 'rgba(220, 38, 38, 0.1)' : 'var(--surface-alt)',
                      color: employee.bloodType ? 'var(--danger-text)' : 'var(--text-muted)',
                      border: `1px solid ${employee.bloodType ? 'rgba(220, 38, 38, 0.25)' : 'var(--border)'}`
                    }}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Tipo de Sangre: {employee.bloodType || 'Sin especificar'}</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '9px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Calzado (MEX)</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {employee.shoeSize || 'Sin especificar'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '9px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Talla de Overol</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {employee.coverallSize || 'Sin especificar'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '9px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Alergias</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {employee.allergies || 'Ninguna reportada'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <strong>Discapacidad / Ajuste:</strong>{' '}
                    <span style={{ color: 'var(--text-primary)' }}>{employee.disabilityInfo || 'Ninguna'}</span>
                  </div>
                  {employee.chronicConditions && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <strong>Padecimientos:</strong>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{employee.chronicConditions}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nómina (limpia y elegante, sin tarjetas pesadas) */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <CreditCard className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Nómina
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--brand-50)',
                      color: 'var(--primary)',
                      border: '1px solid var(--brand-200)'
                    }}
                  >
                    Cuenta de Nómina
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '9px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Banco</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {primaryBankAccount.bank}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '9px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>CLABE Interbancaria</div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: primaryBankAccount.clabe ? 'var(--text-primary)' : 'var(--text-muted)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {primaryBankAccount.clabe
                          ? formatClabeMask(primaryBankAccount.clabe).formatted
                          : 'Pendiente'}
                      </div>
                    </div>
                    {renderCopyBtn('clabe', primaryBankAccount.clabe, 'Copiar CLABE')}
                  </div>

                  {primaryBankAccount.cardNumber && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '9px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Tarjeta</div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginTop: '2px'
                          }}
                        >
                          {formatCardMask(primaryBankAccount.cardNumber).formatted}
                        </div>
                      </div>
                      {renderCopyBtn('card', primaryBankAccount.cardNumber, 'Copiar tarjeta')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4. PIE FIJO CON PROGRESO DE EXPEDIENTE Y ACCIONES                 */}
        {/* ================================================================= */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0
          }}
        >
          {/* Indicador de completitud + Imprimir */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '7px 12px'
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <div
              title={
                completeness.missingFields.length > 0
                  ? `Faltan: ${completeness.missingFields.join(', ')}`
                  : 'Expediente completo'
              }
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div
                style={{
                  width: '72px',
                  height: '6px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--border-subtle)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${completeness.percent}%`,
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor:
                      completeness.percent >= 85
                        ? 'var(--success)'
                        : completeness.percent >= 55
                        ? 'var(--primary)'
                        : 'var(--warning)'
                  }}
                />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {completeness.percent}% ({completeness.completedCount}/{completeness.totalCount})
              </span>
              {completeness.missingFields.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{completeness.missingFields.length} pend.</span>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ fontSize: '12.5px', padding: '7px 14px' }}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                padding: '7px 16px',
                fontWeight: 700
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Datos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
