import { NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import { obtenerDatosRrhhSegurosPorRol } from '@/modules/rrhh/services/rrhh.service';

export async function GET() {
  try {
    const sesion = await exigirPermiso('rrhh', 'ver');
    const datos = await obtenerDatosRrhhSegurosPorRol(sesion.rol);
    return NextResponse.json({ exito: true, datos });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
