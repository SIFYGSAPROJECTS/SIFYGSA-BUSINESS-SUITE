// ============================================================
// /api/v1/crm/opportunities — CRUD Oportunidades Comerciales
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_OPPORTUNITIES } from "@/lib/data/crm";

/**
 * GET — Listar oportunidades con paginación y filtros opcionales
 * Query params: ?page=1&limit=10&stage=Negociación Final&assignedTo=Ana
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_OPPORTUNITIES];

  // Filtro por etapa
  const stage = searchParams.get("stage");
  if (stage) {
    filtered = filtered.filter((o) => o.stage === stage);
  }

  // Filtro por asignado
  const assignedTo = searchParams.get("assignedTo");
  if (assignedTo) {
    filtered = filtered.filter((o) =>
      o.assignedTo.toLowerCase().includes(assignedTo.toLowerCase())
    );
  }

  // Búsqueda general
  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.company.toLowerCase().includes(q) ||
        o.contact.toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nueva oportunidad
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.company || !body.contact || !body.estimatedValue) {
      return errorResponse(
        "Campos requeridos: company, contact, estimatedValue",
        400
      );
    }

    const newOpportunity = {
      id: `opp_${Date.now()}`,
      company: body.company,
      contact: body.contact,
      email: body.email || "",
      phone: body.phone || "",
      stage: body.stage || "Prospección",
      estimatedValue: body.estimatedValue,
      probability: body.probability || 0.1,
      currency: body.currency || "MXN",
      expectedCloseDate: body.expectedCloseDate || "",
      assignedTo: body.assignedTo || "Sin asignar",
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // En un sistema real se guardaría en BD
    return successResponse(newOpportunity, "Oportunidad creada exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
