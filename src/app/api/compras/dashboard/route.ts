import { NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { ComprasDashboardService } from '@/modules/compras/services/comprasDashboardService';

export async function GET() {
  try {
    // Exigir permiso de lectura para Compras
    await exigirPermiso('compras', 'ver');

    const datos = await ComprasDashboardService.obtenerMetricasDashboard();

    return NextResponse.json({
      exito: true,
      datos,
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
