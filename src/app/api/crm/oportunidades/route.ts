import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import type { EtapaOportunidad } from '@/modules/crm/constants';
import {
  actualizarEtapaOportunidadCrm,
  crearOportunidadCrm,
  importarOportunidadesMasivasCrm,
} from '@/modules/crm/services/crm.service';
import type { EntradaCrearOportunidad } from '@/modules/crm/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('crm', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearOportunidad;
    const creada = await crearOportunidadCrm(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creada }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await exigirPermiso('crm', 'editar');
    const cuerpo = (await request.json()) as { id: string; etapa: EtapaOportunidad };
    const actualizada = await actualizarEtapaOportunidadCrm(
      cuerpo.id,
      cuerpo.etapa,
      actor
    );
    return NextResponse.json({ exito: true, datos: actualizada });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await exigirPermiso('crm', 'crear');
    const cuerpo = (await request.json()) as { filas: EntradaCrearOportunidad[] };
    const resultado = await importarOportunidadesMasivasCrm(
      cuerpo.filas ?? [],
      actor
    );
    return NextResponse.json({ exito: true, datos: resultado });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
