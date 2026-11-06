import { NextRequest, NextResponse } from 'next/server';
import type { MatrizPermisos } from '@/config/types';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { esquemaActualizarMatrizPermisos } from '@/modules/admin/schemas/admin.schema';
import {
  actualizarMatrizRolesPermisos,
  obtenerMatrizRolesPermisos,
} from '@/modules/admin/services/admin.service';

export async function GET() {
  try {
    await exigirPermiso('admin', 'ver');
    const matriz = await obtenerMatrizRolesPermisos();
    return NextResponse.json({ exito: true, datos: matriz });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await exigirPermiso('admin', 'editar');
    const cuerpo = (await request.json()) as unknown;
    const validado = esquemaActualizarMatrizPermisos.parse(cuerpo);
    const guardada = await actualizarMatrizRolesPermisos(
      validado.matriz as MatrizPermisos,
      actor
    );
    return NextResponse.json({ exito: true, datos: guardada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
