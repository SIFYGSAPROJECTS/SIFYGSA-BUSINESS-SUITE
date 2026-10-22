// ============================================================
// /api/v1/compras/requisitions/[id] — Detalle / Editar / Eliminar requisición
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_REQUISITIONS } from "@/lib/data/compras";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requisition = MOCK_REQUISITIONS.find((r) => r.id === id);

  if (!requisition) {
    return errorResponse(`Requisición con ID "${id}" no encontrada.`, 404);
  }

  return successResponse(requisition);
}

/**
 * PUT — Actualizar requisición (solo si está en Borrador o Pendiente)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requisition = MOCK_REQUISITIONS.find((r) => r.id === id);

  if (!requisition) {
    return errorResponse(`Requisición con ID "${id}" no encontrada.`, 404);
  }

  if (!["Borrador", "Pendiente"].includes(requisition.status)) {
    return errorResponse("Solo se pueden editar requisiciones en Borrador o Pendiente.", 400);
  }

  try {
    const body = await request.json();
    const updated = {
      ...requisition,
      ...body,
      id: requisition.id,
      folio: requisition.folio,
    };

    return successResponse(updated, "Requisición actualizada exitosamente");
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

/**
 * PATCH — Cambiar estado de la requisición (aprobar/rechazar/enviar)
 * Body: { action: "aprobar" | "rechazar" | "enviar", approvedBy?: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requisition = MOCK_REQUISITIONS.find((r) => r.id === id);

  if (!requisition) {
    return errorResponse(`Requisición con ID "${id}" no encontrada.`, 404);
  }

  try {
    const body = await request.json();
    const action = body.action;

    const statusMap: Record<string, string> = {
      enviar: "Pendiente",
      aprobar: "Aprobada",
      rechazar: "Rechazada",
      procesar: "En Proceso",
      completar: "Completada",
    };

    if (!action || !statusMap[action]) {
      return errorResponse(
        'El campo "action" debe ser: enviar, aprobar, rechazar, procesar o completar.',
        400
      );
    }

    const updated = {
      ...requisition,
      status: statusMap[action],
      ...(action === "aprobar" && { approvedBy: body.approvedBy || "Sistema" }),
    };

    return successResponse(updated, `Requisición ${action} exitosamente`);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requisition = MOCK_REQUISITIONS.find((r) => r.id === id);

  if (!requisition) {
    return errorResponse(`Requisición con ID "${id}" no encontrada.`, 404);
  }

  if (requisition.status !== "Borrador") {
    return errorResponse("Solo se pueden eliminar requisiciones en estado Borrador.", 400);
  }

  return successResponse({ id }, "Requisición eliminada exitosamente");
}
