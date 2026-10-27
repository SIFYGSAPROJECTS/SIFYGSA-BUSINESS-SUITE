'use client';

import React, { useState } from 'react';
import { NOMBRES_ROLES, type RolUsuario } from '@/config/types';
import { tienePermiso } from '@/lib/permissions';
import {
  ESTADOS_REQUISICION,
  ETIQUETAS_ESTADO_REQUISICION,
  type AreaOperativa,
  type EstadoRequisicion,
  type PrioridadRequisicion,
} from '@/modules/requisiciones/constants';
import type {
  NotaSistemaRequisicion,
  Requisicion,
} from '@/modules/requisiciones/types';
import '../compras.css';

interface ArticleItem {
  id: string;
  articleCode: string;
  vendorName: string;
  vendorCode: string;
  available: number;
  availablePhysical: number;
  quantity: number;
  unit: string;
  inventoryDetail: string;
  description: string;
  unitPrice: number;
  taxRate: number; // 0.16
  clientJob: string;
  activityCode: string;
  linkedOrder: string;
  linkedOrderStatus: string;
  deliveryDate: string;
  closed: boolean;
  billable: boolean;
}

export interface ComprasRequisicionProps {
  subItemId?: string;
  requisiciones?: Requisicion[];
  rolUsuario?: RolUsuario;
  nombreUsuario?: string;
  idUsuario?: string;
  alRecargarRequisiciones?: () => Promise<void>;
}

const ARTICULO_POR_DEFECTO: ArticleItem = {
  id: 'art-1',
  articleCode: 'DET-GAS-IR-042 SIL-3',
  vendorName: 'DET-TRONICS / HONEYWELL FIRE & GAS',
  vendorCode: 'PROV-DETRONICS-MX',
  available: 14.0,
  availablePhysical: 14.0,
  quantity: 2,
  unit: 'PZA',
  inventoryDetail: 'SERIE-EXP-2026-SIL3',
  description: 'Detector Óptico Infrarrojo de Gas CH4/H2S con display SIL-2/3',
  unitPrice: 48250.0,
  taxRate: 0.16,
  clientJob: 'PEMEX-INFRA-REFINERIA',
  activityCode: 'ACT-INST-09',
  linkedOrder: 'OC-Pendiente',
  linkedOrderStatus: 'No vinculado',
  deliveryDate: '21/09/2026',
  closed: false,
  billable: true,
};

function mapearPrioridadUIaDominio(prioridadUi: string): PrioridadRequisicion {
  if (prioridadUi.toLowerCase().includes('crítica') || prioridadUi === 'critica') return 'critica';
  if (prioridadUi.toLowerCase().includes('alta')) return 'alta';
  if (prioridadUi.toLowerCase().includes('baja')) return 'baja';
  return 'normal';
}

function mapearPrioridadDominioAUi(prioridad?: PrioridadRequisicion): string {
  switch (prioridad) {
    case 'critica':
      return 'Crítica - Paro de Planta';
    case 'alta':
      return 'Alta - Operación Continua';
    case 'normal':
    case 'baja':
    default:
      return 'Normal';
  }
}

function mapearDepartamentoAArea(depto: string): AreaOperativa {
  const texto = depto.toLowerCase();
  if (texto.includes('instrumentación') || texto.includes('fire')) return 'Instrumentación & Fire/Gas';
  if (texto.includes('tecnología') || texto.includes('sistemas')) return 'Tecnología & Sistemas';
  if (texto.includes('capital') || texto.includes('humano')) return 'Capital Humano';
  if (texto.includes('comercial')) return 'Dirección Comercial';
  return 'Operaciones & Logística';
}

