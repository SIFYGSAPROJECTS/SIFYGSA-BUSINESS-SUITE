'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlmacenModal as ModalUniversal } from '../components/ui/AlmacenModal';
// Estilos en almacen.css

// Responsables disponibles para el proyecto
export interface ResponsableProyecto {
  id: string;
  nombreCompleto: string;
  cargoArea: string;
  numeroEmpleado: string;
}

export const RESPONSABLES_DISPONIBLES: ResponsableProyecto[] = [
  {
    id: 'resp-1',
    nombreCompleto: 'Ing. Carlos Mendoza Estrada — Residente de Obra',
    cargoArea: 'Supervisión de Obra & Automatización',
    numeroEmpleado: 'EMP-SIF-0842',
  },
  {
    id: 'resp-2',
    nombreCompleto: 'Ing. Laura Palacios Gómez — Supervisora HSE',
    cargoArea: 'Seguridad Industrial, Higiene y Medio Ambiente (HSE)',
    numeroEmpleado: 'EMP-SIF-0914',
  },
  {
    id: 'resp-3',
    nombreCompleto: 'Téc. Mario Trejo Morales — Contratista Mecánico',
    cargoArea: 'Instalaciones Mecánicas & Soportería de Tuberías',
    numeroEmpleado: 'EMP-EXT-4421',
  },
];

// Interfaz para cada partida de la salida
export interface PartidaSalida {
  id: string;
  sku: string;
  descripcion: string;
  unidad: string;
  ubicacionAlmacen: string;
  solicitado: number;
  surtido: number;
  existencia: number;
  contratoFrente: string;
  proyectoAsignado: string;
  serieLote: string;
  evidenciaAdjunta?: string;
}

