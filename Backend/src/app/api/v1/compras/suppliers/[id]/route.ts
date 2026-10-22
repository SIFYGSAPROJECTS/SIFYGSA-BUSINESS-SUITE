// ============================================================
// /api/v1/compras/suppliers/[id] — Detalle / Editar proveedor
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_SUPPLIERS } from "@/lib/data/compras";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === id);

  if (!supplier) {
    return errorResponse(`Proveedor con ID "${id}" no encontrado.`, 404);
  }

  return successResponse(supplier);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === id);

  if (!supplier) {
    return errorResponse(`Proveedor con ID "${id}" no encontrado.`, 404);
  }

  try {
    const body = await request.json();
    const updated = {
      ...supplier,
      ...body,
      id: supplier.id,
    };

    return successResponse(updated, "Proveedor actualizado exitosamente");
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supplier = MOCK_SUPPLIERS.find((s) => s.id === id);

  if (!supplier) {
    return errorResponse(`Proveedor con ID "${id}" no encontrado.`, 404);
  }

  return successResponse({ id }, "Proveedor eliminado exitosamente");
}
