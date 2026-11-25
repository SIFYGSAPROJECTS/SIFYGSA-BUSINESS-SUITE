import { NextRequest, NextResponse } from 'next/server';
import {
  IDS_MODULOS,
  TIPOS_EVENTO_AUDITORIA,
  type IdModulo,
  type TipoEventoAuditoria,
} from '@/config/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { consultarAuditoria, registrarEventoAuditoria } from '@/lib/audit';
import { exigirPermiso, manejarErrorApi, obtenerSesionActual } from '@/lib/auth';

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
      origen: resultado.origen,
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

export async function POST(request: NextRequest) {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) {
      return NextResponse.json({ exito: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = (await request.json()) as {
      modulo?: IdModulo | 'auth';
      tipoEvento?: TipoEventoAuditoria;
      entidad?: string;
      entidadId?: string;
      detalle?: string;
    };

    if (!body.modulo || !body.tipoEvento || !body.entidad || !body.detalle) {
      return NextResponse.json(
        { exito: false, error: 'modulo, tipoEvento, entidad y detalle son obligatorios.' },
        { status: 400 }
      );
    }

    const moduloValido: IdModulo | 'auth' =
      body.modulo === 'auth' || IDS_MODULOS.includes(body.modulo) ? body.modulo : 'almacen';
    const tipoValido: TipoEventoAuditoria = TIPOS_EVENTO_AUDITORIA.includes(body.tipoEvento)
      ? body.tipoEvento
      : 'creacion';

    const creado = await registrarEventoAuditoria({
      usuarioId: sesion.sub,
      usuarioNombre: sesion.nombre,
      rol: sesion.rol,
      modulo: moduloValido,
      tipoEvento: tipoValido,
      entidad: body.entidad,
      entidadId: body.entidadId,
      detalle: body.detalle,
    });

    return NextResponse.json({ exito: true, datos: creado }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
