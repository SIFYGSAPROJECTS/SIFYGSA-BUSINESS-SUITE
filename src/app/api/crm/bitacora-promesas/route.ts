import { NextRequest, NextResponse } from 'next/server';
import { NOMBRES_ROLES } from '@/config/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { obtenerSesionActual, manejarErrorApi } from '@/lib/auth';
import {
  listarBitacoraPorFolio,
  registrarMovimientoPromesaCrm,
  TIPOS_MOVIMIENTO_CRM,
  type TipoMovimientoCrm,
} from '@/lib/audit/crm-promesas';
import { registrarEventoAuditoria } from '@/lib/audit';

function obtenerIniciales(nombre: string): string {
  const partes = nombre
    .replace(/^(Ing\.|Lic\.|Arq\.|Mtro\.)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return 'SF';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) {
      return NextResponse.json({ exito: false, error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folio = searchParams.get('folio')?.trim();
    if (!folio) {
      return NextResponse.json(
        { exito: false, error: 'El parámetro folio es obligatorio.' },
        { status: 400 }
      );
    }

    const resultado = await listarBitacoraPorFolio(folio);
    return NextResponse.json({
      exito: true,
      datos: resultado.registros,
      origen: resultado.origen,
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
      id?: string;
      folio?: string;
      nombrePromesa?: string;
      clientePromesa?: string;
      tipo?: TipoMovimientoCrm;
      titulo?: string;
      campoEtiqueta?: string;
      valorAnterior?: string;
      valorNuevo?: string;
      texto?: string;
      esBot?: boolean;
    };

    if (!body.folio || !body.texto) {
      return NextResponse.json(
        { exito: false, error: 'folio y texto son campos requeridos.' },
        { status: 400 }
      );
    }

    const tipoValido: TipoMovimientoCrm =
      body.tipo && TIPOS_MOVIMIENTO_CRM.includes(body.tipo) ? body.tipo : 'movement';

    const esBot = Boolean(body.esBot);
    const autor = esBot ? 'SIFYGSA Bot' : sesion.nombre;
    const iniciales = esBot ? 'BOT' : obtenerIniciales(sesion.nombre);
    const rolEtiqueta = esBot ? 'Auditoría Automática' : NOMBRES_ROLES[sesion.rol];

    const { registro, origen } = await registrarMovimientoPromesaCrm({
      id: body.id,
      folio: body.folio,
      nombrePromesa: body.nombrePromesa,
      clientePromesa: body.clientePromesa,
      usuarioId: sesion.sub,
      autor,
      iniciales,
      rolEtiqueta,
      tipo: tipoValido,
      titulo: body.titulo,
      campoEtiqueta: body.campoEtiqueta,
      valorAnterior: body.valorAnterior,
      valorNuevo: body.valorNuevo,
      texto: body.texto,
      esBot,
    });

    // También reflejar modificaciones y movimientos importantes en la Bitácora General
    if (tipoValido === 'movement' || tipoValido === 'modification') {
      await registrarEventoAuditoria({
        usuarioId: sesion.sub,
        usuarioNombre: sesion.nombre,
        rol: sesion.rol,
        modulo: 'crm',
        tipoEvento: 'actualizacion',
        entidad: 'Promesa / Oportunidad CRM',
        entidadId: body.folio,
        detalle: body.campoEtiqueta
          ? `${body.campoEtiqueta}: "${body.valorAnterior ?? '-'}" → "${body.valorNuevo ?? '-'}" (${body.texto})`
          : body.texto,
      });
    }

    return NextResponse.json(
      { exito: true, datos: registro, origen },
      { status: 201 }
    );
  } catch (error) {
    return manejarErrorApi(error);
  }
}
