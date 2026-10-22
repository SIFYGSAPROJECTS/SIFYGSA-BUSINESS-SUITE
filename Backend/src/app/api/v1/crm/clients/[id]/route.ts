// ============================================================
// /api/v1/crm/clients/[id] — Detalle / Editar / Eliminar cliente
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_CLIENTS } from "@/lib/data/crm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const client = MOCK_CLIENTS.find((c) => c.id === id);

  if (!client) {
    return errorResponse(`Cliente con ID "${id}" no encontrado.`, 404);
  }

  return successResponse(client);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const client = MOCK_CLIENTS.find((c) => c.id === id);

  if (!client) {
    return errorResponse(`Cliente con ID "${id}" no encontrado.`, 404);
  }

  try {
    const body = await request.json();
    const updated = {
      ...client,
      ...body,
      id: client.id,
    };

    return successResponse(updated, "Cliente actualizado exitosamente");
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const client = MOCK_CLIENTS.find((c) => c.id === id);

  if (!client) {
    return errorResponse(`Cliente con ID "${id}" no encontrado.`, 404);
  }

  return successResponse({ id }, "Cliente eliminado exitosamente");
}
