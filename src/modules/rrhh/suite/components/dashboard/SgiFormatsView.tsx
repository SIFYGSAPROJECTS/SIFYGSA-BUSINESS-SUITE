import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Check,
  Building,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { Employee } from '../../types';
import { INITIAL_VACATIONS, VacationRecord } from './VacationsSgiView';

interface SgiFormatsViewProps {
  employees: Employee[];
}

export const SgiFormatsView: React.FC<SgiFormatsViewProps> = ({ employees: _employees }) => {
  const [selectedFormat, setSelectedFormat] = useState<'SGI-FR-RH-01' | 'SGI-FR-RH-02' | 'SGI-FR-RH-15'>('SGI-FR-RH-01');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SGI-FR-RH-01: Requisición de Personal
  const [reqPuesto, setReqPuesto] = useState('Técnico Instrumentista Sr.');
  const [reqArea, setReqArea] = useState('Operaciones Técnicas');
  const [reqMotivo, setReqMotivo] = useState('Incremento de Operaciones');
  const [reqSueldo, setReqSueldo] = useState('$24,000.00 MXN');
  const [reqEscolaridad, setReqEscolaridad] = useState('Ingeniería / Técnico Superior');

  // SGI-FR-RH-02: Capacitación DC-3
  const [capCurso, setCapCurso] = useState('Seguridad en Espacios Confinados');
  const [capInstructor, setCapInstructor] = useState('ICIC / Agente STPS');
  const [capHoras, setCapHoras] = useState('16 Horas');
  const [capFecha, setCapFecha] = useState('18 y 19 de Noviembre 2026');

  // SGI-FR-RH-15: Vale de No Adeudo
  const [adeudoEmp, setAdeudoEmp] = useState(INITIAL_VACATIONS[0]?.employeeName || '');
  const [adeudoMotivo, setAdeudoMotivo] = useState('Término de Contrato');
  const [adeudoFecha, setAdeudoFecha] = useState(new Date().toLocaleDateString('es-MX'));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toast Notificación */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <Check className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado Conciso */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-200)'
              }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Formatos SGI
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--brand-100)',
                    color: 'var(--primary)'
                  }}
                >
                  Sistema de Gestión Integrado
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Emisión oficial de documentos institucionales
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Formato</span>
          </button>
        </div>
      </div>

      {/* Selector de Formatos: 1 Clic */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSelectedFormat('SGI-FR-RH-01')}
          className={`btn ${selectedFormat === 'SGI-FR-RH-01' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px' }}
        >
          <Building className="w-4 h-4" />
          <span>SGI-FR-RH-01 · Requisición</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFormat('SGI-FR-RH-02')}
          className={`btn ${selectedFormat === 'SGI-FR-RH-02' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px' }}
        >
          <GraduationCap className="w-4 h-4" />
          <span>SGI-FR-RH-02 · DC-3</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFormat('SGI-FR-RH-15')}
          className={`btn ${selectedFormat === 'SGI-FR-RH-15' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px' }}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>SGI-FR-RH-15 · No Adeudo</span>
        </button>
      </div>

      {/* Formato 1: SGI-FR-RH-01 Requisición de Personal */}
      {selectedFormat === 'SGI-FR-RH-01' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Requisición de Personal (SGI-FR-RH-01)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Solicitud oficial para apertura de nueva plaza o sustitución
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                PUESTO SOLICITADO
              </label>
              <input
                type="text"
                value={reqPuesto}
                onChange={(e) => setReqPuesto(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
                placeholder="Ej. Técnico Instrumentista"
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                DEPARTAMENTO / ÁREA
              </label>
              <input
                type="text"
                value={reqArea}
                onChange={(e) => setReqArea(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                SUELDO ESTIMADO
              </label>
              <input
                type="text"
                value={reqSueldo}
                onChange={(e) => setReqSueldo(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                ESCOLARIDAD MÍNIMA
              </label>
              <input
                type="text"
                value={reqEscolaridad}
                onChange={(e) => setReqEscolaridad(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
              JUSTIFICACIÓN DE LA CONTRATACIÓN
            </label>
            <textarea
              value={reqMotivo}
              onChange={(e) => setReqMotivo(e.target.value)}
              className="input-text"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => showToast('✓ Requisición SGI-FR-RH-01 guardada exitosamente.')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Check className="w-4 h-4" />
              <span>Guardar Requisición</span>
            </button>
          </div>
        </div>
      )}

      {/* Formato 2: SGI-FR-RH-02 Capacitación DC-3 */}
      {selectedFormat === 'SGI-FR-RH-02' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Capacitación & DC-3 (SGI-FR-RH-02)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Registro de capacitación laboral bajo normativa STPS
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                NOMBRE DEL CURSO
              </label>
              <input
                type="text"
                value={capCurso}
                onChange={(e) => setCapCurso(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                INSTRUCTOR O AGENTE CAPACITADOR
              </label>
              <input
                type="text"
                value={capInstructor}
                onChange={(e) => setCapInstructor(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                DURACIÓN
              </label>
              <input
                type="text"
                value={capHoras}
                onChange={(e) => setCapHoras(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                FECHA DE IMPARTICIÓN
              </label>
              <input
                type="text"
                value={capFecha}
                onChange={(e) => setCapFecha(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => showToast('✓ Registro DC-3 guardado correctamente.')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Check className="w-4 h-4" />
              <span>Guardar Registro</span>
            </button>
          </div>
        </div>
      )}

      {/* Formato 3: SGI-FR-RH-15 Vale de No Adeudo */}
      {selectedFormat === 'SGI-FR-RH-15' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Vale de No Adeudo (SGI-FR-RH-15)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Liberación patrimonial de activos, uniformes y herramientas
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                COLABORADOR
              </label>
              <select
                value={adeudoEmp}
                onChange={(e) => setAdeudoEmp(e.target.value)}
                className="select-control"
                style={{ width: '100%', height: '36px' }}
              >
                {INITIAL_VACATIONS.map((v: VacationRecord) => (
                  <option key={v.id} value={v.employeeName}>
                    {v.employeeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                MOTIVO DE LIBERACIÓN
              </label>
              <input
                type="text"
                value={adeudoMotivo}
                onChange={(e) => setAdeudoMotivo(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                FECHA EFECTIVA
              </label>
              <input
                type="text"
                value={adeudoFecha}
                onChange={(e) => setAdeudoFecha(e.target.value)}
                className="input-text"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => showToast('✓ Vale de No Adeudo emitido exitosamente.')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Check className="w-4 h-4" />
              <span>Emitir Vale</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
