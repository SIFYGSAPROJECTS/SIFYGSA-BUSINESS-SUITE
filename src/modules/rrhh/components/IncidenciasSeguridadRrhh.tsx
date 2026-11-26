'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ETIQUETAS_INCIDENCIA_RRHH,
  TIPOS_INCIDENCIA_RRHH,
  type TipoIncidenciaRrhh,
} from '../constants';
import type {
  EmpleadoSeguroCliente,
  EntradaCrearIncidenciaRrhh,
  IncidenciaRrhh,
} from '../types';

export interface PropiedadesIncidenciasSeguridadRrhh {
  incidencias: IncidenciaRrhh[];
  empleados: EmpleadoSeguroCliente[];
  puedeCrear: boolean;
  alRegistrarIncidencia: (datos: EntradaCrearIncidenciaRrhh) => Promise<void>;
}

export const IncidenciasSeguridadRrhh: React.FC<PropiedadesIncidenciasSeguridadRrhh> = ({
  incidencias,
  empleados,
  puedeCrear,
  alRegistrarIncidencia,
}) => {
  const [empleadoId, setEmpleadoId] = useState(empleados[0]?.id ?? '');
  const [tipo, setTipo] = useState<TipoIncidenciaRrhh>('vencimiento_dc3');
  const [severidad, setSeveridad] = useState<'alta' | 'media' | 'baja'>('alta');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = empleados.find((item) => item.id === empleadoId);
    if (!emp || !descripcion.trim()) return;
    setGuardando(true);
    try {
      await alRegistrarIncidencia({
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        fecha: new Date().toISOString().slice(0, 10),
        tipo,
        severidad,
        descripcion,
      });
      setDescripcion('');
    } finally {
      setGuardando(false);
    }
  };

  const estiloCampo: React.CSSProperties = {
    padding: '0.45rem 0.65rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {puedeCrear && (
        <form
          onSubmit={manejarCrear}
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.55rem',
            alignItems: 'center',
          }}
        >
          <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} style={estiloCampo}>
            {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoIncidenciaRrhh)} style={estiloCampo}>
            {TIPOS_INCIDENCIA_RRHH.map((t) => <option key={t} value={t}>{ETIQUETAS_INCIDENCIA_RRHH[t]}</option>)}
          </select>
          <select value={severidad} onChange={(e) => setSeveridad(e.target.value as 'alta' | 'media' | 'baja')} style={estiloCampo}>
            <option value="alta">Severidad Alta</option>
            <option value="media">Severidad Media</option>
            <option value="baja">Severidad Baja</option>
          </select>
          <input
            type="text"
            required
            placeholder="Detalle de incidencia STPS / DC-3 o falta..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ ...estiloCampo, flex: 1, minWidth: '220px' }}
          />
          <Button type="submit" tamano="sm" variante="primario" cargando={guardando}>
            + Reportar Incidencia
          </Button>
        </form>
      )}

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {incidencias.map((inc) => (
            <div
              key={inc.id}
              style={{
                padding: '0.8rem',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{inc.empleadoNombre}</strong>
                  <Badge variant={inc.severidad === 'alta' ? 'danger' : inc.severidad === 'media' ? 'warning' : 'success'}>
                    {ETIQUETAS_INCIDENCIA_RRHH[inc.tipo]}
                  </Badge>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>{inc.descripcion}</p>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{inc.fecha}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
