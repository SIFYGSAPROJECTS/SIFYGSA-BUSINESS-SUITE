// ============================================================
// GET /api/health — Health Check
// ============================================================
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "UP",
    system: "SFG Business Suite — Next.js API Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    modules: ["auth", "crm", "rh", "compras", "dashboard", "settings"],
  });
}
