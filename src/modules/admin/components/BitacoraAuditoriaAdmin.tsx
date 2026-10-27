'use client';

import React, { useState } from 'react';
import {
  IDS_MODULOS,
  NOMBRES_ROLES,
  TIPOS_EVENTO_AUDITORIA,
  type EventoAuditoria,
  type IdModulo,
  type TipoEventoAuditoria,
} from '@/config/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ETIQUETAS_EVENTOS_AUDITORIA, ETIQUETAS_MODULOS } from '../constants';

export interface PropiedadesBitacoraAuditoriaAdmin {
  eventosIniciales: EventoAuditoria[];
  totalInicial: number;
}

export const BitacoraAuditoriaAdmin: React.FC<PropiedadesBitacoraAuditoriaAdmin> = ({
  eventosIniciales,
  totalInicial,
}) => {
  const [eventos, setEventos] = useState<EventoAuditoria[]>(eventosIniciales);
  const [total, setTotal] = useState(totalInicial);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(Math.max(1, Math.ceil(totalInicial / 10)));
  const [modulo, setModulo] = useState<IdModulo | 'auth' | 'todos'>('todos');
  const [tipoEvento, setTipoEvento] = useState<TipoEventoAuditoria | 'todos'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultarAuditoria = async (opciones: {
    nuevaPagina: number;
    nuevoModulo: IdModulo | 'auth' | 'todos';
    nuevoTipoEvento: TipoEventoAuditoria | 'todos';
    nuevaBusqueda: string;
  }) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        pagina: String(opciones.nuevaPagina),
        limite: '10',
        modulo: opciones.nuevoModulo,
        tipoEvento: opciones.nuevoTipoEvento,
        busqueda: opciones.nuevaBusqueda,
      });
      const res = await fetch(`/api/admin/auditoria?${params.toString()}`);
      const json = (await res.json()) as {
        exito: boolean;
        datos?: EventoAuditoria[];
        paginacion?: { total: number; totalPaginas: number };
      };
      if (json.exito && json.datos) {
        setEventos(json.datos);
        setTotal(json.paginacion?.total ?? json.datos.length);
        setTotalPaginas(json.paginacion?.totalPaginas ?? 1);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filtrar por usuario, entidad o detalle..."
            value={busqueda}
            onChange={(e) => {
              const nuevaBusqueda = e.target.value;
              setBusqueda(nuevaBusqueda);
              setPagina(1);
              void consultarAuditoria({
                nuevaPagina: 1,
                nuevoModulo: modulo,
                nuevoTipoEvento: tipoEvento,
                nuevaBusqueda,
              });
            }}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-primary)',
              minWidth: '240px',
            }}
          />
          <select
            value={modulo}
            onChange={(e) => {
              const nuevoModulo = e.target.value as IdModulo | 'auth' | 'todos';
              setModulo(nuevoModulo);
              setPagina(1);
              void consultarAuditoria({
                nuevaPagina: 1,
                nuevoModulo,
                nuevoTipoEvento: tipoEvento,
                nuevaBusqueda: busqueda,
              });
            }}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="todos">Todos los módulos</option>
            <option value="auth">Autenticación (Auth)</option>
            {IDS_MODULOS.map((m) => (
              <option key={m} value={m}>{ETIQUETAS_MODULOS[m]}</option>
            ))}
          </select>

          <select
            value={tipoEvento}
            onChange={(e) => {
              const nuevoTipoEvento = e.target.value as TipoEventoAuditoria | 'todos';
              setTipoEvento(nuevoTipoEvento);
              setPagina(1);
              void consultarAuditoria({
                nuevaPagina: 1,
                nuevoModulo: modulo,
                nuevoTipoEvento,
                nuevaBusqueda: busqueda,
              });
            }}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="todos">Todos los eventos</option>
            {TIPOS_EVENTO_AUDITORIA.map((t) => (
              <option key={t} value={t}>{ETIQUETAS_EVENTOS_AUDITORIA[t]}</option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
          {cargando ? 'Actualizando...' : `${total} registros en data/auditoria.json`}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.6rem' }}>Fecha / Hora</th>
              <th style={{ padding: '0.6rem' }}>Usuario / Rol</th>
              <th style={{ padding: '0.6rem' }}>Módulo</th>
              <th style={{ padding: '0.6rem' }}>Acción</th>
              <th style={{ padding: '0.6rem' }}>Entidad y Detalle</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '0.65rem 0.6rem', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                  {new Date(ev.fecha).toLocaleString('es-MX')}
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <strong>{ev.usuarioNombre}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {NOMBRES_ROLES[ev.rol]}
                  </div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <Badge variant="neutral">
                    {ev.modulo === 'auth' ? 'Seguridad / Auth' : ETIQUETAS_MODULOS[ev.modulo]}
                  </Badge>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <Badge
                    variant={
                      ev.tipoEvento === 'intento_fallido' || ev.tipoEvento === 'eliminacion' || ev.tipoEvento === 'rechazo'
                        ? 'danger'
                        : ev.tipoEvento === 'aprobacion' || ev.tipoEvento === 'creacion'
                        ? 'success'
                        : 'brand'
                    }
                  >
                    {ETIQUETAS_EVENTOS_AUDITORIA[ev.tipoEvento]}
                  </Badge>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <strong>{ev.entidad}</strong>
                  {ev.entidadId ? ` (${ev.entidadId})` : ''}: {ev.detalle}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Página {pagina} de {totalPaginas}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            tamano="sm"
            variante="secundario"
            disabled={pagina <= 1}
            onClick={() => {
              const nuevaPagina = pagina - 1;
              setPagina(nuevaPagina);
              void consultarAuditoria({
                nuevaPagina,
                nuevoModulo: modulo,
                nuevoTipoEvento: tipoEvento,
                nuevaBusqueda: busqueda,
              });
            }}
          >
            ← Anterior
          </Button>
          <Button
            tamano="sm"
            variante="secundario"
            disabled={pagina >= totalPaginas}
            onClick={() => {
              const nuevaPagina = pagina + 1;
              setPagina(nuevaPagina);
              void consultarAuditoria({
                nuevaPagina,
                nuevoModulo: modulo,
                nuevoTipoEvento: tipoEvento,
                nuevaBusqueda: busqueda,
              });
            }}
          >
            Siguiente →
          </Button>
        </div>
      </div>
    </div>
  );
};
