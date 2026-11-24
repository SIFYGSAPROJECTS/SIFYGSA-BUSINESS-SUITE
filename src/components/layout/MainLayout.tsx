'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { NOMBRES_ROLES, type IdModulo, type RolUsuario, type ZonaComercial } from '@/config/types';
import { useMonitoreoInactividad } from '@/lib/auth/use-inactividad';
import { Header } from './Header';
import { Sidebar } from './sidebar';
import { SidebarRH } from './SidebarRH';
import { SidebarAlmacen } from './SidebarAlmacen';
import { SidebarCompras } from './SidebarCompras';
import { SidebarAutorizacion } from './SidebarAutorizacion';
import { MenuSelectivoModulo } from './MenuSelectivoModulo';
import { CentroConversaciones } from './CentroConversaciones';
import { Footer } from './Footer';
import './MainLayout.css';

export interface UserData {
  name: string;
  email: string;
  role: string;
  portal?: 'crm' | 'rh' | 'almacen' | 'compras';
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
  // El rail lateral permanece siempre compacto (como en la primera imagen), sin desplegarse
  const isCollapsed = true;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChatCenterOpen, setIsChatCenterOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(3);

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
  const esPortalAutorizacion = pathname.startsWith('/autorizacion-ordenes');
  const esPortalCompras =
    userProp?.portal === 'compras' ||
    pathname.startsWith('/compras');

  const portalDeterminado: 'crm' | 'rh' | 'almacen' | 'compras' =
    userProp?.portal ?? (esPortalRh ? 'rh' : esPortalAlmacen ? 'almacen' : esPortalCompras ? 'compras' : 'crm');

  const userData: UserData = userProp ?? {
    name: usuario?.nombre ?? (esPortalAlmacen ? 'Supervisor Almacén' : 'Carlos Mendoza'),
    email: usuario?.email ?? (esPortalAlmacen ? 'almacen@sifygsa.com' : esPortalCompras ? 'compras@sifygsa.com' : 'crm@sifygsa.com'),
    role: usuario
      ? NOMBRES_ROLES[usuario.rol]
      : esPortalAlmacen
      ? 'Supervisor de Almacén & SGA'
      : 'Administrador General',
    portal: portalDeterminado,
  };

