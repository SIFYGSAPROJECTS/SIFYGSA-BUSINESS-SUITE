'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { RolUsuario } from '@/config/types';
import { IconClose } from '../ui/Icons';
import { SubsidebarFavoritos } from './subsidebarFavoritos';

interface SidebarComprasProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  activeModuleId: string;
  activeSubItemId?: string;
  onSelectModule: (moduleId: string, subItemId?: string) => void;
  onLogout: () => void;
  rolUsuario?: RolUsuario;
}

export const SidebarCompras: React.FC<SidebarComprasProps> = ({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  activeModuleId,
  activeSubItemId,
  onSelectModule,
  rolUsuario,
}) => {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const vistaParam = searchParams?.get('vista');

  // Estados de colapso de acordeón
  const [openCompras, setOpenCompras] = useState(true);
  const [openProveedores, setOpenProveedores] = useState(true);

  // Manejo de salida segura con confirmación en caso de formulario sucio
  const handleHomeClick = (_e?: React.MouseEvent) => {
    if (typeof window !== 'undefined') {
      const exitEvent = new CustomEvent('sifygsa:request-exit-compras', {
        cancelable: true,
        bubbles: true,
      });
      const allowed = window.dispatchEvent(exitEvent);
      if (!allowed) {
        // Un formulario interceptó la salida porque tiene cambios sin guardar
        return;
      }
    }
    onSelectModule('compras', 'compras-menu');
  };

  const esProveedoresActivo =
    pathname.startsWith('/compras/proveedores') ||
    pathname.startsWith('/proveedores');
  const esComprasActivo =
    !esProveedoresActivo &&
    (pathname === '/compras' ||
      pathname.startsWith('/compras/modulos') ||
      pathname.startsWith('/compras/ordenes') ||
      pathname.startsWith('/compras/facturas') ||
      pathname.startsWith('/requisiciones'));

  const esInicioActivo = pathname === '/compras';

  // Detección precisa de submódulos activos
  const filtroParam = searchParams?.get('filtro');
  const esNuevaOrdenActivo = pathname === '/compras/ordenes/nueva';
  const esAutorizarActivo =
    (pathname.startsWith('/compras/ordenes') && vistaParam === 'autorizar') ||
    pathname === '/compras/ordenes/autorizar';
  const esPorActualizarActivo =
    (pathname.startsWith('/compras/ordenes') && filtroParam === 'por-actualizar') ||
    pathname === '/compras/ordenes/por-actualizar';
  const esPendientesActivo =
    (pathname.startsWith('/compras/ordenes') && filtroParam === 'pendientes') ||
    pathname === '/compras/ordenes/pendientes';
  const esOrdenesActivo =
    pathname.startsWith('/compras/ordenes') &&
    !esNuevaOrdenActivo &&
    !esAutorizarActivo &&
    !esPorActualizarActivo &&
    !esPendientesActivo;

  const esNuevoProveedorActivo = pathname === '/compras/proveedores/nuevo';
  const esProveedoresListaActivo =
    pathname === '/compras/proveedores' || (esProveedoresActivo && !esNuevoProveedorActivo);

  return (
    <aside
      className={`gemini-sidebar sidebar-compras ${isCollapsed ? 'collapsed' : ''} ${
        isMobileOpen ? 'mobile-visible' : ''
      }`}
      aria-label="Navegación Compras y Procura SIFYGSA"
    >
      {/* Cabecera Móvil */}
      <div className="sidebar-mobile-header">
        <div className="mobile-brand-row">
          <div
            className="sidebar-brand-lockup"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ width: 24, height: 24, color: 'var(--primary)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span
              style={{
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                letterSpacing: '0.04em',
              }}
            >
              COMPRAS ERP
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <IconClose size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-top-container">
        {/* ====================================================================
           MODO COLAPSADO / MINIMIZADO (RAIL DE 2 SECCIONES PRINCIPALES)
           ==================================================================== */}
        {isCollapsed ? (
          <div className="sidebar-collapsed-column">
            {/* HERRAMIENTAS GLOBALES (INICIO, AJUSTES, FAVORITOS) */}
            <div className="collapsed-tools-stack">
              {/* 1. Inicio Compras */}
              <button
                type="button"
                className={`tool-icon-btn ${esInicioActivo ? 'active' : ''}`}
                title="Inicio Compras"
                onClick={handleHomeClick}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>

              {/* 2. Ajustes */}
              <button
                type="button"
                className={`tool-icon-btn ${pathname.startsWith('/ajustes') ? 'active orange-solid' : ''}`}
                title="Ajustes de Configuración"
                onClick={() => onSelectModule('settings')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{ width: 16, height: 16 }}
                >
                  <path
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* 3. Favoritos (Estrella) */}
              <SubsidebarFavoritos
                portal="compras"
                rolUsuario={rolUsuario}
                activeModuleId={activeModuleId}
                activeSubItemId={activeSubItemId}
                onSelectModule={onSelectModule}
                isCollapsed={isCollapsed}
              />
            </div>

            <div className="collapsed-divider-line" />

            {/* MÓDULOS DE COMPRAS EN MODO COLAPSADO (ORDEN DE COMPRAS & PROVEEDORES) */}
            <div className="collapsed-nav-icons">
              {/* 1. Nueva Orden de Compra */}
              <Link
                href="/compras/ordenes/nueva"
                className={`collapsed-nav-btn ${esNuevaOrdenActivo ? 'active-crm' : ''}`}
                title="Nueva Orden de Compra"
                aria-label="Nueva Orden de Compra"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esNuevaOrdenActivo ? '#ffffff' : '#1d4ed8' }}>
                  add_shopping_cart
                </span>
              </Link>

              {/* 2. Órdenes de Compra */}
              <Link
                href="/compras/ordenes"
                className={`collapsed-nav-btn ${esOrdenesActivo ? 'active-crm' : ''}`}
                title="Órdenes de Compra"
                aria-label="Órdenes de Compra"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esOrdenesActivo ? '#ffffff' : '#0284c7' }}>
                  description
                </span>
              </Link>

              {/* 3. Por Actualizar */}
              <Link
                href="/compras/ordenes/por-actualizar"
                className={`collapsed-nav-btn ${esPorActualizarActivo ? 'active-crm' : ''}`}
                title="Órdenes por Actualizar (8)"
                aria-label="Órdenes por Actualizar"
                style={{ position: 'relative' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esPorActualizarActivo ? '#ffffff' : '#d97706' }}>
                  update
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    padding: '1px 4px',
                    lineHeight: 1,
                  }}
                >
                  8
                </span>
              </Link>

              {/* 4. Órdenes Pendientes */}
              <Link
                href="/compras/ordenes/pendientes"
                className={`collapsed-nav-btn ${esPendientesActivo ? 'active-crm' : ''}`}
                title="Órdenes Pendientes (14)"
                aria-label="Órdenes Pendientes"
                style={{ position: 'relative' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esPendientesActivo ? '#ffffff' : '#1d4ed8' }}>
                  pending_actions
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    padding: '1px 4px',
                    lineHeight: 1,
                  }}
                >
                  14
                </span>
              </Link>

              {/* 5. Autorización de Órdenes */}
              <Link
                href="/compras/ordenes/autorizar"
                className={`collapsed-nav-btn ${esAutorizarActivo ? 'active-crm' : ''}`}
                title="Autorización de Órdenes"
                aria-label="Autorización de Órdenes"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esAutorizarActivo ? '#ffffff' : '#d97706' }}>
                  verified_user
                </span>
              </Link>

              <div className="collapsed-divider-line" style={{ margin: '0.35rem 0' }} />

              {/* 6. Proveedores */}
              <Link
                href="/compras/proveedores"
                className={`collapsed-nav-btn ${esProveedoresListaActivo ? 'active-crm' : ''}`}
                title="Directorio de Proveedores"
                aria-label="Proveedores"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esProveedoresListaActivo ? '#ffffff' : '#059669' }}>
                  groups
                </span>
              </Link>

              {/* 7. Nuevo Proveedor */}
              <Link
                href="/compras/proveedores/nuevo"
                className={`collapsed-nav-btn ${esNuevoProveedorActivo ? 'active-crm' : ''}`}
                title="Nuevo Proveedor"
                aria-label="Nuevo Proveedor"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: esNuevoProveedorActivo ? '#ffffff' : '#6366f1' }}>
                  person_add
                </span>
              </Link>
            </div>
          </div>
        ) : (
          /* ====================================================================
             MODO EXPANDIDO: DOS SECCIONES COLAPSABLES (COMPRAS Y PROVEEDORES)
             ==================================================================== */
          <>
            {/* Barra Superior de Herramientas Rápidas (Inicio, Ajustes, Favoritos) */}
            <div className="sidebar-quick-tools">
              <div className="quick-tools-left">
                <button
                  type="button"
                  className={`tool-icon-btn ${esInicioActivo ? 'active' : ''}`}
                  title="Inicio Compras"
                  onClick={handleHomeClick}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: 16, height: 16 }}>
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`tool-icon-btn ${pathname.startsWith('/ajustes') ? 'active' : ''}`}
                  title="Ajustes de Configuración"
                  onClick={() => onSelectModule('settings')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <SubsidebarFavoritos
                  portal="compras"
                  rolUsuario={rolUsuario}
                  activeModuleId={activeModuleId}
                  activeSubItemId={activeSubItemId}
                  onSelectModule={onSelectModule}
                  isCollapsed={isCollapsed}
                />
              </div>
            </div>

            <div className="sidebar-brand-box">
              <Link
                href="/compras"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.25rem 0.5rem',
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary, #1d4ed8)',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    style={{ width: 20, height: 20 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.04em',
                      display: 'block',
                      lineHeight: 1.2,
                    }}
                  >
                    COMPRAS &amp; PROCURA
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    SIFYGSA Portal
                  </span>
                </div>
              </Link>
            </div>

            <nav className="sidebar-nav-tree" aria-label="Menú Compras">
              <div
                style={{
                  padding: '0.5rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                {/* ====================================================================
                   1. SECCIÓN PRINCIPAL: COMPRAS (COLAPSABLE)
                   ==================================================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: esComprasActivo
                        ? 'var(--nav-active-bg, rgba(37, 99, 235, 0.08))'
                        : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Link
                      href="/compras"
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.8rem',
                        flex: 1,
                        color: esComprasActivo ? 'var(--primary, #1d4ed8)' : 'var(--text-primary)',
                        fontWeight: esComprasActivo ? 800 : 700,
                      }}
                      title="Abrir Dashboard de Compras"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        style={{
                          width: 19,
                          height: 19,
                          flexShrink: 0,
                          color: esComprasActivo ? 'var(--primary, #1d4ed8)' : 'var(--text-secondary)',
                        }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <div>
                        <span style={{ fontSize: '0.9rem', display: 'block', lineHeight: 1.2 }}>
                          Compras
                        </span>
                        <span
                          style={{
                            fontSize: '0.70rem',
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          Órdenes y Autorizaciones
                        </span>
                      </div>
                    </Link>

                    {/* Botón para colapsar / expandir */}
                    <button
                      type="button"
                      onClick={() => setOpenCompras((prev) => !prev)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.65rem 0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-control)',
                      }}
                      title={openCompras ? 'Colapsar sección Compras' : 'Expandir sección Compras'}
                      aria-label="Alternar Compras"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '18px',
                          transform: openCompras ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>

                  {/* Submódulos de Compras */}
                  {openCompras && (
                    <div
                      style={{
                        paddingLeft: '0.5rem',
                        paddingTop: '0.2rem',
                        paddingBottom: '0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      {/* 1.1 Nueva Orden de Compra */}
                      <Link
                        href="/compras/ordenes/nueva"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esNuevaOrdenActivo
                            ? 'var(--nav-active-bg, rgba(37, 99, 235, 0.12))'
                            : 'transparent',
                          color: esNuevaOrdenActivo
                            ? 'var(--primary, #1d4ed8)'
                            : 'var(--text-secondary)',
                          fontWeight: esNuevaOrdenActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            add_shopping_cart
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Nueva Orden de Compra</span>
                      </Link>

                      {/* 1.2 Órdenes de Compra */}
                      <Link
                        href="/compras/ordenes"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esOrdenesActivo
                            ? 'var(--nav-active-bg, rgba(2, 132, 199, 0.12))'
                            : 'transparent',
                          color: esOrdenesActivo
                            ? 'var(--info, #0284c7)'
                            : 'var(--text-secondary)',
                          fontWeight: esOrdenesActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            description
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Órdenes de Compra</span>
                      </Link>

                      {/* 1.3 Por Actualizar */}
                      <Link
                        href="/compras/ordenes/por-actualizar"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esPorActualizarActivo
                            ? 'rgba(217, 119, 6, 0.12)'
                            : 'transparent',
                          color: esPorActualizarActivo
                            ? '#d97706'
                            : 'var(--text-secondary)',
                          fontWeight: esPorActualizarActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '8px',
                              backgroundColor: '#d97706',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              update
                            </span>
                          </div>
                          <span style={{ lineHeight: 1.2 }}>Por Actualizar</span>
                        </div>
                        <span
                          style={{
                            padding: '1px 6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            borderRadius: '9999px',
                            backgroundColor: '#d97706',
                            color: '#ffffff',
                          }}
                        >
                          8
                        </span>
                      </Link>

                      {/* 1.4 Órdenes Pendientes */}
                      <Link
                        href="/compras/ordenes/pendientes"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esPendientesActivo
                            ? 'var(--nav-active-bg, rgba(37, 99, 235, 0.12))'
                            : 'transparent',
                          color: esPendientesActivo
                            ? 'var(--primary, #1d4ed8)'
                            : 'var(--text-secondary)',
                          fontWeight: esPendientesActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '8px',
                              backgroundColor: '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              pending_actions
                            </span>
                          </div>
                          <span style={{ lineHeight: 1.2 }}>Órdenes Pendientes</span>
                        </div>
                        <span
                          style={{
                            padding: '1px 6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            borderRadius: '9999px',
                            backgroundColor: '#1d4ed8',
                            color: '#ffffff',
                          }}
                        >
                          14
                        </span>
                      </Link>

                      {/* 1.5 Autorización de Órdenes */}
                      <Link
                        href="/compras/ordenes/autorizar"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esAutorizarActivo
                            ? 'rgba(217, 119, 6, 0.12)'
                            : 'transparent',
                          color: esAutorizarActivo
                            ? '#d97706'
                            : 'var(--text-secondary)',
                          fontWeight: esAutorizarActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            verified_user
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Autorización de Órdenes</span>
                      </Link>

                      {/* 1.6 Módulos Compras (Hub) */}
                      <Link
                        href="/compras/modulos"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: pathname === '/compras/modulos'
                            ? 'var(--nav-active-bg, rgba(37, 99, 235, 0.12))'
                            : 'transparent',
                          color: pathname === '/compras/modulos'
                            ? 'var(--primary, #1d4ed8)'
                            : 'var(--text-secondary)',
                          fontWeight: pathname === '/compras/modulos' ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            grid_view
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Hub Módulos Compras</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* ====================================================================
                   2. SECCIÓN PRINCIPAL: PROVEEDORES (COLAPSABLE)
                   ==================================================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: esProveedoresActivo
                        ? 'var(--nav-active-bg, rgba(5, 150, 105, 0.08))'
                        : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Link
                      href="/compras/proveedores"
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.8rem',
                        flex: 1,
                        color: esProveedoresActivo ? '#059669' : 'var(--text-primary)',
                        fontWeight: esProveedoresActivo ? 800 : 700,
                      }}
                      title="Abrir Directorio de Proveedores"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        style={{
                          width: 19,
                          height: 19,
                          flexShrink: 0,
                          color: esProveedoresActivo ? '#059669' : 'var(--text-secondary)',
                        }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                        />
                      </svg>
                      <div>
                        <span style={{ fontSize: '0.9rem', display: 'block', lineHeight: 1.2 }}>
                          Proveedores
                        </span>
                        <span
                          style={{
                            fontSize: '0.70rem',
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          Padrón y SAT 32-D
                        </span>
                      </div>
                    </Link>

                    {/* Botón para colapsar / expandir */}
                    <button
                      type="button"
                      onClick={() => setOpenProveedores((prev) => !prev)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.65rem 0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-control)',
                      }}
                      title={openProveedores ? 'Colapsar sección Proveedores' : 'Expandir sección Proveedores'}
                      aria-label="Alternar Proveedores"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '18px',
                          transform: openProveedores ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>

                  {/* Submódulos de Proveedores */}
                  {openProveedores && (
                    <div
                      style={{
                        paddingLeft: '0.5rem',
                        paddingTop: '0.2rem',
                        paddingBottom: '0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      {/* 2.1 Proveedores (Directorio) */}
                      <Link
                        href="/compras/proveedores"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esProveedoresListaActivo
                            ? 'var(--nav-active-bg, rgba(5, 150, 105, 0.12))'
                            : 'transparent',
                          color: esProveedoresListaActivo
                            ? '#059669'
                            : 'var(--text-secondary)',
                          fontWeight: esProveedoresListaActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            groups
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Proveedores</span>
                      </Link>

                      {/* 2.2 Nuevo Proveedor */}
                      <Link
                        href="/compras/proveedores/nuevo"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor: esNuevoProveedorActivo
                            ? 'rgba(99, 102, 241, 0.12)'
                            : 'transparent',
                          color: esNuevoProveedorActivo
                            ? '#6366f1'
                            : 'var(--text-secondary)',
                          fontWeight: esNuevoProveedorActivo ? 700 : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            person_add
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Nuevo Proveedor</span>
                      </Link>

                      {/* 2.3 Hub de Módulos Proveedores */}
                      <Link
                        href="/proveedores/modulos"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-control)',
                          textDecoration: 'none',
                          backgroundColor:
                            pathname === '/proveedores/modulos' || pathname === '/compras/proveedores/modulos'
                              ? 'rgba(5, 150, 105, 0.15)'
                              : 'transparent',
                          color:
                            pathname === '/proveedores/modulos' || pathname === '/compras/proveedores/modulos'
                              ? '#059669'
                              : 'var(--text-secondary)',
                          fontWeight:
                            pathname === '/proveedores/modulos' || pathname === '/compras/proveedores/modulos'
                              ? 700
                              : 500,
                          fontSize: '0.82rem',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '8px',
                            backgroundColor: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            grid_view
                          </span>
                        </div>
                        <span style={{ lineHeight: 1.2 }}>Hub Módulos Proveedores</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Tarjeta Inferior de Estado del Sistema */}
      <div className="sidebar-bottom-status-card">
        {isCollapsed ? (
          <div
            className="collapsed-status-circle"
            title="Compras & Procura: En línea v3.4.1"
          >
            <span className="green-pulse-dot" />
          </div>
        ) : (
          <div className="status-badge-inner">
            <div>
              <p className="status-label-heading">Compras &amp; Procura</p>
              <p className="status-live-indicator">
                <span className="green-pulse-dot" /> En línea
              </p>
            </div>
            <span className="version-pill-tag">v3.4.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarCompras;
