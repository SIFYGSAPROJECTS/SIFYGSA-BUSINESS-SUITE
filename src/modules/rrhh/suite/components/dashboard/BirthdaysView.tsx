'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Check,
  Search,
  Sparkles,
  PartyPopper,
  Building2,
  Calendar,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Settings,
  FileText,
  Printer,
  Download,
  Bell,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  X,
  Upload,
  Cake,
  Camera,
  UserCheck
} from 'lucide-react';
const sifygsaLogo = '/assets/logos/Logo_S.png';
import { EMPLOYEES } from '../../data/mockData';
import { Employee } from '../../types';
import { useSyncedEmployees, savePersistedEmployees } from '../../utils/formShield';

export interface BirthdayItem {
  id: string;
  employeeId?: string; // Vínculo directo con el expediente del empleado registrado
  name: string;
  email: string;
  department: string;
  location: string;
  position: string;
  initials: string;
  avatarBg: string;
  photoUrl?: string; // Foto de perfil del colaborador
  birthDay: number; // 1 - 31
  birthMonth: number; // 1 - 12
  hireYear?: number;
  // Campos de difusión y tarjeta creativa
  bannerUrl: string;
  headline: string;
  greetingMessage: string;
  teamWishes: string;
  hashtags: string[];
  // Estado de archivo / papelera (30 días)
  isArchived?: boolean;
  archivedAt?: string;
  restoredForNextCycle?: boolean;
  // Estado de envío y programación a Telegram
  telegramStatus?: 'pending' | 'scheduled' | 'sent';
  scheduledTime?: string; // HH:mm
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

const STORAGE_KEY_BIRTHDAYS = 'sifygsa_rrhh_birthdays_v2';
const STORAGE_KEY_TG_CONFIG = 'sifygsa_rrhh_telegram_config_v1';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SUGGESTED_BIRTHDAY_BANNERS = [
  {
    label: 'Celebración Corporativa Dorada y Confeti',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Pastel y Velas de Cumpleaños',
    url: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Globos y Ambiente Festivo en Oficina',
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Brindis y Éxito Profesional',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80'
  }
];

const BIRTHDAY_TEMPLATES = [
  {
    id: 'calido',
    label: 'Cálido y Fraternal',
    description: 'Tono cercano y entusiasta de parte de toda la familia SIFYGSA',
    apply: (name: string, dept: string, loc: string) => ({
      headline: `🎂🎉 ¡Muchas felicidades en tu día, ${name}! 🥳🎈`,
      greetingMessage: `Hoy celebramos con mucho gusto un año más de vida de nuestro(a) compañero(a) ${name}, quien forma parte fundamental del área de ${dept} en ${loc}.`,
      teamWishes: `Deseamos que pases un excelente cumpleaños rodeado(a) de tu familia y seres queridos, y que este nuevo año venga lleno de salud, alegría y metas cumplidas.`
    })
  },
  {
    id: 'ejecutivo',
    label: 'Reconocimiento Profesional',
    description: 'Tono institucional destacando su trayectoria y aportación',
    apply: (name: string, dept: string, loc: string) => ({
      headline: `🌟🎂 Felicitación Institucional de Cumpleaños: ${name}`,
      greetingMessage: `A nombre de la Dirección General y el Departamento de Recursos Humanos, extendemos una cordial felicitación a ${name} (${dept} — ${loc}) con motivo de su cumpleaños.`,
      teamWishes: `Agradecemos tu profesionalismo, entrega y compromiso diario en nuestros proyectos, deseándote el mayor de los éxitos en el ámbito personal y laboral.`
    })
  },
  {
    id: 'breve',
    label: 'Corto y Dinámico (Telegram)',
    description: 'Mensaje directo y ágil para el canal general',
    apply: (name: string, dept: string, loc: string) => ({
      headline: `🎈🎉 ¡Hoy está de manteles largos ${name}! 🎂👏`,
      greetingMessage: `Enviamos un fuerte abrazo de cumpleaños a ${name} del equipo de ${dept} (${loc}).`,
      teamWishes: `¡Que tengas un día extraordinario lleno de celebración y buenos momentos! 🎁✨`
    })
  }
];

const INITIAL_BIRTHDAYS: BirthdayItem[] = [
  {
    id: 'B-1',
    employeeId: 'EMP-003',
    name: 'Carlos Alberto Tun Culebro',
    email: 'tunccarlos14@gmail.com',
    department: 'Recursos Humanos',
    location: 'Minatitlán, Ver.',
    position: 'Generalista de Recursos Humanos',
    initials: 'CT',
    avatarBg: '#D97706',
    birthDay: 26,
    birthMonth: 10,
    hireYear: 2023,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[0].url,
    headline: '🎂🎉 ¡Muchas felicidades en tu día, Carlos Alberto Tun Culebro! 🥳🎈',
    greetingMessage: 'Celebramos un año más de vida de nuestro compañero Carlos Alberto Tun Culebro, integrante clave del departamento de Recursos Humanos en Minatitlán, Ver.',
    teamWishes: 'Te deseamos un año lleno de salud, prosperidad y grandes logros personales y profesionales.',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'sent',
    sentAt: '26/10/2026 09:00',
    sentChannel: '@SIFYGSA_Avisos',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-2',
    employeeId: 'EMP-001',
    name: 'Agustín Anastacio Martínez',
    email: 'agustin.anastacio@sifygsa.com.mx',
    department: 'Dirección',
    location: 'Minatitlán, Ver.',
    position: 'Director General',
    initials: 'AM',
    avatarBg: '#1D4ED8',
    birthDay: 28,
    birthMonth: 10,
    hireYear: 2021,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[1].url,
    headline: '🎂🎉 ¡Feliz Cumpleaños, Agustín Anastacio Martínez! 🥳🎈',
    greetingMessage: 'Enviamos una cordial felicitación a Agustín Anastacio Martínez, Director General en Minatitlán, Ver.',
    teamWishes: 'Que este nuevo ciclo esté colmado de bienestar, éxito en cada proyecto y momentos especiales en familia.',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'sent',
    sentAt: '28/10/2026 09:00',
    sentChannel: '@SIFYGSA_Avisos',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-3',
    employeeId: 'EMP-002',
    name: 'Aurelio Palacios Xolo',
    email: 'aurelio.palacios@sifygsa.com.mx',
    department: 'Compras',
    location: 'Minatitlán, Ver.',
    position: 'Gerente de Compras',
    initials: 'AP',
    avatarBg: '#059669',
    birthDay: 3,
    birthMonth: 11,
    hireYear: 2020,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[2].url,
    headline: '🌟🎂 Felicitación de Cumpleaños: Aurelio Palacios Xolo',
    greetingMessage: 'Extendemos una afectuosa felicitación a Aurelio Palacios Xolo, Gerente de Compras en nuestra sede de Minatitlán, Ver.',
    teamWishes: 'Agradecemos tu liderazgo y dedicación, deseándote un excelente año lleno de salud y satisfacciones.',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'sent',
    sentAt: '03/11/2026 09:00',
    sentChannel: '@SIFYGSA_Avisos',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-4',
    employeeId: 'EMP-004',
    name: 'Mtra. Sofía Morales Ruiz',
    email: 'sofia.morales@sifygsa.com.mx',
    department: 'HSE',
    location: 'Minatitlán, Ver.',
    position: 'Coordinadora de Seguridad & Normatividad',
    initials: 'SM',
    avatarBg: '#7C3AED',
    birthDay: 12,
    birthMonth: 11,
    hireYear: 2022,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[0].url,
    headline: '🎂🎉 ¡Feliz Cumpleaños, Mtra. Sofía Morales Ruiz! 🥳🎈',
    greetingMessage: 'Celebramos con alegría el cumpleaños de la Mtra. Sofía Morales Ruiz, Coordinadora de Seguridad & Normatividad (HSE) en Minatitlán, Ver.',
    teamWishes: '¡Muchas felicidades y que sigan los éxitos junto a todo el equipo SIFYGSA!',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'sent',
    sentAt: '12/11/2026 09:15',
    sentChannel: '@SIFYGSA_Avisos',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-5',
    employeeId: 'EMP-005',
    name: 'Ing. Carlos Hernández',
    email: 'carlos.hernandez@sifygsa.com.mx',
    department: 'HSE',
    location: 'Mapachapa, Ver.',
    position: 'Técnico en Detección de Gas',
    initials: 'CH',
    avatarBg: '#0284C7',
    birthDay: 18,
    birthMonth: 11,
    hireYear: 2023,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[0].url,
    headline: '🎂🎉 ¡Muchas felicidades en tu día, Ing. Carlos Hernández! 🥳🎈',
    greetingMessage: 'Hoy celebramos con mucho gusto el cumpleaños de nuestro compañero Ing. Carlos Hernández, integrante del área de HSE en Mapachapa, Ver.',
    teamWishes: 'Deseamos que pases un excelente día rodeado de tus seres queridos y que este nuevo año venga lleno de salud, éxito y seguridad en cada proyecto.',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'scheduled',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-6',
    employeeId: 'EMP-006',
    name: 'Ing. Roberto Méndez Cruz',
    email: 'roberto.mendez@sifygsa.com.mx',
    department: 'Medición y Control de Proyectos',
    location: 'Comalcalco, Tab.',
    position: 'Especialista en Automatización & Control',
    initials: 'RM',
    avatarBg: '#2563EB',
    birthDay: 22,
    birthMonth: 11,
    hireYear: 2021,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[1].url,
    headline: '🎂🎉 ¡Feliz Cumpleaños, Ing. Roberto Méndez Cruz! 🥳🎈',
    greetingMessage: 'Enviamos un fuerte abrazo de cumpleaños a nuestro compañero Ing. Roberto Méndez Cruz en la base operativa de Comalcalco, Tab.',
    teamWishes: 'Reconocemos tu gran labor en Medición y Control de Proyectos y te deseamos lo mejor en este nuevo año de vida.',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'scheduled',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-7',
    employeeId: 'EMP-011',
    name: 'Lic. Mariana Valdez Soto',
    email: 'mariana.valdez@sifygsa.com.mx',
    department: 'Recursos Humanos',
    location: 'Minatitlán, Ver.',
    position: 'Analista de Capacitación & Anexos',
    initials: 'MV',
    avatarBg: '#DB2777',
    birthDay: 29,
    birthMonth: 11,
    hireYear: 2024,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[2].url,
    headline: '🎂✨ ¡Muchas felicidades, Lic. Mariana Valdez Soto! 🎈🥳',
    greetingMessage: 'Con mucho cariño felicitamos a nuestra compañera Lic. Mariana Valdez Soto del área de Recursos Humanos (Capacitación) en Minatitlán, Ver.',
    teamWishes: '¡Que tengas un cumpleaños extraordinario lleno de alegría, metas cumplidas y grandes momentos!',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'scheduled',
    scheduledTime: '09:00',
    autoSendEnabled: true
  },
  {
    id: 'B-8',
    employeeId: 'EMP-010',
    name: 'Ing. Fernando Alarcón Paz',
    email: 'fernando.alarcon@sifygsa.com.mx',
    department: 'Infraestructura',
    location: 'Xalapa, Ver.',
    position: 'Supervisor de Mantenimiento & Redes',
    initials: 'FA',
    avatarBg: '#0891B2',
    birthDay: 5,
    birthMonth: 12,
    hireYear: 2022,
    bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[3].url,
    headline: '🌟🎂 ¡Feliz Cumpleaños, Ing. Fernando Alarcón Paz! 🎉🎈',
    greetingMessage: 'Toda la familia SIFYGSA felicita a nuestro compañero Ing. Fernando Alarcón Paz, Supervisor en el área de Infraestructura (Xalapa, Ver.).',
    teamWishes: 'Te enviamos nuestros mejores deseos de bienestar, salud y éxito continuo.',
    hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
    telegramStatus: 'pending',
    scheduledTime: '09:00',
    autoSendEnabled: false
  }
];

function extractBirthFromRfcOrCurp(rfcOrCurp?: string): { day: number; month: number } | null {
  if (!rfcOrCurp) return null;
  const clean = rfcOrCurp.trim().toUpperCase();
  const match = clean.match(/^[A-Z&Ñ]{4}(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return { day, month };
  }
  return null;
}

function computeBirthdayTiming(birthDay: number, birthMonth: number, now: Date, restoredForNextCycle?: boolean) {
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const thisYearBday = new Date(now.getFullYear(), birthMonth - 1, birthDay, 0, 0, 0, 0);
  const diffThisYearDays = Math.round((thisYearBday.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffThisYearDays < 0 && diffThisYearDays >= -30 && !restoredForNextCycle) {
    const daysElapsed = Math.abs(diffThisYearDays);
    return {
      isRecentPast: true,
      isToday: false,
      daysRemaining: diffThisYearDays,
      daysElapsed,
      daysUntilAutoClean: Math.max(1, 30 - daysElapsed),
      targetDate: thisYearBday,
      targetIso: `${thisYearBday.getFullYear()}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
    };
  }

  let nextBday = thisYearBday;
  if (diffThisYearDays < 0) {
    nextBday = new Date(now.getFullYear() + 1, birthMonth - 1, birthDay, 0, 0, 0, 0);
  }
  const daysRemaining = Math.round((nextBday.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isRecentPast: false,
    isToday: daysRemaining === 0,
    daysRemaining,
    daysElapsed: 0,
    daysUntilAutoClean: 30,
    targetDate: nextBday,
    targetIso: `${nextBday.getFullYear()}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
  };
}

// Componente aislado para el cronómetro con dimensiones fijas (tabular-nums evita saltos de layout)
const BirthdayCountdownBoxes: React.FC<{ targetDate: Date; isToday: boolean }> = ({ targetDate, isToday }) => {
  const [tickNow, setTickNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTickNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const diffMs = isToday ? 0 : Math.max(0, targetDate.getTime() - tickNow.getTime());
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
            backgroundColor: 'rgba(255, 255, 255, 0.09)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
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
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#FCD34D', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {String(unit.value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase' }}>
            {unit.label}
          </div>
        </div>
      ))}
    </>
  );
};

// Avatar reutilizable que muestra la foto real del empleado si está registrada, o sus iniciales
const EmployeeBirthdayAvatar: React.FC<{
  photoUrl?: string;
  initials: string;
  avatarBg: string;
  size?: number;
  fontSize?: number;
  showCrown?: boolean;
  border?: string;
}> = ({ photoUrl, initials, avatarBg, size = 48, fontSize = 16, showCrown = false, border }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: avatarBg || '#1D4ED8',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${fontSize}px`,
        fontWeight: 800,
        flexShrink: 0,
        position: 'relative',
        border: border || '2px solid rgba(255,255,255,0.85)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.14)'
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={initials}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
      {showCrown && (
        <span
          style={{
            position: 'absolute',
            top: '-9px',
            right: '-6px',
            fontSize: `${Math.max(14, Math.round(size * 0.3))}px`,
            lineHeight: 1
          }}
          title="Cumpleañero"
        >
          👑
        </span>
      )}
    </div>
  );
};

const DEFAULT_SIFYGSA_BOT_TOKEN = '9036710155:AAEMFr2ypV1cmTAyXttKbbHw2yDyjFSkxA8';
const DEFAULT_SIFYGSA_CHAT_ID = '-5384799731';
const DEFAULT_SIFYGSA_CHANNEL_NAME = 'Grupo Moy';

export const BirthdaysView: React.FC = () => {
  // Sincronización en tiempo real con el padrón de empleados registrados (fotos, puestos y sedes)
  const syncedEmployees = useSyncedEmployees(EMPLOYEES);

  // Fecha estable del día actual (solo cambia si cambia el día del calendario, evitando parpadeos)
  const [todayDate, setTodayDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setTodayDate((prev) => (prev.getDate() !== current.getDate() ? current : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Configuración compartida de Telegram vinculada directamente al Grupo Moy (-5384799731)
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TG_CONFIG, JSON.stringify(tgConfig));
    } catch {
      // ignore
    }
  }, [tgConfig]);

  // Lista de cumpleaños persistida
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BIRTHDAYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_BIRTHDAYS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BIRTHDAYS, JSON.stringify(birthdays));
    } catch {
      // ignore
    }
  }, [birthdays]);

  // Navegación y filtros
  const [activeTab, setActiveTab] = useState<'proximos' | 'programados' | 'calendario' | 'archivados'>('proximos');
  const [filterScope, setFilterScope] = useState<'todos' | 'mes_actual' | 'quincena'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [selectedForTelegram, setSelectedForTelegram] = useState<BirthdayItem | null>(null);
  const [telegramCustomText, setTelegramCustomText] = useState<string>('');
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [isCopiedText, setIsCopiedText] = useState<boolean>(false);

  const [editingBirthday, setEditingBirthday] = useState<BirthdayItem | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isTgConfigModalOpen, setIsTgConfigModalOpen] = useState<boolean>(false);
  const [birthdayForPrintPdf, setBirthdayForPrintPdf] = useState<BirthdayItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const editBannerInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Enriquecer cada cumpleañero conectándolo en vivo con el empleado registrado (su foto photoUrl, cargo y departamento)
  const enrichedBirthdays = useMemo(() => {
    return birthdays.map((b) => {
      // Buscar coincidencia en el padrón oficial de empleados por ID, email o nombre
      const cleanName = b.name.replace(/^(Ing\.|Lic\.|Mtra\.|Mtro\.|Arq\.|C\.P\.)\s*/i, '').trim().toLowerCase();
      const matchedEmployee: Employee | undefined = syncedEmployees.find((emp) => {
        if (b.employeeId && emp.id === b.employeeId) return true;
        if (b.email && emp.email && emp.email.toLowerCase() === b.email.toLowerCase()) return true;
        const empCleanName = emp.name.replace(/^(Ing\.|Lic\.|Mtra\.|Mtro\.|Arq\.|C\.P\.)\s*/i, '').trim().toLowerCase();
        return empCleanName === cleanName || emp.name.toLowerCase().includes(cleanName) || cleanName.includes(empCleanName);
      });

      const resolvedPhotoUrl = matchedEmployee?.photoUrl || b.photoUrl;
      const resolvedInitials = matchedEmployee?.initials || b.initials;
      const resolvedAvatarBg = matchedEmployee?.avatarBg || b.avatarBg;
      const resolvedEmployeeId = matchedEmployee?.id || b.employeeId;

      const timing = computeBirthdayTiming(b.birthDay, b.birthMonth, todayDate, b.restoredForNextCycle);
      const monthName = MONTHS_ES[(b.birthMonth || 1) - 1] || 'Enero';
      const birthDateStr = `${String(b.birthDay).padStart(2, '0')} de ${monthName}`;
      const effectiveArchived = Boolean(b.isArchived || timing.isRecentPast);

      return {
        ...b,
        employeeId: resolvedEmployeeId,
        photoUrl: resolvedPhotoUrl,
        initials: resolvedInitials,
        avatarBg: resolvedAvatarBg,
        ...timing,
        monthName,
        birthDateStr,
        effectiveArchived
      };
    });
  }, [birthdays, syncedEmployees, todayDate]);

  // Próximos activos ordenados de forma determinista (por días restantes y luego por ID para evitar brincos)
  const upcomingBirthdays = useMemo(() => {
    return enrichedBirthdays
      .filter((b) => !b.effectiveArchived)
      .filter((b) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.department.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          b.position.toLowerCase().includes(q);
        if (!matchesQuery) return false;
        if (filterScope === 'mes_actual') return b.birthMonth === todayDate.getMonth() + 1;
        if (filterScope === 'quincena') return b.daysRemaining <= 15;
        return true;
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining || a.id.localeCompare(b.id));
  }, [enrichedBirthdays, searchQuery, filterScope, todayDate]);

  // Cumpleaños recientes / concluidos (últimos 30 días)
  const archivedBirthdays = useMemo(() => {
    return enrichedBirthdays
      .filter((b) => b.effectiveArchived)
      .sort((a, b) => a.daysElapsed - b.daysElapsed || a.id.localeCompare(b.id));
  }, [enrichedBirthdays]);

  // El cumpleañero más cercano para el Banner Hero
  const nextBirthdayHero = useMemo(() => {
    const activeSorted = enrichedBirthdays
      .filter((b) => !b.effectiveArchived && b.daysRemaining >= 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining || a.id.localeCompare(b.id));
    return activeSorted[0] || null;
  }, [enrichedBirthdays]);

  // Construcción del mensaje oficial de felicitación para Telegram
  const buildOfficialBirthdayMessage = (b: BirthdayItem) => {
    const monthName = MONTHS_ES[(b.birthMonth || 1) - 1] || 'Enero';
    const dateLabel = `${String(b.birthDay).padStart(2, '0')} de ${monthName}`;
    const tags =
      b.hashtags && b.hashtags.length > 0
        ? b.hashtags.join(' ')
        : '#CumpleañosSIFYGSA #OneSoul #OneSIFYGSA';

    return `${b.headline}\n\n${b.greetingMessage}\n\n${b.teamWishes}\n\n📍 *Área:* ${b.department} (${b.location})\n🎂 *Fecha:* ${dateLabel}\n\n¡Te enviamos un fuerte abrazo de parte de toda la familia *SIFYGSA*! 👏🎈\n\n*Recursos Humanos*\n${tags}`;
  };

  // Abrir modal de envío a Telegram
  const handleOpenTelegramModal = (b: BirthdayItem) => {
    setSelectedForTelegram(b);
    setTelegramCustomText(buildOfficialBirthdayMessage(b));
  };

  // Función auxiliar que resuelve automáticamente el Chat ID de SIFYGSA-BUSINESS-SUITE desde getUpdates
  const resolveTargetChatId = async (token: string, currentChatId: string): Promise<{ chatId: string; title: string } | null> => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
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
          text: `✅ Conexión Exitosa — SIFYGSA RRHH\n\nEl bot ha quedado conectado a ${resolved.title} para publicar las felicitaciones de Cumpleaños y Días Festivos.`
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

  // Enviar felicitación a Telegram y marcar como "Felicitado / Enviado"
  const handleSendToTelegram = async (b: BirthdayItem, customText?: string) => {
    const messageToSend = customText || buildOfficialBirthdayMessage(b);
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
          throw new Error(data.description || 'Error al enviar por Telegram Bot API');
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

      setBirthdays((prev) =>
        prev.map((item) =>
          item.id === b.id
            ? {
                ...item,
                telegramStatus: 'sent',
                sentAt: nowFormatted,
                sentChannel: tgConfig.chatId || '@SIFYGSA_Avisos'
              }
            : item
        )
      );

      showToast(`✓ Felicitación de "${b.name}" enviada a ${tgConfig.chatId}`);
      setSelectedForTelegram(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con Telegram';
      showToast(`⚠️ ${msg}. Revisa la configuración del canal.`);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Generar y descargar Póster / Tarjeta Gráfica de Cumpleaños en PNG (Incluye Foto Real del Empleado si existe)
  const handleDownloadBirthdayPoster = (b: BirthdayItem) => {
    const monthName = MONTHS_ES[(b.birthMonth || 1) - 1] || 'Enero';
    const dateLabel = `${String(b.birthDay).padStart(2, '0')} de ${monthName}`;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const finalizeAndRender = (loadedBanner?: HTMLImageElement, loadedAvatarPhoto?: HTMLImageElement) => {
      // Fondo festivo corporativo
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#1E3A8A');
      bgGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Franja superior dorada
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, 0, 1080, 18);

      // Encabezado
      ctx.fillStyle = '#FCD34D';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText('🎉 CELEBRACIÓN DE CUMPLEAÑOS · FAMILIA SIFYGSA', 64, 80);

      // Banner superior redondeado
      if (loadedBanner) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(64, 115, 952, 360, 24);
        ctx.clip();
        ctx.drawImage(loadedBanner, 64, 115, 952, 360);
        ctx.restore();
      }

      // Tarjeta blanca central
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(64, 420, 952, 850, 28);
      ctx.fill();

      // Avatar circular con foto real del colaborador (o sus iniciales)
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 420, 92, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(540, 420, 82, 0, Math.PI * 2);
      ctx.clip();
      if (loadedAvatarPhoto) {
        ctx.drawImage(loadedAvatarPhoto, 540 - 82, 420 - 82, 164, 164);
      } else {
        ctx.fillStyle = b.avatarBg || '#1D4ED8';
        ctx.fillRect(540 - 82, 420 - 82, 164, 164);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 54px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.initials, 540, 440);
      }
      ctx.restore();

      // Título ¡Feliz Cumpleaños!
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 26px Inter, system-ui, sans-serif';
      ctx.fillText(`🎂 ¡FELIZ CUMPLEAÑOS! · ${dateLabel.toUpperCase()}`, 540, 560);

      // Nombre del colaborador
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.fillText(b.name.slice(0, 34), 540, 620);

      // Puesto y Departamento
      ctx.fillStyle = '#475569';
      ctx.font = '600 24px Inter, system-ui, sans-serif';
      ctx.fillText(`${b.position} — ${b.department} (${b.location})`, 540, 665);

      // Línea divisoria
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 705);
      ctx.lineTo(940, 705);
      ctx.stroke();

      // Cuerpo del mensaje
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1E293B';
      ctx.font = '500 26px Inter, system-ui, sans-serif';
      const fullText = `${b.greetingMessage} ${b.teamWishes}`;
      const words = fullText.replace(/\n+/g, ' ').split(' ');
      let line = '';
      let yPos = 765;
      const maxWidth = 830;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && i > 0) {
          ctx.fillText(line, 125, yPos);
          line = words[i] + ' ';
          yPos += 40;
          if (yPos > 1060) break;
        } else {
          line = testLine;
        }
      }
      if (yPos <= 1060) {
        ctx.fillText(line, 125, yPos);
      }

      // Pie institucional de la tarjeta
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.roundRect(110, 1105, 860, 115, 16);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('Departamento de Recursos Humanos — SIFYGSA', 145, 1155);

      ctx.fillStyle = '#0284C7';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText((b.hashtags || ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA']).join('   '), 145, 1192);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Tarjeta_Cumpleanos_${b.name.replace(/\s+/g, '_')}_SIFYGSA.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`✓ Tarjeta gráfica de "${b.name}" descargada en PNG`);
    };

    const loadPhotoAndDraw = (bannerImg?: HTMLImageElement) => {
      if (b.photoUrl) {
        const pImg = new Image();
        pImg.crossOrigin = 'anonymous';
        pImg.onload = () => finalizeAndRender(bannerImg, pImg);
        pImg.onerror = () => finalizeAndRender(bannerImg, undefined);
        pImg.src = b.photoUrl;
      } else {
        finalizeAndRender(bannerImg, undefined);
      }
    };

    const bannerImg = new Image();
    bannerImg.crossOrigin = 'anonymous';
    bannerImg.onload = () => loadPhotoAndDraw(bannerImg);
    bannerImg.onerror = () => loadPhotoAndDraw(undefined);
    bannerImg.src = b.bannerUrl;
  };

  // Archivar manualmente
  const handleArchiveBirthday = (id: string, name: string) => {
    setBirthdays((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, isArchived: true, archivedAt: new Date().toISOString(), autoSendEnabled: false }
          : b
      )
    );
    showToast(`✓ "${name}" movido a Concluidos / Archivados (30 días)`);
  };

  // Restaurar desde Archivados / Concluidos
  const handleRestoreBirthday = (b: BirthdayItem) => {
    const restored: BirthdayItem = {
      ...b,
      isArchived: false,
      archivedAt: undefined,
      restoredForNextCycle: true
    };
    setBirthdays((prev) => prev.map((item) => (item.id === b.id ? restored : item)));
    setEditingBirthday(restored);
    setIsCreatingNew(false);
    setIsEditingModalOpen(true);
    showToast(`✓ "${b.name}" restaurado. Puedes editar o reenviar su felicitación.`);
  };

  // Toggle de Auto-Envío programado
  const handleToggleAutoSend = (id: string) => {
    setBirthdays((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextAuto = !b.autoSendEnabled;
          showToast(
            nextAuto
              ? `✓ Auto-envío de cumpleaños activado para "${b.name}"`
              : `⏸️ Auto-envío pausado para "${b.name}"`
          );
          return {
            ...b,
            autoSendEnabled: nextAuto,
            scheduledTime: b.scheduledTime || '09:00',
            telegramStatus: nextAuto ? 'scheduled' : b.telegramStatus === 'sent' ? 'sent' : 'pending'
          };
        }
        return b;
      })
    );
  };

  // Cambiar hora de envío programado
  const handleUpdateScheduleTime = (id: string, newTime: string) => {
    setBirthdays((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              scheduledTime: newTime,
              autoSendEnabled: true,
              telegramStatus: 'scheduled'
            }
          : b
      )
    );
    showToast('✓ Hora de auto-envío actualizada');
  };

  // Abrir edición
  const handleStartEdit = (b: BirthdayItem) => {
    setEditingBirthday({ ...b });
    setIsCreatingNew(false);
    setIsEditingModalOpen(true);
  };

  // Crear nuevo registro de cumpleaños
  const handleStartCreate = () => {
    const newBday: BirthdayItem = {
      id: `B-${Date.now()}`,
      name: '',
      email: '',
      department: 'Ingeniería',
      location: 'Minatitlán, Ver.',
      position: '',
      initials: 'SF',
      avatarBg: '#1D4ED8',
      birthDay: todayDate.getDate(),
      birthMonth: todayDate.getMonth() + 1,
      hireYear: todayDate.getFullYear(),
      bannerUrl: SUGGESTED_BIRTHDAY_BANNERS[0].url,
      headline: '🎂🎉 ¡Muchas felicidades en tu cumpleaños! 🥳🎈',
      greetingMessage: 'Hoy celebramos con mucho gusto un año más de vida de nuestro(a) compañero(a).',
      teamWishes: 'Te deseamos un excelente día rodeado(a) de tu familia y que este nuevo ciclo venga lleno de salud y éxitos.',
      hashtags: ['#CumpleañosSIFYGSA', '#OneSoul', '#OneSIFYGSA'],
      isArchived: false,
      telegramStatus: 'pending',
      scheduledTime: '09:00',
      autoSendEnabled: true
    };
    setEditingBirthday(newBday);
    setIsCreatingNew(true);
    setIsEditingModalOpen(true);
  };

  // Subir banner festivo desde PC
  const handleUploadBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBirthday) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingBirthday((prev) => (prev ? { ...prev, bannerUrl: base64 } : null));
      showToast('✓ Fondo festivo cargado exitosamente');
    };
    reader.readAsDataURL(file);
  };

  // Subir o cambiar la Foto de Perfil del Colaborador (y sincronizarla con su expediente)
  const handleUploadEmployeePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBirthday) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingBirthday((prev) => (prev ? { ...prev, photoUrl: base64 } : null));
      showToast('✓ Foto del colaborador cargada');
    };
    reader.readAsDataURL(file);
  };

  // Seleccionar un empleado registrado del catálogo para cargar su foto y datos automáticamente
  const handleSelectRegisteredEmployee = (empId: string) => {
    if (!editingBirthday) return;
    const found = syncedEmployees.find((e) => e.id === empId);
    if (!found) return;

    const extractedBirth = extractBirthFromRfcOrCurp(found.curp || found.rfc);
    const appliedTemplate = BIRTHDAY_TEMPLATES[0].apply(found.name, found.department, found.location);

    setEditingBirthday({
      ...editingBirthday,
      employeeId: found.id,
      name: found.name,
      email: found.email,
      department: found.department,
      location: found.location,
      position: found.position,
      initials: found.initials,
      avatarBg: found.avatarBg,
      photoUrl: found.photoUrl,
      birthDay: extractedBirth ? extractedBirth.day : editingBirthday.birthDay,
      birthMonth: extractedBirth ? extractedBirth.month : editingBirthday.birthMonth,
      ...appliedTemplate
    });
    showToast(`✓ Vinculado con el expediente de ${found.name}`);
  };

  // Guardar creación o edición y sincronizar foto con el expediente del empleado si aplica
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBirthday || !editingBirthday.name.trim()) return;

    const words = editingBirthday.name
      .replace(/^(Ing\.|Lic\.|Mtra\.|Mtro\.|Arq\.|C\.P\.)\s*/i, '')
      .trim()
      .split(/\s+/);
    const computedInitials =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : words[0].slice(0, 2).toUpperCase();

    const normalized: BirthdayItem = {
      ...editingBirthday,
      initials: computedInitials || 'SF',
      isArchived: false,
      restoredForNextCycle: true
    };

    // Si tiene foto y está vinculado a un empleado del padrón, actualizar también la foto en el expediente general
    if (normalized.photoUrl) {
      const cleanTargetName = normalized.name.replace(/^(Ing\.|Lic\.|Mtra\.|Mtro\.|Arq\.|C\.P\.)\s*/i, '').trim().toLowerCase();
      let updatedAnyEmp = false;
      const updatedEmployees = syncedEmployees.map((emp) => {
        const empCleanName = emp.name.replace(/^(Ing\.|Lic\.|Mtra\.|Mtro\.|Arq\.|C\.P\.)\s*/i, '').trim().toLowerCase();
        const isMatch =
          (normalized.employeeId && emp.id === normalized.employeeId) ||
          (normalized.email && emp.email.toLowerCase() === normalized.email.toLowerCase()) ||
          empCleanName === cleanTargetName;
        if (isMatch && emp.photoUrl !== normalized.photoUrl) {
          updatedAnyEmp = true;
          return { ...emp, photoUrl: normalized.photoUrl };
        }
        return emp;
      });
      if (updatedAnyEmp) {
        savePersistedEmployees(updatedEmployees);
      }
    }

    if (isCreatingNew) {
      setBirthdays((prev) => [normalized, ...prev]);
      showToast(`✓ Cumpleaños de "${normalized.name}" registrado`);
    } else {
      setBirthdays((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
      showToast(`✓ Datos y foto de "${normalized.name}" actualizados`);
    }
    setIsEditingModalOpen(false);
    setEditingBirthday(null);
  };

  // Eliminar definitivamente
  const handleDeletePermanent = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar definitivamente el registro de cumpleaños de "${name}"?`)) {
      setBirthdays((prev) => prev.filter((b) => b.id !== id));
      showToast(`✓ Registro de "${name}" eliminado`);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(telegramCustomText);
    setIsCopiedText(true);
    showToast('✓ Felicitación copiada al portapapeles');
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
      {/* 1. ENCABEZADO CONCISO Y LIMPIO                                            */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}
            >
              <Cake className="w-5 h-5" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Cumpleaños del Personal
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
                Cumpleaños y felicitaciones del personal.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTgConfigModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 13px' }}
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
              <span>Registrar Cumpleaños</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BANNER HERO FESTIVO CON PRÓXIMO CUMPLEAÑERO Y CUENTA REGRESIVA         */}
      {/* ========================================================================= */}
      {nextBirthdayHero && (
        <div
          className="card"
          style={{
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
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
            <EmployeeBirthdayAvatar
              photoUrl={nextBirthdayHero.photoUrl}
              initials={nextBirthdayHero.initials}
              avatarBg={nextBirthdayHero.avatarBg}
              size={68}
              fontSize={22}
              showCrown={true}
              border="3px solid #FCD34D"
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
                    backgroundColor: '#F59E0B',
                    color: '#0F172A'
                  }}
                >
                  {nextBirthdayHero.isToday ? '¡Cumpleaños de Hoy!' : 'Próximo Cumpleañero'}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    color: '#E2E8F0'
                  }}
                >
                  🎂 {nextBirthdayHero.birthDateStr}
                </span>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {nextBirthdayHero.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '3px 0 0 0' }}>
                {nextBirthdayHero.position} · <strong>{nextBirthdayHero.department}</strong> ({nextBirthdayHero.location})
              </p>
            </div>
          </div>

          {/* Cronómetro en tiempo real aislado (sin provocar re-render en las tarjetas) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <BirthdayCountdownBoxes
              targetDate={nextBirthdayHero.targetDate}
              isToday={nextBirthdayHero.isToday}
            />

            <button
              type="button"
              onClick={() => handleOpenTelegramModal(nextBirthdayHero)}
              className="btn btn-primary"
              style={{
                marginLeft: '6px',
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: 800,
                fontSize: '12px',
                padding: '9px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <PartyPopper className="w-4 h-4" />
              <span>Felicitar en Telegram</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PESTAÑAS DE NAVEGACIÓN Y BUSCADOR                                      */}
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
            onClick={() => setActiveTab('proximos')}
            className={`btn ${activeTab === 'proximos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Próximos Cumpleaños ({enrichedBirthdays.filter((b) => !b.effectiveArchived).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programados')}
            className={`btn ${activeTab === 'programados' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Programación Auto-Envío ({enrichedBirthdays.filter((b) => !b.effectiveArchived && b.autoSendEnabled).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendario')}
            className={`btn ${activeTab === 'calendario' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mural Anual por Mes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archivados')}
            className={`btn ${activeTab === 'archivados' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Recientes / Archivados 30d ({archivedBirthdays.length})</span>
          </button>
        </div>

        {activeTab === 'proximos' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search className="w-3.5 h-3.5 text-muted" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar colaborador o área..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-text"
                style={{ width: '100%', paddingLeft: '30px', height: '32px', fontSize: '12px' }}
              />
            </div>

            <button
              type="button"
              onClick={() => setFilterScope('todos')}
              className={`btn ${filterScope === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('quincena')}
              className={`btn ${filterScope === 'quincena' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              Próximos 15 días
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('mes_actual')}
              className={`btn ${filterScope === 'mes_actual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              Mes Actual ({MONTHS_ES[todayDate.getMonth()]})
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA A: MURAL DE TARJETAS DE PRÓXIMOS CUMPLEAÑOS (ESTABLE SIN PARPADEO)  */}
      {/* ========================================================================= */}
      {activeTab === 'proximos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
          {upcomingBirthdays.map((b) => {
            const isSoon = b.daysRemaining <= 7;
            return (
              <div
                key={b.id}
                className="card"
                style={{
                  borderRadius: '16px',
                  border: b.isToday
                    ? '2px solid #F59E0B'
                    : isSoon
                    ? '1.5px solid var(--brand-300)'
                    : '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: b.isToday ? '0 8px 24px rgba(245, 158, 11, 0.16)' : 'var(--shadow-sm)',
                  transition: 'none'
                }}
              >
                <div>
                  {/* Cabecera con Banner Festivo por CSS Background (Cero reflujo de imagen) */}
                  <div
                    style={{
                      position: 'relative',
                      height: '108px',
                      backgroundColor: '#0F172A',
                      backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.88) 100%), url("${b.bannerUrl}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >

                    {/* Badges Superiores: Fecha + Días Restantes */}
                    <div style={{ position: 'absolute', top: '10px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          color: '#FCD34D',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Calendar className="w-3 h-3" />
                        {b.birthDateStr}
                      </span>

                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          backgroundColor: b.isToday
                            ? '#F59E0B'
                            : b.daysRemaining === 1
                            ? '#EA580C'
                            : 'rgba(2, 132, 199, 0.92)',
                          color: b.isToday ? '#0F172A' : '#FFFFFF'
                        }}
                      >
                        {b.isToday
                          ? '¡HOY ES SU CUMPLEAÑOS! 🎂'
                          : b.daysRemaining === 1
                          ? '¡Mañana! 🎈'
                          : `Faltan ${b.daysRemaining} días`}
                      </span>
                    </div>

                    {/* Estado de Telegram */}
                    <div style={{ position: 'absolute', bottom: '8px', right: '12px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          backgroundColor:
                            b.telegramStatus === 'sent'
                              ? 'rgba(22, 163, 74, 0.95)'
                              : b.autoSendEnabled
                              ? 'rgba(2, 132, 199, 0.95)'
                              : 'rgba(51, 65, 85, 0.9)',
                          color: '#FFFFFF'
                        }}
                      >
                        {b.telegramStatus === 'sent'
                          ? '✓ Felicitado'
                          : b.autoSendEnabled
                          ? `⏰ Auto-Envío (${b.scheduledTime || '09:00'})`
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo con Foto/Avatar del Colaborador Registrado */}
                  <div style={{ padding: '14px 18px 12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div
                          onClick={() => handleStartEdit(b)}
                          style={{ cursor: 'pointer' }}
                          title="Clic para cambiar foto o editar datos"
                        >
                          <EmployeeBirthdayAvatar
                            photoUrl={b.photoUrl}
                            initials={b.initials}
                            avatarBg={b.avatarBg}
                            size={50}
                            fontSize={16}
                            showCrown={b.isToday}
                          />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: '15px',
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
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {b.position}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 className="w-3 h-3" />
                            <span>{b.department} · {b.location}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          title="Editar felicitación y foto del colaborador"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveBirthday(b.id, b.name)}
                          title="Mover a Concluidos / Archivados (30 días)"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Extracto de la felicitación */}
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
                      {b.headline}
                    </div>

                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {b.greetingMessage}
                    </p>
                  </div>
                </div>

                {/* Pie de Tarjeta: Enviar a Telegram, Carta PDF y Tarjeta PNG */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '11px 18px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenTelegramModal(b)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      padding: '6px 10px',
                      backgroundColor: b.telegramStatus === 'sent' ? '#16A34A' : undefined,
                      borderColor: b.telegramStatus === 'sent' ? '#16A34A' : undefined
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{b.telegramStatus === 'sent' ? 'Felicitado (Reenviar)' : 'Aviso Telegram'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBirthdayForPrintPdf(b)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 9px', fontSize: '11px' }}
                    title="Carta de Felicitación Membretada en PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadBirthdayPoster(b)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 9px', fontSize: '11px' }}
                    title="Descargar Tarjeta Gráfica de Cumpleaños (PNG)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA B: CRUD DE PROGRAMACIÓN DE AUTO-ENVÍO DE CUMPLEAÑOS                 */}
      {/* ========================================================================= */}
      {activeTab === 'programados' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Programación Automática de Felicitaciones en Telegram
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Envíos automáticos al canal <strong>{tgConfig.chatId}</strong>.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Colaborador</th>
                  <th style={{ padding: '10px 12px' }}>Fecha de Cumpleaños</th>
                  <th style={{ padding: '10px 12px' }}>Hora Programada</th>
                  <th style={{ padding: '10px 12px' }}>Auto-Envío</th>
                  <th style={{ padding: '10px 12px' }}>Estatus</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {enrichedBirthdays
                  .filter((b) => !b.effectiveArchived)
                  .sort((a, b) => a.daysRemaining - b.daysRemaining || a.id.localeCompare(b.id))
                  .map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <EmployeeBirthdayAvatar
                            photoUrl={b.photoUrl}
                            initials={b.initials}
                            avatarBg={b.avatarBg}
                            size={34}
                            fontSize={12}
                          />
                          <div>
                            <div>{b.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {b.department} · {b.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        🎂 {b.birthDateStr}
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                          {b.isToday ? '¡Hoy!' : b.daysRemaining === 1 ? '¡Mañana!' : `En ${b.daysRemaining} días`}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="time"
                          value={b.scheduledTime || '09:00'}
                          onChange={(e) => handleUpdateScheduleTime(b.id, e.target.value)}
                          className="input-text"
                          style={{ fontSize: '12px', padding: '4px 8px', height: '32px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAutoSend(b.id)}
                          className={`btn ${b.autoSendEnabled ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: b.autoSendEnabled ? '#0284C7' : undefined,
                            borderColor: b.autoSendEnabled ? '#0284C7' : undefined
                          }}
                        >
                          {b.autoSendEnabled ? (
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
                        {b.telegramStatus === 'sent' ? (
                          <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Enviado ({b.sentAt})
                          </span>
                        ) : b.autoSendEnabled ? (
                          <span style={{ color: '#0284C7', fontWeight: 700, fontSize: '11.5px' }}>
                            ⏰ Programado ({b.scheduledTime || '09:00'})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                            Manual
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenTelegramModal(b)}
                            className="btn btn-primary"
                            style={{ fontSize: '11px', padding: '5px 10px' }}
                          >
                            Felicitar Ahora
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(b)}
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
      {/* VISTA C: MURAL ANUAL DE CUMPLEAÑOS POR MES                                */}
      {/* ========================================================================= */}
      {activeTab === 'calendario' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Calendario Anual de Cumpleaños por Mes
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Selecciona un colaborador para editar su tarjeta.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {MONTHS_ES.map((monthName, idx) => {
              const monthNum = idx + 1;
              const isCurrentMonth = todayDate.getMonth() + 1 === monthNum;
              const list = enrichedBirthdays
                .filter((b) => b.birthMonth === monthNum)
                .sort((a, b) => a.birthDay - b.birthDay);

              return (
                <div
                  key={monthName}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isCurrentMonth ? '1.5px solid #F59E0B' : '1px solid var(--border)',
                    backgroundColor: list.length > 0 ? 'var(--surface)' : 'var(--surface-alt)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {monthName} {isCurrentMonth && '⭐'}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {list.length} {list.length === 1 ? 'cumpleaños' : 'cumpleaños'}
                    </span>
                  </div>

                  {list.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                      Sin registros este mes
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {list.map((person) => (
                        <div
                          key={person.id}
                          onClick={() => handleStartEdit(person)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            borderLeft: `3px solid ${person.avatarBg}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <EmployeeBirthdayAvatar
                            photoUrl={person.photoUrl}
                            initials={person.initials}
                            avatarBg={person.avatarBg}
                            size={28}
                            fontSize={10}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Día {String(person.birthDay).padStart(2, '0')} · {person.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {person.department}
                            </div>
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
      )}

      {/* ========================================================================= */}
      {/* VISTA D: SUBCARPETA DE CUMPLEAÑOS RECIENTES / ARCHIVADOS (30 DÍAS)        */}
      {/* ========================================================================= */}
      {activeTab === 'archivados' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Subcarpeta de Cumpleaños Recientes / Concluidos (Retención 30 días)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Archivo de últimos 30 días. Usa <strong>Restaurar / Corregir</strong> si requieres reenviar.
            </p>
          </div>

          {archivedBirthdays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay cumpleaños en la bandeja de concluidos de los últimos 30 días.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {archivedBirthdays.map((b) => (
                <div
                  key={b.id}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                        Concluido hace {b.daysElapsed} días
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#D97706' }}>
                        Ciclo se depura en {b.daysUntilAutoClean} días
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <EmployeeBirthdayAvatar
                        photoUrl={b.photoUrl}
                        initials={b.initials}
                        avatarBg={b.avatarBg}
                        size={40}
                        fontSize={13}
                      />
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {b.name}
                        </h4>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          Cumplió el {b.birthDateStr} · {b.department}
                        </div>
                      </div>
                    </div>

                    {b.sentAt && (
                      <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
                        ✓ Felicitación enviada a Telegram ({b.sentAt})
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleRestoreBirthday(b)}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '11.5px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar / Corregir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePermanent(b.id, b.name)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11.5px', padding: '6px 10px', color: '#DC2626' }}
                      title="Eliminar registro"
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
      {/* MODAL 1: FELICITAR EN TELEGRAM                                            */}
      {/* ========================================================================= */}
      {selectedForTelegram && (
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
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F59E0B', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Enviar Felicitación a Telegram
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Canal destino: <strong>{tgConfig.chatId || '@SIFYGSA_Avisos'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForTelegram(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <EmployeeBirthdayAvatar
                  photoUrl={selectedForTelegram.photoUrl}
                  initials={selectedForTelegram.initials}
                  avatarBg={selectedForTelegram.avatarBg}
                  size={42}
                  fontSize={14}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedForTelegram.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {selectedForTelegram.department} · {selectedForTelegram.location}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadBirthdayPoster(selectedForTelegram)}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar Tarjeta PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedForTelegram;
                    setSelectedForTelegram(null);
                    setBirthdayForPrintPdf(target);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <FileText className="w-3 h-3" />
                  <span>Carta PDF</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                MENSAJE DE FELICITACIÓN (EDITABLE ANTES DE PUBLICAR):
              </label>
              <textarea
                value={telegramCustomText}
                onChange={(e) => setTelegramCustomText(e.target.value)}
                rows={8}
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
                <span>{isCopiedText ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedForTelegram(null)}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isSendingTelegram}
                  onClick={() => handleSendToTelegram(selectedForTelegram, telegramCustomText)}
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
                  <span>{isSendingTelegram ? 'Enviando...' : 'Publicar en Telegram y Marcar Felicitado'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDICIÓN CON VÍNCULO AL EXPEDIENTE Y FOTO DEL COLABORADOR         */}
      {/* ========================================================================= */}
      {isEditingModalOpen && editingBirthday && (
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
          <div className="card" style={{ width: '100%', maxWidth: '940px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isCreatingNew ? 'Registrar Cumpleaños de Colaborador' : `Editar Felicitación: ${editingBirthday.name}`}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Selecciona un colaborador del directorio.
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
                {/* Columna Izquierda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Selector directo del empleado registrado + Foto */}
                  <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <EmployeeBirthdayAvatar
                      photoUrl={editingBirthday.photoUrl}
                      initials={editingBirthday.initials || 'SF'}
                      avatarBg={editingBirthday.avatarBg}
                      size={58}
                      fontSize={18}
                    />

                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        <span>VINCULAR CON EMPLEADO REGISTRADO EN PADRÓN:</span>
                      </label>
                      <select
                        value={editingBirthday.employeeId || ''}
                        onChange={(e) => {
                          if (e.target.value) handleSelectRegisteredEmployee(e.target.value);
                        }}
                        className="select-control"
                        style={{ width: '100%', height: '34px', fontSize: '11.5px' }}
                      >
                        <option value="">Seleccionar trabajador del catálogo...</option>
                        {syncedEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} — {emp.department} ({emp.id})
                          </option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => editPhotoInputRef.current?.click()}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Camera className="w-3 h-3 text-primary" />
                          <span>{editingBirthday.photoUrl ? 'Cambiar Foto del Colaborador' : 'Subir Foto del Colaborador'}</span>
                        </button>
                        {editingBirthday.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingBirthday({ ...editingBirthday, photoUrl: undefined })}
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px', color: '#DC2626' }}
                          >
                            Quitar Foto
                          </button>
                        )}
                        <input
                          ref={editPhotoInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleUploadEmployeePhoto}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        NOMBRE DEL COLABORADOR *
                      </label>
                      <input
                        type="text"
                        value={editingBirthday.name}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, name: e.target.value })}
                        placeholder="Ej. Ing. Carlos Hernández"
                        className="input-text"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        CARGO / PUESTO
                      </label>
                      <input
                        type="text"
                        value={editingBirthday.position}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, position: e.target.value })}
                        placeholder="Ej. Especialista en Automatización"
                        className="input-text"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        DEPARTAMENTO
                      </label>
                      <input
                        type="text"
                        value={editingBirthday.department}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, department: e.target.value })}
                        className="input-text"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        UBICACIÓN / BASE
                      </label>
                      <input
                        type="text"
                        value={editingBirthday.location}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, location: e.target.value })}
                        className="input-text"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        DÍA (1-31)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={editingBirthday.birthDay}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, birthDay: Number(e.target.value) || 1 })}
                        className="input-text"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        MES
                      </label>
                      <select
                        value={editingBirthday.birthMonth}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, birthMonth: Number(e.target.value) })}
                        className="select-control"
                        style={{ width: '100%', height: '36px' }}
                      >
                        {MONTHS_ES.map((m, idx) => (
                          <option key={m} value={idx + 1}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        COLOR AVATAR
                      </label>
                      <input
                        type="color"
                        value={editingBirthday.avatarBg}
                        onChange={(e) => setEditingBirthday({ ...editingBirthday, avatarBg: e.target.value })}
                        style={{ width: '100%', height: '36px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Plantillas Rápidas de Felicitación */}
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>PLANTILLAS RÁPIDAS DE FELICITACIÓN (1 CLIC):</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {BIRTHDAY_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            const applied = tpl.apply(
                              editingBirthday.name || 'nuestro(a) compañero(a)',
                              editingBirthday.department || 'su departamento',
                              editingBirthday.location || 'SIFYGSA'
                            );
                            setEditingBirthday({ ...editingBirthday, ...applied });
                            showToast(`✓ Plantilla "${tpl.label}" aplicada`);
                          }}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fondo conmemorativo */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={editingBirthday.bannerUrl}
                      onChange={(e) => setEditingBirthday({ ...editingBirthday, bannerUrl: e.target.value })}
                      className="select-control"
                      style={{ flex: 1, height: '34px', fontSize: '11.5px' }}
                    >
                      {SUGGESTED_BIRTHDAY_BANNERS.map((b, i) => (
                        <option key={i} value={b.url}>{b.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => editBannerInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Fondo</span>
                    </button>
                    <input
                      ref={editBannerInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadBannerFile}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      ENCABEZADO DE FELICITACIÓN
                    </label>
                    <input
                      type="text"
                      value={editingBirthday.headline}
                      onChange={(e) => setEditingBirthday({ ...editingBirthday, headline: e.target.value })}
                      className="input-text"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      MENSAJE PRINCIPAL
                    </label>
                    <textarea
                      rows={2}
                      value={editingBirthday.greetingMessage}
                      onChange={(e) => setEditingBirthday({ ...editingBirthday, greetingMessage: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      DESEOS DEL EQUIPO
                    </label>
                    <textarea
                      rows={2}
                      value={editingBirthday.teamWishes}
                      onChange={(e) => setEditingBirthday({ ...editingBirthday, teamWishes: e.target.value })}
                      className="input-text"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Columna Derecha: Vista Previa Limpia Integrada */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    VISTA PREVIA EN TIEMPO REAL DE LA TARJETA Y FELICITACIÓN:
                  </div>

                  <div style={{ borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-alt)', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: '140px', backgroundColor: '#0F172A' }}>
                      <img src={editingBirthday.bannerUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                      <div style={{ position: 'absolute', bottom: '10px', left: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <EmployeeBirthdayAvatar
                          photoUrl={editingBirthday.photoUrl}
                          initials={editingBirthday.initials || 'SF'}
                          avatarBg={editingBirthday.avatarBg}
                          size={48}
                          fontSize={16}
                          showCrown={true}
                        />
                        <div style={{ color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800 }}>{editingBirthday.name || 'Nombre del Colaborador'}</div>
                          <div style={{ fontSize: '11px', opacity: 0.9 }}>{editingBirthday.department} · {editingBirthday.location}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '16px', fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {buildOfficialBirthdayMessage(editingBirthday)}
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
      {/* MODAL 3: CONFIGURACIÓN DE CANAL TELEGRAM                                  */}
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
                Configuración de Canal de Telegram
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setIsTgConfigModalOpen(false);
                  showToast('✓ Configuración guardada');
                }}
                style={{ fontSize: '12px', padding: '6px 16px' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CARTA OFICIAL DE FELICITACIÓN EN PDF MEMBRETADO SIFYGSA          */}
      {/* ========================================================================= */}
      {birthdayForPrintPdf && (
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
              maxWidth: '800px',
              maxHeight: '94vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Carta Institucional de Felicitación (PDF / Impresión)
                </h3>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
                  Reconocimiento personalizado con membrete oficial SIFYGSA
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
                  onClick={() => setBirthdayForPrintPdf(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', padding: '32px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #F59E0B', paddingBottom: '16px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={sifygsaLogo} alt="SIFYGSA" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>SIFYGSA</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                      CAPITAL HUMANO · CARTA DE FELICITACIÓN Y RECONOCIMIENTO
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#334155' }}>
                  <div><strong>Fecha Conmemorativa:</strong> {String(birthdayForPrintPdf.birthDay).padStart(2, '0')} de {MONTHS_ES[(birthdayForPrintPdf.birthMonth || 1) - 1]}</div>
                  <div><strong>Sede:</strong> {birthdayForPrintPdf.location}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
                <EmployeeBirthdayAvatar
                  photoUrl={birthdayForPrintPdf.photoUrl}
                  initials={birthdayForPrintPdf.initials}
                  avatarBg={birthdayForPrintPdf.avatarBg}
                  size={80}
                  fontSize={26}
                  border="3px solid #F59E0B"
                />
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: '10px 0 4px 0' }}>
                  {birthdayForPrintPdf.name}
                </h2>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#D97706' }}>
                  {birthdayForPrintPdf.position} · {birthdayForPrintPdf.department}
                </div>
              </div>

              <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#1E293B', marginBottom: '28px', padding: '0 12px' }}>
                <p style={{ fontWeight: 700 }}>{birthdayForPrintPdf.headline}</p>
                <p>{birthdayForPrintPdf.greetingMessage}</p>
                <p>{birthdayForPrintPdf.teamWishes}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '44px', textAlign: 'center', fontSize: '12px' }}>
                <div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', fontWeight: 800, color: '#0F172A' }}>
                    Departamento de Recursos Humanos
                  </div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Familia SIFYGSA</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', fontWeight: 800, color: '#0F172A' }}>
                    Dirección General SIFYGSA
                  </div>
                  <div style={{ color: '#64748B', fontSize: '11px' }}>Reconocimiento Institucional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthdaysView;
