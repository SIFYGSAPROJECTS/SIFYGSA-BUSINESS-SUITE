export type Theme = 'light' | 'dark';

export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  badge?: string;
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface NavModule {
  id: string;
  title: string;
  iconName: string;
  path?: string;
  subItems?: SubMenuItem[];
}

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  fraction?: string;
  trend: string;
  trendType: 'positive' | 'neutral' | 'urgent';
  subtitle: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
}

export interface AgendaTask {
  id: string;
  title: string;
  status: 'Urgente' | 'Activo' | 'Pendiente' | 'Completado';
  details: string;
  category: 'SIL-3' | 'Junta' | 'Entrevista' | 'Guardia' | 'Revisión' | 'Auditoría' | 'Capacitación' | 'Expedientes' | 'Nómina' | 'Festivo';
  time: string;
  isDone?: boolean;
}

export interface AgendaDay {
  id: string;
  badgeLabel?: string;
  dayName: string;
  dateStr: string;
  tasksCountText: string;
  tasks: AgendaTask[];
  footerNote?: string;
  isToday?: boolean;
}

export interface Subsidiary {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface LocationItem {
  id: string;
  name: string;
  state: string;
  city: string;
  type: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  emailPersonal?: string;
  initials: string;
  avatarBg: string;
  position: string;
  department: string;
  subsidiary?: string;
  location: string;
  squad: string;
  silStatus: 'Vigente SIL-3' | 'DC-3 Vigente' | 'Por Renovar' | 'En Trámite' | 'Certificación Vigente' | 'DC-3 Acreditado' | string;
  silStatusType: 'success' | 'warning' | 'info';
  hireDate: string;
  photoUrl?: string;
  phonePrimary?: string;
  phoneCell?: string;
  supervisor?: string;
  codeLocation?: string;
  address?: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  salary?: string;
  contractType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
  bank?: string;
  clabe?: string;
  bloodType?: string;
  shoeSize?: string;
  coverallSize?: string;
  allergies?: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  lead: string;
  employeeCount: number;
  subsidiary: string;
  location: string;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: string;
}
