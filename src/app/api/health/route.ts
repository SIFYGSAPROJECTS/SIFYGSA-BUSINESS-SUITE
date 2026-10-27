import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    exito: true,
    datos: {
      estado: 'operativo',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
    },
  });
}
