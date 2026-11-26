import React from 'react';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dot = false,
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <span
      className={`badge-ui variant-${variant} ${className}`}
      style={style}
      {...props}
    >
      {dot && <span className="badge-ui-dot" aria-hidden="true">●</span>}
      {icon && <span className="badge-ui-icon" aria-hidden="true">{icon}</span>}
      <span className="badge-ui-content">{children}</span>
    </span>
  );
};
