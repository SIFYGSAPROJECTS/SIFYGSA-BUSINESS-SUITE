// ============================================================
// GET /api/v1/rh/metrics — Métricas de Recursos Humanos
// ============================================================
import { successResponse } from "@/lib/api-helpers";
import { MOCK_RH_METRICS } from "@/lib/data/rh";

export async function GET() {
  return successResponse(MOCK_RH_METRICS);
}
