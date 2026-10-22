// ============================================================
// GET /api/v1/auth/me — Verificar sesión / obtener usuario actual
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { MOCK_USERS } from "@/lib/data/users";

export async function GET(request: NextRequest) {
  // Simular verificación de token JWT
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Token de autorización requerido.", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  // Extraer user ID del token simulado (formato: mock-jwt-{userId}-{timestamp})
  const tokenParts = token.split("-");
  const userId = tokenParts.length >= 3 ? `${tokenParts[2]}_${tokenParts[3]}` : null;

  const user = userId
    ? MOCK_USERS.find((u) => u.id === userId)
    : MOCK_USERS[0]; // Fallback al admin

  if (!user) {
    return errorResponse("Sesión inválida o expirada.", 401);
  }

  const { password: _, ...userWithoutPassword } = user;

  return successResponse(userWithoutPassword, "Sesión válida");
}
