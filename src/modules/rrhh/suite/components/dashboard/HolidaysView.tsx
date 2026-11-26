import React, { useState, useRef } from 'react';
import {
  Calendar,
  Send,
  Check,
  Plus,
  Clock,
  X,
  CalendarDays,
  Edit2,
  Trash2,
  Upload,
  Download
} from 'lucide-react';

export interface HolidayItem {
  id: string;
  title: string;
  dateStr: string;
  isoDate: string;
  dayOfWeek: string;
  type: 'lft' | 'sifygsa';
  typeLabel: string;
  isMandatory: boolean;
  daysRemaining: number;
  returnDateStr: string;
  description: string;
  // Campos corporativos de difusión
  imageUrl: string;
  imageCaption: string;
  isSuspended: boolean;
  suspensionNotice: string;
  reflectionText: string;
  technicalNotice: string;
  hashtags: string[];
}

// Catálogo de imágenes sugeridas / banco de recursos temáticos
const SUGGESTED_IMAGES = [
  {
    label: 'Flyer Oficial Día de Muertos (SIFYGSA)',
    url: '/assets/holidays/dia_de_muertos_sifygsa.jpg'
  },
  {
    label: 'Virgen de Guadalupe - Rosas y Altar de Tepeyac',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Virgen de Guadalupe - Tradición y Rosas',
    url: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Revolución Mexicana (Patrimonio)',
    url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Celebración Navideña',
    url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Año Nuevo y Metas',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Constitución y Leyes',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Día del Trabajo (Industria)',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80'
  },
  {
    label: 'Fiestas Patrias e Independencia',
    url: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?auto=format&fit=crop&w=900&q=80'
  }
];

