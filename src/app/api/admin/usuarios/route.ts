import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import {
  crearNuevoUsuario,
  listarUsuariosPublicos,
} from '@/modules/admin/services/admin.service';
import type { EntradaCrearUsuario } from '@/modules/admin/types';

export async function GET() {
  try {
    await exigirPermiso('admin', 'ver');
    const usuarios = await listarUsuariosPublicos();
    return NextResponse.json({ exito: true, datos: usuarios });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('admin', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearUsuario;
    const creado = await crearNuevoUsuario(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creado }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
