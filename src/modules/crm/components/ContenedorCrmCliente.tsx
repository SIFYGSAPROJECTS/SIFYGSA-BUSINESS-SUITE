'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RolUsuario, ZonaComercial } from '@/config/types';
import type { DatosCrm, MetricasReporteCrm } from '../types';
import { HomeCRM } from '../pages/HomeCRM';

export interface PropiedadesContenedorCrm {
  datosIniciales: DatosCrm;
  metricasIniciales: MetricasReporteCrm;
  rolUsuario: RolUsuario;
  zonaUsuario?: ZonaComercial;
}

export const ContenedorCrmCliente: React.FC<PropiedadesContenedorCrm> = ({
  datosIniciales,
  rolUsuario,
  zonaUsuario,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub');
  const vistaParam = searchParams.get('vista');
  const folioParam = searchParams.get('folio') ?? undefined;

  let subItemId = subParam ?? 'crm-kanban';
  if (subParam === 'crm-avanzado') {
    if (vistaParam === 'reportes') subItemId = 'crm-reportes';
    else if (vistaParam === 'actividades') subItemId = 'crm-calendar';
    else if (vistaParam === 'clientes' || vistaParam === 'tabla' || vistaParam === 'oportunidades') subItemId = 'crm-opportunities';
    else subItemId = 'crm-kanban';
  }

  const abrirDetalleOportunidad = (folio: string) => {
    router.push(`/crm?sub=crm-opportunity-detail&folio=${encodeURIComponent(folio)}`);
  };

  const volverAOportunidades = () => {
    router.push('/crm?sub=crm-kanban');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <HomeCRM
        subItemId={subItemId}
        folioInicial={folioParam}
        oportunidadesExtra={datosIniciales.oportunidades}
        rolUsuario={rolUsuario}
        zonaUsuario={zonaUsuario}
        alAbrirDetalle={abrirDetalleOportunidad}
        alVolverAOportunidades={volverAOportunidades}
      />
    </div>
  );
};
