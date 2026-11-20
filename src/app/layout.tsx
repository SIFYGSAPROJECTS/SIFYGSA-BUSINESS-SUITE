import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import '@/index.css';
import '@/App.css';
import '@/components/layout/MainLayout.css';
import '@/modules/auth/auth.css';
import '@/modules/dashboard/dashboard.css';
import '@/modules/settings/settings.css';
import '@/modules/crm/crm.css';
import '@/modules/compras/compras.css';
import '@/modules/rh/rh.css';
import '@/modules/almacen/almacen.css';

export const metadata: Metadata = {
  title: 'SIFYGSA Enterprise ERP Suite',
  description:
    'Plataforma ERP modular para SIFYGSA: Administración, CRM & Ventas, Requisiciones y Recursos Humanos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          id="tailwind-config"
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                corePlugins: {
                  preflight: false,
                },
                theme: {
                  extend: {
                    colors: {
                      brand: {
                        50: '#eff6ff',
                        100: '#dbeafe',
                        200: '#bfdbfe',
                        300: '#93c5fd',
                        400: '#60a5fa',
                        500: '#3b82f6',
                        600: '#2563eb',
                        700: '#1d4ed8',
                        800: '#1e40af',
                        900: '#1e3a8a',
                      },
                      "surface": "rgb(var(--stitch-surface) / <alpha-value>)",
                      "surface-bright": "rgb(var(--stitch-surface-bright) / <alpha-value>)",
                      "surface-dim": "rgb(var(--stitch-surface-dim) / <alpha-value>)",
                      "surface-container-lowest": "rgb(var(--stitch-surface-container-lowest) / <alpha-value>)",
                      "surface-container-low": "rgb(var(--stitch-surface-container-low) / <alpha-value>)",
                      "surface-container": "rgb(var(--stitch-surface-container) / <alpha-value>)",
                      "surface-container-high": "rgb(var(--stitch-surface-container-high) / <alpha-value>)",
                      "surface-container-highest": "rgb(var(--stitch-surface-container-highest) / <alpha-value>)",
                      "surface-variant": "rgb(var(--stitch-surface-variant) / <alpha-value>)",
                      "background": "rgb(var(--stitch-background) / <alpha-value>)",
                      "on-background": "rgb(var(--stitch-on-background) / <alpha-value>)",
                      "on-surface": "rgb(var(--stitch-on-surface) / <alpha-value>)",
                      "on-surface-variant": "rgb(var(--stitch-on-surface-variant) / <alpha-value>)",
                      "outline": "rgb(var(--stitch-outline) / <alpha-value>)",
                      "outline-variant": "rgb(var(--stitch-outline-variant) / <alpha-value>)",
                      "primary": "rgb(var(--stitch-primary) / <alpha-value>)",
                      "on-primary": "rgb(var(--stitch-on-primary) / <alpha-value>)",
                      "primary-container": "rgb(var(--stitch-primary-container) / <alpha-value>)",
                      "on-primary-container": "rgb(var(--stitch-on-primary-container) / <alpha-value>)",
                      "primary-fixed": "rgb(var(--stitch-primary-fixed) / <alpha-value>)",
                      "primary-fixed-dim": "rgb(var(--stitch-primary-fixed-dim) / <alpha-value>)",
                      "on-primary-fixed": "rgb(var(--stitch-on-primary-fixed) / <alpha-value>)",
                      "on-primary-fixed-variant": "rgb(var(--stitch-on-primary-fixed-variant) / <alpha-value>)",
                      "secondary": "rgb(var(--stitch-secondary) / <alpha-value>)",
                      "on-secondary": "rgb(var(--stitch-on-secondary) / <alpha-value>)",
                      "secondary-container": "rgb(var(--stitch-secondary-container) / <alpha-value>)",
                      "on-secondary-container": "rgb(var(--stitch-on-secondary-container) / <alpha-value>)",
                      "secondary-fixed": "rgb(var(--stitch-secondary-fixed) / <alpha-value>)",
                      "secondary-fixed-dim": "rgb(var(--stitch-secondary-fixed-dim) / <alpha-value>)",
                      "on-secondary-fixed": "rgb(var(--stitch-on-secondary-fixed) / <alpha-value>)",
                      "on-secondary-fixed-variant": "rgb(var(--stitch-on-secondary-fixed-variant) / <alpha-value>)",
                      "tertiary": "rgb(var(--stitch-tertiary) / <alpha-value>)",
                      "on-tertiary": "rgb(var(--stitch-on-tertiary) / <alpha-value>)",
                      "tertiary-container": "rgb(var(--stitch-tertiary-container) / <alpha-value>)",
                      "on-tertiary-container": "rgb(var(--stitch-on-tertiary-container) / <alpha-value>)",
                      "tertiary-fixed": "rgb(var(--stitch-tertiary-fixed) / <alpha-value>)",
                      "tertiary-fixed-dim": "rgb(var(--stitch-tertiary-fixed-dim) / <alpha-value>)",
                      "on-tertiary-fixed": "rgb(var(--stitch-on-tertiary-fixed) / <alpha-value>)",
                      "on-tertiary-fixed-variant": "rgb(var(--stitch-on-tertiary-fixed-variant) / <alpha-value>)",
                      "error": "rgb(var(--stitch-error) / <alpha-value>)",
                      "on-error": "rgb(var(--stitch-on-error) / <alpha-value>)",
                      "error-container": "rgb(var(--stitch-error-container) / <alpha-value>)",
                      "on-error-container": "rgb(var(--stitch-on-error-container) / <alpha-value>)",
                      "inverse-surface": "rgb(var(--stitch-inverse-surface) / <alpha-value>)",
                      "inverse-on-surface": "rgb(var(--stitch-inverse-on-surface) / <alpha-value>)",
                      "inverse-primary": "rgb(var(--stitch-inverse-primary) / <alpha-value>)",
                      "surface-tint": "rgb(var(--stitch-surface-tint) / <alpha-value>)"
                    },
                    spacing: {
                      "margin": "1.5rem",
                      "space-xl": "1.5rem",
                      "space-lg": "1rem",
                      "space-md": "0.75rem",
                      "space-sm": "0.5rem",
                      "space-xs": "0.25rem",
                      "gutter": "1rem",
                      "margin-mobile": "1rem",
                      "gutter-mobile": "0.5rem"
                    },
                    fontFamily: {
                      sans: ["Inter", "sans-serif"],
                      mono: ["JetBrains Mono", "monospace"],
                      "headline-xl": ["Inter", "sans-serif"],
                      "headline-lg": ["Inter", "sans-serif"],
                      "headline-md": ["Inter", "sans-serif"],
                      "headline-xl-mobile": ["Inter", "sans-serif"],
                      "body-lg": ["Inter", "sans-serif"],
                      "body-md": ["Inter", "sans-serif"],
                      "body-sm": ["Inter", "sans-serif"],
                      "label-md": ["Inter", "sans-serif"],
                      "label-sm": ["Inter", "sans-serif"],
                      "mono-lg": ["JetBrains Mono", "monospace"],
                      "mono-md": ["JetBrains Mono", "monospace"],
                      "mono-sm": ["JetBrains Mono", "monospace"]
                    },
                    fontSize: {
                      "headline-xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
                      "headline-xl-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" }],
                      "headline-lg": ["22px", { lineHeight: "30px", letterSpacing: "-0.015em", fontWeight: "700" }],
                      "headline-md": ["18px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" }],
                      "body-lg": ["15px", { lineHeight: "22px", fontWeight: "400" }],
                      "body-md": ["13px", { lineHeight: "18px", fontWeight: "400" }],
                      "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
                      "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
                      "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.03em", fontWeight: "600" }],
                      "mono-lg": ["14px", { lineHeight: "20px", letterSpacing: "-0.01em", fontWeight: "500" }],
                      "mono-md": ["12px", { lineHeight: "16px", letterSpacing: "0em", fontWeight: "500" }],
                      "mono-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.01em", fontWeight: "400" }]
                    }
                  }
                }
              };
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('sfg_theme');
                var theme = (saved === 'dark' || saved === 'light') ? saved : 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
