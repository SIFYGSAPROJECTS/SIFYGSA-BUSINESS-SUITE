'use client';

import React, { useState, useMemo } from 'react';

export interface PersonalAgendaEvent {
  id: string;
  dayCol: number; // 0=Lun 9 ... 6=Dom 15
  topPx: number;
  heightPx: number;
  timeRange: string;
  title: string;
  category: 'Agenda Personal' | 'Eventos y Reuniones' | 'Recordatorios' | 'Visitas';
  notes?: string;
  colorType: 'blue' | 'emerald' | 'amber' | 'purple';
}

const WEEK_DAYS = [
  { idx: 0, label: 'LUN', num: '9', fullDate: 'Lun 09 Nov 2026', dayNum: 9, active: false },
  { idx: 1, label: 'MAR', num: '10', fullDate: 'Mar 10 Nov 2026', dayNum: 10, active: false },
  { idx: 2, label: 'MIÉ', num: '11', fullDate: 'Mié 11 Nov 2026', dayNum: 11, active: true },
  { idx: 3, label: 'JUE', num: '12', fullDate: 'Jue 12 Nov 2026', dayNum: 12, active: false },
  { idx: 4, label: 'VIE', num: '13', fullDate: 'Vie 13 Nov 2026', dayNum: 13, active: false },
  { idx: 5, label: 'SÁB', num: '14', fullDate: 'Sáb 14 Nov 2026', dayNum: 14, active: false },
  { idx: 6, label: 'DOM', num: '15', fullDate: 'Dom 15 Nov 2026', dayNum: 15, active: false },
];

const PERSONAL_CALENDARS: Array<{
  label: PersonalAgendaEvent['category'];
  dot: string;
  colorType: PersonalAgendaEvent['colorType'];
}> = [
  { label: 'Agenda Personal', dot: 'bg-primary', colorType: 'blue' },
  { label: 'Eventos y Reuniones', dot: 'bg-emerald-500', colorType: 'emerald' },
  { label: 'Recordatorios', dot: 'bg-amber-500', colorType: 'amber' },
  { label: 'Visitas', dot: 'bg-indigo-500', colorType: 'purple' },
];

