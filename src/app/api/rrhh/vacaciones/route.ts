import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import type { EstadoSolicitudRrhh } from '@/modules/rrhh/constants';
import {
  crearSolicitudVacacionesPermiso,
  dictaminarVacacionesPermiso,
} from '@/modules/rrhh/services/rrhh.service';
import type { EntradaCrearVacacionesPermiso } from '@/modules/rrhh/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('rrhh', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearVacacionesPermiso;
    const creada = await crearSolicitudVacacionesPermiso(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creada }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await exigirPermiso('rrhh', 'aprobar');
    const cuerpo = (await request.json()) as {
      id: string;
      estado: EstadoSolicitudRrhh;
    };
    const actualizada = await dictaminarVacacionesPermiso(
      cuerpo.id,
      cuerpo.estado,
      actor
    );
    return NextResponse.json({ exito: true, datos: actualizada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
