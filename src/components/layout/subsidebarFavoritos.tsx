'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { RolUsuario } from '@/config/types';
import {
  useFavorites,
  buildFavoriteKey,
  type FavoritoItem,
  type PortalFavoritos,
} from '@/context/FavoritesContext';
import { useLanguage } from '@/context/LanguageContext';
import { IconStar, IconClose, IconPlus } from '../ui/Icons';

interface SubsidebarFavoritosProps {
  portal?: PortalFavoritos;
  rolUsuario?: RolUsuario;
  showAdmin?: boolean;
  activeModuleId: string;
  activeSubItemId?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  isCollapsed?: boolean;
}

export const SubsidebarFavoritos: React.FC<SubsidebarFavoritosProps> = ({
  portal = 'crm',
  rolUsuario,
  showAdmin = false,
  activeModuleId,
  activeSubItemId = '',
  onSelectModule,
  isCollapsed = false,
}) => {
  const { language, t } = useLanguage();
  const { getFavoritesForPortal, isFavorite, toggleFavorite, getCatalogForPortal } = useFavorites();

  const [isOpen, setIsOpen] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    zIndex: 9999,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calcula la posición fija del combobox flotante para que nunca sea recortado por el overflow del sidebar
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(8, rect.left)}px`,
      zIndex: 9999,
    });
  };

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${Math.max(8, rect.left)}px`,
        zIndex: 9999,
      });
    }
    setIsOpen((prev) => !prev);
  };

  // Focus preventScroll para que el navegador jamás haga scroll hacia abajo
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showCatalogPicker]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
        setShowCatalogPicker(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowCatalogPicker(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Catálogo exclusivo para este portal (CRM, RRHH o Almacén) y su rol
  const portalCatalogItems = getCatalogForPortal(portal, rolUsuario, showAdmin);
  const portalFavoritesKeys = getFavoritesForPortal(portal);

  // Determinar cuál es la pantalla activa actual para el botón "+ Agregar a Favoritos" estilo NetSuite
  const normalizedSub =
    activeModuleId === 'almacen' && activeSubItemId === 'almacen-dashboard'
      ? ''
      : activeModuleId === 'rh' && activeSubItemId === 'rh-directorio'
      ? 'rrhh-panel'
      : activeSubItemId || '';

  const currentKey = buildFavoriteKey(activeModuleId, normalizedSub);
  const currentCatalogItem: FavoritoItem | undefined =
    portalCatalogItems.find((item) => item.key === currentKey) ??
    portalCatalogItems.find((item) => item.moduleId === activeModuleId);

  const isCurrentPinned = currentCatalogItem
    ? isFavorite(portal, currentCatalogItem.moduleId, currentCatalogItem.subItemId)
    : false;

  const favoriteItems = portalCatalogItems.filter((item) =>
    portalFavoritesKeys.includes(item.key)
  );

  const filteredList = (showCatalogPicker ? portalCatalogItems : favoriteItems).filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.nombre.toLowerCase().includes(q) ||
      item.nombreEn.toLowerCase().includes(q) ||
      item.moduloNombre.toLowerCase().includes(q)
    );
  });

  const handleNavigate = (item: FavoritoItem) => {
    onSelectModule(item.moduleId, item.subItemId);
    setIsOpen(false);
    setShowCatalogPicker(false);
    setSearchQuery('');
  };

  const handleToggleCurrentPage = () => {
    if (!currentCatalogItem) return;
    toggleFavorite(portal, currentCatalogItem.moduleId, currentCatalogItem.subItemId);
  };

  const portalLabel =
    portal === 'rh'
      ? language === 'en'
        ? 'FAVORITES • HR'
        : 'FAVORITOS • RRHH'
      : portal === 'almacen'
      ? language === 'en'
        ? 'FAVORITES • WMS'
        : 'FAVORITOS • ALMACÉN'
      : language === 'en'
      ? 'FAVORITES • CRM'
      : 'FAVORITOS • CRM';

  return (
    <div className="subsidebar-favoritos-wrapper">
      <button
        ref={triggerRef}
        type="button"
        className={`tool-icon-btn favorite-btn ${isOpen || isCurrentPinned ? 'is-favorite' : ''}`}
        title={t('nav.favorites')}
        aria-label={t('nav.favorites')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={handleToggleOpen}
      >
        <IconStar size={16} filled={isOpen || isCurrentPinned} />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={dropdownStyle}
            className={`netsuite-favorites-combobox ${isCollapsed ? 'from-collapsed' : ''}`}
            role="dialog"
            aria-label="Menú de Favoritos NetSuite"
          >
            {/* Cabecera Estilo NetSuite con identificador del módulo */}
            <div className="ns-fav-header">
              <div className="ns-fav-header-title">
                <IconStar size={15} filled />
                <span>{portalLabel}</span>
                <span className="ns-fav-badge-count">{favoriteItems.length}</span>
              </div>
              <button
                type="button"
                className="ns-fav-close-btn"
                onClick={() => {
                  setIsOpen(false);
                  setShowCatalogPicker(false);
                }}
                title={language === 'en' ? 'Close' : 'Cerrar'}
              >
                <IconClose size={14} />
              </button>
            </div>

            {/* Acción Rápida NetSuite: Agregar / Quitar la vista actual */}
            {currentCatalogItem && (
              <div className="ns-fav-quick-action-bar">
                <button
                  type="button"
                  className={`ns-fav-current-action-btn ${isCurrentPinned ? 'is-pinned' : ''}`}
                  onClick={handleToggleCurrentPage}
                >
                  <IconStar size={14} filled={isCurrentPinned} />
                  <div className="ns-fav-current-text">
                    <span className="ns-fav-action-caption">
                      {isCurrentPinned
                        ? language === 'en'
                          ? 'Pinned in Favorites (Click to remove)'
                          : 'En Favoritos (Clic para quitar)'
                        : language === 'en'
                        ? '+ Add current view to Favorites'
                        : '+ Agregar vista actual a Favoritos'}
                    </span>
                    <span className="ns-fav-action-target">
                      {language === 'en'
                        ? currentCatalogItem.moduloNombreEn
                        : currentCatalogItem.moduloNombre}{' '}
                      •{' '}
                      {language === 'en' ? currentCatalogItem.nombreEn : currentCatalogItem.nombre}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Barra de Búsqueda / Combobox Input */}
            <div className="ns-fav-search-box">
              <input
                ref={searchInputRef}
                type="search"
                className="ns-fav-combobox-input"
                placeholder={
                  showCatalogPicker
                    ? language === 'en'
                      ? 'Filter modules to add...'
                      : 'Filtrar submódulos para agregar...'
                    : language === 'en'
                    ? 'Search in my favorites...'
                    : 'Buscar en mis favoritos...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Lista desplegable del Combobox */}
            <div className="ns-fav-list-container" role="listbox">
              {filteredList.length === 0 ? (
                <div className="ns-fav-empty">
                  <p>
                    {showCatalogPicker
                      ? language === 'en'
                        ? 'No submodules found.'
                        : 'No se encontraron submódulos.'
                      : language === 'en'
                      ? 'No favorites saved yet.'
                      : 'No tienes favoritos guardados en este módulo.'}
                  </p>
                </div>
              ) : (
                filteredList.map((item) => {
                  const marcado = isFavorite(portal, item.moduleId, item.subItemId);
                  return (
                    <div
                      key={item.key}
                      className="ns-fav-list-row"
                      role="option"
                      aria-selected={marcado}
                    >
                      <button
                        type="button"
                        className="ns-fav-item-link"
                        onClick={() => handleNavigate(item)}
                      >
                        <span className="ns-fav-item-dot" />
                        <div className="ns-fav-item-labels">
                          <span className="ns-fav-item-name">
                            {language === 'en' ? item.nombreEn : item.nombre}
                          </span>
                          <span className="ns-fav-item-module">
                            {language === 'en' ? item.moduloNombreEn : item.moduloNombre}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`ns-fav-item-star-btn ${marcado ? 'pinned' : ''}`}
                        title={
                          marcado
                            ? language === 'en'
                              ? 'Remove from favorites'
                              : 'Quitar de favoritos'
                            : language === 'en'
                            ? 'Add to favorites'
                            : 'Agregar a favoritos'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(portal, item.moduleId, item.subItemId);
                        }}
                      >
                        <IconStar size={14} filled={marcado} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del Combobox: Alternar entre Mis Favoritos y Catálogo Completo del Módulo para Agregar */}
            <div className="ns-fav-footer">
              <button
                type="button"
                className="ns-fav-catalog-toggle-btn"
                onClick={() => {
                  setShowCatalogPicker((prev) => !prev);
                  setSearchQuery('');
                }}
              >
                {showCatalogPicker ? (
                  <>
                    <IconStar size={13} filled />
                    <span>
                      {language === 'en'
                        ? `← Back to My Favorites (${favoriteItems.length})`
                        : `← Volver a Mis Favoritos (${favoriteItems.length})`}
                    </span>
                  </>
                ) : (
                  <>
                    <IconPlus size={13} />
                    <span>
                      {language === 'en'
                        ? 'Add / Manage Favorites...'
                        : 'Agregar / Administrar Favoritos...'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SubsidebarFavoritos;
