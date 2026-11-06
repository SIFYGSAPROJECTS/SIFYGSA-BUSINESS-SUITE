'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RolUsuario } from '@/config/types';
import { ComprasRequisicion } from '@/modules/compras/pages/ComprasRequisicion';
import type { Requisicion } from '../types';

export interface PropiedadesContenedorRequisiciones {
  requisicionesIniciales: Requisicion[];
  rolUsuario: RolUsuario;
  nombreUsuario: string;
  idUsuario?: string;
}

export const ContenedorRequisicionesCliente: React.FC<PropiedadesContenedorRequisiciones> = ({
  requisicionesIniciales,
  rolUsuario,
  nombreUsuario,
  idUsuario,
}) => {
  const searchParams = useSearchParams();
  const subItemId = searchParams.get('sub') ?? 'compras-requisicion';
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>(requisicionesIniciales);

  const recargarRequisiciones = async () => {
    const res = await fetch('/api/requisiciones');
    const json = (await res.json()) as { exito: boolean; datos?: Requisicion[] };
    if (json.exito && json.datos) {
      setRequisiciones(json.datos);
    }
  };

  return (
    <ComprasRequisicion
      key={subItemId}
      subItemId={subItemId}
      requisiciones={requisiciones}
      rolUsuario={rolUsuario}
      nombreUsuario={nombreUsuario}
      idUsuario={idUsuario}
      alRecargarRequisiciones={recargarRequisiciones}
    />
  );
};
