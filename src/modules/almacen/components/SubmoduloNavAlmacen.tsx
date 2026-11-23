'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SubmoduloAlmacenId = 'articulos' | 'servicios' | 'inventarios' | 'mantenimiento' | 'requisiciones';

interface SubmoduloNavAlmacenProps {
  activeTab?: SubmoduloAlmacenId;
}

interface AlmacenLauncherItem {
  id: SubmoduloAlmacenId;
  href: string;
  title: string;
  description: string;
  colorClass: 'cyan' | 'slate' | 'emerald' | 'indigo' | 'amber' | 'brand';
  icon: React.ReactNode;
}

const ALMACEN_LAUNCHER_ITEMS: AlmacenLauncherItem[] = [
  {
    id: 'articulos',
    href: '/almacen/articulos',
    title: 'Artículos',
    description: 'Catálogo Institucional, SKUs, categorias y alta de insumos',
    colorClass: 'brand',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        inventory_2
      </span>
    ),
  },
  {
    id: 'servicios',
    href: '/almacen/servicios',
    title: 'Servicios',
    description: 'Servicios no inventariables, calibraciones y pruebas...',
    colorClass: 'emerald',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        extension
      </span>
    ),
  },
  {
    id: 'inventarios',
    href: '/almacen/inventarios',
    title: 'Inventarios',
    description: 'Control de existencias, ubicaciones, naves y...',
    colorClass: 'amber',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        warehouse
      </span>
    ),
  },
  {
    id: 'mantenimiento',
    href: '/almacen/mantenimiento',
    title: 'Mantenimiento',
    description: 'Control de taller, calibraciones, reparaciones y reingreso',
    colorClass: 'indigo',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        build
      </span>
    ),
  },
  {
    id: 'requisiciones',
    href: '/requisiciones',
    title: 'Requisiciones',
    description: 'Solicitudes y pedidos de materiales y suministros',
    colorClass: 'amber',
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffffff' }}>
        assignment
      </span>
    ),
  },
];

export const SubmoduloNavAlmacen: React.FC<SubmoduloNavAlmacenProps> = ({ activeTab }) => {
  const pathname = usePathname() || '';

  const tabActiva: SubmoduloAlmacenId | null =
    activeTab ||
    (pathname.startsWith('/almacen/articulos') || pathname.startsWith('/almacen/alta-articulo')
      ? 'articulos'
      : pathname.startsWith('/almacen/servicios') || pathname.startsWith('/almacen/alta-servicio')
      ? 'servicios'
      : pathname.startsWith('/almacen/inventarios')
      ? 'inventarios'
      : pathname.startsWith('/almacen/mantenimiento')
      ? 'mantenimiento'
      : pathname.startsWith('/requisiciones')
      ? 'requisiciones'
      : null);

  return (
    <nav className="cp-ventas-launcher-bar" aria-label="Selector de Submódulos de Almacén">
      <div className="cp-ventas-launcher-grid">
        {ALMACEN_LAUNCHER_ITEMS.map((item) => {
          const isActive = tabActiva === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`cp-ventas-tile ${isActive ? 'is-active' : ''}`}
            >
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

export default SubmoduloNavAlmacen;
