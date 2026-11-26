/**
 * Espejo tipado del Sistema de Diseño Corporativo SIFYGSA (Manual UI/UX v1.1)
 * Consume exclusivamente variables CSS (tokens.css) — no duplica valores HEX.
 */

export const themeTokens = {
  brand: {
    50: 'var(--brand-50)',
    100: 'var(--brand-100)',
    200: 'var(--brand-200)',
    300: 'var(--brand-300)',
    400: 'var(--brand-400)',
    500: 'var(--brand-500)',
    600: 'var(--brand-600)',
    700: 'var(--brand-700)',
    800: 'var(--brand-800)',
    900: 'var(--brand-900)',
  },
  neutral: {
    50: 'var(--neutral-50)',
    100: 'var(--neutral-100)',
    200: 'var(--neutral-200)',
    300: 'var(--neutral-300)',
    400: 'var(--neutral-400)',
    500: 'var(--neutral-500)',
    600: 'var(--neutral-600)',
    700: 'var(--neutral-700)',
    800: 'var(--neutral-800)',
    900: 'var(--neutral-900)',
    950: 'var(--neutral-950)',
  },
  surface: {
    appBg: 'var(--app-bg)',
    surface: 'var(--surface)',
    surfaceAlt: 'var(--surface-alt)',
    card: 'var(--card)',
    cardHover: 'var(--card-hover)',
    border: 'var(--border)',
    divider: 'var(--divider)',
    fieldBorder: 'var(--field-border)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    secondaryOnBg: 'var(--text-secondary-on-bg)',
    muted: 'var(--text-muted)',
    disabled: 'var(--text-disabled)',
  },
  nav: {
    text: 'var(--nav-text)',
    activeBg: 'var(--nav-active-bg)',
    activeText: 'var(--nav-active-text)',
  },
  action: {
    primary: 'var(--primary)',
    primaryHover: 'var(--primary-hover)',
    primaryPressed: 'var(--primary-pressed)',
    onPrimary: 'var(--on-primary)',
    link: 'var(--link)',
    focus: 'var(--focus)',
  },
  semantic: {
    success: 'var(--success)',
    successBg: 'var(--success-bg)',
    successText: 'var(--success-text)',
    warning: 'var(--warning)',
    warningBg: 'var(--warning-bg)',
    warningText: 'var(--warning-text)',
    danger: 'var(--danger)',
    dangerBg: 'var(--danger-bg)',
    dangerText: 'var(--danger-text)',
    info: 'var(--info)',
    infoBg: 'var(--info-bg)',
    infoText: 'var(--info-text)',
    infoIcon: 'var(--info-icon)',
    onSolidDarkText: 'var(--on-solid-dark-text)',
    onDanger: 'var(--on-danger)',
  },
  space: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    12: 'var(--space-12)',
  },
  radius: {
    control: 'var(--radius-control)',
    card: 'var(--radius-card)',
  },
} as const;

/**
 * Obtiene el valor computado actual de un token CSS en tiempo de ejecución.
 * Útil para librerías de gráficas o Canvas.
 */
export function getComputedToken(variableName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}
