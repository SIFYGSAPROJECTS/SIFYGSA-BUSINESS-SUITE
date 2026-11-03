import { NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { obtenerDatosAlmacen } from '@/modules/almacen/services/almacen.service';

export async function GET() {
  try {
    await exigirPermiso('almacen', 'ver');
    const datos = await obtenerDatosAlmacen();
    return NextResponse.json({
      exito: true,
      datos: {
        totalArticulos: datos.articulos.length,
        totalMovimientos: datos.movimientos.length,
        almacenes: datos.almacenes,
        version: '1.0.0',
      },
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

