export type LeadStatus =
  | 'Nuevo'
  | 'Contactado'
  | 'Calificado'
  | 'Convertido'
  | 'Descartado';

export type LeadZone = 'Istmo' | 'Sur';

export type LeadSaleType = 'Producto' | 'Proyecto';

export type LeadViewMode =
  | 'kanban'
  | 'list'
  | 'calendar'
  | 'pivot'
  | 'graph'
  | 'map'
  | 'activities'
  | 'dashboard'
  | 'detail';

export interface LeadAttachment {
  id: string;
  nombre: string;
  tamano: string;
  fecha: string;
}

export interface LeadActivityCell {
  id: string;
  tipo: 'Llamada' | 'Correo' | 'Reunión' | 'Visita' | 'Levantamiento';
  titulo: string;
  fecha: string;
  estado: 'Pendiente' | 'Hoy' | 'Vencida' | 'Completada';
}

export interface LeadChatterMessage {
  id: string;
  autor: string;
  iniciales: string;
  fecha: string;
  tipo: 'mensaje' | 'nota' | 'actividad' | 'sistema';
  titulo?: string;
  texto: string;
}

export interface LeadAddress {
  calle: string;
  ciudad: string;
  estado: string;
  cp: string;
  lat: number | null;
  lng: number | null;
}

export interface LeadRecord {
  id: string;
  folio: string;
  asunto: string;
  empresa: string;
  contactoNombre: string;
  contactoPuesto: string;
  correo: string;
  telefono: string;
  direccion: LeadAddress;
  origen: string;
  medio: string;
  campana: string;
  zona: LeadZone;
  tipoVenta: LeadSaleType;
  ingresoEstimado: number;
  prioridad: 0 | 1 | 2 | 3;
  etiquetas: string[];
  vendedor: string;
  vendedorIniciales: string;
  estado: LeadStatus;
  motivoDescarte?: string;
  notaDescarte?: string;
  enCartera: boolean;
  sector: 'Público' | 'Privado';
  fechaCreacion: string; // YYYY-MM-DD
  fechaAsignacion?: string; // YYYY-MM-DD
  fechaPrimerContacto?: string; // YYYY-MM-DD
  fechaConversion?: string; // YYYY-MM-DD
  proximoSeguimiento: string; // YYYY-MM-DD
  oportunidadVinculada?: string;
  aprobacionGerente?: 'Pendiente de aprobación del Gerente' | 'Aprobada por Gerencia';
  duplicadoDe?: string;
  noEsDuplicado?: boolean;
  notas: string;
  adjuntos: LeadAttachment[];
  actividades: LeadActivityCell[];
  chatter: LeadChatterMessage[];
}

export interface ScoreRuleConfig {
  id: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  activa: boolean;
}

export interface LeadsModuleConfig {
  slaDiasHabiles: number;
  origenes: string[];
  medios: string[];
  motivosDescarte: string[];
  zonas: LeadZone[];
  etiquetasDisponibles: string[];
  vendedoresPorZona: Record<LeadZone, Array<{ nombre: string; iniciales: string }>>;
  reglasPuntaje: ScoreRuleConfig[];
}

export const INITIAL_LEADS_CONFIG: LeadsModuleConfig = {
  slaDiasHabiles: 2,
  origenes: [
    'Licitación PEMEX/CFE',
    'Referido',
    'Correo',
    'Sitio web',
    'Visita',
    'Evento',
    'Otro',
  ],
  medios: [
    'Portal Compras Gubernamentales',
    'Llamada Directa',
    'Correo Corporativo',
    'Formulario Web SIFYGSA',
    'Visita Técnica en Planta',
    'Congreso Mexicano del Petróleo',
  ],
  motivosDescarte: [
    'Presupuesto insuficiente / cancelado por planta',
    'Adjudicado a competidor por precio',
    'Fuera de alcance técnico SIFYGSA',
    'Sin respuesta tras 3 intentos de contacto',
    'Proyecto pospuesto para siguiente ejercicio fiscal',
    'Registro duplicado',
  ],
  zonas: ['Istmo', 'Sur'],
  etiquetasDisponibles: [
    'NFPA 72',
    'SIL 2',
    'SIL 3',
    'H2S',
    'Sensores UV/IR',
    'ATEX',
    'Notifier',
    'Válvulas Diluvio',
    'Det-Tronics',
    'Calibración',
  ],
  vendedoresPorZona: {
    Istmo: [
      { nombre: 'Ing. Carlos Rodríguez', iniciales: 'CR' },
      { nombre: 'Ing. Jorge Garza', iniciales: 'JG' },
    ],
    Sur: [
      { nombre: 'Ing. Manuel Valdez', iniciales: 'MV' },
      { nombre: 'Ing. Ivan Alexei Gamboa', iniciales: 'IG' },
    ],
  },
  reglasPuntaje: [
    {
      id: 'rule-contact',
      nombre: 'Datos de contacto completos',
      descripcion: 'Correo electrónico corporativo y teléfono directo verificados',
      puntos: 20,
      activa: true,
    },
    {
      id: 'rule-portfolio',
      nombre: 'Cliente activo en cartera SIFYGSA',
      descripcion: 'La empresa ya cuenta con contratos o historial previo en el ERP',
      puntos: 20,
      activa: true,
    },
    {
      id: 'rule-amount-high',
      nombre: 'Ingreso estimado alto (≥ $2,000,000 MXN)',
      descripcion: 'Proyecto de envergadura industrial o licitación mayor',
      puntos: 25,
      activa: true,
    },
    {
      id: 'rule-origin',
      nombre: 'Origen de alta conversión',
      descripcion: 'Proviene de Licitación PEMEX/CFE, Visita en planta o Referido',
      puntos: 20,
      activa: true,
    },
    {
      id: 'rule-sector',
      nombre: 'Sector energético / petroquímico prioritario',
      descripcion: 'Instalación estratégica con normativa obligatoria NFPA / SIL',
      puntos: 15,
      activa: true,
    },
  ],
};

