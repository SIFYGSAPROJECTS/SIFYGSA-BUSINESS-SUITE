'use client';

import React from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  COLORES_ETAPAS,
  ETAPAS_OPORTUNIDAD,
  ETIQUETAS_ETAPAS,
  type EtapaOportunidad,
} from '../constants';
import type { OportunidadCrm } from '../types';

export interface PropiedadesKanbanCrm {
  oportunidades: OportunidadCrm[];
  puedeEditar: boolean;
  alMoverEtapa: (idOportunidad: string, nuevaEtapa: EtapaOportunidad) => Promise<void>;
  alSeleccionarOportunidad?: (folio: string) => void;
}

const TarjetaKanban: React.FC<{
  opp: OportunidadCrm;
  habilitado: boolean;
  alSeleccionarOportunidad?: (folio: string) => void;
}> = ({ opp, habilitado, alSeleccionarOportunidad }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opp.id,
    disabled: !habilitado,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => alSeleccionarOportunidad?.(opp.folio)}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.55 : 1,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-control)',
        padding: '0.75rem',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
      title={`Ver detalle de ${opp.folio}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline' }}>
          {opp.folio}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{opp.zona}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {opp.titulo}
      </div>
      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{opp.clienteNombre}</div>
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
        {opp.etiquetas.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '0.66rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.35rem',
          paddingTop: '0.35rem',
          borderTop: '1px solid var(--divider)',
          fontSize: '0.76rem',
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>
          ${opp.montoEstimado.toLocaleString('es-MX')} {opp.moneda}
        </strong>
        <span style={{ color: 'var(--text-secondary)' }}>{opp.vendedor.split(' ')[0]}</span>
      </div>
    </div>
  );
};

const ColumnaKanban: React.FC<{
  etapa: EtapaOportunidad;
  items: OportunidadCrm[];
  puedeEditar: boolean;
  alSeleccionarOportunidad?: (folio: string) => void;
}> = ({ etapa, items, puedeEditar, alSeleccionarOportunidad }) => {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const sumaColumna = items.reduce((s, o) => s + o.montoEstimado, 0);

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? 'var(--brand-tonal-bg)' : 'var(--surface-alt)',
        border: `1px solid ${isOver ? 'var(--primary)' : 'var(--border)'}`,
        borderTop: `3px solid ${COLORES_ETAPAS[etapa]}`,
        borderRadius: 'var(--radius-card)',
        padding: '0.75rem',
        minWidth: '245px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase' }}>
          {ETIQUETAS_ETAPAS[etapa]} ({items.length})
        </strong>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          ${(sumaColumna / 1000).toFixed(0)}k
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', minHeight: '220px' }}>
        {items.map((opp) => (
          <TarjetaKanban
            key={opp.id}
            opp={opp}
            habilitado={puedeEditar}
            alSeleccionarOportunidad={alSeleccionarOportunidad}
          />
        ))}
      </div>
    </div>
  );
};

export const KanbanCrm: React.FC<PropiedadesKanbanCrm> = ({
  oportunidades,
  puedeEditar,
  alMoverEtapa,
  alSeleccionarOportunidad,
}) => {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const manejarDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const idOpp = String(active.id);
    const nuevaEtapa = String(over.id) as EtapaOportunidad;
    const actual = oportunidades.find((o) => o.id === idOpp);
    if (actual && actual.etapa !== nuevaEtapa) {
      void alMoverEtapa(idOpp, nuevaEtapa);
    }
  };

  return (
    <DndContext sensors={sensores} onDragEnd={manejarDragEnd}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(245px, 1fr))',
          gap: '0.8rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}
      >
        {ETAPAS_OPORTUNIDAD.map((etapa) => (
          <ColumnaKanban
            key={etapa}
            etapa={etapa}
            items={oportunidades.filter((o) => o.etapa === etapa)}
            puedeEditar={puedeEditar}
            alSeleccionarOportunidad={alSeleccionarOportunidad}
          />
        ))}
      </div>
    </DndContext>
  );
};
