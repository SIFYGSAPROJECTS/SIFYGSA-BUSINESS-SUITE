import { NavModule, KpiMetric, AgendaDay, Employee, Subsidiary, LocationItem, DepartmentItem } from '../types';

export const NAVIGATION_MODULES: NavModule[] = [
  {
    id: 'dashboard',
    title: 'Inicio',
    iconName: 'LayoutDashboard',
    path: '/dashboard'
  },
  {
    id: 'rrhh',
    title: 'Recursos Humanos',
    iconName: 'Users',
    subItems: [
      { id: 'rrhh-panel', title: 'Menú Principal', path: '/rrhh/dashboard' },
      { id: 'rrhh-alta', title: 'Alta de Empleado', path: '/rrhh/empleados/nuevo' },
      { id: 'rrhh-catalogos', title: 'Catálogo Personal', path: '/rrhh/empleados' },
      { id: 'rrhh-vacaciones', title: 'Vacaciones', path: '/rrhh/vacaciones' },
      { id: 'rrhh-formatos', title: 'Formatos SGI', path: '/rrhh/formatos' },
      { id: 'rrhh-departamentos', title: 'Departamentos', path: '/rrhh/departamentos' },
      { id: 'rrhh-cumpleanos', title: 'Cumpleaños', path: '/rrhh/cumpleanos' },
      { id: 'rrhh-festivos', title: 'Días Festivos', path: '/rrhh/festivos' }
    ]
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    iconName: 'Landmark',
    subItems: [
      { id: 'fin-nominas', title: 'Nóminas y Pagos', path: '/finanzas/nominas' },
      { id: 'fin-viaticos', title: 'Cuentas y Viáticos', path: '/finanzas/viaticos' },
      { id: 'fin-facturacion', title: 'Facturación SGI', path: '/finanzas/facturacion' }
    ]
  },
  {
    id: 'admin',
    title: 'Administración',
    iconName: 'ShieldAlert',
    subItems: [
      { id: 'admin-roles', title: 'Roles y Auditoría', path: '/admin/seguridad' },
      { id: 'admin-config', title: 'Configuración Suite', path: '/admin/config' }
    ]
  }
];

export const KPI_METRICS: KpiMetric[] = [
  {
    id: 'total-empleados',
    title: 'Total Empleados',
    value: '128',
    trend: '↗ +12 este mes',
    trendType: 'positive',
    subtitle: 'Minatitlán, Ver.',
    iconName: 'Users',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8'
  },
  {
    id: 'eventuales',
    title: 'Eventuales',
    value: '6',
    trend: '• 3 en evaluación',
    trendType: 'neutral',
    subtitle: 'Técnicos',
    iconName: 'Clock',
    iconBg: '#FEF3C7',
    iconColor: '#D97706'
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños Mes',
    value: '8',
    trend: 'Carlos Ruiz (4d)',
    trendType: 'neutral',
    subtitle: 'Ver Todo',
    iconName: 'Calendar',
    iconBg: '#CFFAFE',
    iconColor: '#0891B2'
  },
  {
    id: 'contratos-vencer',
    title: 'Contratos por Vencer',
    value: '5',
    trend: '• 2 urgentes (30d)',
    trendType: 'urgent',
    subtitle: 'Minatitlán, Ver.',
    iconName: 'AlertTriangle',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626'
  },
  {
    id: 'acreditados-sil',
    title: 'Personal Certificado',
    value: '42',
    fraction: '/ 58',
    trend: '100% Cuadrilla Base',
    trendType: 'positive',
    subtitle: 'Normativas STPS / F&G',
    iconName: 'ShieldCheck',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A'
  }
];

