'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  obtenerOrdenesCompra,
  obtenerProveedores,
  guardarNuevaOrdenCompra,
} from '../data/mock-data';
import type { OrdenCompra, EstatusOrdenCompra, Proveedor, MonedaDivisa } from '../types';
import { useCompras } from '../context/ComprasContext';
import { AutorizacionOrdenesPage } from './AutorizacionOrdenesPage';
import { OrdenesPorActualizarPage } from './OrdenesPorActualizarPage';
import { OrdenesPendientesPage } from './OrdenesPendientesPage';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../compras.css';

type SortFieldOC =
  | 'folio'
  | 'proveedorNombre'
  | 'fechaEmision'
  | 'fechaEntrega'
  | 'total'
  | 'estatus';
type SortDirection = 'asc' | 'desc';

export const DashboardOrdenesCompraPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vistaParam = searchParams?.get('vista');
  const filtroParam = searchParams?.get('filtro');

  const {
    ordenes: ordenesContext,
    actualizarOrden,
    ocTieneFactura,
    getFacturaPorOC,
    toast: contextToast,
    mostrarToast,
    cerrarToast,
  } = useCompras();

  const [ordenesLocal, setOrdenesLocal] = useState<OrdenCompra[]>(() =>
    obtenerOrdenesCompra()
  );
  const [proveedores] = useState<Proveedor[]>(() => obtenerProveedores());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modo de vista: 'control' (Dashboard general de ODC) o 'autorizar' (Interfaz para Autorizar Órdenes de Compra)
  const [modoVista, setModoVista] = useState<string>(() =>
    vistaParam === 'autorizar' ? 'autorizar' : 'control'
  );

  useEffect(() => {
    if (vistaParam === 'autorizar') {
      setModoVista('autorizar');
    } else if (!vistaParam) {
      setModoVista('control');
    }
  }, [vistaParam]);

  // Sincronizar con ComprasContext + localStorage
  useEffect(() => {
    if (ordenesContext && ordenesContext.length > 0) {
      setOrdenesLocal(ordenesContext);
    } else {
      setOrdenesLocal(obtenerOrdenesCompra());
    }
  }, [ordenesContext]);

  // ── ESTADOS DE BÚSQUEDA Y FILTRADO (REQUISITO 2: FILTROS POR ESTATUS, PROVEEDOR Y FECHA) ──
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusOrdenCompra | 'todas'>('todas');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
  const [filtroAutorizacionTab, setFiltroAutorizacionTab] = useState<
    'pendientes' | 'autorizadas' | 'rechazadas' | 'todas'
  >('pendientes');
  const [seleccionadasIds, setSeleccionadasIds] = useState<string[]>([]);
  const [comentarioAutorizacion, setComentarioAutorizacion] = useState<string>(
    'Partidas y presupuesto verificados contra requisición de obra.'
  );

  // Proveedores únicos para el filtro
  const proveedoresUnicos = useMemo(() => {
    return Array.from(new Set(proveedores.map((p) => p.razonSocial))).sort();
  }, [proveedores]);

  // ── ORDENAMIENTO Y PAGINACIÓN ──
  const [sortField, setSortField] = useState<SortFieldOC>('fechaEmision');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [itemsPorPagina, setItemsPorPagina] = useState<number>(8);

  // ── MODAL DE VISTA RÁPIDA, AUTORIZACIÓN Y EDICIÓN INLINE ──
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompra | null>(null);
  const [modoEdicionModal, setModoEdicionModal] = useState<boolean>(false);
  const [editEstatus, setEditEstatus] = useState<EstatusOrdenCompra>('abierta');
  const [editFechaEntrega, setEditFechaEntrega] = useState<string>('');
  const [editAlmacen, setEditAlmacen] = useState<string>('');
  const [editNotas, setEditNotas] = useState<string>('');
  const [errorValidacionModal, setErrorValidacionModal] = useState<string>('');

  const abrirModalOrden = (oc: OrdenCompra, iniciarEnEdicion = false) => {
    setOrdenSeleccionada(oc);
    setModoEdicionModal(iniciarEnEdicion);
    setEditEstatus(oc.estatus);
    setEditFechaEntrega(oc.fechaEntrega);
    setEditAlmacen(oc.almacenDestino);
    setEditNotas(oc.notas || '');
    setErrorValidacionModal('');
  };

  const getMontoMXN = (oc: OrdenCompra) =>
    oc.moneda === 'USD' ? oc.total * (oc.tipoCambio || 18.45) : oc.total;

  // ── KPIs DINÁMICOS (REQUISITO 2: TOTALES, PENDIENTES, AUTORIZADAS Y MONTO TOTAL) ──
  const kpis = useMemo(() => {
    const totalOrdenes = ordenesLocal.length;
    const activas = ordenesLocal.filter((o) => o.estatus !== 'cancelada');
    const montoTotalMXN = activas.reduce((acc, o) => acc + getMontoMXN(o), 0);
    const ticketPromedioMXN = activas.length > 0 ? montoTotalMXN / activas.length : 0;

    const pendientesCount = ordenesLocal.filter((o) => o.estatus === 'pendiente').length;
    const transitoCount = ordenesLocal.filter((o) => o.estatus === 'transito').length;
    const abiertasCount = ordenesLocal.filter((o) => o.estatus === 'abierta').length;
    const cerradasCount = ordenesLocal.filter((o) => o.estatus === 'cerrada').length;
    const canceladasCount = ordenesLocal.filter((o) => o.estatus === 'cancelada').length;
    const autorizadasCount = abiertasCount + cerradasCount + transitoCount;

    const montoPorAutorizarMXN = ordenesLocal
      .filter((o) => o.estatus === 'pendiente')
      .reduce((acc, o) => acc + getMontoMXN(o), 0);

    const proveedoresActivosCount = proveedores.filter((p) => p.estatus === 'activo').length;
    const proveedores32DPositiva = proveedores.filter(
      (p) => p.opinionSat32D === 'positiva'
    ).length;

    const conFacturaCount = ordenesLocal.filter(
      (o) => ocTieneFactura(o.folio) || o.tieneFactura
    ).length;

    return {
      totalOrdenes,
      montoTotalMXN,
      ticketPromedioMXN,
      pendientesCount,
      transitoCount,
      abiertasCount,
      cerradasCount,
      canceladasCount,
      autorizadasCount,
      montoPorAutorizarMXN,
      proveedoresActivosCount,
      proveedores32DPositiva,
      conFacturaCount,
    };
  }, [ordenesLocal, proveedores, ocTieneFactura]);

  // ── ACCIONES DE AUTORIZACIÓN / RECHAZO DE ÓRDENES DE COMPRA ──
  const handleAutorizarOrden = (oc: OrdenCompra, comentarioExtra?: string) => {
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const notaFirma = `[AUTORIZADA ${fechaHoy} por Carlos Mendoza - Dirección Compras] ${comentarioExtra || comentarioAutorizacion
      }`;
    const actualizada: OrdenCompra = {
      ...oc,
      estatus: 'abierta',
      notas: oc.notas ? `${oc.notas} | ${notaFirma}` : notaFirma,
    };
    actualizarOrden(actualizada);
    const nuevas = guardarNuevaOrdenCompra(actualizada);
    setOrdenesLocal(nuevas);
    if (ordenSeleccionada?.id === oc.id) {
      setOrdenSeleccionada(actualizada);
    }
    setSeleccionadasIds((prev) => prev.filter((id) => id !== oc.id));
    mostrarToast(
      `Orden de Compra ${oc.folio} AUTORIZADA y liberada al proveedor (${oc.proveedorNombre})`,
      'success'
    );
  };

  const handleRechazarOrden = (oc: OrdenCompra) => {
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const actualizada: OrdenCompra = {
      ...oc,
      estatus: 'cancelada',
      notas: `${oc.notas || ''} | [RECHAZADA / CANCELADA ${fechaHoy} en Mesa de Autorización]`.trim(),
    };
    actualizarOrden(actualizada);
    const nuevas = guardarNuevaOrdenCompra(actualizada);
    setOrdenesLocal(nuevas);
    if (ordenSeleccionada?.id === oc.id) {
      setOrdenSeleccionada(actualizada);
    }
    setSeleccionadasIds((prev) => prev.filter((id) => id !== oc.id));
    mostrarToast(`Orden de Compra ${oc.folio} marcada como Rechazada / Cancelada`, 'warning');
  };

  const handleEnviarARevision = (oc: OrdenCompra) => {
    const actualizada: OrdenCompra = {
      ...oc,
      estatus: 'pendiente',
    };
    actualizarOrden(actualizada);
    const nuevas = guardarNuevaOrdenCompra(actualizada);
    setOrdenesLocal(nuevas);
    mostrarToast(
      `Orden ${oc.folio} enviada a bandeja de Pendientes de Autorización`,
      'info'
    );
  };

  const handleAutorizarSeleccionadas = () => {
    if (seleccionadasIds.length === 0) return;
    const fechaHoy = new Date().toISOString().slice(0, 10);
    let contador = 0;
    let listaActual = [...ordenesLocal];

    seleccionadasIds.forEach((id) => {
      const target = listaActual.find((o) => o.id === id);
      if (target) {
        const actualizada: OrdenCompra = {
          ...target,
          estatus: 'abierta',
          notas: `${target.notas || ''} | [AUTORIZACIÓN MASIVA ${fechaHoy} por Carlos Mendoza]`.trim(),
        };
        actualizarOrden(actualizada);
        listaActual = guardarNuevaOrdenCompra(actualizada);
        contador++;
      }
    });

    setOrdenesLocal(listaActual);
    setSeleccionadasIds([]);
    mostrarToast(
      `Se autorizaron y liberaron ${contador} órdenes de compra exitosamente`,
      'success'
    );
  };

  // ── FILTRADO Y ORDENAMIENTO DE TABLA ──
  const ordenesFiltradasYOrdenadas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    const filtradas = ordenesLocal.filter((o) => {
      // Filtro especial por parámetro URL (Accesos rápidos del hub de Compras)
      if (filtroParam === 'por-actualizar') {
        if (o.estatus !== 'abierta' && o.estatus !== 'transito') {
          return false;
        }
      } else if (filtroParam === 'pendientes') {
        if (o.estatus !== 'pendiente') {
          return false;
        }
      }

      if (modoVista === 'autorizar') {
        if (filtroAutorizacionTab === 'pendientes' && o.estatus !== 'pendiente') {
          return false;
        }
        if (
          filtroAutorizacionTab === 'autorizadas' &&
          o.estatus !== 'abierta' &&
          o.estatus !== 'transito' &&
          o.estatus !== 'cerrada'
        ) {
          return false;
        }
        if (filtroAutorizacionTab === 'rechazadas' && o.estatus !== 'cancelada') {
          return false;
        }
      } else {
        if (filtroEstatus !== 'todas' && o.estatus !== filtroEstatus) {
          return false;
        }
      }

      // Filtro por Proveedor
      if (filtroProveedor !== 'todos' && o.proveedorNombre !== filtroProveedor) {
        return false;
      }

      // Filtro por Rango de Fechas de Emisión
      if (filtroFechaDesde && o.fechaEmision < filtroFechaDesde) {
        return false;
      }
      if (filtroFechaHasta && o.fechaEmision > filtroFechaHasta) {
        return false;
      }

      const matchSearch =
        !q ||
        o.folio.toLowerCase().includes(q) ||
        o.proveedorNombre.toLowerCase().includes(q) ||
        o.proveedorRfc.toLowerCase().includes(q) ||
        o.solicitante.toLowerCase().includes(q) ||
        (o.proyectoId || '').toLowerCase().includes(q) ||
        o.almacenDestino.toLowerCase().includes(q) ||
        (o.items || []).some(
          (it) =>
            it.codigo.toLowerCase().includes(q) || it.descripcion.toLowerCase().includes(q)
        );
      return matchSearch;
    });

    return [...filtradas].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'folio') {
        comparison = a.folio.localeCompare(b.folio);
      } else if (sortField === 'proveedorNombre') {
        comparison = a.proveedorNombre.localeCompare(b.proveedorNombre);
      } else if (sortField === 'fechaEmision') {
        comparison = a.fechaEmision.localeCompare(b.fechaEmision);
      } else if (sortField === 'fechaEntrega') {
        comparison = a.fechaEntrega.localeCompare(b.fechaEntrega);
      } else if (sortField === 'total') {
        comparison = getMontoMXN(a) - getMontoMXN(b);
      } else if (sortField === 'estatus') {
        comparison = a.estatus.localeCompare(b.estatus);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [
    ordenesLocal,
    busqueda,
    filtroEstatus,
    filtroProveedor,
    filtroFechaDesde,
    filtroFechaHasta,
    modoVista,
    filtroParam,
    filtroAutorizacionTab,
    sortField,
    sortDir,
  ]);

  // Paginación calculada
  const totalPaginas = Math.max(
    1,
    Math.ceil(ordenesFiltradasYOrdenadas.length / itemsPorPagina)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * itemsPorPagina;
  const ordenesPaginadas = ordenesFiltradasYOrdenadas.slice(
    indiceInicio,
    indiceInicio + itemsPorPagina
  );

  const handleSort = (field: SortFieldOC) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstatus('todas');
    setFiltroProveedor('todos');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroAutorizacionTab('todas');
    setPaginaActual(1);
    if (filtroParam) {
      router.replace('/compras/ordenes');
    }
    mostrarToast('Filtros restablecidos correctamente', 'info');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setOrdenesLocal(obtenerOrdenesCompra());
      setIsRefreshing(false);
      mostrarToast('Tablero de compras sincronizado', 'success');
    }, 350);
  };

  const handleExportCSV = () => {
    const headers = [
      'Folio OC',
      'Proveedor',
      'RFC',
      'Fecha Emision',
      'Fecha Entrega',
      'Almacen Destino',
      'Proyecto',
      'Moneda',
      'Subtotal',
      'IVA',
      'Total',
      'Estatus',
      'CFDI Vinculado',
    ];
    const rows = ordenesFiltradasYOrdenadas.map((o) => [
      o.folio,
      `"${o.proveedorNombre.replace(/"/g, '""')}"`,
      o.proveedorRfc,
      o.fechaEmision,
      o.fechaEntrega,
      `"${o.almacenDestino.replace(/"/g, '""')}"`,
      o.proyectoId || 'N/A',
      o.moneda,
      o.subtotal.toFixed(2),
      o.iva.toFixed(2),
      o.total.toFixed(2),
      o.estatus.toUpperCase(),
      ocTieneFactura(o.folio) || o.tieneFactura ? 'SI' : 'NO',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ordenes_compra_sifygsa_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarToast(
      `Se exportaron ${ordenesFiltradasYOrdenadas.length} órdenes de compra a CSV`,
      'success'
    );
  };

  const handleGuardarEdicionRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;

    if (!editFechaEntrega) {
      setErrorValidacionModal('La fecha de entrega estimada es obligatoria.');
      return;
    }
    if (editFechaEntrega < ordenSeleccionada.fechaEmision) {
      setErrorValidacionModal(
        'La fecha de entrega no puede ser anterior a la fecha de emisión de la orden.'
      );
      return;
    }
    if (!editAlmacen.trim()) {
      setErrorValidacionModal('Selecciona o ingresa un almacén de destino válido.');
      return;
    }

    const ordenActualizada: OrdenCompra = {
      ...ordenSeleccionada,
      estatus: editEstatus,
      fechaEntrega: editFechaEntrega,
      almacenDestino: editAlmacen.trim(),
      notas: editNotas.trim(),
    };

    actualizarOrden(ordenActualizada);
    const nuevas = guardarNuevaOrdenCompra(ordenActualizada);
    setOrdenesLocal(nuevas);
    setOrdenSeleccionada(ordenActualizada);
    setModoEdicionModal(false);
    setErrorValidacionModal('');
    mostrarToast(`Orden ${ordenActualizada.folio} actualizada correctamente`, 'success');
  };

  const formatMoney = (amount: number, moneda: MonedaDivisa | string = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda === 'EUR' ? 'EUR' : moneda === 'USD' ? 'USD' : 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);

  const renderEstatusBadge = (estatus: EstatusOrdenCompra) => {
    const config: Record<
      EstatusOrdenCompra,
      { label: string; className: string; icon: string }
    > = {
      abierta: {
        label: 'Autorizada / Emitida',
        className: 'cp-badge cp-badge-success',
        icon: 'check_circle',
      },
      transito: {
        label: 'En Tránsito',
        className: 'cp-badge cp-badge-info',
        icon: 'local_shipping',
      },
      pendiente: {
        label: 'Pendiente Autorización',
        className: 'cp-badge cp-badge-warning',
        icon: 'schedule',
      },
      cerrada: {
        label: 'Recibida / Cerrada',
        className: 'cp-badge cp-badge-primary',
        icon: 'inventory_2',
      },
      cancelada: {
        label: 'Cancelada / Rechazada',
        className: 'cp-badge cp-badge-danger',
        icon: 'cancel',
      },
      pendiente_aprobacion: {
        label: 'Pendiente de Aprobación',
        className: 'cp-badge cp-badge-warning',
        icon: 'hourglass_empty',
      },
      aprobada_supervisor: {
        label: 'Aprobada por Supervisor',
        className: 'cp-badge cp-badge-info',
        icon: 'verified',
      },
      orden_completa_factura_abierta: {
        label: 'Factura Abierta',
        className: 'cp-badge cp-badge-success',
        icon: 'receipt_long',
      },
      cerrada_factura_pagada: {
        label: 'Cerrada / Pagada',
        className: 'cp-badge cp-badge-primary',
        icon: 'task_alt',
      },
      en_transito: {
        label: 'En Tránsito',
        className: 'cp-badge cp-badge-info',
        icon: 'local_shipping',
      },
      autorizada: {
        label: 'Autorizada',
        className: 'cp-badge cp-badge-success',
        icon: 'verified',
      },
    };
    const c = config[estatus] || config.abierta;
    return (
      <span className={c.className}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {c.icon}
        </span>
        {c.label}
      </span>
    );
  };

  const renderFacturaBadge = (oc: OrdenCompra) => {
    const tieneFacturaVinculada = ocTieneFactura(oc.folio) || Boolean(oc.tieneFactura);
    const facturaObj = getFacturaPorOC(oc.folio);
    const folioFacturaMostrar = facturaObj?.folio || oc.facturaFolio || 'Registrada';

    let tieneFacturaAdjunta = false;
    if (typeof window !== 'undefined' && !tieneFacturaVinculada) {
      try {
        tieneFacturaAdjunta = Boolean(sessionStorage.getItem(`sifygsa_factura_precarga_${oc.folio}`));
      } catch {
        tieneFacturaAdjunta = false;
      }
    }

    if (tieneFacturaVinculada) {
      return (
        <Link
          href={`/facturas/nueva?oc=${encodeURIComponent(oc.folio)}&modo=ver`}
          className="cp-badge cp-badge-success"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          title={`Factura CFDI 4.0 conciliada: ${folioFacturaMostrar}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            verified
          </span>
          <span>Registrada ({folioFacturaMostrar})</span>
        </Link>
      );
    }

    if (tieneFacturaAdjunta) {
      return (
        <Link
          href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
          className="cp-badge cp-badge-warning"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            fontWeight: 700,
          }}
          title="Factura XML/PDF adjunta en la orden, pendiente de agregar al sistema"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            pending_actions
          </span>
          <span>Adjunta (Por registrar)</span>
        </Link>
      );
    }

    return (
      <Link
        href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
        className="cp-badge cp-badge-neutral"
        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        title="Sin factura adjunta. Clic para abrir la orden y adjuntar XML/PDF"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          upload_file
        </span>
        <span>Sin factura</span>
      </Link>
    );
  };

  const renderSortIcon = (field: SortFieldOC) => {
    if (sortField !== field) {
      return (
        <span className="material-symbols-outlined cp-sort-icon inactive">
          unfold_more
        </span>
      );
    }
    return (
      <span className="material-symbols-outlined cp-sort-icon active">
        {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  if (vistaParam === 'autorizar' || modoVista === 'autorizar') {
    return <AutorizacionOrdenesPage />;
  }

  if (filtroParam === 'por-actualizar') {
    return <OrdenesPorActualizarPage />;
  }

  if (filtroParam === 'pendientes') {
    return <OrdenesPendientesPage />;
  }

  return (
    <div className="compras-module">
      {/* ── TOAST FLOTANTE DE RETROALIMENTACIÓN ── */}
      {contextToast && (
        <div
          className={`cp-toast-notification cp-toast-${contextToast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="material-symbols-outlined">
            {contextToast.type === 'success'
              ? 'check_circle'
              : contextToast.type === 'warning'
                ? 'warning'
                : contextToast.type === 'error'
                  ? 'error'
                  : 'info'}
          </span>
          <div className="cp-toast-body">
            <strong>Notificación de Compras</strong>
            <span>{contextToast.message}</span>
          </div>
          <button
            type="button"
            onClick={cerrarToast}
            className="cp-toast-close"
            aria-label="Cerrar notificación"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>
        </div>
      )}

      {/* ── ENCABEZADO EJECUTIVO DEL MÓDULO ── */}
      <div className="compras-header-banner">
        <div className="compras-header-left">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/compras/modulos" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Módulos de Compras
            </Link>
            <span>/</span>
            <span className="text-slate-400">Órdenes de Compra</span>
          </nav>
          <div className="compras-header-title-row">
            <h1 className="compras-page-title">
              Órdenes de Compra
            </h1>
            <span className="compras-context-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                description
              </span>
              Gestión y Control de ODC
            </span>
          </div>
          <p className="compras-page-subtitle">
            Gestión, seguimiento y control de órdenes de compra
          </p>
        </div>

        <div className="compras-header-actions">
          <button
            type="button"
            className="cp-btn cp-btn-secondary"
            onClick={handleExportCSV}
            title="Descargar reporte en formato CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              download
            </span>
            Exportar CSV
          </button>
          <Link href="/compras/ordenes/nueva" className="cp-btn cp-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add_shopping_cart
            </span>
            Nueva Orden de Compra
          </Link>
          <ModuleMenu />
        </div>
      </div>

      {/* ── FILTROS AVANZADOS DE ÓRDENES DE COMPRA (REQUISITO 2: POR ESTATUS, PROVEEDOR Y FECHA) ── */}
      {modoVista === 'control' && (
        <section className="cp-filter-box" aria-label="Filtros por estatus, proveedor y fecha">
          <div className="cp-filter-box-header">
            <div className="cp-filter-box-title">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'var(--primary)' }}
              >
                tune
              </span>
              <span>Filtros de Órdenes de Compra (Estatus, Proveedor y Rango de Fecha)</span>

              {filtroParam && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    backgroundColor:
                      filtroParam === 'por-actualizar'
                        ? 'rgba(217, 119, 6, 0.15)'
                        : 'rgba(37, 99, 235, 0.15)',
                    border: `1px solid ${filtroParam === 'por-actualizar' ? '#d97706' : 'var(--primary, #1d4ed8)'
                      }`,
                    color:
                      filtroParam === 'por-actualizar' ? '#d97706' : 'var(--primary, #1d4ed8)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginLeft: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    {filtroParam === 'por-actualizar' ? 'update' : 'pending_actions'}
                  </span>
                  <span>
                    Filtro activo:{' '}
                    {filtroParam === 'por-actualizar'
                      ? 'Órdenes por actualizar'
                      : 'Órdenes pendientes'}
                  </span>
                  <button
                    type="button"
                    onClick={() => router.replace('/compras/ordenes')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: 0,
                      marginLeft: '2px',
                      color: 'inherit',
                    }}
                    title="Quitar filtro"
                    aria-label="Quitar filtro"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      close
                    </span>
                  </button>
                </div>
              )}
            </div>

            {(filtroEstatus !== 'todas' ||
              filtroProveedor !== 'todos' ||
              filtroFechaDesde ||
              filtroFechaHasta ||
              busqueda ||
              Boolean(filtroParam)) && (
                <button
                  type="button"
                  className="cp-filter-clear-btn"
                  onClick={limpiarFiltros}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    cleaning_services
                  </span>
                  Restablecer Filtros
                </button>
              )}
          </div>

          <div className="cp-filter-grid-controls cp-filter-grid-4">
            <div className="cp-filter-field">
              <label htmlFor="oc-filtro-estatus">Estatus de la Orden</label>
              <select
                id="oc-filtro-estatus"
                className="cp-filter-select"
                value={filtroEstatus}
                onChange={(e) => {
                  setFiltroEstatus(e.target.value as EstatusOrdenCompra | 'todas');
                  setPaginaActual(1);
                }}
              >
                <option value="todas">Todos los estatus ({ordenesLocal.length})</option>
                <option value="abierta">Autorizadas / Emitidas ({kpis.abiertasCount})</option>
                <option value="pendiente">Pendientes de Autorización ({kpis.pendientesCount})</option>
                <option value="transito">En Tránsito ({kpis.transitoCount})</option>
                <option value="cerrada">Recibidas / Cerradas ({kpis.cerradasCount})</option>
                <option value="cancelada">Canceladas ({kpis.canceladasCount})</option>
              </select>
            </div>

            <div className="cp-filter-field">
              <label htmlFor="oc-filtro-proveedor">Proveedor Adjudicado</label>
              <select
                id="oc-filtro-proveedor"
                className="cp-filter-select"
                value={filtroProveedor}
                onChange={(e) => {
                  setFiltroProveedor(e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="todos">Todos los proveedores ({proveedoresUnicos.length})</option>
                {proveedoresUnicos.map((pNombre) => (
                  <option key={pNombre} value={pNombre}>
                    {pNombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="cp-filter-field">
              <label htmlFor="oc-filtro-desde">Fecha Emisión Desde</label>
              <input
                id="oc-filtro-desde"
                type="date"
                className="cp-filter-select"
                value={filtroFechaDesde}
                onChange={(e) => {
                  setFiltroFechaDesde(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="cp-filter-field">
              <label htmlFor="oc-filtro-hasta">Fecha Emisión Hasta</label>
              <input
                id="oc-filtro-hasta"
                type="date"
                className="cp-filter-select"
                value={filtroFechaHasta}
                onChange={(e) => {
                  setFiltroFechaHasta(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── PANEL ESPECIAL CUANDO ESTÁ ACTIVA LA INTERFAZ DE AUTORIZAR ÓRDENES DE COMPRA ── */}
      {modoVista === 'autorizar' && (
        <section
          className="cp-approval-CommandBar"
          aria-label="Panel de Firma y Autorización de Órdenes de Compra"
        >
          <div className="cp-approval-banner-left">
            <div className="cp-approval-shield">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div>
              <h3>Centro de Autorización Gerencial de Órdenes de Compra</h3>
              <p>
                Selecciona una o varias órdenes pendientes para liberar la compra con firma
                digital, o envía cualquier orden activa a revisión.
              </p>
            </div>
          </div>

          <div className="cp-approval-banner-right">
            <div className="cp-approval-comment-input">
              <label htmlFor="cp-auth-comment">Dictamen / Nota de Autorización:</label>
              <input
                id="cp-auth-comment"
                type="text"
                value={comentarioAutorizacion}
                onChange={(e) => setComentarioAutorizacion(e.target.value)}
                placeholder="Comentario de liberación gerencial..."
              />
            </div>

            {seleccionadasIds.length > 0 && (
              <button
                type="button"
                className="cp-btn cp-btn-success-solid"
                onClick={handleAutorizarSeleccionadas}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  task_alt
                </span>
                Autorizar Seleccionadas ({seleccionadasIds.length})
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── BARRA DE BÚSQUEDA EN VIVO Y PESTAÑAS DE ESTADO ── */}
      <div className="cp-toolbar-card">
        <div className="cp-toolbar-top">
          <div className="cp-search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              className="cp-search-input"
              placeholder="Buscar por folio (ej. PO10926), proveedor, RFC, SKU, solicitante o proyecto..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              aria-label="Buscar órdenes de compra"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setPaginaActual(1);
                }}
                className="cp-search-clear-btn"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            )}
          </div>

          <div className="cp-toolbar-actions">
            <button
              type="button"
              className="cp-btn cp-btn-secondary"
              onClick={handleRefresh}
              title="Refrescar órdenes"
            >
              <span
                className={`material-symbols-outlined ${isRefreshing ? 'cp-spin' : ''}`}
                style={{ fontSize: 17 }}
              >
                refresh
              </span>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLA INTERACTIVA DE ÓRDENES DE COMPRA / AUTORIZACIÓN ── */}
      <div className="cp-table-card">
        <div className="cp-table-scroll">
          <table className="cp-table">
            <thead>
              <tr>
                {modoVista === 'autorizar' && (
                  <th style={{ width: 42, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todas las órdenes en pantalla"
                      checked={
                        ordenesPaginadas.length > 0 &&
                        ordenesPaginadas.every((o) => seleccionadasIds.includes(o.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeleccionadasIds(ordenesPaginadas.map((o) => o.id));
                        } else {
                          setSeleccionadasIds([]);
                        }
                      }}
                    />
                  </th>
                )}
                <th className="cp-th-sortable" onClick={() => handleSort('folio')}>
                  <div className="cp-th-inner">
                    <span>Folio</span>
                    {renderSortIcon('folio')}
                  </div>
                </th>
                <th
                  className="cp-th-sortable"
                  onClick={() => handleSort('proveedorNombre')}
                >
                  <div className="cp-th-inner">
                    <span>Proveedor</span>
                    {renderSortIcon('proveedorNombre')}
                  </div>
                </th>
                <th className="cp-th-sortable" onClick={() => handleSort('fechaEmision')}>
                  <div className="cp-th-inner">
                    <span>Fecha Emisión</span>
                    {renderSortIcon('fechaEmision')}
                  </div>
                </th>
                <th className="cp-th-sortable" onClick={() => handleSort('fechaEntrega')}>
                  <div className="cp-th-inner">
                    <span>Entrega Estimada</span>
                    {renderSortIcon('fechaEntrega')}
                  </div>
                </th>
                <th
                  className="cp-th-sortable"
                  style={{ textAlign: 'right' }}
                  onClick={() => handleSort('total')}
                >
                  <div className="cp-th-inner" style={{ justifyContent: 'flex-end' }}>
                    <span>Monto Total</span>
                    {renderSortIcon('total')}
                  </div>
                </th>
                <th className="cp-th-sortable" onClick={() => handleSort('estatus')}>
                  <div className="cp-th-inner">
                    <span>Estatus</span>
                    {renderSortIcon('estatus')}
                  </div>
                </th>
                <th>Factura</th>
                <th style={{ textAlign: 'center' }}>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {isRefreshing ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="cp-skeleton-row">
                    <td colSpan={modoVista === 'autorizar' ? 9 : 8}>
                      <div className="cp-skeleton-bar" />
                    </td>
                  </tr>
                ))
              ) : ordenesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={modoVista === 'autorizar' ? 9 : 8}>
                    <div className="cp-empty-state">
                      <span className="material-symbols-outlined">
                        {modoVista === 'autorizar' ? 'task_alt' : 'receipt_long'}
                      </span>
                      <h3>
                        {modoVista === 'autorizar' &&
                          filtroAutorizacionTab === 'pendientes'
                          ? '¡Todas las órdenes han sido autorizadas!'
                          : 'No se encontraron órdenes de compra'}
                      </h3>
                      <p>
                        {modoVista === 'autorizar' &&
                          filtroAutorizacionTab === 'pendientes'
                          ? 'No hay órdenes pendientes de firma en este momento. Puedes ver las órdenes autorizadas o poner alguna en revisión.'
                          : 'No existen registros que coincidan con los criterios de búsqueda.'}
                      </p>
                      <button
                        type="button"
                        className="cp-btn cp-btn-secondary"
                        style={{ marginTop: 8 }}
                        onClick={limpiarFiltros}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16 }}
                        >
                          visibility
                        </span>
                        Ver todas las órdenes
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                ordenesPaginadas.map((oc) => {
                  const isChecked = seleccionadasIds.includes(oc.id);

                  return (
                    <tr
                      key={oc.id}
                      onClick={() => abrirModalOrden(oc, false)}
                      className={`cp-table-row-interactive ${isChecked ? 'cp-row-selected' : ''
                        }`}
                    >
                      {modoVista === 'autorizar' && (
                        <td
                          style={{ textAlign: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSeleccionadasIds((prev) => [...prev, oc.id]);
                              } else {
                                setSeleccionadasIds((prev) =>
                                  prev.filter((id) => id !== oc.id)
                                );
                              }
                            }}
                          />
                        </td>
                      )}
                      <td>
                        <Link
                          href={`/compras/ordenes/${encodeURIComponent(oc.folio)}`}
                          style={{ fontWeight: 800, color: 'var(--primary, #3b82f6)', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                          title="Abrir expediente completo de la Orden de Compra"
                        >
                          {oc.folio}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {oc.proveedorNombre}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {oc.proveedorRfc}
                        </div>
                      </td>
                      <td>{oc.fechaEmision}</td>
                      <td>{oc.fechaEntrega}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {formatMoney(getMontoMXN(oc), oc.moneda === 'USD' ? 'USD' : 'MXN')}
                      </td>
                      <td>{renderEstatusBadge(oc.estatus)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {renderFacturaBadge(oc)}
                      </td>
                      <td
                        style={{ textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                          {modoVista === 'autorizar' && oc.estatus === 'pendiente' && (
                            <button
                              type="button"
                              className="cp-btn cp-btn-approve-inline"
                              onClick={() => handleAutorizarOrden(oc)}
                              title="Autorizar y emitir Orden de Compra"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Autorizar
                            </button>
                          )}
                          <button
                            type="button"
                            className="cp-action-btn-sm"
                            onClick={() => abrirModalOrden(oc, false)}
                            title="Ver Detalle"
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface-alt)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Ver Detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINACIÓN FLUIDA ── */}
        {ordenesFiltradasYOrdenadas.length > 0 && (
          <div className="cp-pagination-bar">
            <div className="cp-pagination-info">
              <span>
                Mostrando{' '}
                <strong>
                  {indiceInicio + 1} -{' '}
                  {Math.min(
                    indiceInicio + itemsPorPagina,
                    ordenesFiltradasYOrdenadas.length
                  )}
                </strong>{' '}
                de <strong>{ordenesFiltradasYOrdenadas.length}</strong> órdenes
              </span>
              <div className="cp-pagination-size">
                <label htmlFor="cp-page-size">Filas:</label>
                <select
                  id="cp-page-size"
                  value={itemsPorPagina}
                  onChange={(e) => {
                    setItemsPorPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            <div className="cp-pagination-controls">
              <button
                type="button"
                className="cp-page-btn"
                disabled={paginaSegura <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_left
                </span>
                Anterior
              </button>

              {Array.from({ length: totalPaginas }).map((_, idx) => {
                const num = idx + 1;
                return (
                  <button
                    key={num}
                    type="button"
                    className={`cp-page-num ${paginaSegura === num ? 'active' : ''}`}
                    onClick={() => setPaginaActual(num)}
                  >
                    {num}
                  </button>
                );
              })}

              <button
                type="button"
                className="cp-page-btn"
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                aria-label="Página siguiente"
              >
                Siguiente
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DE VISTA RÁPIDA, AUTORIZACIÓN Y EDICIÓN EN LÍNEA ── */}
      {ordenSeleccionada && (
        <div
          className="cp-modal-overlay"
          onClick={() => setOrdenSeleccionada(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cp-modal-oc-title"
        >
          <div
            className="cp-modal-content cp-modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cp-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="cp-cell-folio" style={{ fontSize: 16 }}>
                    {ordenSeleccionada.folio}
                  </span>
                  {renderEstatusBadge(ordenSeleccionada.estatus)}
                </div>
                <h2
                  id="cp-modal-oc-title"
                  style={{
                    margin: '6px 0 0',
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {ordenSeleccionada.proveedorNombre}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {ordenSeleccionada.estatus === 'pendiente' && (
                  <button
                    type="button"
                    className="cp-btn cp-btn-approve-inline"
                    onClick={() => handleAutorizarOrden(ordenSeleccionada)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      verified
                    </span>
                    Autorizar y Emitir ODC
                  </button>
                )}
                <button
                  type="button"
                  className={`cp-btn ${modoEdicionModal ? 'cp-btn-primary' : 'cp-btn-secondary'
                    }`}
                  onClick={() => {
                    setModoEdicionModal((v) => !v);
                    setErrorValidacionModal('');
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {modoEdicionModal ? 'visibility' : 'edit_square'}
                  </span>
                  {modoEdicionModal ? 'Modo Lectura' : 'Edición Rápida'}
                </button>
                <button
                  type="button"
                  className="cp-btn cp-btn-secondary"
                  style={{ padding: 6 }}
                  onClick={() => setOrdenSeleccionada(null)}
                  aria-label="Cerrar modal"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="cp-modal-body">
              {/* Stepper de Trazabilidad */}
              <div className="cp-stepper">
                {[
                  { label: 'Requisición', done: true },
                  {
                    label: 'Autorización ODC',
                    done: ordenSeleccionada.estatus !== 'pendiente' && ordenSeleccionada.estatus !== 'cancelada',
                    active: ordenSeleccionada.estatus === 'pendiente',
                  },
                  {
                    label: 'En Tránsito',
                    done:
                      ordenSeleccionada.estatus === 'transito' ||
                      ordenSeleccionada.estatus === 'cerrada',
                    active: ordenSeleccionada.estatus === 'abierta',
                  },
                  {
                    label: 'Recepción Almacén',
                    done: ordenSeleccionada.estatus === 'cerrada',
                    active: ordenSeleccionada.estatus === 'transito',
                  },
                  {
                    label: 'Factura CFDI 4.0',
                    done:
                      ocTieneFactura(ordenSeleccionada.folio) ||
                      Boolean(ordenSeleccionada.tieneFactura),
                  },
                ].map((step, idx) => (
                  <div
                    key={step.label}
                    className={`cp-step ${step.done ? 'done' : ''} ${step.active ? 'active' : ''
                      }`}
                  >
                    <div className="cp-step-dot">
                      {step.done ? (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 14 }}
                        >
                          check
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className="cp-step-label">{step.label}</span>
                  </div>
                ))}
              </div>

              {modoEdicionModal ? (
                <form
                  onSubmit={handleGuardarEdicionRapida}
                  className="cp-quick-edit-form"
                >
                  <div className="cp-quick-edit-banner">
                    <span className="material-symbols-outlined">bolt</span>
                    <div>
                      <strong>Actualización Rápida de Orden de Compra</strong>
                      <p>
                        Modifica el estatus operativo, almacén de recepción o fecha de
                        entrega sin salir del dashboard.
                      </p>
                    </div>
                  </div>

                  {errorValidacionModal && (
                    <div className="cp-validation-alert" role="alert">
                      <span className="material-symbols-outlined">error</span>
                      <span>{errorValidacionModal}</span>
                    </div>
                  )}

                  <div className="cp-form-grid-2">
                    <div className="cp-form-group">
                      <label className="cp-label">Estatus Operativo *</label>
                      <select
                        className="cp-select"
                        value={editEstatus}
                        onChange={(e) =>
                          setEditEstatus(e.target.value as EstatusOrdenCompra)
                        }
                      >
                        <option value="abierta">Autorizada / Emitida</option>
                        <option value="pendiente">Pendiente de Autorización</option>
                        <option value="transito">En Tránsito a Almacén</option>
                        <option value="cerrada">Recibida / Cerrada</option>
                        <option value="cancelada">Cancelada / Rechazada</option>
                      </select>
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-label">
                        Fecha Estimada de Entrega * (Emisión: {ordenSeleccionada.fechaEmision})
                      </label>
                      <input
                        type="date"
                        className={`cp-input ${editFechaEntrega < ordenSeleccionada.fechaEmision
                          ? 'cp-input-invalid'
                          : ''
                          }`}
                        value={editFechaEntrega}
                        min={ordenSeleccionada.fechaEmision}
                        onChange={(e) => {
                          setEditFechaEntrega(e.target.value);
                          if (e.target.value < ordenSeleccionada.fechaEmision) {
                            setErrorValidacionModal(
                              'La fecha de entrega no puede ser menor a la fecha de emisión.'
                            );
                          } else {
                            setErrorValidacionModal('');
                          }
                        }}
                      />
                    </div>

                    <div className="cp-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="cp-label">Almacén / Destino de Recepción *</label>
                      <input
                        type="text"
                        className="cp-input"
                        value={editAlmacen}
                        onChange={(e) => setEditAlmacen(e.target.value)}
                      />
                    </div>

                    <div className="cp-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="cp-label">Notas e Instrucciones de Entrega</label>
                      <textarea
                        className="cp-textarea"
                        rows={3}
                        value={editNotas}
                        onChange={(e) => setEditNotas(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <button
                      type="button"
                      className="cp-btn cp-btn-secondary"
                      onClick={() => setModoEdicionModal(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="cp-btn cp-btn-primary">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 17 }}
                      >
                        save
                      </span>
                      Guardar Cambios en la Orden
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="cp-detail-grid-3">
                    <div className="cp-detail-box">
                      <div className="cp-detail-box-label">Datos del Proveedor</div>
                      <div className="cp-detail-box-value">
                        {ordenSeleccionada.proveedorNombre}
                      </div>
                      <div className="cp-cell-sub">
                        RFC: {ordenSeleccionada.proveedorRfc}
                      </div>
                      <div className="cp-cell-sub">
                        Condición: {ordenSeleccionada.condicionPago}
                      </div>
                    </div>

                    <div className="cp-detail-box">
                      <div className="cp-detail-box-label">Logística y Recepción</div>
                      <div className="cp-detail-box-value">
                        {ordenSeleccionada.almacenDestino}
                      </div>
                      <div className="cp-cell-sub">
                        Emisión: {ordenSeleccionada.fechaEmision}
                      </div>
                      <div className="cp-cell-sub">
                        Entrega: {ordenSeleccionada.fechaEntrega}
                      </div>
                    </div>

                    <div className="cp-detail-box">
                      <div className="cp-detail-box-label">Imputación Presupuestal</div>
                      <div className="cp-detail-box-value">
                        Proyecto {ordenSeleccionada.proyectoId || 'SFG-GEN'}
                      </div>
                      <div className="cp-cell-sub">
                        Solicita: {ordenSeleccionada.solicitante}
                      </div>
                      <div className="cp-cell-sub">{ordenSeleccionada.departamento}</div>
                    </div>
                  </div>

                  <div className="cp-form-section-title" style={{ marginBottom: 10 }}>
                    <span className="material-symbols-outlined">inventory_2</span>
                    Partidas Autorizadas ({(ordenSeleccionada.items || []).length})
                  </div>

                  <div
                    className="cp-table-card"
                    style={{ marginBottom: 16, boxShadow: 'none' }}
                  >
                    <table className="cp-table">
                      <thead>
                        <tr>
                          <th>Partida</th>
                          <th>Código SKU</th>
                          <th>Descripción Técnica</th>
                          <th style={{ textAlign: 'right' }}>Cant.</th>
                          <th style={{ textAlign: 'right' }}>P. Unitario</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ordenSeleccionada.items || []).map((item) => (
                          <tr key={item.id} style={{ cursor: 'default' }}>
                            <td>#{item.partida}</td>
                            <td>
                              <span className="cp-cell-folio">{item.codigo}</span>
                            </td>
                            <td>
                              <div className="cp-cell-title">{item.descripcion}</div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {item.cantidad} {item.unidad}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {formatMoney(item.precioUnitario, ordenSeleccionada.moneda)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {formatMoney(item.subtotal, ordenSeleccionada.moneda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="cp-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setOrdenSeleccionada(null)}
              >
                Cerrar
              </button>
              {ordenSeleccionada.estatus === 'pendiente' ? (
                <>
                  <button
                    type="button"
                    className="cp-btn cp-btn-approve-inline"
                    onClick={() => {
                      handleAutorizarOrden(ordenSeleccionada);
                      setOrdenSeleccionada(null);
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                      check_circle
                    </span>
                    Autorizar Orden
                  </button>
                  <button
                    type="button"
                    className="cp-btn cp-btn-reject-inline"
                    onClick={() => {
                      handleRechazarOrden(ordenSeleccionada);
                      setOrdenSeleccionada(null);
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                      cancel
                    </span>
                    Rechazar
                  </button>
                </>
              ) : modoVista === 'autorizar' ? (
                <button
                  type="button"
                  className="cp-btn cp-btn-secondary"
                  onClick={() => {
                    handleEnviarARevision(ordenSeleccionada);
                    setOrdenSeleccionada(null);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                    history
                  </span>
                  Poner en Revisión
                </button>
              ) : null}
              <Link
                href={`/compras/facturas?oc=${encodeURIComponent(
                  ordenSeleccionada.folio
                )}`}
                className="cp-btn cp-btn-secondary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  receipt_long
                </span>
                Gestionar Factura CFDI
              </Link>
              <Link
                href={`/compras/ordenes/${encodeURIComponent(ordenSeleccionada.folio)}`}
                className="cp-btn cp-btn-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  open_in_new
                </span>
                Abrir Expediente Completo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrdenesCompraPage;
