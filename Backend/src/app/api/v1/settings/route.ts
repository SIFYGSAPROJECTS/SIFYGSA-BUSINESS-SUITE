// ============================================================
// /api/v1/settings — Configuración del Sistema
// ============================================================
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import type { SystemSettings } from "@/lib/types";

const MOCK_SETTINGS: SystemSettings = {
  company: {
    name: "SIFYGSA — Servicios Integrales de Fumigación y Gases SA de CV",
    rfc: "SIF990812HN4",
    logo: "/logo-sifygsa.png",
    address: "Av. Eugenio Garza Sada 2501, Col. Tecnológico, C.P. 64849",
    phone: "+52 81 8358 2000",
    email: "contacto@sifygsa.com",
    website: "https://www.sifygsa.com",
  },
  modules: [
    { id: "dashboard", name: "Dashboard General", enabled: true, version: "1.0.0" },
    { id: "crm", name: "CRM — Gestión de Clientes", enabled: true, version: "1.0.0" },
    { id: "rh", name: "Capital Humano (RH)", enabled: true, version: "1.0.0" },
    { id: "compras", name: "Compras y Adquisiciones", enabled: true, version: "1.0.0" },
    { id: "inventario", name: "Inventario y Almacenes", enabled: false, version: "0.0.0" },
    { id: "facturacion", name: "Facturación Electrónica", enabled: false, version: "0.0.0" },
    { id: "proyectos", name: "Gestión de Proyectos", enabled: false, version: "0.0.0" },
    { id: "reportes", name: "Reportes y Business Intelligence", enabled: false, version: "0.0.0" },
  ],
  notifications: {
    emailEnabled: true,
    pushEnabled: false,
    smsEnabled: false,
  },
};

/**
 * GET — Obtener configuración actual del sistema
 */
export async function GET() {
  return successResponse(MOCK_SETTINGS);
}

/**
 * PUT — Actualizar configuración del sistema
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const updatedSettings = {
      ...MOCK_SETTINGS,
      ...body,
      company: {
        ...MOCK_SETTINGS.company,
        ...(body.company || {}),
      },
      notifications: {
        ...MOCK_SETTINGS.notifications,
        ...(body.notifications || {}),
      },
    };

    return successResponse(updatedSettings, "Configuración actualizada exitosamente");
  } catch {
    return errorResponse("Error al procesar la solicitud.", 500);
  }
}
