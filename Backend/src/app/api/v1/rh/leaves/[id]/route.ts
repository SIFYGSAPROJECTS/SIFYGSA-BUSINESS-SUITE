// ============================================================
// /api/v1/rh/leaves/[id] — Detalle / Aprobar / Rechazar solicitud
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_LEAVE_REQUESTS } from "@/lib/data/rh";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET — Obtener detalle de una solicitud
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const leave = MOCK_LEAVE_REQUESTS.find((l) => l.id === id);

  if (!leave) {
    return errorResponse(`Solicitud con ID "${id}" no encontrada.`, 404);
  }

  return successResponse(leave);
}

/**
 * PATCH — Aprobar o rechazar una solicitud
 * Body: { action: "aprobar" | "rechazar", approvedBy: "Nombre" }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const leave = MOCK_LEAVE_REQUESTS.find((l) => l.id === id);

  if (!leave) {
    return errorResponse(`Solicitud con ID "${id}" no encontrada.`, 404);
  }

  try {
    const body = await request.json();
    const action = body.action;

    if (!action || !["aprobar", "rechazar"].includes(action)) {
      return errorResponse('El campo "action" debe ser "aprobar" o "rechazar".', 400);
    }

    const updated = {
      ...leave,
      status: action === "aprobar" ? "Aprobada" : "Rechazada",
      approvedBy: body.approvedBy || "Sistema",
    };

    const message =
      action === "aprobar"
        ? "Solicitud aprobada exitosamente"
        : "Solicitud rechazada";

    return successResponse(updated, message);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

/**
 * DELETE — Cancelar una solicitud (solo si está pendiente)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const leave = MOCK_LEAVE_REQUESTS.find((l) => l.id === id);

  if (!leave) {
    return errorResponse(`Solicitud con ID "${id}" no encontrada.`, 404);
  }

  if (leave.status !== "Pendiente") {
    return errorResponse("Solo se pueden cancelar solicitudes pendientes.", 400);
  }

  return successResponse({ id }, "Solicitud cancelada exitosamente");
}