const INITIAL_HOLIDAYS: HolidayItem[] = [
  {
    id: 'H-01',
    title: 'Día de Muertos',
    dateStr: '02 de Noviembre de 2026',
    isoDate: '2026-11-02',
    dayOfWeek: 'Lunes',
    type: 'sifygsa',
    typeLabel: 'Asueto Institucional',
    isMandatory: false,
    daysRemaining: 4,
    returnDateStr: 'Martes 03 de Noviembre de 2026',
    description: 'Tradición corporativa para honrar nuestras raíces. Suspensión de labores en oficinas y base técnica.',
    imageUrl: '/assets/holidays/dia_de_muertos_sifygsa.jpg',
    imageCaption: '💀🌼 ¡Que no se apague la tradición! 🧡🎉',
    isSuspended: true,
    suspensionNotice: 'Con motivo del Día de Muertos, este próximo 2 de noviembre se suspenden actividades. 🕯️✨',
    reflectionText: '¡Es momento de disfrutar nuestras tradiciones, llenar los hogares de color, compartir en familia y recordar con mucho cariño a quienes siguen viviendo en nuestros corazones! 🧡🌺💀\n\nPara que puedan organizar sus actividades y aproveche este día de la mejor manera posible.',
    technicalNotice: 'No olviden apagar y desconectar sus equipos electrónicos.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
  },
  {
    id: 'H-02',
    title: 'Revolución Mexicana',
    dateStr: '16 de Noviembre de 2026',
    isoDate: '2026-11-16',
    dayOfWeek: 'Lunes',
    type: 'lft',
    typeLabel: 'Descanso Oficial LFT',
    isMandatory: true,
    daysRemaining: 18,
    returnDateStr: 'Martes 17 de Noviembre de 2026',
    description: 'Día de descanso obligatorio estipulado en el Artículo 74 de la Ley Federal del Trabajo.',
    imageUrl: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=900&q=80',
    imageCaption: '🇲🇽 ¡Conmemoración de la Revolución Mexicana! 📜🦅',
    isSuspended: true,
    suspensionNotice: 'Con motivo del 116 Aniversario de la Revolución Mexicana, este próximo lunes 16 de noviembre se suspenden labores oficiales.',
    reflectionText: 'Un momento para conmemorar los valores históricos de justicia y compromiso social de nuestra nación, renovando nuestra dedicación en equipo.',
    technicalNotice: 'Favor de verificar el aseguramiento de instalaciones y desconexión de consumibles eléctricos.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
  },
  {
    id: 'H-03',
    title: 'Día de la Virgen de Guadalupe',
    dateStr: '12 de Diciembre de 2026',
    isoDate: '2026-12-12',
    dayOfWeek: 'Sábado',
    type: 'sifygsa',
    typeLabel: 'Asueto Regional',
    isMandatory: false,
    daysRemaining: 44,
    returnDateStr: 'Lunes 14 de Diciembre de 2026',
    description: 'Conmemoración tradicional y descanso para personal de oficinas administrativas y soporte.',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80',
    imageCaption: '🌹✨ ¡Día de Nuestra Señora de Guadalupe! 🇲🇽🕊️',
    isSuspended: true,
    suspensionNotice: 'Con motivo de la conmemoración tradicional del 12 de Diciembre (Día de la Virgen de Guadalupe), se otorgan facilidades y asueto institucional.',
    reflectionText: 'Un momento especial para honrar nuestras tradiciones, fomentar la unión familiar y compartir momentos de paz y gratitud en nuestros hogares.',
    technicalNotice: 'Verificar que equipos electrónicos y estaciones de trabajo queden debidamente apagadas.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
  },
  {
    id: 'H-04',
    title: 'Navidad',
    dateStr: '25 de Diciembre de 2026',
    isoDate: '2026-12-25',
    dayOfWeek: 'Viernes',
    type: 'lft',
    typeLabel: 'Descanso Oficial LFT',
    isMandatory: true,
    daysRemaining: 57,
    returnDateStr: 'Lunes 28 de Diciembre de 2026',
    description: 'Descanso obligatorio por celebración de Navidad en apego al Art. 74 de la LFT.',
    imageUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=900&q=80',
    imageCaption: '🎄🎁 ¡Feliz Navidad a toda la Familia SIFYGSA! ⭐🔔',
    isSuspended: true,
    suspensionNotice: 'Con motivo de la celebración de Navidad, este viernes 25 de diciembre se suspenden todas las actividades administrativas.',
    reflectionText: 'Que la paz, el amor y la prosperidad reinen en cada uno de sus hogares en estas fechas tan especiales.',
    technicalNotice: 'Cierre total de válvulas y desconexión integral de equipos no críticos.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
  },
  {
    id: 'H-05',
    title: 'Año Nuevo',
    dateStr: '01 de Enero de 2027',
    isoDate: '2027-01-01',
    dayOfWeek: 'Viernes',
    type: 'lft',
    typeLabel: 'Descanso Oficial LFT',
    isMandatory: true,
    daysRemaining: 64,
    returnDateStr: 'Lunes 04 de Enero de 2027',
    description: 'Descanso oficial de inicio de ciclo anual en todas las sucursales y proyectos industriales.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    imageCaption: '🎆🥂 ¡Bienvenido 2027! Éxito y Prosperidad 🌟🍾',
    isSuspended: true,
    suspensionNotice: 'Iniciamos un nuevo ciclo. El 1 de enero es día de descanso obligatorio conforme a la Ley Federal del Trabajo.',
    reflectionText: 'Agradecemos su entrega en este año concluido y nos preparamos para alcanzar nuevas metas juntos en 2027.',
    technicalNotice: 'Protocolo de resguardo de fin de año en oficinas y talleres.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
  },
  {
    id: 'H-06',
    title: 'Día de la Constitución',
    dateStr: '01 de Febrero de 2027',
    isoDate: '2027-02-01',
    dayOfWeek: 'Lunes',
    type: 'lft',
    typeLabel: 'Descanso Oficial LFT',
    isMandatory: true,
    daysRemaining: 95,
    returnDateStr: 'Martes 02 de Febrero de 2027',
    description: 'Primer lunes de febrero en conmemoración del 5 de febrero (Art. 74 LFT).',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80',
    imageCaption: '📜⚖️ Aniversario de la Constitución Política 🇲🇽🏛️',
    isSuspended: true,
    suspensionNotice: 'En conmemoración de nuestra Carta Magna, el próximo lunes 01 de febrero se suspenden actividades.',
    reflectionText: 'Recordando los principios fundamentales que rigen nuestras garantías y marco laboral.',
    technicalNotice: 'Desconexión de equipos periféricos antes de salir el viernes.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
  }
];

