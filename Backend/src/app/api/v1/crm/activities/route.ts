// ============================================================
// /api/v1/crm/activities — Actividades CRM (llamadas, emails, reuniones)
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_CRM_ACTIVITIES } from "@/lib/data/crm";

/**
 * GET — Listar actividades del CRM
 * Query params: ?page=1&limit=10&type=Llamada&status=Pendiente&priority=Alta
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_CRM_ACTIVITIES];

  const type = searchParams.get("type");
  if (type) {
    filtered = filtered.filter((a) => a.type === type);
  }

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }

  const priority = searchParams.get("priority");
  if (priority) {
    filtered = filtered.filter((a) => a.priority === priority);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nueva actividad
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.title) {
      return errorResponse("Campos requeridos: type, title", 400);
    }

    const newActivity = {
      id: `act_${Date.now()}`,
      type: body.type,
      title: body.title,
      description: body.description || "",
      relatedTo: body.relatedTo || "",
      relatedType: body.relatedType || "client",
      assignedTo: body.assignedTo || "Sin asignar",
      dueDate: body.dueDate || "",
      status: "Pendiente" as const,
      priority: body.priority || "Media",
      createdAt: new Date().toISOString(),
    };

    return successResponse(newActivity, "Actividad creada exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
