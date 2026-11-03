import React, { useState } from 'react';
import {
  Send,
  Check,
  Search,
  Sparkles,
  PartyPopper,
  Building2,
  Mail
} from 'lucide-react';

interface BirthdayItem {
  id: string;
  name: string;
  email: string;
  department: string;
  location: string;
  position: string;
  initials: string;
  avatarBg: string;
  birthDateStr: string; // ej. "26 de Octubre"
  day: number;
  month: string;
  daysRemaining: number; // 0 = hoy, 1 = mañana, etc.
}

const BIRTHDAYS_DATA: BirthdayItem[] = [
  {
    id: 'B-1',
    name: 'Carlos Alberto Tun Culebro',
    email: 'tunccarlos14@gmail.com',
    department: 'Recursos Humanos',
    location: 'Minatitlán, Ver.',
    position: 'Generalista de Recursos Humanos',
    initials: 'CT',
    avatarBg: '#D97706',
    birthDateStr: '26 de Octubre',
    day: 26,
    month: 'Octubre',
    daysRemaining: 0 // ¡Hoy!
  },
  {
    id: 'B-2',
    name: 'Agustín Anastacio Martínez',
    email: 'agustin.anastacio@sifygsa.com.mx',
    department: 'Ingeniería',
    location: 'Minatitlán, Ver.',
    position: 'Administrador de Proyectos',
    initials: 'AM',
    avatarBg: '#1D4ED8',
    birthDateStr: '28 de Octubre',
    day: 28,
    month: 'Octubre',
    daysRemaining: 2
  },
  {
    id: 'B-3',
    name: 'Aurelio Palacios Xolo',
    email: 'aurelio.palacios@sifygsa.com.mx',
    department: 'Compras',
    location: 'Minatitlán, Ver.',
    position: 'Gerente de Compras',
    initials: 'AP',
    avatarBg: '#059669',
    birthDateStr: '03 de Noviembre',
    day: 3,
    month: 'Noviembre',
    daysRemaining: 8
  },
  {
    id: 'B-4',
    name: 'Mtra. Sofía Morales Ruiz',
    email: 'sofia.morales@sifygsa.com.mx',
    department: 'HSE',
    location: 'Minatitlán, Ver.',
    position: 'Coordinadora de Seguridad & Normatividad',
    initials: 'SM',
    avatarBg: '#7C3AED',
    birthDateStr: '12 de Noviembre',
    day: 12,
    month: 'Noviembre',
    daysRemaining: 17
  },
  {
    id: 'B-5',
    name: 'Ing. Carlos Hernández',
    email: 'carlos.hernandez@sifygsa.com.mx',
    department: 'QHSE',
    location: 'Mapachapa, Ver.',
    position: 'Técnico en Detección de Gas',
    initials: 'CH',
    avatarBg: '#374151',
    birthDateStr: '18 de Noviembre',
    day: 18,
    month: 'Noviembre',
    daysRemaining: 23
  },
  {
    id: 'B-6',
    name: 'Ing. Roberto Méndez Cruz',
    email: 'roberto.mendez@sifygsa.com.mx',
    department: 'Medición y Control de Contratos',
    location: 'Comalcalco, Tab.',
    position: 'Especialista en Automatización & Control',
    initials: 'RM',
    avatarBg: '#2563EB',
    birthDateStr: '22 de Noviembre',
    day: 22,
    month: 'Noviembre',
    daysRemaining: 27
  },
  {
    id: 'B-7',
    name: 'Lic. Mariana Valdez Soto',
    email: 'mariana.valdez@sifygsa.com.mx',
    department: 'Capacitación',
    location: 'Minatitlán, Ver.',
    position: 'Analista de Capacitación & Anexos',
    initials: 'MV',
    avatarBg: '#DB2777',
    birthDateStr: '29 de Noviembre',
    day: 29,
    month: 'Noviembre',
    daysRemaining: 34
  },
  {
    id: 'B-8',
    name: 'Ing. Fernando Alarcón Paz',
    email: 'fernando.alarcon@sifygsa.com.mx',
    department: 'Infraestructura',
    location: 'Xalapa, Ver.',
    position: 'Supervisor de Mantenimiento & Redes',
    initials: 'FA',
    avatarBg: '#0891B2',
    birthDateStr: '05 de Diciembre',
    day: 5,
    month: 'Diciembre',
    daysRemaining: 40
  }
];

