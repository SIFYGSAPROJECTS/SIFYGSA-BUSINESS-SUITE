import React, { useState } from 'react';
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

interface ComprasRequisicionProps {
  subItemId?: string;
}

export const ComprasRequisicion: React.FC<ComprasRequisicionProps> = () => {
  // Accordion states
  const [clasificacionOpen, setClasificacionOpen] = useState(true);
  const [infoPrimariaOpen, setInfoPrimariaOpen] = useState(true);

  // Subtab navigation
  const [activeSubtab, setActiveSubtab] = useState<'articulos' | 'relaciones' | 'comunicacion' | 'personalizado' | 'tef' | 'doc_electronico' | 'carta_porte'>('articulos');

  // Form Fields
  const [contractNum, setContractNum] = useState('ADM-INFRA');
  const [purchaseType, setPurchaseType] = useState('RQ - Requisición Operativa');
  const [subsidiary, setSubsidiary] = useState('SIFYGSA');
  const [applicant, setApplicant] = useState('Pablo Vázquez Culebro');
  const [creationDate] = useState('17/09/2026');
  const [buyer, setBuyer] = useState('— Seleccionar Comprador Asignado —');
  const [deliveryDate, setDeliveryDate] = useState('2026-09-21');
  const [deliveryPlace, setDeliveryPlace] = useState('Base de Operaciones Mapachapa / Refinería Tula');
  const [notes, setNotes] = useState('Suministro urgente para instrumentación SIL-3');
  const [priority, setPriority] = useState('Crítica - Paro de Planta');
  const [docStatus, setDocStatus] = useState('A Revisar');

  // Articles Table State
  const [articles, setArticles] = useState<ArticleItem[]>([
    {
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
    },
  ]);

  const [selectedRowId, setSelectedRowId] = useState<string>('art-1');

  // Handle inline changes in quantity & price
  const handleUpdateItem = (id: string, field: 'quantity' | 'unitPrice' | 'articleCode' | 'description', value: any) => {
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
    const newId = `art-${Date.now()}`;
    const newItem: ArticleItem = {
      id: newId,
      articleCode: 'SNSR-CH4-OPT-SIL2',
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
      alert('La requisición debe contener al menos una línea de partida.');
      return;
    }
    setArticles(articles.filter((item) => item.id !== selectedRowId));
    setSelectedRowId(articles[0]?.id || '');
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que deseas vaciar todas las líneas de artículos?')) {
      setArticles([]);
    }
  };

  // Financial calculations
  const subtotal = articles.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
                  Requisición <span className="req-folio-highlight">#SFG-ADM-INFRA-RQ-81/26</span>
                </h1>
                <span className="req-approval-status-tag">
                  APROBACIÓN PENDIENTE
                </span>
              </div>
              <p className="req-meta-sub">
                Creado por: <span className="text-highlight">USUARIO POR CONFIRMAR</span> | Formulario: <span className="text-highlight">SIFYGSA - Requisición</span>
              </p>
            </div>
          </div>

          <div className="req-utility-links">
            <a href="#lista" className="utility-link">Lista</a>
            <span className="utility-sep">|</span>
            <a href="#buscar" className="utility-link">Buscar</a>
            <span className="utility-sep">|</span>
            <a href="#personalizar" className="utility-link">Personalizar</a>
            <span className="utility-sep">|</span>
            <a href="#mas" className="utility-link">Más</a>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="req-action-buttons-row">
          <div className="action-buttons-left">
            <div className="split-btn-group">
              <button
                type="button"
                className="btn-save-primary"
                onClick={() => alert('Requisición guardada exitosamente en SIFYSUITE ERP.')}
              >
                Guardar
              </button>
              <button
                type="button"
                className="btn-save-arrow"
                onClick={() => alert('Opciones de guardado: Guardar y Enviar a VoBo')}
              >
                ▼
              </button>
            </div>

            <button type="button" className="btn-action-neutral">
              Cancelar
            </button>
            <button
              type="button"
              className="btn-action-neutral"
              onClick={() => alert('Auto completando centros de costos y almacén predeterminado...')}
            >
              Auto completar
            </button>
            <button type="button" className="btn-action-disabled" disabled>
              Para Revisión
            </button>
            <button type="button" className="btn-action-neutral">
              Acciones <span style={{ fontSize: '9px' }}>▼</span>
            </button>
          </div>

          <div className="req-required-hint">
            * Campos obligatorios requeridos por Sistema SIFYSUITE / PEMEX
          </div>
        </div>
      </div>

      {/* Grid: Clasificación (9 cols) + Resumen Financiero (3 cols) */}
      <div className="req-middle-grid">
        {/* Panel Clasificación */}
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
                    <option value="PEMEX-PEP-4420-S">PEMEX-PEP-4420-S</option>
                    <option value="SIFYGSA-REF-TULA-08">SIFYGSA-REF-TULA-08</option>
                    <option value="CORP-MTTO-2026">CORP-MTTO-2026</option>
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

              {/* Columna 2 */}
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Código de requisición</label>
                  <input
                    className="sify-input font-mono font-bold text-brand-orange"
                    readOnly
                    type="text"
                    value="SFG-ADM-INFRA-RQ-81/26"
                  />
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Requisición Nº</label>
                  <input
                    className="sify-input font-mono font-bold text-white bg-darker"
                    type="text"
                    defaultValue="SFG-ADM-INFRA-RQ-81/26"
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
              </div>

              {/* Columna 3 */}
              <div className="field-column">
                <div className="form-group-compact">
                  <label className="sify-label">Próximo aprobador</label>
                  <div className="readonly-link-box">
                    <a href="#aprobador" className="link-aprobador">
                      USUARIO POR CONFIRMAR
                    </a>
                  </div>
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Estado de aprobación</label>
                  <div className="status-badge-compact amber">
                    Aprobación pendiente
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
                    readOnly
                    type="text"
                    value="02 - Mantenimiento e Infraestructura"
                  />
                </div>
                <div className="form-group-compact">
                  <label className="sify-label">Ubicación Almacén</label>
                  <input
                    className="sify-input text-smaller"
                    readOnly
                    type="text"
                    value="ALM-CENTRAL-MAPACHAPA"
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
                <select
                  className="sify-select font-medium"
                  value={applicant}
                  onChange={(e) => setApplicant(e.target.value)}
                >
                  <option value="Pablo Vázquez Culebro">Pablo Vázquez Culebro</option>
                  <option value="Emmanuel Mendoza Ramírez">Emmanuel Mendoza Ramírez</option>
                  <option value="Ing. Residente Pemex Minatitlán">Ing. Residente Pemex Minatitlán</option>
                </select>
              </div>
              <div className="form-group-compact">
                <label className="sify-label">Fecha de elaboración <span className="req">*</span></label>
                <input className="sify-input font-mono" type="text" value={creationDate} readOnly />
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

      {/* NetSuite Subtabs & Articles Table */}
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

        {/* Sub-bar: Subtotal Items / Expenses / Clear all lines */}
        <div className="articles-sub-bar">
          <div className="articles-sub-bar-left">
            <span className="badge-items-count">
              Artículos <span className="text-orange">${formatCurrency(subtotal)}</span>
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
                    <td className="text-right text-emerald font-mono font-semibold">
                      {item.available.toFixed(2)}
                    </td>
                    <td className="text-right text-emerald font-mono font-semibold">
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
                    <td className="text-right font-mono font-bold text-orange">
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
                    <td className="text-center font-mono text-emerald font-bold">
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
      </section>

      {/* NetSuite Footer Action Bar with Folio */}
      <div className="req-footer-actions-card">
        <div className="action-buttons-left">
          <div className="split-btn-group">
            <button
              type="button"
              className="btn-save-primary"
              onClick={() => alert('Requisición guardada exitosamente en SIFYSUITE ERP.')}
            >
              Guardar
            </button>
            <button
              type="button"
              className="btn-save-arrow"
              onClick={() => alert('Opciones de guardado')}
            >
              ▼
            </button>
          </div>
          <button type="button" className="btn-action-neutral">
            Cancelar
          </button>
          <button type="button" className="btn-action-neutral">
            Auto completar
          </button>
          <button type="button" className="btn-action-disabled" disabled>
            Para Revisión
          </button>
          <button type="button" className="btn-action-neutral">
            Acciones <span style={{ fontSize: '9px' }}>▼</span>
          </button>
        </div>

        <div className="req-footer-folio-block">
          <span className="folio-label">Folio de Transacción:</span>
          <span className="folio-value font-mono">SFG-ADM-INFRA-RQ-81/26</span>
        </div>
      </div>
    </div>
  );
};
