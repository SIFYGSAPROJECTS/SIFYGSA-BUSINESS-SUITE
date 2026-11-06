import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { crearEmpleadoRrhh } from '@/modules/rrhh/services/rrhh.service';
import type { EntradaCrearEmpleadoRrhh } from '@/modules/rrhh/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('rrhh', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearEmpleadoRrhh;
    const creado = await crearEmpleadoRrhh(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creado }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
