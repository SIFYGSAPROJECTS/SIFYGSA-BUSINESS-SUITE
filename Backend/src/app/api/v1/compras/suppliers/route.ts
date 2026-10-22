// ============================================================
// /api/v1/compras/suppliers — CRUD Proveedores
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_SUPPLIERS } from "@/lib/data/compras";

/**
 * GET — Listar proveedores
 * Query params: ?page=1&limit=10&status=Activo&category=Tecnología&search=techmex
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_SUPPLIERS];

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }

  const category = searchParams.get("category");
  if (category) {
    filtered = filtered.filter((s) =>
      s.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.companyName.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        s.rfc.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nuevo proveedor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.companyName || !body.rfc || !body.contactName) {
      return errorResponse("Campos requeridos: companyName, rfc, contactName", 400);
    }

    const newSupplier = {
      id: `sup_${Date.now()}`,
      companyName: body.companyName,
      rfc: body.rfc,
      contactName: body.contactName,
      email: body.email || "",
      phone: body.phone || "",
      address: body.address || "",
      city: body.city || "",
      state: body.state || "",
      category: body.category || "General",
      rating: 0,
      status: "Activo" as const,
      paymentTerms: body.paymentTerms || "Contado",
      creditDays: body.creditDays || 0,
    };

    return successResponse(newSupplier, "Proveedor creado exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
