import { NextResponse } from 'next/server';
import { exigirSesion, manejarErrorApi } from '@/lib/auth';

export async function GET() {
  try {
    const sesion = await exigirSesion();
    return NextResponse.json({
      exito: true,
      datos: sesion,
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
