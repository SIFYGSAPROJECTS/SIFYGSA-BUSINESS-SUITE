import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  RefreshCw,
  Building2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { sanitizeCleanText } from '../../utils/formShield';

const CALENDAR_STORAGE_KEY = 'sifygsa_erp_calendar_v1';

interface EventoCalendario {
  id: string;
  titulo: string;
  categoria: 'guardia' | 'sil3' | 'entrevista' | 'contrato';
  fecha: string;
  hora: string;
  sede: string;
  cuadrilla?: string;
  responsable?: string;
  urgente?: boolean;
}

const EVENTOS_INICIALES: EventoCalendario[] = [
  {
    id: '1',
    titulo: 'Inducción de Seguridad Industrial Tula',
    categoria: 'sil3',
    fecha: '2026-09-25',
    hora: '09:00 hrs',
    sede: 'Minatitlán, Ver.',
    cuadrilla: 'Cuadrilla Alfa',
    urgente: true
  },
  {
    id: '2',
    titulo: 'Junta Operativa Minatitlán',
    categoria: 'guardia',
    fecha: '2026-09-25',
    hora: '14:30 hrs',
    sede: 'Minatitlán, Ver.',
    cuadrilla: 'Cuadrilla Base Mapachapa'
  },
  {
    id: '3',
    titulo: 'Entrevista Ing. Mecatrónico F&G',
    categoria: 'entrevista',
    fecha: '2026-09-25',
    hora: '16:00 hrs',
    sede: 'Comalcalco, Tab.',
    responsable: 'Candidato: Ing. M. Torres'
  },
  {
    id: '4',
    titulo: 'Guardia de Fin de Semana (24h)',
    categoria: 'guardia',
    fecha: '2026-09-26',
    hora: '08:00 hrs',
    sede: 'Mapachapa, Ver.',
    cuadrilla: '4 Brigadistas F&G'
  },
  {
    id: '5',
    titulo: 'Inspección de Equipos y Sensores',
    categoria: 'sil3',
    fecha: '2026-09-26',
    hora: '11:00 hrs',
    sede: 'Minatitlán, Ver.',
    cuadrilla: 'Revisión EPP'
  },
  {
    id: '6',
    titulo: 'Relevo de Turnos Técnicos',
    categoria: 'guardia',
    fecha: '2026-09-27',
    hora: '19:00 hrs',
    sede: 'Comalcalco, Tab.',
    cuadrilla: 'Base Comalcalco & Minatitlán'
  },
  {
    id: '7',
    titulo: 'Auditoría Certificación Técnica TÜV',
    categoria: 'sil3',
    fecha: '2026-09-28',
    hora: '08:30 hrs',
    sede: 'Minatitlán, Ver.',
    urgente: true
  },
  {
    id: '8',
    titulo: 'Entrevista Instrumentación',
    categoria: 'entrevista',
    fecha: '2026-09-28',
    hora: '15:00 hrs',
    sede: 'Minatitlán, Ver.',
    responsable: 'Candidato: L. Fernández'
  },
  {
    id: '9',
    titulo: 'Mantenimiento Preventivo de Sensores',
    categoria: 'sil3',
    fecha: '2026-09-29',
    hora: '10:00 hrs',
    sede: 'Xalapa, Ver.',
    cuadrilla: 'Laboratorio F&G'
  },
  {
    id: '10',
    titulo: 'Cierre de Bitácora y Guardias',
    categoria: 'contrato',
    fecha: '2026-09-30',
    hora: '13:00 hrs',
    sede: 'Minatitlán, Ver.',
    responsable: 'Recursos Humanos'
  }
];

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
}