  const activeModuleId =
    activeModuleProp ??
    (pathname.startsWith('/ajustes')
      ? 'settings'
      : esPortalAutorizacion
      ? 'autorizacion-ordenes'
      : pathname.startsWith('/crm')
      ? 'crm'
      : pathname.startsWith('/compras')
      ? 'compras'
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

  const isModuleSelectorOpen =
    (portalDeterminado === 'crm' || portalDeterminado === 'compras') &&
    searchParams.get('menu') === '1' &&
    (activeModuleId === 'crm' || activeModuleId === 'compras' || activeModuleId === 'admin');

  const activeSubItemId =
    activeSubItemProp ??
    (isModuleSelectorOpen
      ? '__menu__'
      : searchParams.get('sub') ??
        searchParams.get('vista') ??
        (activeModuleId === 'crm'
          ? 'crm-kanban'
          : activeModuleId === 'compras'
          ? 'compras-requisicion'
          : activeModuleId === 'rh'
          ? 'rh-directorio'
          : activeModuleId === 'almacen'
          ? (pathname === '/almacen' ? '' : pathname.replace('/almacen/', ''))
          : undefined));

  const isSidebarOpen = isMobile ? isMobileOpen : false;

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
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
      const wantsMenu = subItemId === '__menu__';
      switch (moduleId) {
        case 'dashboard':
          router.push('/');
          break;
        case 'settings':
          router.push('/ajustes');
          break;
        case 'crm':
          router.push(wantsMenu ? '/crm?menu=1' : subItemId ? `/crm?sub=${subItemId}` : '/crm');
          break;
        case 'compras':
          if (wantsMenu) {
            router.push(esPortalCompras ? '/compras' : '/requisiciones?menu=1');
          } else if (
            subItemId === 'compras-nueva' ||
            subItemId === 'compras-mis-requisiciones' ||
            subItemId === 'compras-requisicion' ||
            subItemId === 'compras-aprobaciones'
          ) {
            router.push(`/requisiciones?sub=${subItemId}`);
          } else if (!subItemId || subItemId === 'menu' || subItemId === 'compras-menu') {
            router.push(esPortalCompras ? '/compras' : '/requisiciones');
          } else if (subItemId === 'proveedores') {
            router.push('/compras/proveedores');
          } else if (subItemId === 'nuevo-proveedor') {
            router.push('/compras/proveedores/nuevo');
          } else if (subItemId === 'ordenes') {
            router.push('/compras/ordenes');
          } else if (subItemId === 'editar-facturas') {
            router.push('/compras/ordenes/editar-facturas');
          } else if (subItemId === 'autorizar-ordenes') {
            router.push('/autorizacion-ordenes');
          } else if (subItemId === 'nueva-orden') {
            router.push('/compras/ordenes/nueva');
          } else if (subItemId === 'requisiciones') {
            router.push('/requisiciones');
          } else if (subItemId === 'aprobar-requisiciones') {
            router.push('/requisiciones?sub=compras-aprobaciones');
          } else if (subItemId === 'facturas') {
            router.push('/compras/facturas');
          } else if (subItemId?.startsWith('/')) {
            router.push(subItemId);
          } else {
            router.push('/compras/ordenes');
          }
          break;
        case 'autorizacion-ordenes':
          router.push('/autorizacion-ordenes');
          break;
        case 'requisiciones':
          router.push(
            wantsMenu
              ? '/requisiciones?menu=1'
              : subItemId
              ? `/requisiciones?sub=${subItemId}`
              : '/requisiciones'
          );
          break;
        case 'rh':
        case 'rrhh':
          router.push(subItemId ? `/rrhh?sub=${subItemId}` : '/rrhh');
          break;
        case 'admin':
          router.push(wantsMenu ? '/admin?menu=1' : subItemId ? `/admin?vista=${subItemId}` : '/admin');
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

  const handleBackToMenu = () => {
    if (isModuleSelectorOpen) {
      return;
    }
    const targetMod =
      activeModuleId === 'compras' || activeModuleId === 'admin' ? activeModuleId : 'crm';
    if (targetMod === 'compras' && esPortalCompras) {
      router.push('/compras');
      return;
    }
    handleModuleSelection(targetMod, '__menu__');
  };

  return (
    <div
      className={`app-layout ${userData.portal === 'rh' ? 'portal-rh' : userData.portal === 'almacen' ? 'portal-almacen' : userData.portal === 'compras' ? 'portal-compras' : 'portal-crm'} ${
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
        activeModuleId={activeModuleId}
        activeSubItemId={activeSubItemId}
        onBackToMenu={handleBackToMenu}
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onLogout={() => {
          void handleLogout();
        }}
        onSelectModule={handleModuleSelection}
        isChatCenterOpen={isChatCenterOpen}
        onToggleChatCenter={() => setIsChatCenterOpen((prev) => !prev)}
        unreadChatCount={unreadChatCount}
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
        ) : esPortalAutorizacion ? (
          <SidebarAutorizacion
            isCollapsed={isCollapsed}
            isMobileOpen={isMobileOpen}
            onCloseMobile={() => setIsMobileOpen(false)}
            onSelectModule={handleModuleSelection}
          />
        ) : esPortalCompras ? (
          <SidebarCompras
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

        <main
          className={`layout-content-area ${
            activeModuleId === 'crm' && !isModuleSelectorOpen ? 'is-crm-flush' : ''
          }`}
          id="main-content"
        >
          <div className="content-inner-container">
            {isModuleSelectorOpen ? (
              <MenuSelectivoModulo
                moduleId={activeModuleId as 'crm' | 'compras' | 'admin'}
                rolUsuario={usuario?.rol ?? 'administrador'}
                onSelectSubmodule={handleModuleSelection}
              />
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Centro de Conversaciones y Chat Flotante (Exclusivo Portal CRM) */}
      {portalDeterminado === 'crm' && (
        <CentroConversaciones
          isPopoverOpen={isChatCenterOpen}
          onClosePopover={() => setIsChatCenterOpen(false)}
          onUnreadChange={setUnreadChatCount}
          userName={userData.name}
        />
      )}

      {/* Footer Oficial SIFYGSA 100% Ancho */}
      <Footer portal={userData.portal} />
    </div>
  );
};
