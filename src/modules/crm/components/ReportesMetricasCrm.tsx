'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { MetricasReporteCrm, OportunidadCrm } from '../types';
import {
  exportarOportunidadesExcel,
  exportarReporteCrmPdf,
} from '../utils/exportador-crm';

export interface PropiedadesReportesMetricasCrm {
  metricas: MetricasReporteCrm;
  oportunidades: OportunidadCrm[];
  puedeExportar: boolean;
}

export const ReportesMetricasCrm: React.FC<PropiedadesReportesMetricasCrm> = ({
  metricas,
  oportunidades,
  puedeExportar,
}) => {
  const maxVendedor = Math.max(
    1,
    ...metricas.ventasPorVendedor.map((v) => v.ganado + v.pipeline)
  );
  const maxZona = Math.max(
    1,
    ...metricas.ventasPorZona.map((z) => z.ganado + z.pipeline)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1rem 1.2rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Pipeline Activo</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900 }}>
              ${metricas.valorPipelineActivo.toLocaleString('es-MX')} MXN
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Ventas Ganadas</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--success)' }}>
              ${metricas.valorGanadoTotal.toLocaleString('es-MX')} MXN
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Tasa de Conversión</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)' }}>
              {metricas.tasaConversion}%
            </div>
          </div>
        </div>

        {puedeExportar && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              tamano="sm"
              variante="secundario"
              onClick={() => void exportarOportunidadesExcel(oportunidades)}
            >
              Exportar Excel (exceljs)
            </Button>
            <Button
              tamano="sm"
              variante="primario"
              onClick={() => exportarReporteCrmPdf(metricas, oportunidades)}
            >
              Exportar Reporte PDF
            </Button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800 }}>
            Ventas y Pipeline por Vendedor
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {metricas.ventasPorVendedor.map((v) => {
              const porcentaje = Math.round(((v.ganado + v.pipeline) / maxVendedor) * 100);
              return (
                <div key={v.vendedor}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <strong>{v.vendedor} ({v.oportunidades})</strong>
                    <span>Ganado: ${v.ganado.toLocaleString('es-MX')} | Pipeline: ${v.pipeline.toLocaleString('es-MX')}</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'var(--surface-alt)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${porcentaje}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800 }}>
            Desempeño por Zona Comercial
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {metricas.ventasPorZona.map((z) => {
              const porcentaje = Math.round(((z.ganado + z.pipeline) / maxZona) * 100);
              return (
                <div key={z.zona}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <strong>Zona {z.zona} ({z.oportunidades} opp.)</strong>
                    <span>Total: ${(z.ganado + z.pipeline).toLocaleString('es-MX')}</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'var(--surface-alt)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${porcentaje}%`, height: '100%', backgroundColor: 'var(--success)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800 }}>
            Evolución por Periodo (Ganado vs Proyectado Ponderado)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {metricas.ventasPorPeriodo.map((p) => (
              <div
                key={p.periodo}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.7rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-alt)',
                  fontSize: '0.82rem',
                }}
              >
                <strong style={{ fontFamily: 'monospace' }}>{p.periodo}</strong>
                <span>Ganado: ${p.ganado.toLocaleString('es-MX')}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  Ponderado: ${Math.round(p.proyectado).toLocaleString('es-MX')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
