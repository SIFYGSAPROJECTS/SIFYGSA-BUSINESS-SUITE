'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RolUsuario } from '@/config/types';
import { tienePermiso } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import type { DatosRrhhCliente } from '../types';
import { ExpedienteEmpleadosRrhh } from './ExpedienteEmpleadosRrhh';
import { PuestosAreasRrhh } from './PuestosAreasRrhh';
import { ControlAsistenciaRrhh } from './ControlAsistenciaRrhh';
import { VacacionesPermisosRrhh } from './VacacionesPermisosRrhh';
import { IncidenciasSeguridadRrhh } from './IncidenciasSeguridadRrhh';
import { NominaConfidencialRrhh } from './NominaConfidencialRrhh';

type VistaRrhh = 'empleados' | 'puestos' | 'asistencia' | 'vacaciones' | 'incidencias' | 'nomina';
const VISTAS_VALIDAS_RRHH: readonly VistaRrhh[] = [
  'empleados',
  'puestos',
  'asistencia',
  'vacaciones',
  'incidencias',
  'nomina',
];

export interface PropiedadesVistaModuloRrhh {
  datosIniciales: DatosRrhhCliente;
  rolUsuario: RolUsuario;
  vistaPorDefecto?: VistaRrhh;
}

export const VistaModuloRrhh: React.FC<PropiedadesVistaModuloRrhh> = ({
  datosIniciales,
  rolUsuario,
  vistaPorDefecto = 'empleados',
}) => {
  const searchParams = useSearchParams();
  const vistaParam = (searchParams.get('vista') ?? searchParams.get('sub')) as string | null;
  const mapaSubItems: Record<string, VistaRrhh> = {
    'rh-expedientes': 'empleados',
    'rh-organigrama': 'puestos',
    'rh-asistencia': 'asistencia',
    'rh-vacaciones': 'vacaciones',
    'rh-incidencias': 'incidencias',
    'rh-contratos': 'nomina',
    'rh-nomina': 'nomina',
  };
  const vistaUrl: VistaRrhh =
    vistaParam && VISTAS_VALIDAS_RRHH.includes(vistaParam as VistaRrhh)
      ? (vistaParam as VistaRrhh)
      : vistaParam && mapaSubItems[vistaParam]
      ? mapaSubItems[vistaParam]
      : vistaPorDefecto;

  const [seleccionManual, setSeleccionManual] = useState<{
    urlBase: string | null;
    vista: VistaRrhh;
  } | null>(null);
  const vista: VistaRrhh =
    seleccionManual && seleccionManual.urlBase === vistaParam ? seleccionManual.vista : vistaUrl;
  const setVista = (nuevaVista: VistaRrhh) =>
    setSeleccionManual({ urlBase: vistaParam, vista: nuevaVista });

  const [datos, setDatos] = useState<DatosRrhhCliente>(datosIniciales);

  const recargar = async () => {
    const res = await fetch('/api/rrhh');
    const json = (await res.json()) as { exito: boolean; datos?: DatosRrhhCliente };
    if (json.exito && json.datos) setDatos(json.datos);
  };

  const puedeCrear = tienePermiso(rolUsuario, 'rrhh', 'crear');
  const puedeAprobar = tienePermiso(rolUsuario, 'rrhh', 'aprobar');

  const pestanas: { id: VistaRrhh; etiqueta: string }[] = [
    { id: 'empleados', etiqueta: `Expediente (${datos.empleados.length})` },
    { id: 'puestos', etiqueta: `Puestos y Áreas (${datos.puestos.length})` },
    { id: 'asistencia', etiqueta: `Asistencia (${datos.asistencias.length})` },
    { id: 'vacaciones', etiqueta: `Vacaciones y Permisos (${datos.vacacionesPermisos.length})` },
    { id: 'incidencias', etiqueta: `Incidencias STPS (${datos.incidencias.length})` },
    { id: 'nomina', etiqueta: 'Nómina Confidencial' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1.1rem 1.3rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
            Recursos Humanos &amp; Cumplimiento STPS SIL-3
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Expedientes digitales, estructura de puestos, asistencia, vacaciones, incidencias y nómina protegida.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {pestanas.map((p) => (
            <Button
              key={p.id}
              tamano="sm"
              variante={vista === p.id ? 'primario' : 'secundario'}
              onClick={() => setVista(p.id)}
            >
              {p.etiqueta}
            </Button>
          ))}
        </div>
      </div>

      {vista === 'empleados' && (
        <ExpedienteEmpleadosRrhh
          empleados={datos.empleados}
          incluyeDatosSensibles={datos.incluyeDatosSensibles}
          puedeCrear={puedeCrear}
          alCrearEmpleado={async (nuevo) => {
            const res = await fetch('/api/rrhh/empleados', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nuevo),
            });
            const json = (await res.json()) as { exito: boolean; error?: string };
            if (!json.exito) throw new Error(json.error ?? 'Error al registrar colaborador');
            await recargar();
          }}
        />
      )}

      {vista === 'puestos' && <PuestosAreasRrhh puestos={datos.puestos} />}

      {vista === 'asistencia' && (
        <ControlAsistenciaRrhh
          asistencias={datos.asistencias}
          empleados={datos.empleados}
          puedeCrear={puedeCrear}
          alRegistrarAsistencia={async (nueva) => {
            await fetch('/api/rrhh/asistencia', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nueva),
            });
            await recargar();
          }}
        />
      )}

      {vista === 'vacaciones' && (
        <VacacionesPermisosRrhh
          solicitudes={datos.vacacionesPermisos}
          empleados={datos.empleados}
          puedeCrear={puedeCrear}
          puedeAprobar={puedeAprobar}
          alCrearSolicitud={async (nueva) => {
            await fetch('/api/rrhh/vacaciones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nueva),
            });
            await recargar();
          }}
          alDictaminar={async (id, estado) => {
            await fetch('/api/rrhh/vacaciones', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, estado }),
            });
            await recargar();
          }}
        />
      )}

      {vista === 'incidencias' && (
        <IncidenciasSeguridadRrhh
          incidencias={datos.incidencias}
          empleados={datos.empleados}
          puedeCrear={puedeCrear}
          alRegistrarIncidencia={async (nueva) => {
            await fetch('/api/rrhh/incidencias', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nueva),
            });
            await recargar();
          }}
        />
      )}

      {vista === 'nomina' && (
        <NominaConfidencialRrhh
          incluyeDatosSensibles={datos.incluyeDatosSensibles}
          nomina={datos.nomina}
        />
      )}
    </div>
  );
};