export const ComprasRequisicion: React.FC<ComprasRequisicionProps> = ({
  subItemId,
  requisiciones = [],
  rolUsuario = 'administrador',
  nombreUsuario = 'Pablo Vázquez Culebro',
  idUsuario,
  alRecargarRequisiciones,
}) => {
  // Accordion states
  const [clasificacionOpen, setClasificacionOpen] = useState(true);
  const [infoPrimariaOpen, setInfoPrimariaOpen] = useState(true);
  const [filtrosListaOpen, setFiltrosListaOpen] = useState(true);

  // Vista activa: 'formulario' (el formulario NetSuite de requisición) o 'lista' (el apartado de visualizar requisiciones con el mismo diseño NetSuite)
  const vistaInicial: 'formulario' | 'lista' =
    subItemId === 'compras-mis-requisiciones' || subItemId === 'compras-aprobaciones'
      ? 'lista'
      : 'formulario';
  const [vistaActiva, setVistaActiva] = useState<'formulario' | 'lista'>(vistaInicial);

  // Modo del formulario: 'crear' (agregar nueva requisición) o 'ver' (visualizar / modificar una requisición existente)
  const modoInicial: 'crear' | 'ver' =
    subItemId === 'compras-nueva' || requisiciones.length === 0 ? 'crear' : 'ver';
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'ver'>(modoInicial);
  const [idRequisicionActiva, setIdRequisicionActiva] = useState<string>(
    requisiciones[0]?.id ?? ''
  );

  // Filtros en el apartado de Visualizar Requisiciones
  const [busquedaLista, setBusquedaLista] = useState('');
  const [filtroEstadoLista, setFiltroEstadoLista] = useState<EstadoRequisicion | 'todos'>('todos');
  const [filtroContratoLista, setFiltroContratoLista] = useState('todos');

  // Subtab navigation
  const [activeSubtab, setActiveSubtab] = useState<
    | 'articulos'
    | 'bitacora'
    | 'relaciones'
    | 'comunicacion'
    | 'personalizado'
    | 'tef'
    | 'doc_electronico'
    | 'carta_porte'
  >('articulos');

  const reqSeleccionada =
    modoFormulario === 'ver'
      ? requisiciones.find((r) => r.id === idRequisicionActiva) ?? requisiciones[0] ?? null
      : null;

  // Form Fields
  const [contractNum, setContractNum] = useState(reqSeleccionada?.contrato ?? 'ADM-INFRA');
  const [purchaseType, setPurchaseType] = useState(
    reqSeleccionada?.tipoCompra ?? 'RQ - Requisición Operativa'
  );
  const [subsidiary, setSubsidiary] = useState(reqSeleccionada?.subsidiaria ?? 'SIFYGSA');
  const [requisicionNumero, setRequisicionNumero] = useState(
    modoFormulario === 'crear'
      ? `SFG-ADM-INFRA-RQ-${requisiciones.length + 81}/26`
      : reqSeleccionada?.folio ?? 'SFG-ADM-INFRA-RQ-81/26'
  );
  const [department, setDepartment] = useState(
    reqSeleccionada?.departamento ?? '02 - Mantenimiento e Infraestructura'
  );
  const [warehouseLocation, setWarehouseLocation] = useState(
    reqSeleccionada?.ubicacionAlmacen ?? 'ALM-CENTRAL-MAPACHAPA'
  );
  const [buyer, setBuyer] = useState(
    reqSeleccionada?.comprador ?? '— Seleccionar Comprador Asignado —'
  );
  const [deliveryDate, setDeliveryDate] = useState(
    reqSeleccionada?.fechaRequerida ?? '2026-09-21'
  );
  const [deliveryPlace, setDeliveryPlace] = useState(
    reqSeleccionada?.lugarEntrega ?? 'Base de Operaciones Mapachapa / Refinería Tula'
  );
  const [notes, setNotes] = useState(
    reqSeleccionada?.justificacion ?? 'Suministro urgente para instrumentación SIL-3'
  );
  const [priority, setPriority] = useState(
    reqSeleccionada ? mapearPrioridadDominioAUi(reqSeleccionada.prioridad) : 'Crítica - Paro de Planta'
  );
  const [docStatus, setDocStatus] = useState(reqSeleccionada?.estadoDocumento ?? 'A Revisar');

  // Articles Table State
  const [articles, setArticles] = useState<ArticleItem[]>(() => {
    if (modoInicial === 'ver' && reqSeleccionada && reqSeleccionada.partidas.length > 0) {
      return reqSeleccionada.partidas.map((p, idx) => ({
        id: p.id || `art-${idx + 1}`,
        articleCode: p.codigoArticulo,
        vendorName: p.nombreProveedor ?? 'DET-TRONICS / HONEYWELL FIRE & GAS',
        vendorCode: p.codigoProveedor ?? 'PROV-DETRONICS-MX',
        available: p.disponible ?? 14.0,
        availablePhysical: p.disponible ?? 14.0,
        quantity: p.cantidad,
        unit: p.unidad,
        inventoryDetail: p.detalleInventario ?? 'SERIE-EXP-2026-SIL3',
        description: p.descripcion,
        unitPrice: p.precioUnitario,
        taxRate: 0.16,
        clientJob: p.clienteTrabajo ?? 'PEMEX-INFRA-REFINERIA',
        activityCode: p.activityCode ?? `ACT-INST-0${idx + 1}`,
        linkedOrder: 'OC-Pendiente',
        linkedOrderStatus: 'No vinculado',
        deliveryDate: p.fechaRecibo ?? reqSeleccionada.fechaRequerida,
        closed: reqSeleccionada.estado === 'cierre',
        billable: true,
      }));
    }
    return [ARTICULO_POR_DEFECTO];
  });

  const [selectedRowId, setSelectedRowId] = useState<string>('art-1');
  const [guardando, setGuardando] = useState(false);
  const [avisoSistema, setAvisoSistema] = useState<{
    tipo: 'exito' | 'error';
    mensaje: string;
  } | null>(null);

  const cargarDatosRequisicionEnFormulario = (
    req: Requisicion,
    subtabDestino: 'articulos' | 'bitacora' = 'articulos'
  ) => {
    setVistaActiva('formulario');
    setModoFormulario('ver');
    setIdRequisicionActiva(req.id);
    setContractNum(req.contrato);
    setPurchaseType(req.tipoCompra ?? 'RQ - Requisición Operativa');
    setSubsidiary(req.subsidiaria ?? 'SIFYGSA');
    setRequisicionNumero(req.folio);
    setDepartment(req.departamento ?? `02 - ${req.area}`);
    setWarehouseLocation(req.ubicacionAlmacen ?? 'ALM-CENTRAL-MAPACHAPA');
    setBuyer(req.comprador ?? '— Seleccionar Comprador Asignado —');
    setDeliveryDate(req.fechaRequerida);
    setDeliveryPlace(req.lugarEntrega ?? 'Base de Operaciones Mapachapa / Refinería Tula');
    setNotes(req.justificacion);
    setPriority(mapearPrioridadDominioAUi(req.prioridad));
    setDocStatus(req.estadoDocumento ?? 'A Revisar');
    setArticles(
      req.partidas.map((p, idx) => ({
        id: p.id || `art-${idx + 1}`,
        articleCode: p.codigoArticulo,
        vendorName: p.nombreProveedor ?? 'DET-TRONICS / HONEYWELL FIRE & GAS',
        vendorCode: p.codigoProveedor ?? 'PROV-DETRONICS-MX',
        available: p.disponible ?? 14.0,
        availablePhysical: p.disponible ?? 14.0,
        quantity: p.cantidad,
        unit: p.unidad,
        inventoryDetail: p.detalleInventario ?? 'SERIE-EXP-2026-SIL3',
        description: p.descripcion,
        unitPrice: p.precioUnitario,
        taxRate: 0.16,
        clientJob: p.clienteTrabajo ?? 'PEMEX-INFRA-REFINERIA',
        activityCode: p.activityCode ?? `ACT-INST-0${idx + 1}`,
        linkedOrder: 'OC-Pendiente',
        linkedOrderStatus: 'No vinculado',
        deliveryDate: p.fechaRecibo ?? req.fechaRequerida,
        closed: req.estado === 'cierre',
        billable: true,
      }))
    );
    setActiveSubtab(subtabDestino);
  };

  const iniciarNuevaRequisicion = () => {
    const siguienteNum = requisiciones.length + 81;
    setVistaActiva('formulario');
    setModoFormulario('crear');
    setContractNum('ADM-INFRA');
    setPurchaseType('RQ - Requisición Operativa');
    setSubsidiary('SIFYGSA');
    setRequisicionNumero(`SFG-ADM-INFRA-RQ-${siguienteNum}/26`);
    setDepartment('02 - Mantenimiento e Infraestructura');
    setWarehouseLocation('ALM-CENTRAL-MAPACHAPA');
    setBuyer('— Seleccionar Comprador Asignado —');
    setDeliveryDate('2026-11-15');
    setDeliveryPlace('Base de Operaciones Mapachapa / Refinería Tula');
    setNotes('Suministro urgente para instrumentación SIL-3');
    setPriority('Crítica - Paro de Planta');
    setDocStatus('A Revisar');
    setArticles([ARTICULO_POR_DEFECTO]);
    setActiveSubtab('articulos');
    setAvisoSistema(null);
  };

  // Handle inline changes in quantity & price
  const handleUpdateItem = (
    id: string,
    field: 'quantity' | 'unitPrice' | 'articleCode' | 'description',
    value: string | number
  ) => {
    setArticles((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Add line
  const handleAddLine = () => {
    const newId = `art-${articles.length + 1}`;
    const newItem: ArticleItem = {
      id: newId,
      articleCode: `SNSR-CH4-OPT-${articles.length + 1}`,
      vendorName: 'HONEYWELL ANALYTICS PEMEX',
      vendorCode: 'PROV-HONEYWELL-01',
      available: 8.0,
      availablePhysical: 8.0,
      quantity: 1,
      unit: 'PZA',
      inventoryDetail: 'INV-DET-TULA',
      description: 'Sensor electroquímico de calibración rápida rango 0-100 ppm',
      unitPrice: 24500.0,
      taxRate: 0.16,
      clientJob: 'PEMEX-INFRA-REFINERIA',
      activityCode: 'ACT-INST-10',
      linkedOrder: '',
      linkedOrderStatus: 'No vinculado',
      deliveryDate: '25/09/2026',
      closed: false,
      billable: true,
    };
    setArticles([...articles, newItem]);
    setSelectedRowId(newId);
  };

  // Delete line
  const handleDeleteLine = () => {
    if (articles.length <= 1) {
      setAvisoSistema({
        tipo: 'error',
        mensaje: 'La requisición debe contener al menos una línea de partida.',
      });
      return;
    }
    const restantes = articles.filter((item) => item.id !== selectedRowId);
    setArticles(restantes);
    setSelectedRowId(restantes[0]?.id || '');
  };

  // Clear all
  const handleClearAll = () => {
    setArticles([
      {
        ...ARTICULO_POR_DEFECTO,
        id: 'art-1',
        articleCode: 'ART-NUEVO-01',
        description: 'Captura la descripción del artículo requerido',
        quantity: 1,
        unitPrice: 1000,
      },
    ]);
  };

  // Guardar Nueva Requisición o Guardar Modificaciones en Requisición Existente
  const manejarGuardarNetSuite = async () => {
    setGuardando(true);
    setAvisoSistema(null);
    try {
      const partidasPayload = articles.map((a) => ({
        codigoArticulo: a.articleCode.trim() || 'ART-01',
        nombreProveedor: a.vendorName,
        codigoProveedor: a.vendorCode,
        disponible: a.available,
        detalleInventario: a.inventoryDetail,
        descripcion: a.description.trim() || 'Artículo de requisición',
        cantidad: Math.max(1, Number(a.quantity)),
        unidad: a.unit || 'PZA',
        precioUnitario: Math.max(1, Number(a.unitPrice)),
        clienteTrabajo: a.clientJob,
        activityCode: a.activityCode,
        fechaRecibo: a.deliveryDate,
      }));

      if (modoFormulario === 'crear' || !reqSeleccionada) {
        const res = await fetch('/api/requisiciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contrato: contractNum,
            tipoCompra: purchaseType,
            subsidiaria: subsidiary,
            departamento: department,
            ubicacionAlmacen: warehouseLocation,
            comprador: buyer,
            lugarEntrega: deliveryPlace,
            estadoDocumento: docStatus,
            solicitante: nombreUsuario,
            area: mapearDepartamentoAArea(department),
            descripcion: deliveryPlace,
            prioridad: mapearPrioridadUIaDominio(priority),
            justificacion: notes,
            fechaRequerida: deliveryDate,
            partidas: partidasPayload,
          }),
        });
        const json = (await res.json()) as {
          exito: boolean;
          datos?: Requisicion;
          error?: string;
        };
        if (!json.exito || !json.datos) {
          throw new Error(json.error ?? 'No fue posible crear la requisición.');
        }
        await alRecargarRequisiciones?.();
        cargarDatosRequisicionEnFormulario(json.datos, 'bitacora');
        setAvisoSistema({
          tipo: 'exito',
          mensaje: `Nueva Requisición ${json.datos.folio} guardada exitosamente y registrada en la Bitácora del Sistema (Oracle NetSuite).`,
        });
      } else {
        const res = await fetch(`/api/requisiciones/${reqSeleccionada.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contrato: contractNum,
            tipoCompra: purchaseType,
            subsidiaria: subsidiary,
            departamento: department,
            ubicacionAlmacen: warehouseLocation,
            comprador: buyer,
            lugarEntrega: deliveryPlace,
            estadoDocumento: docStatus,
            area: mapearDepartamentoAArea(department),
            descripcion: deliveryPlace,
            prioridad: mapearPrioridadUIaDominio(priority),
            justificacion: notes,
            fechaRequerida: deliveryDate,
            partidas: partidasPayload,
          }),
        });
        const json = (await res.json()) as {
          exito: boolean;
          datos?: Requisicion;
          error?: string;
        };
        if (!json.exito || !json.datos) {
          throw new Error(json.error ?? 'No fue posible guardar los cambios de la requisición.');
        }
        await alRecargarRequisiciones?.();
        cargarDatosRequisicionEnFormulario(json.datos, 'bitacora');
        setAvisoSistema({
          tipo: 'exito',
          mensaje: `Cambios guardados en ${json.datos.folio}. Los campos modificados por ${nombreUsuario} se registraron en la Bitácora del Sistema.`,
        });
      }
    } catch (err) {
      setAvisoSistema({
        tipo: 'error',
        mensaje: err instanceof Error ? err.message : 'Error al procesar la requisición.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarTransicionEstado = async (nuevoEstado: EstadoRequisicion, comentario: string) => {
    if (!reqSeleccionada) return;
    setGuardando(true);
    setAvisoSistema(null);
    try {
      const res = await fetch(`/api/requisiciones/${reqSeleccionada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado, comentario }),
      });
      const json = (await res.json()) as {
        exito: boolean;
        datos?: Requisicion;
        error?: string;
      };
      if (!json.exito || !json.datos) {
        throw new Error(json.error ?? 'No se pudo actualizar el estado.');
      }
      await alRecargarRequisiciones?.();
      cargarDatosRequisicionEnFormulario(json.datos, 'bitacora');
      setAvisoSistema({
        tipo: 'exito',
        mensaje: `Estado de ${json.datos.folio} actualizado a "${ETIQUETAS_ESTADO_REQUISICION[nuevoEstado]}" y registrado en la Bitácora del Sistema.`,
      });
    } catch (err) {
      setAvisoSistema({
        tipo: 'error',
        mensaje: err instanceof Error ? err.message : 'Error al cambiar estado.',
      });
    } finally {
      setGuardando(false);
    }
  };

  // Financial calculations
  const subtotal = articles.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const solicitanteMostrado =
    modoFormulario === 'crear'
      ? nombreUsuario
      : reqSeleccionada?.solicitante ?? nombreUsuario;

  const fechaElaboracionMostrada =
    modoFormulario === 'crear'
      ? new Date().toLocaleDateString('es-MX')
      : reqSeleccionada
      ? new Date(reqSeleccionada.fechaCreacion).toLocaleDateString('es-MX')
      : '17/09/2026';

  const estadoAprobacionTexto =
    modoFormulario === 'crear'
      ? 'NUEVA REQUISICIÓN'
      : reqSeleccionada
      ? ETIQUETAS_ESTADO_REQUISICION[reqSeleccionada.estado].toUpperCase()
      : 'APROBACIÓN PENDIENTE';

  const puedeAprobar =
    tienePermiso(rolUsuario, 'requisiciones', 'aprobar') ||
    tienePermiso(rolUsuario, 'requisiciones', 'editar');

  const esSolicitanteActual =
    reqSeleccionada &&
    ((idUsuario && reqSeleccionada.solicitanteId === idUsuario) ||
      reqSeleccionada.solicitante.trim().toLowerCase() === nombreUsuario.trim().toLowerCase());

  // Construir la bitácora estilo Oracle NetSuite (System Notes)
  const notasSistemaNetSuite: NotaSistemaRequisicion[] = React.useMemo(() => {
    if (!reqSeleccionada) return [];
    const notasDirectas = reqSeleccionada.bitacoraNetSuite ?? [];
    const notasDeHistorial: NotaSistemaRequisicion[] = reqSeleccionada.historial.map((h) => ({
      id: `hist_ns_${h.id}`,
      fecha: h.fecha,
      usuarioNombre: h.usuarioNombre,
      rolUsuario: h.rolUsuario,
      contexto: 'Workflow de Estado (SIFYSUITE)',
      tipoOperacion: h.estadoAnterior === null ? 'Creación' : 'Cambio de Estado',
      campo: 'Estado del Flujo',
      valorAnterior: h.estadoAnterior ? ETIQUETAS_ESTADO_REQUISICION[h.estadoAnterior] : '—',
      valorNuevo: `${ETIQUETAS_ESTADO_REQUISICION[h.estadoNuevo]} — ${h.comentario}`,
    }));
    const combinadas = [...notasDirectas, ...notasDeHistorial];
    return combinadas.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [reqSeleccionada]);

  // Filtrado de requisiciones en el Apartado de Visualizar Requisiciones
  const requisicionesFiltradasLista = requisiciones.filter((r) => {
    if (filtroEstadoLista !== 'todos' && r.estado !== filtroEstadoLista) return false;
    if (filtroContratoLista !== 'todos' && r.contrato !== filtroContratoLista) return false;
    if (busquedaLista.trim()) {
      const q = busquedaLista.toLowerCase();
      return (
        r.folio.toLowerCase().includes(q) ||
        r.contrato.toLowerCase().includes(q) ||
        r.solicitante.toLowerCase().includes(q) ||
        r.justificacion.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sumaTotalLista = requisicionesFiltradasLista.reduce((acc, r) => acc + r.total, 0);

  // =========================================================================
  // APARTADO DE VISUALIZAR REQUISICIONES (Mismo diseño NetSuite de compras.css)
  // =========================================================================
  if (vistaActiva === 'lista') {
    return (
      <div className="compras-requisicion-container">
        <div className="req-header-card">
          <div className="req-header-top-row">
            <div className="req-title-group">
              <div className="req-icon-frame">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <div className="req-title-flex">
                  <h1 className="req-heading">
                    Visualizar Requisiciones <span className="req-folio-highlight">({requisicionesFiltradasLista.length} registros)</span>
                  </h1>
                  <span className="req-approval-status-tag">
                    TRANSACCIONES SIFYGSA
                  </span>
                </div>
                <p className="req-meta-sub">
                  Usuario en sesión: <span className="text-highlight">{nombreUsuario}</span> | Selecciona cualquier requisición para visualizarla, modificarla o consultar su Bitácora de Cambios
                </p>
              </div>
            </div>

            <div className="req-utility-links">
              <a
                href="#nueva"
                className="utility-link"
                onClick={(e) => {
                  e.preventDefault();
                  iniciarNuevaRequisicion();
                }}
              >
                + Nueva Requisición
              </a>
              {reqSeleccionada && (
                <>
                  <span className="utility-sep">|</span>
                  <a
                    href="#volver-formulario"
                    className="utility-link"
                    onClick={(e) => {
                      e.preventDefault();
                      cargarDatosRequisicionEnFormulario(reqSeleccionada);
                    }}
                  >
                    Formulario Activo ({reqSeleccionada.folio})
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="req-action-buttons-row">
            <div className="action-buttons-left">
              <div className="split-btn-group">
                <button
                  type="button"
                  className="btn-save-primary"
                  onClick={iniciarNuevaRequisicion}
                >
                  + Crear Nueva Requisición
                </button>
                <button
                  type="button"
                  className="btn-save-arrow"
                  onClick={iniciarNuevaRequisicion}
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                className="btn-action-neutral"
                onClick={() => void alRecargarRequisiciones?.()}
              >
                ↻ Actualizar Lista
              </button>
              {reqSeleccionada && (
                <button
                  type="button"
                  className="btn-action-neutral"
                  onClick={() => cargarDatosRequisicionEnFormulario(reqSeleccionada)}
                >
                  Abrir #{reqSeleccionada.folio}
                </button>
              )}
            </div>

            <div className="req-required-hint">
              Haz clic en &quot;Visualizar / Modificar&quot; para abrir cualquier requisición con este mismo diseño
            </div>
          </div>
        </div>

        {/* Filtros con el mismo acordeón CLASIFICACIÓN de compras.css */}
        <section className="req-accordion-card clasificacion-panel">
          <div
            className="accordion-title-bar"
            onClick={() => setFiltrosListaOpen(!filtrosListaOpen)}
          >
            <span className="title-text">
              <span className="toggle-arrow">{filtrosListaOpen ? '▼' : '▶'}</span> FILTROS DE BÚSQUEDA Y CLASIFICACIÓN
            </span>
            <span className="toggle-hint">haga clic para {filtrosListaOpen ? 'contraer' : 'expandir'}</span>
          </div>

          {filtrosListaOpen && (
            <div className="accordion-body-grid">
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Buscar por Folio, Solicitante o Nota</label>
                  <input
                    type="text"
                    className="sify-input"
                    placeholder="Ej. SFG-ADM-INFRA o detector..."
                    value={busquedaLista}
                    onChange={(e) => setBusquedaLista(e.target.value)}
                  />
                </div>
              </div>
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Número de contrato</label>
                  <select
                    className="sify-select font-mono"
                    value={filtroContratoLista}
                    onChange={(e) => setFiltroContratoLista(e.target.value)}
                  >
                    <option value="todos">— Todos los Contratos —</option>
                    <option value="ADM-INFRA">ADM-INFRA</option>
                    <option value="PEMEX-MINA-SIL3-26">PEMEX-MINA-SIL3-26</option>
                    <option value="ADM-SEGURIDAD-CAMPO">ADM-SEGURIDAD-CAMPO</option>
                    <option value="CORP-TI-DESARROLLO">CORP-TI-DESARROLLO</option>
                    <option value="COM-DEMO-GAS-ISTMO">COM-DEMO-GAS-ISTMO</option>
                  </select>
                </div>
              </div>
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Estado de aprobación</label>
                  <select
                    className="sify-select"
                    value={filtroEstadoLista}
                    onChange={(e) => setFiltroEstadoLista(e.target.value as EstadoRequisicion | 'todos')}
                  >
                    <option value="todos">— Todos los Estados —</option>
                    {ESTADOS_REQUISICION.map((est) => (
                      <option key={est} value={est}>
                        {ETIQUETAS_ESTADO_REQUISICION[est]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tabla de Requisiciones con el diseño exacto netsuite-articles-table */}
        <section className="req-articles-section">
          <div className="netsuite-subtabs-header">
            <div className="subtabs-scroll-row">
              <button type="button" className="netsuite-subtab-btn active">
                Listado de Requisiciones ({requisicionesFiltradasLista.length})
              </button>
            </div>
            <div className="subtabs-table-menu-icon">☰</div>
          </div>

          <div className="articles-sub-bar">
            <div className="articles-sub-bar-left">
              <span className="badge-items-count">
                Importe Acumulado <span className="text-cifra font-bold font-mono">${formatCurrency(sumaTotalLista)} MXN</span>
              </span>
              <span className="badge-expenses-count">Moneda: MXN</span>
            </div>
          </div>

          <div className="articles-table-overflow-wrap">
            <table className="netsuite-articles-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>Nº</th>
                  <th style={{ width: '210px' }}>Requisición Nº</th>
                  <th style={{ width: '165px' }}>Número de Contrato</th>
                  <th style={{ width: '185px' }}>Solicitante</th>
                  <th style={{ width: '200px' }}>Departamento / Área</th>
                  <th style={{ width: '280px' }}>Nota / Justificación</th>
                  <th style={{ width: '115px', textAlign: 'center' }}>Fecha Entrega</th>
                  <th style={{ width: '150px' }}>Estado de Aprobación</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Total (MXN)</th>
                  <th style={{ width: '230px', textAlign: 'center' }}>Acciones (Visualizar / Modificar)</th>
                </tr>
              </thead>
              <tbody>
                {requisicionesFiltradasLista.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Aún no tienes requisiciones registradas con estos criterios. Haz clic en &quot;+ Crear Nueva Requisición&quot; para agregar una.
                    </td>
                  </tr>
                ) : (
                  requisicionesFiltradasLista.map((req, idx) => (
                    <tr
                      key={req.id}
                      className="article-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => cargarDatosRequisicionEnFormulario(req, 'articulos')}
                    >
                      <td className="cell-row-num">{idx + 1}</td>
                      <td>
                        <span className="font-mono font-bold text-brand-orange" style={{ textDecoration: 'underline' }}>
                          {req.folio}
                        </span>
                      </td>
                      <td className="font-mono">{req.contrato}</td>
                      <td>
                        <span className="cell-static-text font-semibold text-white">{req.solicitante}</span>
                      </td>
                      <td>
                        <span className="cell-static-text text-muted">{req.departamento ?? req.area}</span>
                      </td>
                      <td>
                        <span className="cell-static-text">{req.justificacion}</span>
                      </td>
                      <td className="text-center font-mono text-smaller">{req.fechaRequerida}</td>
                      <td>
                        <div className="status-badge-compact amber" style={{ display: 'inline-block' }}>
                          {ETIQUETAS_ESTADO_REQUISICION[req.estado]}
                        </div>
                      </td>
                      <td className="text-right font-mono font-bold text-cifra">
                        ${formatCurrency(req.total)}
                      </td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-table-strip-primary"
                            onClick={() => cargarDatosRequisicionEnFormulario(req, 'articulos')}
                          >
                            Visualizar / Modificar
                          </button>
                          <button
                            type="button"
                            className="btn-table-strip-ghost"
                            onClick={() => cargarDatosRequisicionEnFormulario(req, 'bitacora')}
                          >
                            Bitácora ({(req.bitacoraNetSuite?.length ?? 0) + req.historial.length})
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // FORMULARIO PRINCIPAL DE REQUISICIÓN (Crear Nueva o Visualizar / Modificar)
  // =========================================================================
  return (
    <div className="compras-requisicion-container">
      {/* Top Requisicion Bar */}
      <div className="req-header-card">
        {/* Title + Status + Breadcrumb */}
        <div className="req-header-top-row">
          <div className="req-title-group">
            <div className="req-icon-frame">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <div className="req-title-flex">
                <h1 className="req-heading">
                  Requisición <span className="req-folio-highlight">#{requisicionNumero}</span>
                </h1>
                <span className="req-approval-status-tag">
                  {estadoAprobacionTexto}
                </span>
              </div>
              <p className="req-meta-sub">
                Creado por: <span className="text-highlight">{solicitanteMostrado}</span> | Formulario: <span className="text-highlight">SIFYGSA - Requisición</span>
              </p>
            </div>
          </div>

          <div className="req-utility-links">
            <a
              href="#lista"
              className="utility-link"
              onClick={(e) => {
                e.preventDefault();
                setVistaActiva('lista');
              }}
            >
              Lista ({requisiciones.length})
            </a>
            <span className="utility-sep">|</span>
            <a
              href="#nueva"
              className="utility-link"
              onClick={(e) => {
                e.preventDefault();
                iniciarNuevaRequisicion();
              }}
            >
              Nueva Requisición
            </a>
            <span className="utility-sep">|</span>
            <a
              href="#bitacora"
              className="utility-link"
              onClick={(e) => {
                e.preventDefault();
                setActiveSubtab('bitacora');
              }}
            >
              Bitácora ({notasSistemaNetSuite.length})
            </a>
            <span className="utility-sep">|</span>
            <a
              href="#mas"
              className="utility-link"
              onClick={(e) => {
                e.preventDefault();
                setVistaActiva('lista');
              }}
            >
              Más
            </a>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="req-action-buttons-row">
          <div className="action-buttons-left">
            <div className="split-btn-group">
              <button
                type="button"
                className="btn-save-primary"
                disabled={guardando}
                onClick={() => void manejarGuardarNetSuite()}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn-save-arrow"
                disabled={guardando}
                onClick={() => void manejarGuardarNetSuite()}
              >
                ▼
              </button>
            </div>

            <button
              type="button"
              className="btn-action-neutral"
              onClick={iniciarNuevaRequisicion}
            >
              + Nueva Requisición
            </button>

            <button
              type="button"
              className="btn-action-neutral"
              onClick={() => setVistaActiva('lista')}
            >
              Visualizar Requisiciones ({requisiciones.length})
            </button>

            {modoFormulario === 'ver' &&
              reqSeleccionada &&
              esSolicitanteActual &&
              (reqSeleccionada.estado === 'solicitud' || reqSeleccionada.estado === 'revision') && (
                <button
                  type="button"
                  className="btn-action-neutral"
                  disabled={guardando}
                  onClick={() =>
                    void manejarTransicionEstado(
                      'cancelada',
                      `Cancelada por el solicitante (${nombreUsuario}).`
                    )
                  }
                >
                  Cancelar
                </button>
              )}

            <button
              type="button"
              className="btn-action-neutral"
              onClick={() => {
                setWarehouseLocation('ALM-CENTRAL-MAPACHAPA');
                setDepartment('02 - Mantenimiento e Infraestructura');
                setAvisoSistema({
                  tipo: 'exito',
                  mensaje: 'Centros de costos y almacén predeterminado autocompletados.',
                });
              }}
            >
              Auto completar
            </button>

            {modoFormulario === 'ver' &&
              reqSeleccionada &&
              puedeAprobar &&
              reqSeleccionada.estado === 'solicitud' ? (
                <button
                  type="button"
                  className="btn-action-neutral"
                  disabled={guardando}
                  onClick={() =>
                    void manejarTransicionEstado(
                      'revision',
                      'Enviada a Revisión Técnica.'
                    )
                  }
                >
                  Para Revisión
                </button>
              ) : (
                <button type="button" className="btn-action-disabled" disabled>
                  Para Revisión
                </button>
              )}

            {modoFormulario === 'ver' &&
              reqSeleccionada &&
              puedeAprobar &&
              (reqSeleccionada.estado === 'revision' || reqSeleccionada.estado === 'aprobacion') && (
                <button
                  type="button"
                  className="btn-action-neutral"
                  disabled={guardando}
                  onClick={() =>
                    void manejarTransicionEstado(
                      reqSeleccionada.estado === 'revision' ? 'aprobacion' : 'atencion',
                      reqSeleccionada.estado === 'revision'
                        ? 'Enviada a Aprobación por Nivel.'
                        : 'Aprobada y liberada para Orden de Compra (OC).'
                    )
                  }
                >
                  {reqSeleccionada.estado === 'revision' ? 'Aprobar / Nivel' : '✔ Aprobar'}
                </button>
              )}

            <button
              type="button"
              className="btn-action-neutral"
              onClick={() => setActiveSubtab('bitacora')}
            >
              Acciones <span style={{ fontSize: '9px' }}>▼</span>
            </button>
          </div>

          <div className="req-required-hint">
            * Campos obligatorios requeridos por Sistema SIFYSUITE / PEMEX
          </div>
        </div>
      </div>

      {avisoSistema && (
        <div
          role="status"
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            backgroundColor:
              avisoSistema.tipo === 'exito'
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${
              avisoSistema.tipo === 'exito'
                ? 'rgba(16, 185, 129, 0.45)'
                : 'rgba(239, 68, 68, 0.45)'
            }`,
            color: avisoSistema.tipo === 'exito' ? '#10b981' : '#f87171',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {avisoSistema.tipo === 'exito' ? '✓ ' : '⚠ '}
          {avisoSistema.mensaje}
        </div>
      )}

      {/* Grid: Clasificación (9 cols) + Resumen Financiero (3 cols) */}
      <div className="req-middle-grid">
        {/* Panel Clasificación (SIN Código de requisición) */}
        <section className="req-accordion-card clasificacion-panel">
          <div
            className="accordion-title-bar"
            onClick={() => setClasificacionOpen(!clasificacionOpen)}
          >
            <span className="title-text">
              <span className="toggle-arrow">{clasificacionOpen ? '▼' : '▶'}</span> CLASIFICACIÓN
            </span>
            <span className="toggle-hint">haga clic para {clasificacionOpen ? 'contraer' : 'expandir'}</span>
          </div>

          {clasificacionOpen && (
            <div className="accordion-body-grid">
              {/* Columna 1 */}
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Número de contrato <span className="req">*</span></label>
                  <select
                    className="sify-select font-mono"
                    value={contractNum}
                    onChange={(e) => setContractNum(e.target.value)}
                  >
                    <option value="ADM-INFRA">ADM-INFRA</option>
                    <option value="PEMEX-MINA-SIL3-26">PEMEX-MINA-SIL3-26</option>
                    <option value="PEMEX-PEP-4420-S">PEMEX-PEP-4420-S</option>
                    <option value="SIFYGSA-REF-TULA-08">SIFYGSA-REF-TULA-08</option>
                    <option value="CORP-MTTO-2026">CORP-MTTO-2026</option>
                    <option value="ADM-SEGURIDAD-CAMPO">ADM-SEGURIDAD-CAMPO</option>
                    <option value="CORP-TI-DESARROLLO">CORP-TI-DESARROLLO</option>
                    <option value="COM-DEMO-GAS-ISTMO">COM-DEMO-GAS-ISTMO</option>
                  </select>
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Tipo de compra <span className="req">*</span></label>
                  <select
                    className="sify-select"
                    value={purchaseType}
                    onChange={(e) => setPurchaseType(e.target.value)}
                  >
                    <option value="RQ - Requisición Operativa">RQ - Requisición Operativa</option>
                    <option value="CAPEX - Activo Fijo">CAPEX - Activo Fijo</option>
                    <option value="SUMINISTRO INDUSTRIAL">SUMINISTRO INDUSTRIAL</option>
                    <option value="SERVICIOS TERCEROS">SERVICIOS TERCEROS</option>
                  </select>
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Subsidiaria <span className="req">*</span></label>
                  <select
                    className="sify-select font-semibold text-brand-orange"
                    value={subsidiary}
                    onChange={(e) => setSubsidiary(e.target.value)}
                  >
                    <option value="SIFYGSA">SIFYGSA</option>
                    <option value="SIFYGSA SERVICIOS INTEGRALES">SIFYGSA SERVICIOS INTEGRALES</option>
                  </select>
                </div>
              </div>

              {/* Columna 2 (Sin Código de requisición) */}
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Requisición Nº</label>
                  <input
                    className="sify-input font-mono font-bold text-white bg-darker"
                    type="text"
                    readOnly
                    value={requisicionNumero}
                  />
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Moneda</label>
                  <input
                    className="sify-input font-mono font-semibold"
                    readOnly
                    type="text"
                    value="MXN"
                  />
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Ubicación Almacén</label>
                  <input
                    className="sify-input text-smaller"
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Columna 3 */}
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Próximo aprobador</label>
                  <div className="readonly-link-box">
                    <a href="#aprobador" className="link-aprobador" onClick={(e) => e.preventDefault()}>
                      USUARIO POR CONFIRMAR
                    </a>
                  </div>
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Estado de aprobación</label>
                  <div className="status-badge-compact amber">
                    {modoFormulario === 'crear'
                      ? 'Aprobación pendiente'
                      : reqSeleccionada
                      ? ETIQUETAS_ESTADO_REQUISICION[reqSeleccionada.estado]
                      : 'Aprobación pendiente'}
                  </div>
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Estado del documento</label>
                  <select
                    className="sify-select"
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value)}
                  >
                    <option value="A Revisar">A Revisar</option>
                    <option value="Revisado">Revisado</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              {/* Columna 4 */}
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Fecha de aprobación de DG</label>
                  <input className="sify-input" type="date" />
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Departamento</label>
                  <input
                    className="sify-input text-smaller"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Panel Resumen Financiero */}
        <aside className="req-resumen-financial-card">
          <div className="resumen-card-header">
            <span className="resumen-title">Resumen Financiero</span>
            <span className="resumen-currency-pill">MXN</span>
          </div>

          <div className="resumen-card-body">
            <div className="resumen-calc-row">
              <span className="resumen-row-label">TOTAL ESTIMADO</span>
              <span className="resumen-row-value font-mono font-bold">${formatCurrency(subtotal)}</span>
            </div>
            <div className="resumen-calc-row">
              <span className="resumen-row-label">IVA (16%)</span>
              <span className="resumen-row-value font-mono text-muted">${formatCurrency(iva)}</span>
            </div>
            <div className="resumen-calc-row total-highlight-row">
              <span className="resumen-total-label">TOTAL</span>
              <div className="resumen-total-amount">
                <span className="total-digits font-mono">${formatCurrency(total)}</span>
                <span className="total-curr-tag">MXN</span>
              </div>
            </div>
          </div>

          <div className="resumen-card-footer">
            <span className="info-circle-i">i</span>
            <span>Cálculo automático de impuestos y partidas SIL-3 en tiempo real.</span>
          </div>
        </aside>
      </div>

      {/* Panel Información Primaria */}
      <section className="req-accordion-card info-primaria-panel">
        <div
          className="accordion-title-bar"
          onClick={() => setInfoPrimariaOpen(!infoPrimariaOpen)}
        >
          <span className="title-text">
            <span className="toggle-arrow">{infoPrimariaOpen ? '▼' : '▶'}</span> INFORMACIÓN PRIMARIA
          </span>
          <span className="toggle-hint">haga clic para {infoPrimariaOpen ? 'contraer' : 'expandir'}</span>
        </div>

        {infoPrimariaOpen && (
          <div className="accordion-body-grid">
            {/* Col 1: Solicitante & Fecha */}
            <div className="field-column">
              <div className="form-group-compact">
                <label className="sify-label">Solicitante <span className="req">*</span></label>
                <input
                  className="sify-input font-medium"
                  type="text"
                  readOnly
                  value={solicitanteMostrado}
                />
              </div>
              <div className="form-group-compact">
                <label className="sify-label">Fecha de elaboración <span className="req">*</span></label>
                <input className="sify-input font-mono" type="text" value={fechaElaboracionMostrada} readOnly />
              </div>
            </div>

            {/* Col 2: Comprador & Fecha Entrega */}
            <div className="field-column">
              <div className="form-group-compact">
                <label className="sify-label">Comprador</label>
                <select
                  className="sify-select"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                >
                  <option value="— Seleccionar Comprador Asignado —">— Seleccionar Comprador Asignado —</option>
                  <option value="Compras Central SIFYGSA">Compras Central SIFYGSA</option>
                  <option value="Adquisiciones Planta Minatitlán">Adquisiciones Planta Minatitlán</option>
                  <option value="Compras Urgentes Campo">Compras Urgentes Campo</option>
                </select>
              </div>
              <div className="form-group-compact">
                <label className="sify-label">Fecha de entrega del material <span className="req">*</span></label>
                <input
                  className="sify-input font-mono"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Col 3: Lugar Entrega & Nota */}
            <div className="field-column">
              <div className="form-group-compact">
                <label className="sify-label">Lugar de entrega</label>
                <input
                  className="sify-input"
                  type="text"
                  value={deliveryPlace}
                  onChange={(e) => setDeliveryPlace(e.target.value)}
                  placeholder="Ej: Base SIFYGSA Mapachapa / Refinería Tula"
                />
              </div>
              <div className="form-group-compact">
                <label className="sify-label">Nota</label>
                <input
                  className="sify-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones internas de compra..."
                />
              </div>
            </div>

            {/* Col 4: Formulario & Prioridad */}
            <div className="field-column">
              <div className="form-group-compact">
                <label className="sify-label">Formulario personalizado <span className="req">*</span></label>
                <select className="sify-select font-semibold text-brand-orange">
                  <option>SIFYGSA - Requisición</option>
                  <option>SIFYGSA - Material Crítico PEMEX</option>
                  <option>SIFYGSA - Servicios de Calibración</option>
                </select>
              </div>
              <div className="form-group-compact">
                <label className="sify-label">Prioridad de Suministro</label>
                <select
                  className="sify-select text-amber font-semibold"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Crítica - Paro de Planta">Crítica - Paro de Planta</option>
                  <option value="Alta - Operación Continua">Alta - Operación Continua</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* NetSuite Subtabs & Articles / Bitácora Table */}
      <section className="req-articles-section">
        {/* Blue NetSuite Subtabs Header */}
        <div className="netsuite-subtabs-header">
          <div className="subtabs-scroll-row">
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'articulos' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('articulos')}
            >
              Artículos
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'bitacora' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('bitacora')}
            >
              Bitácora / Información del Sistema ({notasSistemaNetSuite.length})
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'relaciones' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('relaciones')}
            >
              Relaciones
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'comunicacion' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('comunicacion')}
            >
              Comunicación
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'personalizado' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('personalizado')}
            >
              Personalizado
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'tef' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('tef')}
            >
              TEF
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'doc_electronico' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('doc_electronico')}
            >
              Documento electrónico
            </button>
            <button
              type="button"
              className={`netsuite-subtab-btn ${activeSubtab === 'carta_porte' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('carta_porte')}
            >
              Artículos carta porte
            </button>
          </div>
          <div className="subtabs-table-menu-icon" title="Opciones de tabla">
            ☰
          </div>
        </div>

        {activeSubtab === 'bitacora' ? (
          <div>
            <div className="articles-sub-bar">
              <div className="articles-sub-bar-left">
                <span className="badge-items-count">
                  Notas del Sistema (Oracle NetSuite) — Bitácora de creación y modificaciones de{' '}
                  <span className="text-cifra font-bold font-mono">#{requisicionNumero}</span>
                </span>
              </div>
            </div>

            <div className="articles-table-overflow-wrap">
              <table className="netsuite-articles-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>Nº</th>
                    <th style={{ width: '165px' }}>Fecha / Hora</th>
                    <th style={{ width: '190px' }}>Definido por (Usuario)</th>
                    <th style={{ width: '160px' }}>Rol / Contexto</th>
                    <th style={{ width: '140px' }}>Tipo de Operación</th>
                    <th style={{ width: '210px' }}>Campo Modificado</th>
                    <th style={{ width: '230px' }}>Valor Anterior</th>
                    <th style={{ width: '280px' }}>Valor Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {notasSistemaNetSuite.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                        Haz clic en &quot;Guardar&quot; para registrar la nueva requisición en la Bitácora del Sistema.
                      </td>
                    </tr>
                  ) : (
                    notasSistemaNetSuite.map((nota, idx) => (
                      <tr key={nota.id} className="article-row">
                        <td className="cell-row-num">{idx + 1}</td>
                        <td className="font-mono text-smaller">
                          {new Date(nota.fecha).toLocaleString('es-MX')}
                        </td>
                        <td>
                          <span className="cell-static-text font-semibold text-white">
                            {nota.usuarioNombre}
                          </span>
                        </td>
                        <td>
                          <span className="cell-static-text text-muted">
                            {NOMBRES_ROLES[nota.rolUsuario]}
                          </span>
                        </td>
                        <td>
                          <span className="text-brand-orange font-mono font-bold">
                            {nota.tipoOperacion}
                          </span>
                        </td>
                        <td>
                          <span className="cell-static-text font-semibold">{nota.campo}</span>
                        </td>
                        <td>
                          <span className="cell-static-text font-mono text-muted">
                            {nota.valorAnterior}
                          </span>
                        </td>
                        <td>
                          <span className="cell-static-text font-mono font-bold text-cifra">
                            {nota.valorNuevo}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Sub-bar: Subtotal Items / Expenses / Clear all lines */}
            <div className="articles-sub-bar">
              <div className="articles-sub-bar-left">
                <span className="badge-items-count">
                  Artículos <span className="text-cifra font-bold font-mono">${formatCurrency(subtotal)}</span>
                </span>
                <span className="badge-expenses-count">Gastos 0,00</span>
              </div>
              <button
                type="button"
                className="btn-clear-lines"
                onClick={handleClearAll}
              >
                Borrar todas las líneas
              </button>
            </div>

            {/* Table Content */}
            <div className="articles-table-overflow-wrap">
              <table className="netsuite-articles-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px', textAlign: 'center' }}>Nº</th>
                    <th style={{ width: '220px' }}>Artículo <span className="req">*</span></th>
                    <th style={{ width: '200px' }}>Nombre del Proveedor</th>
                    <th style={{ width: '150px' }}>Proveedor</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Disponible</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Disp. Físico</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>Can. <span className="req">*</span></th>
                    <th style={{ width: '60px', textAlign: 'center' }}>UM</th>
                    <th style={{ width: '150px' }}>Detalle de Inventario</th>
                    <th style={{ width: '280px' }}>Descripción</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>PU</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Importe <span className="req">*</span></th>
                    <th style={{ width: '60px', textAlign: 'right' }}>Tasa</th>
                    <th style={{ width: '170px' }}>Cliente:Trabajo <span className="req">*</span></th>
                    <th style={{ width: '130px' }}>Activity Code <span className="req">*</span></th>
                    <th style={{ width: '120px' }}>Pedido Vinculado</th>
                    <th style={{ width: '140px' }}>Estado Pedido</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Fecha Recibo</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Cerrado</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Facturable</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((item, idx) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    const isSelected = item.id === selectedRowId;

                    return (
                      <tr
                        key={item.id}
                        className={`article-row ${isSelected ? 'selected-row' : ''}`}
                        onClick={() => setSelectedRowId(item.id)}
                      >
                        <td className="cell-row-num">{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="cell-input text-white font-mono"
                            value={item.articleCode}
                            onChange={(e) => handleUpdateItem(item.id, 'articleCode', e.target.value)}
                          />
                        </td>
                        <td>
                          <span className="cell-static-text">{item.vendorName}</span>
                        </td>
                        <td>
                          <span className="cell-static-text font-mono text-muted">{item.vendorCode}</span>
                        </td>
                        <td className="text-right font-mono font-semibold">
                          {item.available.toFixed(2)}
                        </td>
                        <td className="text-right font-mono font-semibold">
                          {item.availablePhysical.toFixed(2)}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            className="cell-input text-right font-mono font-bold text-white bg-darker"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                          />
                        </td>
                        <td className="text-center font-mono text-muted">{item.unit}</td>
                        <td>
                          <span className="cell-static-text font-mono">{item.inventoryDetail}</span>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="cell-input"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="100"
                            className="cell-input text-right font-mono text-white bg-darker"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          />
                        </td>
                        <td className="text-right font-mono font-bold text-cifra">
                          ${formatCurrency(lineTotal)}
                        </td>
                        <td className="text-right font-mono text-muted">16%</td>
                        <td>
                          <span className="cell-static-text font-mono text-smaller">{item.clientJob}</span>
                        </td>
                        <td>
                          <span className="cell-static-text font-mono text-smaller">{item.activityCode}</span>
                        </td>
                        <td>
                          <span className="cell-static-text font-mono text-muted">{item.linkedOrder || '—'}</span>
                        </td>
                        <td>
                          <span className="cell-static-text text-muted">{item.linkedOrderStatus}</span>
                        </td>
                        <td className="text-center font-mono text-smaller">{item.deliveryDate}</td>
                        <td className="text-center font-mono text-muted">{item.closed ? 'Sí' : 'No'}</td>
                        <td className="text-center font-mono font-bold">
                          {item.billable ? 'Sí' : 'No'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action bar below table */}
            <div className="articles-table-actions-strip">
              <button
                type="button"
                className="btn-table-strip-primary"
                onClick={handleAddLine}
              >
                ✔ Agregar
              </button>
              <button
                type="button"
                className="btn-table-strip-neutral"
                onClick={() => setSelectedRowId('')}
              >
                ✖ Cancelar
              </button>
              <span className="table-strip-separator">|</span>
              <button
                type="button"
                className="btn-table-strip-ghost"
                onClick={handleAddLine}
              >
                📄 Copiar anterior
              </button>
              <button
                type="button"
                className="btn-table-strip-ghost"
                onClick={handleAddLine}
              >
                + Insertar
              </button>
              <button
                type="button"
                className="btn-table-strip-danger"
                onClick={handleDeleteLine}
              >
                🗑 Eliminar
              </button>
            </div>
          </>
        )}
      </section>

      {/* NetSuite Footer Action Bar with Folio */}
      <div className="req-footer-actions-card">
        <div className="action-buttons-left">
          <div className="split-btn-group">
            <button
              type="button"
              className="btn-save-primary"
              disabled={guardando}
              onClick={() => void manejarGuardarNetSuite()}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              className="btn-save-arrow"
              disabled={guardando}
              onClick={() => void manejarGuardarNetSuite()}
            >
              ▼
            </button>
          </div>
          <button
            type="button"
            className="btn-action-neutral"
            onClick={() => setVistaActiva('lista')}
          >
            Visualizar Requisiciones ({requisiciones.length})
          </button>
          <button
            type="button"
            className="btn-action-neutral"
            onClick={iniciarNuevaRequisicion}
          >
            + Nueva Requisición
          </button>
        </div>

        <div className="req-footer-folio-block">
          <span className="folio-label">Folio de Transacción:</span>
          <span className="folio-value font-mono">{requisicionNumero}</span>
        </div>
      </div>
    </div>
  );
};
