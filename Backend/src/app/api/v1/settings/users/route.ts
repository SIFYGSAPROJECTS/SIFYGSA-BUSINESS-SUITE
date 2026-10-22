// ============================================================
// /api/v1/settings/users — Gestión de Usuarios del sistema
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_USERS } from "@/lib/data/users";

/**
 * GET — Listar todos los usuarios del sistema
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  // Excluir passwords de la respuesta
  let users = MOCK_USERS.map(({ password: _, ...user }) => user);

  const role = searchParams.get("role");
  if (role) {
    users = users.filter((u) => u.role === role);
  }

  const portal = searchParams.get("portal");
  if (portal) {
    users = users.filter((u) => u.portal === portal);
  }

  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  const total = users.length;
  const start = (page - 1) * limit;
  const paginated = users.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Crear nuevo usuario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.role) {
      return errorResponse("Campos requeridos: name, email, role", 400);
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role,
      portal: body.portal || "crm",
      permissions: body.permissions || [],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${body.name.split(" ").map((n: string) => n[0]).join("")}`,
      createdAt: new Date().toISOString(),
      lastLogin: "",
    };

    return successResponse(newUser, "Usuario creado exitosamente", 201);
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
