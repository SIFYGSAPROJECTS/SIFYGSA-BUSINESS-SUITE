// ============================================================
// GET /api/v1/dashboard/summary — Resumen general del Dashboard
// ============================================================
import { successResponse } from "@/lib/api-helpers";
import type { DashboardSummary } from "@/lib/types";

export async function GET() {
  const summary: DashboardSummary = {
    revenue: {
      current: 12450000,
      previous: 11200000,
      currency: "MXN",
      trend: 11.16, // +11.16% vs mes anterior
    },
    expenses: {
      current: 8320000,
      previous: 7890000,
      currency: "MXN",
      trend: 5.45,
    },
    profit: {
      current: 4130000,
      previous: 3310000,
      currency: "MXN",
      trend: 24.77,
    },
    clients: {
      active: 1248,
      new: 47,
      trend: 3.8,
    },
    employees: {
      total: 342,
      onLeave: 8,
    },
    pendingApprovals: 14,
    recentActivities: [
      {
        id: "dash_act_001",
        type: "new_opportunity",
        module: "CRM",
        description: "Nueva oportunidad: Alimentos y Bebidas del Norte — $680,000 MXN",
        user: "Laura Sánchez",
        timestamp: "2026-10-02T08:30:00Z",
      },
      {
        id: "dash_act_002",
        type: "requisition_approved",
        module: "Compras",
        description: "Requisición REQ-2026-0045 aprobada por Carlos Mendoza",
        user: "Carlos Mendoza",
        timestamp: "2026-10-01T16:45:00Z",
      },
      {
        id: "dash_act_003",
        type: "leave_request",
        module: "RH",
        description: "Solicitud de vacaciones: Mariana Garza — 18/Nov al 29/Nov",
        user: "Mariana Garza",
        timestamp: "2026-10-02T08:00:00Z",
      },
      {
        id: "dash_act_004",
        type: "deal_won",
        module: "CRM",
        description: "Oportunidad ganada: Textiles y Confecciones Juárez — $350,000 MXN",
        user: "Carlos Mendoza",
        timestamp: "2026-09-30T12:00:00Z",
      },
      {
        id: "dash_act_005",
        type: "new_employee",
        module: "RH",
        description: "Nuevo ingreso: 5 colaboradores incorporados en octubre",
        user: "Roberto Díaz Herrera",
        timestamp: "2026-10-01T09:00:00Z",
      },
      {
        id: "dash_act_006",
        type: "purchase_order",
        module: "Compras",
        description: "OC-2026-0033 confirmada por proveedor Papelería Omega",
        user: "Sistema",
        timestamp: "2026-09-29T14:30:00Z",
      },
    ],
  };

  return successResponse(summary);
}
