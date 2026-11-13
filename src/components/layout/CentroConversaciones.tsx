'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconClose, IconSearch } from '../ui/Icons';

export interface ChatMessage {
  id: string;
  sender: string;
  isOwn: boolean;
  isBot?: boolean;
  time: string;
  text: string;
  attachment?: string;
}

export interface ConversationThread {
  id: string;
  kind: 'channel' | 'chat';
  name: string;
  subtitle: string;
  badgeText: string;
  badgeColor: 'red' | 'blue' | 'slate' | 'emerald' | 'amber';
  lastTime: string;
  unread: number;
  isThread?: boolean;
  isNewTag?: boolean;
  messages: ChatMessage[];
}

export interface SystemNotice {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'general',
    kind: 'channel',
    name: 'General',
    subtitle: 'Canal corporativo SIFYGSA',
    badgeText: 'G',
    badgeColor: 'red',
    lastTime: '10:04',
    unread: 2,
    isThread: true,
    messages: [
      {
        id: 'm1',
        sender: 'SIFYGSA Bot',
        isOwn: false,
        isBot: true,
        time: '9:52 p.m.',
        text: 'Bienvenido al canal #General 🎉 Espacio colaborativo del equipo SIFYGSA para compartir avances y actualizaciones.',
      },
      {
        id: 'm2',
        sender: 'Tú',
        isOwn: true,
        time: '10:04 p.m.',
        text: 'Enterado equipo, seguimos avanzando con las cotizaciones del proyecto #41.',
      },
    ],
  },
  {
    id: 'administrators',
    kind: 'chat',
    name: 'Administrators',
    subtitle: 'Canal interno de administración',
    badgeText: 'A',
    badgeColor: 'blue',
    lastTime: '08:42',
    unread: 0,
    messages: [
      {
        id: 'a1',
        sender: 'Administración SIFYGSA',
        isOwn: false,
        time: '08:42 a.m.',
        text: 'Este es el inicio de tu conversación con el equipo de Administración.',
      },
    ],
  },
  {
    id: 'opp-041',
    kind: 'channel',
    name: 'SIFYGSA-OPP-2026-041',
    subtitle: 'Licitación Sistema Fuego y Gas',
    badgeText: '#41',
    badgeColor: 'slate',
    lastTime: 'Nuevo',
    unread: 1,
    isThread: true,
    isNewTag: true,
    messages: [
      {
        id: 'o1',
        sender: 'Ing. Valdez',
        isOwn: false,
        time: '11:15 a.m.',
        text: 'Subí los planos mecánicos aprobados para la propuesta técnica de Dos Bocas.',
        attachment: 'Planos_Mecanicos_OPP041.pdf',
      },
    ],
  },
  {
    id: 'soporte',
    kind: 'chat',
    name: 'Mesa de Soporte SIFYGSA',
    subtitle: 'Soporte Técnico & Asistente SIFYGSA',
    badgeText: 'S',
    badgeColor: 'emerald',
    lastTime: 'Ayer',
    unread: 0,
    messages: [
      {
        id: 's1',
        sender: 'Soporte TI',
        isOwn: false,
        isBot: true,
        time: 'Ayer',
        text: 'Ticket #8843 cerrado con éxito. ¿En qué más podemos ayudarte hoy?',
      },
    ],
  },
];

const INITIAL_NOTICES: SystemNotice[] = [
  {
    id: 'n1',
    title: 'Oportunidad OPP-2026-041 actualizada',
    detail: 'Avanzó a etapa de Propuesta Técnica · $1,450,000 MXN',
    time: 'Hace 15 min',
    read: false,
  },
  {
    id: 'n2',
    title: 'Recordatorio de seguimiento comercial',
    detail: 'Llamada programada con Gerencia de Ingeniería PEMEX a las 16:00',
    time: 'Hace 1 hora',
    read: false,
  },
];

const QUICK_EMOJIS = ['👍', '🎉', '✅', '📄', '🔥', '💼'];

interface CentroConversacionesProps {
  isPopoverOpen: boolean;
  onClosePopover: () => void;
  onUnreadChange?: (count: number) => void;
  userName?: string;
}

