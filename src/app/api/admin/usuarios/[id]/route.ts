import { NextRequest, NextResponse } from 'next/server';
import { exigirPermiso, manejarErrorApi } from '@/lib/auth';
import {
  editarUsuarioExistente,
  restablecerPasswordUsuario,
} from '@/modules/admin/services/admin.service';
import type { EntradaEditarUsuario } from '@/modules/admin/types';

interface ContextoRuta {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: ContextoRuta) {
  try {
    const actor = await exigirPermiso('admin', 'editar');
    const { id } = await params;
    const cuerpo = (await request.json()) as EntradaEditarUsuario;
    const actualizado = await editarUsuarioExistente(id, cuerpo, actor);
    return NextResponse.json({ exito: true, datos: actualizado });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: NextRequest, { params }: ContextoRuta) {
  try {
    const actor = await exigirPermiso('admin', 'editar');
    const { id } = await params;
    const cuerpo = (await request.json()) as { nuevaPassword: string };
    await restablecerPasswordUsuario(id, cuerpo.nuevaPassword, actor);
    return NextResponse.json({
      exito: true,
      mensaje: 'Contraseña restablecida correctamente.',
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