export const HolidaysView: React.FC = () => {
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);
  const [filterType, setFilterType] = useState<'todos' | 'lft' | 'sifygsa' | 'proximos'>('todos');
  
  // Modales
  const [selectedHolidayForTelegram, setSelectedHolidayForTelegram] = useState<HolidayItem | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  
  // Estados de Telegram en vivo
  const [telegramCustomText, setTelegramCustomText] = useState<string>('');
  const [isCopiedText, setIsCopiedText] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Input de archivo para cargar imágenes / flyers locales
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generador de texto oficial con estilo SIFYGSA idéntico a las publicaciones reales
  const buildOfficialTelegramMessage = (h: HolidayItem) => {
    const hashtagsStr = (h.hashtags && h.hashtags.length > 0)
      ? h.hashtags.join('\n')
      : '#OneSoul\n#OneSIFYGSA\n#HacemosQueLasCosasSucedan';

    return `Buenos días Compañeros ☀️\n\n${h.imageCaption}\n\n${h.suspensionNotice}\n\n${h.reflectionText}\n\n⚠️ ${h.technicalNotice}\n\nReanudación de labores: ${h.returnDateStr}.\n\nRecursos Humanos\n${hashtagsStr}`;
  };

  // Abrir modal de Telegram cargando el texto editable
  const handleOpenTelegramModal = (h: HolidayItem) => {
    setSelectedHolidayForTelegram(h);
    setTelegramCustomText(buildOfficialTelegramMessage(h));
  };

  // Copiar texto al portapapeles
  const handleCopyText = () => {
    navigator.clipboard.writeText(telegramCustomText);
    setIsCopiedText(true);
    showToast('✓ Texto copiado al portapapeles');
    setTimeout(() => setIsCopiedText(false), 2000);
  };

  // Abrir enlace directo a Telegram
  const handleOpenTelegramWeb = () => {
    const encoded = encodeURIComponent(telegramCustomText);
    const url = `https://t.me/share/url?url=&text=${encoded}`;
    window.open(url, '_blank');
  };

  // Descargar la imagen del flyer
  const handleDownloadFlyer = (imageUrl: string, title: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `Flyer_${title.replace(/\s+/g, '_')}_SIFYGSA.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('✓ Descarga del flyer iniciada');
  };

  // Toggle directo de suspensión de actividades
  const handleToggleSuspension = (id: string) => {
    setHolidays((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.isSuspended;
          showToast(nextState ? `✓ Actividades suspendidas para ${h.title}` : `✓ Jornada regular reactivada para ${h.title}`);
          return {
            ...h,
            isSuspended: nextState,
            suspensionNotice: nextState
              ? `Con motivo de ${h.title}, este próximo ${h.dateStr} se suspenden actividades. 🕯️✨`
              : `Aviso Informativo: Para ${h.title} se mantendrán actividades laborales ordinarias y guardias.`
          };
        }
        return h;
      })
    );
  };

  // Abrir modal de edición
  const handleStartEdit = (h: HolidayItem) => {
    setEditingHoliday({ ...h });
    setIsCreatingNew(false);
    setIsEditingModalOpen(true);
  };

  // Abrir modal para crear nuevo aviso
  const handleStartCreate = () => {
    const newItem: HolidayItem = {
      id: `H-${Date.now()}`,
      title: '',
      dateStr: '',
      isoDate: new Date().toISOString().split('T')[0],
      dayOfWeek: 'Lunes',
      type: 'sifygsa',
      typeLabel: 'Asueto Institucional',
      isMandatory: false,
      daysRemaining: 1,
      returnDateStr: '',
      description: '',
      imageUrl: '/assets/holidays/dia_de_muertos_sifygsa.jpg',
      imageCaption: '🎉✨ ¡Aviso Oficial de Descanso! ☀️🔔',
      isSuspended: true,
      suspensionNotice: 'Se les comunica que con motivo de esta fecha, se suspenden actividades laborales.',
      reflectionText: 'Para que puedan organizar sus actividades y disfruten de este día de la mejor manera en familia.',
      technicalNotice: 'No olviden apagar y desconectar sus equipos electrónicos.',
      hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan']
    };
    setEditingHoliday(newItem);
    setIsCreatingNew(true);
    setIsEditingModalOpen(true);
  };

  // Subir imagen local desde PC
  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingHoliday) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingHoliday((prev) => (prev ? { ...prev, imageUrl: base64 } : null));
      showToast('✓ Imagen cargada exitosamente');
    };
    reader.readAsDataURL(file);
  };

  // Guardar edición o nuevo registro
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday || !editingHoliday.title.trim()) return;

    if (isCreatingNew) {
      setHolidays((prev) => [editingHoliday, ...prev]);
      showToast(`✓ Festividad "${editingHoliday.title}" creada`);
    } else {
      setHolidays((prev) =>
        prev.map((h) => (h.id === editingHoliday.id ? editingHoliday : h))
      );
      showToast(`✓ "${editingHoliday.title}" actualizado correctamente`);
    }
    setIsEditingModalOpen(false);
    setEditingHoliday(null);
  };

  // Eliminar festividad
  const handleDeleteHoliday = (id: string, title: string) => {
    if (window.confirm(`¿Deseas eliminar "${title}" del calendario?`)) {
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      showToast(`✓ "${title}" eliminado`);
    }
  };

  // Filtrado
  const filteredHolidays = holidays.filter((h) => {
    if (filterType === 'proximos') return h.daysRemaining <= 60;
    if (filterType === 'lft') return h.type === 'lft';
    if (filterType === 'sifygsa') return h.type === 'sifygsa';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #334155'
          }}
        >
          <Check className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Encabezado Conciso (1 a 3 palabras) */}
      <div className="card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-50)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--brand-200)',
                flexShrink: 0
              }}
            >
              <CalendarDays className="w-6 h-6" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Días Festivos
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    border: '1px solid var(--success-border)'
                  }}
                >
                  LFT 2026-2027
                </span>
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
                  Avisos Telegram
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Calendario oficial, flyers alusivos y difusión directa con hashtags corporativos
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 16px' }}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Aviso</span>
          </button>
        </div>
      </div>

      {/* 2. Filtros Rápidos (1 Clic) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterType('todos')}
            className={`btn ${filterType === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11.5px', padding: '6px 12px' }}
          >
            Todos ({holidays.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('proximos')}
            className={`btn ${filterType === 'proximos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11.5px', padding: '6px 12px' }}
          >
            Próximos 60 Días
          </button>

          <button
            type="button"
            onClick={() => setFilterType('lft')}
            className={`btn ${filterType === 'lft' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11.5px', padding: '6px 12px' }}
          >
            Descanso Oficial LFT
          </button>

          <button
            type="button"
            onClick={() => setFilterType('sifygsa')}
            className={`btn ${filterType === 'sifygsa' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11.5px', padding: '6px 12px' }}
          >
            Asuetos SIFYGSA
          </button>
        </div>

        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredHolidays.length} {filteredHolidays.length === 1 ? 'fecha programada' : 'fechas programadas'}
        </span>
      </div>

      {/* 3. Cuadrícula de Fechas Festivas con Banner Gráfico y Acciones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '18px' }}>
        {filteredHolidays.map((h) => {
          const isUrgent = h.daysRemaining <= 15;
          return (
            <div
              key={h.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                border: isUrgent ? '1.5px solid var(--brand-300)' : '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                {/* Banner Alusivo con Flyer / Imagen */}
                <div style={{ position: 'relative', width: '100%', height: '145px', backgroundColor: '#1E293B', overflow: 'hidden' }}>
                  <img
                    src={h.imageUrl}
                    alt={h.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      // Fallback en caso de que falle la imagen
                      (e.currentTarget as HTMLImageElement).src = '/assets/holidays/dia_de_muertos_sifygsa.jpg';
                    }}
                  />
                  {/* Gradiente para legibilidad */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%)'
                    }}
                  />

                  {/* Badges superiores sobre la imagen */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: h.type === 'lft' ? 'rgba(22, 101, 52, 0.9)' : 'rgba(29, 78, 216, 0.9)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(4px)',
                        letterSpacing: '0.3px'
                      }}
                    >
                      {h.typeLabel}
                    </span>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        backgroundColor: isUrgent ? 'rgba(220, 38, 38, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {h.daysRemaining === 0 ? '¡Hoy!' : `En ${h.daysRemaining} días`}
                    </span>
                  </div>

                  {/* Estado de Suspensión en la parte inferior de la imagen */}
                  <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: h.isSuspended ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                          color: '#FFFFFF'
                        }}
                      >
                        {h.isSuspended ? '● Labores Suspendidas' : '● Actividades Normales'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSuspension(h.id)}
                      title={h.isSuspended ? 'Reactivar actividades' : 'Suspender actividades'}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {h.isSuspended ? 'Reactivar' : 'Suspender'}
                    </button>
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div style={{ padding: '16px 18px 12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {h.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(h)}
                        title="Editar fecha y aviso"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                      >
                        <Edit2 className="w-3.5 h-3.5 hover:text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHoliday(h.id, h.title)}
                        title="Eliminar del calendario"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                      >
                        <Trash2 className="w-3.5 h-3.5 hover:text-danger" />
                      </button>
                    </div>
                  </div>

                  {/* Fecha Oficial */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{h.dateStr} ({h.dayOfWeek})</span>
                  </div>

                  {/* Regreso a Labores */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '10px' }}>
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    <span>Regreso: <strong>{h.returnDateStr}</strong></span>
                  </div>

                  {/* Frase / Alusión */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--brand-700)',
                      backgroundColor: 'var(--brand-50)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      fontWeight: 600,
                      border: '1px solid var(--brand-100)'
                    }}
                  >
                    {h.imageCaption}
                  </div>

                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {h.description}
                  </p>
                </div>
              </div>

              {/* Botón de Difusión Oficial a Telegram */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 18px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenTelegramModal(h)}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Aviso Telegram</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDownloadFlyer(h.imageUrl, h.title)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', fontSize: '11px' }}
                  title="Descargar Flyer"
                >
                  <Download className="w-3.5 h-3.5 text-muted" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: VISTA PREVIA Y DIFUSIÓN A TELEGRAM CON FLYER Y HASHTAGS SIFYGSA */}
      {/* ========================================================================= */}
      {selectedHolidayForTelegram && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Cabecera Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Difusión por Telegram
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Flyer oficial + texto corporativo SIFYGSA con hashtags
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedHolidayForTelegram(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flyer / Afiche gráfico que se envía a Telegram */}
            <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
              <img
                src={selectedHolidayForTelegram.imageUrl}
                alt={selectedHolidayForTelegram.title}
                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', backgroundColor: '#0F172A', display: 'block' }}
              />
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}
              >
                <span>Afiche gráfico alusivo adjunto</span>
                <button
                  type="button"
                  onClick={() => handleDownloadFlyer(selectedHolidayForTelegram.imageUrl, selectedHolidayForTelegram.title)}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar Flyer</span>
                </button>
              </div>
            </div>

            {/* Editor en Vivo del Mensaje Corporativo */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  MENSAJE A PUBLICAR (EDITABLE):
                </label>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Hashtags: #OneSoul #OneSIFYGSA
                </span>
              </div>
              <textarea
                value={telegramCustomText}
                onChange={(e) => setTelegramCustomText(e.target.value)}
                rows={9}
                className="input-text"
                style={{
                  width: '100%',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'inherit',
                  padding: '10px 12px',
                  borderRadius: '10px'
                }}
              />
            </div>

            {/* Acciones de Difusión */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedHolidayForTelegram(null)}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyText}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
              >
                {isCopiedText ? <Check className="w-4 h-4 text-success" /> : <Send className="w-4 h-4" />}
                <span>{isCopiedText ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenTelegramWeb}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 16px', backgroundColor: '#0284C7', borderColor: '#0284C7' }}
              >
                <Send className="w-4 h-4" />
                <span>Abrir Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDITAR O CREAR DÍA FESTIVO / SUBIR FLYER / SUSPENDER DÍA        */}
      {/* ========================================================================= */}
      {isEditingModalOpen && editingHoliday && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isCreatingNew ? 'Nuevo Aviso de Festividad' : `Editar: ${editingHoliday.title}`}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Ajuste de fechas, suspensión de actividades y flyer de difusión
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Título y Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    FESTIVIDAD / MOTIVO *
                  </label>
                  <input
                    type="text"
                    value={editingHoliday.title}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, title: e.target.value })}
                    placeholder="Ej. Día de Muertos"
                    className="input-text"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    TIPO DE DESCANSO
                  </label>
                  <select
                    value={editingHoliday.type}
                    onChange={(e) => {
                      const t = e.target.value as 'lft' | 'sifygsa';
                      setEditingHoliday({
                        ...editingHoliday,
                        type: t,
                        typeLabel: t === 'lft' ? 'Descanso Oficial LFT' : 'Asueto Institucional',
                        isMandatory: t === 'lft'
                      });
                    }}
                    className="select-control"
                    style={{ width: '100%', height: '36px' }}
                  >
                    <option value="sifygsa">Asueto Institucional SIFYGSA</option>
                    <option value="lft">Descanso Obligatorio LFT (Art. 74)</option>
                  </select>
                </div>
              </div>

              {/* Fechas: Día de suspensión y Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    FECHA DEL DESCANSO *
                  </label>
                  <input
                    type="date"
                    value={editingHoliday.isoDate}
                    onChange={(e) => {
                      const newIso = e.target.value;
                      if (!newIso) return;
                      const [y, m, d] = newIso.split('-');
                      const dt = new Date(Number(y), Number(m) - 1, Number(d));
                      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                      
                      const retDt = new Date(dt);
                      retDt.setDate(retDt.getDate() + 1);
                      if (retDt.getDay() === 0) retDt.setDate(retDt.getDate() + 1); // saltar domingo

                      setEditingHoliday({
                        ...editingHoliday,
                        isoDate: newIso,
                        dateStr: `${String(d).padStart(2, '0')} de ${months[Number(m) - 1]} de ${y}`,
                        dayOfWeek: days[dt.getDay()],
                        returnDateStr: `${days[retDt.getDay()]} ${String(retDt.getDate()).padStart(2, '0')} de ${months[retDt.getMonth()]} de ${retDt.getFullYear()}`,
                        daysRemaining: Math.max(0, Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      });
                    }}
                    className="input-text"
                    style={{ width: '100%', height: '38px', padding: '8px 12px', fontSize: '12.5px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ESTADO DE LABORES
                  </label>
                  <select
                    value={editingHoliday.isSuspended ? 'suspended' : 'active'}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, isSuspended: e.target.value === 'suspended' })}
                    className="select-control"
                    style={{ width: '100%', height: '38px', fontSize: '12.5px' }}
                  >
                    <option value="suspended">Se suspenden actividades</option>
                    <option value="active">Jornada ordinaria / Guardia</option>
                  </select>
                </div>
              </div>

              {/* Reanudación de Labores en Fila Completa Despejada */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                  REANUDACIÓN DE LABORES
                </label>
                <input
                  type="text"
                  value={editingHoliday.returnDateStr}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, returnDateStr: e.target.value })}
                  placeholder="Ej. Lunes 14 de Diciembre de 2026 en horario habitual"
                  className="input-text"
                  style={{ width: '100%', height: '38px', padding: '8px 12px', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  Fecha y horario oficial en el que el personal retoma sus funciones
                </span>
              </div>

              {/* Flyer / Imagen Alusiva */}
              <div style={{ padding: '14px', backgroundColor: 'var(--surface-alt)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  FLYER O IMAGEN ALUSIVA
                </label>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: '110px', height: '70px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid var(--border)', flexShrink: 0 }}>
                    <img
                      src={editingHoliday.imageUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Upload className="w-3 h-3 text-primary" />
                        <span>Subir Flyer Propio</span>
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUploadImageFile}
                      />
                    </div>

                    {/* Selector de Presets Alusivos */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditingHoliday({ ...editingHoliday, imageUrl: e.target.value });
                        }
                      }}
                      className="select-control"
                      style={{ fontSize: '11px', height: '32px' }}
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccionar de Galería Alusiva...</option>
                      {SUGGESTED_IMAGES.map((img, idx) => (
                        <option key={idx} value={img.url}>{img.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mensajes del Comunicado Institucional */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ENCABEZADO / FRASE ALUSIVA (CON EMOJIS)
                  </label>
                  <input
                    type="text"
                    value={editingHoliday.imageCaption}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, imageCaption: e.target.value })}
                    placeholder="Ej. 💀🌼 ¡Que no se apague la tradición! 🧡🎉"
                    className="input-text"
                    style={{ width: '100%', height: '38px', padding: '8px 12px', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Anuncio de Suspensión en Textarea Multilínea Limpio */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    ANUNCIO DE SUSPENSIÓN DE LABORES
                  </label>
                  <textarea
                    rows={2}
                    value={editingHoliday.suspensionNotice}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, suspensionNotice: e.target.value })}
                    placeholder="Con motivo de..., este próximo... se suspenden actividades."
                    style={{
                      width: '100%',
                      minHeight: '62px',
                      padding: '9px 12px',
                      fontSize: '12.5px',
                      lineHeight: '1.45',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                      resize: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Mensaje Reflexivo con Altura Estable y sin deformarse */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    MENSAJE REFLEXIVO / FAMILIAR
                  </label>
                  <textarea
                    rows={3}
                    value={editingHoliday.reflectionText}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, reflectionText: e.target.value })}
                    placeholder="Mensaje reflexivo o de tradición para los colaboradores y sus familias..."
                    style={{
                      width: '100%',
                      minHeight: '88px',
                      maxHeight: '220px',
                      padding: '9px 12px',
                      fontSize: '12.5px',
                      lineHeight: '1.5',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    RECOMENDACIÓN TÉCNICA / SEGURIDAD
                  </label>
                  <input
                    type="text"
                    value={editingHoliday.technicalNotice}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, technicalNotice: e.target.value })}
                    placeholder="Ej. No olviden apagar y desconectar sus equipos electrónicos."
                    className="input-text"
                    style={{ width: '100%', height: '38px', padding: '8px 12px', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingModalOpen(false)}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 18px' }}
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Festividad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
