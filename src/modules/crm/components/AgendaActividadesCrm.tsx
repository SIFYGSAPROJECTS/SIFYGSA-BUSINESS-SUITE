'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ETIQUETAS_TIPO_ACTIVIDAD,
  PRIORIDADES_CRM,
  TIPOS_ACTIVIDAD_CRM,
  VENDEDORES_DISPONIBLES,
  type EstadoActividadCrm,
  type PrioridadCrm,
  type TipoActividadCrm,
} from '../constants';
import type { ActividadCrm, EntradaCrearActividadCrm } from '../types';

export interface PropiedadesAgendaActividadesCrm {
  actividades: ActividadCrm[];
  puedeCrear: boolean;
  alCrearActividad: (datos: EntradaCrearActividadCrm) => Promise<void>;
  alCambiarEstado: (id: string, estado: EstadoActividadCrm) => Promise<void>;
}

export const AgendaActividadesCrm: React.FC<PropiedadesAgendaActividadesCrm> = ({
  actividades,
  puedeCrear,
  alCrearActividad,
  alCambiarEstado,
}) => {
  const [tipoFiltro, setTipoFiltro] = useState<TipoActividadCrm | 'todos'>('todos');
  const [tipo, setTipo] = useState<TipoActividadCrm>('llamada');
  const [titulo, setTitulo] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [responsable, setResponsable] = useState<string>(VENDEDORES_DISPONIBLES[0]);
  const [fechaLimite, setFechaLimite] = useState('2026-11-05');
  const [prioridad, setPrioridad] = useState<PrioridadCrm>('alta');
  const [guardando, setGuardando] = useState(false);

  const filtradas = actividades.filter(
    (a) => tipoFiltro === 'todos' || a.tipo === tipoFiltro
  );

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !clienteNombre.trim()) return;
    setGuardando(true);
    try {
      await alCrearActividad({
        tipo,
        titulo,
        descripcion: '',
        clienteNombre,
        responsable,
        fechaLimite,
        prioridad,
        estado: 'pendiente',
      });
      setTitulo('');
      setClienteNombre('');
    } finally {
      setGuardando(false);
    }
  };

  const estiloCampo: React.CSSProperties = {
    padding: '0.45rem 0.65rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
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
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoActividadCrm)} style={estiloCampo}>
            {TIPOS_ACTIVIDAD_CRM.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_ACTIVIDAD[t]}</option>)}
          </select>
          <input
            type="text"
            required
            placeholder="Título de tarea, llamada, cita o recordatorio..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ ...estiloCampo, flex: 1, minWidth: '210px' }}
          />
          <input
            type="text"
            required
            placeholder="Empresa / Cliente..."
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            style={estiloCampo}
          />
          <select value={responsable} onChange={(e) => setResponsable(e.target.value)} style={estiloCampo}>
            {VENDEDORES_DISPONIBLES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} style={estiloCampo} />
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as PrioridadCrm)} style={estiloCampo}>
            {PRIORIDADES_CRM.map((p) => <option key={p} value={p}>Prioridad {p}</option>)}
          </select>
          <Button type="submit" tamano="sm" variante="primario" cargando={guardando}>
            + Programar
          </Button>
        </form>
      )}

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <Button tamano="sm" variante={tipoFiltro === 'todos' ? 'primario' : 'secundario'} onClick={() => setTipoFiltro('todos')}>
            Todas ({actividades.length})
          </Button>
          {TIPOS_ACTIVIDAD_CRM.map((t) => (
            <Button key={t} tamano="sm" variante={tipoFiltro === t ? 'primario' : 'secundario'} onClick={() => setTipoFiltro(t)}>
              {ETIQUETAS_TIPO_ACTIVIDAD[t]}
            </Button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {filtradas.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant="brand">{ETIQUETAS_TIPO_ACTIVIDAD[act.tipo]}</Badge>
                  <strong style={{ textDecoration: act.estado === 'completada' ? 'line-through' : 'none' }}>
                    {act.titulo}
                  </strong>
                  <Badge variant={act.prioridad === 'alta' ? 'danger' : act.prioridad === 'media' ? 'warning' : 'neutral'}>
                    {act.prioridad}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Cliente: {act.clienteNombre} • Responsable: {act.responsable} • Vence: {act.fechaLimite}
                </div>
              </div>

              <Button
                tamano="sm"
                variante={act.estado === 'completada' ? 'secundario' : 'exito'}
                onClick={() => void alCambiarEstado(act.id, act.estado === 'completada' ? 'pendiente' : 'completada')}
              >
                {act.estado === 'completada' ? 'Reabrir' : '✓ Completar'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
