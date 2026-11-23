'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { MOCK_COMPRAS_FILTROS } from '../data/mock-data';

export type SubmoduloComprasId =
  | 'nueva-orden'
  | 'ordenes'
  | 'ordenes-por-actualizar'
  | 'ordenes-pendientes'
  | 'autorizar-ordenes'
  | 'proveedores'
  | 'nuevo-proveedor'
  | 'requisiciones'
  | 'aprobar-requisiciones'
  | 'facturas';

interface SubmoduloNavComprasProps {
  activeTab?: SubmoduloComprasId;
  modo?: 'completo' | 'compras-puro' | 'proveedores-puro';
  incluirNuevaOrden?: boolean;
  incluirNuevoProveedor?: boolean;
}

interface ComprasLauncherItem {
  id: SubmoduloComprasId;
  href: string;
  title: string;
  description: string;
  colorClass: 'cyan' | 'slate' | 'emerald' | 'indigo' | 'amber' | 'brand' | 'rose';
  icon: React.ReactNode;
  badge?: number | string;
  badgeType?: 'warning' | 'info' | 'primary';
}

const TODOS_LAUNCHER_ITEMS: ComprasLauncherItem[] = [
  {
    id: 'nueva-orden',
    href: '/compras/ordenes/nueva',
    title: 'Nueva Orden de Compra',
    description: 'Captura directa de ODC, partidas, cotizaciones y firmas',
    colorClass: 'brand',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        add_shopping_cart
      </span>
    ),
  },
  {
    id: 'ordenes',
    href: '/compras/ordenes',
    title: 'Órdenes de Compra',
    description: 'Gestión, seguimiento y control de órdenes de compra',
    colorClass: 'cyan',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        description
      </span>
    ),
  },
  {
    id: 'ordenes-por-actualizar',
    href: '/compras/ordenes?filtro=por-actualizar',
    title: 'Por Actualizar',
    description: 'Órdenes abiertas que requieren seguimiento o factura',
    colorClass: 'amber',
    badge: MOCK_COMPRAS_FILTROS.ordenesPorActualizarCount,
    badgeType: 'warning',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        update
      </span>
    ),
  },
  {
    id: 'ordenes-pendientes',
    href: '/compras/ordenes?filtro=pendientes',
    title: 'Órdenes Pendientes',
    description: 'En espera de validación gerencial y liberación',
    colorClass: 'brand',
    badge: MOCK_COMPRAS_FILTROS.ordenesPendientesCount,
    badgeType: 'primary',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        pending_actions
      </span>
    ),
  },
  {
    id: 'autorizar-ordenes',
    href: '/compras/ordenes?vista=autorizar',
    title: 'Autorización de Órdenes',
    description: 'Validación gerencial, firma digital y liberación de ODC',
    colorClass: 'amber',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        verified_user
      </span>
    ),
  },
  {
    id: 'proveedores',
    href: '/compras/proveedores',
    title: 'Proveedores',
    description: 'Directorio unificado, cuentas y cumplimiento SAT 32-D',
    colorClass: 'emerald',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        groups
      </span>
    ),
  },
  {
    id: 'nuevo-proveedor',
    href: '/compras/proveedores/nuevo',
    title: 'Nuevo Proveedor',
    description: 'Formulario de alta y registro fiscal de contratistas',
    colorClass: 'indigo',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        person_add
      </span>
    ),
  },
  {
    id: 'requisiciones',
    href: '/requisiciones',
    title: 'Requisiciones',
    description: 'Gestión, solicitudes y seguimiento de requisiciones',
    colorClass: 'amber',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        assignment
      </span>
    ),
  },
];

export const SubmoduloNavCompras: React.FC<SubmoduloNavComprasProps> = ({
  activeTab,
  modo = 'completo',
  incluirNuevaOrden = true,
  incluirNuevoProveedor = true,
}) => {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const vistaParam = searchParams?.get('vista');
  const filtroParam = searchParams?.get('filtro');

  const tabActiva: SubmoduloComprasId =
    activeTab ||
    (pathname === '/compras/ordenes/nueva'
      ? 'nueva-orden'
      : pathname === '/compras/proveedores/nuevo'
      ? 'nuevo-proveedor'
      : pathname.startsWith('/compras/proveedores')
      ? 'proveedores'
      : pathname.startsWith('/requisiciones')
      ? 'requisiciones'
      : pathname.startsWith('/compras/ordenes') && vistaParam === 'autorizar'
      ? 'autorizar-ordenes'
      : pathname.startsWith('/compras/ordenes') && filtroParam === 'por-actualizar'
      ? 'ordenes-por-actualizar'
      : pathname.startsWith('/compras/ordenes') && filtroParam === 'pendientes'
      ? 'ordenes-pendientes'
      : pathname.startsWith('/compras/ordenes')
      ? 'ordenes'
      : ('' as SubmoduloComprasId));

  const itemsVisibles = TODOS_LAUNCHER_ITEMS.filter((item) => {
    if (modo === 'compras-puro') {
      return (
        item.id === 'nueva-orden' ||
        item.id === 'ordenes' ||
        item.id === 'ordenes-por-actualizar' ||
        item.id === 'ordenes-pendientes' ||
        item.id === 'autorizar-ordenes' ||
        item.id === 'requisiciones'
      );
    }
    if (modo === 'proveedores-puro') {
      return item.id === 'proveedores' || item.id === 'nuevo-proveedor';
    }
    if (!incluirNuevaOrden && item.id === 'nueva-orden') return false;
    if (!incluirNuevoProveedor && item.id === 'nuevo-proveedor') return false;
    return true;
  });

  return (
    <nav
      className="cp-ventas-launcher-bar"
      aria-label="Selector de Submódulos de Compras y Proveedores"
    >
      <div className="cp-ventas-launcher-grid">
        {itemsVisibles.map((item) => {
          const isActive = tabActiva === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`cp-ventas-tile ${isActive ? 'is-active' : ''}`}
            >
              {item.badge !== undefined && (
                <span
                  className={`cp-ventas-tile-badge ${
                    item.badgeType === 'warning' ? 'badge-warning' : 'badge-primary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              <div className={`cp-ventas-tile-icon tile-color-${item.colorClass}`}>
                {item.icon}
              </div>
              <span className="cp-ventas-tile-title">{item.title}</span>
              <span className="cp-ventas-tile-subtitle">{item.description}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default SubmoduloNavCompras;
