'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Download,
  Archive,
  RotateCcw,
  Settings,
  Sparkles,
  FileText,
  Printer,
  Bell,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
const sifygsaLogo = '/assets/logos/Logo_S.png';

export interface HolidayItem {
  id: string;
  title: string;
  isoDate: string; // YYYY-MM-DD
  returnIsoDate?: string;
  returnDateStr: string;
  type: 'lft' | 'sifygsa';
  isSuspended: boolean; // Si Dirección autoriza descanso (true) o se labora normal (false)
  description: string;
  // Campos corporativos de difusión
  imageUrl: string;
  imageCaption: string;
  suspensionNotice: string;
  reflectionText: string;
  technicalNotice: string;
  hashtags: string[];
  // Estado de archivo / papelera (30 días)
  isArchived?: boolean;
  archivedAt?: string; // ISO string
  // Estado de envío y programación a Telegram
  telegramStatus?: 'pending' | 'scheduled' | 'sent';
  scheduledDateTime?: string; // YYYY-MM-DDTHH:mm
  autoSendEnabled?: boolean;
  sentAt?: string;
  sentChannel?: string;
}

interface TelegramConfig {
  botToken: string;
  chatId: string;
  channelName: string;
  autoArchiveDays: number;
}

const STORAGE_KEY_HOLIDAYS = 'sifygsa_rrhh_holidays_v2';
const STORAGE_KEY_TG_CONFIG = 'sifygsa_rrhh_telegram_config_v1';

// Catálogo ampliado de imágenes alusivas por fecha
const SUGGESTED_IMAGES = [
  {
    label: 'Día de Muertos - Flyer Oficial SIFYGSA',
    category: 'Tradición',
    url: '/assets/holidays/dia_de_muertos_sifygsa.jpg'
  },
  {
    label: 'Virgen de Guadalupe - Rosas y Tradición',
    category: 'Tradición',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Navidad Corporativa - Árbol y Luces',
    category: 'Decembrinas',
    url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Navidad en Familia - Nochebuena Cálida',
    category: 'Decembrinas',
    url: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Año Nuevo - Fuegos Artificiales y Metas',
    category: 'Año Nuevo',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Constitución Mexicana - Justicia y Leyes',
    category: 'Cívico LFT',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Natalicio de Benito Juárez - Primavera y Civismo',
    category: 'Cívico LFT',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Semana Santa - Descanso y Reflexión',
    category: 'Tradición',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Día del Trabajo (1 de Mayo) - Industria e Ingeniería',
    category: 'Cívico LFT',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Día de las Madres (10 de Mayo) - Flores Especiales',
    category: 'Tradición',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Independencia de México (16 de Septiembre)',
    category: 'Cívico LFT',
    url: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Revolución Mexicana - Monumento e Historia',
    category: 'Cívico LFT',
    url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1000&q=80'
  }
];

// Plantillas rápidas de redacción con 1 clic
const MESSAGE_TEMPLATES = [
  {
    id: 'calido',
    label: 'Cálido y Tradicional',
    description: 'Ideal para festividades culturales y familiares',
    apply: (title: string, dateStr: string) => ({
      imageCaption: `✨🎉 ¡Celebrando nuestras tradiciones en familia: ${title}! 🧡🌺`,
      suspensionNotice: `Con motivo de la conmemoración de ${title}, el próximo ${dateStr} se suspenden actividades laborales en nuestras instalaciones.`,
      reflectionText: `Es un excelente momento para disfrutar de nuestras tradiciones, compartir en familia y recargar energías junto a nuestros seres queridos.\n\nLes deseamos un descanso lleno de bienestar y armonía.`,
      technicalNotice: `Favor de dejar sus estaciones de trabajo apagadas y desconectar equipos eléctricos antes de retirarse.`
    })
  },
  {
    id: 'institucional',
    label: 'Oficial LFT (Ejecutivo)',
    description: 'Apegado al Art. 74 de la Ley Federal del Trabajo',
    apply: (title: string, dateStr: string) => ({
      imageCaption: `🇲🇽📋 Aviso Oficial de Descanso Obligatorio: ${title}`,
      suspensionNotice: `En cumplimiento con el Artículo 74 de la Ley Federal del Trabajo, se informa a todo el personal que el día ${dateStr} habrá suspensión oficial de labores por ${title}.`,
      reflectionText: `Agradecemos su compromiso constante y dedicación en cada proyecto industrial de SIFYGSA, deseándoles un excelente día de descanso.`,
      technicalNotice: `Se solicita a los responsables de área verificar el resguardo de herramientas, unidades y cierre de oficinas.`
    })
  },
  {
    id: 'laborable',
    label: 'Jornada Ordinaria (Se Labora)',
    description: 'Cuando Dirección determina actividad normal en fecha no obligatoria',
    apply: (title: string, dateStr: string) => ({
      imageCaption: `📌 Aviso Operativo Institucional — ${title}`,
      suspensionNotice: `Se informa a todo el personal que el día ${dateStr} (${title}) se mantendrán actividades laborales en horario habitual en oficinas y proyectos activos.`,
      reflectionText: `Al tratarse de una fecha conmemorativa no contemplada como descanso obligatorio en el Art. 74 de la LFT, nuestras operaciones continúan con normalidad para cumplir con nuestros compromisos vigentes.`,
      technicalNotice: `Agradecemos su puntualidad y asistencia regular en cada una de sus áreas asignadas.`
    })
  }
];

