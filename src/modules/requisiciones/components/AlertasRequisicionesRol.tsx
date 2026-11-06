'use client';

import React from 'react';
import { NOMBRES_ROLES, type RolUsuario } from '@/config/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AlertaPendienteRequisicion } from '../types';

export interface PropiedadesAlertasRequisicionesRol {
  alertas: AlertaPendienteRequisicion[];
  rolUsuario: RolUsuario;
  alSeleccionarRequisicion: (requisicionId: string) => void;
}

export const AlertasRequisicionesRol: React.FC<PropiedadesAlertasRequisicionesRol> = ({
  alertas,
  rolUsuario,
  alSeleccionarRequisicion,
}) => {
  if (alertas.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1rem 1.2rem',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)',
        }}
      >
        ✓ No tienes requisiciones pendientes de atención o aprobación para tu rol ({NOMBRES_ROLES[rolUsuario]}).
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--warning-bg)',
        border: '1px solid var(--warning)',
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: 'var(--warning-text)', fontSize: '0.9rem' }}>
          ⚠ Alertas de Requisiciones Pendientes para tu Rol ({NOMBRES_ROLES[rolUsuario]}: {alertas.length})
        </strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
        {alertas.map((al) => (
          <div
            key={al.requisicionId}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                  {al.folio}
                </span>
                <Badge variant="warning">${al.total.toLocaleString('es-MX')} MXN</Badge>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {al.accionRequerida}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {al.solicitante} • {al.area}
              </div>
            </div>

            <Button
              tamano="sm"
              variante="primario"
              onClick={() => alSeleccionarRequisicion(al.requisicionId)}
            >
              Atender
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
