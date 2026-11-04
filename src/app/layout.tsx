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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('sfg_theme');
                var theme = (saved === 'dark' || saved === 'light') ? saved : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
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