const INITIAL_HOLIDAYS: HolidayItem[] = [
  {
    id: 'H-01',
    title: 'Día de Muertos',
    isoDate: '2026-11-02',
    returnIsoDate: '2026-11-03',
    returnDateStr: 'Martes 03 de Noviembre de 2026',
    type: 'sifygsa',
    isSuspended: true,
    description: 'Tradición cultural mexicana. Asueto otorgado por autorización de Dirección General con goce de sueldo normal.',
    imageUrl: '/assets/holidays/dia_de_muertos_sifygsa.jpg',
    imageCaption: '💀🌼 ¡Que no se apague la tradición! 🧡🎉',
    suspensionNotice: 'Con motivo del Día de Muertos, este 2 de noviembre se suspenden actividades por disposición de Dirección General. 🕯️✨',
    reflectionText: '¡Es momento de disfrutar nuestras tradiciones, llenar los hogares de color, compartir en familia y recordar con mucho cariño a quienes siguen viviendo en nuestros corazones! 🧡🌺💀',
    technicalNotice: 'No olviden apagar y desconectar sus equipos electrónicos.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'sent',
    sentAt: '01/11/2026 09:00',
    sentChannel: '@SIFYGSA_Avisos'
  },
  {
    id: 'H-02',
    title: 'Aniversario de la Revolución Mexicana',
    isoDate: '2026-11-16',
    returnIsoDate: '2026-11-17',
    returnDateStr: 'Martes 17 de Noviembre de 2026',
    type: 'lft',
    isSuspended: true,
    description: 'Tercer lunes de noviembre en conmemoración del 20 de noviembre (Art. 74 Fracc. VI de la Ley Federal del Trabajo).',
    imageUrl: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🇲🇽 ¡Conmemoración de la Revolución Mexicana! 📜🦅',
    suspensionNotice: 'Con motivo del Aniversario de la Revolución Mexicana, el lunes 16 de noviembre se suspenden labores oficiales conforme a la LFT.',
    reflectionText: 'Un momento para conmemorar los valores históricos de nuestra nación, renovando nuestra dedicación y esfuerzo en equipo.',
    technicalNotice: 'Favor de verificar el aseguramiento de instalaciones y desconexión de equipos eléctricos.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'sent',
    sentAt: '14/11/2026 10:30',
    sentChannel: '@SIFYGSA_Avisos'
  },
  {
    id: 'H-03',
    title: 'Día de la Virgen de Guadalupe',
    isoDate: '2026-12-12',
    returnIsoDate: '2026-12-14',
    returnDateStr: 'Lunes 14 de Diciembre de 2026',
    type: 'sifygsa',
    isSuspended: true,
    description: 'Fecha tradicional no obligatoria por LFT. Su suspensión o labor ordinaria depende de la autorización de Dirección General.',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🌹✨ ¡Conmemoración del 12 de Diciembre! 🇲🇽🕊️',
    suspensionNotice: 'Con motivo de la conmemoración tradicional del 12 de Diciembre, Dirección General autoriza asueto institucional.',
    reflectionText: 'Un momento especial para honrar nuestras tradiciones, fomentar la unión familiar y compartir momentos de paz en nuestros hogares.',
    technicalNotice: 'Verificar que equipos electrónicos y estaciones de trabajo queden debidamente apagados.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'scheduled',
    scheduledDateTime: '2026-12-11T09:00',
    autoSendEnabled: true
  },
  {
    id: 'H-04',
    title: 'Navidad',
    isoDate: '2026-12-25',
    returnIsoDate: '2026-12-28',
    returnDateStr: 'Lunes 28 de Diciembre de 2026',
    type: 'lft',
    isSuspended: true,
    description: 'Descanso obligatorio nacional estipulado en el Artículo 74 Fracc. VIII de la Ley Federal del Trabajo.',
    imageUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🎄🎁 ¡Feliz Navidad a toda la Familia SIFYGSA! ⭐🔔',
    suspensionNotice: 'Con motivo de la celebración de Navidad, el viernes 25 de diciembre se suspenden todas las actividades conforme a la LFT.',
    reflectionText: 'Que la paz, la unión y la prosperidad reinen en cada uno de sus hogares en estas fiestas decembrinas.',
    technicalNotice: 'Cierre total de válvulas y desconexión integral de equipos no críticos.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'scheduled',
    scheduledDateTime: '2026-12-24T09:00',
    autoSendEnabled: true
  },
  {
    id: 'H-05',
    title: 'Año Nuevo 2027',
    isoDate: '2027-01-01',
    returnIsoDate: '2027-01-04',
    returnDateStr: 'Lunes 04 de Enero de 2027',
    type: 'lft',
    isSuspended: true,
    description: 'Descanso obligatorio de inicio de año conforme al Artículo 74 Fracc. I de la Ley Federal del Trabajo.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🎆🥂 ¡Bienvenido 2027! Éxito y Prosperidad 🌟🍾',
    suspensionNotice: 'Iniciamos un nuevo ciclo. El viernes 1 de enero es día de descanso obligatorio conforme a la Ley Federal del Trabajo.',
    reflectionText: 'Agradecemos su entrega en el año que concluye y nos preparamos para alcanzar nuevas metas juntos en 2027.',
    technicalNotice: 'Protocolo de resguardo de fin de año en oficinas, almacén y talleres.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'pending',
    autoSendEnabled: false
  },
  {
    id: 'H-06',
    title: 'Día de la Constitución Mexicana',
    isoDate: '2027-02-01',
    returnIsoDate: '2027-02-02',
    returnDateStr: 'Martes 02 de Febrero de 2027',
    type: 'lft',
    isSuspended: true,
    description: 'Primer lunes de febrero en conmemoración del 5 de febrero (Art. 74 Fracc. II LFT).',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '📜⚖️ Aniversario de la Constitución Política 🇲🇽🏛️',
    suspensionNotice: 'En conmemoración de nuestra Carta Magna, el próximo lunes 01 de febrero se suspenden actividades laborales.',
    reflectionText: 'Recordando los principios fundamentales que rigen nuestras garantías individuales y marco laboral mexicano.',
    technicalNotice: 'Desconexión de equipos periféricos antes de retirarse el viernes.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'pending',
    autoSendEnabled: false
  },
  {
    id: 'H-07',
    title: 'Natalicio de Benito Juárez',
    isoDate: '2027-03-15',
    returnIsoDate: '2027-03-16',
    returnDateStr: 'Martes 16 de Marzo de 2027',
    type: 'lft',
    isSuspended: true,
    description: 'Tercer lunes de marzo en conmemoración del 21 de marzo (Art. 74 Fracc. III LFT).',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🇲🇽⚖️ Natalicio de Benito Juárez y Equinoccio de Primavera 🌿☀️',
    suspensionNotice: 'Conforme al Artículo 74 de la LFT, el tercer lunes de marzo se suspenden labores oficiales.',
    reflectionText: 'Honramos el respeto al derecho y la paz institucional, deseándoles un excelente puente a todos nuestros colaboradores.',
    technicalNotice: 'Apagar equipos de climatización e iluminación en oficinas generales.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'pending',
    autoSendEnabled: false
  },
  {
    id: 'H-08',
    title: 'Viernes Santo (Semana Santa)',
    isoDate: '2027-03-26',
    returnIsoDate: '2027-03-29',
    returnDateStr: 'Lunes 29 de Marzo de 2027',
    type: 'sifygsa',
    isSuspended: true,
    description: 'Asueto tradicional sujeto a disposición de Dirección General (No obligatorio en Art. 74 LFT).',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🕊️☀️ Periodo de Semana Santa — Descanso Institucional',
    suspensionNotice: 'Por autorización de Dirección General, se otorga asueto institucional con motivo de Viernes Santo.',
    reflectionText: 'Deseamos que este periodo sea de descanso, reflexión y sana convivencia junto a sus familias.',
    technicalNotice: 'Asegurar resguardo de unidades vehiculares en patio y cierre de almacén.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'pending',
    autoSendEnabled: false
  },
  {
    id: 'H-09',
    title: 'Día del Trabajo',
    isoDate: '2027-05-01',
    returnIsoDate: '2027-05-03',
    returnDateStr: 'Lunes 03 de Mayo de 2027',
    type: 'lft',
    isSuspended: true,
    description: 'Conmemoración del 1 de Mayo, descanso obligatorio nacional (Art. 74 Fracc. IV LFT).',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '👷‍♂️⚙️ ¡Feliz Día del Trabajo al equipo SIFYGSA! 💪🔥',
    suspensionNotice: 'El 1 de mayo es día de descanso obligatorio conforme a la Ley Federal del Trabajo.',
    reflectionText: 'Reconocemos el talento, esfuerzo y seguridad con la que cada integrante de SIFYGSA construye soluciones todos los días.',
    technicalNotice: 'Mantener protocolos de orden y limpieza en talleres antes del descanso.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'pending',
    autoSendEnabled: false
  },
  {
    id: 'H-10',
    title: 'Día de la Independencia de México',
    isoDate: '2027-09-16',
    returnIsoDate: '2027-09-17',
    returnDateStr: 'Viernes 17 de Septiembre de 2027',
    type: 'lft',
    isSuspended: true,
    description: 'Aniversario de la Independencia Nacional, descanso obligatorio (Art. 74 Fracc. V LFT).',
    imageUrl: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?auto=format&fit=crop&w=1000&q=80',
    imageCaption: '🇲🇽🎺 ¡Viva México! Conmemoración de nuestra Independencia 🦅✨',
    suspensionNotice: 'Con motivo del Aniversario de la Independencia de México, el 16 de septiembre se suspenden labores oficiales.',
    reflectionText: 'Celebremos con orgullo nuestras raíces y el espíritu de unidad que nos caracteriza como mexicanos.',
    technicalNotice: 'Verificar desconexión de equipos eléctricos al concluir la jornada previa.',
    hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
    isArchived: false,
    telegramStatus: 'pending',
    autoSendEnabled: false
  }
];

// Utilidades de fechas reales basadas en el reloj del sistema
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function parseLocalIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function formatSpanishDate(isoDate: string): { dateStr: string; dayOfWeek: string; dayNum: string; monthName: string; yearNum: number } {
  const dt = parseLocalIsoDate(isoDate);
  const dayOfWeek = DAYS_ES[dt.getDay()];
  const dayNum = String(dt.getDate()).padStart(2, '0');
  const monthName = MONTHS_ES[dt.getMonth()];
  const yearNum = dt.getFullYear();
  return {
    dateStr: `${dayNum} de ${monthName} de ${yearNum}`,
    dayOfWeek,
    dayNum,
    monthName,
    yearNum
  };
}

function computeNextWorkingDayStr(isoDate: string): string {
  const dt = parseLocalIsoDate(isoDate);
  dt.setDate(dt.getDate() + 1);
  if (dt.getDay() === 6) dt.setDate(dt.getDate() + 2); // Si cae sábado, pasa a lunes
  if (dt.getDay() === 0) dt.setDate(dt.getDate() + 1); // Si cae domingo, pasa a lunes
  const f = formatSpanishDate(
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  );
  return `${f.dayOfWeek} ${f.dateStr}`;
}

