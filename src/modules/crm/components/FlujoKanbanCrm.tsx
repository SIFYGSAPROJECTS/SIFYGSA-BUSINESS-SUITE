'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  INITIAL_STITCH_OPPORTUNITIES,
  INITIAL_STITCH_STAGES,
  INITIAL_CRM_CLIENTS,
  type StitchOpportunity,
  type StitchStage,
  type StitchViewMode,
  type CrmClientContact,
} from './stitchCrmData';

export interface FlujoKanbanCrmProps {
  onSelectOpportunity?: (folio: string) => void;
  onChangeView?: (view: string) => void;
  currentView?: string;
  initialFolio?: string;
  extraOpportunities?: StitchOpportunity[];
}

interface CalendarEventItem {
  id: string;
  dayCol: number; // 0=Lun 9 ... 6=Dom 15
  topPx: number;
  heightPx: number;
  timeRange: string;
  title: string;
  folioBadge?: string;
  subtitle?: string;
  colorType: 'emerald' | 'blue' | 'amber' | 'cyan' | 'purple' | 'rose';
}

const INITIAL_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: 'ev-1',
    dayCol: 0,
    topPx: 120,
    heightPx: 60,
    timeRange: '09:00 - 10:00',
    title: 'Kickoff Ingeniería SIL-2',
    folioBadge: 'OPP-059 • BRASKEM',
    colorType: 'blue',
  },
  {
    id: 'ev-2',
    dayCol: 0,
    topPx: 300,
    heightPx: 90,
    timeRange: '12:00 - 13:30',
    title: 'Revisión Catálogo Det-Tronics X3301',
    subtitle: 'Complejo Procesador Cactus',
    colorType: 'amber',
  },
  {
    id: 'ev-3',
    dayCol: 1,
    topPx: 180,
    heightPx: 90,
    timeRange: '10:00 - 11:30',
    title: 'Presentación Propuesta Técnica y Económica',
    folioBadge: 'OPP-074 • PEMEX TULA',
    colorType: 'purple',
  },
  {
    id: 'ev-4',
    dayCol: 2,
    topPx: 60,
    heightPx: 140,
    timeRange: '08:00 - 10:30',
    title: 'Levantamiento de campo y calibración H2S - Refinería Dos Bocas',
    folioBadge: 'OPP-2026-041',
    colorType: 'emerald',
  },
  {
    id: 'ev-5',
    dayCol: 2,
    topPx: 210,
    heightPx: 90,
    timeRange: '10:30 - 12:00',
    title: 'Reunión técnica: DTI de gas y fuego Minatitlán',
    folioBadge: 'OPP-2026-105',
    colorType: 'blue',
  },
  {
    id: 'ev-6',
    dayCol: 2,
    topPx: 540,
    heightPx: 60,
    timeRange: '16:00 - 17:00',
    title: 'Llamada seguimiento comercial Válvulas Diluvio',
    colorType: 'cyan',
  },
  {
    id: 'ev-7',
    dayCol: 3,
    topPx: 120,
    heightPx: 180,
    timeRange: '09:00 - 12:30',
    title: 'Auditoría en sitio: Tablero Notifier NFS2-3030 - Ternium',
    folioBadge: 'OPP-2026-092',
    colorType: 'amber',
  },
  {
    id: 'ev-8',
    dayCol: 4,
    topPx: 240,
    heightPx: 120,
    timeRange: '11:00 - 13:00',
    title: 'Cierre de Negociación & Firma Contrato Akal-C',
    folioBadge: 'OPP-2026-019',
    colorType: 'rose',
  },
];

const GRAPH_MEASURES = [
  'Ingreso esperado',
  'Ingreso prorrateado',
  'Días para asignar',
  'Días para cerrar',
  'Días para convertir',
  'Probabilidad',
  'Conteo',
] as const;

