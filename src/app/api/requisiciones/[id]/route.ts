import { NextRequest, NextResponse } from 'next/server';
import { exigirSesion, manejarErrorApi } from '@/lib/auth';
import {
  actualizarRequisicionConBitacora,
  avanzarEstadoRequisicion,
} from '@/modules/requisiciones/services/requisiciones.service';
import type {
  EntradaActualizarRequisicion,
  EntradaTransicionRequisicion,
} from '@/modules/requisiciones/types';

interface ContextoRuta {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: ContextoRuta) {
  try {
    const actor = await exigirSesion();
    const { id } = await params;
    const cuerpo = (await request.json()) as EntradaActualizarRequisicion;
    const actualizada = await actualizarRequisicionConBitacora(id, cuerpo, actor);
    return NextResponse.json({ exito: true, datos: actualizada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: NextRequest, { params }: ContextoRuta) {
  try {
    const actor = await exigirSesion();
    const { id } = await params;
    const cuerpo = (await request.json()) as EntradaTransicionRequisicion;
    const actualizada = await avanzarEstadoRequisicion(id, cuerpo, actor);
    return NextResponse.json({ exito: true, datos: actualizada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
