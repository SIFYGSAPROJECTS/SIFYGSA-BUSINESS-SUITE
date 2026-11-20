import { NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { ComprasDashboardService } from '../../../../server/src/services/comprasDashboardService';

export async function GET() {
  try {
    await exigirPermiso('compras', 'ver');
    const datos = await ComprasDashboardService.obtenerMetricasDashboard();

    return NextResponse.json({
      exito: true,
      modulo: 'Compras & Procura',
      version: '2026.4',
      datos,
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

