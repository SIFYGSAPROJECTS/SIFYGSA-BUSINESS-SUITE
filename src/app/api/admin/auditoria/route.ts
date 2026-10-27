import { NextRequest, NextResponse } from 'next/server';
import type { IdModulo } from '@/config/types';
import { consultarAuditoria, type TipoEventoAuditoria } from '@/lib/audit';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await exigirPermiso('admin', 'ver');
    const { searchParams } = new URL(request.url);

    const pagina = Number(searchParams.get('pagina') ?? '1');
    const limite = Number(searchParams.get('limite') ?? '10');
    const modulo = (searchParams.get('modulo') ?? 'todos') as IdModulo | 'auth' | 'todos';
    const tipoEvento = (searchParams.get('tipoEvento') ?? 'todos') as TipoEventoAuditoria | 'todos';
    const busqueda = searchParams.get('busqueda') ?? '';

    const resultado = await consultarAuditoria({
      pagina,
      limite,
      modulo,
      tipoEvento,
      busqueda,
    });

    return NextResponse.json({
      exito: true,
      datos: resultado.eventos,
      paginacion: {
        pagina: resultado.pagina,
        limite: resultado.limite,
        total: resultado.total,
        totalPaginas: resultado.totalPaginas,
      },
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
