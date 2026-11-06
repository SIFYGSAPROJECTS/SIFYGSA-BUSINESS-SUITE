import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { registrarIncidenciaRrhh } from '@/modules/rrhh/services/rrhh.service';
import type { EntradaCrearIncidenciaRrhh } from '@/modules/rrhh/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('rrhh', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearIncidenciaRrhh;
    const creada = await registrarIncidenciaRrhh(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creada }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
