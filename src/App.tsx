import { useState } from 'react';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { HomeCRM } from './modules/crm/pages/HomeCRM';
import { GeneralDashboard } from './modules/dashboard/pages/GeneralDashboard';
import { ComprasRequisicion } from './modules/compras/pages/ComprasRequisicion';
import { SettingsPage } from './modules/settings/pages/SettingsPage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

function AppContent() {
  const { t } = useLanguage();

  // Estado de autenticación - por defecto con Jared S. (Safety Director) para ver el dashboard directo
  const [user, setUser] = useState<UserSession | null>({
    name: 'Jared S.',
    email: 'jared.s@sifygsa.com',
    role: 'Safety Director',
  });

  // Estado de módulo activo en la navegación
  const [activeModuleId, setActiveModuleId] = useState<string>('dashboard');
  const [activeSubItemId, setActiveSubItemId] = useState<string | undefined>('crm-opportunities');

  // Función para iniciar sesión
  const handleLoginSuccess = (userData: UserSession) => {
    setUser(userData);
    setActiveModuleId('dashboard');
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setUser(null);
  };

  // Manejador de cambio de módulo/sección
  const handleSelectModule = (moduleId: string, subItemId?: string) => {
    setActiveModuleId(moduleId);
    setActiveSubItemId(subItemId);
  };

  // Si no hay usuario autenticado, mostramos la pantalla de Login con Hero a la derecha
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Título dinámico para el Header según el módulo activo y el idioma
  const getModuleTitle = () => {
    switch (activeModuleId) {
      case 'crm':
        return t('app.crm_title');
      case 'compras':
        return t('app.compras_title');
      case 'settings':
        return t('app.settings_title');
      case 'dashboard':
      default:
        return t('app.dashboard_title');
    }
  };

  // Renderizado del contenido central según el módulo activo
  const renderModuleContent = () => {
    switch (activeModuleId) {
      case 'crm':
        return <HomeCRM subItemId={activeSubItemId} />;
      case 'compras':
        return <ComprasRequisicion subItemId={activeSubItemId} />;
      case 'settings':
        return <SettingsPage user={user} />;
      case 'dashboard':
      default:
        return <GeneralDashboard onNavigateModule={handleSelectModule} />;
    }
  };

  return (
    <MainLayout
      activeModuleId={activeModuleId}
      activeSubItemId={activeSubItemId}
      currentModuleTitle={getModuleTitle()}
      onSelectModule={handleSelectModule}
      onLogout={handleLogout}
      user={user}
    >
      {renderModuleContent()}
    </MainLayout>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
