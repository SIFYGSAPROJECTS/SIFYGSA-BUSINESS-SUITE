// ============================================================
// /api/v1/crm/clients — CRUD Clientes
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_CLIENTS } from "@/lib/data/crm";

/**
 * GET — Listar clientes con paginación y filtros
 * Query params: ?page=1&limit=10&status=Activo&industry=Manufactura&search=regio
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_CLIENTS];

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }

  const industry = searchParams.get("industry");
  if (industry) {
    filtered = filtered.filter((c) =>
      c.industry.toLowerCase().includes(industry.toLowerCase())
    );
  }

  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nuevo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.companyName || !body.rfc || !body.contactName) {
      return errorResponse(
        "Campos requeridos: companyName, rfc, contactName",
        400
      );
    }

    const newClient = {
      id: `cli_${Date.now()}`,
      companyName: body.companyName,
      rfc: body.rfc,
      contactName: body.contactName,
      email: body.email || "",
      phone: body.phone || "",
      address: body.address || "",
      city: body.city || "",
      state: body.state || "",
      industry: body.industry || "",
      status: "Activo" as const,
      creditLimit: body.creditLimit || 0,
      balance: 0,
      currency: body.currency || "MXN",
      createdAt: new Date().toISOString(),
    };

    return successResponse(newClient, "Cliente creado exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
