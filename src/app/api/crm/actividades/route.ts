import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import type { EstadoActividadCrm } from '@/modules/crm/constants';
import {
  cambiarEstadoActividadCrm,
  crearActividadCrm,
} from '@/modules/crm/services/crm.service';
import type { EntradaCrearActividadCrm } from '@/modules/crm/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('crm', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearActividadCrm;
    const creada = await crearActividadCrm(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creada }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await exigirPermiso('crm', 'editar');
    const cuerpo = (await request.json()) as {
      id: string;
      estado: EstadoActividadCrm;
    };
    const actualizada = await cambiarEstadoActividadCrm(cuerpo.id, cuerpo.estado);
    return NextResponse.json({ exito: true, datos: actualizada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
