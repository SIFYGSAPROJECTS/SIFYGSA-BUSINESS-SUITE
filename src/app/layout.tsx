import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import '@/index.css';
import '@/App.css';
import '@/components/layout/MainLayout.css';
import '@/modules/auth/auth.css';
import '@/modules/dashboard/dashboard.css';
import '@/modules/settings/settings.css';
import '@/modules/crm/crm.css';
import '@/modules/compras/compras.css';
import '@/modules/rh/rh.css';

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
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
