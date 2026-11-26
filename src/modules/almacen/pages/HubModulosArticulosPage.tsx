'use client';

import React, { useMemo } from 'react';
import { HubSubmodulosAlmacen, type SubmoduloCardItem } from '../components/HubSubmodulosAlmacen';
import { useAlmacen } from '../context/AlmacenContext';

export const HubModulosArticulosPage: React.FC = () => {
  const { mantenimientos } = useAlmacen();

  const alertasMantenimiento = useMemo(() => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const l30 = new Date(hoy);
    l30.setDate(l30.getDate() + 30);
    const limite30Str = l30.toISOString().slice(0, 10);

    return mantenimientos.filter((m) => {
      if (
        m.estado === 'Completado / Listo para Reingreso' ||
        m.estado === 'Baja Definitiva / Irreparable'
      ) {
        return false;
      }
      const fecha = m.fechaProgramada || m.fechaEstimadaRetorno;
      return Boolean(fecha && fecha <= limite30Str) || (Boolean(fecha && fecha < hoyStr));
    }).length;
  }, [mantenimientos]);

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
      id: 'mantenimiento-articulos',
      href: '/almacen/mantenimiento',
      title: 'Mantenimiento',
      description: 'Control de artículos que requieren servicio.',
      icon: 'build',
      colorClass: 'violet',
      tag: 'Programación y Bitácora',
      badge: alertasMantenimiento,
    },
  ];

  return (
    <HubSubmodulosAlmacen
      titulo="Artículos"
      subtitulo="Gestión de catálogo, entradas, salidas y mantenimiento de artículos."
      badgeTexto="4 Submódulos"
      headerIcon="inventory_2"
      headerColorClass="brand"
      breadcrumbModulo="Módulos de Artículos"
      items={SUBMODULOS_ARTICULOS}
    />
  );
};

export default HubModulosArticulosPage;
