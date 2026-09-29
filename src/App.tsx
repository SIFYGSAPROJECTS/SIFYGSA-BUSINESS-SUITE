import { useState } from 'react';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { HomeCRM } from './modules/crm/pages/HomeCRM';
import { GeneralDashboard } from './modules/dashboard/pages/GeneralDashboard';
import { ComprasRequisicion } from './modules/compras/pages/ComprasRequisicion';
import { SettingsPage } from './modules/settings/pages/SettingsPage';
import { HomeRH } from './modules/rh/pages/HomeRH';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

export interface UserSession {
  name: string;
  email: string;
  role: string;
  portal?: 'crm' | 'rh';
}

function AppContent() {
  const { t } = useLanguage();

  // Estado de autenticación - sincronizado con localStorage para persistir sesión o login directo
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('sfg_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null; // Por defecto a Login para poder elegir entre CRM y RH
  });

  // Estado de módulo activo en la navegación
  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    return user?.portal === 'rh' ? 'rh' : 'dashboard';
  });
  const [activeSubItemId, setActiveSubItemId] = useState<string | undefined>(() => {
    return user?.portal === 'rh' ? 'rh-directorio' : 'crm-opportunities';
  });

  // Función para iniciar sesión
  const handleLoginSuccess = (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem('sfg_user_session', JSON.stringify(userData));
    if (userData.portal === 'rh') {
      setActiveModuleId('rh');
      setActiveSubItemId('rh-directorio');
    } else {
      setActiveModuleId('dashboard');
      setActiveSubItemId('crm-opportunities');
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sfg_user_session');
  };

  // Manejador de cambio de módulo/sección
  const handleSelectModule = (moduleId: string, subItemId?: string) => {
    setActiveModuleId(moduleId);
    setActiveSubItemId(subItemId);
  };

  // Si no hay usuario autenticado, mostramos la pantalla de Login con las 2 cuentas de CRM y RH
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Título dinámico para el Header según el módulo activo y el idioma
  const getModuleTitle = () => {
    switch (activeModuleId) {
      case 'rh':
        return t('app.rh_title');
      case 'crm':
        return t('app.crm_title');
      case 'compras':
        return t('app.compras_title');
      case 'settings':
        return t('app.settings_title');
      case 'dashboard':
      default:
        return user.portal === 'rh'
          ? t('app.rh_title')
          : t('app.dashboard_title');
    }
  };

  // Renderizado del contenido central según el módulo activo
  const renderModuleContent = () => {
    switch (activeModuleId) {
      case 'rh':
        return <HomeRH />;
      case 'crm':
        return <HomeCRM subItemId={activeSubItemId} />;
      case 'compras':
        return <ComprasRequisicion subItemId={activeSubItemId} />;
      case 'settings':
        return <SettingsPage user={user} />;
      case 'dashboard':
      default:
        if (user.portal === 'rh') {
          return <HomeRH />;
        }
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
