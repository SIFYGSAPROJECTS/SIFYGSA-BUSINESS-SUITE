// ============================================================
// /api/v1/rh/leaves — Solicitudes de Permisos / Vacaciones
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_LEAVE_REQUESTS } from "@/lib/data/rh";

/**
 * GET — Listar solicitudes de permisos/vacaciones
 * Query params: ?page=1&limit=10&status=Pendiente&type=Vacaciones&employeeId=emp_001
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_LEAVE_REQUESTS];

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((l) => l.status === status);
  }

  const type = searchParams.get("type");
  if (type) {
    filtered = filtered.filter((l) => l.type === type);
  }

  const employeeId = searchParams.get("employeeId");
  if (employeeId) {
    filtered = filtered.filter((l) => l.employeeId === employeeId);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nueva solicitud de permiso
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employeeId || !body.type || !body.startDate || !body.endDate || !body.reason) {
      return errorResponse(
        "Campos requeridos: employeeId, type, startDate, endDate, reason",
        400
      );
    }

    const newLeave = {
      id: `leave_${Date.now()}`,
      employeeId: body.employeeId,
      employeeName: body.employeeName || "Empleado",
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      days: body.days || 1,
      status: "Pendiente" as const,
      reason: body.reason,
      createdAt: new Date().toISOString(),
    };

    return successResponse(newLeave, "Solicitud creada exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
