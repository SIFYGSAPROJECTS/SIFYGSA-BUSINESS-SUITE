'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { NOMBRES_ROLES, type IdModulo, type RolUsuario, type ZonaComercial } from '@/config/types';
import { useMonitoreoInactividad } from '@/lib/auth/use-inactividad';
import { Header } from './Header';
import { Sidebar } from './sidebar';
import { SidebarRH } from './SidebarRH';
import { SidebarAlmacen } from './SidebarAlmacen';
import { Footer } from './Footer';
import './MainLayout.css';

export interface UserData {
  name: string;
  email: string;
  role: string;
  portal?: 'crm' | 'rh' | 'almacen';
}

export interface UsuarioSesionLayout {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  zona?: ZonaComercial;
  departamento?: string;
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
  const [isMobile, setIsMobile] = useState(false);

  // Detección de dispositivo móvil montado de manera segura para SSR/Hydration
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 860);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useMonitoreoInactividad(Boolean(usuario));

  const esPortalRh =
    userProp?.portal === 'rh' || usuario?.rol === 'rrhh' || pathname.startsWith('/rrhh');
  const esPortalAlmacen =
    userProp?.portal === 'almacen' ||
    usuario?.departamento === 'Almacén & SGA' ||
    pathname.startsWith('/almacen');

  const portalDeterminado: 'crm' | 'rh' | 'almacen' =
    userProp?.portal ?? (esPortalRh ? 'rh' : esPortalAlmacen ? 'almacen' : 'crm');

  const userData: UserData = userProp ?? {
    name: usuario?.nombre ?? (esPortalAlmacen ? 'Supervisor Almacén' : 'Carlos Mendoza'),
    email: usuario?.email ?? (esPortalAlmacen ? 'almacen@sifygsa.com' : 'crm@sifygsa.com'),
    role: usuario
      ? NOMBRES_ROLES[usuario.rol]
      : esPortalAlmacen
      ? 'Supervisor de Almacén & SGA'
      : 'Director Comercial & CRM',
    portal: portalDeterminado,
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
      : pathname.startsWith('/almacen')
      ? 'almacen'
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
      : activeModuleId === 'almacen'
      ? (pathname === '/almacen' ? '' : pathname.replace('/almacen/', ''))
      : undefined);

  const isSidebarOpen = isMobile ? isMobileOpen : !isCollapsed;

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
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
        case 'almacen':
          if (!subItemId || subItemId === '' || subItemId === 'almacen-dashboard') {
            router.push('/almacen');
          } else {
            router.push(`/almacen/${subItemId}`);
          }
          break;
        default:
          router.push('/');
          break;
      }
    }

    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div
      className={`app-layout ${userData.portal === 'rh' ? 'portal-rh' : userData.portal === 'almacen' ? 'portal-almacen' : 'portal-crm'} ${
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
        ) : userData.portal === 'almacen' ? (
          <SidebarAlmacen
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
            rolUsuario={usuario?.rol ?? 'requisiciones'}
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