export interface ScoreEvaluationResult {
  total: number;
  desglose: Array<{ id: string; nombre: string; puntos: number; cumplida: boolean }>;
}

export function evaluarPuntajeLead(
  lead: Pick<
    LeadRecord,
    'correo' | 'telefono' | 'enCartera' | 'ingresoEstimado' | 'origen' | 'sector'
  >,
  config: LeadsModuleConfig
): ScoreEvaluationResult {
  const desglose = config.reglasPuntaje
    .filter((r) => r.activa)
    .map((rule) => {
      let cumplida = false;
      if (rule.id === 'rule-contact') {
        cumplida =
          Boolean(lead.correo && lead.correo.includes('@')) &&
          Boolean(lead.telefono && lead.telefono.trim().length >= 7);
      } else if (rule.id === 'rule-portfolio') {
        cumplida = lead.enCartera;
      } else if (rule.id === 'rule-amount-high') {
        cumplida = lead.ingresoEstimado >= 2000000;
      } else if (rule.id === 'rule-origin') {
        cumplida = [
          'Licitación PEMEX/CFE',
          'Visita',
          'Referido',
        ].includes(lead.origen);
      } else if (rule.id === 'rule-sector') {
        cumplida = lead.sector === 'Público' || lead.ingresoEstimado >= 1000000;
      }
      return {
        id: rule.id,
        nombre: rule.nombre,
        puntos: rule.puntos,
        cumplida,
      };
    });

  const suma = desglose.reduce(
    (acc, item) => acc + (item.cumplida ? item.puntos : 0),
    0
  );

  return {
    total: Math.min(100, suma),
    desglose,
  };
}

