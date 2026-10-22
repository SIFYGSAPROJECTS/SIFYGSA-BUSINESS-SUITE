// ============================================================
// GET /api/v1/dashboard/charts — Datos para gráficas del Dashboard
// ============================================================
import { successResponse } from "@/lib/api-helpers";

export async function GET() {
  const chartsData = {
    // Ingresos mensuales (últimos 6 meses)
    revenueByMonth: [
      { month: "Mayo", value: 9800000 },
      { month: "Junio", value: 10500000 },
      { month: "Julio", value: 11100000 },
      { month: "Agosto", value: 10800000 },
      { month: "Septiembre", value: 11200000 },
      { month: "Octubre", value: 12450000 },
    ],

    // Pipeline por etapa (CRM)
    pipelineByStage: [
      { stage: "Prospección", count: 15, value: 3200000 },
      { stage: "Calificación", count: 12, value: 4800000 },
      { stage: "Propuesta Enviada", count: 8, value: 3600000 },
      { stage: "Negociación Final", count: 5, value: 2100000 },
      { stage: "Cerrada Ganada", count: 23, value: 8500000 },
      { stage: "Cerrada Perdida", count: 12, value: 4200000 },
    ],

    // Distribución de empleados por departamento
    employeesByDepartment: [
      { department: "Operaciones & Logística", count: 120 },
      { department: "Ventas & Comercial", count: 65 },
      { department: "Tecnología & Sistemas", count: 48 },
      { department: "Administración & Finanzas", count: 42 },
      { department: "Capital Humano", count: 28 },
      { department: "Dirección General", count: 12 },
      { department: "Otros", count: 27 },
    ],

    // Gastos por categoría (Compras)
    expensesByCategory: [
      { category: "Servicios Operativos", value: 3500000 },
      { category: "Materiales e Insumos", value: 2100000 },
      { category: "Tecnología", value: 1200000 },
      { category: "Nómina y Prestaciones", value: 8900000 },
      { category: "Mantenimiento", value: 680000 },
      { category: "Administrativos", value: 450000 },
    ],

    currency: "MXN",
  };

  return successResponse(chartsData);
}
