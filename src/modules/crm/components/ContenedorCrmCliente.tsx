'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RolUsuario, ZonaComercial } from '@/config/types';
import type { DatosCrm, MetricasReporteCrm } from '../types';
import { HomeCRM } from '../pages/HomeCRM';
import { VistaModuloCrm } from './VistaModuloCrm';

export interface PropiedadesContenedorCrm {
  datosIniciales: DatosCrm;
  metricasIniciales: MetricasReporteCrm;
  rolUsuario: RolUsuario;
  zonaUsuario?: ZonaComercial;
}

export const ContenedorCrmCliente: React.FC<PropiedadesContenedorCrm> = ({
  datosIniciales,
  metricasIniciales,
  rolUsuario,
  zonaUsuario,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub');
  const folioParam = searchParams.get('folio') ?? undefined;

  // Si se accede a la ruta de detalle sin un folio/ID válido, redirige a Oportunidades
  useEffect(() => {
    if (subParam === 'crm-opportunity-detail' && !folioParam) {
      router.replace('/crm?sub=crm-opportunities');
    }
  }, [subParam, folioParam, router]);

  const subItemId =
    subParam === 'crm-opportunity-detail' && !folioParam
      ? 'crm-opportunities'
      : subParam ?? 'crm-opportunities';

  const abrirDetalleOportunidad = (folio: string) => {
    router.push(`/crm?sub=crm-opportunity-detail&folio=${encodeURIComponent(folio)}`);
  };

  const volverAOportunidades = () => {
    router.push('/crm?sub=crm-opportunities');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {subItemId === 'crm-avanzado' ? (
        <>
          <VistaModuloCrm
            datosIniciales={datosIniciales}
            metricasIniciales={metricasIniciales}
            rolUsuario={rolUsuario}
            zonaUsuario={zonaUsuario}
            alSeleccionarOportunidad={abrirDetalleOportunidad}
          />
          <HomeCRM
            subItemId="crm-opportunities"
            oportunidadesExtra={datosIniciales.oportunidades}
            alAbrirDetalle={abrirDetalleOportunidad}
            alVolverAOportunidades={volverAOportunidades}
          />
        </>
      ) : (
        <>
          <HomeCRM
            subItemId={subItemId}
            folioInicial={folioParam}
            oportunidadesExtra={datosIniciales.oportunidades}
            alAbrirDetalle={abrirDetalleOportunidad}
            alVolverAOportunidades={volverAOportunidades}
          />
          <VistaModuloCrm
            datosIniciales={datosIniciales}
            metricasIniciales={metricasIniciales}
            rolUsuario={rolUsuario}
            zonaUsuario={zonaUsuario}
            alSeleccionarOportunidad={abrirDetalleOportunidad}
          />
        </>
      )}
    </div>
  );
};
