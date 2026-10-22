// ============================================================
// GET /api/v1/crm/metrics — Métricas del módulo CRM
// ============================================================
import { successResponse } from "@/lib/api-helpers";
import { MOCK_CRM_METRICS } from "@/lib/data/crm";

export async function GET() {
  return successResponse(MOCK_CRM_METRICS);
}