export const FlujoKanbanCrm: React.FC<FlujoKanbanCrmProps> = ({
  onSelectOpportunity,
  onChangeView,
  currentView = 'kanban',
  initialFolio,
  extraOpportunities = [],
}) => {
  const [viewMode, setViewMode] = useState<StitchViewMode>(
    (currentView as StitchViewMode) || 'kanban'
  );
  const [opportunities, setOpportunities] = useState<StitchOpportunity[]>(() => [
    ...extraOpportunities,
    ...INITIAL_STITCH_OPPORTUNITIES,
  ]);
  const [stages] = useState<StitchStage[]>(INITIAL_STITCH_STAGES);

  useEffect(() => {
    if (extraOpportunities.length > 0) {
      setOpportunities((prev) => {
        const existingFolios = new Set(prev.map((p) => p.folio));
        const news = extraOpportunities.filter(
          (e) => !existingFolios.has(e.folio)
        );
        return news.length > 0 ? [...news, ...prev] : prev;
      });
    }
  }, [extraOpportunities]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickTag, setActiveQuickTag] = useState<string | null>(null);
  const [myOppsFilterActive, setMyOppsFilterActive] = useState(true);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [groupByField, setGroupByField] = useState<string | null>(null);

  // Inline Quick Create in Kanban column
  const [quickCreateStage, setQuickCreateStage] = useState<string | null>(null);
  const [newOppClient, setNewOppClient] = useState('');
  const [newOppContactName, setNewOppContactName] = useState('');
  const [newOppTagCode, setNewOppTagCode] = useState('');
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppEmail, setNewOppEmail] = useState('');
  const [newOppPhone, setNewOppPhone] = useState('');
  const [newOppAmount, setNewOppAmount] = useState('1,250,000');
  const [newOppStars, setNewOppStars] = useState(2);

  // Registered Clients & Contacts state (persisted in localStorage + shared with Contactos view)
  const [registeredClients, setRegisteredClients] = useState<CrmClientContact[]>(
    INITIAL_CRM_CLIENTS
  );
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [contactZoneFilter, setContactZoneFilter] = useState<string>('Todas');

  // New Client Modal form fields
  const [modalCompanyName, setModalCompanyName] = useState('');
  const [modalTagCode, setModalTagCode] = useState('');
  const [modalContactName, setModalContactName] = useState('');
  const [modalContactRole, setModalContactRole] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalSector, setModalSector] = useState('Petroquímica');
  const [modalCity, setModalCity] = useState('Coatzacoalcos, Veracruz');
  const [modalZone, setModalZone] = useState<'Istmo' | 'Sur' | 'Golfo' | 'Norte' | 'Centro'>('Istmo');
  const [modalRfc, setModalRfc] = useState('');
  const [clientSavedToast, setClientSavedToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sfg_crm_registered_clients_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as CrmClientContact[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredClients(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistClients = (nextClients: CrmClientContact[]) => {
    setRegisteredClients(nextClients);
    try {
      localStorage.setItem('sfg_crm_registered_clients_v1', JSON.stringify(nextClients));
    } catch {
      // ignore storage errors
    }
  };

  // Natural Pointer-Based Drag & Drop states (Zero blurry browser ghost)
  const [draggedFolio, setDraggedFolio] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dragOverCardFolio, setDragOverCardFolio] = useState<string | null>(null);
  const [justDroppedFolio, setJustDroppedFolio] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 140, y: 40 });
  const [dragCardDims, setDragCardDims] = useState<{ width: number; height: number }>({
    width: 296,
    height: 198,
  });

  const pointerDragRef = useRef<{
    folio: string;
    originStage: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    active: boolean;
    currentTargetStage: string;
    currentTargetCard: string | null;
  } | null>(null);

  // Selected Opportunity for Detail View & Audit/Movement Tracker
  const [selectedFolio, setSelectedFolio] = useState<string>(
    initialFolio || 'OPP-2026-041'
  );
  const [detailTab, setDetailTab] = useState<'notas' | 'info' | 'lead'>('notas');
  const [chatterTab, setChatterTab] = useState<'movimientos' | 'nota' | 'mensaje' | 'actividad'>('movimientos');
  const [chatterFilter, setChatterFilter] = useState<'todos' | 'movimientos' | 'notas'>('todos');
  const [chatterInput, setChatterInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [detailTeamName, setDetailTeamName] = useState('Ingeniería Fire & Gas Golfo-Sur');
  const [detailCampaignName, setDetailCampaignName] = useState('Licitación Industrial Pemex / CFE');

  // Local draft states for editable fields in Detail View so user can type freely and commit on blur/Enter
  const [editDraftTitle, setEditDraftTitle] = useState('');
  const [editDraftAmount, setEditDraftAmount] = useState('');
  const [editDraftProb, setEditDraftProb] = useState('');
  const [editDraftContact, setEditDraftContact] = useState('');
  const [editDraftEmail, setEditDraftEmail] = useState('');
  const [editDraftClose, setEditDraftClose] = useState('');
  const [editDraftPhone, setEditDraftPhone] = useState('');
  const [editDraftNotes, setEditDraftNotes] = useState('');

  type AuditLogEntry = {
    id: string;
    author: string;
    roleLabel?: string;
    initials: string;
    time: string;
    title?: string;
    text: string;
    isBot?: boolean;
    kind: 'movement' | 'modification' | 'note' | 'message' | 'activity' | 'system';
    fieldLabel?: string;
    oldValue?: string;
    newValue?: string;
  };

  const [chatterLogsByFolio, setChatterLogsByFolio] = useState<
    Record<string, AuditLogEntry[]>
  >({
    'OPP-2026-041': [
      {
        id: 'log-init-0',
        author: 'Ing. Carlos Rodríguez',
        roleLabel: 'Director Comercial & CRM',
        initials: 'CR',
        time: '10:15 a.m.',
        title: 'Verificación de Alcance Técnico',
        text: 'Se validó con CFE Generación VI el listado de detectores H2S en Refinería Dos Bocas.',
        kind: 'movement',
        fieldLabel: 'Estado Operativo',
        oldValue: 'Borrador inicial',
        newValue: 'Prospección inicial (10%)',
      },
      {
        id: 'log-1',
        author: 'SIFYGSA Bot',
        roleLabel: 'Auditoría Automática',
        initials: 'BOT',
        time: '9:06 a.m.',
        title: 'Registro en Checador de Movimientos',
        text: 'Trazabilidad activa: cualquier cambio de etapa, monto, responsable o datos técnicos queda registrado con usuario y hora.',
        isBot: true,
        kind: 'system',
      },
      {
        id: 'log-2',
        author: 'Ivan Alexei Gamboa Bernal',
        roleLabel: 'Ingeniería de Ventas',
        initials: 'IA',
        time: '9:04 a.m.',
        text: 'Lead / oportunidad comercial creada en el flujo industrial SIFYGSA.',
        kind: 'system',
      },
    ],
  });

  // Cargar desde MongoDB (bitacora_crm_promesas) el historial real de movimientos del folio seleccionado
  useEffect(() => {
    if (!selectedFolio) return;
    let cancelado = false;

    fetch(`/api/crm/bitacora-promesas?folio=${encodeURIComponent(selectedFolio)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          json: {
            exito?: boolean;
            datos?: Array<{
              id: string;
              autor: string;
              rolEtiqueta?: string;
              iniciales: string;
              horaEtiqueta: string;
              titulo?: string;
              texto: string;
              esBot?: boolean;
              tipo: AuditLogEntry['kind'];
              campoEtiqueta?: string;
              valorAnterior?: string;
              valorNuevo?: string;
            }>;
          } | null
        ) => {
          if (cancelado || !json?.exito || !Array.isArray(json.datos) || json.datos.length === 0) {
            return;
          }
          const remotos: AuditLogEntry[] = json.datos.map((d) => ({
            id: d.id,
            author: d.autor,
            roleLabel: d.rolEtiqueta,
            initials: d.iniciales,
            time: d.horaEtiqueta,
            title: d.titulo,
            text: d.texto,
            isBot: d.esBot,
            kind: d.tipo,
            fieldLabel: d.campoEtiqueta,
            oldValue: d.valorAnterior,
            newValue: d.valorNuevo,
          }));

          setChatterLogsByFolio((prev) => {
            const actuales = prev[selectedFolio] || [];
            const idsRemotos = new Set(remotos.map((r) => r.id));
            const localesSinDuplicar = actuales.filter((a) => !idsRemotos.has(a.id));
            return {
              ...prev,
              [selectedFolio]: [...remotos, ...localesSinDuplicar],
            };
          });
        }
      )
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [selectedFolio]);

  const recordAuditMovement = (
    folio: string,
    entry: Omit<AuditLogEntry, 'id' | 'time' | 'author' | 'initials' | 'roleLabel'> & {
      author?: string;
      initials?: string;
      roleLabel?: string;
    }
  ) => {
    const nowTime = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const generatedId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntry: AuditLogEntry = {
      id: generatedId,
      author: entry.author || 'Ing. Carlos Rodríguez',
      roleLabel: entry.roleLabel || 'Director Comercial & CRM',
      initials: entry.initials || 'CR',
      time: nowTime,
      title: entry.title,
      text: entry.text,
      isBot: entry.isBot,
      kind: entry.kind,
      fieldLabel: entry.fieldLabel,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
    };

    setChatterLogsByFolio((prev) => {
      const existing = prev[folio] || [
        {
          id: `init-${folio}`,
          author: 'Ing. Carlos Rodríguez',
          roleLabel: 'Director Comercial & CRM',
          initials: 'CR',
          time: '09:00 a.m.',
          text: `Oportunidad ${folio} registrada en el flujo industrial SIFYGSA.`,
          kind: 'system',
        },
      ];
      return {
        ...prev,
        [folio]: [newEntry, ...existing],
      };
    });

    // Obtener nombre y cliente de la promesa/oportunidad para guardarlos siempre en MongoDB
    const oppMeta = opportunities.find((o) => o.folio === folio);
    const nombrePromesa = oppMeta?.title;
    const clientePromesa = oppMeta?.client;

    // Persistir movimiento en MongoDB Atlas -> BitacoraSifigsa.bitacora_crm_promesas
    void fetch('/api/crm/bitacora-promesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: generatedId,
        folio,
        nombrePromesa,
        clientePromesa,
        tipo: entry.kind,
        titulo: entry.title,
        campoEtiqueta: entry.fieldLabel,
        valorAnterior: entry.oldValue,
        valorNuevo: entry.newValue,
        texto: entry.text,
        esBot: entry.isBot,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.warn('[CRM Bitácora MongoDB] Error al guardar movimiento:', res.status, detail);
        }
      })
      .catch((err) => {
        console.warn('[CRM Bitácora MongoDB] Error de red:', err);
      });
  };

  // Calendar states (dentro de CRM con Kanban, Lista, Gráfica, etc.)
  const [calendarScale, setCalendarScale] = useState<'Día' | 'Semana' | 'Mes' | 'Año'>('Semana');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(
    INITIAL_CALENDAR_EVENTS
  );
  const [showSchedulePopover, setShowSchedulePopover] = useState(true);
  const [newEventTitle, setNewEventTitle] = useState(
    'Visita Técnica: Pruebas Lazos F&G Planta Coquizadora'
  );
  const [newEventFolio, setNewEventFolio] = useState(
    'OPP-2026-074 • Pemex Logística Tanques'
  );

  const handleSaveCalendarEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEv: CalendarEventItem = {
      id: `ev-${Date.now()}`,
      dayCol: 3,
      topPx: 390,
      heightPx: 90,
      timeRange: '13:30 - 15:00',
      title: newEventTitle,
      folioBadge: newEventFolio.split('•')[0]?.trim() || 'OPP-2026-074',
      colorType: 'blue',
    };
    setCalendarEvents((prev) => [...prev, newEv]);
    setShowSchedulePopover(false);
  };

  // Graph states
  const [graphType, setGraphType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [graphMeasure, setGraphMeasure] =
    useState<(typeof GRAPH_MEASURES)[number]>('Ingreso esperado');
  const [measureDropdownOpen, setMeasureDropdownOpen] = useState(false);
  const [isStacked, setIsStacked] = useState(true);
  const [isCumulative, setIsCumulative] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Sync external currentView prop
  useEffect(() => {
    if (currentView) {
      setViewMode(currentView as StitchViewMode);
    }
  }, [currentView]);

  useEffect(() => {
    if (initialFolio) {
      setSelectedFolio(initialFolio);
    }
  }, [initialFolio]);

  const switchView = (next: StitchViewMode) => {
    setViewMode(next);
    onChangeView?.(next);
  };

  const openOpportunityDetail = (folio: string) => {
    setSelectedFolio(folio);
    setViewMode('detail');
    onSelectOpportunity?.(folio);
  };

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (activeQuickTag) {
        const matchesQuick =
          opp.tags.some((t) => t.toLowerCase().includes(activeQuickTag.toLowerCase())) ||
          opp.listBadge.toLowerCase().includes(activeQuickTag.toLowerCase()) ||
          opp.title.toLowerCase().includes(activeQuickTag.toLowerCase());
        if (!matchesQuick) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        opp.folio.toLowerCase().includes(q) ||
        opp.client.toLowerCase().includes(q) ||
        opp.title.toLowerCase().includes(q) ||
        opp.contactName.toLowerCase().includes(q) ||
        opp.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [opportunities, searchQuery, activeQuickTag]);

  const selectedOpportunity = useMemo(() => {
    return (
      opportunities.find((o) => o.folio === selectedFolio) || opportunities[0]
    );
  }, [opportunities, selectedFolio]);

  // Sincronizar campos editables cuando cambia la oportunidad seleccionada
  useEffect(() => {
    if (!selectedOpportunity) return;
    setEditDraftTitle(selectedOpportunity.title);
    setEditDraftAmount(selectedOpportunity.amount.toLocaleString('es-MX'));
    setEditDraftProb(String(selectedOpportunity.probability));
    setEditDraftContact(selectedOpportunity.contactName);
    setEditDraftEmail(selectedOpportunity.email);
    setEditDraftClose(selectedOpportunity.expectedClose);
    setEditDraftPhone(selectedOpportunity.phone);
    setEditDraftNotes(selectedOpportunity.notes);
  }, [selectedOpportunity?.folio]);

  // Actualizar cualquier campo de la oportunidad seleccionada y registrar en el Checador de Movimientos
  const updateSelectedOpportunityField = (
    patch: Partial<StitchOpportunity>,
    fieldLabel: string,
    oldVal: string,
    newVal: string,
    kind: 'movement' | 'modification' = 'modification'
  ) => {
    if (!selectedOpportunity || oldVal.trim() === newVal.trim()) return;
    const targetFolio = selectedOpportunity.folio;
    setOpportunities((prev) =>
      prev.map((o) => (o.folio === targetFolio ? { ...o, ...patch } : o))
    );
    recordAuditMovement(targetFolio, {
      kind,
      title:
        kind === 'movement'
          ? 'Movimiento de Etapa en Pipeline'
          : `Modificación de ${fieldLabel}`,
      fieldLabel,
      oldValue: oldVal,
      newValue: newVal,
      text: `Actualizó ${fieldLabel.toLowerCase()} en la ficha técnica de la oportunidad.`,
    });
  };

  // Filtered registered clients for the NUEVA OPORTUNIDAD dropdown
  const matchingClientsForDropdown = useMemo(() => {
    const q = newOppClient.trim().toLowerCase();
    if (!q) return registeredClients;
    return registeredClients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.tagCode.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [registeredClients, newOppClient]);

  // Select an existing registered client from the dropdown
  const handleSelectRegisteredClient = (client: CrmClientContact) => {
    setNewOppClient(client.companyName);
    setNewOppContactName(client.contactName);
    setNewOppTagCode(client.tagCode);
    setNewOppEmail(client.email);
    setNewOppPhone(client.phone);
    setClientDropdownOpen(false);
  };

  // Open the modal to register a brand new client
  const handleOpenNewClientModal = (prefillName?: string) => {
    const cleanName = (prefillName ?? newOppClient).trim();
    setModalCompanyName(cleanName);
    setModalTagCode(
      cleanName
        ? cleanName
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 3)
          .toUpperCase()
        : ''
    );
    setModalContactName('');
    setModalContactRole('Gerente de Planta / Instrumentación');
    setModalEmail('');
    setModalPhone('');
    setModalSector('Petroquímica');
    setModalCity('Coatzacoalcos, Veracruz');
    setModalZone('Istmo');
    setModalRfc('');
    setClientDropdownOpen(false);
    setShowNewClientModal(true);
  };

  // Save the new client from the modal -> adds to dropdown AND to Contactos
  const handleSaveNewClientModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCompanyName.trim()) return;
    const generatedCode =
      (
        modalTagCode.trim() ||
        modalCompanyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) ||
        'CLI'
      ).toUpperCase();

    const newClient: CrmClientContact = {
      id: `cli-${Date.now()}`,
      tagCode: generatedCode,
      companyName: modalCompanyName.trim(),
      contactName: modalContactName.trim() || 'Contacto Comercial',
      contactRole: modalContactRole.trim() || 'Representante Técnico',
      email:
        modalEmail.trim() ||
        `contacto@${modalCompanyName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')}.com.mx`,
      phone: modalPhone.trim() || '(921) 210-0000',
      rfc: modalRfc.trim().toUpperCase() || 'XAXX010101000',
      sector: modalSector,
      city: modalCity.trim() || 'Coatzacoalcos, Veracruz',
      zone: modalZone,
      activeOppsCount: quickCreateStage ? 1 : 0,
      totalPipelineAmount: 0,
    };

    const nextList = [newClient, ...registeredClients];
    persistClients(nextList);

    // Auto-select in the Nueva Oportunidad form if open
    setNewOppClient(newClient.companyName);
    setNewOppContactName(newClient.contactName);
    setNewOppTagCode(newClient.tagCode);
    setNewOppEmail(newClient.email);
    setNewOppPhone(newClient.phone);
    setShowNewClientModal(false);

    setClientSavedToast(
      `Cliente "${newClient.companyName}" registrado en el menú desplegable y en Contactos.`
    );
    setTimeout(() => setClientSavedToast(null), 4000);
  };

  // Create new opportunity inline
  const handleAddInlineOpportunity = (stageName: string) => {
    if (!newOppTitle.trim() && !newOppClient.trim()) return;
    const numericAmount =
      Number(newOppAmount.replace(/[^0-9.]/g, '')) || 1250000;
    const nextNumber = 106 + opportunities.length;
    const newFolio = `OPP-2026-${nextNumber}`;
    const stageObj = stages.find((s) => s.name === stageName);
    const resolvedClientName =
      newOppClient.trim() || 'Cliente Industrial SIFYGSA';
    const resolvedTagCode =
      (newOppTagCode || resolvedClientName.slice(0, 3) || 'SFG').toUpperCase();

    const created: StitchOpportunity = {
      folio: newFolio,
      tagCode: resolvedTagCode,
      client: resolvedClientName,
      title:
        newOppTitle.trim() ||
        'Suministro e ingeniería de sistema de detección Fire & Gas',
      amount: numericAmount,
      amountFormatted: `$${numericAmount.toLocaleString('es-MX')}`,
      probability: stageObj?.probability ?? 10,
      stage: stageName,
      stars: newOppStars,
      tags: ['NFPA 72', 'SIL 2'],
      statusText: 'Al día (Recién registrada)',
      statusType: 'ok',
      ownerInitials: 'CR',
      ownerName: 'Ing. Carlos Rodríguez',
      ownerAvatarClass: 'bg-primary-container text-on-primary',
      contactName: newOppContactName.trim() || resolvedClientName,
      contactRole: resolvedClientName,
      email: newOppEmail.trim() || 'contacto@cliente-industrial.mx',
      phone: newOppPhone.trim() || '(55) 5555-0199',
      expectedClose: '15 Dic 2026',
      listBadge: 'NFPA 72',
      notes: 'Oportunidad creada directamente desde el tablero Kanban.',
    };
    setOpportunities((prev) => [created, ...prev]);

    // Registrar inmediatamente la creación de la nueva promesa en MongoDB (bitacora_crm_promesas y bitacora_general)
    recordAuditMovement(created.folio, {
      kind: 'movement',
      title: 'Creación de nueva promesa comercial',
      fieldLabel: 'Alta de Oportunidad',
      oldValue: 'Sin registro',
      newValue: `${created.stage} (${created.amountFormatted} MXN)`,
      text: `Nueva promesa creada para ${created.client}: "${created.title}".`,
    });

    // Update or add client stats in registeredClients
    const existingClient = registeredClients.find(
      (c) => c.companyName.toLowerCase() === resolvedClientName.toLowerCase()
    );
    if (existingClient) {
      persistClients(
        registeredClients.map((c) =>
          c.id === existingClient.id
            ? {
              ...c,
              activeOppsCount: c.activeOppsCount + 1,
              totalPipelineAmount: c.totalPipelineAmount + numericAmount,
            }
            : c
        )
      );
    }

    setQuickCreateStage(null);
    setClientDropdownOpen(false);
    setNewOppClient('');
    setNewOppContactName('');
    setNewOppTagCode('');
    setNewOppTitle('');
    setNewOppEmail('');
    setNewOppPhone('');
    setNewOppAmount('1,250,000');
    setJustDroppedFolio(newFolio);
    setTimeout(() => setJustDroppedFolio(null), 650);
  };

  // Move opportunity between stages or positions (also logs in Checador de Movimientos)
  const moveOpportunityToStage = (
    folioToMove: string,
    targetStageName: string,
    insertBeforeFolio?: string | null
  ) => {
    const stageObj = stages.find((s) => s.name === targetStageName);
    const currentOpp = opportunities.find((o) => o.folio === folioToMove);
    const newProb = stageObj?.probability ?? currentOpp?.probability ?? 10;

    if (currentOpp && currentOpp.stage !== targetStageName) {
      recordAuditMovement(folioToMove, {
        kind: 'movement',
        title: 'Movimiento de Etapa en Tablero Kanban',
        fieldLabel: 'Etapa del Pipeline',
        oldValue: `${currentOpp.stage} (${currentOpp.probability}%)`,
        newValue: `${targetStageName} (${newProb}%)`,
        text: `Desplazó la oportunidad en el tablero hacia la etapa "${targetStageName}".`,
      });
    }

    setOpportunities((prev) => {
      const targetOpp = prev.find((o) => o.folio === folioToMove);
      if (!targetOpp) return prev;
      const updatedOpp: StitchOpportunity = {
        ...targetOpp,
        stage: targetStageName,
        probability: stageObj?.probability ?? targetOpp.probability,
        isDraggingDemo: false,
      };
      const withoutTarget = prev.filter((o) => o.folio !== folioToMove);
      if (insertBeforeFolio && insertBeforeFolio !== folioToMove) {
        const idx = withoutTarget.findIndex((o) => o.folio === insertBeforeFolio);
        if (idx !== -1) {
          const next = [...withoutTarget];
          next.splice(idx, 0, updatedOpp);
          return next;
        }
      }
      return [updatedOpp, ...withoutTarget];
    });
    setJustDroppedFolio(folioToMove);
    setTimeout(() => {
      setJustDroppedFolio((current) => (current === folioToMove ? null : current));
    }, 650);
  };

  // Pointer-based Drag & Drop handler (Natural floating card without browser ghost)
  const handleCardPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    opp: StitchOpportunity
  ) => {
    if (e.button !== 0) return;
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button, input, select, textarea, a')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    pointerDragRef.current = {
      folio: opp.folio,
      originStage: opp.stage,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      active: false,
      currentTargetStage: opp.stage,
      currentTargetCard: null,
    };
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const info = pointerDragRef.current;
      if (!info) return;

      const dx = e.clientX - info.startX;
      const dy = e.clientY - info.startY;

      if (!info.active) {
        if (Math.hypot(dx, dy) < 6) return;
        info.active = true;
        setDraggedFolio(info.folio);
        setDragOverStage(info.originStage);
        setDragOffset({ x: info.offsetX, y: info.offsetY });
        setDragCardDims({ width: info.width, height: info.height });
        setJustDroppedFolio(null);
      }

      setPointerPos({ x: e.clientX, y: e.clientY });

      // Detect column and card underneath the pointer
      const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
      let foundStage: string | null = null;
      let foundCard: string | null = null;

      for (const el of elementsUnder) {
        if (!foundCard) {
          const cardEl = (el as HTMLElement).closest?.('[data-kanban-card]') as HTMLElement | null;
          if (cardEl) {
            const f = cardEl.getAttribute('data-kanban-card');
            if (f && f !== info.folio) {
              foundCard = f;
            }
          }
        }
        if (!foundStage) {
          const stageEl = (el as HTMLElement).closest?.('[data-kanban-stage]') as HTMLElement | null;
          if (stageEl) {
            foundStage = stageEl.getAttribute('data-kanban-stage');
          }
        }
      }

      if (foundStage && foundStage !== info.currentTargetStage) {
        info.currentTargetStage = foundStage;
        setDragOverStage(foundStage);
      }
      if (foundCard !== info.currentTargetCard) {
        info.currentTargetCard = foundCard;
        setDragOverCardFolio(foundCard);
      }
    };

    const handleGlobalPointerUp = () => {
      const info = pointerDragRef.current;
      if (!info) return;
      pointerDragRef.current = null;

      if (!info.active) {
        // Simple click -> open detail view
        openOpportunityDetail(info.folio);
        return;
      }

      moveOpportunityToStage(
        info.folio,
        info.currentTargetStage,
        info.currentTargetCard
      );
      setDraggedFolio(null);
      setDragOverStage(null);
      setDragOverCardFolio(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  });

  return (
    <div className="sifygsa-tailwind-scope w-full min-h-[calc(100vh-64px)] bg-surface text-on-surface flex flex-col select-none">
      {/* =====================================================================
          SUB-HEADER: CONTROLES DE PIPELINE Y SELECTOR DE 7 VISTAS (STITCH)
          ===================================================================== */}
      {viewMode !== 'detail' && (
        <section className="bg-surface-container-lowest border-b border-outline-variant/25 px-6 py-3 flex flex-col gap-3 shrink-0">
          {/* Fila 1: Acciones Izquierda + Switcher de 7 Vistas Derecha (fijo a la derecha, sin envolver al centro) */}
          <div
            className="flex items-center justify-between gap-3 flex-nowrap"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Left Group */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Primary Action: + Nuevo */}
              <div className="inline-flex rounded-lg shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === 'contacts') {
                      handleOpenNewClientModal('');
                    } else {
                      setQuickCreateStage('Prospección inicial');
                      if (viewMode !== 'kanban') switchView('kanban');
                    }
                  }}
                  className="bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs px-3.5 py-2 rounded-l-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>
                    {viewMode === 'contacts' ? 'Nuevo Cliente' : 'Nuevo'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === 'contacts') {
                      handleOpenNewClientModal('');
                    } else {
                      setQuickCreateStage('Prospección inicial');
                      if (viewMode !== 'kanban') switchView('kanban');
                    }
                  }}
                  className="bg-primary hover:bg-blue-800 text-on-primary px-2 py-2 rounded-r-lg border-l border-blue-500/40 flex items-center cursor-pointer"
                  title="Opciones de creación rápida"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>

              <div className="h-5 w-[1px] bg-outline-variant/30 mx-0.5 shrink-0" />

              {/* Module Title & Context */}
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-lg font-bold text-on-surface tracking-tight truncate">
                  {viewMode === 'contacts'
                    ? 'Contactos y Clientes'
                    : viewMode === 'graph'
                      ? 'Análisis de Flujo'
                      : 'Flujo'}
                </h1>
                <span className="hidden lg:inline-flex font-mono text-[11px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-medium truncate">
                  {viewMode === 'contacts'
                    ? `${registeredClients.length} empresas registradas`
                    : viewMode === 'calendar'
                      ? 'Calendario de Promesas y Oportunidades'
                      : 'Pipeline Industrial Q4-2026'}
                </span>
              </div>
            </div>

            {/* Right Group: Paginador compacto + View Switcher (7 Vistas SIFYGSA, siempre fijo a la derecha) */}
            <div
              className="flex items-center gap-2.5 shrink-0 ml-auto"
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              {/* Compact Paginator */}
              <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/25">
                <span className="font-semibold text-on-surface">
                  1-{filteredOpportunities.length}
                </span>
                <span>/</span>
                <span>{opportunities.length}</span>
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                    title="Anterior"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                    title="Siguiente"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>

              {/* View Switcher (7 Vistas) */}
              <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => switchView('kanban')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewMode === 'kanban'
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Vista Kanban"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    view_kanban
                  </span>
                  <span>Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchView('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${viewMode === 'list'
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Vista Lista"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    format_list_bulleted
                  </span>
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchView('calendar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${viewMode === 'calendar'
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Vista Calendario"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    calendar_month
                  </span>
                  <span className="hidden sm:inline">Calendario</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchView('pivot')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'pivot'
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Vista Tabla Dinámica (Pivot)"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    pivot_table_chart
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => switchView('graph')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${viewMode === 'graph'
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Vista Gráfica"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    bar_chart
                  </span>
                  <span className="hidden sm:inline">Gráfica</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchView('map')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'map'
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Vista Mapa de Ubicaciones"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => switchView('activities')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'activities'
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                    }`}
                  title="Matriz de Actividades"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Fila 2: Barra de Búsqueda con Chips + Menú de 3 Columnas + Filtros Rápidos */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/15 relative">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1 flex-1 max-w-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                <span className="material-symbols-outlined text-[16px] text-outline">
                  filter_alt
                </span>
                {/* Active Filter Chip */}
                {myOppsFilterActive && (
                  <span className="inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                    <span>Mis oportunidades</span>
                    <button
                      type="button"
                      onClick={() => setMyOppsFilterActive(false)}
                      className="hover:text-primary cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        close
                      </span>
                    </button>
                  </span>
                )}
                {groupByField && (
                  <span className="inline-flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                    <span>Agrupado: {groupByField}</span>
                    <button
                      type="button"
                      onClick={() => setGroupByField(null)}
                      className="hover:text-primary cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        close
                      </span>
                    </button>
                  </span>
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por cliente, folio OPP-2026-xxx, equipo o tag..."
                  className="bg-transparent border-none text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-0 w-full py-0.5"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      close
                    </span>
                  </button>
                )}
              </div>

              {/* Botón Desplegable de 3 Columnas: Filtros | Agrupar por | Favoritos */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container-high/60 px-2.5 py-1.5 rounded-lg border border-outline-variant/25 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    tune
                  </span>
                  <span>Filtros</span>
                  <span className="material-symbols-outlined text-[14px]">
                    expand_more
                  </span>
                </button>

                {filterDropdownOpen && (
                  <div className="absolute left-0 top-10 w-[520px] bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-2xl z-50 p-4 grid grid-cols-3 gap-4 text-xs">
                    {/* Columna 1: Filtros */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 font-bold text-on-surface uppercase tracking-wider text-[10px] pb-1 border-b border-outline-variant/25">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          filter_alt
                        </span>
                        <span>Filtros</span>
                      </div>
                      {[
                        'Mis oportunidades',
                        'Sin asignar',
                        'Oportunidades abiertas',
                        'Actividades vencidas',
                        'Ganadas Q4-2026',
                      ].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            if (item === 'Mis oportunidades') {
                              setMyOppsFilterActive((v) => !v);
                            } else {
                              setSearchQuery(item === 'Ganadas Q4-2026' ? 'Adjudicada' : '');
                            }
                            setFilterDropdownOpen(false);
                          }}
                          className="text-left px-2 py-1 rounded hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-between cursor-pointer"
                        >
                          <span>{item}</span>
                          {item === 'Mis oportunidades' && myOppsFilterActive && (
                            <span className="text-primary font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Columna 2: Agrupar por */}
                    <div className="flex flex-col gap-1.5 border-l border-outline-variant/25 pl-3">
                      <div className="flex items-center gap-1 font-bold text-on-surface uppercase tracking-wider text-[10px] pb-1 border-b border-outline-variant/25">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          layers
                        </span>
                        <span>Agrupar por</span>
                      </div>
                      {[
                        'Vendedor',
                        'Etapa',
                        'Cliente / Empresa',
                        'Mes de cierre',
                        'Normativa (NFPA/SIL)',
                      ].map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => {
                            setGroupByField(grp);
                            setFilterDropdownOpen(false);
                          }}
                          className="text-left px-2 py-1 rounded hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-between cursor-pointer"
                        >
                          <span>{grp}</span>
                          {groupByField === grp && (
                            <span className="text-primary font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Columna 3: Favoritos */}
                    <div className="flex flex-col gap-1.5 border-l border-outline-variant/25 pl-3">
                      <div className="flex items-center gap-1 font-bold text-on-surface uppercase tracking-wider text-[10px] pb-1 border-b border-outline-variant/25">
                        <span className="material-symbols-outlined text-[14px] text-amber-500">
                          star
                        </span>
                        <span>Favoritos</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFilterDropdownOpen(false)}
                        className="text-left px-2 py-1.5 rounded bg-primary-fixed/50 text-primary font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          bookmark_add
                        </span>
                        <span>Guardar búsqueda actual</span>
                      </button>
                      <span className="text-[10px] text-outline mt-1">
                        Vistas guardadas:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuickTag('SIL 2');
                          setFilterDropdownOpen(false);
                        }}
                        className="text-left px-2 py-1 rounded hover:bg-surface-container-low text-on-surface-variant truncate cursor-pointer"
                      >
                        ★ Licitaciones Pemex SIL-2
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tag Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[11px] text-outline font-medium mr-1">
                Rápido:
              </span>
              {['NFPA 72', 'SIL 2', 'Offshore', 'Notifier', 'ATEX'].map(
                (tag) => {
                  const isActive = activeQuickTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setActiveQuickTag(isActive ? null : tag)
                      }
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${isActive
                        ? 'bg-primary-container text-on-primary border-primary-container font-semibold'
                        : 'bg-surface-container-low hover:bg-primary-fixed hover:text-on-primary-fixed text-on-surface-variant border-outline-variant/25'
                        }`}
                    >
                      {tag}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>
      )}

      {/* Toast de confirmación cuando se registra un nuevo cliente */}
      {clientSavedToast && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{clientSavedToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setClientSavedToast(null)}
            className="hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          VISTA 1: TABLERO KANBAN (5 COLUMNAS STITCH + ANIMACIÓN DE ARRASTRADO NATURAL)
          ===================================================================== */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-5 bg-surface relative">
          <div className="flex gap-4 h-full min-w-max items-stretch">
            {stages.map((stage, stageIdx) => {
              // Si hay una tarjeta arrastrándose, la removemos de su lugar original para que el hueco fluya naturalmente
              const rawStageOpps = filteredOpportunities.filter(
                (o) => o.stage === stage.name
              );
              const visibleStageOpps = rawStageOpps.filter(
                (o) => o.folio !== draggedFolio
              );
              const totalAmount = rawStageOpps.reduce((s, o) => s + o.amount, 0);
              const weightedAmount = Math.round(
                (totalAmount * stage.probability) / 100
              );
              const isDropTarget = dragOverStage === stage.name && draggedFolio !== null;
              const prevStageName = stageIdx > 0 ? stages[stageIdx - 1]?.name : null;
              const nextStageName =
                stageIdx < stages.length - 1 ? stages[stageIdx + 1]?.name : null;

              return (
                <div
                  key={stage.id}
                  data-kanban-stage={stage.name}
                  className={`w-[326px] flex flex-col rounded-xl p-3.5 transition-all duration-200 ${isDropTarget
                    ? 'bg-primary-fixed/20 border-2 border-primary/60 ring-4 ring-primary/10 shadow-lg'
                    : 'bg-surface-container-low/85 border border-outline-variant/35 shadow-sm'
                    }`}
                >
                  {/* Column Header */}
                  <div className="px-1.5 pt-0.5 pb-3 border-b border-outline-variant/25 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full transition-transform ${isDropTarget ? 'scale-125' : ''
                            }`}
                          style={{ backgroundColor: stage.accentColor }}
                        />
                        <h2
                          className={`font-semibold text-sm transition-colors ${isDropTarget
                            ? 'text-primary font-bold'
                            : 'text-on-surface'
                            }`}
                        >
                          {stage.name}
                        </h2>
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${isDropTarget
                            ? 'bg-primary text-on-primary'
                            : stage.isWon
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-surface-container-highest text-on-surface-variant'
                            }`}
                        >
                          {rawStageOpps.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickCreateStage(
                            quickCreateStage === stage.name ? null : stage.name
                          );
                          setClientDropdownOpen(false);
                        }}
                        className="text-outline hover:text-primary p-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer"
                        title={`Crear oportunidad en ${stage.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          add
                        </span>
                      </button>
                    </div>

                    {/* Progress bar + total */}
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(20, stage.probability))}%`,
                          backgroundColor: stage.accentColor,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">
                        Suma Total:
                      </span>
                      <span
                        className={`font-mono font-semibold ${isDropTarget
                          ? 'text-primary font-bold'
                          : stage.isWon
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-on-surface'
                          }`}
                      >
                        ${totalAmount.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 overflow-y-auto py-3 px-1.5 -mx-1.5 flex flex-col gap-3">
                    {/* Inline Quick Create Form (when + clicked) */}
                    {quickCreateStage === stage.name && (
                      <div className="bg-surface-container-lowest p-3.5 rounded-xl border-2 border-primary shadow-md flex flex-col gap-2.5 kanban-drop-slot relative z-20">
                        <div className="flex items-center justify-between border-b border-outline-variant/25 pb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            Nueva Oportunidad
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickCreateStage(null);
                              setClientDropdownOpen(false);
                            }}
                            className="text-outline hover:text-on-surface cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              close
                            </span>
                          </button>
                        </div>

                        {/* Menú Desplegable de Clientes Registrados + Opción "+ Agregar nuevo cliente" */}
                        <div className="relative">
                          <div className="flex items-center bg-surface-container-low border border-outline-variant/40 rounded-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                            <span className="material-symbols-outlined text-[15px] text-outline pl-2.5">
                              domain
                            </span>
                            <input
                              type="text"
                              value={newOppClient}
                              onFocus={() => setClientDropdownOpen(true)}
                              onChange={(e) => {
                                setNewOppClient(e.target.value);
                                setClientDropdownOpen(true);
                              }}
                              placeholder="Seleccionar o buscar cliente..."
                              className="w-full text-xs bg-transparent px-2 py-1.5 text-on-surface focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setClientDropdownOpen((v) => !v)}
                              className="px-2 py-1 text-outline hover:text-primary cursor-pointer flex items-center"
                              title="Mostrar clientes registrados"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {clientDropdownOpen ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>

                          {clientDropdownOpen && (
                            <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-60">
                              <div className="px-2.5 py-1.5 bg-surface-container-low border-b border-outline-variant/25 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                <span>Clientes Registrados ({matchingClientsForDropdown.length})</span>
                                <span className="text-primary">Contactos CRM</span>
                              </div>

                              <div className="overflow-y-auto divide-y divide-outline-variant/15 max-h-40">
                                {matchingClientsForDropdown.length > 0 ? (
                                  matchingClientsForDropdown.map((cli) => (
                                    <button
                                      key={cli.id}
                                      type="button"
                                      onClick={() => handleSelectRegisteredClient(cli)}
                                      className="w-full text-left px-2.5 py-2 hover:bg-primary-fixed/40 transition-colors flex items-start gap-2 cursor-pointer"
                                    >
                                      <span className="w-6 h-6 rounded bg-primary-fixed text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        {cli.tagCode}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-on-surface truncate">
                                          {cli.companyName}
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant truncate">
                                          {cli.contactName} • {cli.phone}
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-2.5 text-[11px] text-on-surface-variant text-center">
                                    No se encontró &ldquo;{newOppClient}&rdquo; en clientes registrados.
                                  </div>
                                )}
                              </div>

                              {/* Botón fijo inferior para abrir ventana de Nuevo Cliente */}
                              <button
                                type="button"
                                onClick={() => handleOpenNewClientModal(newOppClient)}
                                className="w-full px-3 py-2 bg-primary-fixed/50 hover:bg-primary text-primary hover:text-on-primary border-t border-outline-variant/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  person_add
                                </span>
                                <span>+ Agregar nuevo cliente...</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          value={newOppTitle}
                          onChange={(e) => setNewOppTitle(e.target.value)}
                          placeholder="Título de la oportunidad..."
                          className="w-full text-xs bg-surface-container-low border border-outline-variant/35 rounded-lg px-2.5 py-1.5 text-on-surface font-medium focus:outline-none focus:border-primary"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="email"
                            value={newOppEmail}
                            onChange={(e) => setNewOppEmail(e.target.value)}
                            placeholder="Correo contacto"
                            className="w-full text-[11px] bg-surface-container-low border border-outline-variant/35 rounded-lg px-2 py-1 text-on-surface focus:outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            value={newOppPhone}
                            onChange={(e) => setNewOppPhone(e.target.value)}
                            placeholder="Teléfono"
                            className="w-full text-[11px] bg-surface-container-low border border-outline-variant/35 rounded-lg px-2 py-1 text-on-surface focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/35 rounded-lg px-2 py-1 flex-1">
                            <span className="font-mono text-xs text-outline">$</span>
                            <input
                              type="text"
                              value={newOppAmount}
                              onChange={(e) => setNewOppAmount(e.target.value)}
                              className="w-full text-xs font-mono font-bold bg-transparent text-on-surface focus:outline-none"
                            />
                            <span className="font-mono text-[10px] text-outline">
                              MXN
                            </span>
                          </div>
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setNewOppStars(st)}
                                className="cursor-pointer"
                              >
                                <span
                                  className="material-symbols-outlined text-[16px]"
                                  style={{
                                    fontVariationSettings:
                                      st <= newOppStars
                                        ? "'FILL' 1"
                                        : "'FILL' 0",
                                  }}
                                >
                                  star
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/25">
                          <button
                            type="button"
                            onClick={() => {
                              setQuickCreateStage(null);
                              setClientDropdownOpen(false);
                            }}
                            className="text-xs text-on-surface-variant hover:text-on-surface px-2.5 py-1 rounded cursor-pointer"
                          >
                            Descartar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddInlineOpportunity(stage.name)}
                            className="bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold px-3 py-1 rounded-lg shadow-sm cursor-pointer"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hueco natural animado cuando la columna recibe una tarjeta sin apuntar a una tarjeta específica */}
                    {isDropTarget && !dragOverCardFolio && (
                      <div
                        style={{ minHeight: `${Math.max(130, dragCardDims.height * 0.72)}px` }}
                        className="kanban-drop-slot border-2 border-dashed border-primary/65 bg-primary-fixed/25 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold text-primary transition-all duration-200"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          move_to_inbox
                        </span>
                        <span>Soltar en {stage.name} ({stage.probability}%)</span>
                      </div>
                    )}

                    {/* Opportunity Cards */}
                    {visibleStageOpps.map((opp) => {
                      const isJustDropped = justDroppedFolio === opp.folio;
                      const isHoveredDropCard =
                        isDropTarget && dragOverCardFolio === opp.folio;

                      return (
                        <React.Fragment key={opp.folio}>
                          {/* Si el cursor está sobre esta tarjeta mientras arrastra, abrimos el espacio exactamente arriba de ella */}
                          {isHoveredDropCard && (
                            <div
                              style={{ minHeight: `${Math.max(130, dragCardDims.height * 0.72)}px` }}
                              className="kanban-drop-slot border-2 border-dashed border-primary/65 bg-primary-fixed/25 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold text-primary transition-all duration-200"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                move_to_inbox
                              </span>
                              <span>Soltar aquí ({stage.probability}%)</span>
                            </div>
                          )}

                          <div
                            data-kanban-card={opp.folio}
                            onPointerDown={(e) => handleCardPointerDown(e, opp)}
                            className={`kanban-card-draggable bg-surface-container-lowest p-4 rounded-xl border cursor-grab active:cursor-grabbing group flex flex-col gap-2.5 touch-none ${isJustDropped
                              ? 'kanban-card-landed border-2 border-primary shadow-md'
                              : stage.isWon
                                ? 'border-emerald-500/35 shadow-sm hover:shadow-md hover:border-emerald-500/60'
                                : 'border-outline-variant/35 shadow-sm hover:shadow-md hover:border-primary/45'
                              }`}
                          >
                            {/* Top row: Drag Handle + Folio + Stars/Won Badge + Quick Stage Arrows */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className="material-symbols-outlined text-[15px] text-outline/60 group-hover:text-primary transition-colors"
                                  title="Arrastrar tarjeta"
                                >
                                  drag_indicator
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-md">
                                  {opp.folio}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Quick stage shift buttons visible on hover */}
                                <div className="hidden group-hover:flex items-center gap-0.5 bg-surface-container-low border border-outline-variant/30 rounded-md px-0.5 py-0.5">
                                  {prevStageName && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveOpportunityToStage(opp.folio, prevStageName);
                                      }}
                                      className="p-0.5 rounded hover:bg-primary-fixed hover:text-primary text-on-surface-variant cursor-pointer"
                                      title={`Mover a ${prevStageName}`}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">
                                        chevron_left
                                      </span>
                                    </button>
                                  )}
                                  {nextStageName && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveOpportunityToStage(opp.folio, nextStageName);
                                      }}
                                      className="p-0.5 rounded hover:bg-primary-fixed hover:text-primary text-on-surface-variant cursor-pointer"
                                      title={`Mover a ${nextStageName}`}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">
                                        chevron_right
                                      </span>
                                    </button>
                                  )}
                                </div>

                                {opp.wonBadge ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-[12px]">
                                      verified
                                    </span>
                                    {opp.wonBadge}
                                  </span>
                                ) : (
                                  <div className="flex items-center text-amber-400">
                                    {[1, 2, 3].map((starIdx) => (
                                      <span
                                        key={starIdx}
                                        className={`material-symbols-outlined text-[15px] ${starIdx <= opp.stars
                                          ? 'text-amber-400'
                                          : 'text-outline-variant'
                                          }`}
                                        style={{
                                          fontVariationSettings:
                                            starIdx <= opp.stars
                                              ? "'FILL' 1"
                                              : "'FILL' 0",
                                        }}
                                      >
                                        star
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Client Row */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${opp.tagDanger
                                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                  : 'bg-surface-container-high text-on-surface-variant'
                                  }`}
                              >
                                {opp.tagCode}
                              </span>
                              <span className="text-xs font-semibold text-on-surface-variant truncate">
                                {opp.client}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors">
                              {opp.title}
                            </h3>

                            {/* Amount & Probability */}
                            <div className="pt-1 flex flex-col gap-1.5">
                              <div className="flex items-baseline justify-between">
                                <span className="font-mono text-base font-bold text-on-surface">
                                  {opp.amountFormatted}{' '}
                                  <span className="text-[10px] font-normal text-outline">
                                    MXN
                                  </span>
                                </span>
                                <span
                                  className={`font-mono text-xs font-semibold ${opp.probability === 100
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-primary'
                                    }`}
                                >
                                  {opp.probability}%
                                </span>
                              </div>
                              <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${opp.probability}%`,
                                    backgroundColor: stage.accentColor,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Warning banner if present */}
                            {opp.warningBanner && (
                              <div className="bg-amber-500/10 border border-amber-500/35 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] text-amber-500 shrink-0">
                                  warning
                                </span>
                                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 leading-tight">
                                  {opp.warningBanner}
                                </span>
                              </div>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {opp.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-medium bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/30"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            {/* Card Footer: Activity SLA + Owner Avatar */}
                            <div className="pt-2 mt-1 border-t border-outline-variant/25 flex items-center justify-between">
                              <div
                                className={`flex items-center gap-1.5 text-[11px] font-medium ${opp.statusType === 'overdue'
                                  ? 'text-error font-semibold'
                                  : opp.statusType === 'today'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${opp.statusType === 'overdue'
                                    ? 'bg-error animate-pulse'
                                    : opp.statusType === 'today'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                    }`}
                                />
                                <span>{opp.statusText}</span>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${opp.ownerAvatarClass}`}
                                title={opp.ownerName}
                              >
                                {opp.ownerInitials}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Column Footer Weighted Total */}
                  <div
                    className={`pt-2.5 px-1.5 border-t flex items-center justify-between text-[11px] transition-colors ${isDropTarget
                      ? 'border-primary/30 text-primary font-semibold'
                      : 'border-outline-variant/25 text-outline'
                      }`}
                  >
                    <span>{stage.weightedLabel}</span>
                    <span className="font-mono font-bold">
                      ${weightedAmount.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Columna Colapsada: Perdida */}
            <div className="w-12 bg-surface-container-low/60 hover:bg-surface-container-low rounded-xl p-2 flex flex-col items-center justify-between border border-outline-variant/25 cursor-pointer transition-colors group shrink-0">
              <div className="flex flex-col items-center gap-3 pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error" />
                <span className="font-mono text-xs font-semibold bg-error-container text-on-error-container px-1.5 py-0.5 rounded-full">
                  2
                </span>
              </div>
              <div className="my-auto">
                <span
                  className="text-xs font-semibold text-on-surface-variant tracking-widest uppercase"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  Perdida / Cancelada
                </span>
              </div>
              <button
                type="button"
                className="text-outline group-hover:text-on-surface p-1 cursor-pointer"
                title="Expandir columna Perdida"
              >
                <span className="material-symbols-outlined text-[18px]">
                  unfold_more
                </span>
              </button>
            </div>
          </div>

          {/* =================================================================
              TARJETA FLOTANTE EN TIEMPO REAL MIENTRAS SE ARRASTRA (SIN FANTASMA NATIVO)
              ================================================================= */}
          {draggedFolio && (() => {
            const floatingOpp = opportunities.find((o) => o.folio === draggedFolio);
            if (!floatingOpp) return null;
            const hoverStageObj = stages.find((s) => s.name === dragOverStage);
            const liveProbability = hoverStageObj?.probability ?? floatingOpp.probability;
            const liveAccent = hoverStageObj?.accentColor ?? '#1D4ED8';

            return (
              <div
                style={{
                  position: 'fixed',
                  left: `${pointerPos.x - dragOffset.x}px`,
                  top: `${pointerPos.y - dragOffset.y}px`,
                  width: `${dragCardDims.width}px`,
                  zIndex: 9999,
                  pointerEvents: 'none',
                  transform: 'rotate(-2.2deg) scale(1.035)',
                  boxShadow:
                    '0 24px 48px -12px rgba(15, 23, 42, 0.34), 0 0 0 2px rgb(var(--stitch-primary))',
                }}
                className="bg-surface-container-lowest p-4 rounded-xl flex flex-col gap-2.5 transition-transform duration-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">
                      drag_indicator
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-primary bg-primary-fixed px-2 py-0.5 rounded-md">
                      {floatingOpp.folio}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold bg-primary text-on-primary px-2 py-0.5 rounded-full">
                    → {dragOverStage} ({liveProbability}%)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-surface-container-high text-on-surface-variant shrink-0">
                    {floatingOpp.tagCode}
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant truncate">
                    {floatingOpp.client}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-primary leading-snug">
                  {floatingOpp.title}
                </h3>

                <div className="pt-1 flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-base font-bold text-on-surface">
                      {floatingOpp.amountFormatted}{' '}
                      <span className="text-[10px] font-normal text-outline">MXN</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {liveProbability}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${liveProbability}%`,
                        backgroundColor: liveAccent,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          VISTA 2: LISTA TABULAR DE ALTA DENSIDAD (STITCH)
          ===================================================================== */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-auto p-6 bg-surface flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/90 border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3 px-4 w-36">Folio</th>
                    <th className="py-3 px-3 min-w-[260px]">Oportunidad</th>
                    <th className="py-3 px-3 min-w-[180px]">Contacto / Planta</th>
                    <th className="py-3 px-3">Correo</th>
                    <th className="py-3 px-3">Teléfono</th>
                    <th className="py-3 px-3">Vendedor</th>
                    <th className="py-3 px-3 text-right">Ingreso Esperado</th>
                    <th className="py-3 px-3 text-center">Probabilidad</th>
                    <th className="py-3 px-4">Etapa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {filteredOpportunities.map((opp) => (
                    <tr
                      key={opp.folio}
                      onClick={() => openOpportunityDetail(opp.folio)}
                      className="hover:bg-primary-fixed/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-primary whitespace-nowrap">
                        {opp.folio}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {opp.title}
                          </span>
                          <span className="text-[10px] font-mono bg-surface-container-low px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant/30 shrink-0">
                            {opp.listBadge}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-on-surface">
                          {opp.contactName}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {opp.client}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-on-surface-variant">
                        {opp.email}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                        {opp.phone}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${opp.ownerAvatarClass}`}
                          >
                            {opp.ownerInitials}
                          </span>
                          <span className="font-medium text-on-surface">
                            {opp.ownerName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-on-surface whitespace-nowrap">
                        {opp.amountFormatted}{' '}
                        <span className="text-[10px] font-normal text-outline">
                          MXN
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-on-surface">
                            {opp.probability}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${opp.probability === 100
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : opp.probability >= 60
                              ? 'bg-primary-fixed text-on-primary-fixed'
                              : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {opp.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-container-low border-t-2 border-outline-variant/30 font-mono text-xs font-bold text-on-surface">
                    <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px] text-on-surface-variant">
                      Total Pipeline Filtrado ({filteredOpportunities.length} registros):
                    </td>
                    <td className="py-3 px-3 text-right text-primary text-sm">
                      $
                      {filteredOpportunities
                        .reduce((acc, o) => acc + o.amount, 0)
                        .toLocaleString('es-MX')}{' '}
                      MXN
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-left text-[11px] text-emerald-600 dark:text-emerald-400">
                      Ponderado: $
                      {Math.round(
                        filteredOpportunities.reduce(
                          (acc, o) => acc + (o.amount * o.probability) / 100,
                          0
                        )
                      ).toLocaleString('es-MX')}{' '}
                      MXN
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 3: CALENDARIO SEMANAL DE OPORTUNIDADES EN CRM (CON KANBAN/LISTA/GRÁFICA)
          ===================================================================== */}
      {viewMode === 'calendar' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {/* Sub-barra de navegación de Calendario */}
          <div className="bg-surface-container-lowest border-b border-outline-variant/25 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded-md border border-outline-variant/40 bg-surface-container-low text-xs font-semibold text-on-surface hover:bg-surface-container-high cursor-pointer"
              >
                Hoy
              </button>
              <div className="flex items-center">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <button
                  type="button"
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

            <div className="flex items-center gap-3">
              {/* Escala Día / Semana / Mes / Año */}
              <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/30 text-xs">
                {(['Día', 'Semana', 'Mes', 'Año'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setCalendarScale(sc)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${calendarScale === sc
                      ? 'bg-primary-container text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>

              {/* Badges de Sincronización Microsoft 365 */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-surface-container-low border border-outline-variant/30 px-2.5 py-1 rounded-lg text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Outlook / Teams M365</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSchedulePopover((v) => !v)}
                  className="bg-primary-container/15 text-primary hover:bg-primary-container hover:text-on-primary text-xs font-semibold px-3 py-1 rounded-lg border border-primary/30 transition-colors cursor-pointer"
                >
                  {showSchedulePopover ? 'Ocultar Popover' : '+ Programar Evento'}
                </button>
              </div>
            </div>
          </div>

          {/* Cuerpo Principal: Grid Semanal + Panel Derecho Mini Calendario */}
          <div className="flex-1 flex overflow-hidden">
            {/* Grid Semanal 7 Columnas */}
            <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">
              {/* Cabecera de Días */}
              <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-outline-variant/25 bg-surface-container-low/50 shrink-0">
                <div className="p-2 text-center font-mono text-[10px] text-outline border-r border-outline-variant/20 flex items-center justify-center">
                  GMT-6
                </div>
                {[
                  { label: 'LUN', num: '9', active: false },
                  { label: 'MAR', num: '10', active: false },
                  { label: 'MIÉ', num: '11', active: true },
                  { label: 'JUE', num: '12', active: false },
                  { label: 'VIE', num: '13', active: false },
                  { label: 'SÁB', num: '14', active: false },
                  { label: 'DOM', num: '15', active: false },
                ].map((d) => (
                  <div
                    key={d.num}
                    className={`py-2 px-3 text-center border-r border-outline-variant/20 flex flex-col items-center justify-center ${d.active ? 'bg-primary-fixed/15' : ''
                      }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${d.active ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                    >
                      {d.label}
                    </span>
                    <span
                      className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center font-mono text-sm font-bold ${d.active
                        ? 'bg-error text-on-error shadow-sm'
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

                  {/* 7 Columnas de Días */}
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                    <div
                      key={dayIdx}
                      onClick={() => setShowSchedulePopover(true)}
                      className={`relative border-r border-outline-variant/20 ${dayIdx === 2
                        ? 'bg-primary-fixed/5'
                        : dayIdx >= 5
                          ? 'bg-surface-container-low/35'
                          : ''
                        }`}
                    >
                      {/* Líneas horizontales cada hora */}
                      {Array.from({ length: 13 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-[60px] border-b border-outline-variant/15"
                        />
                      ))}

                      {/* Eventos del Día */}
                      {calendarEvents
                        .filter((ev) => ev.dayCol === dayIdx)
                        .map((ev) => {
                          const colorMap: Record<
                            CalendarEventItem['colorType'],
                            string
                          > = {
                            emerald:
                              'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-100',
                            blue: 'bg-primary-fixed/80 border-l-4 border-primary text-on-primary-fixed',
                            amber:
                              'bg-amber-500/15 border-l-4 border-amber-500 text-amber-950 dark:text-amber-100',
                            cyan: 'bg-sky-500/15 border-l-4 border-sky-500 text-sky-950 dark:text-sky-100',
                            purple:
                              'bg-indigo-500/15 border-l-4 border-indigo-500 text-indigo-950 dark:text-indigo-100',
                            rose: 'bg-rose-500/15 border-l-4 border-rose-500 text-rose-950 dark:text-rose-100',
                          };
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ev.folioBadge?.startsWith('OPP-2026')) {
                                  openOpportunityDetail(ev.folioBadge);
                                }
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
                              {ev.folioBadge && (
                                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 w-fit truncate">
                                  {ev.folioBadge}
                                </span>
                              )}
                            </div>
                          );
                        })}
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

                  {/* Popover Flotante: Programar Evento Comercial */}
                  {showSchedulePopover && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-1/2 top-24 -translate-x-1/2 w-[360px] bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-2xl z-30 p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-outline-variant/25 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-primary">
                            event_available
                          </span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                            Programar Evento Comercial
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSchedulePopover(false)}
                          className="text-outline hover:text-on-surface cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            close
                          </span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                          Título de la Actividad
                        </label>
                        <input
                          type="text"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface font-medium focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                            Fecha
                          </label>
                          <div className="text-xs font-mono bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface">
                            Jue 12 Nov 2026
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                            Horario
                          </label>
                          <div className="text-xs font-mono bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface">
                            13:30 - 15:00
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-on-surface-variant">
                          Oportunidad Vinculada
                        </label>
                        <input
                          type="text"
                          value={newEventFolio}
                          onChange={(e) => setNewEventFolio(e.target.value)}
                          className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-primary font-semibold focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/25">
                        <button
                          type="button"
                          onClick={() => setShowSchedulePopover(false)}
                          className="text-xs text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCalendarEvent}
                          className="bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Derecho de Calendario (Mini Mes + Filtros de Calendarios) */}
            <aside className="w-72 border-l border-outline-variant/25 bg-surface-container-lowest p-4 hidden xl:flex flex-col gap-5 shrink-0 overflow-y-auto">
              {/* Mini Mes Noviembre 2026 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface">
                    Noviembre 2026
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-pointer">
                      chevron_left
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-pointer">
                      chevron_right
                    </span>
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
                    <span
                      key={day}
                      className={`py-1 rounded-full cursor-pointer ${day === 11
                        ? 'bg-error text-on-error font-bold'
                        : day >= 9 && day <= 15
                          ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                          : 'text-on-surface hover:bg-surface-container-high'
                        }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mis Calendarios */}
              <div className="flex flex-col gap-2 border-t border-outline-variant/25 pt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Mis Calendarios
                </h4>
                {[
                  { label: 'Levantamientos en Sitio', color: 'bg-emerald-500' },
                  { label: 'Reuniones Técnicas DTI', color: 'bg-primary' },
                  { label: 'Auditorías NFPA / UL', color: 'bg-amber-500' },
                  { label: 'Llamadas de Seguimiento', color: 'bg-sky-500' },
                  { label: 'Cierres de Licitación', color: 'bg-rose-500' },
                ].map((cal) => (
                  <label
                    key={cal.label}
                    className="flex items-center gap-2 text-xs text-on-surface cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className={`w-2.5 h-2.5 rounded-full ${cal.color}`} />
                    <span>{cal.label}</span>
                  </label>
                ))}
              </div>

              {/* Próximo Compromiso */}
              <div className="mt-auto bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-primary">
                    Próximo Compromiso
                  </span>
                  <span className="font-mono text-[10px] text-error font-semibold">
                    En 15 min
                  </span>
                </div>
                <p className="text-xs font-semibold text-on-surface">
                  Revisión DTI Gas &amp; Fuego – Planta Minatitlán
                </p>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  OPP-2026-105 • Ing. Fernando Silva
                </span>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 4: VISTA GRÁFICA (BARRAS / LÍNEA / PASTEL + 7 MEDIDAS STITCH)
          ===================================================================== */}
      {viewMode === 'graph' && (
        <div className="flex-1 overflow-auto p-6 bg-surface flex flex-col gap-5">
          {/* Toolbar de Controles de Gráfica */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dropdown Medidas (7 medidas SIFYGSA) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMeasureDropdownOpen((v) => !v)}
                  className="bg-primary-container text-on-primary text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    straighten
                  </span>
                  <span>Medidas: {graphMeasure}</span>
                  <span className="material-symbols-outlined text-[16px]">
                    expand_more
                  </span>
                </button>
                {measureDropdownOpen && (
                  <div className="absolute left-0 top-11 w-56 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xl py-1.5 z-40 text-xs">
                    {GRAPH_MEASURES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setGraphMeasure(m);
                          setMeasureDropdownOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-surface-container-low flex items-center justify-between text-on-surface cursor-pointer"
                      >
                        <span
                          className={
                            graphMeasure === m ? 'font-bold text-primary' : ''
                          }
                        >
                          {m}
                        </span>
                        {graphMeasure === m && (
                          <span className="text-primary font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector de Tipo de Gráfica: Barras | Línea | Pastel */}
              <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setGraphType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${graphType === 'bar'
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    bar_chart
                  </span>
                  <span>Barras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGraphType('line')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${graphType === 'line'
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    show_chart
                  </span>
                  <span>Línea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGraphType('pie')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${graphType === 'pie'
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    pie_chart
                  </span>
                  <span>Pastel</span>
                </button>
              </div>

              {/* Toggles Contextuales: Apilado / Acumulativo / Orden */}
              {graphType !== 'pie' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsStacked((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${isStacked
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary/30 font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                      }`}
                  >
                    Apilado
                  </button>
                  {graphType === 'line' && (
                    <button
                      type="button"
                      onClick={() => setIsCumulative((v) => !v)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${isCumulative
                        ? 'bg-primary-fixed text-on-primary-fixed border-primary/30 font-semibold'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                        }`}
                    >
                      Acumulativo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))
                    }
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant border border-outline-variant/30 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {sortOrder === 'desc' ? 'south' : 'north'}
                    </span>
                    <span>{sortOrder === 'desc' ? 'Desc' : 'Asc'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Botón Insertar en hoja de cálculo */}
            <button
              type="button"
              className="bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs font-semibold px-3.5 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                table_view
              </span>
              <span>Insertar en hoja de cálculo (.xlsx)</span>
            </button>
          </div>

          {/* Lienzo Principal de Gráfica */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-sm flex-1 flex flex-col justify-between min-h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  {graphMeasure} por Etapa Comercial — Pipeline SIFYGSA Q4-2026
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Distribución financiera de proyectos Fire &amp; Gas en moneda nacional (MXN)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-primary" />
                  <span>Directo EPC ($48.2M)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-secondary" />
                  <span>Suministro &amp; Pólizas ($22.3M)</span>
                </span>
              </div>
            </div>

            {/* MODO BARRAS */}
            {graphType === 'bar' && (
              <div className="flex-1 flex items-end justify-around gap-6 pt-8 pb-4 px-6 border-b border-outline-variant/25">
                {stages.map((st) => {
                  const stageOpps = filteredOpportunities.filter(
                    (o) => o.stage === st.name
                  );
                  const sum = stageOpps.reduce((a, b) => a + b.amount, 0);
                  const heightPct = Math.min(
                    95,
                    Math.max(18, Math.round((sum / 28750000) * 100))
                  );
                  return (
                    <div
                      key={st.id}
                      className="flex-1 flex flex-col items-center gap-2 max-w-[140px]"
                    >
                      <span className="font-mono text-xs font-bold text-on-surface">
                        ${(sum / 1000000).toFixed(2)}M
                      </span>
                      <div className="w-full h-56 bg-surface-container-low rounded-t-lg flex flex-col justify-end overflow-hidden p-1">
                        {isStacked && (
                          <div
                            className="w-full bg-secondary rounded-t-md transition-all"
                            style={{ height: `${Math.round(heightPct * 0.35)}%` }}
                          />
                        )}
                        <div
                          className="w-full bg-primary rounded-b-md transition-all"
                          style={{
                            height: `${isStacked ? Math.round(heightPct * 0.65) : heightPct
                              }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-on-surface text-center leading-tight">
                        {st.name}
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {stageOpps.length} oport. ({st.probability}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODO LÍNEA */}
            {graphType === 'line' && (
              <div className="flex-1 flex flex-col justify-center items-center py-4">
                <svg viewBox="0 0 700 240" className="w-full max-w-4xl h-64">
                  <defs>
                    <linearGradient id="stitchLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 60 190 L 210 145 L 360 95 L 510 115 L 650 35 L 650 215 L 60 215 Z"
                    fill="url(#stitchLineGrad)"
                  />
                  <path
                    d="M 60 190 L 210 145 L 360 95 L 510 115 L 650 35"
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="3.5"
                  />
                  {[
                    { x: 60, y: 190, label: 'Prospección ($4.85M)' },
                    { x: 210, y: 145, label: 'Calificación ($8.92M)' },
                    { x: 360, y: 95, label: 'Propuesta ($15.64M)' },
                    { x: 510, y: 115, label: 'Negociación ($12.40M)' },
                    { x: 650, y: 35, label: 'Ganada ($28.75M)' },
                  ].map((pt) => (
                    <g key={pt.label}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        fill="#1D4ED8"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        className="fill-current text-[10px] font-mono font-bold"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            {/* MODO PASTEL / DONA */}
            {graphType === 'pie' && (
              <div className="flex-1 flex flex-wrap items-center justify-center gap-12 py-4">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="3.8"
                      strokeDasharray="41 59"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#1D4ED8"
                      strokeWidth="3.8"
                      strokeDasharray="22 78"
                      strokeDashoffset="-41"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="3.8"
                      strokeDasharray="18 82"
                      strokeDashoffset="-63"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#0EA5E9"
                      strokeWidth="3.8"
                      strokeDasharray="19 81"
                      strokeDashoffset="-81"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      Pipeline Total
                    </span>
                    <span className="font-mono text-lg font-bold text-on-surface">
                      $70.56M
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 font-semibold">
                      MXN
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  {stages.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-8 border-b border-outline-variant/20 pb-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.accentColor }}
                        />
                        <span className="font-semibold text-on-surface">
                          {st.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-on-surface">
                        {st.totalFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen Inferior */}
            <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <div className="text-[11px] text-on-surface-variant">
                  Pipeline Total Activo
                </div>
                <div className="font-mono text-base font-bold text-on-surface">
                  $70,560,000 MXN
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <div className="text-[11px] text-on-surface-variant">
                  Ingreso Ponderado Esperado
                </div>
                <div className="font-mono text-base font-bold text-primary">
                  $51,661,000 MXN
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <div className="text-[11px] text-on-surface-variant">
                  Tasa de Conversión Q4
                </div>
                <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  34.8% (+4.2%)
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <div className="text-[11px] text-on-surface-variant">
                  Ciclo Promedio de Cierre
                </div>
                <div className="font-mono text-base font-bold text-on-surface">
                  42 días
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 5: TABLA DINÁMICA (PIVOT)
          ===================================================================== */}
      {viewMode === 'pivot' && (
        <div className="flex-1 overflow-auto p-6 bg-surface">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  Tabla Dinámica Multidimensional (Pivot) — SIFYGSA CRM
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Cruce de Vendedor × Etapa del Pipeline (Ingreso Esperado MXN)
                </p>
              </div>
              <span className="font-mono text-xs bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg font-semibold">
                Medida activa: Ingreso Esperado (MXN)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-outline-variant/30">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-bold uppercase text-[11px]">
                    <th className="p-3 text-left border border-outline-variant/30">
                      Vendedor / Etapa
                    </th>
                    {stages.map((s) => (
                      <th
                        key={s.id}
                        className="p-3 text-right border border-outline-variant/30"
                      >
                        {s.name}
                      </th>
                    ))}
                    <th className="p-3 text-right border border-outline-variant/30 bg-primary-fixed/40 text-primary">
                      Total Vendedor
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {[
                    'Ing. Carlos Rodríguez',
                    'Ing. Manuel Valdez',
                    'Ing. Jorge Garza',
                  ].map((seller) => {
                    const sellerTotal = filteredOpportunities
                      .filter((o) =>
                        o.ownerName
                          .toLowerCase()
                          .includes(seller.split(' ')[1].toLowerCase())
                      )
                      .reduce((a, b) => a + b.amount, 0);
                    return (
                      <tr
                        key={seller}
                        className="border-b border-outline-variant/25 hover:bg-surface-container-low/60"
                      >
                        <td className="p-3 font-sans font-semibold text-on-surface border border-outline-variant/25">
                          {seller}
                        </td>
                        {stages.map((st) => {
                          const cellSum = filteredOpportunities
                            .filter(
                              (o) =>
                                o.stage === st.name &&
                                o.ownerName
                                  .toLowerCase()
                                  .includes(seller.split(' ')[1].toLowerCase())
                            )
                            .reduce((a, b) => a + b.amount, 0);
                          return (
                            <td
                              key={st.id}
                              className="p-3 text-right border border-outline-variant/25 text-on-surface"
                            >
                              {cellSum > 0
                                ? `$${cellSum.toLocaleString('es-MX')}`
                                : '—'}
                            </td>
                          );
                        })}
                        <td className="p-3 text-right font-bold text-primary bg-primary-fixed/15 border border-outline-variant/25">
                          ${sellerTotal.toLocaleString('es-MX')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 6: MAPA GEOLOCALIZADO DE PROYECTOS INDUSTRIALES
          ===================================================================== */}
      {viewMode === 'map' && (
        <div className="flex-1 overflow-auto p-6 bg-surface flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-surface-container-low rounded-xl border border-outline-variant/30 p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <div>
                  <span className="text-[11px] font-mono uppercase font-bold text-primary">
                    Cobertura Nacional Fire &amp; Gas
                  </span>
                  <h3 className="text-base font-bold text-on-surface">
                    Corredor Energético Golfo – Istmo – Noreste
                  </h3>
                </div>
                <span className="font-mono text-xs bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/30">
                  10 Instalaciones Activas
                </span>
              </div>

              <div className="my-auto grid grid-cols-2 sm:grid-cols-3 gap-3 z-10 py-4">
                {[
                  {
                    site: 'Refinería Dos Bocas',
                    loc: 'Paraíso, TAB (18.42° N, -93.19° W)',
                    folio: 'OPP-2026-041',
                    amount: '$1.45M MXN',
                  },
                  {
                    site: 'Complejo Cactus',
                    loc: 'Reforma, CHIS (17.85° N, -93.16° W)',
                    folio: 'OPP-2026-088',
                    amount: '$5.22M MXN',
                  },
                  {
                    site: 'Refinería Minatitlán',
                    loc: 'Minatitlán, VER (17.99° N, -94.54° W)',
                    folio: 'OPP-2026-105',
                    amount: '$6.80M MXN',
                  },
                  {
                    site: 'Sonda de Campeche Akal-J',
                    loc: 'Cd. del Carmen, CAM (19.40° N, -92.05° W)',
                    folio: 'OPP-2026-003',
                    amount: '$16.25M MXN',
                  },
                  {
                    site: 'Ternium Pesquería',
                    loc: 'Monterrey, NL (25.78° N, -100.05° W)',
                    folio: 'OPP-2026-092',
                    amount: '$3.70M MXN',
                  },
                  {
                    site: 'Terminal Pemex Tula',
                    loc: 'Tula de Allende, HGO (20.05° N, -99.34° W)',
                    folio: 'OPP-2026-074',
                    amount: '$4.54M MXN',
                  },
                ].map((pin) => (
                  <div
                    key={pin.folio}
                    onClick={() => openOpportunityDetail(pin.folio)}
                    className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 shadow-sm hover:border-primary cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-primary">
                        {pin.folio}
                      </span>
                      <span className="material-symbols-outlined text-[15px] text-error">
                        location_on
                      </span>
                    </div>
                    <div className="text-xs font-bold text-on-surface mt-1">
                      {pin.site}
                    </div>
                    <div className="font-mono text-[10px] text-on-surface-variant">
                      {pin.loc}
                    </div>
                    <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      {pin.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Oportunidades por Zona Operativa
              </h4>
              {[
                { zone: 'Zona Marina (Campeche / Dos Bocas)', sum: '$25,800,000 MXN', count: 3 },
                { zone: 'Corredor Istmo (Minatitlán / Salina Cruz)', sum: '$14,500,000 MXN', count: 3 },
                { zone: 'Zona Norte (Monterrey / Altamira)', sum: '$16,200,000 MXN', count: 2 },
                { zone: 'Zona Centro (Tula / Bajío)', sum: '$14,060,000 MXN', count: 2 },
              ].map((z) => (
                <div
                  key={z.zone}
                  className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/25 flex flex-col gap-1"
                >
                  <span className="text-xs font-semibold text-on-surface">
                    {z.zone}
                  </span>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">
                      {z.count} proyectos
                    </span>
                    <span className="font-bold text-primary">{z.sum}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 7: MATRIZ DE ACTIVIDADES E INICIATIVAS (LEADS)
          ===================================================================== */}
      {(viewMode === 'activities' || viewMode === 'leads') && (
        <div className="flex-1 overflow-auto p-6 bg-surface">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  {viewMode === 'leads'
                    ? 'Iniciativas y Prospectos Industriales (Leads)'
                    : 'Matriz de Actividades Comerciales (Llamada, Correo, Reunión, Levantamiento)'}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Haz clic en cualquier registro para abrir su ficha técnica 360° y el Chatter
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchView('kanban')}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Volver al Kanban →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-outline-variant/25">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-bold uppercase text-[11px]">
                    <th className="p-3 text-left border border-outline-variant/25">
                      Oportunidad / Cliente
                    </th>
                    <th className="p-3 text-center border border-outline-variant/25">
                      Llamada
                    </th>
                    <th className="p-3 text-center border border-outline-variant/25">
                      Correo / Cotización
                    </th>
                    <th className="p-3 text-center border border-outline-variant/25">
                      Reunión DTI
                    </th>
                    <th className="p-3 text-center border border-outline-variant/25">
                      Levantamiento en Planta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => (
                    <tr
                      key={opp.folio}
                      onClick={() => openOpportunityDetail(opp.folio)}
                      className="border-b border-outline-variant/20 hover:bg-surface-container-low/60 cursor-pointer"
                    >
                      <td className="p-3 border border-outline-variant/20">
                        <div className="font-mono text-[11px] font-bold text-primary">
                          {opp.folio}
                        </div>
                        <div className="font-semibold text-on-surface">
                          {opp.title}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {opp.client}
                        </div>
                      </td>
                      <td className="p-3 text-center border border-outline-variant/20 font-mono text-[11px]">
                        <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          Completada
                        </span>
                      </td>
                      <td className="p-3 text-center border border-outline-variant/20 font-mono text-[11px]">
                        <span className="px-2 py-1 rounded bg-primary-fixed text-on-primary-fixed">
                          Enviada
                        </span>
                      </td>
                      <td className="p-3 text-center border border-outline-variant/20 font-mono text-[11px]">
                        <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          {opp.expectedClose}
                        </span>
                      </td>
                      <td className="p-3 text-center border border-outline-variant/20 font-mono text-[11px]">
                        <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface-variant">
                          {opp.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 8: DETALLE DE OPORTUNIDAD 60% / 40% + CHATTER (STITCH)
          ===================================================================== */}
      {viewMode === 'detail' && selectedOpportunity && (
        <div className="flex-1 flex flex-col overflow-auto bg-surface">
          {/* Sub-Header de Ficha Técnica: Breadcrumb + Smart Buttons + Barra de Etapas Clickable */}
          <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-3 flex flex-col gap-3">
            {/* Top row: Breadcrumb & Smart Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => switchView('kanban')}
                  className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_back
                  </span>
                  <span>Oportunidades</span>
                </button>
                <span className="text-outline">/</span>
                <span className="font-mono font-bold text-on-surface">
                  {selectedOpportunity.folio}
                </span>
                <span className="text-on-surface-variant truncate max-w-md">
                  {selectedOpportunity.title}
                </span>
              </div>

              {/* Smart Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchView('calendar')}
                  className="bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    calendar_month
                  </span>
                  <div className="text-left leading-tight">
                    <div className="font-bold text-on-surface">2 Reuniones</div>
                    <div className="text-[10px] text-on-surface-variant">
                      Calendario
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-500">
                    star
                  </span>
                  <div className="text-left leading-tight">
                    <div className="font-bold text-on-surface">
                      Lead similar 1
                    </div>
                    <div className="text-[10px] text-on-surface-variant">
                      Coincidencia IA
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    attach_file
                  </span>
                  <div className="text-left leading-tight">
                    <div className="font-bold text-on-surface">
                      Documentos 3
                    </div>
                    <div className="text-[10px] text-on-surface-variant">
                      DTI &amp; Bases
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom row: Ganado / Enriquecer / Perdido + Barra de Etapas Clickable */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateSelectedOpportunityField(
                      {
                        stage: 'Ganada / Adjudicada',
                        probability: 100,
                        wonBadge: 'ADJUDICADA',
                        statusType: 'won',
                        statusText: 'Adjudicada hoy',
                      },
                      'Etapa del Pipeline',
                      `${selectedOpportunity.stage} (${selectedOpportunity.probability}%)`,
                      'Ganada / Adjudicada (100%)',
                      'movement'
                    );
                    setEditDraftProb('100');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  Ganado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    recordAuditMovement(selectedOpportunity.folio, {
                      kind: 'modification',
                      title: 'Enriquecimiento Técnico de Datos',
                      fieldLabel: 'Validación Corporativa',
                      oldValue: 'Datos base',
                      newValue: `Verificado (${selectedOpportunity.client})`,
                      text: 'Ejecutó enriquecimiento de datos corporativos y validación de dominio del cliente.',
                    });
                  }}
                  className="bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    auto_awesome
                  </span>
                  <span>Enriquecer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSelectedOpportunityField(
                      {
                        probability: 0,
                        statusType: 'overdue',
                        statusText: 'Marcada como Perdida',
                      },
                      'Estado de Oportunidad',
                      `${selectedOpportunity.stage} (${selectedOpportunity.probability}%)`,
                      'Perdida / Descartada (0%)',
                      'movement'
                    );
                    setEditDraftProb('0');
                  }}
                  className="bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-semibold text-xs px-3.5 py-1.5 rounded-lg border border-outline-variant/30 cursor-pointer"
                >
                  Perdido
                </button>
              </div>

              {/* Pipeline Status Stepper */}
              <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant/30 overflow-x-auto">
                {stages.map((st) => {
                  const isCurrent = selectedOpportunity.stage === st.name;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        updateSelectedOpportunityField(
                          {
                            stage: st.name,
                            probability: st.probability,
                          },
                          'Etapa del Pipeline',
                          `${selectedOpportunity.stage} (${selectedOpportunity.probability}%)`,
                          `${st.name} (${st.probability}%)`,
                          'movement'
                        );
                        setEditDraftProb(String(st.probability));
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${isCurrent
                        ? 'bg-primary-container text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                      <span>{st.name}</span>
                      {isCurrent && (
                        <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.2 rounded">
                          Activa
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cuerpo Dividido: 60% Hoja de Formulario Editable en Todo Momento | 40% Checador de Movimientos y Bitácora */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
            {/* Columna Izquierda (7 cols ~ 60%): Hoja de Oportunidad 100% Editable en Tiempo Real */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 flex flex-col gap-6">
              {/* Título, Prioridad y Métricas Principales (Editables en todo momento) */}
              <div className="flex flex-col gap-4 border-b border-outline-variant/25 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary-fixed px-2.5 py-0.5 rounded">
                      {selectedOpportunity.folio}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Edición activa • Auditable
                    </span>
                  </div>

                  {/* Estrellas de Prioridad Clickables */}
                  <div className="flex items-center gap-1 text-amber-400" title="Cambiar prioridad de la oportunidad">
                    {[1, 2, 3].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          if (selectedOpportunity.stars === s) return;
                          updateSelectedOpportunityField(
                            { stars: s as 1 | 2 | 3 },
                            'Prioridad Comercial',
                            `${'★'.repeat(selectedOpportunity.stars)}${'☆'.repeat(3 - selectedOpportunity.stars)} (${selectedOpportunity.stars}/3)`,
                            `${'★'.repeat(s)}${'☆'.repeat(3 - s)} (${s}/3)`
                          );
                        }}
                        className="hover:scale-110 transition-transform cursor-pointer"
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{
                            fontVariationSettings:
                              s <= selectedOpportunity.stars
                                ? "'FILL' 1"
                                : "'FILL' 0",
                          }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título de la oportunidad editable en todo momento */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Título / Nombre de la Oportunidad (Editable)
                  </label>
                  <input
                    type="text"
                    value={editDraftTitle}
                    onChange={(e) => setEditDraftTitle(e.target.value)}
                    onBlur={() => {
                      const clean = editDraftTitle.trim();
                      if (clean && clean !== selectedOpportunity.title) {
                        updateSelectedOpportunityField(
                          { title: clean },
                          'Título de la Oportunidad',
                          selectedOpportunity.title,
                          clean
                        );
                      } else {
                        setEditDraftTitle(selectedOpportunity.title);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="text-lg font-bold text-on-surface bg-surface-container-low/60 hover:bg-surface-container-low focus:bg-surface-container-lowest border border-transparent hover:border-outline-variant/40 focus:border-primary rounded-lg px-3 py-1.5 transition-all focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Ingreso Esperado Editable */}
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/25 focus-within:border-primary transition-colors">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                      <span>Ingreso Esperado</span>
                      <span className="material-symbols-outlined text-[13px] text-outline">edit</span>
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-mono text-2xl font-bold text-on-surface">$</span>
                      <input
                        type="text"
                        value={editDraftAmount}
                        onChange={(e) => setEditDraftAmount(e.target.value)}
                        onBlur={() => {
                          const numeric =
                            parseInt(editDraftAmount.replace(/[^0-9]/g, ''), 10) ||
                            selectedOpportunity.amount;
                          const formatted = `$${numeric.toLocaleString('es-MX')}`;
                          setEditDraftAmount(numeric.toLocaleString('es-MX'));
                          if (numeric !== selectedOpportunity.amount) {
                            updateSelectedOpportunityField(
                              { amount: numeric, amountFormatted: formatted },
                              'Ingreso Esperado',
                              `${selectedOpportunity.amountFormatted} MXN`,
                              `${formatted} MXN`
                            );
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-full font-mono text-2xl font-bold text-on-surface bg-transparent border-b border-dashed border-outline-variant/50 focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs font-mono text-outline shrink-0">
                        MXN
                      </span>
                    </div>
                  </div>

                  {/* Probabilidad de Éxito Editable */}
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/25 focus-within:border-primary transition-colors">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span>Probabilidad de Éxito</span>
                        <span className="material-symbols-outlined text-[14px] text-amber-500">
                          auto_awesome
                        </span>
                      </span>
                      <span className="material-symbols-outlined text-[13px] text-outline">edit</span>
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-mono text-lg font-bold text-primary">en</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editDraftProb}
                        onChange={(e) => setEditDraftProb(e.target.value)}
                        onBlur={() => {
                          const num = Math.min(
                            100,
                            Math.max(0, parseInt(editDraftProb, 10) || 0)
                          );
                          setEditDraftProb(String(num));
                          if (num !== selectedOpportunity.probability) {
                            updateSelectedOpportunityField(
                              { probability: num },
                              'Probabilidad de Éxito',
                              `${selectedOpportunity.probability}.00 %`,
                              `${num}.00 %`
                            );
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-24 font-mono text-2xl font-bold text-primary bg-transparent border-b border-dashed border-primary/40 focus:border-primary focus:outline-none"
                      />
                      <span className="font-mono text-xl font-bold text-primary">.00 %</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos en 2 Columnas (Todos Editables en Todo Momento) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Contacto / Cliente Industrial Editable + Selector de Clientes Registrados */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-semibold flex items-center justify-between">
                    <span>Contacto / Cliente Industrial</span>
                    <button
                      type="button"
                      onClick={() => handleOpenNewClientModal('')}
                      className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      + Nuevo cliente
                    </button>
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <select
                      aria-label="Seleccionar cliente registrado"
                      value={selectedOpportunity.client}
                      onChange={(e) => {
                        const chosen = registeredClients.find(
                          (c) => c.companyName === e.target.value
                        );
                        if (chosen) {
                          const prevLabel = `${selectedOpportunity.contactName} — ${selectedOpportunity.client}`;
                          const nextLabel = `${chosen.contactName} — ${chosen.companyName}`;
                          setEditDraftContact(chosen.contactName);
                          setEditDraftEmail(chosen.email);
                          setEditDraftPhone(chosen.phone);
                          updateSelectedOpportunityField(
                            {
                              client: chosen.companyName,
                              contactName: chosen.contactName,
                              tagCode: chosen.tagCode,
                              email: chosen.email,
                              phone: chosen.phone,
                            },
                            'Contacto / Cliente Industrial',
                            prevLabel,
                            nextLabel
                          );
                        }
                      }}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    >
                      {!registeredClients.some(
                        (c) => c.companyName === selectedOpportunity.client
                      ) && (
                          <option value={selectedOpportunity.client}>
                            {selectedOpportunity.client}
                          </option>
                        )}
                      {registeredClients.map((c) => (
                        <option key={c.id} value={c.companyName}>
                          {c.contactName} — {c.companyName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editDraftContact}
                      onChange={(e) => setEditDraftContact(e.target.value)}
                      onBlur={() => {
                        const clean = editDraftContact.trim();
                        if (clean && clean !== selectedOpportunity.contactName) {
                          updateSelectedOpportunityField(
                            { contactName: clean },
                            'Nombre del Contacto',
                            selectedOpportunity.contactName,
                            clean
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      placeholder="Nombre del contacto..."
                      className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-1.5 font-medium text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Vendedor Asignado Editable */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-semibold">
                    Vendedor Asignado
                  </label>
                  <div className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 flex items-center gap-2 focus-within:border-primary">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${selectedOpportunity.ownerAvatarClass}`}
                    >
                      {selectedOpportunity.ownerInitials}
                    </span>
                    <select
                      aria-label="Vendedor Asignado"
                      value={selectedOpportunity.ownerName}
                      onChange={(e) => {
                        const sellers = [
                          {
                            name: 'Ing. Carlos Rodríguez',
                            initials: 'CR',
                            cls: 'bg-primary-container text-on-primary',
                          },
                          {
                            name: 'Ing. Manuel Valdez',
                            initials: 'MV',
                            cls: 'bg-secondary text-on-secondary',
                          },
                          {
                            name: 'Ing. Jorge Garza',
                            initials: 'JG',
                            cls: 'bg-tertiary-container text-on-tertiary',
                          },
                          {
                            name: 'Dra. Elena Alarcón',
                            initials: 'EA',
                            cls: 'bg-amber-600 text-white',
                          },
                        ];
                        const picked =
                          sellers.find((s) => s.name === e.target.value) || sellers[0];
                        updateSelectedOpportunityField(
                          {
                            ownerName: picked.name,
                            ownerInitials: picked.initials,
                            ownerAvatarClass: picked.cls,
                          },
                          'Vendedor Asignado',
                          selectedOpportunity.ownerName,
                          picked.name
                        );
                      }}
                      className="w-full bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer"
                    >
                      <option value="Ing. Carlos Rodríguez">Ing. Carlos Rodríguez</option>
                      <option value="Ing. Manuel Valdez">Ing. Manuel Valdez</option>
                      <option value="Ing. Jorge Garza">Ing. Jorge Garza</option>
                      <option value="Dra. Elena Alarcón">Dra. Elena Alarcón</option>
                    </select>
                  </div>
                </div>

                {/* Correo Electrónico Editable */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-semibold">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editDraftEmail}
                    onChange={(e) => setEditDraftEmail(e.target.value)}
                    onBlur={() => {
                      const clean = editDraftEmail.trim();
                      if (clean && clean !== selectedOpportunity.email) {
                        updateSelectedOpportunityField(
                          { email: clean },
                          'Correo Electrónico',
                          selectedOpportunity.email,
                          clean
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-3 py-2 font-mono text-on-surface focus:outline-none"
                  />
                </div>

                {/* Cierre Esperado Editable */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-semibold">
                    Cierre Esperado
                  </label>
                  <input
                    type="text"
                    value={editDraftClose}
                    onChange={(e) => setEditDraftClose(e.target.value)}
                    onBlur={() => {
                      const clean = editDraftClose.trim();
                      if (clean && clean !== selectedOpportunity.expectedClose) {
                        updateSelectedOpportunityField(
                          { expectedClose: clean },
                          'Fecha de Cierre Esperado',
                          selectedOpportunity.expectedClose,
                          clean
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    placeholder="Ej. 15 Nov 2026"
                    className="bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-3 py-2 font-mono text-on-surface focus:outline-none"
                  />
                </div>

                {/* Teléfono Editable */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-semibold">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editDraftPhone}
                    onChange={(e) => setEditDraftPhone(e.target.value)}
                    onBlur={() => {
                      const clean = editDraftPhone.trim();
                      if (clean && clean !== selectedOpportunity.phone) {
                        updateSelectedOpportunityField(
                          { phone: clean },
                          'Teléfono de Contacto',
                          selectedOpportunity.phone,
                          clean
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-3 py-2 font-mono text-on-surface focus:outline-none"
                  />
                </div>

                {/* Etiquetas Técnicas Editables (Agregar / Quitar) */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-semibold flex items-center justify-between">
                    <span>Etiquetas Técnicas</span>
                    <button
                      type="button"
                      onClick={() => setShowAddTagInput((v) => !v)}
                      className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      + Agregar etiqueta
                    </button>
                  </label>
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 min-h-[36px]">
                    {selectedOpportunity.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[10px] font-mono bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-semibold"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextTags = selectedOpportunity.tags.filter((x) => x !== t);
                            updateSelectedOpportunityField(
                              { tags: nextTags },
                              'Etiquetas Técnicas',
                              selectedOpportunity.tags.join(', '),
                              nextTags.join(', ') || 'Sin etiquetas'
                            );
                          }}
                          className="hover:text-error font-bold cursor-pointer"
                          title={`Quitar etiqueta ${t}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {showAddTagInput && (
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const clean = newTagInput.trim();
                            if (clean && !selectedOpportunity.tags.includes(clean)) {
                              const nextTags = [...selectedOpportunity.tags, clean];
                              updateSelectedOpportunityField(
                                { tags: nextTags },
                                'Etiquetas Técnicas',
                                selectedOpportunity.tags.join(', '),
                                nextTags.join(', ')
                              );
                            }
                            setNewTagInput('');
                            setShowAddTagInput(false);
                          }
                        }}
                        placeholder="Nueva tag + Enter"
                        autoFocus
                        className="text-[11px] font-mono bg-surface-container-lowest border border-primary/50 rounded px-2 py-0.5 text-on-surface focus:outline-none w-28"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Pestañas Inferiores: Notas Internas (Editable) | Información Adicional (Editable) | Archivos Adjuntos */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between border-b border-outline-variant/25 text-xs">
                  <div className="flex items-center gap-4">
                    {[
                      { id: 'notas', label: 'Notas Internas' },
                      { id: 'info', label: 'Información adicional' },
                      { id: 'lead', label: 'Archivos adjuntos (3)' },
                    ].map((tb) => (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() =>
                          setDetailTab(tb.id as 'notas' | 'info' | 'lead')
                        }
                        className={`pb-2 font-semibold transition-colors cursor-pointer ${detailTab === tb.id
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                </div>

                {detailTab === 'notas' && (
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/25 text-xs text-on-surface leading-relaxed flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        Alcance Técnico y Especificaciones (Editable):
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (editDraftNotes.trim() !== selectedOpportunity.notes.trim()) {
                            updateSelectedOpportunityField(
                              { notes: editDraftNotes.trim() },
                              'Notas Internas / Alcance Técnico',
                              selectedOpportunity.notes,
                              editDraftNotes.trim()
                            );
                          }
                        }}
                        className="text-[11px] font-semibold bg-primary-container text-on-primary px-2.5 py-1 rounded-md cursor-pointer"
                      >
                        Guardar nota técnica
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={editDraftNotes}
                      onChange={(e) => setEditDraftNotes(e.target.value)}
                      onBlur={() => {
                        if (editDraftNotes.trim() !== selectedOpportunity.notes.trim()) {
                          updateSelectedOpportunityField(
                            { notes: editDraftNotes.trim() },
                            'Notas Internas / Alcance Técnico',
                            selectedOpportunity.notes,
                            editDraftNotes.trim()
                          );
                        }
                      }}
                      className="w-full bg-surface-container-lowest border border-outline-variant/35 rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary resize-y"
                    />
                  </div>
                )}

                {detailTab === 'info' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-container-low p-4 rounded-xl border border-outline-variant/25">
                    <div className="flex flex-col gap-1">
                      <span className="text-on-surface-variant font-semibold">
                        Equipo de Ventas:
                      </span>
                      <input
                        type="text"
                        value={detailTeamName}
                        onChange={(e) => setDetailTeamName(e.target.value)}
                        onBlur={() => {
                          recordAuditMovement(selectedOpportunity.folio, {
                            kind: 'modification',
                            title: 'Modificación de Equipo de Ventas',
                            fieldLabel: 'Equipo de Ventas',
                            oldValue: 'Ingeniería Fire & Gas Golfo-Sur',
                            newValue: detailTeamName,
                            text: 'Actualizó la asignación del equipo técnico comercial.',
                          });
                        }}
                        className="bg-surface-container-lowest border border-outline-variant/35 rounded-lg px-2.5 py-1.5 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-on-surface-variant font-semibold">
                        Campaña / Origen:
                      </span>
                      <input
                        type="text"
                        value={detailCampaignName}
                        onChange={(e) => setDetailCampaignName(e.target.value)}
                        onBlur={() => {
                          recordAuditMovement(selectedOpportunity.folio, {
                            kind: 'modification',
                            title: 'Modificación de Campaña / Origen',
                            fieldLabel: 'Origen Comercial',
                            oldValue: 'Licitación Industrial Pemex / CFE',
                            newValue: detailCampaignName,
                            text: 'Actualizó el origen comercial de la oportunidad.',
                          });
                        }}
                        className="bg-surface-container-lowest border border-outline-variant/35 rounded-lg px-2.5 py-1.5 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {detailTab === 'lead' && (
                  <div className="flex flex-col gap-2 text-xs bg-surface-container-low p-4 rounded-xl border border-outline-variant/25">
                    <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                      <span className="font-mono">
                        DTI-Gas-Fuego-RevB.pdf
                      </span>
                      <span className="text-primary font-semibold">2.4 MB</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-mono">
                        Matriz-Causa-Efecto-SIL2.xlsx
                      </span>
                      <span className="text-primary font-semibold">840 KB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha (5 cols ~ 40%): Checador de Movimientos, Quién Movió/Modificó y Chatter */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col gap-4">
              {/* Cabecera del Checador de Movimientos */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/25 pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setChatterTab('movimientos');
                      setChatterFilter('movimientos');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${chatterTab === 'movimientos'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">history</span>
                    <span>Checador de Movimientos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatterTab('nota');
                      setChatterFilter('todos');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${chatterTab === 'nota'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                  >
                    Registrar nota
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatterTab('mensaje');
                      setChatterFilter('todos');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${chatterTab === 'mensaje'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                  >
                    Mensaje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatterTab('actividad');
                      setChatterFilter('todos');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${chatterTab === 'actividad'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                  >
                    Actividad
                  </button>
                </div>

                <span className="font-mono text-[11px] bg-surface-container-low px-2 py-0.5 rounded text-on-surface-variant">
                  {(chatterLogsByFolio[selectedOpportunity.folio] || []).length} registros
                </span>
              </div>

              {/* Caja de escritura para agregar nota, mensaje o registro manual al checador */}
              <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <textarea
                  rows={2}
                  value={chatterInput}
                  onChange={(e) => setChatterInput(e.target.value)}
                  placeholder={
                    chatterTab === 'movimientos'
                      ? 'Registrar observación de auditoría o justificación de movimiento...'
                      : chatterTab === 'mensaje'
                        ? 'Escribe un mensaje para el cliente...'
                        : chatterTab === 'nota'
                          ? 'Registrar una nota interna técnica para el equipo SIFYGSA...'
                          : 'Describir la próxima actividad de seguimiento...'
                  }
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    {(['todos', 'movimientos', 'notas'] as const).map((flt) => (
                      <button
                        key={flt}
                        type="button"
                        onClick={() => setChatterFilter(flt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer ${chatterFilter === flt
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                      >
                        {flt === 'todos'
                          ? 'Todo'
                          : flt === 'movimientos'
                            ? 'Solo Movimientos'
                            : 'Notas'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!chatterInput.trim()) return;
                      recordAuditMovement(selectedOpportunity.folio, {
                        kind:
                          chatterTab === 'movimientos'
                            ? 'movement'
                            : chatterTab === 'mensaje'
                              ? 'message'
                              : chatterTab === 'actividad'
                                ? 'activity'
                                : 'note',
                        title:
                          chatterTab === 'movimientos'
                            ? 'Bitácora de Movimiento Manual'
                            : chatterTab === 'actividad'
                              ? 'Actividad Programada'
                              : 'Nota Técnica Registrada',
                        text: chatterInput.trim(),
                      });
                      setChatterInput('');
                    }}
                    className="bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer"
                  >
                    Registrar
                  </button>
                </div>
              </div>

              {/* Línea divisoria del Checador de Movimientos */}
              <div className="flex items-center gap-2 my-0.5">
                <div className="flex-1 h-[1px] bg-outline-variant/25" />
                <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
                  Checador de Movimientos y Modificaciones • Hoy
                </span>
                <div className="flex-1 h-[1px] bg-outline-variant/25" />
              </div>

              {/* Lista de Movimientos y Cambios (Quién la movió, qué campo cambió, valor anterior → nuevo) */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[540px] pr-1">
                {(
                  chatterLogsByFolio[selectedOpportunity.folio] || [
                    {
                      id: `default-${selectedOpportunity.folio}`,
                      author: selectedOpportunity.ownerName,
                      roleLabel: 'Responsable Comercial',
                      initials: selectedOpportunity.ownerInitials,
                      time: '09:10 a.m.',
                      title: 'Alta Inicial en Pipeline CRM',
                      text: `Oportunidad registrada para ${selectedOpportunity.client} en etapa ${selectedOpportunity.stage}.`,
                      kind: 'movement' as const,
                      fieldLabel: 'Etapa Inicial',
                      oldValue: 'Nuevo Registro',
                      newValue: `${selectedOpportunity.stage} (${selectedOpportunity.probability}%)`,
                    },
                  ]
                )
                  .filter((item) => {
                    if (chatterFilter === 'movimientos') {
                      return item.kind === 'movement' || item.kind === 'modification';
                    }
                    if (chatterFilter === 'notas') {
                      return item.kind === 'note' || item.kind === 'message' || item.kind === 'activity';
                    }
                    return true;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs transition-all ${item.kind === 'movement'
                        ? 'bg-primary-fixed/15 border-primary/30'
                        : item.kind === 'modification'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-surface-container-low/60 border-outline-variant/20'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${item.isBot
                          ? 'bg-secondary text-on-secondary'
                          : item.kind === 'movement'
                            ? 'bg-primary text-on-primary'
                            : item.kind === 'modification'
                              ? 'bg-amber-600 text-white'
                              : 'bg-primary-container text-on-primary'
                          }`}
                      >
                        {item.initials}
                      </div>

                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-on-surface truncate">
                              {item.author}
                            </span>
                            {item.roleLabel && (
                              <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.2 rounded truncate">
                                {item.roleLabel}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-outline shrink-0">
                            {item.time}
                          </span>
                        </div>

                        {item.title && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${item.kind === 'movement'
                                ? 'bg-primary text-on-primary'
                                : item.kind === 'modification'
                                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                  : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                            >
                              {item.kind === 'movement'
                                ? 'MOVIMIENTO'
                                : item.kind === 'modification'
                                  ? 'MODIFICACIÓN'
                                  : 'BITÁCORA'}
                            </span>
                            <span className="font-bold text-on-surface">
                              {item.title}
                            </span>
                          </div>
                        )}

                        {/* Comparativa Antes → Después (Checador de cambios) */}
                        {item.fieldLabel && item.oldValue && item.newValue && (
                          <div className="bg-surface-container-lowest/90 border border-outline-variant/30 rounded-lg p-2 flex flex-col gap-1 font-mono text-[11px]">
                            <span className="text-[10px] font-sans font-bold uppercase text-on-surface-variant">
                              Campo: {item.fieldLabel}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-error-container/60 text-on-error-container line-through">
                                {item.oldValue}
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-primary">
                                arrow_forward
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                                {item.newValue}
                              </span>
                            </div>
                          </div>
                        )}

                        <p className="text-on-surface-variant leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 8: DIRECTORIO DE CONTACTOS Y CLIENTES (SINCRONIZADO CON KANBAN)
          ===================================================================== */}
      {viewMode === 'contacts' && (
        <div className="flex-1 overflow-auto p-6 bg-surface flex flex-col gap-5">
          {/* KPIs Superiores de Contactos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/35 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Clientes Registrados
                </span>
                <div className="font-mono text-2xl font-bold text-primary mt-0.5">
                  {registeredClients.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">domain</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/35 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Zona Istmo & Sur
                </span>
                <div className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {
                    registeredClients.filter(
                      (c) => c.zone === 'Istmo' || c.zone === 'Sur'
                    ).length
                  }{' '}
                  <span className="text-xs font-sans font-normal text-outline">
                    cuentas
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">location_on</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/35 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Oportunidades Vinculadas
                </span>
                <div className="font-mono text-2xl font-bold text-on-surface mt-0.5">
                  {opportunities.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined">work</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/35 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Acción Rápida
                </span>
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenNewClientModal('')}
                    className="bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      person_add
                    </span>
                    <span>+ Registrar Nuevo Cliente</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de filtro por Zona Comercial */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/35 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">
                Filtrar por Zona Comercial:
              </span>
              {['Todas', 'Istmo', 'Sur', 'Golfo', 'Norte', 'Centro'].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setContactZoneFilter(z)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${contactZoneFilter === z
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {z}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => switchView('kanban')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ir al Tablero Kanban</span>
              <span className="material-symbols-outlined text-[15px]">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Cuadrícula de Tarjetas de Clientes y Contactos */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {registeredClients
              .filter((cli) => {
                if (contactZoneFilter !== 'Todas' && cli.zone !== contactZoneFilter) {
                  return false;
                }
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  cli.companyName.toLowerCase().includes(q) ||
                  cli.contactName.toLowerCase().includes(q) ||
                  cli.email.toLowerCase().includes(q) ||
                  cli.sector.toLowerCase().includes(q) ||
                  cli.city.toLowerCase().includes(q)
                );
              })
              .map((cli) => (
                <div
                  key={cli.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/35 shadow-sm hover:shadow-md hover:border-primary/40 transition-all p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary font-mono text-sm font-bold flex items-center justify-center shrink-0">
                        {cli.tagCode}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-on-surface truncate">
                          {cli.companyName}
                        </h3>
                        <span className="text-[11px] font-medium text-primary">
                          {cli.sector} • Zona {cli.zone}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-surface-container-low border border-outline-variant/30 px-2 py-0.5 rounded text-on-surface-variant shrink-0">
                      {cli.rfc}
                    </span>
                  </div>

                  <div className="bg-surface-container-low/75 rounded-lg p-3 border border-outline-variant/20 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        person
                      </span>
                      <span className="truncate">{cli.contactName}</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant pl-6 truncate">
                      {cli.contactRole}
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant pt-1">
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        mail
                      </span>
                      <span className="font-mono text-[11px] truncate">
                        {cli.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-outline">
                          call
                        </span>
                        <span className="font-mono text-[11px]">{cli.phone}</span>
                      </div>
                      <span className="text-[11px] truncate">{cli.city}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">
                      Oportunidades:{' '}
                      <strong className="font-mono text-on-surface">
                        {cli.activeOppsCount}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectRegisteredClient(cli);
                        setQuickCreateStage('Prospección inicial');
                        switchView('kanban');
                      }}
                      className="text-primary hover:bg-primary-fixed/50 font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        add_circle
                      </span>
                      <span>Crear oportunidad</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          VENTANA MODAL: REGISTRAR NUEVO CLIENTE Y CONTACTO
          (Se agrega al menú desplegable de Nueva Oportunidad y a Contactos)
          ===================================================================== */}
      {showNewClientModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowNewClientModal(false)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">
                    domain_add
                  </span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    Registrar Nuevo Cliente y Contacto
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Se agregará al menú desplegable de Nueva Oportunidad y al directorio de Contactos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveNewClientModal} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Organización / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalCompanyName}
                    onChange={(e) => {
                      setModalCompanyName(e.target.value);
                      if (!modalTagCode || modalTagCode.length <= 3) {
                        setModalTagCode(
                          e.target.value
                            .replace(/[^a-zA-Z0-9]/g, '')
                            .slice(0, 3)
                            .toUpperCase()
                        );
                      }
                    }}
                    placeholder="Ej. Petroquímica del Golfo S.A. de C.V."
                    className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Siglas (3)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={modalTagCode}
                    onChange={(e) => setModalTagCode(e.target.value.toUpperCase())}
                    placeholder="PDG"
                    className="w-full text-xs font-mono font-bold uppercase bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Nombre del Contacto Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalContactName}
                    onChange={(e) => setModalContactName(e.target.value)}
                    placeholder="Ej. Ing. Alejandro Domínguez"
                    className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Cargo / Puesto
                  </label>
                  <input
                    type="text"
                    value={modalContactRole}
                    onChange={(e) => setModalContactRole(e.target.value)}
                    placeholder="Ej. Superintendente F&G"
                    className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="contacto@empresa.com.mx"
                    className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="(921) 214-0000"
                    className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Sector Industrial
                  </label>
                  <select
                    aria-label="Sector Industrial"
                    value={modalSector}
                    onChange={(e) => setModalSector(e.target.value)}
                    className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-2 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Petroquímica">Petroquímica</option>
                    <option value="Refinación">Refinación</option>
                    <option value="Exploración & Producción">Exploración & Prod.</option>
                    <option value="Generación Eléctrica">Generación Eléctrica</option>
                    <option value="Ingeniería EPC">Ingeniería EPC</option>
                    <option value="Siderurgia & Acero">Siderurgia & Acero</option>
                    <option value="Infraestructura Portuaria">Puerto / Logística</option>
                    <option value="Transporte de Gas Natural">Ductos / Gas Natural</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Zona Comercial
                  </label>
                  <select
                    aria-label="Zona Comercial"
                    value={modalZone}
                    onChange={(e) =>
                      setModalZone(
                        e.target.value as 'Istmo' | 'Sur' | 'Golfo' | 'Norte' | 'Centro'
                      )
                    }
                    className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-2.5 py-2 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Istmo">Zona Istmo</option>
                    <option value="Sur">Zona Sur</option>
                    <option value="Golfo">Zona Golfo</option>
                    <option value="Norte">Zona Norte</option>
                    <option value="Centro">Zona Centro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={modalRfc}
                    onChange={(e) => setModalRfc(e.target.value.toUpperCase())}
                    placeholder="PGO1904128A1"
                    className="w-full text-xs font-mono uppercase bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Ciudad / Planta Industrial
                </label>
                <input
                  type="text"
                  value={modalCity}
                  onChange={(e) => setModalCity(e.target.value)}
                  placeholder="Ej. Coatzacoalcos, Veracruz"
                  className="w-full text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/25 mt-1">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary-container hover:bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                  <span>Guardar y Seleccionar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
