'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { NOMBRES_ROLES, type RolUsuario } from '@/config/types';
import { HomeRH } from '@/modules/rh/pages/HomeRH';
import { SettingsPage } from '@/modules/settings/pages/SettingsPage';
import type { DatosRrhhCliente } from '../types';
import { VistaModuloRrhh } from './VistaModuloRrhh';

export interface PropiedadesContenedorRrhh {
  datosIniciales: DatosRrhhCliente;
  rolUsuario: RolUsuario;
  nombreUsuario: string;
  emailUsuario: string;
}

export const ContenedorRrhhCliente: React.FC<PropiedadesContenedorRrhh> = ({
  datosIniciales,
  rolUsuario,
  nombreUsuario,
  emailUsuario,
}) => {
  const searchParams = useSearchParams();
  const subItemId = searchParams.get('sub') ?? 'rh-directorio';

  if (subItemId === 'rh-ajustes') {
    return (
      <SettingsPage
        user={{
          name: nombreUsuario,
          email: emailUsuario,
          role: NOMBRES_ROLES[rolUsuario],
        }}
      />
    );
  }

  const esSubvistaModulo = [
    'rh-expedientes',
    'rh-organigrama',
    'rh-asistencia',
    'rh-incidencias',
    'rh-vacaciones',
    'rh-contratos',
    'rh-nomina',
  ].includes(subItemId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {esSubvistaModulo ? (
        <>
          <VistaModuloRrhh
            datosIniciales={datosIniciales}
            rolUsuario={rolUsuario}
          />
          <HomeRH />
        </>
      ) : (
        <>
          <HomeRH />
          <VistaModuloRrhh
            datosIniciales={datosIniciales}
            rolUsuario={rolUsuario}
          />
        </>
      )}
    </div>
  );
};
