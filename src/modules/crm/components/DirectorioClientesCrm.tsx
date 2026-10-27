'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ETIQUETAS_TIPO_ACTIVIDAD,
  TIPOS_ACTIVIDAD_CRM,
  type TipoActividadCrm,
} from '../constants';
import type { ClienteCrm } from '../types';

export interface PropiedadesDirectorioClientesCrm {
  clientes: ClienteCrm[];
  puedeEditar: boolean;
  alRegistrarInteraccion: (
    clienteId: string,
    datos: { tipo: TipoActividadCrm; resumen: string }
  ) => Promise<void>;
}

export const DirectorioClientesCrm: React.FC<PropiedadesDirectorioClientesCrm> = ({
  clientes,
  puedeEditar,
  alRegistrarInteraccion,
}) => {
  const [clienteActivoId, setClienteActivoId] = useState<string>(clientes[0]?.id ?? '');
  const [tipoInteraccion, setTipoInteraccion] = useState<TipoActividadCrm>('llamada');
  const [resumen, setResumen] = useState('');
  const [guardando, setGuardando] = useState(false);

  const clienteSeleccionado = clientes.find((c) => c.id === clienteActivoId) ?? clientes[0];

  const manejarAgregarInteraccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSeleccionado || !resumen.trim()) return;
    setGuardando(true);
    try {
      await alRegistrarInteraccion(clienteSeleccionado.id, {
        tipo: tipoInteraccion,
        resumen,
      });
      setResumen('');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1.1rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.96rem', fontWeight: 800 }}>
          Directorio de Clientes y Contactos ({clientes.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {clientes.map((c) => {
            const activo = c.id === clienteSeleccionado?.id;
            return (
              <div
                key={c.id}
                onClick={() => setClienteActivoId(c.id)}
                style={{
                  padding: '0.8rem',
                  borderRadius: 'var(--radius-control)',
                  border: `1px solid ${activo ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: activo ? 'var(--brand-tonal-bg)' : 'var(--surface-alt)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.88rem' }}>{c.empresa}</strong>
                  <Badge variant={c.estatus === 'activo' ? 'success' : 'warning'}>{c.estatus}</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {c.contactoPrincipal} ({c.cargoContacto}) • {c.email}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  RFC: {c.rfc} | Zona: {c.zona} | Vendedor: {c.vendedorAsignado}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {clienteSeleccionado && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>
              Historial de Interacciones — {clienteSeleccionado.empresa}
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Tel: {clienteSeleccionado.telefono} | Industria: {clienteSeleccionado.industria}
            </p>
          </div>

          {puedeEditar && (
            <form onSubmit={manejarAgregarInteraccion} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: '6px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={tipoInteraccion}
                  onChange={(e) => setTipoInteraccion(e.target.value as TipoActividadCrm)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  {TIPOS_ACTIVIDAD_CRM.map((t) => (
                    <option key={t} value={t}>{ETIQUETAS_TIPO_ACTIVIDAD[t]}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Registrar nota de llamada, cita o acuerdo con el cliente..."
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                />
                <Button type="submit" tamano="sm" variante="primario" cargando={guardando}>
                  Registrar
                </Button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {clienteSeleccionado.interacciones.map((int) => (
              <div
                key={int.id}
                style={{
                  padding: '0.75rem',
                  borderLeft: '3px solid var(--primary)',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '0 6px 6px 0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <strong>{ETIQUETAS_TIPO_ACTIVIDAD[int.tipo]} • {int.autor}</strong>
                  <span>{new Date(int.fecha).toLocaleString('es-MX')}</span>
                </div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem' }}>{int.resumen}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
