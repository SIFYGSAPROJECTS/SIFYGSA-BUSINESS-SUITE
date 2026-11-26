'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  badgeText: string;
  badgeVariant?: 'select' | 'neutral' | 'warning' | 'error' | 'success';
  icon: string;
}

export function KpiCard({
  title,
  value,
  unit,
  subtitle,
  badgeText,
  badgeVariant = 'select',
  icon,
}: KpiCardProps) {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'error':
        return {
          bg: 'var(--danger-bg)',
          color: 'var(--danger-text)',
          border: '1px solid var(--danger-text)',
        };
      case 'warning':
        return {
          bg: 'var(--warning-bg)',
          color: 'var(--warning-text)',
          border: '1px solid var(--warning-text)',
        };
      case 'success':
        return {
          bg: 'var(--success-bg)',
          color: 'var(--success-text)',
          border: '1px solid var(--success-text)',
        };
      case 'select':
        return {
          bg: 'var(--nav-active-bg)',
          color: 'var(--primary)',
          border: '1px solid var(--primary)',
        };
      default:
        return {
          bg: 'var(--surface-alt)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-label)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '0.5rem',
            backgroundColor: badgeVariant === 'error' ? 'var(--danger-bg)' : 'var(--nav-active-bg)',
            border: badgeVariant === 'error' ? '1px solid var(--danger-text)' : '1px solid var(--nav-active-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: badgeVariant === 'error' ? 'var(--danger-text)' : 'var(--primary)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {icon}
          </span>
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-family-label)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: badgeVariant === 'error' ? 'var(--danger)' : 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {value}{' '}
          {unit && (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {unit}
            </span>
          )}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--divider)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            fontFamily: 'var(--font-family-label)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.color,
            border: badgeStyle.border,
          }}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );
}

export default KpiCard;
