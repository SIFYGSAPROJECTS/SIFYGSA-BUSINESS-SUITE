import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './sidebar';
import { Footer } from './Footer';
import './MainLayout.css';

interface UserData {
  name: string;
  email: string;
  role: string;
}

interface MainLayoutProps {
  children: ReactNode;
  activeModuleId: string;
  activeSubItemId?: string;
  currentModuleTitle?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  onLogout: () => void;
  user?: UserData;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeModuleId,
  activeSubItemId,
  currentModuleTitle = 'Panel Principal',
  onSelectModule,
  onLogout,
  user,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Estado que determina si el menú está desplegado (abierto) o plegado
  const isSidebarOpen = typeof window !== 'undefined' && window.innerWidth <= 860
    ? isMobileOpen
    : !isCollapsed;

  const handleToggleSidebar = () => {
    // En pantallas grandes colapsa/expande; en pantallas móviles abre/cierra drawer
    if (window.innerWidth <= 860) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleModuleSelection = (moduleId: string, subItemId?: string) => {
    onSelectModule(moduleId, subItemId);
    // En móviles, cerrar el sidebar al seleccionar una opción
    if (window.innerWidth <= 860) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Backdrop overlay para pantallas pequeñas */}
      {isMobileOpen && (
        <div
          className="layout-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Header Superior Global (100% Ancho) */}
      <Header
        currentModuleTitle={currentModuleTitle}
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onLogout={onLogout}
        user={user}
      />

      {/* Contenedor Central: Menú lateral + Área de Trabajo Canvas */}
      <div className="app-body-container">
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onToggleCollapse={handleToggleSidebar}
          onCloseMobile={() => setIsMobileOpen(false)}
          activeModuleId={activeModuleId}
          activeSubItemId={activeSubItemId}
          onSelectModule={handleModuleSelection}
          onLogout={onLogout}
        />

        <main className="layout-content-area" id="main-content">
          <div className="content-inner-container">
            {children}
          </div>
        </main>
      </div>

      {/* Footer Oficial SIFYGSA 100% Ancho con franja naranja continua */}
      <Footer />
    </div>
  );
};

