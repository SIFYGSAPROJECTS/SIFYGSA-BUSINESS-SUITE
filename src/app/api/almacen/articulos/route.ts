import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import {
  listarArticulosAlmacen,
  registrarArticuloAlmacen,
} from '@/modules/almacen/services/almacen.service';
import type { Articulo } from '@/modules/almacen/types';

export async function GET() {
  try {
    await exigirPermiso('almacen', 'ver');
    const articulos = await listarArticulosAlmacen();
    return NextResponse.json({ exito: true, datos: articulos });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await exigirPermiso('almacen', 'crear');
    const cuerpo = (await request.json()) as Omit<Articulo, 'id' | 'fechaRegistro'>;
    const creado = await registrarArticuloAlmacen(cuerpo);
    return NextResponse.json({ exito: true, datos: creado }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