// Función para sintetizar el título en 2 o 3 palabras clave para la celda mensual
const getShortEventTitle = (titulo: string) => {
  const t = titulo.toLowerCase();
  if (t.includes('inducción')) return 'Inducción Seg.';
  if (t.includes('guardia')) return 'Guardia 24h';
  if (t.includes('junta')) return 'Junta Operativa';
  if (t.includes('entrevista')) return 'Entrevista';
  if (t.includes('auditoría')) return 'Auditoría TÜV';
  if (t.includes('sensores') || t.includes('inspección') || t.includes('mantenimiento')) return 'Rev. Sensores';
  if (t.includes('relevo')) return 'Relevo Turnos';
  if (t.includes('bitácora') || t.includes('cierre')) return 'Cierre Bitácora';

  // Si no coincide con las reglas, recortar a máximo 2 palabras
  const words = titulo.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
};

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  selectedLocation
}) => {
  const [vista, setVista] = useState<'mes' | 'semana' | 'agenda'>('mes');
  const [sedeFiltro, setSedeFiltro] = useState<string>(selectedLocation || 'Minatitlán, Ver.');
  const [currentMonth, setCurrentMonth] = useState<string>('Septiembre 2026');
  const [selectedDay, setSelectedDay] = useState<number>(25);
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => {
    try {
      const saved = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return EVENTOS_INICIALES;
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2500);
  };

  // Formulario de nuevo evento
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'guardia' | 'sil3' | 'entrevista' | 'contrato'>('guardia');
  const [newTime, setNewTime] = useState('10:00 hrs');
  const [newSquad, setNewSquad] = useState('Cuadrilla Alfa');
  const [newUrgent] = useState(false);

  // Sincronizar automáticamente la sede del filtro con la del header principal
  useEffect(() => {
    if (selectedLocation) {
      setSedeFiltro(selectedLocation);
    }
  }, [selectedLocation]);

  if (!isOpen) return null;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('¡Sincronizado!');
    }, 800);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim().length < 2) {
      showToast('¡Falta título!');
      return;
    }

    const dayStr = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;
    const nuevo: EventoCalendario = {
      id: `ev-${Date.now()}`,
      titulo: newTitle.trim(),
      categoria: newCategory,
      fecha: `2026-09-${dayStr}`,
      hora: newTime.trim() || '10:00 hrs',
      sede: sedeFiltro === 'Todas' ? 'Minatitlán, Ver.' : sedeFiltro,
      cuadrilla: newSquad.trim() || 'Cuadrilla Alfa',
      urgente: newUrgent
    };

    const nextEventos = [nuevo, ...eventos];
    setEventos(nextEventos);
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(nextEventos));
    } catch {
      // Ignore quota
    }
    setNewTitle('');
    setShowAddForm(false);
    showToast('¡Guardado!');
  };

  // Filtrar eventos por la sede seleccionada
  const eventosFiltrados = eventos.filter((e) => {
    if (!sedeFiltro || sedeFiltro === 'Todas') return true;
    const cleanFilter = sedeFiltro.toLowerCase().replace(', ver.', '').replace(', tab.', '').replace(', camp.', '').replace(', yuc.', '').trim();
    return e.sede.toLowerCase().includes(cleanFilter);
  });

  const getBadgeCategoryStyle = (cat: EventoCalendario['categoria']) => {
    switch (cat) {
      case 'guardia':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          color: '#047857',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          dot: '#10B981'
        };
      case 'sil3':
        return {
          bg: 'rgba(29, 78, 216, 0.1)',
          color: 'var(--primary)',
          border: '1px solid rgba(29, 78, 216, 0.35)',
          dot: 'var(--primary)'
        };
      case 'entrevista':
        return {
          bg: 'rgba(14, 165, 233, 0.1)',
          color: '#0369A1',
          border: '1px solid rgba(14, 165, 233, 0.35)',
          dot: '#0EA5E9'
        };
      case 'contrato':
        return {
          bg: 'rgba(217, 119, 6, 0.1)',
          color: '#B45309',
          border: '1px solid rgba(217, 119, 6, 0.35)',
          dot: '#F59E0B'
        };
      default:
        return {
          bg: 'var(--surface-alt)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          dot: 'var(--text-muted)'
        };
    }
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
        backdropFilter: 'blur(5px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '1140px',
          width: '100%',
          padding: '0',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: '16px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. HEADER DEL MODAL                                      */}
        {/* ========================================================= */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-50)',
                border: '1px solid var(--brand-300)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Calendario Operativo &amp; Recursos Humanos
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'var(--brand-50)',
                    color: 'var(--primary)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid var(--brand-200)'
                  }}
                >
                  SIFYSUITE 2026
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Monitoreo de guardias 24h, cursos normativos SIL-3 y citas de reclutamiento.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ width: '32px', height: '32px' }}
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. BARRA DE CONTROLES, VISTAS Y FILTROS                   */}
        {/* ========================================================= */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--surface)'
          }}
        >
          {/* Navegación de Mes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setCurrentMonth('Agosto 2026')}
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                minWidth: '130px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)'
              }}
            >
              {currentMonth}
            </span>
            <button
              type="button"
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setCurrentMonth('Octubre 2026')}
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth('Septiembre 2026');
                setSelectedDay(25);
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Hoy
            </button>
          </div>

          {/* Selector de Vista (Mes / Semana / Agenda) */}
          <div
            style={{
              display: 'flex',
              padding: '3px',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {(['mes', 'semana', 'agenda'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  backgroundColor: vista === v ? 'var(--surface)' : 'transparent',
                  color: vista === v ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: vista === v ? 800 : 600,
                  boxShadow: vista === v ? 'var(--shadow-xs)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Selector de Sede y Botón Nuevo Evento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                fontSize: '12px'
              }}
            >
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <select
                value={sedeFiltro}
                onChange={(e) => setSedeFiltro(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="Minatitlán, Ver.">Minatitlán, Ver.</option>
                <option value="Comalcalco, Tab.">Comalcalco, Tab.</option>
                <option value="Mapachapa, Ver.">Mapachapa, Ver.</option>
                <option value="Xalapa, Ver.">Xalapa, Ver.</option>
                <option value="Ciudad del Carmen, Camp.">Ciudad del Carmen</option>
                <option value="Mérida, Yuc.">Mérida, Yuc.</option>
                <option value="Todas">Todas las Sedes</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* Toast flotante 1 a 3 palabras */}
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              top: '22px',
              right: '24px',
              zIndex: 9999,
              backgroundColor: '#047857',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Formulario desplegable para nuevo evento */}
        {showAddForm && (
          <form
            onSubmit={handleAddEvent}
            style={{
              padding: '14px 24px',
              backgroundColor: 'var(--surface-alt)',
              borderBottom: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Título del evento o guardia..."
              value={newTitle}
              onChange={(e) => {
                const { value, hadInvalid } = sanitizeCleanText(e.target.value, 65);
                if (hadInvalid) showToast('¡Carácter inválido!');
                setNewTitle(value);
              }}
              className="input-text"
              style={{ paddingLeft: '10px' }}
              required
            />

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="select-control"
              style={{ height: '36px' }}
            >
              <option value="guardia">Guardia Técnica</option>
              <option value="sil3">Capacitación / SIL-3</option>
              <option value="entrevista">Entrevista RRHH</option>
              <option value="contrato">Vencimiento Contrato</option>
            </select>

            <input
              type="text"
              placeholder="08:00 hrs"
              value={newTime}
              onChange={(e) => {
                const { value, hadInvalid } = sanitizeCleanText(e.target.value, 20);
                if (hadInvalid) showToast('¡Carácter inválido!');
                setNewTime(value);
              }}
              className="input-text"
              style={{ paddingLeft: '10px' }}
            />

            <input
              type="text"
              placeholder="Cuadrilla / Brigada"
              value={newSquad}
              onChange={(e) => {
                const { value, hadInvalid } = sanitizeCleanText(e.target.value, 45);
                if (hadInvalid) showToast('¡Carácter inválido!');
                setNewSquad(value);
              }}
              className="input-text"
              style={{ paddingLeft: '10px' }}
            />

            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '11.5px' }}>
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
                style={{ fontSize: '11.5px' }}
              >
                ✕
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* 3. CUERPO DEL MODAL: CALENDARIO (1fr) + PANEL LATERAL (340px) */}
        {/* ========================================================= */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            minHeight: '440px'
          }}
        >
          {/* Columna Izquierda: Vista según pestaña (Mes / Semana / Agenda) */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border-subtle)', minWidth: 0 }}>
            {vista === 'mes' && (
              <>
                {/* Cuadrícula Unificada con Columnas Equitativas (minmax(0, 1fr)) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: '1px',
                    backgroundColor: 'var(--border)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  {/* Encabezados de los 7 Días */}
                  {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d) => (
                    <div
                      key={d}
                      style={{
                        padding: '8px 4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--surface-alt)'
                      }}
                    >
                      {d}
                    </div>
                  ))}

                  {/* Celdas del Mes de Septiembre 2026 (Empieza en Martes 1) */}
                  {/* Desplazamiento inicial: 1 celda vacía para Lunes */}
                  <div style={{ minHeight: '80px', backgroundColor: 'var(--surface-alt)', opacity: 0.4 }} />

                  {Array.from({ length: 30 }).map((_, i) => {
                    const dia = i + 1;
                    const esHoy = dia === 25;
                    const isSelected = selectedDay === dia;
                    const diaStr = dia < 10 ? `0${dia}` : `${dia}`;
                    const fechaStr = `2026-09-${diaStr}`;
                    const eventosDelDia = eventosFiltrados.filter((e) => e.fecha === fechaStr);

                    return (
                      <div
                        key={dia}
                        onClick={() => setSelectedDay(dia)}
                        style={{
                          minHeight: '80px',
                          height: '82px',
                          padding: '6px',
                          backgroundColor: isSelected
                            ? 'var(--brand-50)'
                            : esHoy
                            ? 'var(--surface)'
                            : 'var(--surface)',
                          outline: isSelected ? '2px solid var(--primary)' : 'none',
                          outlineOffset: '-2px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all var(--transition-fast)',
                          minWidth: 0,
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: isSelected || esHoy ? 800 : 600,
                              backgroundColor: esHoy ? 'var(--primary)' : 'transparent',
                              color: esHoy ? '#ffffff' : isSelected ? 'var(--primary)' : 'var(--text-primary)'
                            }}
                          >
                            {dia}
                          </span>
                          {esHoy && (
                            <span
                              style={{
                                fontSize: '8.5px',
                                fontWeight: 900,
                                color: 'var(--primary)',
                                letterSpacing: '0.04em'
                              }}
                            >
                              HOY
                            </span>
                          )}
                        </div>

                        {/* Píldoras compactas sintetizadas (1 a 3 palabras clave) para flujo limpio */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', overflow: 'hidden' }}>
                          {eventosDelDia.slice(0, 2).map((ev) => {
                            const badgeSt = getBadgeCategoryStyle(ev.categoria);
                            const shortTitle = getShortEventTitle(ev.titulo);

                            return (
                              <div
                                key={ev.id}
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: badgeSt.bg,
                                  color: badgeSt.color,
                                  border: badgeSt.border,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`${ev.titulo} (${ev.hora})`}
                              >
                                <span
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: badgeSt.dot,
                                    flexShrink: 0
                                  }}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {shortTitle}
                                </span>
                              </div>
                            );
                          })}

                          {/* Contador si hay más de 2 tareas en el día */}
                          {eventosDelDia.length > 2 && (
                            <span style={{ fontSize: '9px', color: 'var(--brand-700)', fontWeight: 800, paddingLeft: '2px' }}>
                              +{eventosDelDia.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 4 celdas vacías al final para completar la cuadrícula de 35 (5 filas x 7 cols) */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`end-${i}`} style={{ minHeight: '80px', backgroundColor: 'var(--surface-alt)', opacity: 0.3 }} />
                  ))}
                </div>

                {/* Leyenda Semántica al Pie */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '11.5px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Guardia Técnica / Relevo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Capacitación &amp; SIL-3</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0EA5E9' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Entrevista / Candidatos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Vencimiento Contrato</span>
                  </div>
                </div>
              </>
            )}

            {vista === 'semana' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Semana Operativa Activa (25 Sep - 01 Oct 2026)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
                  {['Vie 25', 'Sáb 26', 'Dom 27', 'Lun 28', 'Mar 29', 'Mié 30', 'Jue 01'].map((dia, idx) => (
                    <div
                      key={dia}
                      style={{
                        padding: '12px 8px',
                        backgroundColor: idx === 0 ? 'var(--brand-50)' : 'var(--surface-alt)',
                        borderRadius: '8px',
                        border: idx === 0 ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>{dia}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {idx === 0 ? '2 Guardias' : idx === 1 ? 'Turno 24h' : 'Programado'}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Turnos operativos rotativos: <strong>Turno A</strong> (08:00 - 16:00), <strong>Turno B</strong> (16:00 - 00:00) y <strong>Guardia Continua 24h</strong>.
                </div>
              </div>
            )}

            {vista === 'agenda' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Bitácora Cronológica Completa
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {eventosFiltrados.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          {ev.titulo}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {ev.fecha} · {ev.hora} · {ev.sede}
                        </div>
                      </div>
                      <span className="badge badge-primary">{ev.categoria}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Próximas Asignaciones y Acciones (340px) */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--surface-alt)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '14px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Próximas Asignaciones
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Día {selectedDay} de Septiembre
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>
                  {eventosFiltrados.filter((e) => e.fecha === `2026-09-${selectedDay < 10 ? `0${selectedDay}` : selectedDay}`).length} Registradas
                </span>
              </div>

              {/* Lista de tarjetas del día */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {eventosFiltrados
                  .filter((e) => e.fecha === `2026-09-${selectedDay < 10 ? `0${selectedDay}` : selectedDay}`)
                  .map((ev) => {
                    const badgeSt = getBadgeCategoryStyle(ev.categoria);
                    return (
                      <div
                        key={ev.id}
                        className="card"
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: badgeSt.bg,
                              color: badgeSt.color,
                              border: badgeSt.border
                            }}
                          >
                            {ev.hora}
                          </span>

                          {ev.urgente && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: 'var(--danger)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Urgente
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                          {ev.titulo}
                        </h4>

                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{ev.sede}</span>
                          {ev.cuadrilla && <span>• {ev.cuadrilla}</span>}
                          {ev.responsable && <span>• {ev.responsable}</span>}
                        </div>
                      </div>
                    );
                  })}

                {eventosFiltrados.filter((e) => e.fecha === `2026-09-${selectedDay < 10 ? `0${selectedDay}` : selectedDay}`).length === 0 && (
                  <div
                    style={{
                      padding: '30px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}
                  >
                    No hay asignaciones registradas para esta fecha y sede.
                  </div>
                )}
              </div>
            </div>

            {/* Acciones al pie del panel lateral con ancho garantizado */}
            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Outlook / Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('Redirigiendo a /rrhh/calendario-operativo (Pantalla completa de cuadrículas extendidas)');
                  onClose();
                }}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 0',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Ver Calendario Completo (Ruta Completa)</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