function getDaysDifferenceFromToday(isoDate: string, now: Date): number {
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const targetMidnight = parseLocalIsoDate(isoDate);
  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// Subcomponente aislado con dimensiones fijas (evita saltos de layout)
const HolidayCountdownBoxes: React.FC<{ targetIso: string }> = ({ targetIso }) => {
  const [tickNow, setTickNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTickNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const target = parseLocalIsoDate(targetIso);
  const diffMs = Math.max(0, target.getTime() - tickNow.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  return (
    <>
      {[
        { label: 'Días', value: days },
        { label: 'Horas', value: hours },
        { label: 'Min', value: minutes }
      ].map((unit, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '10px',
            padding: '6px 10px',
            width: '64px',
            height: '50px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {String(unit.value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            {unit.label}
          </div>
        </div>
      ))}
    </>
  );
};

const DEFAULT_SIFYGSA_BOT_TOKEN = '9036710155:AAEMFr2ypV1cmTAyXttKbbHw2yDyjFSkxA8';
const DEFAULT_SIFYGSA_CHAT_ID = '-5384799731';
const DEFAULT_SIFYGSA_CHANNEL_NAME = 'Grupo Moy';

export const HolidaysView: React.FC = () => {
  // Fecha del día actual estable (solo cambia si cambia de día a medianoche, evitando parpadeos)
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow((prev) => (prev.getDate() !== current.getDate() ? current : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Configuración de Telegram vinculada directamente al Grupo Moy (-5384799731)
  const [tgConfig, setTgConfig] = useState<TelegramConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TG_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isPlaceholder =
          !parsed.chatId ||
          parsed.chatId === '@SIFYGSA_Avisos' ||
          parsed.chatId === 'SIFYGSA-BUSINESS-SUITE (#General)';
        return {
          botToken: parsed.botToken || DEFAULT_SIFYGSA_BOT_TOKEN,
          chatId: isPlaceholder ? DEFAULT_SIFYGSA_CHAT_ID : parsed.chatId,
          channelName: isPlaceholder ? DEFAULT_SIFYGSA_CHANNEL_NAME : parsed.channelName || DEFAULT_SIFYGSA_CHANNEL_NAME,
          autoArchiveDays: parsed.autoArchiveDays || 30
        };
      }
    } catch {
      // ignore
    }
    return {
      botToken: DEFAULT_SIFYGSA_BOT_TOKEN,
      chatId: DEFAULT_SIFYGSA_CHAT_ID,
      channelName: DEFAULT_SIFYGSA_CHANNEL_NAME,
      autoArchiveDays: 30
    };
  });

  // Estado principal de días festivos persistido
  const [holidays, setHolidays] = useState<HolidayItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_HOLIDAYS;
  });

  // Guardar y limpiar automáticamente los archivados de más de 30 días
  useEffect(() => {
    const retentionDays = tgConfig.autoArchiveDays || 30;
    const nowMs = Date.now();
    let changed = false;

    const cleaned = holidays.filter((h) => {
      if (h.isArchived && h.archivedAt) {
        const archivedMs = new Date(h.archivedAt).getTime();
        const elapsedDays = (nowMs - archivedMs) / (1000 * 60 * 60 * 24);
        if (elapsedDays >= retentionDays) {
          changed = true;
          return false; // Se depura automáticamente tras 30 días
        }
      }
      return true;
    });

    if (changed) {
      setHolidays(cleaned);
    }
    try {
      localStorage.setItem(STORAGE_KEY_HOLIDAYS, JSON.stringify(changed ? cleaned : holidays));
    } catch {
      // ignore
    }
  }, [holidays, tgConfig.autoArchiveDays]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TG_CONFIG, JSON.stringify(tgConfig));
    } catch {
      // ignore
    }
  }, [tgConfig]);

  // Navegación de sub-vistas
  const [activeTab, setActiveTab] = useState<'activos' | 'programados' | 'calendario' | 'archivados'>('activos');
  const [filterType, setFilterType] = useState<'todos' | 'lft' | 'sifygsa'>('todos');
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());

  // Modales
  const [selectedHolidayForTelegram, setSelectedHolidayForTelegram] = useState<HolidayItem | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isTgConfigModalOpen, setIsTgConfigModalOpen] = useState<boolean>(false);
  const [holidayForPrintPdf, setHolidayForPrintPdf] = useState<HolidayItem | null>(null);

  // Estados de Telegram en vivo
  const [telegramCustomText, setTelegramCustomText] = useState<string>('');
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [isCopiedText, setIsCopiedText] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Input de archivo para cargar imágenes / flyers locales
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Enriquecer cada festividad con el cálculo real respecto a la fecha de la máquina
  const enrichedHolidays = useMemo(() => {
    return holidays
      .map((h) => {
        const daysDiff = getDaysDifferenceFromToday(h.isoDate, now);
        const formatted = formatSpanishDate(h.isoDate);
        const isPast = daysDiff < 0;
        const isToday = daysDiff === 0;
        // Si ya pasó o si fue archivado manualmente, se considera en la bandeja de Archivados
        const effectiveArchived = Boolean(h.isArchived || isPast);
        const archivedDateRef = h.archivedAt ? new Date(h.archivedAt) : parseLocalIsoDate(h.isoDate);
        const daysSinceArchived = Math.max(
          0,
          Math.floor((now.getTime() - archivedDateRef.getTime()) / (1000 * 60 * 60 * 24))
        );
        const daysUntilAutoDelete = Math.max(1, (tgConfig.autoArchiveDays || 30) - daysSinceArchived);

        return {
          ...h,
          daysDiff,
          isPast,
          isToday,
          effectiveArchived,
          daysUntilAutoDelete,
          dateStr: formatted.dateStr,
          dayOfWeek: formatted.dayOfWeek,
          dayNum: formatted.dayNum,
          monthName: formatted.monthName,
          yearNum: formatted.yearNum,
          typeLabel: h.type === 'lft' ? 'Obligatorio LFT (Art. 74)' : 'Asueto Institucional'
        };
      })
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [holidays, now, tgConfig.autoArchiveDays]);

  // Próximo día festivo activo para el Hero Banner con cuenta regresiva
  const nextUpcomingHoliday = useMemo(() => {
    return enrichedHolidays.find((h) => !h.effectiveArchived && h.daysDiff >= 0) || null;
  }, [enrichedHolidays]);

  // Listas separadas por bandeja
  const activeHolidays = useMemo(() => {
    return enrichedHolidays.filter((h) => {
      if (h.effectiveArchived) return false;
      if (filterType === 'lft') return h.type === 'lft';
      if (filterType === 'sifygsa') return h.type === 'sifygsa';
      return true;
    });
  }, [enrichedHolidays, filterType]);

  const archivedHolidays = useMemo(() => {
    return enrichedHolidays.filter((h) => h.effectiveArchived);
  }, [enrichedHolidays]);

  const scheduledHolidays = useMemo(() => {
    return enrichedHolidays.filter((h) => !h.effectiveArchived);
  }, [enrichedHolidays]);

  // Generador de texto oficial con estilo SIFYGSA
  const buildOfficialTelegramMessage = (h: HolidayItem) => {
    const f = formatSpanishDate(h.isoDate);
    const hashtagsStr =
      h.hashtags && h.hashtags.length > 0
        ? h.hashtags.join(' ')
        : '#OneSoul #OneSIFYGSA #HacemosQueLasCosasSucedan';

    const statusLine = h.isSuspended
      ? `📌 *Estado de labores:* Suspensión de actividades (${f.dayOfWeek} ${f.dateStr}).\n🗓️ *Reanudación de labores:* ${h.returnDateStr}.`
      : `📌 *Estado de labores:* Jornada laboral ordinaria (${f.dayOfWeek} ${f.dateStr}).`;

    return `Buenos días Compañeros ☀️\n\n${h.imageCaption}\n\n${h.suspensionNotice}\n\n${h.reflectionText}\n\n${statusLine}\n\n⚠️ ${h.technicalNotice}\n\nAtentamente,\n*Departamento de Recursos Humanos — SIFYGSA*\n${hashtagsStr}`;
  };

  // Abrir modal de Telegram
  const handleOpenTelegramModal = (h: HolidayItem) => {
    setSelectedHolidayForTelegram(h);
    setTelegramCustomText(buildOfficialTelegramMessage(h));
  };

  // Función auxiliar que resuelve automáticamente el Chat ID de SIFYGSA-BUSINESS-SUITE desde getUpdates
  const resolveTargetChatId = async (token: string, currentChatId: string): Promise<{ chatId: string; title: string } | null> => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        // Buscar primero si hay un grupo llamado SIFYGSA-BUSINESS-SUITE
        for (let i = data.result.length - 1; i >= 0; i--) {
          const upd = data.result[i];
          const chatObj = upd.message?.chat || upd.channel_post?.chat || upd.my_chat_member?.chat;
          if (chatObj && chatObj.id) {
            const title =
              chatObj.title ||
              [chatObj.first_name, chatObj.last_name].filter(Boolean).join(' ') ||
              chatObj.username ||
              'SIFYGSA-BUSINESS-SUITE (#General)';
            if (String(title).toUpperCase().includes('SIFYGSA')) {
              return { chatId: String(chatObj.id), title: `${title} (#General)` };
            }
          }
        }
        // Si no encontró por nombre exacto, tomar el chat más reciente donde se agregó o habló al bot
        const lastUpdate = data.result[data.result.length - 1];
        const fallbackChat =
          lastUpdate.message?.chat || lastUpdate.channel_post?.chat || lastUpdate.my_chat_member?.chat;
        if (fallbackChat && fallbackChat.id) {
          const title =
            fallbackChat.title ||
            [fallbackChat.first_name, fallbackChat.last_name].filter(Boolean).join(' ') ||
            fallbackChat.username ||
            'SIFYGSA-BUSINESS-SUITE (#General)';
          return { chatId: String(fallbackChat.id), title };
        }
      }
    } catch {
      // ignore
    }
    if (/^-?\d+$/.test(currentChatId.trim()) || currentChatId.trim().startsWith('@')) {
      return { chatId: currentChatId.trim(), title: tgConfig.channelName };
    }
    return null;
  };

  // Auto-detectar el Chat ID consultando getUpdates del Bot Token
  const handleAutoDetectTelegramChat = async () => {
    const token = tgConfig.botToken.trim();
    if (!token) {
      showToast('⚠️ Primero pega tu Bot Token de @BotFather');
      return;
    }
    const resolved = await resolveTargetChatId(token, '');
    if (resolved) {
      setTgConfig((prev) => ({
        ...prev,
        chatId: resolved.chatId,
        channelName: resolved.title
      }));
      showToast(`✓ Conectado con: ${resolved.title} (ID: ${resolved.chatId})`);
    } else {
      showToast('⚠️ Agrega el bot @Sifygsa_RRHH_Prueba_2026_bot al grupo SIFYGSA-BUSINESS-SUITE y envía "/hola" en #General.');
    }
  };

  // Enviar mensaje de prueba inmediato
  const handleSendTestTelegram = async () => {
    const token = tgConfig.botToken.trim();
    if (!token) {
      showToast('⚠️ Ingresa tu Bot Token primero.');
      return;
    }
    const resolved = await resolveTargetChatId(token, tgConfig.chatId);
    if (!resolved) {
      showToast('⚠️ Primero agrega @Sifygsa_RRHH_Prueba_2026_bot al grupo SIFYGSA-BUSINESS-SUITE y escribe "/hola" en #General.');
      return;
    }
    if (resolved.chatId !== tgConfig.chatId) {
      setTgConfig((prev) => ({ ...prev, chatId: resolved.chatId, channelName: resolved.title }));
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: resolved.chatId,
          text: `✅ Conexión Exitosa — SIFYGSA RRHH\n\nEl bot ha quedado conectado a ${resolved.title} para publicar los comunicados oficiales de Días Festivos y Cumpleaños.`
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✓ ¡Mensaje de prueba enviado a ${resolved.title}!`);
      } else {
        showToast(`⚠️ Telegram respondió: ${data.description}`);
      }
    } catch {
      showToast('⚠️ No se pudo enviar la prueba. Revisa tu conexión.');
    }
  };

  // Enviar o publicar aviso en Telegram (API real si hay Bot Token o enlace directo + marcado como Enviado)
  const handleSendToTelegram = async (holiday: HolidayItem, customMessage?: string) => {
    const messageToSend = customMessage || buildOfficialTelegramMessage(holiday);
    setIsSendingTelegram(true);

    try {
      const token = tgConfig.botToken.trim();
      if (token) {
        const resolved = await resolveTargetChatId(token, tgConfig.chatId);
        if (!resolved) {
          throw new Error('Agrega @Sifygsa_RRHH_Prueba_2026_bot al grupo SIFYGSA-BUSINESS-SUITE y escribe "/hola" en #General');
        }
        if (resolved.chatId !== tgConfig.chatId) {
          setTgConfig((prev) => ({ ...prev, chatId: resolved.chatId, channelName: resolved.title }));
        }
        const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: resolved.chatId,
            text: messageToSend.replace(/\*/g, '')
          })
        });
        const data = await response.json();
        if (!data.ok) {
          throw new Error(data.description || 'Error al conectar con Telegram Bot API');
        }
      } else {
        const encoded = encodeURIComponent(messageToSend.replace(/\*/g, ''));
        window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
      }

      const nowFormatted = new Date().toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      setHolidays((prev) =>
        prev.map((item) =>
          item.id === holiday.id
            ? {
                ...item,
                telegramStatus: 'sent',
                sentAt: nowFormatted,
                sentChannel: tgConfig.chatId || '@SIFYGSA_Avisos'
              }
            : item
        )
      );

      showToast(`✓ Aviso de "${holiday.title}" marcado como Enviado a ${tgConfig.chatId}`);
      setSelectedHolidayForTelegram(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo conectar al Bot';
      showToast(`⚠️ ${msg}. Verifica el Token en Configurar Telegram.`);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Descargar Póster / Tarjeta Gráfica Creativa en PNG (Imagen + Texto corporativo unificado en Canvas)
  const handleDownloadCreativePoster = (h: HolidayItem) => {
    const f = formatSpanishDate(h.isoDate);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPosterContent = (loadedImg?: HTMLImageElement) => {
      // Fondo corporativo elegante
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1350);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Franja superior de marca SIFYGSA
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(0, 0, 1080, 16);

      // Encabezado institucional
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px Inter, system-ui, sans-serif';
      ctx.fillText('SIFYGSA — COMUNICADO OFICIAL RRHH', 64, 82);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 22px Inter, system-ui, sans-serif';
      ctx.fillText(
        h.type === 'lft' ? 'DESCANSO OBLIGATORIO LFT (ART. 74)' : 'ASUETO INSTITUCIONAL SIFYGSA',
        64,
        120
      );

      // Imagen alusiva en marco redondeado
      if (loadedImg) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(64, 155, 952, 460, 24);
        ctx.clip();
        ctx.drawImage(loadedImg, 64, 155, 952, 460);
        ctx.restore();
      } else {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(64, 155, 952, 460, 24);
        ctx.fill();
      }

      // Tarjeta blanca de contenido
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(64, 650, 952, 620, 24);
      ctx.fill();

      // Badge de estado
      ctx.fillStyle = h.isSuspended ? '#DC2626' : '#0284C7';
      ctx.beginPath();
      ctx.roundRect(104, 690, 420, 48, 12);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText(
        h.isSuspended ? 'SUSPENSIÓN DE LABORES' : 'JORNADA LABORAL ORDINARIA',
        128,
        722
      );

      // Título de la festividad
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.fillText(h.title.slice(0, 38), 104, 795);

      // Fecha oficial
      ctx.fillStyle = '#E11D48';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText(`📅 ${f.dayOfWeek} ${f.dateStr}`, 104, 845);

      // Texto de suspensión y reflexión (envoltura de líneas)
      ctx.fillStyle = '#334155';
      ctx.font = '500 24px Inter, system-ui, sans-serif';
      const fullParagraph = `${h.suspensionNotice} ${h.reflectionText}`;
      const words = fullParagraph.replace(/\n+/g, ' ').split(' ');
      let line = '';
      let yPos = 905;
      const maxWidth = 870;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 104, yPos);
          line = words[i] + ' ';
          yPos += 36;
          if (yPos > 1085) break;
        } else {
          line = testLine;
        }
      }
      if (yPos <= 1085) {
        ctx.fillText(line, 104, yPos);
      }

      // Recuadro de regreso a labores
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(104, 1115, 872, 75, 14);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 23px Inter, system-ui, sans-serif';
      ctx.fillText(`🕒 Reanudación de labores: ${h.returnDateStr}`, 130, 1162);

      // Hashtags al pie
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText((h.hashtags || ['#OneSoul', '#OneSIFYGSA']).join('   '), 104, 1235);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Comunicado_${h.title.replace(/\s+/g, '_')}_SIFYGSA.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('✓ Póster gráfico descargado en PNG de alta calidad');
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawPosterContent(img);
    img.onerror = () => drawPosterContent(undefined);
    img.src = h.imageUrl;
  };

  // Toggle de autorización de Dirección General (Se suspende vs Jornada normal)
  const handleToggleSuspension = (id: string) => {
    setHolidays((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.isSuspended;
          const f = formatSpanishDate(h.isoDate);
          showToast(
            nextState
              ? `✓ Descanso autorizado para "${h.title}"`
              : `✓ Configurado como Jornada Laboral Ordinaria para "${h.title}"`
          );
          return {
            ...h,
            isSuspended: nextState,
            suspensionNotice: nextState
              ? `Con motivo de ${h.title}, este próximo ${f.dateStr} se suspenden actividades laborales.`
              : `Se informa al personal que el día ${f.dateStr} (${h.title}) se laborará en jornada ordinaria habitual.`
          };
        }
        return h;
      })
    );
  };

  // Archivar manualmente (va a la carpeta de 30 días)
  const handleArchiveHoliday = (id: string, title: string) => {
    setHolidays((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, isArchived: true, archivedAt: new Date().toISOString(), autoSendEnabled: false }
          : h
      )
    );
    showToast(`✓ "${title}" movido a Archivados (se conservará por 30 días)`);
  };

  // Restaurar desde Archivados / Papelera (por si RRHH necesita corregirlo y reenviarlo)
  const handleRestoreHoliday = (h: HolidayItem) => {
    const daysDiff = getDaysDifferenceFromToday(h.isoDate, now);
    let updatedIso = h.isoDate;
    let updatedReturnStr = h.returnDateStr;

    // Si la fecha ya había pasado (ej. del año anterior o principios de mes), al restaurar abrimos edición o la reactivamos
    if (daysDiff < 0) {
      const dt = parseLocalIsoDate(h.isoDate);
      if (dt.getFullYear() <= now.getFullYear()) {
        dt.setFullYear(now.getFullYear() + 1);
      }
      updatedIso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      updatedReturnStr = computeNextWorkingDayStr(updatedIso);
    }

    const restored: HolidayItem = {
      ...h,
      isoDate: updatedIso,
      returnDateStr: updatedReturnStr,
      isArchived: false,
      archivedAt: undefined,
      telegramStatus: 'pending'
    };

    setHolidays((prev) => prev.map((item) => (item.id === h.id ? restored : item)));
    setEditingHoliday(restored);
    setIsCreatingNew(false);
    setIsEditingModalOpen(true);
    showToast(`✓ "${h.title}" restaurado. Puedes corregir el mensaje o actualizar su fecha.`);
  };

  // Toggle rápido de Auto-Envío programado (CRUD de programación)
  const handleToggleAutoSend = (id: string) => {
    setHolidays((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextAuto = !h.autoSendEnabled;
          const defaultSchedule = h.scheduledDateTime || `${h.isoDate}T09:00`;
          showToast(
            nextAuto
              ? `✓ Auto-envío activado para "${h.title}"`
              : `⏸️ Auto-envío pausado para "${h.title}"`
          );
          return {
            ...h,
            autoSendEnabled: nextAuto,
            scheduledDateTime: defaultSchedule,
            telegramStatus: nextAuto ? 'scheduled' : h.telegramStatus === 'sent' ? 'sent' : 'pending'
          };
        }
        return h;
      })
    );
  };

  // Actualizar fecha/hora de programación en línea
  const handleUpdateScheduleDateTime = (id: string, newDateTime: string) => {
    setHolidays((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              scheduledDateTime: newDateTime,
              autoSendEnabled: Boolean(newDateTime),
              telegramStatus: newDateTime ? 'scheduled' : 'pending'
            }
          : h
      )
    );
    showToast('✓ Horario de auto-envío actualizado');
  };

  // Abrir modal de edición
  const handleStartEdit = (h: HolidayItem) => {
    setEditingHoliday({ ...h });
    setIsCreatingNew(false);
    setIsEditingModalOpen(true);
  };

  // Abrir modal para crear nuevo aviso
  const handleStartCreate = () => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 7);
    const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const newItem: HolidayItem = {
      id: `H-${Date.now()}`,
      title: '',
      isoDate: iso,
      returnDateStr: computeNextWorkingDayStr(iso),
      type: 'sifygsa',
      isSuspended: true,
      description: 'Asueto institucional sujeto a disposición de Dirección General.',
      imageUrl: SUGGESTED_IMAGES[0].url,
      imageCaption: '🎉✨ ¡Aviso Oficial de Descanso! ☀️🔔',
      suspensionNotice: 'Se informa al personal que con motivo de esta fecha conmemorativa, se suspenden actividades laborales.',
      reflectionText: 'Para que puedan organizar sus actividades y disfrutar de este día en compañía de su familia.',
      technicalNotice: 'No olviden apagar y desconectar sus equipos electrónicos antes de retirarse.',
      hashtags: ['#OneSoul', '#OneSIFYGSA', '#HacemosQueLasCosasSucedan'],
      isArchived: false,
      telegramStatus: 'pending',
      autoSendEnabled: false,
      scheduledDateTime: `${iso}T09:00`
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
      showToast('✓ Flyer cargado exitosamente');
    };
    reader.readAsDataURL(file);
  };

  // Guardar edición o nuevo registro
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday || !editingHoliday.title.trim()) return;

    const normalized: HolidayItem = {
      ...editingHoliday,
      isArchived: false,
      telegramStatus: editingHoliday.autoSendEnabled
        ? 'scheduled'
        : editingHoliday.telegramStatus || 'pending'
    };

    if (isCreatingNew) {
      setHolidays((prev) => [normalized, ...prev]);
      showToast(`✓ Festividad "${normalized.title}" registrada`);
    } else {
      setHolidays((prev) => prev.map((h) => (h.id === normalized.id ? normalized : h)));
      showToast(`✓ "${normalized.title}" actualizado correctamente`);
    }
    setIsEditingModalOpen(false);
    setEditingHoliday(null);
  };

  // Eliminar definitivamente
  const handleDeletePermanent = (id: string, title: string) => {
    if (window.confirm(`¿Eliminar definitivamente "${title}"? Esta acción no se puede deshacer.`)) {
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      showToast(`✓ "${title}" eliminado definitivamente`);
    }
  };

  // Copiar texto al portapapeles
  const handleCopyText = () => {
    navigator.clipboard.writeText(telegramCustomText);
    setIsCopiedText(true);
    showToast('✓ Comunicado copiado al portapapeles');
    setTimeout(() => setIsCopiedText(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

      {/* ========================================================================= */}
      {/* 1. ENCABEZADO LIMPIO Y PRECISO (SIN RELLENO INNECESARIO)                  */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
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
              <CalendarDays className="w-5 h-5" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Días Festivos y Comunicados
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284C7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Send className="w-3 h-3" />
                  {tgConfig.chatId || '@SIFYGSA_Avisos'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Gestión de asuetos oficiales y comunicados institucionales.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTgConfigModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 13px' }}
              title="Configurar canal de Telegram y auto-archivo"
            >
              <Settings className="w-4 h-4" />
              <span>Canal Telegram</span>
            </button>

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
      </div>

      {/* ========================================================================= */}
      {/* 2. BANNER HERO CON CUENTA REGRESIVA EN TIEMPO REAL                        */}
      {/* ========================================================================= */}
      {nextUpcomingHoliday && (
        <div
          className="card"
          style={{
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px', flex: 1 }}>
            <img
              src={nextUpcomingHoliday.imageUrl}
              alt={nextUpcomingHoliday.title}
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/holidays/dia_de_muertos_sifygsa.jpg';
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: '#E11D48',
                    color: '#FFFFFF'
                  }}
                >
                  Próxima Fecha Cercana
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: '#E2E8F0'
                  }}
                >
                  {nextUpcomingHoliday.typeLabel}
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {nextUpcomingHoliday.title}
              </h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0' }}>
                {nextUpcomingHoliday.dayOfWeek} {nextUpcomingHoliday.dateStr} ·{' '}
                <strong style={{ color: '#F8FAFC' }}>
                  {nextUpcomingHoliday.isSuspended ? 'Sin Labores (Asueto)' : 'Jornada Ordinaria'}
                </strong>
              </p>
            </div>
          </div>

          {/* Cronómetro en vivo aislado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <HolidayCountdownBoxes targetIso={nextUpcomingHoliday.isoDate} />

            <button
              type="button"
              onClick={() => handleOpenTelegramModal(nextUpcomingHoliday)}
              className="btn btn-primary"
              style={{
                marginLeft: '6px',
                backgroundColor: '#0284C7',
                borderColor: '#0284C7',
                fontSize: '12px',
                padding: '9px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Preparar Envío</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PESTAÑAS DE NAVEGACIÓN Y FILTROS                                       */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('activos')}
            className={`btn ${activeTab === 'activos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Próximos Festivos ({ enrichedHolidays.filter((h) => !h.effectiveArchived).length })</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programados')}
            className={`btn ${activeTab === 'programados' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Programación Auto-Envío ({ enrichedHolidays.filter((h) => !h.effectiveArchived && h.autoSendEnabled).length })</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendario')}
            className={`btn ${activeTab === 'calendario' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendario Anual y Ley LFT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archivados')}
            className={`btn ${activeTab === 'archivados' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archivados / Concluidos 30d ({ archivedHolidays.length })</span>
          </button>
        </div>

        {activeTab === 'activos' && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilterType('todos')}
              className={`btn ${filterType === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterType('lft')}
              className={`btn ${filterType === 'lft' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Obligatorios LFT
            </button>
            <button
              type="button"
              onClick={() => setFilterType('sifygsa')}
              className={`btn ${filterType === 'sifygsa' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Asuetos Dirección
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA A: PRÓXIMOS DÍAS FESTIVOS ACTIVOS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'activos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
          {activeHolidays.map((h) => {
            const isSoon = h.daysDiff <= 15;
            return (
              <div
                key={h.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                  border: isSoon ? '1.5px solid var(--brand-300)' : '1px solid var(--border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'none'
                }}
              >
                <div>
                  {/* Banner Gráfico con CSS Background (Estable sin saltos de layout) */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '150px',
                      backgroundColor: '#1E293B',
                      backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.28) 0%, rgba(15,23,42,0.88) 100%), url("${h.imageUrl}"), url("/assets/holidays/dia_de_muertos_sifygsa.jpg")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      overflow: 'hidden'
                    }}
                  >

                    {/* Badges Superiores: Tipo de feriado + Conteo automático */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: h.type === 'lft' ? 'rgba(220, 38, 38, 0.92)' : 'rgba(2, 132, 199, 0.92)',
                          color: '#FFFFFF'
                        }}
                      >
                        {h.type === 'lft' ? 'Obligatorio LFT' : 'Decisión Dirección'}
                      </span>

                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          backgroundColor: h.isToday ? '#16A34A' : isSoon ? '#EA580C' : 'rgba(15, 23, 42, 0.85)',
                          padding: '3px 9px',
                          borderRadius: '6px'
                        }}
                      >
                        {h.isToday ? '¡Es Hoy!' : h.daysDiff === 1 ? 'Mañana' : `Faltan ${h.daysDiff} días`}
                      </span>
                    </div>

                    {/* Barra Inferior de la Imagen: Estado de Labores + Estatus de Telegram */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSuspension(h.id)}
                        title="Clic para alternar entre Suspensión de Labores o Jornada Ordinaria"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          cursor: 'pointer',
                          backgroundColor: h.isSuspended ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                          color: '#FFFFFF'
                        }}
                      >
                        <span>{h.isSuspended ? '● Sin Labores (Descanso)' : '● Se Labora Normal'}</span>
                      </button>

                      {/* Badge de Estado de Envío a Telegram */}
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            h.telegramStatus === 'sent'
                              ? 'rgba(22, 163, 74, 0.95)'
                              : h.autoSendEnabled
                              ? 'rgba(2, 132, 199, 0.95)'
                              : 'rgba(51, 65, 85, 0.9)',
                          color: '#FFFFFF'
                        }}
                      >
                        {h.telegramStatus === 'sent'
                          ? '✓ Enviado'
                          : h.autoSendEnabled
                          ? '⏰ Auto-Envío'
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div style={{ padding: '15px 18px 12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {h.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(h)}
                          title="Editar comunicado y programación"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveHoliday(h.id, h.title)}
                          title="Mover a Archivados (30 días)"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Fecha Oficial y Regreso */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{h.dayOfWeek} {h.dateStr}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '9px' }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {h.isSuspended ? (
                          <>Regreso: <strong>{h.returnDateStr}</strong></>
                        ) : (
                          <strong>Asistencia ordinaria con salario normal</strong>
                        )}
                      </span>
                    </div>

                    {/* Frase Alusiva */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--brand-700)',
                        backgroundColor: 'var(--brand-50)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        marginBottom: '8px',
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

                {/* Pie de Tarjeta: Acciones de Telegram y Descargas */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '11px 18px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenTelegramModal(h)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      padding: '6px 10px',
                      backgroundColor: h.telegramStatus === 'sent' ? '#16A34A' : undefined,
                      borderColor: h.telegramStatus === 'sent' ? '#16A34A' : undefined
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{h.telegramStatus === 'sent' ? 'Enviado (Reenviar / Editar)' : 'Aviso Telegram'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setHolidayForPrintPdf(h)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 9px', fontSize: '11px' }}
                    title="Ver y Descargar Comunicado Oficial en PDF Membretado"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleDownloadCreativePoster(h)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 9px', fontSize: '11px' }}
                    title="Descargar Póster Gráfico (Imagen + Texto en PNG)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Póster</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA B: CRUD DE PROGRAMACIÓN DE AUTO-ENVÍO A TELEGRAM                    */}
      {/* ========================================================================= */}
      {activeTab === 'programados' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Programación de Publicaciones en Telegram
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Activa, pausa o ajusta la fecha y hora exacta en que se enviará cada comunicado al canal <strong>{tgConfig.chatId}</strong>.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Festividad</th>
                  <th style={{ padding: '10px 12px' }}>Fecha del Día</th>
                  <th style={{ padding: '10px 12px' }}>Horario de Envío Programado</th>
                  <th style={{ padding: '10px 12px' }}>Auto-Envío</th>
                  <th style={{ padding: '10px 12px' }}>Estatus</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {scheduledHolidays.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {h.title}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {h.typeLabel} · {h.isSuspended ? 'Sin Labores' : 'Se Labora'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {h.dayOfWeek} {h.dateStr}
                      <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                        {h.isToday ? '¡Hoy!' : `En ${h.daysDiff} días`}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="datetime-local"
                        value={h.scheduledDateTime || `${h.isoDate}T09:00`}
                        onChange={(e) => handleUpdateScheduleDateTime(h.id, e.target.value)}
                        className="input-text"
                        style={{ fontSize: '12px', padding: '5px 8px', height: '32px' }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleAutoSend(h.id)}
                        className={`btn ${h.autoSendEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: h.autoSendEnabled ? '#0284C7' : undefined,
                          borderColor: h.autoSendEnabled ? '#0284C7' : undefined
                        }}
                      >
                        {h.autoSendEnabled ? (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Pausado</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {h.telegramStatus === 'sent' ? (
                        <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Enviado ({h.sentAt})
                        </span>
                      ) : h.autoSendEnabled ? (
                        <span style={{ color: '#0284C7', fontWeight: 700, fontSize: '11.5px' }}>
                          ⏰ Programado
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                          Manual / Sin programar
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTelegramModal(h)}
                          className="btn btn-primary"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                        >
                          Enviar Ahora
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(h)}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA C: CALENDARIO ANUAL Y MARCO NORMATIVO LFT VS DIRECCIÓN              */}
      {/* ========================================================================= */}
      {activeTab === 'calendario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Explicación Normativa LFT vs Asueto Dirección General */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #DC2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck className="w-4 h-4" style={{ color: '#DC2626' }} />
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  1. Descanso Obligatorio de Ley (Art. 74 LFT)
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Son feriados oficiales por ley federal (1 Ene, 1er lunes Feb, 3er lunes Mar, 1 May, 16 Sep, 3er lunes Nov, 25 Dic). Se suspenden labores obligatoriamente; si algún colaborador de guardia labora por necesidad operativa, el Art. 75 LFT estipula pago de salario triple.
              </p>
            </div>

            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #0284C7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Building2 className="w-4 h-4" style={{ color: '#0284C7' }} />
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  2. Asuetos Tradicionales (Decisión de Dirección General)
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Fechas como el <strong>02 de Noviembre (Día de Muertos)</strong>, <strong>12 de Diciembre</strong>, Jueves/Viernes Santo o 10 de Mayo <strong>no son obligatorias en la LFT</strong>. Dirección General decide si se otorga el día como cortesía con sueldo normal o si se labora en horario ordinario sin pago extra ni recargos legales.
              </p>
            </div>
          </div>

          {/* Selector de Año y Cuadrícula de Meses */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCalendarYear((y) => y - 1)}
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Calendario de Días Festivos {calendarYear}
                </h3>
                <button
                  type="button"
                  onClick={() => setCalendarYear((y) => y + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                  Obligatorio LFT
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                  Asueto Dirección General
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              {MONTHS_ES.map((monthName, mIdx) => {
                const monthHolidays = enrichedHolidays.filter(
                  (h) => h.yearNum === calendarYear && parseLocalIsoDate(h.isoDate).getMonth() === mIdx
                );
                return (
                  <div
                    key={monthName}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: monthHolidays.length > 0 ? 'var(--surface)' : 'var(--surface-alt)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {monthName}
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {monthHolidays.length} {monthHolidays.length === 1 ? 'fecha' : 'fechas'}
                      </span>
                    </div>

                    {monthHolidays.length === 0 ? (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        Sin festivos registrados
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {monthHolidays.map((mh) => (
                          <div
                            key={mh.id}
                            onClick={() => handleStartEdit(mh)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              backgroundColor: mh.type === 'lft' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                              borderLeft: `3px solid ${mh.type === 'lft' ? '#DC2626' : '#0284C7'}`,
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              Día {mh.dayNum} · {mh.title}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {mh.isSuspended ? 'Suspensión de labores' : 'Se labora normal'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA D: SUBCARPETA DE ARCHIVADOS / PAPELERA DE 30 DÍAS                   */}
      {/* ========================================================================= */}
      {activeTab === 'archivados' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Subcarpeta de Fechas Concluidas y Archivadas (Retención 30 días)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Las festividades que ya pasaron (como Día de Muertos o Revolución Mexicana) se archivan automáticamente aquí y se depuran tras {tgConfig.autoArchiveDays} días. Si necesitas corregir un aviso o reutilizarlo, haz clic en <strong>Restaurar y Editar</strong>.
              </p>
            </div>
          </div>

          {archivedHolidays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay festividades archivadas en este momento.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {archivedHolidays.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          backgroundColor: '#334155',
                          color: '#FFFFFF'
                        }}
                      >
                        Concluido / Archivado
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#DC2626' }}>
                        Se elimina en {h.daysUntilAutoDelete} días
                      </span>
                    </div>

                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                      {h.title}
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Fecha pasada: {h.dayOfWeek} {h.dateStr}
                    </div>
                    {h.sentAt && (
                      <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
                        ✓ Enviado a Telegram el {h.sentAt}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleRestoreHoliday(h)}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar / Corregir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePermanent(h.id, h.title)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11.5px', padding: '6px 10px', color: '#DC2626' }}
                      title="Eliminar ahora"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DIFUSIÓN DIRECTA A TELEGRAM                                      */}
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
              maxWidth: '640px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '22px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Publicar Comunicado en Telegram
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Destino: <strong>{tgConfig.chatId || '@SIFYGSA_Avisos'}</strong> ({tgConfig.channelName})
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

            {/* Vista Previa Limpia de la Publicación */}
            <div style={{ marginBottom: '14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--surface-alt)' }}>
              <img
                src={selectedHolidayForTelegram.imageUrl}
                alt={selectedHolidayForTelegram.title}
                style={{ width: '100%', maxHeight: '210px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedHolidayForTelegram.title}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadCreativePoster(selectedHolidayForTelegram)}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar Póster PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedHolidayForTelegram;
                      setSelectedHolidayForTelegram(null);
                      setHolidayForPrintPdf(target);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Hoja PDF Oficial</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                MENSAJE A ENVIAR AL CANAL DE TELEGRAM (PUEDES AJUSTARLO ANTES DE PUBLICAR):
              </label>
              <textarea
                value={telegramCustomText}
                onChange={(e) => setTelegramCustomText(e.target.value)}
                rows={9}
                className="input-text"
                style={{ width: '100%', fontSize: '12px', lineHeight: 1.5, padding: '10px 12px', borderRadius: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyText}
                style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCopiedText ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedHolidayForTelegram(null)}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isSendingTelegram}
                  onClick={() => handleSendToTelegram(selectedHolidayForTelegram, telegramCustomText)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '6px 16px',
                    backgroundColor: '#0284C7',
                    borderColor: '#0284C7'
                  }}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingTelegram ? 'Enviando...' : 'Enviar a Telegram y Marcar Enviado'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDICIÓN CON PLANTILLAS RÁPIDAS Y VISTA PREVIA INTEGRADA LIMPIA   */}
      {/* ========================================================================= */}
      {isEditingModalOpen && editingHoliday && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
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
              maxWidth: '960px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '22px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isCreatingNew ? 'Nuevo Comunicado de Día Festivo' : `Editar Festividad: ${editingHoliday.title}`}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Configura la fecha, aplica una plantilla rápida y revisa la vista previa limpia a la derecha.
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

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                {/* Columna Izquierda: Formulario y Plantillas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        NOMBRE DE LA FESTIVIDAD *
                      </label>
                      <input
                        type="text"
                        value={editingHoliday.title}
                        onChange={(e) => setEditingHoliday({ ...editingHoliday, title: e.target.value })}
                        placeholder="Ej. Día de la Virgen de Guadalupe"
                        className="input-text"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        CLASIFICACIÓN LEGAL
                      </label>
                      <select
                        value={editingHoliday.type}
                        onChange={(e) =>
                          setEditingHoliday({
                            ...editingHoliday,
                            type: e.target.value as 'lft' | 'sifygsa',
                            description:
                              e.target.value === 'lft'
                                ? 'Descanso obligatorio estipulado en el Artículo 74 de la Ley Federal del Trabajo.'
                                : 'Fecha tradicional sujeta a autorización de Dirección General con pago ordinario.'
                          })
                        }
                        className="select-control"
                        style={{ width: '100%', height: '36px' }}
                      >
                        <option value="sifygsa">Asueto Institucional (Decisión Dirección)</option>
                        <option value="lft">Obligatorio LFT (Art. 74)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        FECHA DE LA CONMEMORACIÓN *
                      </label>
                      <input
                        type="date"
                        value={editingHoliday.isoDate}
                        onChange={(e) => {
                          const newIso = e.target.value;
                          if (!newIso) return;
                          setEditingHoliday({
                            ...editingHoliday,
                            isoDate: newIso,
                            returnDateStr: computeNextWorkingDayStr(newIso),
                            scheduledDateTime: `${newIso}T09:00`
                          });
                        }}
                        className="input-text"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        DISPOSICIÓN DE DIRECCIÓN GENERAL
                      </label>
                      <select
                        value={editingHoliday.isSuspended ? 'suspended' : 'active'}
                        onChange={(e) => setEditingHoliday({ ...editingHoliday, isSuspended: e.target.value === 'suspended' })}
                        className="select-control"
                        style={{ width: '100%', height: '36px' }}
                      >
                        <option value="suspended">Se suspenden labores (Descanso)</option>
                        <option value="active">Se labora normal (Jornada ordinaria)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      REANUDACIÓN DE LABORES
                    </label>
                    <input
                      type="text"
                      value={editingHoliday.returnDateStr}
                      onChange={(e) => setEditingHoliday({ ...editingHoliday, returnDateStr: e.target.value })}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Selector de Plantillas Rápidas (Templates) */}
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>PLANTILLAS RÁPIDAS DE REDACCIÓN (1 CLIC):</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {MESSAGE_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            const f = formatSpanishDate(editingHoliday.isoDate);
                            const generated = tpl.apply(
                              editingHoliday.title || 'esta fecha conmemorativa',
                              `${f.dayOfWeek} ${f.dateStr}`
                            );
                            setEditingHoliday({
                              ...editingHoliday,
                              ...generated,
                              isSuspended: tpl.id !== 'laborable'
                            });
                            showToast(`✓ Plantilla "${tpl.label}" aplicada`);
                          }}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          title={tpl.description}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selección de Imagen Alusiva */}
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      IMAGEN O FLYER EXCLUSIVO DE LA FECHA
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <select
                        value={editingHoliday.imageUrl}
                        onChange={(e) => setEditingHoliday({ ...editingHoliday, imageUrl: e.target.value })}
                        className="select-control"
                        style={{ flex: 1, fontSize: '11.5px', height: '34px' }}
                      >
                        {SUGGESTED_IMAGES.map((img, idx) => (
                          <option key={idx} value={img.url}>
                            [{img.category}] {img.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Propia</span>
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUploadImageFile}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      ENCABEZADO / FRASE ALUSIVA
                    </label>
                    <input
                      type="text"
                      value={editingHoliday.imageCaption}
                      onChange={(e) => setEditingHoliday({ ...editingHoliday, imageCaption: e.target.value })}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      MENSAJE DE SUSPENSIÓN O JORNADA
                    </label>
                    <textarea
                      rows={2}
                      value={editingHoliday.suspensionNotice}
                      onChange={(e) => setEditingHoliday({ ...editingHoliday, suspensionNotice: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      MENSAJE REFLEXIVO / INSTITUCIONAL
                    </label>
                    <textarea
                      rows={3}
                      value={editingHoliday.reflectionText}
                      onChange={(e) => setEditingHoliday({ ...editingHoliday, reflectionText: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    />
                  </div>

                  {/* Programación de Auto-Envío */}
                  <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingHoliday.autoSendEnabled)}
                        onChange={(e) => setEditingHoliday({ ...editingHoliday, autoSendEnabled: e.target.checked })}
                      />
                      <span>Programar Auto-Envío a Telegram</span>
                    </label>
                    {editingHoliday.autoSendEnabled && (
                      <input
                        type="datetime-local"
                        value={editingHoliday.scheduledDateTime || `${editingHoliday.isoDate}T09:00`}
                        onChange={(e) => setEditingHoliday({ ...editingHoliday, scheduledDateTime: e.target.value })}
                        className="input-text"
                        style={{ fontSize: '11.5px', padding: '4px 8px' }}
                      />
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Vista Previa Integrada y Limpia del Comunicado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    VISTA PREVIA EN TIEMPO REAL DEL COMUNICADO:
                  </div>

                  <div
                    style={{
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface-alt)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ position: 'relative', height: '185px', backgroundColor: '#0F172A' }}>
                      <img
                        src={editingHoliday.imageUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/holidays/dia_de_muertos_sifygsa.jpg';
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '12px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          backgroundColor: editingHoliday.isSuspended ? '#DC2626' : '#16A34A'
                        }}
                      >
                        {editingHoliday.isSuspended ? 'Suspensión de Labores' : 'Jornada Laboral Ordinaria'}
                      </div>
                    </div>

                    <div style={{ padding: '16px', fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {buildOfficialTelegramMessage(editingHoliday)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
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
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIGURACIÓN DE CANAL / BOT DE TELEGRAM                         */}
      {/* ========================================================================= */}
      {isTgConfigModalOpen && (
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Configuración de Telegram y Archivo
              </h3>
              <button
                type="button"
                onClick={() => setIsTgConfigModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  1. TELEGRAM BOT TOKEN (DE @BotFather)
                </label>
                <input
                  type="text"
                  value={tgConfig.botToken}
                  onChange={(e) => setTgConfig({ ...tgConfig, botToken: e.target.value })}
                  placeholder="Ej. 784512963:AAHxyz123456..."
                  className="input-text"
                  style={{ width: '100%' }}
                />
                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleAutoDetectTelegramChat}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px', color: 'var(--primary)', borderColor: 'var(--brand-300)' }}
                  >
                    🔍 Detectar mi Cuenta / Grupo Automáticamente
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTestTelegram}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                  >
                    📨 Enviar Prueba
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  2. IDENTIFICADOR DETECTADO (CHAT ID O @CANAL)
                </label>
                <input
                  type="text"
                  value={tgConfig.chatId}
                  onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                  placeholder="Se llena solo al dar clic en Detectar, o escribe @TuCanal"
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  3. NOMBRE DEL DESTINO (CUENTA O GRUPO)
                </label>
                <input
                  type="text"
                  value={tgConfig.channelName}
                  onChange={(e) => setTgConfig({ ...tgConfig, channelName: e.target.value })}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  DÍAS DE RETENCIÓN EN SUBCARPETA DE ARCHIVADOS
                </label>
                <input
                  type="number"
                  min={7}
                  max={90}
                  value={tgConfig.autoArchiveDays}
                  onChange={(e) => setTgConfig({ ...tgConfig, autoArchiveDays: Number(e.target.value) || 30 })}
                  className="input-text"
                  style={{ width: '120px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setIsTgConfigModalOpen(false);
                  showToast('✓ Configuración de Telegram guardada');
                }}
                style={{ fontSize: '12px', padding: '6px 16px' }}
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: HOJA MEMBRETADA OFICIAL SIFYGSA PARA IMPRIMIR / GUARDAR EN PDF   */}
      {/* ========================================================================= */}
      {holidayForPrintPdf && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
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
              maxWidth: '820px',
              maxHeight: '94vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A'
            }}
          >
            {/* Barra de acciones superior (no se imprime) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Vista Oficial de Comunicado Institucional (PDF / Impresión)
                </h3>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
                  Documento con formato limpio y membrete corporativo SIFYGSA
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayForPrintPdf(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Hoja Membretada */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', padding: '32px', backgroundColor: '#FFFFFF' }}>
              {/* Cabecera Institucional */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #E11D48', paddingBottom: '16px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={sifygsaLogo} alt="SIFYGSA" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.5px' }}>
                      SIFYGSA
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                      DEPARTAMENTO DE RECURSOS HUMANOS · COMUNICADO INTERNO
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#334155' }}>
                  <div><strong>Folio:</strong> COM-RH-{holidayForPrintPdf.isoDate.replace(/-/g, '')}</div>
                  <div><strong>Emisión:</strong> Minatitlán, Ver.</div>
                  <div><strong>Clasificación:</strong> {holidayForPrintPdf.type === 'lft' ? 'Art. 74 LFT' : 'Institucional'}</div>
                </div>
              </div>

              {/* Banner Imagen + Título */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <img
                  src={holidayForPrintPdf.imageUrl}
                  alt={holidayForPrintPdf.title}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: holidayForPrintPdf.isSuspended ? '#FEE2E2' : '#E0F2FE',
                    color: holidayForPrintPdf.isSuspended ? '#991B1B' : '#075985',
                    marginBottom: '8px'
                  }}
                >
                  {holidayForPrintPdf.isSuspended ? 'AVISO DE SUSPENSIÓN DE LABORES' : 'AVISO DE JORNADA ORDINARIA'}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>
                  {holidayForPrintPdf.title}
                </h2>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#E11D48' }}>
                  {formatSpanishDate(holidayForPrintPdf.isoDate).dayOfWeek} {formatSpanishDate(holidayForPrintPdf.isoDate).dateStr}
                </div>
              </div>

              {/* Cuerpo del comunicado */}
              <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: '#1E293B', marginBottom: '20px' }}>
                <p style={{ fontWeight: 700, marginBottom: '12px' }}>
                  A todo el personal administrativo, operativo y técnico de SIFYGSA:
                </p>
                <p style={{ marginBottom: '12px' }}>{holidayForPrintPdf.suspensionNotice}</p>
                <p style={{ marginBottom: '12px' }}>{holidayForPrintPdf.reflectionText}</p>
              </div>

              {/* Cuadro de Resumen Operativo */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px 18px', marginBottom: '28px', fontSize: '12.5px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>• Disposición operativa:</strong>{' '}
                  {holidayForPrintPdf.isSuspended
                    ? 'Suspensión de actividades con goce de sueldo íntegro.'
                    : 'Actividades laborales ordinarias en horario normal.'}
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>• Reanudación de actividades:</strong> {holidayForPrintPdf.returnDateStr}
                </div>
                <div>
                  <strong>• Protocolo preventivo:</strong> {holidayForPrintPdf.technicalNotice}
                </div>
              </div>

              {/* Firmas Institucionales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '36px', textAlign: 'center', fontSize: '12px' }}>
                <div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', fontWeight: 800, color: '#0F172A' }}>
                    Coordinación de Recursos Humanos
                  </div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Elaboró y Difundió</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', fontWeight: 800, color: '#0F172A' }}>
                    Dirección General SIFYGSA
                  </div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Autorización Institucional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
