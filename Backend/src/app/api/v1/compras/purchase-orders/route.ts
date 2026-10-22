// ============================================================
// /api/v1/compras/purchase-orders — Órdenes de Compra
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, paginatedResponse, getPaginationParams } from "@/lib/api-helpers";
import { MOCK_PURCHASE_ORDERS } from "@/lib/data/compras";

/**
 * GET — Listar órdenes de compra
 * Query params: ?page=1&limit=10&status=Enviada&supplierId=sup_001
 */
export async function GET(request: NextRequest) {
  const { page, limit } = getPaginationParams(request);
  const { searchParams } = new URL(request.url);

  let filtered = [...MOCK_PURCHASE_ORDERS];

  const status = searchParams.get("status");
  if (status) {
    filtered = filtered.filter((po) => po.status === status);
  }

  const supplierId = searchParams.get("supplierId");
  if (supplierId) {
    filtered = filtered.filter((po) => po.supplierId === supplierId);
  }

  const search = searchParams.get("search");
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (po) =>
        po.folio.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return paginatedResponse(paginated, page, limit, total);
}

/**
 * POST — Resumen de compras del período
 */
export async function POST() {
  const summary = {
    totalOrders: MOCK_PURCHASE_ORDERS.length,
    totalAmount: MOCK_PURCHASE_ORDERS.reduce((sum, po) => sum + po.total, 0),
    byStatus: {
      pendiente: MOCK_PURCHASE_ORDERS.filter((po) => po.status === "Pendiente").length,
      enviada: MOCK_PURCHASE_ORDERS.filter((po) => po.status === "Enviada").length,
      confirmada: MOCK_PURCHASE_ORDERS.filter((po) => po.status === "Confirmada").length,
      recibida: MOCK_PURCHASE_ORDERS.filter((po) => po.status === "Recibida").length,
      cancelada: MOCK_PURCHASE_ORDERS.filter((po) => po.status === "Cancelada").length,
    },
    currency: "MXN",
  };

  return successResponse(summary, "Resumen de órdenes de compra");
}
