'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { NominaRrhh } from '../types';

export interface PropiedadesNominaConfidencialRrhh {
  incluyeDatosSensibles: boolean;
  nomina: NominaRrhh[];
}

export const NominaConfidencialRrhh: React.FC<PropiedadesNominaConfidencialRrhh> = ({
  incluyeDatosSensibles,
  nomina,
}) => {
  if (!incluyeDatosSensibles) {
    return (
      <div
        style={{
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-card)',
          padding: '1.4rem',
          color: 'var(--danger-text)',
        }}
      >
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 800 }}>
          🔒 Información de Nómina y Salarios Protegida en Servidor
        </h3>
        <p style={{ margin: 0, fontSize: '0.84rem' }}>
          Por políticas de confidencialidad de datos personales, los montos de nómina, RFC, NSS y cuentas CLABE fueron filtrados en el servidor y no viajan al cliente para tu rol actual.
        </p>
      </div>
    );
  }

  const totalNeto = nomina.reduce((s, n) => s + n.netoPagar, 0);

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.15rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
            Nómina Quincenal Confidencial (Acceso exclusivo Admin / RRHH)
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Cálculo de percepciones, bonos de campo y retenciones ISR/IMSS.
          </p>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>
          Total Dispersión: ${totalNeto.toLocaleString('es-MX')} MXN
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.6rem' }}>Colaborador</th>
              <th style={{ padding: '0.6rem' }}>Periodo</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Sueldo Base</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Bono Campo</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Retenciones</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Neto a Pagar</th>
              <th style={{ padding: '0.6rem' }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {nomina.map((n) => (
              <tr key={n.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700 }}>{n.empleadoNombre}</td>
                <td style={{ padding: '0.65rem 0.6rem' }}>{n.periodo}</td>
                <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right' }}>${n.sueldoBase.toLocaleString('es-MX')}</td>
                <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right' }}>${n.bonoCampo.toLocaleString('es-MX')}</td>
                <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right', color: 'var(--danger)' }}>
                  -${n.deduccionesIsrImss.toLocaleString('es-MX')}
                </td>
                <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>
                  ${n.netoPagar.toLocaleString('es-MX')} MXN
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <Badge variant={n.estatus === 'dispersada' ? 'success' : 'warning'}>
                    {n.estatus.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
