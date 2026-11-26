'use client';

import React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type AlmacenButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'success';

export type AlmacenButtonSize = 'sm' | 'md' | 'lg';

export interface AlmacenButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AlmacenButtonVariant;
  size?: AlmacenButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: ReactNode;
}

export function AlmacenButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  style,
  disabled,
  className = '',
  ...props
}: AlmacenButtonProps) {
  const getStyles = (): React.CSSProperties => {
    let bg = 'var(--primary)';
    let color = 'var(--on-primary)';
    let border = '1px solid var(--primary)';

    switch (variant) {
      case 'secondary':
        bg = 'var(--surface)';
        color = 'var(--text-primary)';
        border = '1px solid var(--border)';
        break;
      case 'danger':
        bg = 'var(--danger)';
        color = '#ffffff';
        border = '1px solid var(--danger)';
        break;
      case 'success':
        bg = 'var(--success-bg)';
        color = 'var(--success-text)';
        border = '1px solid var(--success-text)';
        break;
      case 'outline':
        bg = 'transparent';
        color = 'var(--primary)';
        border = '1px solid var(--primary)';
        break;
      case 'ghost':
        bg = 'transparent';
        color = 'var(--text-secondary)';
        border = '1px solid transparent';
        break;
    }

    const padding =
      size === 'sm' ? '0.375rem 0.625rem' : size === 'lg' ? '0.625rem 1.25rem' : '0.5rem 0.875rem';
    const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.875rem' : '0.8125rem';

    return {
      padding,
      fontSize,
      backgroundColor: bg,
      color,
      border,
      borderRadius: 'var(--radius-control)',
      fontFamily: 'var(--font-family-label)',
      fontWeight: 600,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.65 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.4rem',
      boxShadow: variant === 'ghost' ? 'none' : 'var(--shadow-xs)',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap' as const,
      ...style,
    };
  };

  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={`sga-btn sga-btn-${variant} ${className}`}
      style={getStyles()}
    >
      {loading ? (
        <span
          className="material-symbols-outlined"
          style={{ animation: 'spin 1s linear infinite', fontSize: '16px' }}
        >
          progress_activity
        </span>
      ) : (
        icon &&
        iconPosition === 'left' && (
          <span className="material-symbols-outlined" style={{ fontSize: '16px', lineHeight: 1 }}>
            {icon}
          </span>
        )
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined" style={{ fontSize: '16px', lineHeight: 1 }}>
          {icon}
        </span>
      )}
    </button>
  );
}

export default AlmacenButton;