export function calcularDiasEntre(inicio?: string, fin?: string): number {
  if (!inicio || !fin) return 0;
  const d1 = new Date(inicio).getTime();
  const d2 = new Date(fin).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return 0;
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export function evaluarSlaLead(
  lead: LeadRecord,
  slaDiasHabiles: number,
  fechaReferencia = '2026-11-12'
): {
  estatus: 'ok' | 'warning' | 'overdue';
  etiqueta: string;
  diasTranscurridos: number;
} {
  if (lead.estado === 'Convertido') {
    return {
      estatus: 'ok',
      etiqueta: 'Convertido en tiempo',
      diasTranscurridos: calcularDiasEntre(lead.fechaCreacion, lead.fechaConversion || fechaReferencia),
    };
  }
  if (lead.estado === 'Descartado') {
    return {
      estatus: 'ok',
      etiqueta: 'Cerrado / Descartado',
      diasTranscurridos: 0,
    };
  }
  if (lead.fechaPrimerContacto) {
    const dias = calcularDiasEntre(lead.fechaCreacion, lead.fechaPrimerContacto);
    if (dias <= slaDiasHabiles) {
      return {
        estatus: 'ok',
        etiqueta: `Contactado en ${dias}d (SLA ≤ ${slaDiasHabiles}d)`,
        diasTranscurridos: dias,
      };
    }
    return {
      estatus: 'warning',
      etiqueta: `Contactado en ${dias}d (excedió SLA)`,
      diasTranscurridos: dias,
    };
  }

  const diasSinContacto = calcularDiasEntre(lead.fechaCreacion, fechaReferencia);
  if (diasSinContacto > slaDiasHabiles) {
    return {
      estatus: 'overdue',
      etiqueta: `SLA vencido (${diasSinContacto}d sin contacto)`,
      diasTranscurridos: diasSinContacto,
    };
  }
  if (diasSinContacto === slaDiasHabiles) {
    return {
      estatus: 'warning',
      etiqueta: `Vence hoy (${diasSinContacto}/${slaDiasHabiles}d)`,
      diasTranscurridos: diasSinContacto,
    };
  }
  return {
    estatus: 'ok',
    etiqueta: `En tiempo (${diasSinContacto}/${slaDiasHabiles}d)`,
    diasTranscurridos: diasSinContacto,
  };
}

export const INITIAL_LEADS_DATA: LeadRecord[] = [
  {
    id: 'lead-001',
    folio: 'LEAD-2026-001',
    asunto: 'Modernización de red de detección H2S y LEL en Planta Hidrodesulfuradora',
    empresa: 'Pemex Transformación Industrial',
    contactoNombre: 'Ing. Jorge Reyes Morales',
    contactoPuesto: 'Superintendente de Instrumentación y Control',
    correo: 'jorge.reyes@pemex.com',
    telefono: '(922) 225-0410',
    direccion: {
      calle: 'Av. Salvador Díaz Mirón s/n, Col. Obrera',
      ciudad: 'Minatitlán',
      estado: 'Veracruz',
      cp: '96740',
      lat: 17.9939,
      lng: -94.5456,
    },
    origen: 'Licitación PEMEX/CFE',
    medio: 'Portal Compras Gubernamentales',
    campana: 'Modernización F&G 2026',
    zona: 'Istmo',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 4850000,
    prioridad: 3,
    etiquetas: ['SIL 2', 'H2S', 'NFPA 72'],
    vendedor: 'Ing. Carlos Rodríguez',
    vendedorIniciales: 'CR',
    estado: 'Calificado',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-11-04',
    fechaAsignacion: '2026-11-04',
    fechaPrimerContacto: '2026-11-05',
    proximoSeguimiento: '2026-11-12',
    notas: 'Requiere reemplazo de 38 transmisores electroquímicos H2S con certificación SIL-2 y pruebas FAT/SAT.',
    adjuntos: [
      { id: 'att-1', nombre: 'Bases_Tecnicas_Minatitlan_HDS.pdf', tamano: '3.2 MB', fecha: '2026-11-05' },
      { id: 'att-2', nombre: 'Listado_Tags_Sensores_H2S.xlsx', tamano: '640 KB', fecha: '2026-11-06' },
    ],
    actividades: [
      { id: 'act-101', tipo: 'Llamada', titulo: 'Confirmar visita a planta con Superintendencia', fecha: '2026-11-05', estado: 'Completada' },
      { id: 'act-102', tipo: 'Levantamiento', titulo: 'Recorrido técnico en unidad HDS', fecha: '2026-11-12', estado: 'Hoy' },
    ],
    chatter: [
      {
        id: 'ch-1',
        autor: 'Ing. Carlos Rodríguez',
        iniciales: 'CR',
        fecha: '05 Nov 2026 11:20',
        tipo: 'nota',
        titulo: 'Validación de alcance técnico',
        texto: 'El cliente confirmó que las bases exigen protocolo HART 7 y cajas a prueba de explosión Clase I Div 1.',
      },
      {
        id: 'ch-2',
        autor: 'Sistema SIFYGSA',
        iniciales: 'SFG',
        fecha: '04 Nov 2026 09:00',
        tipo: 'sistema',
        texto: 'Lead registrado desde Portal Compras Gubernamentales y asignado a Zona Istmo.',
      },
    ],
  },
  {
    id: 'lead-002',
    folio: 'LEAD-2026-002',
    asunto: 'Suministro de 24 detectores ópticos de flama UV/IR para área de esferas GLP',
    empresa: 'Complejo Petroquímico Cangrejera',
    contactoNombre: 'Ing. Roberto Kim Hernández',
    contactoPuesto: 'Jefe de Seguridad Industrial (SIPA)',
    correo: 'r.kim@petrocangrejera.mx',
    telefono: '(921) 211-3000',
    direccion: {
      calle: 'Carretera Coatzacoalcos-Villahermosa Km 10',
      ciudad: 'Coatzacoalcos',
      estado: 'Veracruz',
      cp: '96400',
      lat: 18.1172,
      lng: -94.3561,
    },
    origen: 'Visita',
    medio: 'Visita Técnica en Planta',
    campana: 'Seguridad Funcional SIL',
    zona: 'Istmo',
    tipoVenta: 'Producto',
    ingresoEstimado: 2680000,
    prioridad: 3,
    etiquetas: ['Sensores UV/IR', 'Det-Tronics', 'ATEX'],
    vendedor: 'Ing. Jorge Garza',
    vendedorIniciales: 'JG',
    estado: 'Contactado',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-11-08',
    fechaAsignacion: '2026-11-08',
    fechaPrimerContacto: '2026-11-09',
    proximoSeguimiento: '2026-11-13',
    notas: 'Solicitan cotización comparativa de detectores Det-Tronics X3301 vs Honeywell FS24X con accesorios de montaje.',
    adjuntos: [
      { id: 'att-3', nombre: 'Plano_Esferas_Cangrejera_Rev2.pdf', tamano: '4.8 MB', fecha: '2026-11-09' },
    ],
    actividades: [
      { id: 'act-103', tipo: 'Correo', titulo: 'Enviar fichas técnicas FM/CSA UV/IR', fecha: '2026-11-09', estado: 'Completada' },
      { id: 'act-104', tipo: 'Reunión', titulo: 'Revisión de ángulos de visión óptica', fecha: '2026-11-13', estado: 'Pendiente' },
    ],
    chatter: [
      {
        id: 'ch-3',
        autor: 'Ing. Jorge Garza',
        iniciales: 'JG',
        fecha: '09 Nov 2026 16:40',
        tipo: 'mensaje',
        texto: 'Se enviaron hojas de especificación técnica y certificados FM/ATEX al Ing. Roberto Kim.',
      },
    ],
  },
  {
    id: 'lead-003',
    folio: 'LEAD-2026-003',
    asunto: 'Póliza anual de calibración y mantenimiento de barreras intrínsecas SIL-2',
    empresa: 'Braskem Idesa Nanchital',
    contactoNombre: 'Ing. Rodrigo Cárdenas Soto',
    contactoPuesto: 'Coordinador de Confiabilidad Operativa',
    correo: 'rcardenas@braskem.com',
    telefono: '(921) 211-4050',
    direccion: {
      calle: 'Blvd. Industrial Petroquímico Lote 4',
      ciudad: 'Nanchital',
      estado: 'Veracruz',
      cp: '96360',
      lat: 18.0681,
      lng: -94.4108,
    },
    origen: 'Referido',
    medio: 'Llamada Directa',
    campana: 'Pólizas Calibración Q4',
    zona: 'Istmo',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 1950000,
    prioridad: 2,
    etiquetas: ['SIL 2', 'Calibración'],
    vendedor: 'Ing. Carlos Rodríguez',
    vendedorIniciales: 'CR',
    estado: 'Nuevo',
    enCartera: true,
    sector: 'Privado',
    fechaCreacion: '2026-11-11',
    fechaAsignacion: '2026-11-11',
    proximoSeguimiento: '2026-11-12',
    notas: 'Paro programado de planta en diciembre; requieren cuadrilla certificada con gases patrón trazables al CENAM.',
    adjuntos: [],
    actividades: [
      { id: 'act-105', tipo: 'Llamada', titulo: 'Llamada de calificación inicial', fecha: '2026-11-12', estado: 'Hoy' },
    ],
    chatter: [],
  },
  {
    id: 'lead-004',
    folio: 'LEAD-2026-004',
    asunto: 'Sistema de detección temprana por aspiración VESDA y panel Notifier NFS2-3030',
    empresa: 'CFE Generación VI — Central Dos Bocas',
    contactoNombre: 'Ing. Martín Espinoza Lara',
    contactoPuesto: 'Jefe de Departamento Eléctrico y Control',
    correo: 'martin.espinoza@cfe.mx',
    telefono: '(229) 989-5100',
    direccion: {
      calle: 'Km 12 Carretera Medellín-El Tejar',
      ciudad: 'Dos Bocas / Paraíso',
      estado: 'Tabasco',
      cp: '86600',
      lat: 18.4256,
      lng: -93.1892,
    },
    origen: 'Licitación PEMEX/CFE',
    medio: 'Portal Compras Gubernamentales',
    campana: 'Modernización F&G 2026',
    zona: 'Sur',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 3640000,
    prioridad: 3,
    etiquetas: ['NFPA 72', 'Notifier'],
    vendedor: 'Ing. Manuel Valdez',
    vendedorIniciales: 'MV',
    estado: 'Calificado',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-11-03',
    fechaAsignacion: '2026-11-03',
    fechaPrimerContacto: '2026-11-04',
    proximoSeguimiento: '2026-11-14',
    notas: 'Protección de cuarto de control central y trincheras de cables de alta tensión conforme a NFPA 72.',
    adjuntos: [
      { id: 'att-4', nombre: 'Convocatoria_CFE_GI_2026_089.pdf', tamano: '2.1 MB', fecha: '2026-11-03' },
    ],
    actividades: [
      { id: 'act-106', tipo: 'Visita', titulo: 'Visita al cuarto de control de turbinas', fecha: '2026-11-14', estado: 'Pendiente' },
    ],
    chatter: [],
  },
  {
    id: 'lead-005',
    folio: 'LEAD-2026-005',
    asunto: 'Ingeniería y suministro de válvulas de diluvio certificadas UL/FM para tanques',
    empresa: 'Pemex Exploración y Producción — Complejo Cactus',
    contactoNombre: 'Dra. Elena Alarcón Garza',
    contactoPuesto: 'Coordinadora de Proyectos IPC',
    correo: 'ealarcon@pemex.com',
    telefono: '(993) 310-6200',
    direccion: {
      calle: 'Carretera Reforma-Estación Juárez s/n',
      ciudad: 'Reforma',
      estado: 'Chiapas',
      cp: '29500',
      lat: 17.8511,
      lng: -93.1565,
    },
    origen: 'Licitación PEMEX/CFE',
    medio: 'Visita Técnica en Planta',
    campana: 'Modernización F&G 2026',
    zona: 'Sur',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 6150000,
    prioridad: 3,
    etiquetas: ['Válvulas Diluvio', 'NFPA 72', 'SIL 3'],
    vendedor: 'Ing. Ivan Alexei Gamboa',
    vendedorIniciales: 'IG',
    estado: 'Calificado',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-11-01',
    fechaAsignacion: '2026-11-01',
    fechaPrimerContacto: '2026-11-02',
    proximoSeguimiento: '2026-11-12',
    notas: 'Ingeniería aprobada en junta técnica; listo para convertirse en oportunidad comercial del flujo principal.',
    adjuntos: [],
    actividades: [
      { id: 'act-107', tipo: 'Reunión', titulo: 'Junta de validación con Gerencia Zona Sur', fecha: '2026-11-12', estado: 'Hoy' },
    ],
    chatter: [],
  },
  {
    id: 'lead-006',
    folio: 'LEAD-2026-006',
    asunto: 'Adquisición de 15 detectores portátiles multigás (H2S, CO, O2, LEL) para brigada',
    empresa: 'Terminal Marítima Pajaritos',
    contactoNombre: 'Ing. Gustavo Morales Ríos',
    contactoPuesto: 'Supervisor de Seguridad Operativa',
    correo: 'gmorales@pajaritos-logistica.mx',
    telefono: '(921) 218-0922',
    direccion: {
      calle: 'Isla Pajaritos s/n, Zona Industrial',
      ciudad: 'Coatzacoalcos',
      estado: 'Veracruz',
      cp: '96400',
      lat: 18.1369,
      lng: -94.4158,
    },
    origen: 'Sitio web',
    medio: 'Formulario Web SIFYGSA',
    campana: 'Pólizas Calibración Q4',
    zona: 'Istmo',
    tipoVenta: 'Producto',
    ingresoEstimado: 580000,
    prioridad: 1,
    etiquetas: ['H2S', 'ATEX'],
    vendedor: 'Ing. Jorge Garza',
    vendedorIniciales: 'JG',
    estado: 'Nuevo',
    enCartera: false,
    sector: 'Privado',
    fechaCreacion: '2026-11-07',
    fechaAsignacion: '2026-11-08',
    proximoSeguimiento: '2026-11-10',
    notas: 'Solicitó cotización por formulario web; aún pendiente primer contacto telefónico (SLA vencido).',
    adjuntos: [],
    actividades: [
      { id: 'act-108', tipo: 'Llamada', titulo: 'Contactar al Ing. Gustavo Morales', fecha: '2026-11-10', estado: 'Vencida' },
    ],
    chatter: [],
  },
  {
    id: 'lead-007',
    folio: 'LEAD-2026-007',
    asunto: 'Rehabilitación de sistema de voceo y alarmas acústicas/estroboscópicas en muelles',
    empresa: 'Administración del Sistema Portuario Nacional (ASIPONA)',
    contactoNombre: 'Cap. Horacio Méndez Tello',
    contactoPuesto: 'Gerente de Operaciones y Protección Portuaria',
    correo: 'hmendez@puertosalina.gob.mx',
    telefono: '(971) 714-1890',
    direccion: {
      calle: 'Av. Tampico #104, Col. Cantarranas',
      ciudad: 'Salina Cruz',
      estado: 'Oaxaca',
      cp: '70680',
      lat: 16.1694,
      lng: -95.1972,
    },
    origen: 'Visita',
    medio: 'Visita Técnica en Planta',
    campana: 'Corredor Interoceánico 2026',
    zona: 'Istmo',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 2890000,
    prioridad: 3,
    etiquetas: ['NFPA 72', 'ATEX'],
    vendedor: 'Ing. Carlos Rodríguez',
    vendedorIniciales: 'CR',
    estado: 'Contactado',
    enCartera: false,
    sector: 'Público',
    fechaCreacion: '2026-11-06',
    fechaAsignacion: '2026-11-06',
    fechaPrimerContacto: '2026-11-07',
    proximoSeguimiento: '2026-11-15',
    notas: 'Sirenas de alta potencia resistentes a niebla salina marina NEMA 4X / IP66.',
    adjuntos: [],
    actividades: [
      { id: 'act-109', tipo: 'Levantamiento', titulo: 'Medición de presión sonora dB en muelles', fecha: '2026-11-15', estado: 'Pendiente' },
    ],
    chatter: [],
  },
  {
    id: 'lead-008',
    folio: 'LEAD-2026-008',
    asunto: 'Actualización de matriz Causa-Efecto y PLC de seguridad SIL-3 en compresión',
    empresa: 'Techint Ingeniería y Construcción — Dos Bocas',
    contactoNombre: 'Ing. Mauricio Villarreal Garza',
    contactoPuesto: 'Líder de Disciplina de Instrumentación',
    correo: 'mvillarreal@techint.com',
    telefono: '(933) 333-4100',
    direccion: {
      calle: 'Parque Industrial Paraíso Sector Norte',
      ciudad: 'Paraíso',
      estado: 'Tabasco',
      cp: '86606',
      lat: 18.3982,
      lng: -93.2145,
    },
    origen: 'Referido',
    medio: 'Correo Corporativo',
    campana: 'Seguridad Funcional SIL',
    zona: 'Sur',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 5400000,
    prioridad: 3,
    etiquetas: ['SIL 3', 'NFPA 72'],
    vendedor: 'Ing. Manuel Valdez',
    vendedorIniciales: 'MV',
    estado: 'Contactado',
    enCartera: true,
    sector: 'Privado',
    fechaCreacion: '2026-11-05',
    fechaAsignacion: '2026-11-05',
    fechaPrimerContacto: '2026-11-06',
    proximoSeguimiento: '2026-11-13',
    notas: 'Solicitan ingeniería de detalle firmada por especialista certificado TUV FS Eng.',
    adjuntos: [],
    actividades: [
      { id: 'act-110', tipo: 'Reunión', titulo: 'Revisión de arquitectura lógica SIL-3', fecha: '2026-11-13', estado: 'Pendiente' },
    ],
    chatter: [],
  },
  {
    id: 'lead-009',
    folio: 'LEAD-2026-009',
    asunto: 'Suministro de cable detector térmico lineal Protectowire para bandejas eléctricas',
    empresa: 'Refinería Ing. Antonio Dovalí Jaime (Salina Cruz)',
    contactoNombre: 'Ing. Héctor Solís Domínguez',
    contactoPuesto: 'Encargado de Mantenimiento de Plantas de Proceso',
    correo: 'hsolis@pemex.com',
    telefono: '(971) 714-0500',
    direccion: {
      calle: 'Calzada Refinería s/n, Parque Industrial',
      ciudad: 'Salina Cruz',
      estado: 'Oaxaca',
      cp: '70620',
      lat: 16.2015,
      lng: -95.1742,
    },
    origen: 'Licitación PEMEX/CFE',
    medio: 'Portal Compras Gubernamentales',
    campana: 'Modernización F&G 2026',
    zona: 'Istmo',
    tipoVenta: 'Producto',
    ingresoEstimado: 1750000,
    prioridad: 2,
    etiquetas: ['NFPA 72', 'Calibración'],
    vendedor: 'Ing. Jorge Garza',
    vendedorIniciales: 'JG',
    estado: 'Convertido',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-10-22',
    fechaAsignacion: '2026-10-22',
    fechaPrimerContacto: '2026-10-23',
    fechaConversion: '2026-10-29',
    proximoSeguimiento: '2026-11-18',
    oportunidadVinculada: 'OPP-2026-033',
    aprobacionGerente: 'Aprobada por Gerencia',
    notas: 'Convertido exitosamente al flujo principal tras validación de metraje (4,200 m de cable CTI-155).',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
  {
    id: 'lead-010',
    folio: 'LEAD-2026-010',
    asunto: 'Integración de tableros de gas y fuego en plataforma marina Akal-C',
    empresa: 'Pemex Exploración y Producción — Región Marina',
    contactoNombre: 'Ing. Arturo Castellanos Cruz',
    contactoPuesto: 'Subgerente de Confiabilidad Marina',
    correo: 'acastellanos@pemex.com',
    telefono: '(938) 381-1200',
    direccion: {
      calle: 'Calle 33 #90, Col. Burócratas',
      ciudad: 'Ciudad del Carmen',
      estado: 'Campeche',
      cp: '24180',
      lat: 18.6478,
      lng: -91.8231,
    },
    origen: 'Evento',
    medio: 'Congreso Mexicano del Petróleo',
    campana: 'Seguridad Funcional SIL',
    zona: 'Sur',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 8100000,
    prioridad: 3,
    etiquetas: ['SIL 3', 'NFPA 72', 'Det-Tronics'],
    vendedor: 'Ing. Ivan Alexei Gamboa',
    vendedorIniciales: 'IG',
    estado: 'Convertido',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-10-18',
    fechaAsignacion: '2026-10-18',
    fechaPrimerContacto: '2026-10-19',
    fechaConversion: '2026-10-25',
    proximoSeguimiento: '2026-11-20',
    oportunidadVinculada: 'OPP-2026-019',
    aprobacionGerente: 'Pendiente de aprobación del Gerente',
    notas: 'Convertido a oportunidad; pendiente firma de viabilidad operativa por el Gerente de Zona Sur.',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
  {
    id: 'lead-011',
    folio: 'LEAD-2026-011',
    asunto: 'Detectores ultrasónicos de fugas de gas a alta presión en estación de compresión',
    empresa: 'CENAGAS — Estación Medias Aguas',
    contactoNombre: 'Ing. Víctor Manuel Ochoa',
    contactoPuesto: 'Responsable de Ductos Sur-Istmo',
    correo: 'vochoa@cenagas.gob.mx',
    telefono: '(924) 247-0180',
    direccion: {
      calle: 'Tramo Ferroviario Medias Aguas Km 42',
      ciudad: 'Sayula de Alemán',
      estado: 'Veracruz',
      cp: '96150',
      lat: 17.6745,
      lng: -95.0289,
    },
    origen: 'Correo',
    medio: 'Correo Corporativo',
    campana: 'Modernización F&G 2026',
    zona: 'Istmo',
    tipoVenta: 'Producto',
    ingresoEstimado: 3120000,
    prioridad: 2,
    etiquetas: ['Sensores UV/IR', 'SIL 2'],
    vendedor: '',
    vendedorIniciales: '--',
    estado: 'Nuevo',
    enCartera: false,
    sector: 'Público',
    fechaCreacion: '2026-11-11',
    proximoSeguimiento: '2026-11-13',
    notas: 'Lead entrante sin vendedor asignado; listo para prueba de asignación automática en Zona Istmo.',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
  {
    id: 'lead-012',
    folio: 'LEAD-2026-012',
    asunto: 'Montaje de monitores remotos de espuma AFFF en patio de tanques de crudo',
    empresa: 'ICA Fluor Daniel S.A. de C.V.',
    contactoNombre: 'Ing. Fernando Silva Maza',
    contactoPuesto: 'Gerente de Procura Equipos Contra Incendio',
    correo: 'fernando.silva@icafluor.com',
    telefono: '(922) 225-8900',
    direccion: {
      calle: 'Campamento Industrial Planta Coquizadora',
      ciudad: 'Minatitlán',
      estado: 'Veracruz',
      cp: '96700',
      lat: 17.9852,
      lng: -94.5214,
    },
    origen: 'Referido',
    medio: 'Llamada Directa',
    campana: 'Modernización F&G 2026',
    zona: 'Istmo',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 4290000,
    prioridad: 3,
    etiquetas: ['Válvulas Diluvio', 'NFPA 72'],
    vendedor: 'Ing. Carlos Rodríguez',
    vendedorIniciales: 'CR',
    estado: 'Calificado',
    enCartera: true,
    sector: 'Privado',
    fechaCreacion: '2026-11-02',
    fechaAsignacion: '2026-11-02',
    fechaPrimerContacto: '2026-11-03',
    proximoSeguimiento: '2026-11-12',
    notas: 'Especificación técnica aprobada; requiere cotización formal antes del viernes.',
    adjuntos: [],
    actividades: [
      { id: 'act-111', tipo: 'Correo', titulo: 'Enviar propuesta económica revisada', fecha: '2026-11-12', estado: 'Hoy' },
    ],
    chatter: [],
  },
  {
    id: 'lead-013',
    folio: 'LEAD-2026-013',
    asunto: 'Certificación anual de lazos de detección de humo en subestación eléctrica 400 kV',
    empresa: 'Ternium Logística Sur',
    contactoNombre: 'Lic. Daniel Arcos Pineda',
    contactoPuesto: 'Comprador Técnico Regional',
    correo: 'darcos@ternium.com',
    telefono: '(921) 215-6600',
    direccion: {
      calle: 'Zona Industrial Puerto México',
      ciudad: 'Coatzacoalcos',
      estado: 'Veracruz',
      cp: '96510',
      lat: null,
      lng: null,
    },
    origen: 'Sitio web',
    medio: 'Formulario Web SIFYGSA',
    campana: 'Pólizas Calibración Q4',
    zona: 'Istmo',
    tipoVenta: 'Producto',
    ingresoEstimado: 790000,
    prioridad: 2,
    etiquetas: ['Notifier', 'Calibración'],
    vendedor: 'Ing. Jorge Garza',
    vendedorIniciales: 'JG',
    estado: 'Contactado',
    enCartera: true,
    sector: 'Privado',
    fechaCreacion: '2026-11-09',
    fechaAsignacion: '2026-11-09',
    fechaPrimerContacto: '2026-11-10',
    proximoSeguimiento: '2026-11-16',
    notas: 'Dirección pendiente de georreferenciar en campo (aparece en bandeja "Sin localizar" de la vista Mapa).',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
  {
    id: 'lead-014',
    folio: 'LEAD-2026-014',
    asunto: 'Batería de cilindros de agente limpio Novec 1230 para cuarto de servidores SCADA',
    empresa: 'Complejo Procesador de Gas Nuevo Pemex',
    contactoNombre: 'Ing. Patricio Villalobos',
    contactoPuesto: 'Especialista en Telecomunicaciones y SCADA',
    correo: 'pvillalobos@pemex.com',
    telefono: '(993) 310-7740',
    direccion: {
      calle: 'Carretera Villahermosa-Macuspana Km 18',
      ciudad: 'Centro / Villahermosa',
      estado: 'Tabasco',
      cp: '86280',
      lat: 17.9542,
      lng: -92.8112,
    },
    origen: 'Visita',
    medio: 'Visita Técnica en Planta',
    campana: 'Seguridad Funcional SIL',
    zona: 'Sur',
    tipoVenta: 'Proyecto',
    ingresoEstimado: 2350000,
    prioridad: 2,
    etiquetas: ['NFPA 72', 'Notifier'],
    vendedor: '',
    vendedorIniciales: '--',
    estado: 'Nuevo',
    enCartera: true,
    sector: 'Público',
    fechaCreacion: '2026-11-11',
    proximoSeguimiento: '2026-11-13',
    notas: 'Lead de Zona Sur sin asignar; requiere cálculo hidráulico de descarga en menos de 10 segundos.',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
  {
    id: 'lead-015',
    folio: 'LEAD-2026-015',
    asunto: 'Suministro de extintores sobre ruedas de polvo químico seco PQS 70 kg',
    empresa: 'Constructora Industrial del Golfo S.A.',
    contactoNombre: 'Arq. Ramiro Fuentes',
    contactoPuesto: 'Residente de Obra Civil',
    correo: 'rfuentes@cigolfo.mx',
    telefono: '(933) 112-4090',
    direccion: {
      calle: 'Libramiento Paraíso Km 3.5',
      ciudad: 'Paraíso',
      estado: 'Tabasco',
      cp: '86600',
      lat: null,
      lng: null,
    },
    origen: 'Otro',
    medio: 'Llamada Directa',
    campana: 'Pólizas Calibración Q4',
    zona: 'Sur',
    tipoVenta: 'Producto',
    ingresoEstimado: 310000,
    prioridad: 1,
    etiquetas: ['Calibración'],
    vendedor: 'Ing. Manuel Valdez',
    vendedorIniciales: 'MV',
    estado: 'Descartado',
    motivoDescarte: 'Presupuesto insuficiente / cancelado por planta',
    notaDescarte: 'El cliente decidió rentar equipo básico local en lugar de adquirir sistemas normados.',
    enCartera: false,
    sector: 'Privado',
    fechaCreacion: '2026-10-28',
    fechaAsignacion: '2026-10-28',
    fechaPrimerContacto: '2026-10-29',
    proximoSeguimiento: '2026-11-05',
    notas: 'Descartado con opción de restaurar si reactivan partida presupuestal.',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
  {
    id: 'lead-016',
    folio: 'LEAD-2026-016',
    asunto: 'Solicitud duplicada: Reemplazo de barreras intrínsecas tren de polietileno',
    empresa: 'Braskem Idesa Nanchital',
    contactoNombre: 'Ing. Rodrigo Cárdenas Soto',
    contactoPuesto: 'Coordinador de Confiabilidad Operativa',
    correo: 'rcardenas@braskem.com',
    telefono: '(921) 211-4050',
    direccion: {
      calle: 'Blvd. Industrial Petroquímico Lote 4',
      ciudad: 'Nanchital',
      estado: 'Veracruz',
      cp: '96360',
      lat: 18.0695,
      lng: -94.4125,
    },
    origen: 'Correo',
    medio: 'Correo Corporativo',
    campana: 'Pólizas Calibración Q4',
    zona: 'Istmo',
    tipoVenta: 'Producto',
    ingresoEstimado: 1800000,
    prioridad: 2,
    etiquetas: ['SIL 2', 'ATEX'],
    vendedor: 'Ing. Carlos Rodríguez',
    vendedorIniciales: 'CR',
    estado: 'Nuevo',
    enCartera: true,
    sector: 'Privado',
    fechaCreacion: '2026-11-11',
    fechaAsignacion: '2026-11-11',
    proximoSeguimiento: '2026-11-12',
    duplicadoDe: 'LEAD-2026-003',
    notas: 'Detectado como posible duplicado de LEAD-2026-003 por coincidencia exacta de correo, teléfono y empresa.',
    adjuntos: [],
    actividades: [],
    chatter: [],
  },
];

