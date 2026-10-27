import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { registrarAsistenciaRrhh } from '@/modules/rrhh/services/rrhh.service';
import type { EntradaCrearAsistenciaRrhh } from '@/modules/rrhh/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('rrhh', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearAsistenciaRrhh;
    const creada = await registrarAsistenciaRrhh(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creada }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
