'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { NOMBRES_ROLES, type IdModulo, type RolUsuario, type ZonaComercial } from '@/config/types';
import { useMonitoreoInactividad } from '@/lib/auth/use-inactividad';
import { Header } from './Header';
import { Sidebar } from './sidebar';
import { SidebarRH } from './SidebarRH';
import { Footer } from './Footer';
import './MainLayout.css';

export interface UserData {
  name: string;
  email: string;
  role: string;
  portal?: 'crm' | 'rh';
}

export interface UsuarioSesionLayout {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  zona?: ZonaComercial;
  modulosPermitidos: IdModulo[];
}

export interface MainLayoutProps {
  children: ReactNode;
  activeModuleId?: string;
  activeSubItemId?: string;
  currentModuleTitle?: string;
  onSelectModule?: (moduleId: string, subItemId?: string) => void;
  onLogout?: () => void;
  user?: UserData;
  usuario?: UsuarioSesionLayout;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeModuleId: activeModuleProp,
  activeSubItemId: activeSubItemProp,
  currentModuleTitle = 'Panel Principal',
  onSelectModule: onSelectModuleProp,
  onLogout: onLogoutProp,
  user: userProp,
  usuario,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useMonitoreoInactividad(Boolean(usuario));

  const esPortalRh =
    userProp?.portal === 'rh' || usuario?.rol === 'rrhh' || pathname.startsWith('/rrhh');

  const userData: UserData = userProp ?? {
    name: usuario?.nombre ?? 'Carlos Mendoza',
    email: usuario?.email ?? 'crm@sifygsa.com',
    role: usuario ? NOMBRES_ROLES[usuario.rol] : 'Director Comercial & CRM',
    portal: esPortalRh ? 'rh' : 'crm',
  };

  const activeModuleId =
    activeModuleProp ??
    (pathname.startsWith('/ajustes')
      ? 'settings'
      : pathname.startsWith('/crm')
      ? 'crm'
      : pathname.startsWith('/requisiciones')
      ? 'compras'
      : pathname.startsWith('/rrhh')
      ? 'rh'
      : pathname.startsWith('/admin')
      ? 'admin'
      : esPortalRh
      ? 'rh'
      : 'dashboard');

  const activeSubItemId =
    activeSubItemProp ??
    searchParams.get('sub') ??
    searchParams.get('vista') ??
    (activeModuleId === 'crm'
      ? 'crm-opportunities'
      : activeModuleId === 'compras'
      ? 'compras-requisicion'
      : activeModuleId === 'rh'
      ? 'rh-directorio'
      : undefined);

  const isSidebarOpen =
    typeof window !== 'undefined' && window.innerWidth <= 860
      ? isMobileOpen
      : !isCollapsed;

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 860) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLogout = async () => {
    if (onLogoutProp) {
      onLogoutProp();
      return;
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleModuleSelection = (moduleId: string, subItemId?: string) => {
    if (onSelectModuleProp) {
      onSelectModuleProp(moduleId, subItemId);
    } else {
      switch (moduleId) {
        case 'dashboard':
          router.push('/');
          break;
        case 'settings':
          router.push('/ajustes');
          break;
        case 'crm':
          router.push(subItemId ? `/crm?sub=${subItemId}` : '/crm');
          break;
        case 'compras':
        case 'requisiciones':
          router.push(subItemId ? `/requisiciones?sub=${subItemId}` : '/requisiciones');
          break;
        case 'rh':
        case 'rrhh':
          router.push(subItemId ? `/rrhh?sub=${subItemId}` : '/rrhh');
          break;
        case 'admin':
          router.push(subItemId ? `/admin?vista=${subItemId}` : '/admin');
          break;
        default:
          router.push('/');
          break;
      }
    }

    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div
      className={`app-layout ${userData.portal === 'rh' ? 'portal-rh' : 'portal-crm'} ${
        isCollapsed ? 'sidebar-collapsed' : ''
      } ${isMobileOpen ? 'mobile-open' : ''}`}
    >
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
        onLogout={() => {
          void handleLogout();
        }}
        onSelectModule={handleModuleSelection}
        user={userData}
      />

      {/* Contenedor Central: Menú lateral + Área de Trabajo Canvas */}
      <div className="app-body-container">
        {userData.portal === 'rh' ? (
          <SidebarRH
            isCollapsed={isCollapsed}
            isMobileOpen={isMobileOpen}
            onToggleCollapse={handleToggleSidebar}
            onCloseMobile={() => setIsMobileOpen(false)}
            activeModuleId={activeModuleId}
            activeSubItemId={activeSubItemId}
            onSelectModule={handleModuleSelection}
            onLogout={() => {
              void handleLogout();
            }}
            rolUsuario={usuario?.rol ?? 'rrhh'}
          />
        ) : (
          <Sidebar
            isCollapsed={isCollapsed}
            isMobileOpen={isMobileOpen}
            onToggleCollapse={handleToggleSidebar}
            onCloseMobile={() => setIsMobileOpen(false)}
            activeModuleId={activeModuleId}
            activeSubItemId={activeSubItemId}
            onSelectModule={handleModuleSelection}
            onLogout={() => {
              void handleLogout();
            }}
            showAdmin={!usuario || usuario.rol === 'administrador'}
            rolUsuario={usuario?.rol ?? 'administrador'}
          />
        )}

        <main className="layout-content-area" id="main-content">
          <div className="content-inner-container">
            {children}
          </div>
        </main>
      </div>

      {/* Footer Oficial SIFYGSA 100% Ancho */}
      <Footer portal={userData.portal} />
    </div>
  );
};
