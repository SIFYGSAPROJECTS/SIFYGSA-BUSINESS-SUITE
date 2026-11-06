import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import type { TipoActividadCrm } from '@/modules/crm/constants';
import {
  crearClienteCrm,
  registrarInteraccionClienteCrm,
} from '@/modules/crm/services/crm.service';
import type { EntradaCrearCliente } from '@/modules/crm/types';

export async function POST(request: NextRequest) {
  try {
    const actor = await exigirPermiso('crm', 'crear');
    const cuerpo = (await request.json()) as EntradaCrearCliente;
    const creado = await crearClienteCrm(cuerpo, actor);
    return NextResponse.json({ exito: true, datos: creado }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await exigirPermiso('crm', 'editar');
    const cuerpo = (await request.json()) as {
      clienteId: string;
      tipo: TipoActividadCrm;
      resumen: string;
    };
    const actualizado = await registrarInteraccionClienteCrm(
      cuerpo.clienteId,
      { tipo: cuerpo.tipo, resumen: cuerpo.resumen },
      actor
    );
    return NextResponse.json({ exito: true, datos: actualizado });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
