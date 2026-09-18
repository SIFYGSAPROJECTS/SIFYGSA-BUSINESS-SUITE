import { useState } from 'react';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { HomeCRM } from './modules/crm/pages/HomeCRM';
import { GeneralDashboard } from './modules/dashboard/pages/GeneralDashboard';
import { ComprasRequisicion } from './modules/compras/pages/ComprasRequisicion';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

export function App() {
  // Estado de autenticación - por defecto con Jared S. (Safety Director) para ver el dashboard directo
  const [user, setUser] = useState<UserSession | null>({
    name: 'Jared S.',
    email: 'jared.s@sifygsa.com',
    role: 'Safety Director',
  });
  
  // Estado de módulo activo en la navegación
  const [activeModuleId, setActiveModuleId] = useState<string>('dashboard');
  const [activeSubItemId, setActiveSubItemId] = useState<string | undefined>('crm-home');

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

  // Título dinámico para el Header según el módulo activo
  const getModuleTitle = () => {
    switch (activeModuleId) {
      case 'crm':
        return 'Módulo CRM & Ventas';
      case 'compras':
        return 'Módulo de Compras — Requisición NetSuite';
      case 'settings':
        return 'Configuración del Sistema';
      case 'dashboard':
      default:
        return 'Panel General Ejecutivo';
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
        return (
          <div className="crm-content-card">
            <div className="card-header-row">
              <div>
                <h2 className="card-title">Configuración de la Suite</h2>
                <p className="card-sub">Gestión de parámetros globales, seguridad y arquitectura modular</p>
              </div>
            </div>
            <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
              Módulo listo para conectar con servicios de backend en Node.js y administración de roles.
            </p>
          </div>
        );
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

export default App;
