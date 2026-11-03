'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export type AlmacenBadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'error'
  | 'select'
  | 'info';

export interface AlmacenBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AlmacenBadgeVariant;
  size?: 'sm' | 'md' | 'lg' | string;
  icon?: string;
  dot?: boolean;
  children: ReactNode;
}

export function AlmacenBadge({
  variant = 'neutral',
  size = 'md',
  icon,
  dot = false,
  children,
  style,
  className = '',
  ...props
}: AlmacenBadgeProps) {
  const getStyles = (): React.CSSProperties => {
    let bg = 'var(--surface-alt)';
    let color = 'var(--text-secondary)';
    let border = '1px solid var(--border)';

    switch (variant) {
      case 'select':
      case 'primary':
        bg = 'var(--nav-active-bg)';
        color = 'var(--primary)';
        border = '1px solid var(--border)';
        break;
      case 'success':
        bg = 'var(--success-bg)';
        color = 'var(--success-text)';
        border = '1px solid var(--success-text)';
        break;
      case 'warning':
        bg = 'var(--warning-bg)';
        color = 'var(--warning-text)';
        border = '1px solid var(--warning-text)';
        break;
      case 'error':
      case 'danger':
        bg = 'var(--danger-bg)';
        color = 'var(--danger-text)';
        border = '1px solid var(--danger-text)';
        break;
      case 'info':
        bg = 'var(--info-bg)';
        color = 'var(--info-text)';
        border = '1px solid var(--info-text)';
        break;
    }

    const padding = size === 'sm' ? '0.1rem 0.4rem' : '0.15rem 0.5rem';
    const fontSize = size === 'sm' ? '0.625rem' : '0.6875rem';

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding,
      borderRadius: '9999px',
      fontFamily: 'var(--font-family-label)',
      fontSize,
      fontWeight: 600,
      backgroundColor: bg,
      color,
      border,
      lineHeight: 1.25,
      ...style,
    };
  };

  return (
    <span {...props} className={`sga-badge sga-badge-${variant} ${className}`} style={getStyles()}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: '13px', lineHeight: 1 }}>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}

export default AlmacenBadge;
