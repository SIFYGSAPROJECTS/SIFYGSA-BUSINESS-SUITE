import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  UserCheck,
  Lock,
  Eye
} from 'lucide-react';
import {
  HR_TEAM_OPERATORS,
  getActiveHrOperator,
  setActiveHrOperator,
  useSyncedHrAuditLogs,
  updateHrAuditDecision,
  downloadCsvFile,
  sanitizeCleanText,
  HrAuditLogEntry
} from '../../utils/formShield';

interface HrAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HrAuditLogModal: React.FC<HrAuditLogModalProps> = ({ isOpen, onClose }) => {
  const logs = useSyncedHrAuditLogs();
  const [activeOperatorId, setActiveOperatorIdState] = useState<string>(() => getActiveHrOperator().id);
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('todos');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'todos' | 'sensible' | 'critico' | 'pendiente'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState<HrAuditLogEntry | null>(null);
  const [managerNoteInput, setManagerNoteInput] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleOperatorChange = (newOpId: string) => {
    setActiveOperatorIdState(newOpId);
    setActiveHrOperator(newOpId);
    triggerToast('¡Operador activo!', 'success');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesOp =
        selectedOperatorFilter === 'todos' || log.operatorName === selectedOperatorFilter;
      const matchesSev =
        selectedSeverityFilter === 'todos'
          ? true
          : selectedSeverityFilter === 'pendiente'
          ? log.managerDecision === 'Pendiente'
          : log.severity === selectedSeverityFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        log.targetRecord.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.operatorName.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);

