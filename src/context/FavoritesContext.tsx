'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { IdModulo, RolUsuario } from '@/config/types';
import { REGISTRO_MODULOS, obtenerSubItemsPermitidosModulo } from '@/modules/registry';

export type PortalFavoritos = 'crm' | 'rh' | 'almacen';

export interface FavoritoItem {
  key: string;          // ej: "almacen:recepcion-ir03" o "crm:crm-opportunities"
  moduleId: string;     // ej: "almacen", "crm", "compras", "rh", "admin"
  subItemId: string;    // vista o id de subitem
  moduloNombre: string;
  moduloNombreEn: string;
  nombre: string;
  nombreEn: string;
  descripcion?: string;
}

type FavoritesByPortal = Record<PortalFavoritos, string[]>;

interface FavoritesContextProps {
  getFavoritesForPortal: (portal: PortalFavoritos) => string[];
  isFavorite: (portal: PortalFavoritos, moduleId: string, subItemId?: string) => boolean;
  toggleFavorite: (portal: PortalFavoritos, moduleId: string, subItemId?: string) => void;
  addFavorite: (portal: PortalFavoritos, moduleId: string, subItemId?: string) => void;
  removeFavorite: (portal: PortalFavoritos, moduleId: string, subItemId?: string) => void;
  getCatalogForPortal: (
    portal: PortalFavoritos,
    rolUsuario?: RolUsuario,
    showAdmin?: boolean
  ) => FavoritoItem[];
}

const STORAGE_KEY = 'sfg_favorites_by_portal_v2';

function normalizeModuleId(moduleId: string): string {
  if (moduleId === 'requisiciones') return 'compras';
  if (moduleId === 'rrhh') return 'rh';
  return moduleId;
}

export function buildFavoriteKey(moduleId: string, subItemId: string = ''): string {
  const normMod = normalizeModuleId(moduleId);
  return `${normMod}:${subItemId || ''}`;
}

const DEFAULT_FAVORITES_BY_PORTAL: FavoritesByPortal = {
  crm: [
    'crm:crm-opportunities',
    'crm:crm-kanban',
    'crm:crm-avanzado',
    'compras:compras-mis-requisiciones',
  ],
  rh: [
    'rh:rrhh-panel',
    'rh:rrhh-catalogos',
    'rh:rrhh-vacaciones',
    'rh:rrhh-formatos',
    'compras:compras-mis-requisiciones',
  ],
  almacen: [
    'almacen:',
    'almacen:recepcion-ir03',
    'almacen:salida',
    'almacen:alta-articulo',
    'compras:compras-mis-requisiciones',
  ],
};

function getAllowedModulesForPortal(
  portal: PortalFavoritos,
  showAdmin: boolean = false
): IdModulo[] {
  if (portal === 'rh') {
    return ['rrhh', 'requisiciones'];
  }
  if (portal === 'almacen') {
    return ['almacen', 'requisiciones'];
  }
  // Portal CRM / General
  const mods: IdModulo[] = ['crm', 'requisiciones'];
  if (showAdmin) {
    mods.push('admin');
  }
  return mods;
}

export function getCatalogItemsForPortal(
  portal: PortalFavoritos,
  rolUsuario?: RolUsuario,
  showAdmin: boolean = false
): FavoritoItem[] {
  const allowedModules = getAllowedModulesForPortal(portal, showAdmin);
  const items: FavoritoItem[] = [];

  for (const mod of REGISTRO_MODULOS) {
    if (!allowedModules.includes(mod.id)) continue;

    const navModuleId = mod.id === 'requisiciones' ? 'compras' : mod.id === 'rrhh' ? 'rh' : mod.id;

    // En Almacén todos los submódulos de almacén se muestran; en los demás filtramos por permisos del rol
    const subItems =
      rolUsuario && !(portal === 'almacen' && mod.id === 'almacen')
        ? obtenerSubItemsPermitidosModulo(mod.id, rolUsuario)
        : mod.subItems;

    for (const sub of subItems) {
      const subVista = sub.vista || '';
      items.push({
        key: buildFavoriteKey(navModuleId, subVista),
        moduleId: navModuleId,
        subItemId: subVista,
        moduloNombre: mod.nombre,
        moduloNombreEn: mod.nombreEn,
        nombre: sub.nombre,
        nombreEn: sub.nombreEn,
        descripcion: mod.descripcion,
      });
    }
  }

  return items;
}

