'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AREAS_OPERATIVAS,
  ESTADOS_REQUISICION,
  ETIQUETAS_ESTADO_REQUISICION,
  type AreaOperativa,
  type EstadoRequisicion,
} from '../constants';
import type { Requisicion } from '../types';
import {
  exportarRequisicionesExcel,
  exportarRequisicionesPdf,
} from '../utils/exportador-requisiciones';

export interface PropiedadesBandejaRequisiciones {
  requisiciones: Requisicion[];
  puedeExportar: boolean;
  cargando?: boolean;
  soloPropias?: boolean;
  nombreUsuarioActual?: string;
  idUsuarioActual?: string;
  alVerDetalle: (req: Requisicion) => void;
  alIrANueva?: () => void;
}

export const BandejaRequisiciones: React.FC<PropiedadesBandejaRequisiciones> = ({
  requisiciones,
  puedeExportar,
  cargando = false,
  soloPropias = false,
  alVerDetalle,
  alIrANueva,
}) => {
  const [estado, setEstado] = useState<EstadoRequisicion | 'todos'>('todos');
  const [area, setArea] = useState<AreaOperativa | 'todas'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [pagina, setPagina] = useState(1);
  const porPagina = 6;

  const filtradas = requisiciones.filter((r) => {
    if (estado !== 'todos' && r.estado !== estado) return false;
    if (area !== 'todas' && r.area !== area) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const coincide =
        r.folio.toLowerCase().includes(q) ||
        r.contrato.toLowerCase().includes(q) ||
        r.solicitante.toLowerCase().includes(q) ||
        r.justificacion.toLowerCase().includes(q) ||
        (r.descripcion ?? '').toLowerCase().includes(q);
      if (!coincide) return false;
    }
    if (fechaDesde && r.fechaCreacion.slice(0, 10) < fechaDesde) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  const obtenerVarianteInsignia = (est: EstadoRequisicion) => {
    switch (est) {
      case 'cierre':
        return 'success' as const;
      case 'rechazada':
      case 'cancelada':
        return 'danger' as const;
      case 'aprobacion':
      case 'revision':
        return 'warning' as const;
      default:
        return 'brand' as const;
    }
  };

  const estiloInput: React.CSSProperties = {
    padding: '0.45rem 0.7rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.15rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={soloPropias ? 'Buscar por folio, contrato o descripción...' : 'Filtrar por folio, solicitante o descripción...'}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            style={{ ...estiloInput, minWidth: '240px' }}
          />
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoRequisicion | 'todos');
              setPagina(1);
            }}
            style={estiloInput}
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS_REQUISICION.map((es) => (
              <option key={es} value={es}>
                {ETIQUETAS_ESTADO_REQUISICION[es]}
              </option>
            ))}
          </select>
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value as AreaOperativa | 'todas');
              setPagina(1);
            }}
            style={estiloInput}
          >
            <option value="todas">Todas las áreas</option>
            {AREAS_OPERATIVAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPagina(1);
            }}
            style={estiloInput}
            title="Fecha desde"
          />
        </div>

        {puedeExportar && (
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <Button tamano="sm" variante="secundario" onClick={() => void exportarRequisicionesExcel(filtradas)}>
              ↓ Excel (.xlsx)
            </Button>
            <Button tamano="sm" variante="secundario" onClick={() => exportarRequisicionesPdf(filtradas)}>
              ↓ PDF
            </Button>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.6rem' }}>Folio / Contrato</th>
              <th style={{ padding: '0.6rem' }}>Solicitante / Área</th>
              <th style={{ padding: '0.6rem' }}>Descripción y Justificación</th>
              <th style={{ padding: '0.6rem' }}>Estado del Flujo</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total (IVA inc.)</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Seguimiento</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skel-${idx}`} style={{ borderBottom: '1px solid var(--divider)' }}>
                  <td colSpan={6} style={{ padding: '0.85rem 0.6rem' }}>
                    <div
                      style={{
                        height: '18px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--surface-alt)',
                        opacity: 0.65,
                        width: `${85 - idx * 8}%`,
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : paginadas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Aún no tienes requisiciones
                  </div>
                  <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {requisiciones.length === 0
                      ? 'Crea tu primera solicitud de requisición para iniciar el flujo de revisión y seguimiento.'
                      : 'No se encontraron requisiciones que coincidan con los filtros seleccionados.'}
                  </p>
                  {alIrANueva && requisiciones.length === 0 && (
                    <Button tamano="sm" variante="primario" onClick={alIrANueva}>
                      + Nueva Requisición
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              paginadas.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                  <td style={{ padding: '0.65rem 0.6rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                      {r.folio}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.contrato}</div>
                  </td>
                  <td style={{ padding: '0.65rem 0.6rem' }}>
                    <strong>{r.solicitante}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.area}</div>
                  </td>
                  <td style={{ padding: '0.65rem 0.6rem', maxWidth: '320px' }}>
                    {r.descripcion && (
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.descripcion}</div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.justificacion}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {r.partidas.length} artículo(s) • Prioridad: {r.prioridad.toUpperCase()} • Req: {r.fechaRequerida}
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.6rem' }}>
                    <Badge variant={obtenerVarianteInsignia(r.estado)}>
                      {ETIQUETAS_ESTADO_REQUISICION[r.estado]}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>
                    ${r.total.toLocaleString('es-MX')} MXN
                  </td>
                  <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right' }}>
                    <Button tamano="sm" variante="primario" onClick={() => alVerDetalle(r)}>
                      Estado e Historial ({r.historial.length})
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!cargando && filtradas.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Mostrando {paginadas.length} de {filtradas.length} requisiciones (Pág. {paginaSegura}/{totalPaginas})
          </span>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <Button
              tamano="sm"
              variante="secundario"
              disabled={paginaSegura <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </Button>
            <Button
              tamano="sm"
              variante="secundario"
              disabled={paginaSegura >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