      return matchesOp && matchesSev && matchesSearch;
    });
  }, [logs, selectedOperatorFilter, selectedSeverityFilter, searchQuery]);

  const totalPending = useMemo(
    () => logs.filter((l) => l.managerDecision === 'Pendiente').length,
    [logs]
  );
  const totalSensitive = useMemo(
    () => logs.filter((l) => l.severity === 'sensible' || l.severity === 'critico').length,
    [logs]
  );

  if (!isOpen) return null;

  const handleDecision = (logId: string, decision: HrAuditLogEntry['managerDecision'], note?: string) => {
    updateHrAuditDecision(logId, decision, note);
    if (selectedLogDetail && selectedLogDetail.id === logId) {
      setSelectedLogDetail({
        ...selectedLogDetail,
        managerDecision: decision,
        managerNote: note !== undefined ? note : selectedLogDetail.managerNote
      });
    }
    triggerToast(decision === 'Aprobado' ? '¡Aprobado!' : '¡En revisión!', decision === 'Aprobado' ? 'success' : 'warning');
  };

  const handleExportAuditCsv = () => {
    downloadCsvFile(
      'Bitacora_Gerencia_RRHH_SIFYGSA.csv',
      [
        'Folio Auditoría',
        'Fecha y Hora',
        'Personal RRHH',
        'Puesto RRHH',
        'Acción Realizada',
        'Registro Afectado',
        'Detalle del Movimiento',
        'Valor Anterior',
        'Valor Nuevo',
        'Nivel de Impacto',
        'Dictamen Gerencia RRHH',
        'Nota Gerencial'
      ],
      filteredLogs.map((l) => [
        l.id,
        l.timestamp,
        l.operatorName,
        l.operatorRole,
        l.actionType,
        l.targetRecord,
        l.details,
        l.previousValue || '—',
        l.newValue || '—',
        l.severity.toUpperCase(),
        l.managerDecision,
        l.managerNote || 'Sin observaciones'
      ])
    );
    triggerToast('¡Excel descargado!', 'success');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.68)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '1080px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Flotante 1 a 3 palabras */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '22px',
              right: '24px',
              zIndex: 9999,
              backgroundColor: toast.type === 'success' ? '#047857' : '#D97706',
              color: '#FFFFFF',
              padding: '11px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Cabecera Ejecutiva Exclusiva para Gerencia RRHH */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            padding: '20px 26px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '11px',
                backgroundColor: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  Solo Titular RRHH
                </span>
                <span style={{ fontSize: '11.5px', color: '#93C5FD', fontWeight: 600 }}>
                  Titular: Lic. Valeria Méndez Albores (Gerente de Recursos Humanos)
                </span>
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '4px 0 0 0', color: '#FFFFFF' }}>
                Bitácora de Auditoría y Supervisión Interna de RRHH
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportAuditCsv}
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: '8px',
                padding: '7px 13px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cerrar Bitácora"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Control Operativo y KPIs de Auditoría */}
        <div
          style={{
            padding: '16px 26px',
            backgroundColor: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          {/* Indicadores rápidos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  MOVIMIENTOS REGISTRADOS
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {logs.length} acciones del equipo
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Lock className="w-4 h-4" style={{ color: '#D97706' }} />
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  CAMBIOS BANCARIOS / OFICIALES
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#D97706' }}>
                  {totalSensitive} sensibles
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: totalPending > 0 ? '#DC2626' : '#047857' }} />
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  POR REVISAR GERENCIA
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: totalPending > 0 ? '#DC2626' : '#047857' }}>
                  {totalPending} pendientes
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Operador en Turno de RRHH (Trazabilidad de Usuario) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--surface)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--brand-200)'
            }}
          >
            <UserCheck className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Operador RRHH en sesión:
            </span>
            <select
              value={activeOperatorId}
              onChange={(e) => handleOperatorChange(e.target.value)}
              className="select-control"
              style={{ fontSize: '12px', fontWeight: 700, height: '30px', padding: '0 8px' }}
            >
              {HR_TEAM_OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros de Búsqueda y Personal de RRHH */}
        <div
          style={{
            padding: '14px 26px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', minWidth: '250px' }}>
              <Search
                className="w-4 h-4 text-muted"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por empleado, folio o movimiento..."
                className="input-text"
                style={{ paddingLeft: '32px', width: '100%', height: '34px', fontSize: '12px' }}
              />
            </div>

            <select
              value={selectedOperatorFilter}
              onChange={(e) => setSelectedOperatorFilter(e.target.value)}
              className="select-control"
              style={{ height: '34px', fontSize: '12px' }}
            >
              <option value="todos">Todo el personal de RRHH</option>
              {HR_TEAM_OPERATORS.map((op) => (
                <option key={op.id} value={op.name}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'pendiente', label: 'Pendientes' },
              { id: 'sensible', label: 'Cambios CLABE / Sueldo' },
              { id: 'critico', label: 'Datos Oficiales' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSeverityFilter(tab.id as typeof selectedSeverityFilter)}
                className={`filter-chip ${selectedSeverityFilter === tab.id ? 'active' : ''}`}
                style={{ fontSize: '11.5px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Bitácora Cronológica */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 26px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>FOLIO / FECHA</th>
                <th style={{ padding: '10px 8px' }}>REALIZADO POR (RRHH)</th>
                <th style={{ padding: '10px 8px' }}>ACCIÓN & COLABORADOR</th>
                <th style={{ padding: '10px 8px' }}>CAMBIO REGISTRADO (ANTES ➔ AHORA)</th>
                <th style={{ padding: '10px 8px' }}>DICTAMEN GERENCIA</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>ACCIÓN JEFE RRHH</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '12.5px'
                  }}
                >
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)', fontSize: '11.5px' }}>
                      {log.id}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.timestamp}</div>
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '7px',
                          backgroundColor: log.operatorColor,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {log.operatorInitials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>
                          {log.operatorName}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{log.operatorRole}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span
                        className={`badge ${
                          log.severity === 'critico'
                            ? 'badge-danger'
                            : log.severity === 'sensible'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {log.actionType}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>
                      {log.targetRecord}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.details}</div>
                  </td>

                  <td style={{ padding: '12px 8px', fontSize: '11.5px' }}>
                    {log.previousValue && (
                      <div style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {log.previousValue}
                      </div>
                    )}
                    {log.newValue && (
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        ➔ {log.newValue}
                      </div>
                    )}
                    {log.managerNote && (
                      <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#B45309', fontWeight: 600 }}>
                        Nota Gerencia: {log.managerNote}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <span
                      className={`badge ${
                        log.managerDecision === 'Aprobado'
                          ? 'badge-success'
                          : log.managerDecision === 'En Revisión'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}
                    >
                      {log.managerDecision}
                    </span>
                  </td>

                  <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleDecision(log.id, 'Aprobado')}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          color: '#047857',
                          borderColor: '#A7F3D0',
                          fontWeight: 700
                        }}
                        title="Aprobar movimiento como Gerente de RRHH"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLogDetail(log);
                          setManagerNoteInput(log.managerNote || '');
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
                        title="Ver detalle o anotar observación gerencial"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sub-modal rápido para anotar observación del Gerente de RRHH */}
        {selectedLogDetail && (
          <div
            style={{
              padding: '16px 26px',
              backgroundColor: '#FEF3C7',
              borderTop: '2px solid #F59E0B',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', marginBottom: '4px' }}>
                Dictamen Gerencial para {selectedLogDetail.id} ({selectedLogDetail.targetRecord})
              </div>
              <input
                type="text"
                value={managerNoteInput}
                onChange={(e) => {
                  const { value, hadInvalid } = sanitizeCleanText(e.target.value, 110);
                  if (hadInvalid) triggerToast('¡Carácter inválido!', 'warning');
                  setManagerNoteInput(value);
                }}
                placeholder="Escribe instrucción u observación del Gerente de RRHH..."
                className="input-text"
                style={{ width: '100%', backgroundColor: '#FFFFFF', fontSize: '12px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  handleDecision(selectedLogDetail.id, 'En Revisión', managerNoteInput.trim());
                  setSelectedLogDetail(null);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#FFFFFF' }}
              >
                Marcar Revisión
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDecision(selectedLogDetail.id, 'Aprobado', managerNoteInput.trim());
                  setSelectedLogDetail(null);
                }}
                className="btn btn-primary"
                style={{ fontSize: '12px', fontWeight: 700 }}
              >
                Aprobar con Nota
              </button>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="btn btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
