// ============================================================
// POST /api/v1/auth/login — Inicio de Sesión
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_USERS } from "@/lib/data/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, portal } = body;

    if (!username || !password) {
      return errorResponse("Usuario y contraseña son requeridos.", 400);
    }

    // Buscar usuario por email o username
    const user = MOCK_USERS.find(
      (u) =>
        (u.email === username || u.email.split("@")[0] === username) &&
        u.password === password
    );

    if (!user) {
      return errorResponse("Credenciales inválidas.", 401);
    }

    // Si se especificó un portal, verificar que el usuario tenga acceso
    if (portal && user.portal !== portal && user.role !== "ADMIN") {
      return errorResponse(`No tienes acceso al portal ${portal}.`, 403);
    }

    // Excluir password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return successResponse(
      {
        user: {
          ...userWithoutPassword,
          portal: portal || user.portal,
        },
        token: `mock-jwt-${user.id}-${Date.now()}`,
        refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
        expiresIn: 3600,
      },
      "Autenticación exitosa"
    );
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
