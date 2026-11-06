import React, { useState, useMemo, useEffect } from 'react';
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
  Eye,
  Calendar,
  CalendarPlus,
  CreditCard,
  UserPlus,
  Palmtree,
  FileText,
  ArrowRight
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

type QuickDateFilter = 'todos' | 'hoy' | '7dias' | 'quincena' | 'especifica';

export const HrAuditLogModal: React.FC<HrAuditLogModalProps> = ({ isOpen, onClose }) => {
  const logs = useSyncedHrAuditLogs();
  const [activeOperatorId, setActiveOperatorIdState] = useState<string>(() => getActiveHrOperator().id);
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'todos' | 'sensible' | 'critico' | 'pendiente'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtros de Fecha Inteligente
  const [dateFilter, setDateFilter] = useState<QuickDateFilter>('todos');
  const [specificDate, setSpecificDate] = useState<string>('');

  // Modales de Detalle y Agendar Seguimiento
  const [selectedLogDetail, setSelectedLogDetail] = useState<HrAuditLogEntry | null>(null);
  const [managerNoteInput, setManagerNoteInput] = useState('');
  const [schedulingLog, setSchedulingLog] = useState<HrAuditLogEntry | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledNote, setScheduledNote] = useState('');

  // Toast Notificaciones
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Hora de última sincronización en vivo
  const [lastSyncTime, setLastSyncTime] = useState<string>('hace unos segundos');

  useEffect(() => {
    const handleStorageUpdate = () => setLastSyncTime('hace unos segundos');
    window.addEventListener('sifygsa-storage-update', handleStorageUpdate);
    const interval = setInterval(() => {
      setLastSyncTime('en tiempo real');
    }, 45000);
    return () => {
      window.removeEventListener('sifygsa-storage-update', handleStorageUpdate);
      clearInterval(interval);
    };
  }, []);

  const triggerToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const handleOperatorChange = (newOpId: string) => {
    setActiveOperatorIdState(newOpId);
    setActiveHrOperator(newOpId);
    triggerToast('¡Operador activo actualizado!', 'success');
  };

  // Helper para analizar y categorizar fechas de cada log
  const parseLogDate = (timestampStr: string) => {
    try {
      const parts = timestampStr.split(/[·-]/).map((p) => p.trim());
      const datePart = parts[0] || '';
      const timePart = parts[1] || '';
      const [dayStr, monthStr, yearStr] = datePart.split('/');
      const day = Number(dayStr);
      const month = Number(monthStr);
      const year = Number(yearStr);
      
      const logDate = new Date(year, month - 1, day);
      const now = new Date();
      
      const isToday =
        logDate.getDate() === now.getDate() &&
        logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear();

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        logDate.getDate() === yesterday.getDate() &&
        logDate.getMonth() === yesterday.getMonth() &&
        logDate.getFullYear() === yesterday.getFullYear();

      const diffDays = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 3600 * 24));

      const meses = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      const mesNombre = meses[month - 1] || monthStr;
      const readableDate = `${String(day).padStart(2, '0')} ${mesNombre} ${year}`;

      // ISO YYYY-MM-DD para comparar con input type="date"
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        logDate,
        datePart,
        readableDate,
        timePart: timePart || '',
        isToday,
        isYesterday,
        diffDays,
        isoDate
      };
    } catch {
      return {
        logDate: new Date(),
        datePart: timestampStr,
        readableDate: timestampStr,
        timePart: '',
        isToday: false,
        isYesterday: false,
        diffDays: 0,
        isoDate: ''
      };
    }
  };

  // Categorías humanas con íconos distintivos
  const getCategoryMeta = (actionType: HrAuditLogEntry['actionType']) => {
    switch (actionType) {
      case 'Cambio Bancario CLABE':
        return {
          label: 'Nómina & CLABE',
          icon: CreditCard,
          color: '#D97706',
          bg: 'rgba(217, 119, 6, 0.12)',
          border: 'rgba(217, 119, 6, 0.35)'
        };
      case 'Alta de Empleado':
        return {
          label: 'Alta de Personal',
          icon: UserPlus,
          color: '#1D4ED8',
          bg: 'rgba(29, 78, 216, 0.12)',
          border: 'rgba(29, 78, 216, 0.35)'
        };
      case 'Solicitud Vacaciones':
        return {
          label: 'Vacaciones SGI',
          icon: Palmtree,
          color: '#059669',
          bg: 'rgba(5, 150, 105, 0.12)',
          border: 'rgba(5, 150, 105, 0.35)'
        };
      case 'Corrección Dato Oficial':
        return {
          label: 'Dato Oficial SAT/IMSS',
          icon: AlertTriangle,
          color: '#DC2626',
          bg: 'rgba(220, 38, 38, 0.12)',
          border: 'rgba(220, 38, 38, 0.35)'
        };
      case 'Catálogo Departamentos':
        return {
          label: 'Organigrama / Deptos',
          icon: ShieldCheck,
          color: '#0891B2',
          bg: 'rgba(8, 145, 178, 0.12)',
          border: 'rgba(8, 145, 178, 0.35)'
        };
      default:
        return {
          label: 'Expediente Digital',
          icon: FileText,
          color: 'var(--text-secondary)',
          bg: 'var(--surface-alt)',
          border: 'var(--border)'
        };
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Filtro por Operador de RRHH
      const matchesOp =
        selectedOperatorFilter === 'todos' || log.operatorName === selectedOperatorFilter;

      // 2. Filtro por Estado / Severidad
      const matchesSev =
        selectedSeverityFilter === 'todos'
          ? true
          : selectedSeverityFilter === 'pendiente'
          ? log.managerDecision === 'Pendiente'
          : log.severity === selectedSeverityFilter;

      // 3. Filtro por Categoría Humana
      const matchesCat =
        selectedCategoryFilter === 'todos' || log.actionType === selectedCategoryFilter;

      // 4. Filtro por Fecha Inteligente
      const dateMeta = parseLogDate(log.timestamp);
      let matchesDate = true;
      if (dateFilter === 'hoy') {
        matchesDate = dateMeta.isToday;
      } else if (dateFilter === '7dias') {
        matchesDate = dateMeta.diffDays >= 0 && dateMeta.diffDays <= 7;
      } else if (dateFilter === 'quincena') {
        matchesDate = dateMeta.diffDays >= 0 && dateMeta.diffDays <= 15;
      } else if (dateFilter === 'especifica' && specificDate) {
        matchesDate = dateMeta.isoDate === specificDate;
      }

      // 5. Búsqueda libre
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.targetRecord.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.operatorName.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        (log.previousValue && log.previousValue.toLowerCase().includes(q)) ||
        (log.newValue && log.newValue.toLowerCase().includes(q));

      return matchesOp && matchesSev && matchesCat && matchesDate && matchesSearch;
    });
  }, [
    logs,
    selectedOperatorFilter,
    selectedSeverityFilter,
    selectedCategoryFilter,
    dateFilter,
    specificDate,
    searchQuery
  ]);

  const totalPending = useMemo(
    () => logs.filter((l) => l.managerDecision === 'Pendiente').length,
    [logs]
  );
  const totalSensitive = useMemo(
    () => logs.filter((l) => l.severity === 'sensible' || l.severity === 'critico').length,
    [logs]
  );

  if (!isOpen) return null;

  const handleDecision = (
    logId: string,
    decision: HrAuditLogEntry['managerDecision'],
    note?: string
  ) => {
    updateHrAuditDecision(logId, decision, note);
    if (selectedLogDetail && selectedLogDetail.id === logId) {
      setSelectedLogDetail({
        ...selectedLogDetail,
        managerDecision: decision,
        managerNote: note !== undefined ? note : selectedLogDetail.managerNote
      });
    }
    triggerToast(
      decision === 'Aprobado' ? '¡Movimiento aprobado con éxito!' : '¡Marcado en revisión gerencial!',
      decision === 'Aprobado' ? 'success' : 'warning'
    );
  };

  const handleScheduleFollowup = () => {
    if (!schedulingLog) return;
    try {
      const scheduledTasksKey = 'sifygsa_rrhh_scheduled_reviews_v1';
      const existingRaw = localStorage.getItem(scheduledTasksKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const newTask = {
        id: `REV-${Date.now()}`,
        logId: schedulingLog.id,
        targetRecord: schedulingLog.targetRecord,
        actionType: schedulingLog.actionType,
        scheduledDate: scheduledDate || 'Próximo corte',
        note: scheduledNote.trim() || 'Revisión y validación física con colaborador',
        operator: schedulingLog.operatorName,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(scheduledTasksKey, JSON.stringify([newTask, ...existing]));
      window.dispatchEvent(new Event('sifygsa-storage-update'));
      triggerToast('¡Revisión programada en la agenda!', 'success');
      setSchedulingLog(null);
      setScheduledDate('');
      setScheduledNote('');
    } catch {
      triggerToast('¡Error al agendar revisión!', 'warning');
    }
  };

  const handleExportAuditCsv = () => {
    downloadCsvFile(
      'Bitacora_Supervision_RRHH_SIFYGSA.csv',
      [
        'Folio Auditoría',
        'Fecha y Hora',
        'Responsable RH',
        'Puesto en RH',
        'Acción Operativa',
        'Colaborador / Documento',
        'Detalle del Movimiento',
        'Valor Previo',
        'Valor Nuevo',
        'Nivel de Sensibilidad',
        'Dictamen de Gerencia',
        'Observación Gerencial'
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
    triggerToast('¡Reporte Excel generado con éxito!', 'success');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        backdropFilter: 'blur(5px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '1280px',
          width: '96%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          padding: 0,
          backgroundColor: 'var(--card)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Notificación Toast Flotante */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '28px',
              zIndex: 9999,
              backgroundColor: toast.type === 'success' ? '#047857' : '#D97706',
              color: '#FFFFFF',
              padding: '12px 22px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease-out'
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

        {/* ====================================================================
           1. CABECERA EJECUTIVA: TÍTULO, BADGE EN VIVO Y ACCIONES
           ==================================================================== */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            padding: '18px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  SUPERVISIÓN EJECUTIVA
                </span>
                
                {/* Indicador EN VIVO con pulso verde */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#6EE7B7'
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 8px #10B981'
                    }}
                  />
                  <span>En Vivo • {lastSyncTime}</span>
                </div>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Bitácora de Auditoría y Control de Actividades RRHH
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportAuditCsv}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.15s ease'
              }}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Cerrar Bitácora"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ====================================================================
           2. TARJETAS DE INDICADORES RÁPIDOS Y OPERADOR ACTIVO
           ==================================================================== */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Métricas clave ejecutivas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Movimientos Totales
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {logs.length} registros auditables
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
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Cambios Bancarios / Salarios
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#D97706' }}>
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
              <AlertTriangle className="w-4 h-4" style={{ color: totalPending > 0 ? '#DC2626' : '#059669' }} />
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Pendiente Firma Gerencia
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: totalPending > 0 ? '#DC2626' : '#059669' }}>
                  {totalPending} por validar
                </div>
              </div>
            </div>
          </div>

          {/* Trazabilidad: Operador Activo en Sesión */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--surface)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          >
            <UserCheck className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Operador en sesión:
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

        {/* ====================================================================
           3. BARRA DE FILTRO INTELIGENTE DE FECHAS (LO QUE SOLICITÓ EL USUARIO)
           ==================================================================== */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Selector de Rango de Fechas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Período:
            </span>

            {[
              { id: 'todos', label: 'Todo el Historial' },
              { id: 'hoy', label: '🟢 Hoy' },
              { id: '7dias', label: 'Últimos 7 días' },
              { id: 'quincena', label: 'Esta Quincena' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setDateFilter(f.id as QuickDateFilter);
                  setSpecificDate('');
                }}
                className={`filter-chip ${dateFilter === f.id && !specificDate ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '4px 10px', height: '28px' }}
              >
                {f.label}
              </button>
            ))}

            {/* Input para Elegir Fecha Específica */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  setDateFilter('especifica');
                }}
                className="input-text"
                style={{
                  height: '28px',
                  fontSize: '11.5px',
                  padding: '2px 8px',
                  width: '135px',
                  fontWeight: 600,
                  backgroundColor: specificDate ? 'var(--brand-50)' : 'var(--surface)',
                  borderColor: specificDate ? 'var(--primary)' : 'var(--border)'
                }}
                title="Elegir fecha puntual"
              />
              {specificDate && (
                <button
                  type="button"
                  onClick={() => {
                    setSpecificDate('');
                    setDateFilter('todos');
                  }}
                  className="btn-icon"
                  style={{ width: '26px', height: '26px', fontSize: '11px' }}
                  title="Limpiar fecha"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Búsqueda rápida por texto libre */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '360px' }}>
            <Search
              className="w-4 h-4 text-muted"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por colaborador, CLABE, acción o folio..."
              className="input-text"
              style={{ paddingLeft: '32px', width: '100%', height: '32px', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* ====================================================================
           4. CHIPS DE CATEGORÍA DE ACCIONES & FILTRO POR OPERADOR
           ==================================================================== */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          {/* Chips temáticos con ícono para identificación instantánea */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Filtrar Tipo:
            </span>

            {[
              { id: 'todos', label: 'Todos' },
              { id: 'Cambio Bancario CLABE', label: '💳 Nómina & CLABE' },
              { id: 'Alta de Empleado', label: '👤 Altas' },
              { id: 'Solicitud Vacaciones', label: '🏖️ Vacaciones' },
              { id: 'Corrección Dato Oficial', label: '⚠️ Datos Oficiales' }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.id)}
                className={`filter-chip ${selectedCategoryFilter === c.id ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '3px 9px' }}
              >
                {c.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setSelectedSeverityFilter(
                  selectedSeverityFilter === 'pendiente' ? 'todos' : 'pendiente'
                )
              }
              className={`filter-chip ${selectedSeverityFilter === 'pendiente' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                padding: '3px 9px',
                borderColor: '#DC2626',
                color: selectedSeverityFilter === 'pendiente' ? '#FFFFFF' : '#DC2626',
                backgroundColor: selectedSeverityFilter === 'pendiente' ? '#DC2626' : 'transparent',
                fontWeight: 700
              }}
            >
              ⏳ Solo Pendientes ({totalPending})
            </button>
          </div>

          {/* Selector de personal de RRHH */}
          <select
            value={selectedOperatorFilter}
            onChange={(e) => setSelectedOperatorFilter(e.target.value)}
            className="select-control"
            style={{ height: '30px', fontSize: '11.5px', fontWeight: 600 }}
          >
            <option value="todos">Todo el personal de RRHH</option>
            {HR_TEAM_OPERATORS.map((op) => (
              <option key={op.id} value={op.name}>
                {op.name}
              </option>
            ))}
          </select>
        </div>

        {/* ====================================================================
           5. TABLA NARRATIVA Y HUMANA: REGISTRO FORMAL DE AUDITORÍA ERP
           ==================================================================== */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 20px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search className="w-8 h-8" style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No se encontraron movimientos registrados
              </div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Prueba cambiando el rango de fechas o los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <table
              className="corporate-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'auto'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border)',
                    textAlign: 'left',
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  <th style={{ padding: '10px 8px', width: '18%' }}>FECHA Y HORA EXACTA</th>
                  <th style={{ padding: '10px 8px', width: '17%' }}>OPERADOR RESPONSABLE</th>
                  <th style={{ padding: '10px 8px', width: '25%' }}>MOVIMIENTO Y COLABORADOR</th>
                  <th style={{ padding: '10px 8px', width: '22%' }}>TRAZABILIDAD DEL CAMBIO</th>
                  <th style={{ padding: '10px 8px', width: '9%' }}>DICTAMEN</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', width: '9%' }}>
                    GESTIÓN
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const dateMeta = parseLogDate(log.timestamp);
                  const catMeta = getCategoryMeta(log.actionType);
                  const CatIcon = catMeta.icon;

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="hover:bg-slate-50"
                    >
                      {/* 1. FECHA Y HORA (Con segundos exactos y folio formal) */}
                      <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                              {dateMeta.isToday
                                ? `Hoy (${dateMeta.readableDate})`
                                : dateMeta.isYesterday
                                ? `Ayer (${dateMeta.readableDate})`
                                : dateMeta.readableDate}
                            </span>
                          </div>

                          {/* Hora exacta con segundos */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: 800,
                                color: '#1E40AF',
                                backgroundColor: '#DBEAFE',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                letterSpacing: '0.01em',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Clock className="w-3 h-3 text-blue-700" />
                              <span>{dateMeta.timePart || '12:00:00 hrs'}</span>
                            </div>

                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--surface-alt)',
                                border: '1px solid var(--border)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              {log.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. OPERADOR RESPONSABLE (RRHH) */}
                      <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              backgroundColor: log.operatorColor,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 900,
                              flexShrink: 0
                            }}
                          >
                            {log.operatorInitials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px' }}>
                              {log.operatorName}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                              {log.operatorRole}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. MOVIMIENTO Y COLABORADOR */}
                      <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                        <div style={{ marginBottom: '3px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              color: catMeta.color,
                              backgroundColor: catMeta.bg,
                              border: `1px solid ${catMeta.border}`,
                              padding: '1px 7px',
                              borderRadius: '4px'
                            }}
                          >
                            <CatIcon className="w-3 h-3" />
                            <span>{catMeta.label}</span>
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px' }}>
                          {log.targetRecord}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {log.details}
                        </div>
                      </td>

                      {/* 4. TRAZABILIDAD DEL CAMBIO (VALOR ANTERIOR VS ACTUAL) */}
                      <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--surface-alt)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          {log.previousValue && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              <span style={{ fontWeight: 700, marginRight: '4px', color: 'var(--text-secondary)' }}>
                                Valor previo:
                              </span>
                              <span style={{ textDecoration: 'line-through' }}>{log.previousValue}</span>
                            </div>
                          )}
                          {log.newValue && (
                            <div
                              style={{
                                fontWeight: 800,
                                color: '#047857',
                                fontSize: '11.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '10.5px' }}>
                                Modificado a:
                              </span>
                              <ArrowRight className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span>{log.newValue}</span>
                            </div>
                          )}
                        </div>

                        {log.managerNote && (
                          <div
                            style={{
                              marginTop: '4px',
                              fontSize: '10.5px',
                              color: '#92400E',
                              fontWeight: 700,
                              backgroundColor: '#FEF3C7',
                              border: '1px solid #FDE68A',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}
                          >
                            Instrucción: {log.managerNote}
                          </div>
                        )}
                      </td>

                      {/* 5. DICTAMEN GERENCIAL (ESTADO DE AUTORIZACIÓN) */}
                      <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                        <span
                          className={`badge ${
                            log.managerDecision === 'Aprobado'
                              ? 'badge-success'
                              : log.managerDecision === 'En Revisión'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                          style={{ fontSize: '10px', fontWeight: 800, padding: '3px 7px' }}
                          title={
                            log.managerDecision === 'Aprobado'
                              ? 'Validado y autorizado por Gerencia de RRHH'
                              : log.managerDecision === 'Pendiente'
                              ? 'En espera de visto bueno de Gerencia'
                              : 'En proceso de aclaración o comprobación'
                          }
                        >
                          {log.managerDecision === 'Aprobado' && '✓ '}
                          {log.managerDecision}
                        </span>
                      </td>

                      {/* 6. GESTIÓN OPERATIVA */}
                      <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {log.managerDecision !== 'Aprobado' && (
                            <button
                              type="button"
                              onClick={() => handleDecision(log.id, 'Aprobado')}
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 7px',
                                fontSize: '10.5px',
                                color: '#047857',
                                borderColor: '#A7F3D0',
                                fontWeight: 800,
                                backgroundColor: 'var(--surface)'
                              }}
                              title="Aprobar cambio de conformidad"
                            >
                              Aprobar
                            </button>
                          )}

                          {/* Botón "+ Agendar" */}
                          <button
                            type="button"
                            onClick={() => {
                              setSchedulingLog(log);
                              setScheduledDate('');
                              setScheduledNote(`Seguimiento con ${log.targetRecord}`);
                            }}
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 7px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              backgroundColor: 'var(--surface)'
                            }}
                            title="Agendar seguimiento a la Agenda Semanal"
                          >
                            <CalendarPlus className="w-3 h-3" />
                            <span>Agendar</span>
                          </button>

                          {/* Botón Ver Ficha */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLogDetail(log);
                              setManagerNoteInput(log.managerNote || '');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', fontSize: '10.5px', fontWeight: 700, backgroundColor: 'var(--surface)' }}
                            title="Ver ficha completa de auditoría"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ====================================================================
           6. SUB-MODAL: ANOTAR OBSERVACIÓN O MARCAR EN REVISIÓN
           ==================================================================== */}
        {selectedLogDetail && (
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: 'var(--surface-alt)',
              borderTop: '2px solid var(--primary)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Dictamen Gerencial para: <span style={{ color: 'var(--primary)' }}>{selectedLogDetail.id}</span> • {selectedLogDetail.targetRecord}
              </div>
              <input
                type="text"
                value={managerNoteInput}
                onChange={(e) => {
                  const { value, hadInvalid } = sanitizeCleanText(e.target.value, 110);
                  if (hadInvalid) triggerToast('¡Carácter inválido!', 'warning');
                  setManagerNoteInput(value);
                }}
                placeholder="Escribe instrucción u observación oficial de la Gerente de RRHH..."
                className="input-text"
                style={{ width: '100%', fontSize: '12px', height: '32px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  handleDecision(selectedLogDetail.id, 'En Revisión', managerNoteInput.trim());
                  setSelectedLogDetail(null);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', fontWeight: 700 }}
              >
                Marcar En Revisión
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

        {/* ====================================================================
           7. SUB-MODAL: AGENDAR SEGUIMIENTO A LA AGENDA SEMANAL
           ==================================================================== */}
        {schedulingLog && (
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: 'rgba(29, 78, 216, 0.06)',
              borderTop: '2px solid var(--primary)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}
              >
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Programar Seguimiento Operativo en Agenda Semanal
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Movimiento: {schedulingLog.actionType} • {schedulingLog.targetRecord}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input-text"
                style={{ height: '32px', fontSize: '12px', width: '140px' }}
                title="Fecha programada de la cita / revisión"
              />
              <input
                type="text"
                value={scheduledNote}
                onChange={(e) => setScheduledNote(e.target.value)}
                placeholder="Instrucción de seguimiento..."
                className="input-text"
                style={{ height: '32px', fontSize: '12px', minWidth: '220px' }}
              />
              <button
                type="button"
                onClick={handleScheduleFollowup}
                className="btn btn-primary"
                style={{ height: '32px', fontSize: '12px', fontWeight: 700 }}
              >
                Guardar en Agenda
              </button>
              <button
                type="button"
                onClick={() => setSchedulingLog(null)}
                className="btn btn-secondary"
                style={{ height: '32px', fontSize: '12px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
