'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface AlmacenModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function AlmacenModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '560px',
}: AlmacenModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>{title}</h3>
            {subtitle && (
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>

        <div>{children}</div>

        {footer && (
          <div
            style={{
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--divider)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlmacenModal;