export const BirthdaysView: React.FC = () => {
  const [filterPeriod, setFilterPeriod] = useState<'todos' | 'proximos' | 'octubre' | 'noviembre'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyTelegramText = (b: BirthdayItem) => {
    const text = `🎉 ¡Feliz Cumpleaños a nuestro compañero(a) ${b.name}! 🎂\n\nDesde el equipo de Recursos Humanos y toda la familia SIFYGSA te deseamos un excelente día lleno de éxitos en tu labor en el área de ${b.department} (${b.location}).\n\n¡Un fuerte abrazo! 🎈👏`;
    navigator.clipboard.writeText(text);
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredBirthdays = BIRTHDAYS_DATA.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterPeriod === 'proximos') return matchesSearch && b.daysRemaining <= 7;
    if (filterPeriod === 'octubre') return matchesSearch && b.month === 'Octubre';
    if (filterPeriod === 'noviembre') return matchesSearch && b.month === 'Noviembre';
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. BANNER FESTIVO CORPORATIVO SIFYGSA */}
      <div
        style={{
          padding: '28px 32px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 50%, #0F172A 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255, 255, 255, 0.15)', fontSize: '11.5px', fontWeight: 700, marginBottom: '12px' }}>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mural de Celebraciones SIFYGSA</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            Cumpleaños &amp; Aniversarios del Personal
          </h1>
          <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '8px', lineHeight: 1.5 }}>
            Consulta las fechas especiales de los colaboradores de Minatitlán y demás sucursales. Genera y copia los mensajes oficiales listos para publicar en el canal de Telegram de la empresa.
          </p>
        </div>

        {/* Decoración festiva sutil de fondo */}
        <div
          style={{
            position: 'absolute',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.15,
            fontSize: '120px',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          🎂
        </div>
      </div>

      {/* 2. BARRA DE FILTROS Y BÚSQUEDA */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          borderRadius: '12px'
        }}
      >
        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px', flex: 1, maxWidth: '380px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search className="w-4 h-4 text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por colaborador o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Pastillas de Período */}
        <div className="filter-tabs-group">
          {[
            { id: 'todos', label: 'Todos (8)' },
            { id: 'proximos', label: '⚡ Próximos 7 días' },
            { id: 'octubre', label: 'Octubre' },
            { id: 'noviembre', label: 'Noviembre' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterPeriod(tab.id as any)}
              className={`filter-tab-pill ${filterPeriod === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MURAL CREATIVO DE TARJETAS DE CUMPLEAÑOS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '18px'
        }}
      >
        {filteredBirthdays.map((b) => {
          const isToday = b.daysRemaining === 0;

          return (
            <div
              key={b.id}
              className="card"
              style={{
                padding: '20px',
                borderRadius: '14px',
                border: isToday ? '2px solid #F59E0B' : '1px solid var(--border)',
                backgroundColor: isToday ? 'rgba(245, 158, 11, 0.04)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isToday ? '0 4px 16px rgba(245, 158, 11, 0.15)' : 'var(--shadow-xs)',
                transition: 'transform var(--transition-fast)'
              }}
            >
              {/* Badge superior de cuenta regresiva */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: isToday ? '#FEF3C7' : 'var(--surface-alt)',
                    color: isToday ? '#B45309' : 'var(--text-secondary)',
                    border: isToday ? '1px solid #FCD34D' : '1px solid var(--border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isToday ? (
                    <>
                      <PartyPopper className="w-3.5 h-3.5 text-amber-600" />
                      <span>¡HOY ES SU CUMPLEAÑOS! 🎂</span>
                    </>
                  ) : b.daysRemaining === 1 ? (
                    <span>¡Mañana! 🎈</span>
                  ) : (
                    <span>En {b.daysRemaining} días</span>
                  )}
                </span>

                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {b.birthDateStr}
                </span>
              </div>

              {/* Perfil del colaborador */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: b.avatarBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  {b.initials}
                  {isToday && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-6px',
                        fontSize: '16px'
                      }}
                      title="Cumpleañero"
                    >
                      👑
                    </span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {b.name}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {b.position}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 className="w-3 h-3 text-muted" />
                    <span>{b.department} · {b.location}</span>
                  </div>
                </div>
              </div>

              {/* Acciones: Botón Telegram y Copiar */}
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={() => copyTelegramText(b)}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: '11.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 12px'
                  }}
                  title="Copiar texto formal para Telegram"
                >
                  {copiedId === b.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span style={{ color: 'var(--success)' }}>¡Copiado para Telegram!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-muted" />
                      <span>Mensaje Telegram</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${b.email}?subject=¡Feliz Cumpleaños ${b.name}! — SIFYGSA`}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Felicitar por correo"
                >
                  <Mail className="w-3.5 h-3.5 text-muted" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BirthdaysView;