export const CalendarioActividadesCrm: React.FC = () => {
  // Calendario en blanco para Eventos y Agenda Personal (sin oportunidades de CRM ni menú superior)
  const [events, setEvents] = useState<PersonalAgendaEvent[]>([]);
  const [calendarScale, setCalendarScale] = useState<'Día' | 'Semana' | 'Mes' | 'Año'>('Semana');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(2);
  const [activeCategories, setActiveCategories] = useState<string[]>(
    PERSONAL_CALENDARS.map((c) => c.label)
  );

  // Modal / Popover para agregar nuevo evento personal (cerrado por defecto para que el calendario inicie limpio en blanco)
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDayIdx, setNewDayIdx] = useState<number>(2);
  const [newStartHour, setNewStartHour] = useState('10:00');
  const [newEndHour, setNewEndHour] = useState('11:00');
  const [newCategory, setNewCategory] =
    useState<PersonalAgendaEvent['category']>('Agenda Personal');
  const [newNotes, setNewNotes] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<PersonalAgendaEvent | null>(null);

  const toggleCategory = (label: string) => {
    setActiveCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const visibleEvents = useMemo(
    () => events.filter((ev) => activeCategories.includes(ev.category)),
    [events, activeCategories]
  );

  const handleOpenSlot = (dayIdx: number, hourStr = '10:00') => {
    setNewTitle('');
    setNewDayIdx(dayIdx);
    setNewStartHour(hourStr);
    const h = parseInt(hourStr.split(':')[0] || '10', 10);
    setNewEndHour(`${String(Math.min(19, h + 1)).padStart(2, '0')}:00`);
    setNewCategory('Agenda Personal');
    setNewNotes('');
    setShowNewEventModal(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const startH = parseInt(newStartHour.split(':')[0] || '10', 10);
    const endH = Math.max(startH + 1, parseInt(newEndHour.split(':')[0] || String(startH + 1), 10));
    const topPx = Math.max(0, (startH - 7) * 60);
    const heightPx = Math.max(54, (endH - startH) * 60);
    const catMeta =
      PERSONAL_CALENDARS.find((c) => c.label === newCategory) || PERSONAL_CALENDARS[0];

    const created: PersonalAgendaEvent = {
      id: `pers-${Date.now()}`,
      dayCol: newDayIdx,
      topPx,
      heightPx,
      timeRange: `${newStartHour} - ${newEndHour}`,
      title: newTitle.trim(),
      category: newCategory,
      notes: newNotes.trim(),
      colorType: catMeta.colorType,
    };

    setEvents((prev) => [...prev, created]);
    setShowNewEventModal(false);
  };

  const colorMap: Record<PersonalAgendaEvent['colorType'], string> = {
    blue: 'bg-primary-fixed/85 border-l-4 border-primary text-on-primary-fixed',
    emerald:
      'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-100',
    amber:
      'bg-amber-500/15 border-l-4 border-amber-500 text-amber-950 dark:text-amber-100',
    purple:
      'bg-indigo-500/15 border-l-4 border-indigo-500 text-indigo-950 dark:text-indigo-100',
  };

  return (
    <div className="sifygsa-tailwind-scope w-full min-h-[calc(100vh-64px)] bg-surface text-on-surface flex flex-col select-none">
      {/* =====================================================================
          BARRA DE NAVEGACIÓN DE AGENDA PERSONAL Y EVENTOS (Sin menú de Kanban/CRM)
          ===================================================================== */}
      <div className="bg-surface-container-lowest border-b border-outline-variant/25 px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenSlot(selectedDayIdx, '10:00')}
            className="bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo Evento</span>
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/30 mx-0.5" />

          <button
            type="button"
            onClick={() => setSelectedDayIdx(2)}
            className="px-3 py-1 rounded-md border border-outline-variant/40 bg-surface-container-low text-xs font-semibold text-on-surface hover:bg-surface-container-high cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setSelectedDayIdx((d) => Math.max(0, d - 1))}
              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDayIdx((d) => Math.min(6, d + 1))}
              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
          <span className="text-sm font-bold text-on-surface">
            9 – 15 de Noviembre 2026
          </span>
          <span className="font-mono text-[11px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">
            Sem 46
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Escala Día / Semana / Mes / Año */}
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/30 text-xs">
            {(['Día', 'Semana', 'Mes', 'Año'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setCalendarScale(sc)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  calendarScale === sc
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          CUERPO PRINCIPAL: CALENDARIO EN BLANCO DE EVENTOS Y AGENDA PERSONAL
          ===================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Semanal 7 Columnas en Blanco */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">
          {calendarScale === 'Semana' && (
            <>
              {/* Cabecera de Días */}
              <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-outline-variant/25 bg-surface-container-low/50 shrink-0">
                <div className="p-2 text-center font-mono text-[10px] text-outline border-r border-outline-variant/20 flex items-center justify-center">
                  GMT-6
                </div>
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d.num}
                    onClick={() => setSelectedDayIdx(d.idx)}
                    className={`py-2 px-3 text-center border-r border-outline-variant/20 flex flex-col items-center justify-center cursor-pointer ${
                      d.active ? 'bg-primary-fixed/15' : ''
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        d.active ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {d.label}
                    </span>
                    <span
                      className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center font-mono text-sm font-bold ${
                        d.active
                          ? 'bg-error text-on-error shadow-sm'
                          : selectedDayIdx === d.idx
                          ? 'bg-primary text-on-primary'
                          : 'text-on-surface'
                      }`}
                    >
                      {d.num}
                    </span>
                  </div>
                ))}
              </div>

              {/* Contenedor Scrollable de Horas (07:00 a 19:00) */}
              <div className="flex-1 overflow-y-auto relative">
                <div
                  className="grid grid-cols-[64px_repeat(7,1fr)] relative"
                  style={{ height: '780px' }}
                >
                  {/* Columna de Horas */}
                  <div className="border-r border-outline-variant/20 bg-surface-container-low/30 flex flex-col">
                    {[
                      '07:00',
                      '08:00',
                      '09:00',
                      '10:00',
                      '11:00',
                      '12:00',
                      '13:00',
                      '14:00',
                      '15:00',
                      '16:00',
                      '17:00',
                      '18:00',
                      '19:00',
                    ].map((hr) => (
                      <div
                        key={hr}
                        className="h-[60px] pr-2 pt-1 text-right font-mono text-[10px] text-outline border-b border-outline-variant/15"
                      >
                        {hr}
                      </div>
                    ))}
                  </div>

                  {/* 7 Columnas de Días (En blanco, clic en cualquier hora para crear evento personal) */}
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`relative border-r border-outline-variant/20 ${
                        dayIdx === 2
                          ? 'bg-primary-fixed/5'
                          : dayIdx >= 5
                          ? 'bg-surface-container-low/35'
                          : ''
                      }`}
                    >
                      {[
                        '07:00',
                        '08:00',
                        '09:00',
                        '10:00',
                        '11:00',
                        '12:00',
                        '13:00',
                        '14:00',
                        '15:00',
                        '16:00',
                        '17:00',
                        '18:00',
                        '19:00',
                      ].map((hr) => (
                        <div
                          key={hr}
                          onClick={() => handleOpenSlot(dayIdx, hr)}
                          className="h-[60px] border-b border-outline-variant/15 hover:bg-primary-fixed/10 transition-colors cursor-pointer"
                          title={`Agendar evento personal (${hr})`}
                        />
                      ))}

                      {/* Eventos personales que el usuario agregue */}
                      {visibleEvents
                        .filter((ev) => ev.dayCol === dayIdx)
                        .map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            style={{
                              top: `${ev.topPx}px`,
                              height: `${ev.heightPx}px`,
                            }}
                            className={`absolute left-1 right-1 rounded-r-md p-2 shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${colorMap[ev.colorType]}`}
                          >
                            <div>
                              <div className="font-mono text-[10px] font-bold opacity-80">
                                {ev.timeRange}
                              </div>
                              <div className="text-[11px] font-semibold leading-tight line-clamp-2 mt-0.5">
                                {ev.title}
                              </div>
                            </div>
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 w-fit truncate">
                              {ev.category}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}

                  {/* Indicador de Hora Actual (11:45 AM) */}
                  <div
                    className="absolute left-[64px] right-0 flex items-center pointer-events-none z-20"
                    style={{ top: '285px' }}
                  >
                    <span className="bg-error text-on-error font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full -ml-8 shadow-sm">
                      11:45
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-error -ml-1" />
                    <div className="flex-1 h-[2px] bg-error" />
                  </div>
                </div>
              </div>
            </>
          )}

          {calendarScale === 'Día' && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                <div>
                  <span className="text-xs font-bold uppercase text-primary">
                    Agenda Personal del Día
                  </span>
                  <h2 className="text-base font-bold text-on-surface">
                    {WEEK_DAYS[selectedDayIdx]?.fullDate}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSlot(selectedDayIdx, '10:00')}
                  className="bg-primary-container text-on-primary text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
                >
                  + Nuevo Evento
                </button>
              </div>
              {visibleEvents.filter((ev) => ev.dayCol === selectedDayIdx).length === 0 ? (
                <div className="p-10 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/40 rounded-xl">
                  Sin eventos registrados para este día. Haz clic en &ldquo;+ Nuevo Evento&rdquo; para agendar en tu calendario personal.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleEvents
                    .filter((ev) => ev.dayCol === selectedDayIdx)
                    .map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`p-4 rounded-xl shadow-sm cursor-pointer flex items-center justify-between ${colorMap[ev.colorType]}`}
                      >
                        <div>
                          <span className="font-mono text-xs font-bold">{ev.timeRange}</span>
                          <h3 className="text-sm font-bold mt-0.5">{ev.title}</h3>
                          {ev.notes && <p className="text-xs opacity-80">{ev.notes}</p>}
                        </div>
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-black/10 dark:bg-white/10">
                          {ev.category}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {(calendarScale === 'Mes' || calendarScale === 'Año') && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-7 border-t border-l border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                  <div
                    key={d}
                    className="py-2.5 px-3 bg-surface-container-low border-r border-b border-outline-variant/30 text-[11px] font-bold uppercase text-on-surface-variant text-center"
                  >
                    {d}
                  </div>
                ))}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
                  const matchWeek = WEEK_DAYS.find((w) => w.dayNum === dayNum);
                  const dayEvents = matchWeek
                    ? visibleEvents.filter((ev) => ev.dayCol === matchWeek.idx)
                    : [];
                  return (
                    <div
                      key={dayNum}
                      onClick={() => handleOpenSlot(matchWeek ? matchWeek.idx : 2, '10:00')}
                      className={`min-h-[110px] p-2 border-r border-b border-outline-variant/20 flex flex-col gap-1 cursor-pointer hover:bg-surface-container-low/50 ${
                        dayNum === 11 ? 'bg-primary-fixed/10' : ''
                      }`}
                    >
                      <span
                        className={`font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          dayNum === 11
                            ? 'bg-error text-on-error'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-semibold ${colorMap[ev.colorType]}`}
                        >
                          {ev.timeRange.split(' - ')[0]} {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Derecho: Mini Calendario + Mi Agenda Personal */}
        <aside className="w-72 border-l border-outline-variant/25 bg-surface-container-lowest p-4 hidden lg:flex flex-col gap-5 shrink-0 overflow-y-auto">
          {/* Mini Mes Noviembre 2026 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-on-surface">
                Noviembre 2026
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDayIdx((d) => Math.max(0, d - 1))}
                  className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-pointer"
                >
                  chevron_left
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayIdx((d) => Math.min(6, d + 1))}
                  className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-pointer"
                >
                  chevron_right
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-outline mb-1">
              <span>L</span>
              <span>M</span>
              <span>M</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
              <span>D</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const found = WEEK_DAYS.find((w) => w.dayNum === day);
                    if (found) setSelectedDayIdx(found.idx);
                  }}
                  className={`py-1 rounded-full cursor-pointer ${
                    day === 11
                      ? 'bg-error text-on-error font-bold'
                      : day >= 9 && day <= 15
                      ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Mi Agenda Personal */}
          <div className="flex flex-col gap-2 border-t border-outline-variant/25 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Mi Agenda Personal
            </h4>
            {PERSONAL_CALENDARS.map((cal) => (
              <label
                key={cal.label}
                className="flex items-center gap-2 text-xs text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeCategories.includes(cal.label)}
                  onChange={() => toggleCategory(cal.label)}
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className={`w-2.5 h-2.5 rounded-full ${cal.dot}`} />
                <span>{cal.label}</span>
              </label>
            ))}
          </div>
        </aside>
      </div>

      {/* Modal para Agregar Evento Personal (sin relación con oportunidades CRM) */}
      {showNewEventModal && (
        <div
          onClick={() => setShowNewEventModal(false)}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-2xl p-5 flex flex-col gap-3.5 text-xs"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  event_available
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Nuevo Evento / Agenda Personal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewEventModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Reunión de seguimiento, recordatorio, junta..."
                  autoFocus
                  className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-2 text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                    Fecha
                  </label>
                  <select
                    aria-label="Fecha"
                    value={newDayIdx}
                    onChange={(e) => setNewDayIdx(Number(e.target.value))}
                    className="text-xs font-mono bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                  >
                    {WEEK_DAYS.map((d) => (
                      <option key={d.idx} value={d.idx}>
                        {d.fullDate}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                    Inicio
                  </label>
                  <input
                    type="text"
                    value={newStartHour}
                    onChange={(e) => setNewStartHour(e.target.value)}
                    className="text-xs font-mono bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                    Fin
                  </label>
                  <input
                    type="text"
                    value={newEndHour}
                    onChange={(e) => setNewEndHour(e.target.value)}
                    className="text-xs font-mono bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Categoría de Agenda
                </label>
                <select
                  aria-label="Categoría de Agenda"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as PersonalAgendaEvent['category'])
                  }
                  className="text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                >
                  {PERSONAL_CALENDARS.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Notas / Descripción
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notas adicionales o ubicación..."
                  className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/25">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="text-xs text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Evento Personal */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl p-5 flex flex-col gap-3 text-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-primary">
                  {selectedEvent.category}
                </span>
                <h3 className="text-sm font-bold text-on-surface mt-0.5">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="font-mono text-on-surface-variant">
              {WEEK_DAYS.find((d) => d.idx === selectedEvent.dayCol)?.fullDate} •{' '}
              {selectedEvent.timeRange}
            </div>
            {selectedEvent.notes && (
              <p className="text-on-surface bg-surface-container-low p-2.5 rounded-lg">
                {selectedEvent.notes}
              </p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/25">
              <button
                type="button"
                onClick={() => {
                  setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
                  setSelectedEvent(null);
                }}
                className="text-error hover:underline font-semibold cursor-pointer"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="bg-primary-container text-on-primary font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
