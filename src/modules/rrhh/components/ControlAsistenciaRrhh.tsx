'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SEDES_RRHH, type SedeRrhh } from '../constants';
import type { AsistenciaRrhh, EmpleadoSeguroCliente, EntradaCrearAsistenciaRrhh } from '../types';

export interface PropiedadesControlAsistenciaRrhh {
  asistencias: AsistenciaRrhh[];
  empleados: EmpleadoSeguroCliente[];
  puedeCrear: boolean;
  alRegistrarAsistencia: (datos: EntradaCrearAsistenciaRrhh) => Promise<void>;
}

export const ControlAsistenciaRrhh: React.FC<PropiedadesControlAsistenciaRrhh> = ({
  asistencias,
  empleados,
  puedeCrear,
  alRegistrarAsistencia,
}) => {
  const [empleadoId, setEmpleadoId] = useState(empleados[0]?.id ?? '');
  const [fecha, setFecha] = useState('2026-10-27');
  const [horaEntrada, setHoraEntrada] = useState('08:00');
  const [horaSalida, setHoraSalida] = useState('17:00');
  const [estatus, setEstatus] = useState<'presente' | 'retardo' | 'justificado' | 'ausente'>('presente');
  const [sede, setSede] = useState<SedeRrhh>('Refinería Minatitlán');
  const [guardando, setGuardando] = useState(false);

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = empleados.find((item) => item.id === empleadoId);
    if (!emp) return;
    setGuardando(true);
    try {
      await alRegistrarAsistencia({
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        fecha,
        horaEntrada,
        horaSalida,
        horasTrabajadas: estatus === 'ausente' ? 0 : 9,
        estatus,
        sede,
      });
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
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={estiloCampo} />
          <input type="time" value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} style={estiloCampo} />
          <input type="time" value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)} style={estiloCampo} />
          <select value={estatus} onChange={(e) => setEstatus(e.target.value as 'presente' | 'retardo' | 'justificado' | 'ausente')} style={estiloCampo}>
            <option value="presente">Presente</option>
            <option value="retardo">Retardo</option>
            <option value="justificado">Justificado</option>
            <option value="ausente">Ausente</option>
          </select>
          <select value={sede} onChange={(e) => setSede(e.target.value as SedeRrhh)} style={estiloCampo}>
            {SEDES_RRHH.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button type="submit" tamano="sm" variante="primario" cargando={guardando}>
            + Registrar Asistencia
          </Button>
        </form>
      )}

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.6rem' }}>Colaborador</th>
              <th style={{ padding: '0.6rem' }}>Fecha</th>
              <th style={{ padding: '0.6rem' }}>Sede</th>
              <th style={{ padding: '0.6rem' }}>Entrada / Salida</th>
              <th style={{ padding: '0.6rem' }}>Horas</th>
              <th style={{ padding: '0.6rem' }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700 }}>{a.empleadoNombre}</td>
                <td style={{ padding: '0.65rem 0.6rem' }}>{a.fecha}</td>
                <td style={{ padding: '0.65rem 0.6rem' }}>{a.sede}</td>
                <td style={{ padding: '0.65rem 0.6rem', fontFamily: 'monospace' }}>
                  {a.horaEntrada || '--:--'} - {a.horaSalida || '--:--'}
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>{a.horasTrabajadas} hrs</td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <Badge variant={a.estatus === 'presente' ? 'success' : a.estatus === 'retardo' ? 'warning' : 'danger'}>
                    {a.estatus.toUpperCase()}
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
