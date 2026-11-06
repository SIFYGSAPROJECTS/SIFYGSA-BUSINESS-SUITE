import React from 'react';
import {
  X,
  Mail,
  Building2,
  Calendar,
  ShieldCheck,
  Printer,
  Edit2,
  CreditCard,
  HeartPulse,
  FileCheck2
} from 'lucide-react';
import { Employee } from '../../types';
import { formatClabeMask } from '../../utils/formShield';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  onEdit
}) => {
  if (!employee) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(3px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-card)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: employee.avatarBg || 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                flexShrink: 0,
                border: '1.5px solid var(--border)'
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
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {employee.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Folio: <strong style={{ fontFamily: 'var(--font-mono)' }}>{employee.id}</strong> · {employee.subsidiary}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Información Principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Puesto & Especialidad
            </span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px' }}>
              {employee.position}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              {employee.department}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Ubicación & Cuadrilla
            </span>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '4px', fontSize: '13px' }}>
              {employee.location}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              {employee.squad}
            </div>
          </div>
        </div>

        {/* Estatus de Certificación Técnica */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-control)',
            backgroundColor:
              employee.silStatusType === 'success'
                ? 'rgba(22, 163, 74, 0.08)'
                : employee.silStatusType === 'warning'
                ? 'rgba(217, 119, 6, 0.08)'
                : 'rgba(29, 78, 216, 0.08)',
            border: `1px solid ${
              employee.silStatusType === 'success'
                ? 'rgba(22, 163, 74, 0.25)'
                : employee.silStatusType === 'warning'
                ? 'rgba(217, 119, 6, 0.25)'
                : 'rgba(29, 78, 216, 0.25)'
            }`,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck
              className="w-5 h-5"
              style={{
                color:
                  employee.silStatusType === 'success'
                    ? 'var(--success)'
                    : employee.silStatusType === 'warning'
                    ? 'var(--warning)'
                    : 'var(--primary)'
              }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Acreditación Técnica: {employee.silStatus}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Validado bajo estándares de Seguridad Industrial STPS
              </div>
            </div>
          </div>

          <span
            className={`badge ${
              employee.silStatusType === 'success'
                ? 'badge-success'
                : employee.silStatusType === 'warning'
                ? 'badge-warning'
                : 'badge-info'
            }`}
          >
            {employee.silStatus}
          </span>
        </div>

        {/* Identificación Oficial Única (Desambiguación de Homónimos) */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--border)',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <FileCheck2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Identificación Legal Única (Control de Homonimia)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>R.F.C. (SAT)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {employee.rfc || 'En validación'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>C.U.R.P.</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px' }}>
                {employee.curp || 'En validación'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>N.S.S. (IMSS)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {employee.nss || 'En validación'}
              </div>
            </div>
          </div>
        </div>

        {/* Datos Bancarios, Salud & Dotación EPP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <CreditCard className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Cuenta de Nómina
              </span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {employee.bank || 'BBVA México'}
            </div>
            <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              CLABE: {employee.clabe ? formatClabeMask(employee.clabe).formatted : 'Pendiente de carátula'}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <HeartPulse className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Salud & Tallas EPP
              </span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Sangre: {employee.bloodType || 'O Positivo (O+)'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Calzado: {employee.shoeSize || '27'} MEX · {employee.coverallSize || 'Talla L'}
            </div>
          </div>
        </div>

        {/* Detalles Complementarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
            <Mail className="w-4 h-4 text-muted" />
            <span style={{ color: 'var(--text-secondary)' }}>Correo:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{employee.email}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
            <Calendar className="w-4 h-4 text-muted" />
            <span style={{ color: 'var(--text-secondary)' }}>Fecha de Ingreso:</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {employee.hireDate}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
            <Building2 className="w-4 h-4 text-muted" />
            <span style={{ color: 'var(--text-secondary)' }}>Empresa Subsidiaria:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{employee.subsidiary}</strong>
          </div>

          {employee.phoneCell && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
              <span style={{ fontSize: '14px' }}>📱</span>
              <span style={{ color: 'var(--text-secondary)' }}>Teléfono Móvil:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{employee.phoneCell}</strong>
            </div>
          )}

          {employee.emergencyContact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
              <span style={{ fontSize: '14px' }}>🚨</span>
              <span style={{ color: 'var(--text-secondary)' }}>Emergencia 24h:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {employee.emergencyContact} {employee.emergencyPhone ? `(${employee.emergencyPhone})` : ''}
              </strong>
            </div>
          )}

          {employee.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px' }}>
              <span style={{ fontSize: '14px' }}>📍</span>
              <span style={{ color: 'var(--text-secondary)' }}>Domicilio Particular:</span>
              <strong style={{ color: 'var(--text-primary)', flex: 1 }}>{employee.address}</strong>
            </div>
          )}
        </div>

        {/* Acciones del pie */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
