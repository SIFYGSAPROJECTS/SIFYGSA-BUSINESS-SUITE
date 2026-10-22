// ============================================================
// /api/v1/rh/payroll — Nómina
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_PAYROLL } from "@/lib/data/rh";

/**
 * GET — Listar registros de nómina
 * Query params: ?page=1&limit=10&period=2026-09&status=Pagada&employeeId=emp_001
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_PAYROLL];

  const period = searchParams.get("period");
  if (period) {
    filtered = filtered.filter((p) => p.period === period);
  }

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  const employeeId = searchParams.get("employeeId");
  if (employeeId) {
    filtered = filtered.filter((p) => p.employeeId === employeeId);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * GET resumen de nómina del período activo
 */
export async function POST() {
  const currentPeriodPayroll = MOCK_PAYROLL.filter((p) => p.period === "2026-09");
  const summary = {
    period: "2026-09",
    totalEmployees: currentPeriodPayroll.length,
    totalBaseSalary: currentPeriodPayroll.reduce((sum, p) => sum + p.baseSalary, 0),
    totalOvertime: currentPeriodPayroll.reduce((sum, p) => sum + p.overtime, 0),
    totalDeductions: currentPeriodPayroll.reduce((sum, p) => sum + p.deductions, 0),
    totalTaxes: currentPeriodPayroll.reduce((sum, p) => sum + p.taxes, 0),
    totalNetPay: currentPeriodPayroll.reduce((sum, p) => sum + p.netPay, 0),
    currency: "MXN",
    status: "Procesada",
  };

  return successResponse(summary, "Resumen de nómina generado");
}
