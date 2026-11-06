'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ZONAS_COMERCIALES, type RolUsuario, type ZonaComercial } from '@/config/types';
import { tienePermiso } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import type { DatosCrm, MetricasReporteCrm } from '../types';
import { KanbanCrm } from './KanbanCrm';
import { TablaOportunidadesCrm } from './TablaOportunidadesCrm';
import { DirectorioClientesCrm } from './DirectorioClientesCrm';
import { AgendaActividadesCrm } from './AgendaActividadesCrm';
import { ReportesMetricasCrm } from './ReportesMetricasCrm';
import { ModalOportunidadCrm } from './ModalOportunidadCrm';

type VistaCrm = 'kanban' | 'tabla' | 'clientes' | 'actividades' | 'reportes';
const VISTAS_VALIDAS_CRM: readonly VistaCrm[] = ['kanban', 'tabla', 'clientes', 'actividades', 'reportes'];

export interface PropiedadesVistaModuloCrm {
  datosIniciales: DatosCrm;
  metricasIniciales: MetricasReporteCrm;
  rolUsuario: RolUsuario;
  zonaUsuario?: ZonaComercial;
  alSeleccionarOportunidad?: (folio: string) => void;
}

export const VistaModuloCrm: React.FC<PropiedadesVistaModuloCrm> = ({
  datosIniciales,
  metricasIniciales,
  rolUsuario,
  zonaUsuario,
  alSeleccionarOportunidad,
}) => {
  const searchParams = useSearchParams();
  const vistaParam = searchParams.get('vista') as VistaCrm | null;
  const vistaUrl: VistaCrm =
    vistaParam && VISTAS_VALIDAS_CRM.includes(vistaParam) ? vistaParam : 'kanban';

  const [seleccionManual, setSeleccionManual] = useState<{
    urlBase: string | null;
    vista: VistaCrm;
  } | null>(null);
  const vista: VistaCrm =
    seleccionManual && seleccionManual.urlBase === vistaParam ? seleccionManual.vista : vistaUrl;
  const setVista = (nuevaVista: VistaCrm) =>
    setSeleccionManual({ urlBase: vistaParam, vista: nuevaVista });

  const [datos, setDatos] = useState<DatosCrm>(datosIniciales);
  const [metricas, setMetricas] = useState<MetricasReporteCrm>(metricasIniciales);
  const [zonaFiltro, setZonaFiltro] = useState<ZonaComercial | 'todas'>(
    rolUsuario === 'gerente' && zonaUsuario ? zonaUsuario : 'todas'
  );
  const [modalAbierto, setModalAbierto] = useState(false);

  const recargarCrm = async (zona: ZonaComercial | 'todas' = zonaFiltro) => {
    const res = await fetch(`/api/crm?zona=${zona}`);
    const json = (await res.json()) as {
      exito: boolean;
      datos?: { crm: DatosCrm; metricas: MetricasReporteCrm };
    };
    if (json.exito && json.datos) {
      setDatos(json.datos.crm);
      setMetricas(json.datos.metricas);
    }
  };

  const oportunidadesFiltradas =
    zonaFiltro === 'todas'
      ? datos.oportunidades
      : datos.oportunidades.filter((o) => o.zona === zonaFiltro);

  const puedeCrear = tienePermiso(rolUsuario, 'crm', 'crear');
  const puedeEditar = tienePermiso(rolUsuario, 'crm', 'editar');
  const puedeExportar = tienePermiso(rolUsuario, 'crm', 'exportar');

  const pestanas: { id: VistaCrm; etiqueta: string }[] = [
    { id: 'kanban', etiqueta: 'Pipeline Kanban (@dnd-kit)' },
    { id: 'tabla', etiqueta: `Oportunidades (${oportunidadesFiltradas.length})` },
    { id: 'clientes', etiqueta: `Clientes (${datos.clientes.length})` },
    { id: 'actividades', etiqueta: `Actividades (${datos.actividades.length})` },
    { id: 'reportes', etiqueta: 'Reportes y Métricas' },
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
            CRM Comercial &amp; Pipeline Industrial
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Gestión de oportunidades, clientes con historial, actividades y analítica por zona.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={zonaFiltro}
            onChange={(e) => {
              const nuevaZona = e.target.value as ZonaComercial | 'todas';
              setZonaFiltro(nuevaZona);
              void recargarCrm(nuevaZona);
            }}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <option value="todas">Vista Global: Todas las Zonas</option>
            {ZONAS_COMERCIALES.map((z) => (
              <option key={z} value={z}>Vista Gerente — Zona {z}</option>
            ))}
          </select>

          {puedeCrear && (
            <Button variante="primario" onClick={() => setModalAbierto(true)}>
              + Nueva Oportunidad
            </Button>
          )}
        </div>
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

      {vista === 'kanban' && (
        <KanbanCrm
          oportunidades={oportunidadesFiltradas}
          puedeEditar={puedeEditar}
          alSeleccionarOportunidad={alSeleccionarOportunidad}
          alMoverEtapa={async (idOpp, nuevaEtapa) => {
            await fetch('/api/crm/oportunidades', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: idOpp, etapa: nuevaEtapa }),
            });
            await recargarCrm();
          }}
        />
      )}

      {vista === 'tabla' && (
        <TablaOportunidadesCrm
          oportunidades={oportunidadesFiltradas}
          puedeCrear={puedeCrear}
          puedeExportar={puedeExportar}
          alSeleccionarOportunidad={alSeleccionarOportunidad}
          alImportarMasivo={async (filas) => {
            const res = await fetch('/api/crm/oportunidades', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filas }),
            });
            const json = (await res.json()) as {
              datos?: { importadas: number; errores: string[] };
            };
            await recargarCrm();
            return json.datos ?? { importadas: 0, errores: [] };
          }}
        />
      )}

      {vista === 'clientes' && (
        <DirectorioClientesCrm
          clientes={datos.clientes}
          puedeEditar={puedeEditar}
          alRegistrarInteraccion={async (clienteId, interaccion) => {
            await fetch('/api/crm/clientes', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clienteId, ...interaccion }),
            });
            await recargarCrm();
          }}
        />
      )}

      {vista === 'actividades' && (
        <AgendaActividadesCrm
          actividades={datos.actividades}
          puedeCrear={puedeCrear}
          alCrearActividad={async (nueva) => {
            await fetch('/api/crm/actividades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nueva),
            });
            await recargarCrm();
          }}
          alCambiarEstado={async (id, estado) => {
            await fetch('/api/crm/actividades', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, estado }),
            });
            await recargarCrm();
          }}
        />
      )}

      {vista === 'reportes' && (
        <ReportesMetricasCrm
          metricas={metricas}
          oportunidades={oportunidadesFiltradas}
          puedeExportar={puedeExportar}
        />
      )}

      <ModalOportunidadCrm
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        alGuardar={async (nueva) => {
          await fetch('/api/crm/oportunidades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nueva),
          });
          await recargarCrm();
        }}
      />
    </div>
  );
};
