'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ETIQUETAS_TIPO_PERMISO,
  TIPOS_VACACIONES_PERMISO,
  type EstadoSolicitudRrhh,
  type TipoVacacionesPermiso,
} from '../constants';
import type {
  EmpleadoSeguroCliente,
  EntradaCrearVacacionesPermiso,
  VacacionesPermisoRrhh,
} from '../types';

export interface PropiedadesVacacionesPermisosRrhh {
  solicitudes: VacacionesPermisoRrhh[];
  empleados: EmpleadoSeguroCliente[];
  puedeCrear: boolean;
  puedeAprobar: boolean;
  alCrearSolicitud: (datos: EntradaCrearVacacionesPermiso) => Promise<void>;
  alDictaminar: (id: string, estado: EstadoSolicitudRrhh) => Promise<void>;
}

export const VacacionesPermisosRrhh: React.FC<PropiedadesVacacionesPermisosRrhh> = ({
  solicitudes,
  empleados,
  puedeCrear,
  puedeAprobar,
  alCrearSolicitud,
  alDictaminar,
}) => {
  const [empleadoId, setEmpleadoId] = useState(empleados[0]?.id ?? '');
  const [tipo, setTipo] = useState<TipoVacacionesPermiso>('vacaciones');
  const [fechaInicio, setFechaInicio] = useState('2026-11-20');
  const [fechaFin, setFechaFin] = useState('2026-11-25');
  const [dias, setDias] = useState(5);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = empleados.find((item) => item.id === empleadoId);
    if (!emp || !motivo.trim()) return;
    setGuardando(true);
    try {
      await alCrearSolicitud({
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        tipo,
        fechaInicio,
        fechaFin,
        dias: Number(dias),
        motivo,
      });
      setMotivo('');
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
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoVacacionesPermiso)} style={estiloCampo}>
            {TIPOS_VACACIONES_PERMISO.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_PERMISO[t]}</option>)}
          </select>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={estiloCampo} />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={estiloCampo} />
          <input type="number" min={1} max={30} value={dias} onChange={(e) => setDias(Number(e.target.value))} style={{ ...estiloCampo, width: '75px' }} />
          <input
            type="text"
            required
            placeholder="Motivo de vacaciones o permiso..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            style={{ ...estiloCampo, flex: 1, minWidth: '200px' }}
          />
          <Button type="submit" tamano="sm" variante="primario" cargando={guardando}>
            + Solicitar
          </Button>
        </form>
      )}

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {solicitudes.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{s.empleadoNombre}</strong>
                  <Badge variant="brand">{ETIQUETAS_TIPO_PERMISO[s.tipo]}</Badge>
                  <Badge variant={s.estado === 'aprobada' ? 'success' : s.estado === 'rechazada' ? 'danger' : 'warning'}>
                    {s.estado.toUpperCase()}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Del {s.fechaInicio} al {s.fechaFin} ({s.dias} día(s)) • {s.motivo}
                </div>
              </div>

              {puedeAprobar && s.estado === 'pendiente' && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Button tamano="sm" variante="exito" onClick={() => void alDictaminar(s.id, 'aprobada')}>
                    Aprobar
                  </Button>
                  <Button tamano="sm" variante="peligro" onClick={() => void alDictaminar(s.id, 'rechazada')}>
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
