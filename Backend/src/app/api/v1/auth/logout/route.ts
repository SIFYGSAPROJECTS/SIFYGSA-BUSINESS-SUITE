// ============================================================
// POST /api/v1/auth/logout — Cerrar sesión
// ============================================================
import { successResponse } from "@/lib/api-helpers";

export async function POST() {
  // En un sistema real, aquí se invalidaría el token/refresh token
  return successResponse(null, "Sesión cerrada exitosamente");
}
