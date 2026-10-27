import { NextRequest, NextResponse } from 'next/server';
import type { ZonaComercial } from '@/config/types';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import {
  calcularMetricasCrm,
  obtenerDatosCrm,
} from '@/modules/crm/services/crm.service';

export async function GET(request: NextRequest) {
  try {
    await exigirPermiso('crm', 'ver');
    const { searchParams } = new URL(request.url);
    const zona = (searchParams.get('zona') ?? 'todas') as ZonaComercial | 'todas';

    const crm = await obtenerDatosCrm();
    const metricas = calcularMetricasCrm(crm.oportunidades, zona);

    return NextResponse.json({
      exito: true,
      datos: { crm, metricas },
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
