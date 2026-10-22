// ============================================================
// /api/v1/compras/requisitions — CRUD Requisiciones de Compra
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_REQUISITIONS } from "@/lib/data/compras";

/**
 * GET — Listar requisiciones con paginación y filtros
 * Query params: ?page=1&limit=10&status=Pendiente&priority=Alta&department=Operaciones
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_REQUISITIONS];

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }

  const priority = searchParams.get("priority");
  if (priority) {
    filtered = filtered.filter((r) => r.priority === priority);
  }

  const department = searchParams.get("department");
  if (department) {
    filtered = filtered.filter((r) =>
      r.department.toLowerCase().includes(department.toLowerCase())
    );
  }

  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.folio.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nueva requisición
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.description || !body.department || !body.items || body.items.length === 0) {
      return errorResponse(
        "Campos requeridos: description, department, items (al menos 1)",
        400
      );
    }

    const totalAmount = body.items.reduce(
      (sum: number, item: { totalPrice?: number; quantity?: number; unitPrice?: number }) =>
        sum + (item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0)),
      0
    );

    const newRequisition = {
      id: `req_${Date.now()}`,
      folio: `REQ-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      requestedBy: body.requestedBy || "Usuario",
      department: body.department,
      description: body.description,
      items: body.items.map((item: { description: string; quantity: number; unit: string; unitPrice: number; category?: string }, index: number) => ({
        id: `item_${Date.now()}_${index}`,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        category: item.category || "General",
      })),
      totalAmount,
      currency: body.currency || "MXN",
      priority: body.priority || "Normal",
      status: "Borrador" as const,
      createdAt: new Date().toISOString(),
      requiredDate: body.requiredDate || "",
    };

    return successResponse(newRequisition, "Requisición creada exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