export default function SalidaArticuloPage() {
  const router = useRouter();

  // 1. Datos Generales de la Salida
  const [folioSalida] = useState('SA-2026-0047');
  const [solicitudMaterial, setSolicitudMaterial] = useState('SM-104');
  const [proyectoEncabezado, setProyectoEncabezado] = useState('Proyecto Planta Química Toluca');
  const [fechaSalida, setFechaSalida] = useState('27/10/2026');
  const [almacenOrigen, setAlmacenOrigen] = useState('Almacén Principal (Sede CDMX)');
  const [remisionSalida, setRemisionSalida] = useState('REM-SAL-99421');
  const [subsidiariaLegal] = useState('SIFYGSA Fire & Gas S.A. de C.V.');
  const [centroCosto] = useState('CC-402 Operaciones e Instalación Industrial Toluca');

  // 2. Responsable Receptor
  const [responsableSeleccionadoId, setResponsableSeleccionadoId] = useState(RESPONSABLES_DISPONIBLES[0].id);
  const responsableActivo = useMemo(() => {
    return (
      RESPONSABLES_DISPONIBLES.find((r) => r.id === responsableSeleccionadoId) ||
      RESPONSABLES_DISPONIBLES[0]
    );
  }, [responsableSeleccionadoId]);

  const [almacenistaCustodio] = useState(
    'Roberto Velázquez (Supervisor General de Almacén) — Andén 04 Asignado'
  );

  // 3. Firma Digital (Canvas y Estado)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);
  const [firmaSellada, setFirmaSellada] = useState(false);

  // 4. Partidas de Salida (4 partidas exactas de Stitch ID: 2947d4494c43446d845e518a44d0a915)
  const [partidas, setPartidas] = useState<PartidaSalida[]>([
    {
      id: 'p-1',
      sku: 'COD-FZ-RESP-CIVIL',
      descripcion: 'Fianza de responsabilidad civil amparo contrato 4162918010',
      unidad: 'Servicio',
      ubicacionAlmacen: 'Archivo Fiscal Bóveda A',
      solicitado: 1,
      surtido: 1,
      existencia: 1,
      contratoFrente: 'Archivo Fiscal / Contrato Matriz',
      proyectoAsignado: 'Planta Toluca',
      serieLote: 'POL-GMX-88912',
    },
    {
      id: 'p-2',
      sku: 'DET-UVIR-FLAME-01',
      descripcion: 'Detector Óptico de Flama UV/IR Multispectrum Det-Tronics',
      unidad: 'Pieza',
      ubicacionAlmacen: 'Rack A-02, Nivel 1',
      solicitado: 10,
      surtido: 8, // Parcial a propósito (marca ámbar)
      existencia: 18,
      contratoFrente: 'Contrato Planta Química Toluca',
      proyectoAsignado: 'Planta Toluca',
      serieLote: 'SN-X3301-881..888',
    },
    {
      id: 'p-3',
      sku: 'GAS-CAL-CH4-50',
      descripcion: 'Cilindro Gas Patrón Metano CH4 50% LEL (34L Calgaz)',
      unidad: 'Cilindro',
      ubicacionAlmacen: 'Gabinete Criogénico G-1',
      solicitado: 15,
      surtido: 15,
      existencia: 28,
      contratoFrente: 'Contrato Planta Química Toluca',
      proyectoAsignado: 'Planta Toluca',
      serieLote: 'LOT-CAL-2024-11B',
    },
    {
      id: 'p-4',
      sku: 'TUB-CONDUIT-ALUM-1',
      descripcion: 'Tubo Conduit Aluminio Cédula 40 Roscado 1"',
      unidad: 'Tubos',
      ubicacionAlmacen: 'Patio Exterior Rack Tubos 1',
      solicitado: 50,
      surtido: 50, // Excede existencia disponible (40) -> marca rojo de error
      existencia: 40,
      contratoFrente: 'Contrato Planta Química Toluca',
      proyectoAsignado: 'Planta Toluca',
      serieLote: 'LOTE-TUB-2024',
    },
  ]);

  // 5. Modales Interactivos
  const [modalSMOpen, setModalSMOpen] = useState(false);
  const [modalEvidenciaPartidaId, setModalEvidenciaPartidaId] = useState<string | null>(null);
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [salidaConfirmadaExito, setSalidaConfirmadaExito] = useState(false);
  const [mensajeBorrador, setMensajeBorrador] = useState('Borrador autoguardado hace 2 min');

  // Recálculo dinámico de métricas
  const totalSolicitado = useMemo(() => {
    return partidas.reduce((acc, curr) => acc + (Number(curr.solicitado) || 0), 0);
  }, [partidas]);

  const totalSurtido = useMemo(() => {
    return partidas.reduce((acc, curr) => acc + (Number(curr.surtido) || 0), 0);
  }, [partidas]);

  const totalPendiente = useMemo(() => {
    return Math.max(0, totalSolicitado - totalSurtido);
  }, [totalSolicitado, totalSurtido]);

  // Partidas que exceden existencia
  const partidasExcedidas = useMemo(() => {
    return partidas.filter((p) => p.surtido > p.existencia);
  }, [partidas]);

  // Manejo de cambio de cantidad surtida
  const handleSurtidoChange = (id: string, valorStr: string) => {
    const val = parseInt(valorStr, 10);
    const surtidoVal = isNaN(val) ? 0 : Math.max(0, val);
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, surtido: surtidoVal } : item))
    );
  };

  // Manejo de cambio de proyecto por partida
  const handleProyectoPartidaChange = (id: string, nuevoProyecto: string) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, proyectoAsignado: nuevoProyecto } : item))
    );
  };

  // Manejo de cambio de contrato/frente por partida
  const handleContratoFrenteChange = (id: string, nuevoContrato: string) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, contratoFrente: nuevoContrato } : item))
    );
  };

  // Manejo de cambio de serie/lote
  const handleSerieLoteChange = (id: string, nuevaSerie: string) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, serieLote: nuevaSerie } : item))
    );
  };

  // Ajustar todas las partidas excedidas
  const handleAjustarTodasExcedidas = () => {
    setPartidas((prev) =>
      prev.map((item) =>
        item.surtido > item.existencia ? { ...item, surtido: item.existencia } : item
      )
    );
  };

  // Guardar borrador
  const handleGuardarBorrador = () => {
    const ahora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMensajeBorrador(`Borrador guardado manualmente a las ${ahora}`);
  };

  // Métodos del Canvas de Firma
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setTieneFirma(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCoordinates(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setTieneFirma(false);
    setFirmaSellada(false);
  };

  const simularFirmaAutomatica = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Trazo caligráfico estilizado
    ctx.moveTo(40, 75);
    ctx.bezierCurveTo(70, 20, 110, 110, 140, 50);
    ctx.bezierCurveTo(160, 20, 190, 80, 230, 45);
    ctx.bezierCurveTo(250, 30, 280, 90, 320, 60);
    ctx.moveTo(100, 70);
    ctx.lineTo(340, 70);
    ctx.moveTo(270, 40);
    ctx.lineTo(290, 85);
    ctx.stroke();
    ctx.closePath();

    setTieneFirma(true);
    setFirmaSellada(true);
  };

  // Inicializar canvas al montar
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 460;
      canvasRef.current.height = 110;
    }
  }, []);

  return (
    <div className="salida-almacen-container">
      {/* ==========================================================================
          1. ENCABEZADO DE PÁGINA (ViewHeader)
          ========================================================================== */}
      <div className="salida-view-header">
        <div className="salida-header-left">
          <div className="salida-title-badges">
            <h1 className="salida-page-title">Salida de Artículo</h1>
            <span className="salida-folio-badge">{folioSalida}</span>
            <span className="salida-status-badge">
              <span className="salida-pulse-dot" />
              En Preparación
            </span>
          </div>
          <p className="salida-page-subtitle">
            Registro de salida física contra proyecto y descuento inmediato en kárdex
          </p>
        </div>

        <div className="salida-header-actions">
          {/* Regresar al Dashboard */}
          <button
            type="button"
            className="salida-btn-header salida-btn-header-secondary"
            onClick={() => router.push('/almacen')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            <span>Regresar al Dashboard</span>
          </button>

          {/* Ver Solicitud de Material */}
          <button
            type="button"
            className="salida-btn-header salida-btn-header-secondary"
            onClick={() => setModalSMOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              description
            </span>
            <span>Ver Solicitud de Material ({solicitudMaterial})</span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '14px', color: 'var(--primary)' }}
            >
              open_in_new
            </span>
          </button>

          {/* Confirmar Salida al Kárdex */}
          <button
            type="button"
            className="salida-btn-header salida-btn-header-primary"
            onClick={() => {
              setSalidaConfirmadaExito(false);
              setModalConfirmacionOpen(true);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              check
            </span>
            <span>Confirmar Salida al Kárdex</span>
          </button>
        </div>
      </div>

      {/* ==========================================================================
          2. TARJETA DE DATOS GENERALES DE LA SALIDA (SectionCard1_GeneralData)
          ========================================================================== */}
      <section className="salida-card-section" aria-label="Datos Generales de la Salida">
        {/* Fila 1: 5 Campos */}
        <div className="salida-grid-row-5">
          {/* No. Solicitud de Material */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">assignment_turned_in</span>
              <span>No. de Solicitud de Material <span className="text-required">*</span></span>
            </label>
            <div className="salida-input-addon-group">
              <input
                className="salida-input-text font-bold text-blue-custom"
                type="text"
                value={solicitudMaterial}
                onChange={(e) => setSolicitudMaterial(e.target.value)}
              />
              <button
                type="button"
                className="salida-addon-btn"
                onClick={() => setModalSMOpen(true)}
                title="Abrir folio de solicitud en detalle"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  open_in_new
                </span>
              </button>
            </div>
          </div>

          {/* Proyecto Asignado */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">business_center</span>
              <span>Proyecto Asignado <span className="text-required">*</span></span>
            </label>
            <div className="salida-select-wrapper">
              <select
                className="salida-select"
                value={proyectoEncabezado}
                onChange={(e) => setProyectoEncabezado(e.target.value)}
              >
                <option value="Proyecto Planta Química Toluca">
                  Proyecto Planta Química Toluca
                </option>
                <option value="Plataforma Akal-C PEMEX">Plataforma Akal-C PEMEX</option>
                <option value="CFE Dos Bocas">CFE Dos Bocas</option>
                <option value="Refinería Minatitlán">Refinería Minatitlán</option>
              </select>
              <span className="material-symbols-outlined salida-select-arrow">expand_more</span>
            </div>
          </div>

          {/* Fecha de Salida */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">calendar_today</span>
              <span>Fecha de Salida <span className="text-required">*</span></span>
            </label>
            <div className="salida-input-icon-group">
              <input
                className="salida-input-text"
                type="text"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
              <span className="material-symbols-outlined salida-input-icon">calendar_today</span>
            </div>
          </div>

          {/* Almacén de Origen */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">warehouse</span>
              <span>Almacén de Origen <span className="text-required">*</span></span>
            </label>
            <div className="salida-select-wrapper">
              <select
                className="salida-select"
                value={almacenOrigen}
                onChange={(e) => setAlmacenOrigen(e.target.value)}
              >
                <option value="Almacén Principal (Sede CDMX)">
                  Almacén Principal (Sede CDMX)
                </option>
                <option value="Almacén Satélite Toluca">Almacén Satélite Toluca</option>
                <option value="Bodega Externa Huauchinango">Bodega Externa Huauchinango</option>
              </select>
              <span className="material-symbols-outlined salida-select-arrow">expand_more</span>
            </div>
          </div>

          {/* Folio de Vale / Remisión de Salida */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">receipt</span>
              <span>Folio de Vale / Remisión de Salida</span>
            </label>
            <input
              className="salida-input-text font-mono"
              type="text"
              value={remisionSalida}
              onChange={(e) => setRemisionSalida(e.target.value)}
            />
          </div>
        </div>

        {/* Fila 2: 2 Columnas de Solo Lectura */}
        <div className="salida-grid-row-2">
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">corporate_fare</span>
              <span>Subsidiaria Legal</span>
            </label>
            <input
              className="salida-input-text readonly-field"
              type="text"
              readOnly
              value={subsidiariaLegal}
            />
          </div>

          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">domain</span>
              <span>Centro de Costo Asignado</span>
            </label>
            <input
              className="salida-input-text readonly-field"
              type="text"
              readOnly
              value={centroCosto}
            />
          </div>
        </div>
      </section>

      {/* ==========================================================================
          3. TARJETA DEL RESPONSABLE RECEPTOR Y FIRMA (SectionCard2_ReceivingResponsible)
          ========================================================================== */}
      <section className="salida-card-section" aria-label="Responsable que Recibe">
        {/* Cabecera de la sección */}
        <div className="salida-section-header">
          <div className="salida-section-title-box">
            <span className="salida-section-dot" />
            <h2 className="salida-section-title">Responsable que Recibe los Productos</h2>
          </div>
          <span className="salida-verified-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              verified_user
            </span>
            Personal Verificado en Obra
          </span>
        </div>

        {/* Grid de campos del responsable */}
        <div className="salida-grid-row-3">
          {/* Selector de Responsable */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">person</span>
              <span>Responsable del Proyecto <span className="text-required">*</span></span>
            </label>
            <div className="salida-select-wrapper">
              <select
                className="salida-select font-medium"
                value={responsableSeleccionadoId}
                onChange={(e) => setResponsableSeleccionadoId(e.target.value)}
              >
                {RESPONSABLES_DISPONIBLES.map((resp) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.nombreCompleto}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined salida-select-arrow">expand_more</span>
            </div>
          </div>

          {/* Cargo / Área Técnica (Solo Lectura Dinámico) */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">badge</span>
              <span>Cargo / Área Técnica</span>
            </label>
            <input
              className="salida-input-text readonly-field"
              type="text"
              readOnly
              value={responsableActivo.cargoArea}
            />
          </div>

          {/* No. de Empleado / Credencial (Solo Lectura Dinámico) */}
          <div className="salida-field-group">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">id_card</span>
              <span>No. de Empleado / Credencial SIFYGSA</span>
            </label>
            <input
              className="salida-input-text readonly-field font-mono"
              type="text"
              readOnly
              value={responsableActivo.numeroEmpleado}
            />
          </div>

          {/* Almacenista Custodio Responsable */}
          <div className="salida-field-group col-span-full">
            <label className="salida-field-label">
              <span className="material-symbols-outlined salida-label-icon">shield_person</span>
              <span>Almacenista Responsable de Despacho (Custodio)</span>
            </label>
            <input
              className="salida-input-text readonly-field font-medium text-slate-custom"
              type="text"
              readOnly
              value={almacenistaCustodio}
            />
          </div>
        </div>

        {/* Panel de Firma Digital de Custodia */}
        <div className="salida-signature-panel">
          <div className="salida-signature-header">
            <div>
              <span className="salida-signature-title">Firma Digital de Recepción en Obra</span>
              <p className="salida-signature-desc">
                Firma requerida de {responsableActivo.nombreCompleto.split('—')[0].trim()} para
                validar el descargo formal en kárdex
              </p>
            </div>

            <div className="salida-signature-buttons">
              <button
                type="button"
                className="salida-btn-signature-clear"
                onClick={limpiarFirma}
                title="Limpiar trazo de firma"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  restart_alt
                </span>
                Limpiar
              </button>
              <button
                type="button"
                className="salida-btn-signature-action"
                onClick={simularFirmaAutomatica}
                title="Firmar digitalmente con sello biométrico"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  draw
                </span>
                Firmar
              </button>
            </div>
          </div>

          <div className="salida-canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="salida-signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!tieneFirma && (
              <div className="salida-signature-prompt pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  gesture
                </span>
                <span>Dibuje la firma aquí con el mouse o pulse el botón &quot;Firmar&quot;</span>
              </div>
            )}
            {firmaSellada && (
              <div className="salida-signature-stamp">
                <span className="material-symbols-outlined text-emerald-custom">verified</span>
                <span>Sello Digital Verificado • {fechaSalida}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          4. TABLA DE PARTIDAS & COTEJO (SectionCard3_TablePartidas)
          ========================================================================== */}
      <section className="salida-card-section no-padding" aria-label="Partidas de Salida">
        {/* Cabecera con Métricas Exactas */}
        <div className="salida-table-header-bar">
          <div>
            <h2 className="salida-table-title">Cotejo de Partidas &amp; Validación de Salida</h2>
            <p className="salida-table-desc">
              Verifica lo solicitado contra lo entregado y descuenta del kárdex solo lo realmente
              surtido
            </p>
          </div>

          {/* Métricas Resumen */}
          <div className="salida-metrics-strip">
            <div className="salida-metric-item">
              Total Solicitado: <span className="salida-metric-val">{totalSolicitado} uds</span>
            </div>
            <span className="salida-metric-sep">•</span>
            <div className="salida-metric-item emerald-text">
              Total Surtido: <span className="salida-metric-val">{totalSurtido} uds</span>
            </div>
            <span className="salida-metric-sep">•</span>

            {/* Badge de Alerta Pendiente */}
            {totalPendiente > 0 ? (
              <div className="salida-alert-pill warning">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  warning
                </span>
                <span>Faltan {totalPendiente} uds por surtir</span>
              </div>
            ) : (
              <div className="salida-alert-pill success">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  check_circle
                </span>
                <span>Partidas 100% Surtidas</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabla Responsiva con las 11 Columnas Exactas */}
        <div className="salida-table-scroll-container">
          <table className="salida-table">
            <thead>
              <tr>
                <th className="th-num-col">N°</th>
                <th className="th-sku-col">CÓDIGO SKU</th>
                <th className="th-desc-col">DESCRIPCIÓN DE LA PARTIDA</th>
                <th className="th-center-col">SOLICITADO</th>
                <th className="th-center-col">SURTIDO</th>
                <th className="th-center-col">EXISTENCIA</th>
                <th className="th-center-col">CÁLCULO DE PENDIENTE</th>
                <th className="th-contrato-col">CONTRATO / FRENTE ASIGNADO</th>
                <th className="th-proyecto-col">PROYECTO ASIGNADO</th>
                <th className="th-serie-col">NO. DE SERIE / LOTE</th>
                <th className="th-evidencia-col">EVIDENCIA</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((item, index) => {
                const esMenor = item.surtido < item.solicitado;
                const excedeExistencia = item.surtido > item.existencia;

                return (
                  <tr
                    key={item.id}
                    className={`salida-table-row ${excedeExistencia ? 'row-error' : esMenor ? 'row-warning' : ''}`}
                  >
                    {/* 1. N° */}
                    <td className="td-num-col">{index + 1}</td>

                    {/* 2. CÓDIGO SKU */}
                    <td className="td-sku-col">{item.sku}</td>

                    {/* 3. DESCRIPCIÓN DE LA PARTIDA */}
                    <td className="td-desc-col">
                      <div className="td-desc-inner">
                        <span className="td-partida-nombre">{item.descripcion}</span>
                        <div className="td-partida-meta">
                          <span>Unidad: {item.unidad}</span>
                          <span className="salida-meta-dot">•</span>
                          <span className="text-ubicacion">Ubicación: {item.ubicacionAlmacen}</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. SOLICITADO */}
                    <td className="td-center-col font-bold">{item.solicitado}</td>

                    {/* 5. SURTIDO (Input Interactivo con Reglas de Validación Visual) */}
                    <td className="td-center-col">
                      <input
                        className={`salida-surtido-input ${excedeExistencia ? 'input-error' : esMenor ? 'input-warning' : 'input-ok'}`}
                        type="number"
                        min="0"
                        value={item.surtido}
                        onChange={(e) => handleSurtidoChange(item.id, e.target.value)}
                        title={
                          excedeExistencia
                            ? `Excede existencia disponible (${item.existencia} uds)`
                            : esMenor
                              ? `Surtido parcial (${item.surtido} de ${item.solicitado})`
                              : 'Surtido completo'
                        }
                      />
                    </td>

                    {/* 6. EXISTENCIA */}
                    <td className="td-center-col">
                      <div className="salida-existencia-box">
                        <span className="salida-existencia-num">{item.existencia} disp.</span>
                        {excedeExistencia && (
                          <span className="salida-badge-insuficiente">Insuficiente</span>
                        )}
                      </div>
                    </td>

                    {/* 7. CÁLCULO DE PENDIENTE */}
                    <td className="td-center-col">
                      {excedeExistencia ? (
                        <span className="salida-calc-pill error">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            close
                          </span>
                          Excede existencia (Máx {item.existencia} uds)
                        </span>
                      ) : esMenor ? (
                        <span className="salida-calc-pill warning">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            warning
                          </span>
                          Faltan {item.solicitado - item.surtido} uds
                        </span>
                      ) : (
                        <span className="salida-calc-pill success">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            check
                          </span>
                          Completo (100%)
                        </span>
                      )}
                    </td>

                    {/* 8. CONTRATO / FRENTE ASIGNADO */}
                    <td className="td-contrato-col">
                      <div className="salida-select-table-wrapper">
                        <select
                          className="salida-select-table"
                          value={item.contratoFrente}
                          onChange={(e) => handleContratoFrenteChange(item.id, e.target.value)}
                        >
                          <option value="Archivo Fiscal / Contrato Matriz">
                            Archivo Fiscal / Contrato Matriz
                          </option>
                          <option value="Contrato Planta Química Toluca">
                            Contrato Planta Química Toluca
                          </option>
                          <option value="Contrato CFE Dos Bocas 2024-C08">
                            Contrato CFE Dos Bocas 2024-C08
                          </option>
                          <option value="Contrato PEMEX 4162918010">
                            Contrato PEMEX 4162918010
                          </option>
                          <option value="Contrato Refinería Minatitlán - Lote 3">
                            Contrato Refinería Minatitlán - Lote 3
                          </option>
                        </select>
                        <span className="material-symbols-outlined salida-select-table-arrow">
                          expand_more
                        </span>
                      </div>
                    </td>

                    {/* 9. PROYECTO ASIGNADO (Hereda del encabezado y editable por partida) */}
                    <td className="td-proyecto-col">
                      <div className="salida-select-table-wrapper">
                        <select
                          className="salida-select-table font-semibold text-blue-custom"
                          value={item.proyectoAsignado}
                          onChange={(e) => handleProyectoPartidaChange(item.id, e.target.value)}
                        >
                          <option value="Planta Toluca">Planta Toluca</option>
                          <option value="Dos Bocas">Dos Bocas</option>
                          <option value="Akal-C">Akal-C</option>
                          <option value="Minatitlán">Minatitlán</option>
                        </select>
                        <span className="material-symbols-outlined salida-select-table-arrow">
                          expand_more
                        </span>
                      </div>
                    </td>

                    {/* 10. NO. DE SERIE / LOTE */}
                    <td className="td-serie-col">
                      <input
                        className="salida-input-table font-mono"
                        type="text"
                        value={item.serieLote}
                        onChange={(e) => handleSerieLoteChange(item.id, e.target.value)}
                      />
                    </td>

                    {/* 11. EVIDENCIA */}
                    <td className="td-evidencia-col">
                      <button
                        type="button"
                        className={`salida-btn-evidencia ${item.evidenciaAdjunta ? 'has-evidence' : ''}`}
                        onClick={() => setModalEvidenciaPartidaId(item.id)}
                        title="Adjuntar o ver foto de entrega física"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                          {item.evidenciaAdjunta ? 'photo' : 'photo_camera'}
                        </span>
                        <span>{item.evidenciaAdjunta ? 'Ver Foto' : 'Adjuntar'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Banner Inferior de Advertencia sobre Partidas Excedidas */}
        {partidasExcedidas.length > 0 && (
          <div className="salida-warning-banner">
            <div className="salida-warning-banner-text">
              <span className="material-symbols-outlined salida-warning-banner-icon">
                error_outline
              </span>
              <span>
                Atención: {partidasExcedidas.length} partida(s) exceden la existencia física en
                almacén (ejemplo:{' '}
                <strong>
                  {partidasExcedidas[0].sku} — {partidasExcedidas[0].surtido} uds solicitadas vs{' '}
                  {partidasExcedidas[0].existencia} disp.
                </strong>
                ). Corrija la cantidad antes de confirmar la salida del kárdex.
              </span>
            </div>
            <button
              type="button"
              className="salida-warning-banner-btn"
              onClick={handleAjustarTodasExcedidas}
            >
              Ajustar a existencia máxima
            </button>
          </div>
        )}
      </section>

      {/* ==========================================================================
          5. BARRA INFERIOR DE ACCIONES (StickyFooterActions)
          ========================================================================== */}
      <footer className="salida-sticky-footer">
        {/* Guardar Borrador & Estado de Autoguardado */}
        <div className="salida-footer-left">
          <button
            type="button"
            className="salida-btn-draft"
            onClick={handleGuardarBorrador}
            title="Guardar estado actual localmente"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              save
            </span>
            Guardar Borrador
          </button>
          <div className="salida-draft-status">
            <span className="salida-draft-dot" />
            <span>{mensajeBorrador}</span>
          </div>
        </div>

        {/* Acciones Principales: Cancelar y Confirmar Salida */}
        <div className="salida-footer-right">
          <button
            type="button"
            className="salida-btn-cancel"
            onClick={() => router.push('/almacen')}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="salida-btn-confirm"
            onClick={() => {
              setSalidaConfirmadaExito(false);
              setModalConfirmacionOpen(true);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              check_circle
            </span>
            Confirmar Salida del Kárdex
          </button>
        </div>
      </footer>

      {/* ==========================================================================
          MODALES DE APOYO Y CONFIRMACIÓN
          ========================================================================== */}

      {/* Modal 1: Solicitud de Material SM-104 */}
      {modalSMOpen && (
        <ModalUniversal
          open={modalSMOpen}
          title={`Solicitud de Material Origen: ${solicitudMaterial}`}
          subtitle="Requisición autorizada por Residencia de Obra Toluca"
          onClose={() => setModalSMOpen(false)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                className="salida-btn-header salida-btn-header-secondary"
                onClick={() => setModalSMOpen(false)}
              >
                Cerrar
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Folio Requisición:</span>
              <strong style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--primary)' }}>
                {solicitudMaterial}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frente de Trabajo:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{proyectoEncabezado}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Solicitante Autorizado:</span>
              <span>{responsableActivo.nombreCompleto}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total de Partidas:</span>
              <strong style={{ fontFamily: 'var(--font-family-label)' }}>4 partidas solicitadas</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado de Aprobación:</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>Aprobado para despacho</span>
            </div>
          </div>
        </ModalUniversal>
      )}

      {/* Modal 2: Evidencia Fotográfica de Entrega */}
      {modalEvidenciaPartidaId && (
        <ModalUniversal
          open={Boolean(modalEvidenciaPartidaId)}
          title="Evidencia Fotográfica de Entrega en Frente"
          subtitle="Adjunto de remisión firmada o captura física del lote"
          onClose={() => setModalEvidenciaPartidaId(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                className="salida-btn-header salida-btn-header-secondary"
                onClick={() => setModalEvidenciaPartidaId(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="salida-btn-header salida-btn-header-primary"
                onClick={() => {
                  setPartidas((prev) =>
                    prev.map((item) =>
                      item.id === modalEvidenciaPartidaId
                        ? { ...item, evidenciaAdjunta: 'FOTO-ENTREGA-OBRA.JPG' }
                        : item
                    )
                  );
                  setModalEvidenciaPartidaId(null);
                }}
              >
                Guardar Evidencia
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)' }}>
              add_a_photo
            </span>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Haga clic para capturar con la cámara del dispositivo móvil de almacén o arrastre la foto del vale firmado físicamente.
            </p>
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '0.75rem',
                padding: '2rem 1rem',
                backgroundColor: 'var(--surface-alt)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-muted)' }}>
                cloud_upload
              </span>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Formatos permitidos: JPG, PNG, PDF (Máx. 10MB)
              </p>
            </div>
          </div>
        </ModalUniversal>
      )}

      {/* Modal 3: Confirmación y Sello de Kárdex */}
      {modalConfirmacionOpen && (
        <ModalUniversal
          open={modalConfirmacionOpen}
          title={
            salidaConfirmadaExito
              ? 'Salida Confirmada y Aplicada al Kárdex'
              : 'Confirmar Salida de Almacén'
          }
          subtitle={`Folio ${folioSalida} • ${proyectoEncabezado}`}
          onClose={() => {
            setModalConfirmacionOpen(false);
            if (salidaConfirmadaExito) router.push('/almacen');
          }}
          footer={
            salidaConfirmadaExito ? (
              <button
                type="button"
                className="salida-btn-header salida-btn-header-primary"
                onClick={() => {
                  setModalConfirmacionOpen(false);
                  router.push('/almacen');
                }}
              >
                Aceptar y Volver al Dashboard
              </button>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  className="salida-btn-header salida-btn-header-secondary"
                  onClick={() => setModalConfirmacionOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="salida-btn-header salida-btn-header-primary"
                  onClick={() => setSalidaConfirmadaExito(true)}
                  disabled={partidasExcedidas.length > 0}
                  title={
                    partidasExcedidas.length > 0
                      ? 'No puede confirmar mientras existan partidas que excedan las existencias'
                      : 'Aplicar descuento de existencias al kárdex'
                  }
                >
                  Confirmar Despacho
                </button>
              </div>
            )
          }
        >
          {salidaConfirmadaExito ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#16A34A' }}>
                verified
              </span>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: 'var(--text-primary)' }}>
                Kárdex Actualizado Exitosamente
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                Se ha generado el vale de salida <strong>{remisionSalida}</strong> con cargo al proyecto{' '}
                <strong>{proyectoEncabezado}</strong>. Se descontaron un total de{' '}
                <strong>{totalSurtido} unidades</strong> de inventario disponible.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.8125rem' }}>
              {partidasExcedidas.length > 0 ? (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#DC2626',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                  }}
                >
                  <strong>No es posible confirmar la salida:</strong> La partida{' '}
                  {partidasExcedidas.map((p) => p.sku).join(', ')} supera la existencia física disponible en el almacén. Ajuste la cantidad surtida antes de proseguir.
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Está a punto de descargar <strong>{totalSurtido} unidades</strong> de inventario en kárdex para ser entregadas a{' '}
                  <strong>{responsableActivo.nombreCompleto}</strong>.
                </p>
              )}

              <div
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Solicitado:</span>
                  <strong style={{ fontFamily: 'var(--font-family-label)' }}>{totalSolicitado} uds</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total a Descontar:</span>
                  <strong style={{ color: '#059669', fontFamily: 'var(--font-family-label)' }}>
                    {totalSurtido} uds
                  </strong>
                </div>
                {totalPendiente > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pendiente por entregar:</span>
                    <strong style={{ color: '#D97706', fontFamily: 'var(--font-family-label)' }}>
                      {totalPendiente} uds (Entrega Parcial)
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Firma del Receptor:</span>
                  <span style={{ color: tieneFirma ? '#059669' : '#DC2626', fontWeight: 600 }}>
                    {tieneFirma ? 'Firma capturada ✓' : 'Pendiente de firma ⚠️'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </ModalUniversal>
      )}
    </div>
  );
}

