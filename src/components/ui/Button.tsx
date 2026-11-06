'use client';

import React from 'react';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'exito';
export type TamanoBoton = 'sm' | 'md' | 'lg';

export interface PropiedadesBoton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  iconoIzquierdo?: React.ReactNode;
}

const ESTILOS_VARIANTE: Record<VarianteBoton, React.CSSProperties> = {
  primario: {
    backgroundColor: 'var(--primary)',
    color: 'var(--on-primary)',
    border: '1px solid transparent',
  },
  secundario: {
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  fantasma: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  peligro: {
    backgroundColor: 'var(--danger)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  exito: {
    backgroundColor: 'var(--success)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
};

const ESTILOS_TAMANO: Record<TamanoBoton, React.CSSProperties> = {
  sm: { padding: '0.38rem 0.75rem', fontSize: '0.78rem' },
  md: { padding: '0.55rem 1.05rem', fontSize: '0.86rem' },
  lg: { padding: '0.72rem 1.35rem', fontSize: '0.95rem' },
};

export const Button: React.FC<PropiedadesBoton> = ({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  iconoIzquierdo,
  children,
  disabled,
  style,
  ...resto
}) => {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-control)',
        cursor: disabled || cargando ? 'not-allowed' : 'pointer',
        opacity: disabled || cargando ? 0.65 : 1,
        transition: 'all 0.18s ease',
        ...ESTILOS_VARIANTE[variante],
        ...ESTILOS_TAMANO[tamano],
        ...style,
      }}
      {...resto}
    >
      {cargando ? (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
      ) : (
        iconoIzquierdo
      )}
      {children}
    </button>
  );
};
