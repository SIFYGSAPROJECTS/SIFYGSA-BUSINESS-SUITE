import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, exigirSesion, manejarErrorApi } from '@/lib/auth';
import {
  crearNuevaRequisicion,
  listarRequisicionesParaUsuario,
} from '@/modules/requisiciones/services/requisiciones.service';
import type { EntradaCrearRequisicion } from '@/modules/requisiciones/types';

export async function GET() {
  try {
    const actor = await exigirSesion();
    const requisiciones = await listarRequisicionesParaUsuario(actor);
    return NextResponse.json({ exito: true, datos: requisiciones });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('requisiciones', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearRequisicion;
    const creada = await crearNuevaRequisicion(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creada }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
