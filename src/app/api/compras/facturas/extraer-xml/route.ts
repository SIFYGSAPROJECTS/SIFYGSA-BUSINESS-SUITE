import { NextResponse } from 'next/server';
import { parseCfdiXml } from '@/modules/compras/services/facturas';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let xmlText = '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No se envió ningún archivo XML.' }, { status: 400 });
      }
      xmlText = await file.text();
    } else {
      const body = await request.json();
      xmlText = body.xml || '';
    }

    if (!xmlText) {
      return NextResponse.json({ error: 'Contenido XML vacío o no válido.' }, { status: 400 });
    }

    const resultado = parseCfdiXml(xmlText);
    return NextResponse.json({ success: true, data: resultado });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido al procesar XML CFDI 4.0';
    return NextResponse.json({ success: false, error: mensaje }, { status: 422 });
  }
}