const FavoritesContext = createContext<FavoritesContextProps | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializamos siempre con DEFAULT_FAVORITES_BY_PORTAL tanto en SSR como en el primer render del cliente
  // para evitar errores de Hydration Mismatch en Next.js.
  const [favoritesByPortal, setFavoritesByPortal] = useState<FavoritesByPortal>(
    DEFAULT_FAVORITES_BY_PORTAL
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar favoritos por portal desde localStorage al montar en el cliente
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FavoritesByPortal>;
        if (parsed && typeof parsed === 'object') {
          setFavoritesByPortal({
            crm: Array.isArray(parsed.crm) ? parsed.crm : DEFAULT_FAVORITES_BY_PORTAL.crm,
            rh: Array.isArray(parsed.rh) ? parsed.rh : DEFAULT_FAVORITES_BY_PORTAL.rh,
            almacen: Array.isArray(parsed.almacen)
              ? parsed.almacen
              : DEFAULT_FAVORITES_BY_PORTAL.almacen,
          });
        }
      }
    } catch {
      // Ignore parse error
    }
    setIsHydrated(true);
  }, []);

  // Guardar en localStorage cuando cambien los favoritos de cualquier portal
  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesByPortal));
    } catch {
      // Ignore storage error
    }
  }, [favoritesByPortal, isHydrated]);

  const getFavoritesForPortal = useCallback(
    (portal: PortalFavoritos): string[] => {
      return favoritesByPortal[portal] ?? DEFAULT_FAVORITES_BY_PORTAL[portal];
    },
    [favoritesByPortal]
  );

  const isFavorite = useCallback(
    (portal: PortalFavoritos, moduleId: string, subItemId: string = ''): boolean => {
      const key = buildFavoriteKey(moduleId, subItemId);
      const list = favoritesByPortal[portal] ?? [];
      return list.includes(key);
    },
    [favoritesByPortal]
  );

  const toggleFavorite = useCallback(
    (portal: PortalFavoritos, moduleId: string, subItemId: string = '') => {
      const key = buildFavoriteKey(moduleId, subItemId);
      setFavoritesByPortal((prev) => {
        const currentList = prev[portal] ?? [];
        const updatedList = currentList.includes(key)
          ? currentList.filter((k) => k !== key)
          : [...currentList, key];
        return {
          ...prev,
          [portal]: updatedList,
        };
      });
    },
    []
  );

  const addFavorite = useCallback(
    (portal: PortalFavoritos, moduleId: string, subItemId: string = '') => {
      const key = buildFavoriteKey(moduleId, subItemId);
      setFavoritesByPortal((prev) => {
        const currentList = prev[portal] ?? [];
        if (currentList.includes(key)) return prev;
        return {
          ...prev,
          [portal]: [...currentList, key],
        };
      });
    },
    []
  );

  const removeFavorite = useCallback(
    (portal: PortalFavoritos, moduleId: string, subItemId: string = '') => {
      const key = buildFavoriteKey(moduleId, subItemId);
      setFavoritesByPortal((prev) => {
        const currentList = prev[portal] ?? [];
        return {
          ...prev,
          [portal]: currentList.filter((k) => k !== key),
        };
      });
    },
    []
  );

  const getCatalogForPortal = useCallback(
    (portal: PortalFavoritos, rolUsuario?: RolUsuario, showAdmin: boolean = false) => {
      return getCatalogItemsForPortal(portal, rolUsuario, showAdmin);
    },
    []
  );

  return (
    <FavoritesContext.Provider
      value={{
        getFavoritesForPortal,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        getCatalogForPortal,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextProps => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de un FavoritesProvider');
  }
  return context;
};