export const CentroConversaciones: React.FC<CentroConversacionesProps> = ({
  isPopoverOpen,
  onClosePopover,
  onUnreadChange,
  userName = 'Carlos Mendoza',
}) => {
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [notices, setNotices] = useState<SystemNotice[]>(INITIAL_NOTICES);
  const [activeTab, setActiveTab] = useState<'chats' | 'canales' | 'reuniones' | 'avisos'>('canales');
  const [filterMode, setFilterMode] = useState<'todos' | 'no_leido' | 'hilo'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string>('general');
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
  const [showBubbles, setShowBubbles] = useState(true);
  const [messageDraft, setMessageDraft] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCallMode, setActiveCallMode] = useState<'video' | 'audio' | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0);
  const unreadNoticesCount = notices.filter((n) => !n.read).length;

  useEffect(() => {
    onUnreadChange?.(totalUnread);
  }, [totalUnread, onUnreadChange]);

  useEffect(() => {
    if (isChatWindowOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatWindowOpen, conversations, activeThreadId]);

  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !target.closest('[data-chat-trigger="true"]')
      ) {
        onClosePopover();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClosePopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopoverOpen, onClosePopover]);

  const activeThread =
    conversations.find((c) => c.id === activeThreadId) ?? conversations[0];

  const handleOpenThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setConversations((prev) =>
      prev.map((c) => (c.id === threadId ? { ...c, unread: 0 } : c))
    );
    setIsChatWindowOpen(true);
    setShowBubbles(true);
    setActiveCallMode(null);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = messageDraft.trim();
    if (!trimmed && !pendingAttachment) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: userName,
      isOwn: true,
      time: timeLabel,
      text: trimmed || 'Archivo adjunto compartido',
      attachment: pendingAttachment ?? undefined,
    };

    const targetId = activeThread.id;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              lastTime: timeLabel,
              unread: 0,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    setMessageDraft('');
    setPendingAttachment(null);
    setShowEmojiPicker(false);

    if (targetId === 'general' || targetId === 'soporte') {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: targetId === 'soporte' ? 'Soporte TI' : 'SIFYGSA Bot',
          isOwn: false,
          isBot: true,
          time: new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          text:
            targetId === 'soporte'
              ? 'Recibido. Hemos registrado tu mensaje en la mesa de soporte SIFYGSA.'
              : 'Actualización registrada en el canal #General.',
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetId
              ? { ...c, messages: [...c.messages, reply] }
              : c
          )
        );
      }, 650);
    }
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newChannelName.trim().replace(/^#/, '');
    if (!cleanName) return;

    const id = `ch_${Date.now()}`;
    const letter = cleanName.charAt(0).toUpperCase();
    const newThread: ConversationThread = {
      id,
      kind: 'channel',
      name: cleanName,
      subtitle: `Canal creado por ${userName}`,
      badgeText: letter,
      badgeColor: 'blue',
      lastTime: 'Ahora',
      unread: 0,
      isThread: true,
      isNewTag: true,
      messages: [
        {
          id: `init_${Date.now()}`,
          sender: 'SIFYGSA Bot',
          isOwn: false,
          isBot: true,
          time: 'Ahora',
          text: `Bienvenido al nuevo canal #${cleanName}. Comparte archivos y avances con tu equipo.`,
        },
      ],
    };

    setConversations((prev) => [newThread, ...prev]);
    setNewChannelName('');
    setIsCreatingChannel(false);
    setActiveTab('canales');
    handleOpenThread(id);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'chats' && conv.kind !== 'chat') return false;
    if (activeTab === 'canales' && conv.kind !== 'channel' && filterMode === 'hilo') {
      return false;
    }
    if (filterMode === 'no_leido' && conv.unread === 0) return false;
    if (filterMode === 'hilo' && !conv.isThread) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const lastMsg = conv.messages[conv.messages.length - 1]?.text.toLowerCase() ?? '';
    return conv.name.toLowerCase().includes(q) || lastMsg.includes(q);
  });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* ====================================================================
          1. PANEL GLOBAL DEL CENTRO DE CONVERSACIONES
         ==================================================================== */}
      {isPopoverOpen && (
        <aside
          ref={popoverRef}
          className="chat-center-popover"
          aria-label="Centro de Conversaciones"
        >
          {/* Left Rail Vertical Tabs */}
          <nav className="chat-center-rail" aria-label="Secciones de Comunicación">
            <button
              type="button"
              className={`chat-rail-tab ${activeTab === 'chats' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              <div className="chat-rail-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {conversations.filter((c) => c.kind === 'chat' && c.unread > 0).length > 0 && (
                  <span className="chat-rail-badge">
                    {conversations
                      .filter((c) => c.kind === 'chat')
                      .reduce((s, c) => s + c.unread, 0)}
                  </span>
                )}
              </div>
              <span className="chat-rail-label">Chats</span>
            </button>

            <button
              type="button"
              className={`chat-rail-tab ${activeTab === 'canales' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('canales')}
            >
              <div className="chat-rail-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="chat-rail-label">Canales</span>
            </button>

            <button
              type="button"
              className={`chat-rail-tab ${activeTab === 'reuniones' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reuniones')}
            >
              <div className="chat-rail-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="chat-rail-label">Reuniones</span>
            </button>

            <button
              type="button"
              className={`chat-rail-tab ${activeTab === 'avisos' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('avisos')}
            >
              <div className="chat-rail-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {unreadNoticesCount > 0 && (
                  <span className="chat-rail-badge">{unreadNoticesCount}</span>
                )}
              </div>
              <span className="chat-rail-label">Avisos</span>
            </button>
          </nav>

          {/* Main Popover Body */}
          <section className="chat-center-body">
            {/* Header & + Canal Action */}
            <div className="chat-center-top">
              <div className="chat-center-action-row">
                <button
                  type="button"
                  className="chat-new-channel-btn"
                  onClick={() => setIsCreatingChannel((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>+ Canal</span>
                </button>
                <button
                  type="button"
                  className="chat-close-icon-btn"
                  onClick={onClosePopover}
                  title="Cerrar panel"
                >
                  <IconClose size={15} />
                </button>
              </div>

              {isCreatingChannel && (
                <form className="chat-create-channel-form" onSubmit={handleCreateChannel}>
                  <input
                    type="text"
                    className="chat-create-channel-input"
                    placeholder="Nombre del canal (ej. ventas-norte)"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="chat-create-channel-submit">
                    Crear
                  </button>
                </form>
              )}

              {(activeTab === 'canales' || activeTab === 'chats') && (
                <>
                  <div className="chat-search-wrap">
                    <IconSearch size={14} className="chat-search-icon" />
                    <input
                      type="text"
                      className="chat-search-input"
                      placeholder="Buscar conversación..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="chat-filter-pills">
                    <button
                      type="button"
                      className={`chat-filter-pill ${filterMode === 'todos' ? 'is-active' : ''}`}
                      onClick={() => setFilterMode('todos')}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      className={`chat-filter-pill ${filterMode === 'no_leido' ? 'is-active' : ''}`}
                      onClick={() => setFilterMode('no_leido')}
                    >
                      No leído
                    </button>
                    <button
                      type="button"
                      className={`chat-filter-pill ${filterMode === 'hilo' ? 'is-active' : ''}`}
                      onClick={() => setFilterMode('hilo')}
                    >
                      Hilo
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Content Area by Active Rail Tab */}
            <div className="chat-center-list">
              {(activeTab === 'canales' || activeTab === 'chats') &&
                (filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => {
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    const isActive = conv.id === activeThreadId && isChatWindowOpen;

                    return (
                      <button
                        key={conv.id}
                        type="button"
                        className={`chat-thread-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleOpenThread(conv.id)}
                      >
                        <div className={`chat-thread-avatar avatar-${conv.badgeColor}`}>
                          {conv.badgeText}
                        </div>
                        <div className="chat-thread-meta">
                          <div className="chat-thread-row-top">
                            <span className="chat-thread-name">{conv.name}</span>
                            {conv.isNewTag && conv.unread > 0 ? (
                              <span className="chat-thread-new-tag">Nuevo</span>
                            ) : (
                              <span className="chat-thread-time">{conv.lastTime}</span>
                            )}
                          </div>
                          <p className="chat-thread-preview">
                            {lastMsg ? (
                              <>
                                <span className="chat-thread-sender">{lastMsg.sender}:</span>{' '}
                                {lastMsg.text}
                              </>
                            ) : (
                              conv.subtitle
                            )}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="chat-thread-unread-dot">{conv.unread}</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="chat-empty-state">
                    No hay conversaciones que coincidan con el filtro actual.
                  </div>
                ))}

              {activeTab === 'reuniones' && (
                <div className="chat-meetings-panel">
                  <div className="chat-meeting-card">
                    <span className="chat-meeting-tag">HOY · 16:00 HRS</span>
                    <h4 className="chat-meeting-title">Revisión Técnica Licitación #41</h4>
                    <p className="chat-meeting-desc">
                      Canal #SIFYGSA-OPP-2026-041 · Ing. Valdez y Ventas
                    </p>
                    <button
                      type="button"
                      className="chat-meeting-join-btn"
                      onClick={() => {
                        handleOpenThread('opp-041');
                        setActiveCallMode('video');
                      }}
                    >
                      Unirse a videollamada
                    </button>
                  </div>

                  <div className="chat-meeting-card">
                    <span className="chat-meeting-tag">DISPONIBLE</span>
                    <h4 className="chat-meeting-title">Sala Rápida #General</h4>
                    <p className="chat-meeting-desc">
                      Inicia una llamada instantánea con todo el equipo comercial
                    </p>
                    <button
                      type="button"
                      className="chat-meeting-join-btn secondary"
                      onClick={() => {
                        handleOpenThread('general');
                        setActiveCallMode('audio');
                      }}
                    >
                      Iniciar audio rápido
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'avisos' && (
                <div className="chat-notices-list">
                  {notices.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      className={`chat-notice-item ${!notice.read ? 'is-unread' : ''}`}
                      onClick={() =>
                        setNotices((prev) =>
                          prev.map((n) => (n.id === notice.id ? { ...n, read: true } : n))
                        )
                      }
                    >
                      <div className="chat-notice-top">
                        <span className="chat-notice-title">{notice.title}</span>
                        <span className="chat-notice-time">{notice.time}</span>
                      </div>
                      <p className="chat-notice-detail">{notice.detail}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="chat-center-footer">
              <span className="chat-status-live">
                <span className="green-pulse-dot" />
                SIFYGSA Connect Activo
              </span>
              <button
                type="button"
                className="chat-expand-link-btn"
                onClick={() => {
                  setShowBubbles(true);
                  setIsChatWindowOpen(true);
                  onClosePopover();
                }}
              >
                Abrir ventana de chat →
              </button>
            </footer>
          </section>
        </aside>
      )}

      {/* ====================================================================
          2. VENTANA FLOTANTE DE CHAT & BURBUJAS CIRCULARES (Bottom-Right Dock)
         ==================================================================== */}
      <div className="floating-chat-dock" data-purpose="dock-chat-container">
        {isChatWindowOpen && activeThread && (
          <section className="floating-chat-window" aria-label={`Chat ${activeThread.name}`}>
            {/* Chat Header */}
            <header className="floating-chat-header">
              <div className="floating-chat-identity">
                <div className={`chat-thread-avatar sm avatar-${activeThread.badgeColor}`}>
                  {activeThread.badgeText}
                </div>
                <div className="floating-chat-title-wrap">
                  <span className="floating-chat-title"># {activeThread.name}</span>
                  <span className="floating-chat-subtitle">{activeThread.subtitle}</span>
                </div>
              </div>

              <div className="floating-chat-controls">
                <button
                  type="button"
                  className={`floating-chat-ctrl-btn call ${activeCallMode === 'video' ? 'active' : ''}`}
                  title="Videollamada"
                  onClick={() =>
                    setActiveCallMode((prev) => (prev === 'video' ? null : 'video'))
                  }
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`floating-chat-ctrl-btn call ${activeCallMode === 'audio' ? 'active' : ''}`}
                  title="Llamada de voz"
                  onClick={() =>
                    setActiveCallMode((prev) => (prev === 'audio' ? null : 'audio'))
                  }
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="floating-chat-ctrl-btn"
                  title="Minimizar a burbuja flotante"
                  onClick={() => setIsChatWindowOpen(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 12H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="floating-chat-ctrl-btn"
                  title="Cerrar conversación"
                  onClick={() => setIsChatWindowOpen(false)}
                >
                  <IconClose size={14} />
                </button>
              </div>
            </header>

            {activeCallMode && (
              <div className="floating-call-banner">
                <span>
                  {activeCallMode === 'video'
                    ? `Videollamada activa en #${activeThread.name}`
                    : `Llamada de voz conectada en #${activeThread.name}`}
                </span>
                <button
                  type="button"
                  className="floating-call-end-btn"
                  onClick={() => setActiveCallMode(null)}
                >
                  Colgar
                </button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="floating-chat-messages">
              <div className="floating-chat-welcome">
                <div className="floating-chat-welcome-row">
                  <div className={`chat-thread-avatar sm avatar-${activeThread.badgeColor}`}>
                    {activeThread.badgeText}
                  </div>
                  <h4>Te damos la bienvenida a #{activeThread.name}</h4>
                </div>
                <p>Este es el historial oficial del canal #{activeThread.name} de SIFYGSA Suite.</p>
              </div>

              <div className="floating-chat-date-divider">
                <span>Hoy</span>
              </div>

              {activeThread.messages.map((msg) =>
                msg.isOwn ? (
                  <div key={msg.id} className="chat-bubble-own-row">
                    <div className="chat-bubble-own">
                      <p>{msg.text}</p>
                      {msg.attachment && (
                        <div className="chat-attachment-chip own">📎 {msg.attachment}</div>
                      )}
                      <div className="chat-bubble-time own">
                        <span>{msg.time}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="chat-bubble-other-row">
                    <div className="chat-other-avatar">
                      {msg.isBot ? '🤖' : msg.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-other-content">
                      <div className="chat-other-meta">
                        <span className="chat-other-name">{msg.sender}</span>
                        <span className="chat-other-time">{msg.time}</span>
                      </div>
                      <div className="chat-bubble-other">
                        <p>{msg.text}</p>
                        {msg.attachment && (
                          <div className="chat-attachment-chip">📎 {msg.attachment}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <footer className="floating-chat-footer">
              {pendingAttachment && (
                <div className="floating-pending-attachment">
                  <span>📎 {pendingAttachment}</span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    aria-label="Quitar adjunto"
                  >
                    ×
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="floating-emoji-bar">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMessageDraft((prev) => `${prev}${emoji}`)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form className="floating-chat-input-box" onSubmit={handleSendMessage}>
                <button
                  type="button"
                  className="floating-chat-tool-btn"
                  title="Adjuntar documento comercial"
                  onClick={() =>
                    setPendingAttachment(
                      activeThread.id === 'opp-041'
                        ? 'Cotizacion_OPP041_Rev2.pdf'
                        : 'Documento_SIFYGSA.pdf'
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <input
                  type="text"
                  className="floating-chat-input"
                  placeholder={`Mensaje para #${activeThread.name}...`}
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                />

                <button
                  type="button"
                  className="floating-chat-tool-btn"
                  title="Insertar emoji"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="submit"
                  className="floating-chat-send-btn"
                  title="Enviar mensaje"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={{ transform: 'rotate(90deg)' }}
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </footer>
          </section>
        )}

        {/* Burbujas Circulares Flotantes */}
        {showBubbles && (
          <div className="floating-bubbles-row">
            {/* Burbuja Secundaria: Soporte / SIFYGSA Bot */}
            <button
              type="button"
              className="floating-bubble-secondary"
              title="Asistente SIFYGSA · Soporte Activo"
              onClick={() => handleOpenThread('soporte')}
            >
              <span className="bubble-bot-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="bubble-online-dot" />
            </button>

            {/* Burbuja Principal: Canal Activo */}
            <div className="floating-bubble-primary-wrap">
              <button
                type="button"
                className="floating-bubble-primary"
                title="Abrir / Minimizar Chat #General"
                onClick={() => {
                  if (isChatWindowOpen) {
                    setIsChatWindowOpen(false);
                  } else {
                    handleOpenThread(activeThreadId);
                  }
                }}
              >
                <span>{activeThread?.badgeText ?? 'G'}</span>
              </button>
              {totalUnread > 0 && <span className="floating-bubble-unread">{totalUnread}</span>}
              <span className="bubble-online-dot lg" />
              <button
                type="button"
                className="floating-bubble-dismiss"
                title="Ocultar burbujas"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChatWindowOpen(false);
                  setShowBubbles(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};

export default CentroConversaciones;

