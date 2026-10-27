'use client';

import React, { useState } from 'react';
import { NOMBRES_ROLES } from '@/config/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ModalUniversal } from '@/components/ui/ModalUniversal';
import {
  ETIQUETAS_ESTADO_REQUISICION,
  type EstadoRequisicion,
} from '../constants';
import type { Requisicion } from '../types';

export interface PropiedadesModalHistorialRequisicion {
  requisicion: Requisicion | null;
  puedeAprobar: boolean;
  esSolicitante: boolean;
  alCerrar: () => void;
  alTransicionar: (
    id: string,
    nuevoEstado: EstadoRequisicion,
    comentario: string
  ) => Promise<void>;
}

const ETAPAS_LINEA_TIEMPO: { estado: EstadoRequisicion; titulo: string }[] = [
  { estado: 'solicitud', titulo: '1. Solicitud' },
  { estado: 'revision', titulo: '2. Revisión' },
  { estado: 'aprobacion', titulo: '3. Aprobación' },
  { estado: 'atencion', titulo: '4. Atención (OC)' },
  { estado: 'cierre', titulo: '5. Cerrada' },
];

const ORDEN_ETAPAS: Record<EstadoRequisicion, number> = {
  solicitud: 1,
  revision: 2,
  aprobacion: 3,
  atencion: 4,
  cierre: 5,
  rechazada: 0,
  cancelada: 0,
};

const SIGUIENTE_PASO: Partial<Record<EstadoRequisicion, { destino: EstadoRequisicion; boton: string }>> = {
  solicitud: { destino: 'revision', boton: 'Pasar a 2. En Revisión' },
  revision: { destino: 'aprobacion', boton: 'Enviar a 3. Aprobación por Nivel' },
  aprobacion: { destino: 'atencion', boton: 'Aprobar y Pasar a 4. Atención (OC)' },
  atencion: { destino: 'cierre', boton: 'Confirmar Entrega y 5. Cerrar Requisición' },
  rechazada: { destino: 'solicitud', boton: 'Reabrir como Solicitud' },
};

export const ModalHistorialRequisicion: React.FC<PropiedadesModalHistorialRequisicion> = ({
  requisicion,
  puedeAprobar,
  esSolicitante,
  alCerrar,
  alTransicionar,
}) => {
  const [comentario, setComentario] = useState('');
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!requisicion) return null;

  const pasoSiguiente = SIGUIENTE_PASO[requisicion.estado];
  const indiceActual = ORDEN_ETAPAS[requisicion.estado];
  const puedeCancelarSolicitante =
    esSolicitante &&
    (requisicion.estado === 'solicitud' || requisicion.estado === 'revision');

  const ejecutarTransicion = async (destino: EstadoRequisicion, textoComentario: string) => {
    if (!textoComentario.trim() || textoComentario.trim().length < 3) {
      setError('Ingresa un comentario o motivo de al menos 3 caracteres antes de continuar.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      await alTransicionar(requisicion.id, destino, textoComentario.trim());
      setComentario('');
      setMotivoCancelacion('');
      alCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado de la requisición');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ModalUniversal
      abierto={Boolean(requisicion)}
      alCerrar={alCerrar}
      titulo={`Requisición ${requisicion.folio} — Línea de Tiempo e Historial`}
      subtitulo={`${requisicion.solicitante} • ${requisicion.area} • Total: $${requisicion.total.toLocaleString('es-MX')} MXN`}
      anchoMaximo="760px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '6px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Línea de tiempo visual de las etapas */}
        <div
          style={{
            padding: '0.9rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <strong style={{ fontSize: '0.84rem' }}>
              Estado actual: {ETIQUETAS_ESTADO_REQUISICION[requisicion.estado]}
            </strong>
            <Badge variant="brand">Nivel: {requisicion.nivelAprobacionRequerido}</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(95px, 1fr))', gap: '0.45rem' }}>
            {ETAPAS_LINEA_TIEMPO.map((etapa, idx) => {
              const numEtapa = idx + 1;
              const completada = indiceActual > numEtapa;
              const activa = indiceActual === numEtapa;
              return (
                <div
                  key={etapa.estado}
                  style={{
                    padding: '0.5rem 0.55rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    fontWeight: activa || completada ? 800 : 600,
                    border: `1px solid ${
                      activa
                        ? 'var(--primary)'
                        : completada
                        ? 'rgba(16, 185, 129, 0.5)'
                        : 'var(--border)'
                    }`,
                    backgroundColor: activa
                      ? 'var(--brand-tonal-bg)'
                      : completada
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'var(--surface)',
                    color: activa
                      ? 'var(--primary)'
                      : completada
                      ? '#10b981'
                      : 'var(--text-secondary)',
                  }}
                >
                  {completada ? '✓ ' : ''}
                  {etapa.titulo}
                </div>
              );
            })}
          </div>

          {requisicion.descripcion && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {requisicion.descripcion}
            </div>
          )}
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {requisicion.justificacion}
          </p>
        </div>

        {/* Opción para que el solicitante cancele su requisición mientras no haya sido aprobada */}
        {puedeCancelarSolicitante && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
              Cancelar mi requisición (permitido antes de su aprobación)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Motivo de cancelación (ej. Cambio de especificación técnica)..."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '0.45rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />
              <Button
                tamano="sm"
                variante="peligro"
                cargando={cargando}
                onClick={() =>
                  void ejecutarTransicion(
                    'cancelada',
                    motivoCancelacion || 'Cancelada por la persona solicitante antes de aprobación.'
                  )
                }
              >
                Cancelar Requisición
              </Button>
            </div>
          </div>
        )}

        {/* Panel de revisión, aprobación y atención para roles autorizados */}
        {puedeAprobar && pasoSiguiente && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
              Comentario de Auditoría / Dictamen de Revisión o Aprobación
            </label>
            <input
              type="text"
              placeholder="Ej. Partidas verificadas contra presupuesto del contrato..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              style={{
                padding: '0.48rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                color: 'var(--text-primary)',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {requisicion.estado !== 'atencion' &&
                requisicion.estado !== 'rechazada' &&
                requisicion.estado !== 'cancelada' && (
                  <Button
                    tamano="sm"
                    variante="peligro"
                    cargando={cargando}
                    onClick={() => void ejecutarTransicion('rechazada', comentario)}
                  >
                    Rechazar Requisición
                  </Button>
                )}
              <Button
                tamano="sm"
                variante="primario"
                cargando={cargando}
                onClick={() => void ejecutarTransicion(pasoSiguiente.destino, comentario)}
              >
                {pasoSiguiente.boton}
              </Button>
            </div>
          </div>
        )}

        <div>
          <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.88rem', fontWeight: 800 }}>
            Historial de Eventos ({requisicion.historial.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {requisicion.historial.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: '0.65rem 0.8rem',
                  borderLeft: '3px solid var(--primary)',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '0 6px 6px 0',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                  <strong>
                    {h.usuarioNombre} ({NOMBRES_ROLES[h.rolUsuario]})
                  </strong>
                  <span>{new Date(h.fecha).toLocaleString('es-MX')}</span>
                </div>
                <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                  {h.estadoAnterior ? `${ETIQUETAS_ESTADO_REQUISICION[h.estadoAnterior]} → ` : ''}
                  {ETIQUETAS_ESTADO_REQUISICION[h.estadoNuevo]}
                </div>
                <p style={{ margin: '0.2rem 0 0' }}>{h.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalUniversal>
  );
};
