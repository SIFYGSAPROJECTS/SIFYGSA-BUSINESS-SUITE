'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCompras } from '../context/ComprasContext';
import type { OrdenCompra } from '../types';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../compras.css';

type TabEditarFacturas = 'por-actualizar' | 'pendientes' | 'facturas';

const ESTATUS_POR_ACTUALIZAR = new Set<string>([
  'abierta',
  'en_transito',
  'orden_completa_factura_abierta',
]);

export const EditarOrdenFacturasPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get('tab');

  const tabInicial: TabEditarFacturas =
    tabParam === 'pendientes'
      ? 'pendientes'
      : tabParam === 'facturas'
      ? 'facturas'
      : 'por-actualizar';

  const [tabActiva, setTabActiva] = useState<TabEditarFacturas>(tabInicial);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (tabParam === 'pendientes' || tabParam === 'facturas' || tabParam === 'por-actualizar') {
      setTabActiva(tabParam);
    }
  }, [tabParam]);

  const {
    ordenes,
    facturas,
    ocTieneFactura,
    getFacturaPorOC,
  } = useCompras();

  const ordenesPorActualizar = useMemo(
    () => ordenes.filter((o) => ESTATUS_POR_ACTUALIZAR.has(o.estatus)),
    [ordenes]
  );

  const ordenesPendientes = useMemo(
    () => ordenes.filter((o) => o.estatus === 'pendiente'),
    [ordenes]
  );

  const filtrarOrdenes = (lista: OrdenCompra[]) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (o) =>
        o.folio.toLowerCase().includes(q) ||
        o.proveedorNombre.toLowerCase().includes(q) ||
        (o.proveedorRfc || '').toLowerCase().includes(q) ||
        (o.solicitante || '').toLowerCase().includes(q) ||
        (o.motivoRechazo || '').toLowerCase().includes(q)
    );
  };

  const ordenesVisiblesPorActualizar = useMemo(
    () => filtrarOrdenes(ordenesPorActualizar),
    [ordenesPorActualizar, busqueda]
  );

  const ordenesVisiblesPendientes = useMemo(
    () => filtrarOrdenes(ordenesPendientes),
    [ordenesPendientes, busqueda]
  );

  const facturasVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return facturas;
    return facturas.filter(
      (f) =>
        f.folio.toLowerCase().includes(q) ||
        (f.uuid || '').toLowerCase().includes(q) ||
        (f.ocId || '').toLowerCase().includes(q) ||
        (f.proveedor || '').toLowerCase().includes(q)
    );
  }, [facturas, busqueda]);

  const cambiarTab = (next: TabEditarFacturas) => {
    setTabActiva(next);
    router.replace(`/compras/ordenes/editar-facturas?tab=${next}`);
  };

  const formatMoney = (val: number, moneda: string = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : moneda === 'EUR' ? 'EUR' : 'MXN',
      minimumFractionDigits: 2,
    }).format(val || 0);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-5 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── ENCABEZADO ── */}
      <div className="compras-header-banner mb-5">
        <div className="compras-header-left">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/compras/modulos" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Módulos de Compras
            </Link>
            <span>/</span>
            <span className="text-slate-400">Editar Orden de Compra / Facturas</span>
          </nav>
          <div className="compras-header-title-row">
            <h1 className="compras-page-title">Editar Orden de Compra / Facturas</h1>
            <span className="compras-context-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit_document</span>
              {ordenesPorActualizar.length + ordenesPendientes.length} Activas
            </span>
          </div>
          <p className="compras-page-subtitle">
            Actualiza órdenes abiertas, da seguimiento a pendientes de validación y gestiona sus facturas CFDI 4.0.
          </p>
        </div>

        <div className="compras-header-actions">
          <Link href="/compras/facturas/registro" className="cp-btn cp-btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
            Agregar factura
          </Link>
          <ModuleMenu />
        </div>
      </div>

      {/* ── PESTAÑAS Y BUSCADOR ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 mb-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Secciones de edición y facturas">
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'por-actualizar'}
            onClick={() => cambiarTab('por-actualizar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'por-actualizar'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">update</span>
            <span>Por actualizar</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-black/15">
              {ordenesPorActualizar.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'pendientes'}
            onClick={() => cambiarTab('pendientes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'pendientes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">pending_actions</span>
            <span>Pendientes</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-black/15">
              {ordenesPendientes.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'facturas'}
            onClick={() => cambiarTab('facturas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'facturas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Facturas</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-black/15">
              {facturas.length}
            </span>
          </button>
        </div>

        <div className="relative min-w-[260px] lg:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por folio, proveedor, RFC o factura..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* ── PESTAÑA 1: POR ACTUALIZAR ── */}
      {tabActiva === 'por-actualizar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Emisión / Entrega</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4">Estado / Seguimiento</th>
                  <th className="py-3 px-4">Facturación</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ordenesVisiblesPorActualizar.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No hay órdenes abiertas por actualizar con el criterio actual.
                    </td>
                  </tr>
                ) : (
                  ordenesVisiblesPorActualizar.map((oc) => {
                    const tieneFac = ocTieneFactura(oc.folio) || oc.tieneFactura;
                    const fac = getFacturaPorOC(oc.folio);
                    return (
                      <tr key={oc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          <Link href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`} className="hover:underline">
                            {oc.folio}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{oc.proveedorNombre}</div>
                          <div className="text-[11px] font-mono text-slate-400">{oc.proveedorRfc}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          <div>{oc.fechaEmision}</div>
                          <div className="text-[11px] text-slate-400">Entrega: {oc.fechaEntrega}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {formatMoney(oc.total, oc.moneda)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                            {oc.estatus === 'en_transito'
                              ? 'En Tránsito'
                              : oc.estatus === 'orden_completa_factura_abierta'
                              ? 'Orden Completa / Factura Abierta'
                              : 'Abierta / Por actualizar'}
                          </span>
                          {oc.motivoRechazo && (
                            <div className="mt-1.5 text-[11px] px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              <strong>Devuelta por validación:</strong> {oc.motivoRechazo}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {tieneFac ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              {fac?.folio || oc.facturaFolio || 'Facturada'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Sin factura
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center gap-1 no-underline"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Editar orden
                            </Link>
                            <Link
                              href={`/compras/ordenes/${encodeURIComponent(oc.folio)}/factura/nueva`}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 no-underline"
                            >
                              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                              Agregar factura
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PESTAÑA 2: PENDIENTES (SOLO LECTURA DE ESTADO, SIN ACCIÓN DE AUTORIZAR) ── */}
      {tabActiva === 'pendientes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>
              Órdenes en espera de validación gerencial y liberación. La autorización se realiza exclusivamente en el módulo <strong>Autorización de Órdenes de Compra</strong>.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Solicitante / Proyecto</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ordenesVisiblesPendientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No hay órdenes pendientes de validación en este momento.
                    </td>
                  </tr>
                ) : (
                  ordenesVisiblesPendientes.map((oc) => (
                    <tr key={oc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{oc.folio}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{oc.proveedorNombre}</div>
                        <div className="text-[11px] font-mono text-slate-400">{oc.proveedorRfc}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{oc.solicitante}</div>
                        <div className="text-[11px] text-slate-400">{oc.contratoProyecto || oc.almacenDestino}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{oc.fechaEmision}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {formatMoney(oc.total, oc.moneda)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          En espera de validación
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 no-underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Editar orden
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PESTAÑA 3: FACTURAS ── */}
      {tabActiva === 'facturas' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Facturas vinculadas a órdenes de compra ({facturasVisibles.length})
            </span>
            <Link
              href="/compras/facturas/registro"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 no-underline"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Agregar factura
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Folio Factura</th>
                  <th className="py-3 px-4">Orden de Compra</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">UUID Fiscal</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {facturasVisibles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No hay facturas registradas aún.
                    </td>
                  </tr>
                ) : (
                  facturasVisibles.map((fac) => {
                    const ocRef = fac.ocId;
                    return (
                      <tr key={fac.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {fac.folio}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          <Link href={`/compras/ordenes/${encodeURIComponent(ocRef)}`} className="hover:underline">
                            {ocRef}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{fac.proveedor}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[180px]" title={fac.uuid}>
                          {fac.uuid}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {formatMoney(fac.total, fac.moneda)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            {fac.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/compras/ordenes/${encodeURIComponent(ocRef)}`}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold no-underline"
                            >
                              Editar orden
                            </Link>
                            <Link
                              href={`/compras/facturas/registro?facturaId=${encodeURIComponent(fac.id)}&oc=${encodeURIComponent(ocRef)}`}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center gap-1 no-underline"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Editar factura
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarOrdenFacturasPage;
