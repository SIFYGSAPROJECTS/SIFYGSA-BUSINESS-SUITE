// ============================================================
// /api/v1/crm/opportunities/[id] — Detalle / Editar / Eliminar
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_OPPORTUNITIES } from "@/lib/data/crm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET — Obtener detalle de una oportunidad por ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const opportunity = MOCK_OPPORTUNITIES.find((o) => o.id === id);

  if (!opportunity) {
    return errorResponse(`Oportunidad con ID "${id}" no encontrada.`, 404);
  }

  return successResponse(opportunity);
}

/**
 * PUT — Actualizar una oportunidad
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const opportunity = MOCK_OPPORTUNITIES.find((o) => o.id === id);

  if (!opportunity) {
    return errorResponse(`Oportunidad con ID "${id}" no encontrada.`, 404);
  }

  try {
    const body = await request.json();
    const updated = {
      ...opportunity,
      ...body,
      id: opportunity.id, // No permitir cambiar ID
      updatedAt: new Date().toISOString(),
    };

    return successResponse(updated, "Oportunidad actualizada exitosamente");
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

/**
 * DELETE — Eliminar una oportunidad
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const opportunity = MOCK_OPPORTUNITIES.find((o) => o.id === id);

  if (!opportunity) {
    return errorResponse(`Oportunidad con ID "${id}" no encontrada.`, 404);
  }

  return successResponse({ id }, "Oportunidad eliminada exitosamente");
}
