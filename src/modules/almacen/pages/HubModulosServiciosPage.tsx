'use client';

import React from 'react';
import { HubSubmodulosAlmacen, type SubmoduloCardItem } from '../components/HubSubmodulosAlmacen';

const SUBMODULOS_SERVICIOS: SubmoduloCardItem[] = [
  {
    id: 'nuevo-servicio',
    href: '/almacen/alta-servicio',
    title: 'Nuevo servicio',
    description: 'Formulario asistido de alta.',
    icon: 'extension',
    colorClass: 'emerald',
    tag: 'Alta Asistida 3 Pasos',
  },
  {
    id: 'entrada-inventario',
    href: '/almacen/recepcion-ir03?origen=servicios',
    title: 'Entrada a inventario',
    description: 'Recepción de servicio (IR03).',
    icon: 'move_to_inbox',
    colorClass: 'brand',
    tag: 'Recepción y Validación Física',
  },
  {
    id: 'salida-inventario',
    href: '/almacen/salida?origen=servicios',
    title: 'Salida de inventario',
    description: 'Vale de salida a proyecto (SA).',
    icon: 'outbox',
    colorClass: 'amber',
    tag: 'Asignación de Servicio a Obra',
  },
  {
    id: 'requisiciones',
    href: '/requisiciones',
    title: 'Requisiciones',
    description: 'Requisición de servicios técnicos y calibración.',
    icon: 'assignment',
    colorClass: 'emerald',
    tag: 'Solicitud de Servicios',
  },
];

export const HubModulosServiciosPage: React.FC = () => {
  return (
    <HubSubmodulosAlmacen
      titulo="Servicios"
      subtitulo="Gestión de catálogo, entradas y salidas de servicios."
      badgeTexto="4 Submódulos"
      headerIcon="extension"
      headerColorClass="emerald"
      breadcrumbModulo="Módulos de Servicios"
      items={SUBMODULOS_SERVICIOS}
    />
  );
};

export default HubModulosServiciosPage;
