'use client';

import React from 'react';
import { HubSubmodulosAlmacen, type SubmoduloCardItem } from '../components/HubSubmodulosAlmacen';

const SUBMODULOS_ARTICULOS: SubmoduloCardItem[] = [
  {
    id: 'nuevo-articulo',
    href: '/almacen/alta-articulo',
    title: 'Nuevo artículo',
    description: 'Formulario asistido de alta.',
    icon: 'add_box',
    colorClass: 'brand',
    tag: 'Alta Asistida 3 Pasos',
  },
  {
    id: 'entrada-inventario',
    href: '/almacen/recepcion-ir03?origen=articulos',
    title: 'Entrada a inventario',
    description: 'Recepción de mercancía (IR03).',
    icon: 'move_to_inbox',
    colorClass: 'emerald',
    tag: 'Recepción Física e Inspección',
  },
  {
    id: 'salida-inventario',
    href: '/almacen/salida?origen=articulos',
    title: 'Salida de inventario',
    description: 'Vale de salida a proyecto (SA).',
    icon: 'outbox',
    colorClass: 'amber',
    tag: 'Vales de Salida y Préstamos',
  },
  {
    id: 'requisiciones',
    href: '/requisiciones',
    title: 'Requisiciones',
    description: 'Solicitud y pedido de materiales a compras.',
    icon: 'assignment',
    colorClass: 'brand',
    tag: 'Solicitudes y Pedidos',
  },
];

export const HubModulosArticulosPage: React.FC = () => {
  return (
    <HubSubmodulosAlmacen
      titulo="Artículos"
      subtitulo="Gestión de catálogo, entradas y salidas de inventario de artículos."
      badgeTexto="4 Submódulos"
      headerIcon="inventory_2"
      headerColorClass="brand"
      breadcrumbModulo="Módulos de Artículos"
      items={SUBMODULOS_ARTICULOS}
    />
  );
};

export default HubModulosArticulosPage;