export const AGENDA_DAYS: AgendaDay[] = [
  {
    id: 'dia-1',
    isToday: true,
    badgeLabel: 'HOY',
    dayName: 'Viernes 25',
    dateStr: 'Sep',
    tasksCountText: '3 actividades',
    tasks: [
      {
        id: 'task-1',
        title: 'Inducción de Seguridad Industrial',
        status: 'Urgente',
        details: '2 técnicos asignados · Tula',
        category: 'SIL-3',
        time: '09:00 hrs',
        isDone: false
      },
      {
        id: 'task-2',
        title: 'Junta Operativa Minatitlán',
        status: 'Activo',
        details: 'Cuadrilla Base Mapachapa',
        category: 'Junta',
        time: '14:30 hrs',
        isDone: false
      },
      {
        id: 'task-3',
        title: 'Entrevista de Candidato Técnico',
        status: 'Pendiente',
        details: 'Ing. M. Torres · Mecatrónica',
        category: 'Entrevista',
        time: '16:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Turno A en curso'
  },
  {
    id: 'dia-2',
    badgeLabel: 'MAÑANA',
    dayName: 'Sábado 26',
    dateStr: 'Sep',
    tasksCountText: '2 actividades',
    tasks: [
      {
        id: 'task-4',
        title: 'Sesión de Inducción SGI',
        status: 'Activo',
        details: '3 nuevos colaboradores',
        category: 'Capacitación',
        time: '08:00 hrs',
        isDone: false
      },
      {
        id: 'task-5',
        title: 'Revisión de Expedientes Alta',
        status: 'Pendiente',
        details: 'Auditoría interna de ingresos',
        category: 'Expedientes',
        time: '11:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Turno matutino'
  },
  {
    id: 'dia-3',
    badgeLabel: 'DOMINGO',
    dayName: '27 Sep',
    dateStr: 'Sep',
    tasksCountText: '1 actividad',
    tasks: [
      {
        id: 'task-6',
        title: 'Cierre de Incidencias de Nómina',
        status: 'Activo',
        details: 'Revisión de incidencias quincenales',
        category: 'Nómina',
        time: '19:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Cierre quincenal'
  },
  {
    id: 'dia-4',
    badgeLabel: 'LUNES',
    dayName: '28 Sep',
    dateStr: 'Sep',
    tasksCountText: '2 actividades',
    tasks: [
      {
        id: 'task-7',
        title: 'Auditoría de Certificación Técnica',
        status: 'Urgente',
        details: 'Evaluación anual de normativas',
        category: 'Auditoría',
        time: '08:30 hrs',
        isDone: false
      },
      {
        id: 'task-8',
        title: 'Entrevista Instrumentación',
        status: 'Pendiente',
        details: 'Candidato: L. Fernández',
        category: 'Entrevista',
        time: '15:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Inicio de guardia semanal'
  },
  {
    id: 'dia-5',
    badgeLabel: 'MARTES',
    dayName: '29 Sep',
    dateStr: 'Sep',
    tasksCountText: '2 actividades',
    tasks: [
      {
        id: 'task-9',
        title: 'Mantenimiento Preventivo de Sensores',
        status: 'Activo',
        details: 'Laboratorio de Calibración',
        category: 'Revisión',
        time: '10:00 hrs',
        isDone: false
      },
      {
        id: 'task-10',
        title: 'Capacitación en Detección de Fuego',
        status: 'Pendiente',
        details: 'Personal nuevo ingreso',
        category: 'SIL-3',
        time: '16:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Turno matutino'
  },
  {
    id: 'dia-6',
    badgeLabel: 'MIÉRCOLES',
    dayName: '30 Sep',
    dateStr: 'Sep',
    tasksCountText: '1 actividad',
    tasks: [
      {
        id: 'task-11',
        title: 'Cierre de Bitácora Mensual',
        status: 'Pendiente',
        details: 'Revisión de horas y guardias',
        category: 'Auditoría',
        time: '13:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Cierre de mes'
  },
  {
    id: 'dia-7',
    badgeLabel: 'JUEVES',
    dayName: '01 Oct',
    dateStr: 'Oct',
    tasksCountText: '2 actividades',
    tasks: [
      {
        id: 'task-12',
        title: 'Planeación de Cuadrillas Quincenal',
        status: 'Activo',
        details: 'Jefaturas operativas F&G',
        category: 'Junta',
        time: '09:30 hrs',
        isDone: false
      },
      {
        id: 'task-13',
        title: 'Entrega de Resguardos y EPP',
        status: 'Pendiente',
        details: 'Almacén Minatitlán',
        category: 'Revisión',
        time: '14:00 hrs',
        isDone: false
      }
    ],
    footerNote: 'Nueva programación'
  }
];

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dep-01', name: 'Dirección', code: 'DEP-001', lead: 'Ing. Carlos Ortiz', employeeCount: 4, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Dirección general y gestión estratégica corporativa', createdAt: '01/01/2021' },
  { id: 'dep-02', name: 'Administración', code: 'DEP-002', lead: 'Lic. Claudia Morales', employeeCount: 9, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Gestión administrativa, tesorería y contabilidad', createdAt: '01/01/2021' },
  { id: 'dep-03', name: 'Calidad', code: 'DEP-003', lead: 'Ing. Fernando Ramos', employeeCount: 6, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Aseguramiento y control de calidad ISO / SIL-3', createdAt: '15/02/2021' },
  { id: 'dep-04', name: 'Compras', code: 'DEP-004', lead: 'Lic. Patricia Reyes', employeeCount: 5, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Adquisición de suministros, equipos e importaciones F&G', createdAt: '10/03/2021' },
  { id: 'dep-05', name: 'Almacén', code: 'DEP-005', lead: 'Manuel Cordero', employeeCount: 8, subsidiary: 'SIFYGSA', location: 'Base Mapachapa Km 18', status: 'active', description: 'Control de inventarios, resguardos y entrega de EPP', createdAt: '01/04/2021' },
  { id: 'dep-06', name: 'HSE', code: 'DEP-006', lead: 'Ing. Roberto Martínez Alor', employeeCount: 14, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Seguridad industrial, salud ocupacional y medio ambiente', createdAt: '01/01/2021' },
  { id: 'dep-07', name: 'Infraestructura', code: 'DEP-007', lead: 'Ing. Gabriel Solís', employeeCount: 7, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Mantenimiento de bases operativas y redes de telecomunicación', createdAt: '20/05/2021' },
  { id: 'dep-08', name: 'Ingeniería', code: 'DEP-008', lead: 'Ing. Agustín Anastacio', employeeCount: 22, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Diseño e integración de sistemas de detección de gas y fuego SIL-3', createdAt: '15/01/2021' },
  { id: 'dep-09', name: 'Medición y Control de Contratos', code: 'DEP-009', lead: 'Lic. Jorge Vázquez', employeeCount: 6, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Seguimiento de licitaciones, estimaciones y cumplimiento contractual', createdAt: '12/06/2021' },
  { id: 'dep-10', name: 'QHSE', code: 'DEP-010', lead: 'Ing. Mariana Delgado', employeeCount: 5, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Gestión integrada de calidad, seguridad y medio ambiente', createdAt: '05/07/2021' },
  { id: 'dep-11', name: 'Recursos Humanos', code: 'DEP-011', lead: 'Lic. Ana Martínez / Pablo Vázquez', employeeCount: 8, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Onboarding, nómina, altas de personal, acreditaciones y DC-3', createdAt: '01/01/2021' },
  { id: 'dep-12', name: 'Capacitación', code: 'DEP-012', lead: 'Lic. Sandra Domínguez', employeeCount: 4, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Formación continua técnica, normas STPS y rig pass', createdAt: '10/08/2021' },
  { id: 'dep-13', name: 'Servicios', code: 'DEP-013', lead: 'Ing. Mario Zúñiga', employeeCount: 16, subsidiary: 'SIFYGSA', location: 'Comalcalco, Tab.', status: 'active', description: 'Mantenimiento en campo, calibración y puestas en marcha', createdAt: '01/03/2021' },
  { id: 'dep-14', name: 'Ventas', code: 'DEP-014', lead: 'Ing. Raúl Pech', employeeCount: 7, subsidiary: 'SIFYGSA', location: 'Xalapa, Ver.', status: 'active', description: 'Comercialización de soluciones de seguridad y detección de flama', createdAt: '01/02/2021' },
  { id: 'dep-15', name: 'Definición de soluciones', code: 'DEP-015', lead: 'Ing. Alberto Cárdenas', employeeCount: 5, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Arquitectura de ingeniería previa y pruebas de aceptación FAT', createdAt: '18/09/2021' },
  { id: 'dep-16', name: 'GSAPE', code: 'DEP-016', lead: 'Ing. Víctor Fuentes', employeeCount: 3, subsidiary: 'SIFYGSA', location: 'Minatitlán, Ver.', status: 'active', description: 'Grupo de Soporte y Análisis de Proyectos Especiales F&G', createdAt: '01/10/2021' }
];

export const DEPARTMENTS: string[] = INITIAL_DEPARTMENTS.map((d) => d.name);

export const SUBSIDIARIES: Subsidiary[] = [
  { id: 'sifygsa', name: 'SIFYGSA', isDefault: true },
  { id: 'vipsa', name: 'VIPSA', isDefault: false }
];

export const LOCATIONS: LocationItem[] = [
  { id: 'mina', name: 'Minatitlán, Ver.', state: 'VER', city: 'Minatitlán', type: 'Almacén Principal' },
  { id: 'comal', name: 'Comalcalco, Tab.', state: 'TAB', city: 'Comalcalco', type: 'Base Operativa' },
  { id: 'xalapa', name: 'Xalapa, Ver.', state: 'VER', city: 'Xalapa', type: 'Corporativo Regional' },
  { id: 'mapa', name: 'Mapachapa, Ver.', state: 'VER', city: 'Minatitlán', type: 'Base de Sensores' },
  { id: 'carmen', name: 'Ciudad del Carmen, Camp.', state: 'CAMP', city: 'Ciudad del Carmen', type: 'Base Marina' },
  { id: 'merida', name: 'Mérida, Yuc.', state: 'YUC', city: 'Mérida', type: 'Almacén Península' }
];

export const EMPLOYEES: Employee[] = [
  {
    id: 'EMP-000',
    name: 'Adrián José Rodríguez Hernández',
    email: 'adrianjose1986@hotmail.com',
    initials: 'AR',
    avatarBg: '#0284C7',
    position: 'Supervisor de obra Sr',
    supervisor: 'José Adrián Velasco Bartolo',
    department: 'Servicios',
    subsidiary: 'SIFYGSA',
    location: 'SFG-C284-CT1',
    codeLocation: 'SFG-C284-CT1',
    squad: 'Cuadrilla Frente CT1',
    silStatus: 'Vigente SIL-3',
    silStatusType: 'success',
    hireDate: '01/06/2021',
    phonePrimary: '(922) 224-1996',
    phoneCell: '(922) 214-1194'
  },
  {
    id: 'EMP-001',
    name: 'Agustín Anastacio Martínez',
    email: 'agustin.anastacio@sifygsa.com.mx',
    initials: 'AM',
    avatarBg: '#1D4ED8',
    position: 'Director General',
    department: 'Dirección',
    subsidiary: 'SIFYGSA',
    location: 'Centro Norte',
    codeLocation: 'Centro Norte',
    squad: 'Dirección Corporativa',
    silStatus: 'Certificación Vigente',
    silStatusType: 'success',
    hireDate: '15/03/2021',
    phonePrimary: '(922) 224-1996',
    phoneCell: '(922) 120-1243'
  },
  {
    id: 'EMP-007',
    name: 'Alan Armando Montiel Rodríguez',
    email: 'alan.montiel@sifygsa.com.mx',
    initials: 'AM',
    avatarBg: '#475569',
    position: 'Auxiliar de TI Trainee',
    supervisor: 'Pablo Vázquez Culebro',
    department: 'Infraestructura',
    subsidiary: 'SIFYGSA',
    location: 'SFG-ADM-INFRA',
    codeLocation: 'SFG-ADM-INFRA',
    squad: 'Tecnología & Redes',
    silStatus: 'DC-3 Vigente',
    silStatusType: 'success',
    hireDate: '01/08/2023',
    phonePrimary: '(922) 224-1996',
    phoneCell: '(924) 242-9732'
  },
  {
    id: 'EMP-008',
    name: 'Aldo Carlos Pérez Sánchez',
    email: 'aldo.perez@sifygsa.com.mx',
    initials: 'AP',
    avatarBg: '#DC2626',
    position: 'Ingeniero de servicios senior',
    supervisor: 'Miguel Ángel Guzmán Reyes',
    department: 'Ingeniería',
    subsidiary: 'SIFYGSA',
    location: 'Minatitlán, Ver.',
    codeLocation: 'Minatitlán',
    squad: 'Cuadrilla Alfa SIL-3',
    silStatus: 'Vigente SIL-3',
    silStatusType: 'success',
    hireDate: '15/05/2022',
    phonePrimary: '(922) 224-1996',
    phoneCell: '(921) 101-3573'
  },
  {
    id: 'EMP-009',
    name: 'Alejandra Sujías Ricardez',
    email: 'alejandra.sujias@sifygsa.com.mx',
    initials: 'AS',
    avatarBg: '#BE185D',
    position: 'Auxiliar Administrativo Ss',
    supervisor: 'Erick Hernández Rueda',
    department: 'Servicios',
    subsidiary: 'SIFYGSA',
    location: 'SFG-C245-MSA',
    codeLocation: 'SFG-C245-MSA',
    squad: 'Administración en Campo',
    silStatus: 'DC-3 Vigente',
    silStatusType: 'success',
    hireDate: '10/01/2023',
    phonePrimary: '(922) 224-1996',
    phoneCell: '(933) 117-4872'
  },
  {
    id: 'EMP-002',
    name: 'Aurelio Palacios Xolo',
    email: 'aurelio.palacios@sifygsa.com.mx',
    initials: 'AP',
    avatarBg: '#059669',
    position: 'Gerente de Compras',
    department: 'Compras',
    subsidiary: 'SIFYGSA',
    location: 'Minatitlán, Ver.',
    squad: 'Almacén & Procura',
    silStatus: 'Certificación Vigente',
    silStatusType: 'success',
    hireDate: '10/08/2022'
  },
  {
    id: 'EMP-003',
    name: 'Carlos Alberto Tun Culebro',
    email: 'tunccarlos14@gmail.com',
    initials: 'CT',
    avatarBg: '#D97706',
    position: 'Generalista de Recursos Humanos',
    department: 'Recursos Humanos',
    subsidiary: 'SIFYGSA',
    location: 'Minatitlán, Ver.',
    squad: 'Staff Central',
    silStatus: 'DC-3 Acreditado',
    silStatusType: 'success',
    hireDate: '01/02/2023'
  },
  {
    id: 'EMP-004',
    name: 'Mtra. Sofía Morales Ruiz',
    email: 'sofia.morales@sifygsa.com.mx',
    initials: 'SM',
    avatarBg: '#7C3AED',
    position: 'Coordinadora de Seguridad & Normatividad',
    department: 'HSE',
    subsidiary: 'SIFYGSA',
    location: 'Minatitlán, Ver.',
    squad: 'Cuadrilla Alfa (Almacén Principal)',
    silStatus: 'Certificación Vigente',
    silStatusType: 'success',
    hireDate: '12/09/2022'
  },
  {
    id: 'EMP-005',
    name: 'Ing. Carlos Hernández',
    email: 'carlos.hernandez@sifygsa.com.mx',
    initials: 'CH',
    avatarBg: '#374151',
    position: 'Técnico en Detección de Gas',
    department: 'QHSE',
    subsidiary: 'SIFYGSA',
    location: 'Mapachapa, Ver.',
    squad: 'Operaciones F&G',
    silStatus: 'DC-3 Acreditado',
    silStatusType: 'success',
    hireDate: '04/09/2023'
  },
  {
    id: 'EMP-006',
    name: 'Ing. Roberto Méndez Cruz',
    email: 'roberto.mendez@sifygsa.com.mx',
    initials: 'RM',
    avatarBg: '#2563EB',
    position: 'Especialista en Automatización & Control',
    department: 'Medición y Control de Contratos',
    subsidiary: 'SIFYGSA',
    location: 'Comalcalco, Tab.',
    squad: 'Cuadrilla Bravo (Base Operativa)',
    silStatus: 'Por Renovar',
    silStatusType: 'warning',
    hireDate: '18/09/2024'
  },
  {
    id: 'EMP-010',
    name: 'Ing. Fernando Alarcón Paz',
    email: 'fernando.alarcon@sifygsa.com.mx',
    initials: 'FA',
    avatarBg: '#0891B2',
    position: 'Supervisor de Mantenimiento & Redes',
    department: 'Infraestructura',
    subsidiary: 'SIFYGSA',
    location: 'Xalapa, Ver.',
    squad: 'Regional Centro',
    silStatus: 'Certificación Vigente',
    silStatusType: 'success',
    hireDate: '15/01/2023'
  },
  {
    id: 'EMP-011',
    name: 'Lic. Mariana Valdez Soto',
    email: 'mariana.valdez@sifygsa.com.mx',
    initials: 'MV',
    avatarBg: '#DB2777',
    position: 'Analista de Capacitación & Anexos',
    department: 'Capacitación',
    subsidiary: 'SIFYGSA',
    location: 'Minatitlán, Ver.',
    squad: 'Staff Técnico',
    silStatus: 'Certificación Vigente',
    silStatusType: 'success',
    hireDate: '01/09/2024'
  }
];

