'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { PuestoAreaRrhh } from '../types';

export interface PropiedadesPuestosAreasRrhh {
  puestos: PuestoAreaRrhh[];
}

export const PuestosAreasRrhh: React.FC<PropiedadesPuestosAreasRrhh> = ({ puestos }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: '1rem',
      }}
    >
      {puestos.map((p) => {
        const vacantes = Math.max(0, p.plazasAutorizadas - p.plazasOcupadas);
        return (
          <div
            key={p.id}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="brand">{p.nivelJerarquico}</Badge>
              {p.requiereSil3 && <Badge variant="warning">Certificación SIL-3</Badge>}
            </div>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '0.96rem', fontWeight: 800 }}>{p.puesto}</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.area}</p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.4rem',
                paddingTop: '0.55rem',
                borderTop: '1px solid var(--divider)',
                fontSize: '0.8rem',
              }}
            >
              <span>
                Ocupadas: <strong>{p.plazasOcupadas} / {p.plazasAutorizadas}</strong>
              </span>
              <span style={{ color: vacantes > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                {vacantes > 0 ? `${vacantes} vacante(s)` : 'Plantilla completa'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
