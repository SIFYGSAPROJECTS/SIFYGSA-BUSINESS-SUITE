'use client';

import React, { useEffect } from 'react';
import { IconClose } from './Icons';

export interface PropiedadesModalUniversal {
  abierto: boolean;
  titulo: string;
  subtitulo?: string;
  alCerrar: () => void;
  children: React.ReactNode;
  anchoMaximo?: string;
}

export const ModalUniversal: React.FC<PropiedadesModalUniversal> = ({
  abierto,
  titulo,
  subtitulo,
  alCerrar,
  children,
  anchoMaximo = '640px',
}) => {
  useEffect(() => {
    if (!abierto) return;
    const manejarEscape = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') alCerrar();
    };
    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={alCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: anchoMaximo,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800 }}>{titulo}</h3>
            {subtitulo && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {subtitulo}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar ventana"
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '0.35rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
            }}
          >
            <IconClose size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
