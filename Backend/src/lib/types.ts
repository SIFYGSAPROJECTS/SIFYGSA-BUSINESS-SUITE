// ============================================================
// SFG Business Suite — Tipos compartidos para el Backend
// ============================================================

// --- Respuestas estándar de API ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Auth ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER" | "RH_ADMIN" | "RH_USER";
  portal: "crm" | "rh";
  permissions: string[];
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  portal?: "crm" | "rh";
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// --- CRM ---
export interface CRMMetrics {
  activeClients: number;
  pipelineValue: number;
  closeRate: number;
  currency: string;
  newLeadsThisMonth: number;
  totalOpportunities: number;
  wonDeals: number;
  lostDeals: number;
}

export interface Opportunity {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  stage: "Prospección" | "Calificación" | "Propuesta Enviada" | "Negociación Final" | "Cerrada Ganada" | "Cerrada Perdida";
  estimatedValue: number;
  probability: number;
  currency: string;
  expectedCloseDate: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  companyName: string;
  rfc: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  industry: string;
  status: "Activo" | "Inactivo" | "Suspendido";
  creditLimit: number;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface CRMActivity {
  id: string;
  type: "Llamada" | "Email" | "Reunión" | "Nota" | "Tarea";
  title: string;
  description: string;
  relatedTo: string;
  relatedType: "client" | "opportunity";
  assignedTo: string;
  dueDate: string;
  status: "Pendiente" | "Completada" | "Cancelada";
  priority: "Alta" | "Media" | "Baja";
  createdAt: string;
}

// --- RH (Recursos Humanos) ---
export interface RHMetrics {
  totalEmployees: number;
  attendancePercentage: number;
  pendingRequests: number;
  activeVacations: number;
  newHiresThisMonth: number;
  turnoverRate: number;
  averageSeniority: number;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  status: "Activo" | "Vacaciones" | "Incapacidad" | "Baja";
  salary: number;
  currency: string;
  manager: string;
  location: string;
  birthDate: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  status: "Presente" | "Ausente" | "Retardo" | "Justificado";
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Vacaciones" | "Incapacidad" | "Permiso Personal" | "Día Económico";
  startDate: string;
  endDate: string;
  days: number;
  status: "Pendiente" | "Aprobada" | "Rechazada";
  approvedBy?: string;
  reason: string;
  createdAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  overtime: number;
  deductions: number;
  taxes: number;
  netPay: number;
  currency: string;
  status: "Pendiente" | "Procesada" | "Pagada";
  payDate: string;
}

// --- Compras ---
export interface Requisition {
  id: string;
  folio: string;
  requestedBy: string;
  department: string;
  description: string;
  items: RequisitionItem[];
  totalAmount: number;
  currency: string;
  priority: "Urgente" | "Alta" | "Normal" | "Baja";
  status: "Borrador" | "Pendiente" | "Aprobada" | "Rechazada" | "En Proceso" | "Completada";
  approvedBy?: string;
  createdAt: string;
  requiredDate: string;
}

export interface RequisitionItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  rfc: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  category: string;
  rating: number;
  status: "Activo" | "Inactivo" | "Bloqueado";
  paymentTerms: string;
  creditDays: number;
}

export interface PurchaseOrder {
  id: string;
  folio: string;
  supplierId: string;
  supplierName: string;
  requisitionId: string;
  items: RequisitionItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "Pendiente" | "Enviada" | "Confirmada" | "Recibida" | "Cancelada";
  deliveryDate: string;
  createdAt: string;
}

// --- Dashboard ---
export interface DashboardSummary {
  revenue: { current: number; previous: number; currency: string; trend: number };
  expenses: { current: number; previous: number; currency: string; trend: number };
  profit: { current: number; previous: number; currency: string; trend: number };
  clients: { active: number; new: number; trend: number };
  employees: { total: number; onLeave: number };
  pendingApprovals: number;
  recentActivities: DashboardActivity[];
}

export interface DashboardActivity {
  id: string;
  type: string;
  module: "CRM" | "RH" | "Compras" | "Sistema";
  description: string;
  user: string;
  timestamp: string;
}

// --- Settings ---
export interface SystemSettings {
  company: {
    name: string;
    rfc: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  modules: {
    id: string;
    name: string;
    enabled: boolean;
    version: string;
  }[];
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
  };
}
