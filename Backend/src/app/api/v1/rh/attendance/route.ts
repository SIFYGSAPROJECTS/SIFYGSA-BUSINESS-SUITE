// ============================================================
// /api/v1/rh/attendance — Registro de Asistencia
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_ATTENDANCE } from "@/lib/data/rh";

/**
 * GET — Listar registros de asistencia
 * Query params: ?page=1&limit=10&date=2026-10-01&status=Presente&employeeId=emp_001
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_ATTENDANCE];

  const date = searchParams.get("date");
  if (date) {
    filtered = filtered.filter((a) => a.date === date);
  }

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }

  const employeeId = searchParams.get("employeeId");
  if (employeeId) {
    filtered = filtered.filter((a) => a.employeeId === employeeId);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Registrar asistencia (check-in / check-out)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employeeId) {
      return errorResponse("Campo requerido: employeeId", 400);
    }

    const now = new Date();
    const newAttendance = {
      id: `att_${Date.now()}`,
      employeeId: body.employeeId,
      employeeName: body.employeeName || "Empleado",
      date: now.toISOString().split("T")[0],
      checkIn: body.checkIn || now.toTimeString().slice(0, 5),
      checkOut: body.checkOut || "",
      hoursWorked: body.hoursWorked || 0,
      status: body.status || "Presente",
      notes: body.notes,
    };

    return successResponse(newAttendance, "Asistencia registrada exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
