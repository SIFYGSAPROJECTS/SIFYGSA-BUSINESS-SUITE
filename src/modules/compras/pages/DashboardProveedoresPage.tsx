'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  obtenerProveedores,
  guardarNuevoProveedor,
} from '../data/mock-data';
import type { Proveedor, EstatusProveedor, OpinionSat32D } from '../types';
import { useCompras } from '../context/ComprasContext';
import { ModuleMenu } from '@/components/ui/ModuleMenu';
import '../compras.css';

type SortFieldPrv =
  | 'id'
  | 'razonSocial'
  | 'categoria'
  | 'limiteCredito'
  | 'opinionSat32D'
  | 'estatus';
type SortDirection = 'asc' | 'desc';

export const DashboardProveedoresPage: React.FC = () => {
  const router = useRouter();
  const { ordenes, proveedores: proveedoresContext, guardarProveedor } = useCompras();
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    return proveedoresContext && proveedoresContext.length > 0 ? proveedoresContext : obtenerProveedores();
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (proveedoresContext && proveedoresContext.length > 0) {
      setProveedores(proveedoresContext);
    }
  }, [proveedoresContext]);

  // ── TOAST DE RETROALIMENTACIÓN ──
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  const mostrarNotificacion = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // ── FILTROS Y BÚSQUEDA EN VIVO ──
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusProveedor | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroOpinion32D, setFiltroOpinion32D] = useState<string>('TODAS');
  const [filtroMoneda, setFiltroMoneda] = useState<string>('TODAS');

  // ── ORDENAMIENTO Y PAGINACIÓN ──
  const [sortField, setSortField] = useState<SortFieldPrv>('id');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [itemsPorPagina, setItemsPorPagina] = useState<number>(8);

  // ── MODAL DE DETALLE Y EDICIÓN RÁPIDA EN LÍNEA ──
  const [proveedorDetalle, setProveedorDetalle] = useState<Proveedor | null>(null);
  const [modoEdicionRapida, setModoEdicionRapida] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'expediente' | 'bancos' | 'historial'>('expediente');
  const [editEstatus, setEditEstatus] = useState<EstatusProveedor>('activo');
  const [editOpinion32D, setEditOpinion32D] = useState<OpinionSat32D>('positiva');
  const [editContacto, setEditContacto] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editTelefono, setEditTelefono] = useState<string>('');
  const [editDiasCredito, setEditDiasCredito] = useState<number>(30);
  const [editLimiteCredito, setEditLimiteCredito] = useState<number>(0);
  const [errorModal, setErrorModal] = useState<string>('');

  const abrirModalProveedor = (prv: Proveedor, enEdicion = false) => {
    setProveedorDetalle(prv);
    setModoEdicionRapida(enEdicion);
    setModalTab('expediente');
    setEditEstatus(prv.estatus);
    setEditOpinion32D(prv.opinionSat32D);
    setEditContacto(prv.contactoPrincipal);
    setEditEmail(prv.email);
    setEditTelefono(prv.telefono);
    setEditDiasCredito(prv.diasCredito);
    setEditLimiteCredito(prv.limiteCredito);
    setErrorModal('');
  };

  // Historial Financiero & Facturas del Proveedor Seleccionado
  const facturasProveedor = useMemo(() => {
    if (!proveedorDetalle) return [];
    if (proveedorDetalle.facturasHistorial && proveedorDetalle.facturasHistorial.length > 0) {
      return proveedorDetalle.facturasHistorial;
    }
    const ocs = ordenes.filter(
      (o) =>
        o.proveedorId === proveedorDetalle.id ||
        o.proveedorRfc.toUpperCase() === proveedorDetalle.rfc.toUpperCase() ||
        o.proveedorNombre.toLowerCase().includes(proveedorDetalle.nombreComercial.toLowerCase())
    );
    return ocs.map((o, idx) => ({
      id: `f-hist-${o.id}`,
      folio: o.facturaFolio || `FAC-2026-${8800 + idx}`,
      uuidFiscal: o.facturaUuid || `UUID-${o.id}-SAT`,
      ordenCompraFolio: o.folio,
      fechaEmision: o.fechaEmision,
      fechaVencimiento: '2026-11-28',
      condicionPago: (o.condicionPago.toLowerCase().includes('contado') ? 'contado' : 'credito_30') as any,
      montoTotal: o.total,
      moneda: o.moneda,
      estatus: (o.estatus === 'cerrada_factura_pagada' || o.estatus === 'cerrada' ? 'pagada' : 'abierta') as any,
      comprobantePagoUrl: o.comprobantePagoUrl || '/comprobantes/SPEI_BBVA.pdf',
      comprobantePagoNombre: o.comprobantePagoNombre || `SPEI_PAGO_${o.folio}.pdf`,
    }));
  }, [proveedorDetalle, ordenes]);

  const facturasAbiertas = useMemo(() => {
    return facturasProveedor.filter((f) => f.estatus === 'abierta');
  }, [facturasProveedor]);

  const facturasPagadas = useMemo(() => {
    return facturasProveedor.filter((f) => f.estatus === 'pagada');
  }, [facturasProveedor]);

  const totalAcumuladoFacturado = useMemo(() => {
    return facturasProveedor.reduce((acc, f) => acc + f.montoTotal, 0);
  }, [facturasProveedor]);

  const totalPendientePago = useMemo(() => {
    return facturasAbiertas.reduce((acc, f) => acc + f.montoTotal, 0);
  }, [facturasAbiertas]);

  // Categorías únicas
  const categoriasUnicas = useMemo(
    () => Array.from(new Set(proveedores.map((p) => p.categoria))).sort(),
    [proveedores]
  );

  // ── KPIs EJECUTIVOS DE PROVEEDORES ──
  const kpis = useMemo(() => {
    const total = proveedores.length;
    const activos = proveedores.filter((p) => p.estatus === 'activo').length;
    const inactivos = proveedores.filter(
      (p) => p.estatus === 'inactivo' || p.estatus === 'revision'
    ).length;
    const opinionPositiva = proveedores.filter(
      (p) => p.opinionSat32D === 'positiva'
    ).length;
    const lineaCreditoTotalMXN = proveedores
      .filter((p) => p.estatus === 'activo')
      .reduce(
        (acc, p) =>
          acc + (p.moneda === 'USD' ? p.limiteCredito * 18.45 : p.limiteCredito),
        0
      );
    return { total, activos, inactivos, opinionPositiva, lineaCreditoTotalMXN };
  }, [proveedores]);

  // ── FILTRADO Y ORDENAMIENTO POR COLUMNAS ──
  const proveedoresFiltradosYOrdenados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    const filtrados = proveedores.filter((p) => {
      const matchEstatus = filtroEstatus === 'todos' || p.estatus === filtroEstatus;
      const matchCat = filtroCategoria === 'TODAS' || p.categoria === filtroCategoria;
      const match32D =
        filtroOpinion32D === 'TODAS' || p.opinionSat32D === filtroOpinion32D;
      const matchMoneda = filtroMoneda === 'TODAS' || p.moneda === filtroMoneda;

      const matchQuery =
        !q ||
        p.razonSocial.toLowerCase().includes(q) ||
        p.nombreComercial.toLowerCase().includes(q) ||
        p.rfc.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.contactoPrincipal.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.direccion.ciudad.toLowerCase().includes(q);

      return matchEstatus && matchCat && match32D && matchMoneda && matchQuery;
    });

    return [...filtrados].sort((a, b) => {
      let comp = 0;
      if (sortField === 'id') comp = a.id.localeCompare(b.id);
      else if (sortField === 'razonSocial')
        comp = a.razonSocial.localeCompare(b.razonSocial);
      else if (sortField === 'categoria') comp = a.categoria.localeCompare(b.categoria);
      else if (sortField === 'limiteCredito') {
        const limA = a.moneda === 'USD' ? a.limiteCredito * 18.45 : a.limiteCredito;
        const limB = b.moneda === 'USD' ? b.limiteCredito * 18.45 : b.limiteCredito;
        comp = limA - limB;
      } else if (sortField === 'opinionSat32D')
        comp = a.opinionSat32D.localeCompare(b.opinionSat32D);
      else if (sortField === 'estatus') comp = a.estatus.localeCompare(b.estatus);

      return sortDir === 'asc' ? comp : -comp;
    });
  }, [
    proveedores,
    busqueda,
    filtroEstatus,
    filtroCategoria,
    filtroOpinion32D,
    filtroMoneda,
    sortField,
    sortDir,
  ]);

  // Paginación
  const totalPaginas = Math.max(
    1,
    Math.ceil(proveedoresFiltradosYOrdenados.length / itemsPorPagina)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * itemsPorPagina;
  const proveedoresPaginados = proveedoresFiltradosYOrdenados.slice(
    indiceInicio,
    indiceInicio + itemsPorPagina
  );

  const handleSort = (field: SortFieldPrv) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtrosActivosCount = useMemo(() => {
    let c = 0;
    if (busqueda.trim()) c++;
    if (filtroEstatus !== 'todos') c++;
    if (filtroCategoria !== 'TODAS') c++;
    if (filtroOpinion32D !== 'TODAS') c++;
    if (filtroMoneda !== 'TODAS') c++;
    return c;
  }, [busqueda, filtroEstatus, filtroCategoria, filtroOpinion32D, filtroMoneda]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstatus('todos');
    setFiltroCategoria('TODAS');
    setFiltroOpinion32D('TODAS');
    setFiltroMoneda('TODAS');
    setPaginaActual(1);
    mostrarNotificacion('Filtros del padrón restablecidos', 'info');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setProveedores(obtenerProveedores());
      setIsRefreshing(false);
      mostrarNotificacion('Padrón de proveedores actualizado', 'success');
    }, 350);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'RFC',
      'Razon Social',
      'Nombre Comercial',
      'Categoria',
      'Contacto',
      'Email',
      'Telefono',
      'Moneda',
      'Dias Credito',
      'Limite Credito',
      'Opinion 32D',
      'Estatus',
    ];
    const rows = proveedoresFiltradosYOrdenados.map((p) => [
      p.id,
      p.rfc,
      `"${p.razonSocial.replace(/"/g, '""')}"`,
      `"${p.nombreComercial.replace(/"/g, '""')}"`,
      `"${p.categoria.replace(/"/g, '""')}"`,
      `"${p.contactoPrincipal.replace(/"/g, '""')}"`,
      p.email,
      p.telefono,
      p.moneda,
      p.diasCredito,
      p.limiteCredito,
      p.opinionSat32D.toUpperCase(),
      p.estatus.toUpperCase(),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `padron_proveedores_sifygsa_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarNotificacion(
      `Se exportaron ${proveedoresFiltradosYOrdenados.length} proveedores a CSV`,
      'success'
    );
  };

  const handleGuardarEdicionRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorDetalle) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editContacto.trim()) {
      setErrorModal('El nombre del contacto principal es obligatorio.');
      return;
    }
    if (!emailRegex.test(editEmail.trim())) {
      setErrorModal('Ingresa un correo electrónico válido para notificaciones de OC.');
      return;
    }
    if (editLimiteCredito < 0) {
      setErrorModal('El límite de crédito no puede ser negativo.');
      return;
    }

    // Candado de Validación: Inhabilitación lógica bloqueada si hay órdenes abiertas o pendientes
    if (editEstatus === 'inactivo' && proveedorDetalle.estatus !== 'inactivo') {
      const ordenesAbiertas = ordenes.filter(
        (o) =>
          (o.proveedorId === proveedorDetalle.id ||
            o.proveedorRfc.toUpperCase() === proveedorDetalle.rfc.toUpperCase() ||
            o.proveedorNombre.toLowerCase().includes(proveedorDetalle.nombreComercial.toLowerCase()) ||
            o.proveedorNombre.toLowerCase().includes(proveedorDetalle.razonSocial.toLowerCase())) &&
          o.estatus !== 'cerrada' &&
          o.estatus !== 'cerrada_factura_pagada' &&
          o.estatus !== 'cancelada'
      );

      if (ordenesAbiertas.length > 0) {
        setErrorModal(
          `Bloqueo de Validación: No es posible inhabilitar a este proveedor porque tiene ${ordenesAbiertas.length} orden(es) de compra abiertas o pendientes de pago (ej. ${ordenesAbiertas[0].folio} - ${ordenesAbiertas[0].estatus}). Concluya las órdenes y registre sus pagos antes de suspender el proveedor.`
        );
        return;
      }
    }

    const actualizado: Proveedor = {
      ...proveedorDetalle,
      estatus: editEstatus,
      opinionSat32D: editOpinion32D,
      contactoPrincipal: editContacto.trim(),
      email: editEmail.trim(),
      telefono: editTelefono.trim(),
      diasCredito: Number(editDiasCredito) || 0,
      limiteCredito: Number(editLimiteCredito) || 0,
      fechaActualizacion32D: new Date().toISOString().slice(0, 10),
    };

    guardarProveedor(actualizado, 'Comprador Senior');
    const listaNueva = guardarNuevoProveedor(actualizado);
    setProveedores(listaNueva);
    setProveedorDetalle(actualizado);
    setModoEdicionRapida(false);
    setErrorModal('');
    mostrarNotificacion(
      `Proveedor ${actualizado.nombreComercial} actualizado correctamente`,
      'success'
    );
  };

  const formatMoney = (amount: number, moneda: 'MXN' | 'USD' | 'EUR' = 'MXN') =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(amount);

  const renderEstatusBadge = (estatus: EstatusProveedor) => {
    if (estatus === 'activo') {
      return (
        <span className="cp-badge cp-badge-success">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            check_circle
          </span>
          Activo
        </span>
      );
    }
    if (estatus === 'revision') {
      return (
        <span className="cp-badge cp-badge-warning">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            pending
          </span>
          En Revisión
        </span>
      );
    }
    return (
      <span className="cp-badge cp-badge-danger">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          block
        </span>
        Suspendido
      </span>
    );
  };

  const renderOpinion32D = (opinion: OpinionSat32D, fecha: string) => {
    if (opinion === 'positiva') {
      return (
        <div>
          <span className="cp-badge cp-badge-success">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              verified
            </span>
            32-D Positiva
          </span>
          <div className="cp-cell-sub" style={{ marginTop: 3 }}>
            Vigencia: {fecha}
          </div>
        </div>
      );
    }
    if (opinion === 'revision') {
      return (
        <div>
          <span className="cp-badge cp-badge-warning">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              schedule
            </span>
            En Revisión
          </span>
          <div className="cp-cell-sub" style={{ marginTop: 3 }}>
            Última: {fecha}
          </div>
        </div>
      );
    }
    return (
      <div>
        <span className="cp-badge cp-badge-danger">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            warning
          </span>
          Negativa / Observada
        </span>
        <div className="cp-cell-sub" style={{ marginTop: 3 }}>
          Rev: {fecha}
        </div>
      </div>
    );
  };

  const renderSortIcon = (field: SortFieldPrv) => {
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

  return (
    <div className="compras-module">
      {/* ── TOAST DE CONFIRMACIÓN ── */}
      {toast && (
        <div
          className={`cp-toast-notification cp-toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <div className="cp-toast-body">
            <strong>Padrón de Proveedores</strong>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="cp-toast-close"
            aria-label="Cerrar notificación"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>
        </div>
      )}

      {/* ── ENCABEZADO DEL SUBMÓDULO ── */}
      <div className="compras-header-banner">
        <div className="compras-header-left">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/proveedores/modulos" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Módulos de Proveedores
            </Link>
            <span>/</span>
            <span className="text-slate-400">Directorio</span>
          </nav>
          <div className="compras-header-title-row">
            <h1 className="compras-page-title">Padrón Maestro de Proveedores</h1>
            <span className="compras-context-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                verified_user
              </span>
              Cumplimiento Fiscal SAT 32-D
            </span>
          </div>
        </div>

        <div className="compras-header-actions">
          <button
            type="button"
            className="cp-btn cp-btn-secondary"
            onClick={handleExportCSV}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              download
            </span>
            Exportar CSV
          </button>
          <Link href="/compras/proveedores/nuevo" className="cp-btn cp-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              person_add
            </span>
            Nuevo Proveedor
          </Link>
          <ModuleMenu />
        </div>
      </div>

      {/* ── TARJETAS DE RESUMEN: PROVEEDORES TOTALES, ACTIVOS E INACTIVOS (REQUISITO 3) ── */}
      <div
        className="cp-kpi-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="cp-kpi-card cp-kpi-interactive"
          onClick={() => setFiltroEstatus('todos')}
          role="button"
          tabIndex={0}
        >
          <div className="cp-kpi-top">
            <span className="cp-kpi-label">Proveedores Totales</span>
            <div className="cp-kpi-icon blue">
              <span className="material-symbols-outlined">domain</span>
            </div>
          </div>
          <div className="cp-kpi-value-row">
            <span className="cp-kpi-value">{kpis.total}</span>
            <span className="cp-kpi-unit">Empresas</span>
          </div>
          <div className="cp-kpi-footer">
            <span className="cp-kpi-trend positive">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                verified
              </span>
              {categoriasUnicas.length} giros industriales
            </span>
            <span className="cp-kpi-sub">Padrón activo</span>
          </div>
        </div>

        <div
          className="cp-kpi-card cp-kpi-interactive"
          onClick={() => setFiltroEstatus('activo')}
          role="button"
          tabIndex={0}
        >
          <div className="cp-kpi-top">
            <span className="cp-kpi-label">Proveedores Activos</span>
            <div className="cp-kpi-icon green">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div className="cp-kpi-value-row">
            <span className="cp-kpi-value">{kpis.activos}</span>
            <span className="cp-kpi-unit">Habilitados</span>
          </div>
          <div className="cp-kpi-footer">
            <span className="cp-kpi-trend positive">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                verified_user
              </span>
              {kpis.opinionPositiva} con 32-D Positiva
            </span>
            <span className="cp-kpi-sub">Listos para emitir ODC</span>
          </div>
        </div>

        <div
          className="cp-kpi-card cp-kpi-interactive"
          onClick={() => setFiltroEstatus('revision')}
          role="button"
          tabIndex={0}
        >
          <div className="cp-kpi-top">
            <span className="cp-kpi-label">Proveedores Inactivos / En Revisión</span>
            <div className="cp-kpi-icon amber">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <div className="cp-kpi-value-row">
            <span className="cp-kpi-value">{kpis.inactivos}</span>
            <span className="cp-kpi-unit">En Alerta</span>
          </div>
          <div className="cp-kpi-footer">
            <span className="cp-kpi-trend warning">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                schedule
              </span>
              Requieren actualización
            </span>
            <span className="cp-kpi-sub">Opinión fiscal pendiente</span>
          </div>
        </div>
      </div>

      {/* ── CAJA DE FILTROS AVANZADOS (PATRÓN ALMACÉN / RH) ── */}
      <section className="cp-filter-box" aria-label="Filtros del Padrón de Proveedores">
        <div className="cp-filter-box-header">
          <div className="cp-filter-box-title">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'var(--primary)' }}
            >
              tune
            </span>
            <span>Filtros de Especialidad, Cumplimiento 32-D y Moneda</span>
            {filtrosActivosCount > 0 && (
              <span className="cp-filter-active-badge">
                {filtrosActivosCount} {filtrosActivosCount === 1 ? 'activo' : 'activos'}
              </span>
            )}
          </div>

          {filtrosActivosCount > 0 && (
            <button
              type="button"
              className="cp-filter-clear-btn"
              onClick={limpiarFiltros}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                cleaning_services
              </span>
              Limpiar Filtros
            </button>
          )}
        </div>

        <div className="cp-filter-grid-controls cp-filter-grid-4">
          <div className="cp-filter-field">
            <label htmlFor="prv-filtro-cat">Especialidad / Categoría Industrial</label>
            <select
              id="prv-filtro-cat"
              className="cp-filter-select"
              value={filtroCategoria}
              onChange={(e) => {
                setFiltroCategoria(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="TODAS">Todas las especialidades ({categoriasUnicas.length})</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="cp-filter-field">
            <label htmlFor="prv-filtro-32d">Opinión de Cumplimiento SAT 32-D</label>
            <select
              id="prv-filtro-32d"
              className="cp-filter-select"
              value={filtroOpinion32D}
              onChange={(e) => {
                setFiltroOpinion32D(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="TODAS">Todas las opiniones</option>
              <option value="positiva">32-D Positiva (Vigente)</option>
              <option value="pendiente">Por Actualizar / Pendiente</option>
              <option value="revision">Observada / En Revisión</option>
            </select>
          </div>

          <div className="cp-filter-field">
            <label htmlFor="prv-filtro-estatus">Estatus en Padrón</label>
            <select
              id="prv-filtro-estatus"
              className="cp-filter-select"
              value={filtroEstatus}
              onChange={(e) => {
                setFiltroEstatus(e.target.value as EstatusProveedor | 'todos');
                setPaginaActual(1);
              }}
            >
              <option value="todos">Todos los estatus</option>
              <option value="activo">Activos</option>
              <option value="revision">En Revisión</option>
              <option value="inactivo">Suspendidos / Inactivos</option>
            </select>
          </div>

          <div className="cp-filter-field">
            <label htmlFor="prv-filtro-moneda">Divisa de Operación</label>
            <select
              id="prv-filtro-moneda"
              className="cp-filter-select"
              value={filtroMoneda}
              onChange={(e) => {
                setFiltroMoneda(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="TODAS">Todas las divisas (MXN / USD)</option>
              <option value="MXN">Peso Mexicano (MXN)</option>
              <option value="USD">Dólar Americano (USD)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── BARRA DE BÚSQUEDA EN VIVO Y TABS DE ESTADO ── */}
      <div className="cp-toolbar-card">
        <div className="cp-toolbar-top">
          <div className="cp-search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              className="cp-search-input"
              placeholder="Buscar en vivo por Razón Social, RFC, ID (ej. PRV-00105), giro, contacto o ciudad..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              aria-label="Buscar proveedores"
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

        <div className="cp-filter-tabs">
          {[
            { id: 'todos', label: 'Todos los Proveedores', count: proveedores.length },
            { id: 'activo', label: 'Activos (32-D Vigente)', count: kpis.activos },
            {
              id: 'revision',
              label: 'En Revisión Fiscal',
              count: proveedores.filter((p) => p.estatus === 'revision').length,
            },
            {
              id: 'inactivo',
              label: 'Suspendidos',
              count: proveedores.filter((p) => p.estatus === 'inactivo').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cp-filter-tab ${filtroEstatus === tab.id ? 'active' : ''}`}
              onClick={() => {
                setFiltroEstatus(tab.id as EstatusProveedor | 'todos');
                setPaginaActual(1);
              }}
            >
              {tab.label}
              <span className="cp-filter-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLA INTERACTIVA DE PROVEEDORES CON ORDENAMIENTO Y PAGINACIÓN ── */}
      <div className="cp-table-card">
        <div className="cp-table-scroll">
          <table className="cp-table">
            <thead>
              <tr>
                <th
                  className="cp-th-sortable"
                  onClick={() => handleSort('id')}
                >
                  <div className="cp-th-inner">
                    <span>ID / RFC</span>
                    {renderSortIcon('id')}
                  </div>
                </th>
                <th
                  className="cp-th-sortable"
                  onClick={() => handleSort('razonSocial')}
                >
                  <div className="cp-th-inner">
                    <span>Razón Social y Giro</span>
                    {renderSortIcon('razonSocial')}
                  </div>
                </th>
                <th
                  className="cp-th-sortable"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="cp-th-inner">
                    <span>Categoría / Ubicación</span>
                    {renderSortIcon('categoria')}
                  </div>
                </th>
                <th>Contacto Comercial</th>
                <th
                  className="cp-th-sortable"
                  style={{ textAlign: 'right' }}
                  onClick={() => handleSort('limiteCredito')}
                >
                  <div className="cp-th-inner" style={{ justifyContent: 'flex-end' }}>
                    <span>Crédito / Límite</span>
                    {renderSortIcon('limiteCredito')}
                  </div>
                </th>
                <th
                  className="cp-th-sortable"
                  onClick={() => handleSort('opinionSat32D')}
                >
                  <div className="cp-th-inner">
                    <span>Opinión 32-D</span>
                    {renderSortIcon('opinionSat32D')}
                  </div>
                </th>
                <th
                  className="cp-th-sortable"
                  onClick={() => handleSort('estatus')}
                >
                  <div className="cp-th-inner">
                    <span>Estatus</span>
                    {renderSortIcon('estatus')}
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isRefreshing ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-prv-${idx}`} className="cp-skeleton-row">
                    <td colSpan={8}>
                      <div className="cp-skeleton-bar" />
                    </td>
                  </tr>
                ))
              ) : proveedoresPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="cp-empty-state">
                      <span className="material-symbols-outlined">domain_disabled</span>
                      <h3>No se encontraron proveedores</h3>
                      <p>
                        No hay registros que coincidan con la búsqueda o filtros aplicados.
                      </p>
                      <button
                        type="button"
                        className="cp-btn cp-btn-secondary"
                        style={{ marginTop: 8 }}
                        onClick={limpiarFiltros}
                      >
                        Restablecer filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresPaginados.map((prv) => (
                  <tr
                    key={prv.id}
                    onClick={() => abrirModalProveedor(prv, false)}
                    className="cp-table-row-interactive"
                  >
                    <td>
                      <div className="cp-cell-folio">{prv.id}</div>
                      <div className="cp-cell-sub cp-cell-mono">{prv.rfc}</div>
                    </td>
                    <td>
                      <div className="cp-cell-title">{prv.razonSocial}</div>
                      <div className="cp-cell-sub">
                        {prv.nombreComercial} • {prv.giro}
                      </div>
                    </td>
                    <td>
                      <div className="cp-cell-title">{prv.categoria}</div>
                      <div className="cp-cell-sub">
                        {prv.direccion.ciudad}, {prv.direccion.estado}
                      </div>
                    </td>
                    <td>
                      <div className="cp-cell-title">{prv.contactoPrincipal}</div>
                      <div className="cp-cell-sub">
                        {prv.telefono} • {prv.email}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cp-cell-amount">
                        {formatMoney(prv.limiteCredito, prv.moneda)}
                      </div>
                      <div className="cp-cell-sub">
                        {prv.diasCredito > 0
                          ? `Crédito ${prv.diasCredito} días`
                          : 'Contado'}{' '}
                        ({prv.moneda})
                      </div>
                    </td>
                    <td>{renderOpinion32D(prv.opinionSat32D, prv.fechaActualizacion32D)}</td>
                    <td>{renderEstatusBadge(prv.estatus)}</td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="cp-row-actions">
                        <button
                          type="button"
                          className="cp-icon-action-btn"
                          onClick={() => abrirModalProveedor(prv, false)}
                          title={`Vista rápida de ${prv.razonSocial}`}
                          aria-label={`Vista rápida de ${prv.razonSocial}`}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18 }}
                          >
                            visibility
                          </span>
                        </button>
                        <button
                          type="button"
                          className="cp-icon-action-btn"
                          onClick={() =>
                            router.push(
                              `/compras/proveedores/nuevo?id=${encodeURIComponent(prv.id)}`
                            )
                          }
                          title={`Editar expediente de ${prv.razonSocial}`}
                          aria-label={`Editar ${prv.razonSocial}`}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18 }}
                          >
                            edit
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINACIÓN FLUIDA ── */}
        {proveedoresFiltradosYOrdenados.length > 0 && (
          <div className="cp-pagination-bar">
            <div className="cp-pagination-info">
              <span>
                Mostrando{' '}
                <strong>
                  {indiceInicio + 1} -{' '}
                  {Math.min(
                    indiceInicio + itemsPorPagina,
                    proveedoresFiltradosYOrdenados.length
                  )}
                </strong>{' '}
                de <strong>{proveedoresFiltradosYOrdenados.length}</strong> proveedores
              </span>
              <div className="cp-pagination-size">
                <label htmlFor="prv-page-size">Filas:</label>
                <select
                  id="prv-page-size"
                  value={itemsPorPagina}
                  onChange={(e) => {
                    setItemsPorPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>

            <div className="cp-pagination-controls">
              <button
                type="button"
                className="cp-page-btn"
                disabled={paginaSegura <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
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

      {/* ── MODAL DE EXPEDIENTE Y EDICIÓN RÁPIDA DE PROVEEDOR ── */}
      {proveedorDetalle && (
        <div
          className="cp-modal-overlay"
          onClick={() => setProveedorDetalle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="cp-modal-content cp-modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cp-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="cp-cell-folio" style={{ fontSize: 15 }}>
                    {proveedorDetalle.id}
                  </span>
                  {renderEstatusBadge(proveedorDetalle.estatus)}
                  <span className="cp-badge cp-badge-neutral">{proveedorDetalle.rfc}</span>
                </div>
                <h2
                  style={{
                    margin: '6px 0 0',
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {proveedorDetalle.razonSocial}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className={`cp-btn ${
                    modoEdicionRapida ? 'cp-btn-primary' : 'cp-btn-secondary'
                  }`}
                  onClick={() => {
                    setModoEdicionRapida((v) => !v);
                    setErrorModal('');
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {modoEdicionRapida ? 'visibility' : 'edit_square'}
                  </span>
                  {modoEdicionRapida ? 'Ver Expediente' : 'Edición Rápida'}
                </button>
                <button
                  type="button"
                  className="cp-btn cp-btn-secondary"
                  style={{ padding: 6 }}
                  onClick={() => setProveedorDetalle(null)}
                  aria-label="Cerrar modal"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="cp-modal-body">
              {modoEdicionRapida ? (
                <form
                  onSubmit={handleGuardarEdicionRapida}
                  className="cp-quick-edit-form"
                >
                  <div className="cp-quick-edit-banner">
                    <span className="material-symbols-outlined">verified_user</span>
                    <div>
                      <strong>Actualización Rápida de Padrón y Crédito</strong>
                      <p>
                        Actualiza estatus operativo, cumplimiento SAT 32-D, contacto o
                        línea de crédito con validación en tiempo real.
                      </p>
                    </div>
                  </div>

                  {errorModal && (
                    <div className="cp-validation-alert" role="alert">
                      <span className="material-symbols-outlined">error</span>
                      <span>{errorModal}</span>
                    </div>
                  )}

                  <div className="cp-form-grid-2">
                    <div className="cp-form-group">
                      <label className="cp-label">Estatus en Padrón *</label>
                      <select
                        className="cp-select"
                        value={editEstatus}
                        onChange={(e) =>
                          setEditEstatus(e.target.value as EstatusProveedor)
                        }
                      >
                        <option value="activo">Activo (Habilitado para OC)</option>
                        <option value="revision">En Revisión Documental</option>
                        <option value="inactivo">Suspendido / Inactivo</option>
                      </select>
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-label">Opinión de Cumplimiento SAT 32-D *</label>
                      <select
                        className="cp-select"
                        value={editOpinion32D}
                        onChange={(e) =>
                          setEditOpinion32D(
                            e.target.value as OpinionSat32D
                          )
                        }
                      >
                        <option value="positiva">32-D Positiva (Vigente)</option>
                        <option value="revision">En Revisión / Por Actualizar</option>
                        <option value="negativa">Negativa / Observada</option>
                      </select>
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-label">Contacto Comercial Principal *</label>
                      <input
                        type="text"
                        className="cp-input"
                        value={editContacto}
                        onChange={(e) => setEditContacto(e.target.value)}
                      />
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-label">Correo Electrónico *</label>
                      <input
                        type="email"
                        className="cp-input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-label">Teléfono de Contacto</label>
                      <input
                        type="text"
                        className="cp-input"
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                      />
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-label">Días de Crédito Autorizados</label>
                      <select
                        className="cp-select"
                        value={editDiasCredito}
                        onChange={(e) => setEditDiasCredito(Number(e.target.value))}
                      >
                        <option value={0}>0 días (Contado)</option>
                        <option value={15}>15 días</option>
                        <option value={30}>30 días</option>
                        <option value={45}>45 días</option>
                        <option value={60}>60 días</option>
                      </select>
                    </div>

                    <div className="cp-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="cp-label">
                        Límite de Crédito Autorizado ({proveedorDetalle.moneda})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        className="cp-input"
                        value={editLimiteCredito}
                        onChange={(e) => setEditLimiteCredito(Number(e.target.value))}
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
                      onClick={() => setModoEdicionRapida(false)}
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
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {/* BARRA DE PESTAÑAS DEL MODAL */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      borderBottom: '1.5px solid #e2e8f0',
                      marginBottom: 18,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setModalTab('expediente')}
                      style={{
                        padding: '10px 16px',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        color: modalTab === 'expediente' ? '#1d4ed8' : '#64748b',
                        borderBottom:
                          modalTab === 'expediente'
                            ? '2.5px solid #1d4ed8'
                            : '2.5px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        badge
                      </span>
                      Expediente General & Fiscal
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalTab('bancos')}
                      style={{
                        padding: '10px 16px',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        color: modalTab === 'bancos' ? '#1d4ed8' : '#64748b',
                        borderBottom:
                          modalTab === 'bancos'
                            ? '2.5px solid #1d4ed8'
                            : '2.5px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        account_balance
                      </span>
                      Cuentas Bancarias & Multimoneda
                      {proveedorDetalle.cuentasBancarias && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: '#e0f2fe',
                            color: '#0369a1',
                            fontWeight: 800,
                          }}
                        >
                          {proveedorDetalle.cuentasBancarias.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalTab('historial')}
                      style={{
                        padding: '10px 16px',
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        color: modalTab === 'historial' ? '#1d4ed8' : '#64748b',
                        borderBottom:
                          modalTab === 'historial'
                            ? '2.5px solid #1d4ed8'
                            : '2.5px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        receipt_long
                      </span>
                      Historial Financiero & Facturas
                      {facturasAbiertas.length > 0 && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: '#fef3c7',
                            color: '#b45309',
                            fontWeight: 800,
                          }}
                        >
                          {facturasAbiertas.length} por pagar
                        </span>
                      )}
                    </button>
                  </div>

                  {/* PESTAÑA 1: EXPEDIENTE GENERAL & FISCAL */}
                  {modalTab === 'expediente' && (
                    <div>
                      {/* Candado de Validación: RFC Inmutable */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          marginBottom: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: '#0284c7', fontSize: 24 }}
                          >
                            lock
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>
                                RFC: {proveedorDetalle.rfc}
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  fontWeight: 800,
                                }}
                              >
                                Candado Activo • No Modificable
                              </span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                              Por normativa fiscal, el RFC no puede modificarse en edición. Si cambia de razón social o RFC, inhabilite el registro actual y cree un nuevo proveedor.
                            </p>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          {renderOpinion32D(
                            proveedorDetalle.opinionSat32D,
                            proveedorDetalle.fechaActualizacion32D
                          )}
                        </div>
                      </div>

                      <div className="cp-detail-grid-3">
                        <div className="cp-detail-box">
                          <div className="cp-detail-box-label">Información Fiscal SAT</div>
                          <div className="cp-detail-box-value">{proveedorDetalle.razonSocial}</div>
                          <div className="cp-cell-sub">
                            Tipo: {proveedorDetalle.tipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral'}
                          </div>
                          <div className="cp-cell-sub">{proveedorDetalle.regimenFiscal}</div>
                          <div className="cp-cell-sub">CFDI 4.0: {proveedorDetalle.usoCfdi}</div>
                        </div>

                        <div className="cp-detail-box">
                          <div className="cp-detail-box-label">Contacto & Notificaciones</div>
                          <div className="cp-detail-box-value">{proveedorDetalle.contactoPrincipal}</div>
                          <div className="cp-cell-sub">{proveedorDetalle.puestoContacto}</div>
                          <div className="cp-cell-sub">{proveedorDetalle.email}</div>
                          <div className="cp-cell-sub">Tel: {proveedorDetalle.telefono}</div>
                        </div>

                        <div className="cp-detail-box">
                          <div className="cp-detail-box-label">Domicilio Fiscal</div>
                          <div className="cp-detail-box-value">
                            {proveedorDetalle.direccion.calle}
                          </div>
                          <div className="cp-cell-sub">
                            Colonia: {proveedorDetalle.direccion.colonia}
                          </div>
                          <div className="cp-cell-sub">
                            C.P. {proveedorDetalle.direccion.cp} • {proveedorDetalle.direccion.ciudad},{' '}
                            {proveedorDetalle.direccion.estado}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA 2: CUENTAS BANCARIAS & MULTIMONEDA */}
                  {modalTab === 'bancos' && (
                    <div>
                      {/* Resumen de Condiciones Financieras */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                            MONEDA PRINCIPAL
                          </div>
                          <div
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: '#1d4ed8',
                              marginTop: 4,
                            }}
                          >
                            {proveedorDetalle.moneda}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 2 }}>
                            Secundarias:{' '}
                            {proveedorDetalle.monedasSecundarias?.join(', ') || 'USD, EUR'}
                          </div>
                        </div>

                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                            DÍAS DE CRÉDITO
                          </div>
                          <div
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              marginTop: 4,
                            }}
                          >
                            {proveedorDetalle.diasCredito === 0
                              ? 'Contado (0 días)'
                              : `${proveedorDetalle.diasCredito} días`}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: 2 }}>
                            Condición validada en Tesorería
                          </div>
                        </div>

                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                            LÍMITE DE CRÉDITO AUTORIZADO
                          </div>
                          <div
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              marginTop: 4,
                            }}
                          >
                            {formatMoney(proveedorDetalle.limiteCredito, proveedorDetalle.moneda)}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 2 }}>
                            Línea de crédito en {proveedorDetalle.moneda}
                          </div>
                        </div>
                      </div>

                      {/* Listado de Cuentas Bancarias Homologadas */}
                      <h4
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1d4ed8' }}>
                          account_balance_wallet
                        </span>
                        Cuentas Bancarias Homologadas (Titular validado con RFC)
                      </h4>

                      <div style={{ display: 'grid', gap: 10 }}>
                        {(proveedorDetalle.cuentasBancarias && proveedorDetalle.cuentasBancarias.length > 0
                          ? proveedorDetalle.cuentasBancarias
                          : [
                              {
                                id: 'cta-def-1',
                                banco: proveedorDetalle.banco,
                                cuenta: proveedorDetalle.cuenta,
                                clabe: proveedorDetalle.clabe,
                                titular: proveedorDetalle.razonSocial,
                                moneda: proveedorDetalle.moneda,
                                esPrincipal: true,
                              },
                            ]
                        ).map((cta, index) => (
                          <div
                            key={cta.id || index}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              background: cta.esPrincipal ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <strong style={{ color: '#0f172a', fontSize: '0.94rem' }}>
                                  {cta.banco}
                                </strong>
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    fontWeight: 800,
                                  }}
                                >
                                  {cta.moneda}
                                </span>
                                {cta.esPrincipal && (
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                      background: '#dcfce7',
                                      color: '#166534',
                                      fontWeight: 800,
                                    }}
                                  >
                                    Principal
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.84rem',
                                  color: '#334155',
                                  marginTop: 4,
                                }}
                              >
                                CLABE Interbancaria: <code style={{ fontWeight: 800, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{cta.clabe}</code> (18 dígitos) • No. Cuenta: {cta.cuenta}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                                Titular: <strong>{cta.titular || proveedorDetalle.razonSocial}</strong>
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '0.76rem',
                                color: '#166534',
                                background: '#dcfce7',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                check_circle
                              </span>
                              Activa
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA 3: HISTORIAL FINANCIERO & FACTURAS */}
                  {modalTab === 'historial' && (
                    <div>
                      {/* KPIs Rápidos del Proveedor */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                            MONTO TOTAL ACUMULADO
                          </div>
                          <div
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              marginTop: 4,
                            }}
                          >
                            {formatMoney(totalAcumuladoFacturado, proveedorDetalle.moneda)}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                            {facturasProveedor.length} factura(s) registradas
                          </div>
                        </div>

                        <div
                          style={{
                            background: '#fffbeb',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid #fde68a',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>
                            FACTURAS ABIERTAS (POR PAGAR)
                          </div>
                          <div
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: 800,
                              color: '#b45309',
                              marginTop: 4,
                            }}
                          >
                            {formatMoney(totalPendientePago, proveedorDetalle.moneda)}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: 2 }}>
                            {facturasAbiertas.length} documento(s) pendientes
                          </div>
                        </div>

                        <div
                          style={{
                            background: '#f0fdf4',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>
                            FACTURAS PAGADAS / CERRADAS
                          </div>
                          <div
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: 800,
                              color: '#166534',
                              marginTop: 4,
                            }}
                          >
                            {formatMoney(
                              facturasPagadas.reduce((a, b) => a + b.montoTotal, 0),
                              proveedorDetalle.moneda
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: 2 }}>
                            {facturasPagadas.length} liquidada(s) con comprobante
                          </div>
                        </div>
                      </div>

                      {/* Facturas Abiertas (Pendientes de Pago) */}
                      <div style={{ marginBottom: 18 }}>
                        <h4
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18, color: '#d97706' }}
                          >
                            pending_actions
                          </span>
                          Facturas Abiertas (Pendientes de Pago)
                        </h4>

                        {facturasAbiertas.length === 0 ? (
                          <div
                            style={{
                              padding: '16px',
                              background: '#f8fafc',
                              borderRadius: 8,
                              textAlign: 'center',
                              fontSize: '0.84rem',
                              color: '#64748b',
                            }}
                          >
                            No hay facturas abiertas pendientes de dispersión para este proveedor.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 8 }}>
                            {facturasAbiertas.map((fa) => (
                              <div
                                key={fa.id}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 8,
                                  border: '1px solid #fed7aa',
                                  background: '#fffaf0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                                      {fa.folio}
                                    </strong>
                                    <span
                                      style={{
                                        fontSize: '0.74rem',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: '#fef3c7',
                                        color: '#b45309',
                                        fontWeight: 800,
                                      }}
                                    >
                                      OC: {fa.ordenCompraFolio}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 3 }}>
                                    Emisión: {fa.fechaEmision} •{' '}
                                    <strong style={{ color: '#b45309' }}>
                                      Vencimiento: {fa.fechaVencimiento} (
                                      {fa.condicionPago === 'contado' ? 'Contado' : 'Crédito 30 días'}
                                      )
                                    </strong>
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    UUID: {fa.uuidFiscal}
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  <div
                                    style={{
                                      fontSize: '1rem',
                                      fontWeight: 800,
                                      color: '#0f172a',
                                    }}
                                  >
                                    {formatMoney(fa.montoTotal, fa.moneda)}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#b45309',
                                      background: '#fef3c7',
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Pendiente Dispersión
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Facturas Pagadas / Cerradas */}
                      <div>
                        <h4
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18, color: '#16a34a' }}
                          >
                            task_alt
                          </span>
                          Facturas Pagadas / Cerradas
                        </h4>

                        {facturasPagadas.length === 0 ? (
                          <div
                            style={{
                              padding: '16px',
                              background: '#f8fafc',
                              borderRadius: 8,
                              textAlign: 'center',
                              fontSize: '0.84rem',
                              color: '#64748b',
                            }}
                          >
                            No hay facturas cerradas o pagadas en el historial reciente.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 8 }}>
                            {facturasPagadas.map((fp) => (
                              <div
                                key={fp.id}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 8,
                                  border: '1px solid #bbf7d0',
                                  background: '#f0fdf4',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                                      {fp.folio}
                                    </strong>
                                    <span
                                      style={{
                                        fontSize: '0.74rem',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: '#dcfce7',
                                        color: '#166534',
                                        fontWeight: 800,
                                      }}
                                    >
                                      OC: {fp.ordenCompraFolio}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 3 }}>
                                    Emisión: {fp.fechaEmision} • Estatus:{' '}
                                    <strong style={{ color: '#166534' }}>Pagada / Liquidada</strong>
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    UUID: {fp.uuidFiscal}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div
                                      style={{
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        color: '#166534',
                                      }}
                                    >
                                      {formatMoney(fp.montoTotal, fp.moneda)}
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      Pagada en Tesorería
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      mostrarNotificacion(
                                        `Descargando comprobante ${fp.comprobantePagoNombre || 'SPEI_BBVA.pdf'}...`,
                                        'info'
                                      )
                                    }
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: 6,
                                      border: '1px solid #bbf7d0',
                                      background: '#ffffff',
                                      color: '#166534',
                                      fontWeight: 800,
                                      fontSize: '0.76rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                    title="Descargar Comprobante de Pago SPEI"
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: 16 }}
                                    >
                                      download
                                    </span>
                                    SPEI
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="cp-modal-footer">
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => setProveedorDetalle(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primary"
                onClick={() =>
                  router.push(
                    `/compras/proveedores/nuevo?id=${encodeURIComponent(
                      proveedorDetalle.id
                    )}`
                  )
                }
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  edit
                </span>
                Editar Expediente Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardProveedoresPage;

