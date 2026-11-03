import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import {
  listarMovimientosAlmacen,
  registrarMovimientoAlmacen,
} from '@/modules/almacen/services/almacen.service';
import type { MovimientoAlmacen } from '@/modules/almacen/types';

export async function GET() {
  try {
    await exigirPermiso('almacen', 'ver');
    const movimientos = await listarMovimientosAlmacen();
    return NextResponse.json({ exito: true, datos: movimientos });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await exigirPermiso('almacen', 'crear');
    const cuerpo = (await request.json()) as Omit<MovimientoAlmacen, 'id' | 'fecha'>;
    const creado = await registrarMovimientoAlmacen(cuerpo);
    return NextResponse.json({ exito: true, datos: creado }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

