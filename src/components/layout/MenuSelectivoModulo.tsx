'use client';

import React from 'react';
import type { RolUsuario } from '@/config/types';
import { obtenerSubItemsPermitidosModulo } from '@/modules/registry';
import { useLanguage } from '@/context/LanguageContext';

export interface SelectedMenuIconMeta {
  id: string;
  title: string;
  colorClass: 'brand' | 'blue' | 'emerald' | 'amber' | 'slate' | 'cyan' | 'indigo';
  isCalendarTile?: boolean;
  icon: React.ReactNode;
}

export function getSelectedMenuIconMeta(
  activeModuleId: string,
  activeSubItemId?: string
): SelectedMenuIconMeta {
  // Si está en el selector de módulos (?menu=1), mostramos el icono del módulo activo
  if (activeSubItemId === '__menu__') {
    if (activeModuleId === 'compras') {
      return {
        id: 'menu-compras',
        title: 'Menú de Operaciones & Requisiciones',
        colorClass: 'amber',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
    }
    if (activeModuleId === 'rh' || activeModuleId === 'rrhh') {
      return {
        id: 'menu-rh',
        title: 'Menú de Recursos Humanos',
        colorClass: 'brand',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
    }
    if (activeModuleId === 'admin') {
      return {
        id: 'menu-admin',
        title: 'Menú de Administración',
        colorClass: 'slate',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
    }
    return {
      id: 'menu-crm',
      title: 'Menú CRM & Gestión Comercial',
      colorClass: 'brand',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };
  }

  // Submódulos de CRM (Idénticos a los iconos de la segunda imagen)
  if (activeModuleId === 'crm') {
    switch (activeSubItemId) {
      case 'crm-calendar':
        return {
          id: 'crm-calendar',
          title: 'Calendario',
          colorClass: 'slate',
          isCalendarTile: true,
          icon: null,
        };
      case 'crm-clientes':
        return {
          id: 'crm-clientes',
          title: 'Contactos',
          colorClass: 'emerald',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'crm-tableros':
        return {
          id: 'crm-tableros',
          title: 'Tableros',
          colorClass: 'indigo',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M4 5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1h-6a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'crm-leads':
        return {
          id: 'crm-leads',
          title: 'Iniciativas (Leads)',
          colorClass: 'amber',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M13 10V3L4 14h7v7l9-11h-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'crm-opportunities':
        return {
          id: 'crm-opportunities',
          title: 'Lista de Ventas',
          colorClass: 'brand',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'crm-reportes':
        return {
          id: 'crm-reportes',
          title: 'Reportes & Pipeline',
          colorClass: 'cyan',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'crm-kanban':
      case 'crm-opportunity-detail':
      default:
        return {
          id: 'crm-kanban',
          title: 'CRM',
          colorClass: 'cyan',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M7 11.5V14m0-2.5l3 3 5-5m-8 4.5l3-3m2 3.5l3-3m-8-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
    }
  }

  // Submódulos de Compras / Operaciones
  if (activeModuleId === 'compras') {
    if (activeSubItemId === 'compras-nueva' || activeSubItemId === 'nueva') {
      return {
        id: 'compras-nueva',
        title: 'Nueva Requisición',
        colorClass: 'brand',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      };
    }
    if (
      activeSubItemId === 'compras-mis-requisiciones' ||
      activeSubItemId === 'mis-requisiciones'
    ) {
      return {
        id: 'compras-mis-requisiciones',
        title: 'Mis Requisiciones',
        colorClass: 'blue',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
    }
    if (
      activeSubItemId === 'compras-aprobaciones' ||
      activeSubItemId === 'aprobaciones'
    ) {
      return {
        id: 'compras-aprobaciones',
        title: 'Centro de Aprobaciones',
        colorClass: 'emerald',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
    }
    return {
      id: 'compras-suite',
      title: 'Compras & Procura',
      colorClass: 'brand',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };
  }

  // Submódulos de Administración
  if (activeModuleId === 'admin') {
    if (activeSubItemId === 'permisos') {
      return {
        id: 'permisos',
        title: 'Permisos y Roles',
        colorClass: 'amber',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      };
    }
    if (activeSubItemId === 'auditoria') {
      return {
        id: 'auditoria',
        title: 'Auditoría',
        colorClass: 'slate',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
    }
    return {
      id: 'resumen',
      title: 'Administración',
      colorClass: 'brand',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };
  }

  // Submódulos de Recursos Humanos
  if (activeModuleId === 'rh' || activeModuleId === 'rrhh') {
    switch (activeSubItemId) {
      case 'rrhh-alta':
        return {
          id: 'rrhh-alta',
          title: 'Registro del Personal',
          colorClass: 'blue',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'rrhh-catalogos':
        return {
          id: 'rrhh-catalogos',
          title: 'Directorio de Personal',
          colorClass: 'indigo',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'rrhh-vacaciones':
        return {
          id: 'rrhh-vacaciones',
          title: 'Vacaciones',
          colorClass: 'emerald',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        };
      case 'rrhh-formatos':
        return {
          id: 'rrhh-formatos',
          title: 'Formatos SGI',
          colorClass: 'amber',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'rrhh-departamentos':
        return {
          id: 'rrhh-departamentos',
          title: 'Departamentos',
          colorClass: 'cyan',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'rrhh-extensiones':
        return {
          id: 'rrhh-extensiones',
          title: 'Extensiones Telefónicas',
          colorClass: 'indigo',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'rrhh-cumpleanos':
        return {
          id: 'rrhh-cumpleanos',
          title: 'Cumpleaños',
          colorClass: 'amber',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
      case 'rrhh-festivos':
        return {
          id: 'rrhh-festivos',
          title: 'Días Festivos',
          colorClass: 'slate',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        };
      case 'rrhh-panel':
      case 'rh-directorio':
      default:
        return {
          id: 'rrhh-panel',
          title: 'Menú Principal RH',
          colorClass: 'brand',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M4 5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1h-6a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        };
    }
  }

  // Ajustes
  if (activeModuleId === 'settings') {
    return {
      id: 'settings',
      title: 'Ajustes del Sistema',
      colorClass: 'slate',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };
  }

  // Dashboard / Inicio por defecto
  return {
    id: 'dashboard',
    title: 'Inicio SIFYGSA',
    colorClass: 'brand',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  };
}

export interface MenuSelectivoModuloProps {
  moduleId: 'crm' | 'compras' | 'admin' | 'rh';
  rolUsuario: RolUsuario;
  onSelectSubmodule: (moduleId: string, subItemId?: string) => void;
}

interface LauncherTile {
  id: string;
  targetModule: string;
  targetSubItem: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  colorClass: 'brand' | 'blue' | 'emerald' | 'amber' | 'slate' | 'cyan' | 'indigo';
  badge?: string;
  isCalendarTile?: boolean;
  icon: React.ReactNode;
}

export const MenuSelectivoModulo: React.FC<MenuSelectivoModuloProps> = ({
  moduleId,
  rolUsuario,
  onSelectSubmodule,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const crmTiles: LauncherTile[] = [
    {
      id: 'crm-kanban',
      targetModule: 'crm',
      targetSubItem: 'crm-kanban',
      title: 'CRM',
      titleEn: 'CRM Pipeline',
      description: 'Flujo visual interactivo de etapas y oportunidades',
      descriptionEn: 'Interactive visual pipeline across sales stages',
      colorClass: 'cyan',
      badge: 'Principal',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M7 11.5V14m0-2.5l3 3 5-5m-8 4.5l3-3m2 3.5l3-3m-8-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'crm-calendar',
      targetModule: 'crm',
      targetSubItem: 'crm-calendar',
      title: 'Calendario',
      titleEn: 'Calendar',
      description: 'Agenda semanal de actividades, reuniones y visitas',
      descriptionEn: 'Weekly schedule for activities, meetings and visits',
      colorClass: 'slate',
      isCalendarTile: true,
      icon: null,
    },
    {
      id: 'crm-clientes',
      targetModule: 'crm',
      targetSubItem: 'crm-clientes',
      title: 'Contactos',
      titleEn: 'Contacts',
      description: 'Directorio unificado de cuentas, empresas y contactos',
      descriptionEn: 'Unified accounts directory and client contacts',
      colorClass: 'emerald',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'crm-tableros',
      targetModule: 'crm',
      targetSubItem: 'crm-tableros',
      title: 'Tableros',
      titleEn: 'Dashboards',
      description: 'Métricas, proyecciones y análisis de ventas',
      descriptionEn: 'Metrics, forecasts and sales analytics',
      colorClass: 'indigo',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M4 5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1h-6a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'crm-leads',
      targetModule: 'crm',
      targetSubItem: 'crm-leads',
      title: 'Iniciativas (Leads)',
      titleEn: 'Leads',
      description: 'Prospectos entrantes y conversión a oportunidades',
      descriptionEn: 'Incoming leads and conversion into opportunities',
      colorClass: 'amber',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M13 10V3L4 14h7v7l9-11h-7z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'crm-opportunities',
      targetModule: 'crm',
      targetSubItem: 'crm-opportunities',
      title: 'Lista de Ventas',
      titleEn: 'Sales List',
      description: 'Vista tabular rápida y exportación de cartera',
      descriptionEn: 'Quick tabular list view and portfolio export',
      colorClass: 'brand',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'crm-reportes',
      targetModule: 'crm',
      targetSubItem: 'crm-reportes',
      title: 'Reportes & Pipeline',
      titleEn: 'Reports & Pipeline',
      description: 'Pronóstico, métricas por zona y exportación',
      descriptionEn: 'Forecasting, regional metrics and exports',
      colorClass: 'cyan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const comprasTiles: LauncherTile[] = [
    {
      id: 'compras-ordenes',
      targetModule: 'compras',
      targetSubItem: 'ordenes',
      title: 'Órdenes de Compra',
      titleEn: 'Purchase Orders',
      description: 'Control ejecutivo, listado y seguimiento de adquisiciones',
      descriptionEn: 'Executive control, listing and purchase tracking',
      colorClass: 'cyan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'compras-autorizar-oc',
      targetModule: 'compras',
      targetSubItem: 'autorizar-ordenes',
      title: 'Autorizar Órdenes',
      titleEn: 'Authorize POs',
      description: 'Validación gerencial, firma digital y liberación de ODC',
      descriptionEn: 'Executive approval, digital sign-off and PO release',
      colorClass: 'emerald',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'compras-nueva-oc',
      targetModule: 'compras',
      targetSubItem: 'nueva-orden',
      title: 'Nueva Orden (ODC)',
      titleEn: 'New Purchase Order',
      description: 'Asistente multietapa para emitir nueva orden de compra',
      descriptionEn: 'Multi-step wizard to issue a new purchase order',
      colorClass: 'brand',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'compras-proveedores',
      targetModule: 'compras',
      targetSubItem: 'proveedores',
      title: 'Proveedores',
      titleEn: 'Suppliers',
      description: 'Padrón maestro, líneas de crédito y opinión SAT 32-D',
      descriptionEn: 'Master directory, credit limits and tax compliance',
      colorClass: 'indigo',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'compras-requisiciones',
      targetModule: 'compras',
      targetSubItem: 'requisiciones',
      title: 'Requisiciones',
      titleEn: 'Requisitions',
      description: 'Catálogo de solicitudes internas y control de obra',
      descriptionEn: 'Internal requisitions catalog and project tracking',
      colorClass: 'amber',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M13 10V3L4 14h7v7l9-11h-7z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'compras-aprobar-req',
      targetModule: 'compras',
      targetSubItem: 'aprobar-requisiciones',
      title: 'Aprobar Requisiciones',
      titleEn: 'Approve Requisitions',
      description: 'Bandeja de aprobación multinivel y conversión a ODC',
      descriptionEn: 'Multi-level approval inbox and conversion to PO',
      colorClass: 'slate',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'compras-facturas',
      targetModule: 'compras',
      targetSubItem: 'facturas',
      title: 'Facturas CFDI 4.0',
      titleEn: 'CFDI 4.0 Invoices',
      description: 'Recepción fiscal XML/PDF, validación y programación de pago',
      descriptionEn: 'XML/PDF invoice reception, validation and payment',
      colorClass: 'cyan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const permittedAdmin = obtenerSubItemsPermitidosModulo('admin', rolUsuario);
  const adminMeta: Record<string, Omit<LauncherTile, 'id' | 'targetModule' | 'targetSubItem' | 'title' | 'titleEn'>> = {
    resumen: {
      description: 'Panel ejecutivo, métricas globales y usuarios',
      descriptionEn: 'Executive summary and user account management',
      colorClass: 'brand',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    permisos: {
      description: 'Matriz de roles y control granular de accesos',
      descriptionEn: 'Role matrix and granular access control',
      colorClass: 'amber',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    auditoria: {
      description: 'Historial de sesiones, cambios y trazabilidad',
      descriptionEn: 'Session log, changes and audit trail',
      colorClass: 'slate',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  };

  const permittedRh = obtenerSubItemsPermitidosModulo('rrhh', rolUsuario);
  const rhMeta: Record<string, Omit<LauncherTile, 'id' | 'targetModule' | 'targetSubItem' | 'title' | 'titleEn'>> = {
    'rrhh-panel': {
      description: 'Plantilla, KPIs y agenda semanal',
      descriptionEn: 'Workforce KPIs and weekly agenda',
      colorClass: 'brand',
      badge: 'Principal',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-panel').icon,
    },
    'rrhh-alta': {
      description: 'Alta y expediente en 6 etapas',
      descriptionEn: '6-step onboarding and dossier',
      colorClass: 'blue',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-alta').icon,
    },
    'rrhh-catalogos': {
      description: 'Plantilla, organigrama e importador',
      descriptionEn: 'Directory, org chart and importer',
      colorClass: 'indigo',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-catalogos').icon,
    },
    'rrhh-vacaciones': {
      description: 'Saldos LFT y solicitudes',
      descriptionEn: 'Vacation balances and requests',
      colorClass: 'emerald',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-vacaciones').icon,
    },
    'rrhh-formatos': {
      description: 'Trámites RH-01, RH-02, RH-13 y RH-15',
      descriptionEn: 'SGI workflows RH-01 to RH-15',
      colorClass: 'amber',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-formatos').icon,
    },
    'rrhh-departamentos': {
      description: 'Áreas oficiales, titulares y plantilla',
      descriptionEn: 'Official areas, managers and headcount',
      colorClass: 'cyan',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-departamentos').icon,
    },
    'rrhh-extensiones': {
      description: 'Extensiones internas por sede y área',
      descriptionEn: 'Internal extensions by site and area',
      colorClass: 'indigo',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-extensiones').icon,
    },
    'rrhh-cumpleanos': {
      description: 'Cumpleaños y felicitaciones',
      descriptionEn: 'Birthdays and greeting cards',
      colorClass: 'amber',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-cumpleanos').icon,
    },
    'rrhh-festivos': {
      description: 'Asuetos LFT y comunicados',
      descriptionEn: 'Official holidays and notices',
      colorClass: 'slate',
      icon: getSelectedMenuIconMeta('rh', 'rrhh-festivos').icon,
    },
  };

  const rhTiles: LauncherTile[] = permittedRh.map((sub) => {
    const meta = rhMeta[sub.id] ?? rhMeta['rrhh-panel'];
    return {
      id: sub.id,
      targetModule: 'rh',
      targetSubItem: sub.vista,
      title: sub.nombre,
      titleEn: sub.nombreEn,
      ...meta,
    };
  });

  const adminTiles: LauncherTile[] = permittedAdmin.map((sub) => {
    const meta = adminMeta[sub.id] ?? adminMeta.resumen;
    return {
      id: sub.id,
      targetModule: 'admin',
      targetSubItem: sub.vista,
      title: sub.nombre,
      titleEn: sub.nombreEn,
      ...meta,
    };
  });

  const moduleMeta =
    moduleId === 'crm'
      ? {
          title: isEn ? 'CRM & Commercial Management' : 'CRM & Gestión Comercial',
          subtitle: isEn
            ? 'Select a workspace view or CRM tool to continue'
            : 'Selecciona una vista o submódulo comercial para comenzar',
          badge: 'CRM SUITE',
          tiles: crmTiles,
        }
      : moduleId === 'compras'
      ? {
          title: isEn ? 'Operations & Requisitions' : 'Operaciones & Requisiciones',
          subtitle: isEn
            ? 'Select a requisition workflow to manage requests and approvals'
            : 'Selecciona una herramienta operativa para gestionar requisiciones y aprobaciones',
          badge: 'OPERACIONES',
          tiles: comprasTiles,
        }
      : moduleId === 'rh'
      ? {
          title: isEn ? 'Human Resources · RH Suite' : 'Recursos Humanos · RH Suite',
          subtitle: isEn
            ? 'Select a Human Resources submodule'
            : 'Selecciona un submódulo de Recursos Humanos',
          badge: 'RH SUITE',
          tiles: rhTiles,
        }
      : {
          title: isEn ? 'System Administration' : 'Administración General',
          subtitle: isEn
            ? 'Manage platform users, role permissions and audit records'
            : 'Administra usuarios, permisos por rol y bitácora de auditoría',
          badge: 'ADMIN',
          tiles: adminTiles,
        };

  return (
    <section className="selective-menu-workspace" aria-label={moduleMeta.title}>
      <div className="selective-menu-header">
        <div className="selective-menu-header-text">
          <div className="selective-menu-badge-row">
            <span className="selective-menu-badge">{moduleMeta.badge}</span>
            <span className="selective-menu-count">
              {moduleMeta.tiles.length} {isEn ? 'available modules' : 'submódulos disponibles'}
            </span>
          </div>
          <h1 className="selective-menu-title">{moduleMeta.title}</h1>
          <p className="selective-menu-subtitle">{moduleMeta.subtitle}</p>
        </div>
      </div>

      <div className="selective-menu-grid">
        {moduleMeta.tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className="selective-menu-tile group"
            onClick={() => onSelectSubmodule(tile.targetModule, tile.targetSubItem)}
          >
            <div className={`selective-tile-icon-box tile-color-${tile.colorClass}`}>
              {tile.isCalendarTile ? (
                <div className="selective-calendar-widget">
                  <span className="selective-calendar-month">NOV</span>
                  <span className="selective-calendar-day">11</span>
                </div>
              ) : (
                tile.icon
              )}
            </div>
            <span className="selective-tile-title">
              {isEn ? tile.titleEn : tile.title}
            </span>
            <span className="selective-tile-desc">
              {isEn ? tile.descriptionEn : tile.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default MenuSelectivoModulo;

