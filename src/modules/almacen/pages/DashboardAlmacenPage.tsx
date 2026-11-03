'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AlmacenModal from '../components/ui/AlmacenModal';
import { MOCK_ARTICULOS } from '../data/mock-data';

// Interfaz para los artículos mostrados en el dashboard de inventario (Stitch Screens 1 & 2)
export interface ArticuloDashboardItem {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  icono: string;
  iconoColorLight: string;
  iconoColorDark: string;
  categoria: string;
  categoriaId: string;
  total: number;
  disponible: number;
  enProyecto: number;
  tallerCalib: number;
  ubicacion: string;
  almacenId: string;
  estado: 'Disponible' | 'Stock Bajo';
  estadoId: 'disponible' | 'stock-bajo';
}

// Retrocompatibilidad para tests o módulos que importen MovimientoDashboardItem
export interface MovimientoDashboardItem {
  id: string;
  folio: string;
  nombre: string;
  especificacion: string;
  icono: string;
  tipoMov: string;
  tipoMovIcono: string;
  tipoMovClass: 'entrada' | 'salida' | 'mantenimiento' | 'devolucion';
  stockAlmacen: string;
  stockAlmacenHighlight?: boolean;
  enProyecto: string;
  enMantenimiento: string;
  enMantenimientoHighlight?: boolean;
  oficina: string;
  estado: string;
  estadoClass: 'completado' | 'transito' | 'inspeccion' | 'retraso';
  estadoPulse?: boolean;
  estadoIcono?: string;
  almacenId: string;
  categoriaId: string;
  estadoId: string;
  ubicacionId: string;
  responsable: string;
  referenciaDoc: string;
}

// 8 Artículos de Inventario oficiales de Stitch (Tokens Oficiales & Modo Oscuro Final)
export const ARTICULOS_DASHBOARD_STITCH: ArticuloDashboardItem[] = [
  {
    id: 'art-1',
    sku: 'DET-UVIR-FLAME-01',
    nombre: 'Detector Óptico de Flama UV/IR Industrial',
    descripcion: 'Detector de llama ultravioleta/infrarrojo a prueba de explosión clase 1 div ...',
    icono: 'local_fire_department',
    iconoColorLight: '#D97706',
    iconoColorDark: '#60A5FA',
    categoria: 'Equipos de Medición',
    categoriaId: 'medicion',
    total: 18,
    disponible: 3,
    enProyecto: 12,
    tallerCalib: 3,
    ubicacion: 'Rack A-02, Nivel 1',
    almacenId: 'nave-a',
    estado: 'Stock Bajo',
    estadoId: 'stock-bajo',
  },
  {
    id: 'art-2',
    sku: 'GAS-CAL-CH4-50',
    nombre: 'Cilindro Gas Patrón Metano CH4 50% LEL (34L)',
    descripcion: 'Cilindro de gas de calibración no recargable con mezcla certificada para de...',
    icono: 'propane_tank',
    iconoColorLight: '#1D4ED8',
    iconoColorDark: '#34D399',
    categoria: 'Consumibles',
    categoriaId: 'consumibles',
    total: 45,
    disponible: 28,
    enProyecto: 17,
    tallerCalib: 0,
    ubicacion: 'Gabinete Criogénico G-1',
    almacenId: 'nave-b',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
  {
    id: 'art-3',
    sku: 'FLUKE-87V-IND',
    nombre: 'Multímetro Industrial TRMS de Alta Precisión',
    descripcion: 'Multímetro digital con termómetro integrado para verificación de lazos 4-20...',
    icono: 'electric_meter',
    iconoColorLight: '#F59E0B',
    iconoColorDark: '#FBBF24',
    categoria: 'Equipos de Medición',
    categoriaId: 'medicion',
    total: 14,
    disponible: 6,
    enProyecto: 6,
    tallerCalib: 2,
    ubicacion: 'Armario Herramientas H-04',
    almacenId: 'nave-a',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
  {
    id: 'art-4',
    sku: 'VALV-SOL-CO2-01',
    nombre: 'Válvula Solenoide de Descarga de CO2 Alta Presión',
    descripcion: 'Válvula solenoide de disparo rápido 24VDC a prueba de fuego para sistema...',
    icono: 'valve',
    iconoColorLight: '#2563EB',
    iconoColorDark: '#22D3EE',
    categoria: 'Consumibles',
    categoriaId: 'consumibles',
    total: 32,
    disponible: 22,
    enProyecto: 10,
    tallerCalib: 0,
    ubicacion: 'Rack B-01, Nivel 3',
    almacenId: 'nave-b',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
  {
    id: 'art-5',
    sku: 'HARN-PETZL-AVAO',
    nombre: 'Arnés Anticaídas y de Posicionamiento Dieléctrico',
    descripcion: 'Arnés de seguridad industrial con puntos de anclaje de rescate y hebillas ai...',
    icono: 'safety_check',
    iconoColorLight: '#EF4444',
    iconoColorDark: '#FB7185',
    categoria: 'EPP',
    categoriaId: 'epp',
    total: 25,
    disponible: 11,
    enProyecto: 14,
    tallerCalib: 0,
    ubicacion: 'Zona EPP Estante 3',
    almacenId: 'nave-a',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
  {
    id: 'art-6',
    sku: 'TORQ-SNAP-ON-12',
    nombre: 'Torquímetro de Click 1/2" Micrométrico Calibrado',
    descripcion: 'Llave dinamométrica de 30-250 ft-lb para ensamble de bridas RF y tubería ...',
    icono: 'build',
    iconoColorLight: '#1D4ED8',
    iconoColorDark: '#FBBF24',
    categoria: 'Herramientas',
    categoriaId: 'herramientas',
    total: 8,
    disponible: 2,
    enProyecto: 4,
    tallerCalib: 2,
    ubicacion: 'Caja Fuerte de Herramientas C-1',
    almacenId: 'nave-a',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
  {
    id: 'art-7',
    sku: 'FZA-RESP-CIVIL-01',
    nombre: 'Fianza de Responsabilidad Civil Contrato PEMEX',
    descripcion: 'Póliza de fianza de responsabilidad civil por un monto de $8,000,000.00 MX...',
    icono: 'verified',
    iconoColorLight: '#4F46E5',
    iconoColorDark: '#818CF8',
    categoria: 'Mobiliario y Activos',
    categoriaId: 'mobiliario',
    total: 1,
    disponible: 1,
    enProyecto: 0,
    tallerCalib: 0,
    ubicacion: 'Archivo Fiscal Bóveda A',
    almacenId: 'nave-a',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
  {
    id: 'art-8',
    sku: 'TUB-CONDUIT-ALUM-1',
    nombre: 'Tubo Conduit Aluminio Cédula 40 Roscado 1"',
    descripcion: 'Tubería rígida de aluminio libre de cobre para canalización en ambientes m...',
    icono: 'view_column',
    iconoColorLight: '#64748B',
    iconoColorDark: '#67E8F9',
    categoria: 'Consumibles',
    categoriaId: 'consumibles',
    total: 120,
    disponible: 40,
    enProyecto: 80,
    tallerCalib: 0,
    ubicacion: 'Patio Exterior Rack Tubos 1',
    almacenId: 'patio',
    estado: 'Disponible',
    estadoId: 'disponible',
  },
];

export default function DashboardAlmacenPage() {
  const router = useRouter();

  // Estados de Filtros
  const [almacenFiltro, setAlmacenFiltro] = useState('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [searchTable, setSearchTable] = useState('');

  // Modales
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloDashboardItem | null>(null);
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);
  const [modalAuditoriaOpen, setModalAuditoriaOpen] = useState(false);

  // Formulario de salida rápida
  const [salidaSku, setSalidaSku] = useState(ARTICULOS_DASHBOARD_STITCH[0]?.sku || '');
  const [salidaCantidad, setSalidaCantidad] = useState(1);
  const [salidaFrente, setSalidaFrente] = useState('PEMEX Refinería Dos Bocas');
  const [salidaResponsable, setSalidaResponsable] = useState('Roberto Velázquez');
  const [salidaExito, setSalidaExito] = useState(false);

  // Verificación de filtros activos
  const hayFiltrosActivos =
    almacenFiltro !== 'todos' ||
    categoriaFiltro !== 'todas' ||
    estadoFiltro !== 'todos' ||
    searchTable.trim() !== '';

  const limpiarFiltros = () => {
    setAlmacenFiltro('todos');
    setCategoriaFiltro('todas');
    setEstadoFiltro('todos');
    setSearchTable('');
  };

  // Filtrado reactivo de artículos
  const articulosFiltrados = useMemo(() => {
    return ARTICULOS_DASHBOARD_STITCH.filter((art) => {
      const matchAlmacen = almacenFiltro === 'todos' || art.almacenId === almacenFiltro;
      const matchCategoria = categoriaFiltro === 'todas' || art.categoriaId === categoriaFiltro;
      const matchEstado = estadoFiltro === 'todos' || art.estadoId === estadoFiltro;
      const term = searchTable.toLowerCase().trim();
      const matchSearch =
        !term ||
        art.sku.toLowerCase().includes(term) ||
        art.nombre.toLowerCase().includes(term) ||
        art.descripcion.toLowerCase().includes(term) ||
        art.ubicacion.toLowerCase().includes(term) ||
        art.categoria.toLowerCase().includes(term);

      return matchAlmacen && matchCategoria && matchEstado && matchSearch;
    });
  }, [almacenFiltro, categoriaFiltro, estadoFiltro, searchTable]);

  // Exportar CSV oficial
  const handleExportCSV = () => {
    const headers =
      'SKU,Descripcion,Categoria,Total,Disponible,En_Proyecto,Taller_Calibracion,Ubicacion,Estado\n';
    const rows = articulosFiltrados
      .map(
        (art) =>
          `"${art.sku}","${art.nombre}","${art.categoria}",${art.total},${art.disponible},${art.enProyecto},${art.tallerCalib},"${art.ubicacion}","${art.estado}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Inventario_Almacen_SIFYGSA_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-almacen-container">
      {/* 1. ENCABEZADO DE PÁGINA Y ACCIONES RÁPIDAS */}
      <div className="dashboard-almacen-header">
        <div className="dashboard-almacen-title-group">
          <h1 className="dashboard-almacen-title">Almacén</h1>
          <nav aria-label="Breadcrumb" className="dashboard-almacen-breadcrumb">
            <span className="dashboard-almacen-breadcrumb-link">SGA Almacén</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              chevron_right
            </span>
            <span className="dashboard-almacen-breadcrumb-current">Panel General de Almacén</span>
          </nav>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="dashboard-almacen-actions">
          <button
            type="button"
            className="dashboard-btn-action dashboard-btn-secondary"
            onClick={() => router.push('/almacen/recepcion-ir03')}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#10B981' }}
            >
              move_to_inbox
            </span>
            <span>Registrar Entrada</span>
          </button>

          <button
            type="button"
            className="dashboard-btn-action dashboard-btn-secondary"
            onClick={() => router.push('/almacen/salida')}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#3B82F6' }}
            >
              outbox
            </span>
            <span>Registrar Salida</span>
          </button>

          <button
            type="button"
            className="dashboard-btn-action dashboard-btn-primary"
            onClick={() => router.push('/almacen/alta-articulo')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              add_box
            </span>
            <span>+ Alta de Artículo</span>
          </button>

          <button
            type="button"
            className="dashboard-btn-action dashboard-btn-secondary"
            onClick={() => setModalAuditoriaOpen(true)}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#818CF8' }}
            >
              assignment_return
            </span>
            <span>Auditoría de Devoluciones</span>
          </button>
        </div>
      </div>

      {/* 2. 4 TARJETAS KPI OFICIALES */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Total Artículos */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">Total Artículos</span>
            <div className="dashboard-kpi-icon-box blue">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                inventory_2
              </span>
            </div>
          </div>
          <div className="dashboard-kpi-value-block">
            <div className="dashboard-kpi-value">1,482</div>
            <p className="dashboard-kpi-subtitle">Catálogo unificado</p>
          </div>
          <div className="dashboard-kpi-footer">
            <span className="dashboard-kpi-pill blue">
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                add
              </span>
              12 este mes
            </span>
            <span className="dashboard-kpi-meta">98.2% Activos</span>
          </div>
        </div>

        {/* KPI 2: Existencias Totales */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">Existencias Totales</span>
            <div className="dashboard-kpi-icon-box emerald">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                warehouse
              </span>
            </div>
          </div>
          <div className="dashboard-kpi-value-block">
            <div className="dashboard-kpi-value">
              24,930 <span className="dashboard-kpi-unit">uds</span>
            </div>
            <p className="dashboard-kpi-subtitle">Distribución física</p>
          </div>
          <div className="dashboard-kpi-footer">
            <span className="dashboard-kpi-pill neutral">4 Naves Activas</span>
            <span className="dashboard-kpi-meta emerald-meta">99.4% Conciliado</span>
          </div>
        </div>

        {/* KPI 3: En Mantenimiento */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">En Mantenimiento</span>
            <div className="dashboard-kpi-icon-box amber">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                build
              </span>
            </div>
          </div>
          <div className="dashboard-kpi-value-block">
            <div className="dashboard-kpi-value">
              7 <span className="dashboard-kpi-unit">equipos</span>
            </div>
            <p className="dashboard-kpi-subtitle">Calibración &amp; Taller</p>
          </div>
          <div className="dashboard-kpi-footer">
            <span className="dashboard-kpi-pill amber">2 en Taller Externo</span>
            <span className="dashboard-kpi-meta">5 Preventivo</span>
          </div>
        </div>

        {/* KPI 4: Stock Bajo / Alertas */}
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span className="dashboard-kpi-label">Stock Bajo / Alertas</span>
            <div className="dashboard-kpi-icon-box red">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                priority_high
              </span>
            </div>
          </div>
          <div className="dashboard-kpi-value-block">
            <div className="dashboard-kpi-value alert-red">
              9 <span className="dashboard-kpi-unit alert-red">ítems</span>
            </div>
            <p className="dashboard-kpi-subtitle">Bajo umbral mínimo</p>
          </div>
          <div className="dashboard-kpi-footer">
            <span className="dashboard-kpi-pill red">3 Críticos • 6 Medios</span>
            <span className="dashboard-kpi-meta red-meta">Reponer Hoy</span>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN PRINCIPAL: FILTROS INTERACTIVOS Y TABLA DE INVENTARIO */}
      <div className="dashboard-main-card">
        {/* BLOQUE SUPERIOR DE FILTROS */}
        <div className="dashboard-filter-box">
          <div className="dashboard-filter-header">
            <div className="dashboard-filter-header-left">
              <span
                className="material-symbols-outlined dashboard-filter-header-icon"
                style={{ fontSize: '20px' }}
              >
                tune
              </span>
              <span className="dashboard-filter-title">
                FILTROS DE INVENTARIO Y FLUJO DE ALMACÉN
              </span>
              {hayFiltrosActivos && (
                <span className="dashboard-filter-active-badge">Filtrado activo</span>
              )}
            </div>

            <button
              id="btn-limpiar-filtros"
              type="button"
              className="dashboard-btn-clear"
              onClick={limpiarFiltros}
              title="Restablecer todos los filtros"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                cleaning_services
              </span>
              <span>Limpiar Filtros</span>
            </button>
          </div>

          {/* 3 SELECTORES PRINCIPALES */}
          <div className="dashboard-filter-grid">
            {/* Filtro 1: Almacén / Nave */}
            <div className="dashboard-filter-field">
              <label htmlFor="filtro-almacen" className="dashboard-filter-label">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  warehouse
                </span>
                ALMACÉN / NAVE
              </label>
              <div className="dashboard-select-wrapper">
                <select
                  id="filtro-almacen"
                  className="dashboard-select"
                  value={almacenFiltro}
                  onChange={(e) => setAlmacenFiltro(e.target.value)}
                >
                  <option value="todos">Todos los almacenes</option>
                  <option value="nave-a">Nave A - Almacén Central</option>
                  <option value="nave-b">Nave B - Químicos &amp; Resguardo</option>
                  <option value="patio">Patio Exterior</option>
                </select>
                <span className="material-symbols-outlined dashboard-select-arrow">expand_more</span>
              </div>
            </div>

            {/* Filtro 2: Categoría de Insumo */}
            <div className="dashboard-filter-field">
              <label htmlFor="filtro-categoria" className="dashboard-filter-label">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  account_tree
                </span>
                CATEGORÍA DE INSUMO
              </label>
              <div className="dashboard-select-wrapper">
                <select
                  id="filtro-categoria"
                  className="dashboard-select"
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="todas">Todas las categorías</option>
                  <option value="medicion">Equipos de Medición</option>
                  <option value="consumibles">Consumibles</option>
                  <option value="epp">EPP</option>
                  <option value="herramientas">Herramientas</option>
                  <option value="mobiliario">Mobiliario y Activos</option>
                </select>
                <span className="material-symbols-outlined dashboard-select-arrow">expand_more</span>
              </div>
            </div>

            {/* Filtro 3: Estado Operativo */}
            <div className="dashboard-filter-field">
              <label htmlFor="filtro-estado" className="dashboard-filter-label">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  check_circle
                </span>
                ESTADO OPERATIVO
              </label>
              <div className="dashboard-select-wrapper">
                <select
                  id="filtro-estado"
                  className="dashboard-select"
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="disponible">Disponible</option>
                  <option value="stock-bajo">Stock Bajo</option>
                </select>
                <span className="material-symbols-outlined dashboard-select-arrow">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA INTERMEDIA DE BÚSQUEDA Y EXPORTACIÓN */}
        <div className="dashboard-mid-bar">
          <div className="dashboard-search-container">
            <span className="material-symbols-outlined dashboard-search-icon">search</span>
            <input
              id="search-table-input"
              className="dashboard-search-input"
              placeholder="Filtrar por código, descripción o ubicación..."
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
            />
          </div>

          <div className="dashboard-mid-bar-right">
            <span className="dashboard-table-counter">
              Mostrando <strong>{articulosFiltrados.length}</strong> artículos
            </span>
            <button
              type="button"
              className="dashboard-btn-export"
              onClick={handleExportCSV}
              title="Descargar informe de inventario en CSV"
            >
              <span className="material-symbols-outlined dashboard-export-icon">download</span>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* TABLA PRINCIPAL DE INVENTARIO CON LAS 11 COLUMNAS EXACTAS */}
        {articulosFiltrados.length === 0 ? (
          <div className="dashboard-no-results">
            <span className="material-symbols-outlined dashboard-no-results-icon">search_off</span>
            <p className="dashboard-no-results-title">
              No se encontraron artículos con los filtros seleccionados
            </p>
            <p className="dashboard-no-results-desc">
              Intenta ajustar los criterios de búsqueda o haz clic en Limpiar Filtros para ver todos
              los artículos del almacén.
            </p>
            <button
              type="button"
              className="dashboard-btn-clear"
              onClick={limpiarFiltros}
              style={{ marginTop: '0.5rem' }}
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="th-miniatura">MINIATURA</th>
                  <th className="th-sku">CÓDIGO SKU</th>
                  <th className="th-desc">DESCRIPCIÓN / FICHA TÉCNICA</th>
                  <th className="th-cat">CATEGORÍA</th>
                  <th className="th-num">TOTAL</th>
                  <th className="th-num th-disp">DISPONIBLE</th>
                  <th className="th-num">EN PROYECTO</th>
                  <th className="th-num">TALLER / CALIB.</th>
                  <th className="th-ubicacion">UBICACIÓN EN NAVE</th>
                  <th className="th-estado">ESTADO</th>
                  <th className="th-acciones">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {articulosFiltrados.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={item.id}
                      className={isEven ? 'dashboard-row-even' : 'dashboard-row-odd'}
                    >
                      {/* Miniatura */}
                      <td className="td-miniatura">
                        <div className="td-thumb-box">
                          <span
                            className="material-symbols-outlined td-thumb-icon"
                            data-icon-id={item.id}
                          >
                            {item.icono}
                          </span>
                        </div>
                      </td>

                      {/* Código SKU */}
                      <td className="td-sku">{item.sku}</td>

                      {/* Descripción / Ficha Técnica */}
                      <td className="td-desc">
                        <div className="td-desc-box">
                          <span className="td-desc-title">{item.nombre}</span>
                          <span className="td-desc-subtitle" title={item.descripcion}>
                            {item.descripcion}
                          </span>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="td-cat">
                        <span className="badge-categoria">{item.categoria}</span>
                      </td>

                      {/* Total */}
                      <td className="td-num td-total">{item.total}</td>

                      {/* Disponible */}
                      <td className="td-num td-disponible">{item.disponible}</td>

                      {/* En Proyecto */}
                      <td className="td-num td-proyecto">{item.enProyecto}</td>

                      {/* Taller / Calib. */}
                      <td
                        className={`td-num td-taller ${item.tallerCalib > 0 ? 'highlight-taller' : 'zero-taller'}`}
                      >
                        {item.tallerCalib}
                      </td>

                      {/* Ubicación en Nave */}
                      <td className="td-ubicacion">{item.ubicacion}</td>

                      {/* Estado */}
                      <td className="td-estado">
                        <span
                          className={`badge-estado ${item.estadoId === 'stock-bajo' ? 'badge-stock-bajo' : 'badge-disponible'}`}
                        >
                          {item.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="td-acciones">
                        <button
                          type="button"
                          className="btn-detalle"
                          onClick={() => setSelectedArticulo(item)}
                          title={`Ver detalle de ${item.sku}`}
                        >
                          Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: FICHA TÉCNICA Y AUDITORÍA DE ARTÍCULO */}
      {selectedArticulo && (
        <AlmacenModal
          open={Boolean(selectedArticulo)}
          title={`Ficha de Inventario: ${selectedArticulo.sku}`}
          subtitle={`${selectedArticulo.nombre} • ${selectedArticulo.categoria}`}
          onClose={() => setSelectedArticulo(null)}
          footer={
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                width: '100%',
              }}
            >
              <button
                type="button"
                className="dashboard-btn-action dashboard-btn-secondary"
                onClick={() => setSelectedArticulo(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="dashboard-btn-action dashboard-btn-primary"
                onClick={() => {
                  setSelectedArticulo(null);
                  router.push('/almacen/alta-articulo');
                }}
              >
                Ver en Catálogo Maestro
              </button>
            </div>
          }
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              fontSize: '0.8125rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Código SKU:</span>
              <strong style={{ fontFamily: 'var(--font-family-label)', color: 'var(--text-primary)' }}>
                {selectedArticulo.sku}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Descripción Técnica:</span>
              <span
                style={{
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                  maxWidth: '60%',
                }}
              >
                {selectedArticulo.descripcion}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Categoría de Insumo:</span>
              <span className="badge-categoria">{selectedArticulo.categoria}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Existencias Totales en Sistema:</span>
              <strong style={{ fontFamily: 'var(--font-family-label)', color: 'var(--text-primary)' }}>
                {selectedArticulo.total} unidades
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Disponibles para Despacho:</span>
              <strong
                style={{
                  fontFamily: 'var(--font-family-label)',
                  color: '#059669',
                }}
              >
                {selectedArticulo.disponible} unidades
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Asignados en Frente / Proyecto:</span>
              <span style={{ fontFamily: 'var(--font-family-label)' }}>
                {selectedArticulo.enProyecto} unidades
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>En Taller / Calibración NOM:</span>
              <span
                style={{
                  fontFamily: 'var(--font-family-label)',
                  fontWeight: selectedArticulo.tallerCalib > 0 ? 700 : 400,
                  color: selectedArticulo.tallerCalib > 0 ? '#D97706' : 'var(--text-muted)',
                }}
              >
                {selectedArticulo.tallerCalib} equipos
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--divider)',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Ubicación en Nave:</span>
              <span style={{ fontFamily: 'var(--font-family-label)', fontWeight: 600 }}>
                {selectedArticulo.ubicacion}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado Operativo:</span>
              <span
                className={`badge-estado ${selectedArticulo.estadoId === 'stock-bajo' ? 'badge-stock-bajo' : 'badge-disponible'}`}
              >
                {selectedArticulo.estado}
              </span>
            </div>
          </div>
        </AlmacenModal>
      )}

      {/* MODAL: REGISTRAR SALIDA A FRENTE DE TRABAJO */}
      {modalSalidaOpen && (
        <AlmacenModal
          open={modalSalidaOpen}
          title="Registrar Salida de Almacén a Frente de Trabajo"
          subtitle="Despacho con control de kárdex y vale de resguardo"
          onClose={() => setModalSalidaOpen(false)}
          footer={
            salidaExito ? (
              <button
                type="button"
                className="dashboard-btn-action dashboard-btn-primary"
                onClick={() => setModalSalidaOpen(false)}
              >
                Aceptar y Cerrar
              </button>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="dashboard-btn-action dashboard-btn-secondary"
                  onClick={() => setModalSalidaOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="dashboard-btn-action dashboard-btn-primary"
                  onClick={() => setSalidaExito(true)}
                >
                  Confirmar Salida
                </button>
              </div>
            )
          }
        >
          {salidaExito ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '48px', color: '#16A34A' }}
              >
                verified
              </span>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0' }}>Salida Registrada Exitosamente</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Folio generado: <strong>SAL-2024-0413</strong>. Se ha descontado del stock disponible
                y se ha asignado al frente <strong>{salidaFrente}</strong>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Artículo a Despachar:
                </label>
                <select
                  className="dashboard-select"
                  value={salidaSku}
                  onChange={(e) => setSalidaSku(e.target.value)}
                  style={{ marginTop: '0.25rem' }}
                >
                  {ARTICULOS_DASHBOARD_STITCH.map((art) => (
                    <option key={art.id} value={art.sku}>
                      {art.sku} — {art.nombre} (Disponibles: {art.disponible})
                    </option>
                  ))}
                  {MOCK_ARTICULOS.map((art) => (
                    <option key={art.id} value={art.sku}>
                      {art.sku} — {art.nombre} (Disponibles: {art.stockDisponible})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Cantidad a Entregar:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="dashboard-select"
                    value={salidaCantidad}
                    onChange={(e) => setSalidaCantidad(Number(e.target.value))}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Responsable del Despacho:
                  </label>
                  <input
                    type="text"
                    className="dashboard-select"
                    value={salidaResponsable}
                    onChange={(e) => setSalidaResponsable(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Frente de Trabajo / Proyecto Destino:
                </label>
                <select
                  className="dashboard-select"
                  value={salidaFrente}
                  onChange={(e) => setSalidaFrente(e.target.value)}
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="PEMEX Refinería Dos Bocas">
                    PEMEX Refinería Dos Bocas (Olmeca)
                  </option>
                  <option value="Plataforma Marina Akal-C (Campeche)">
                    Plataforma Marina Akal-C (Sonda de Campeche)
                  </option>
                  <option value="CFE Central Ciclo Combinado Tuxpan">
                    CFE Central Ciclo Combinado Tuxpan
                  </option>
                  <option value="Terminal Marítima Pajaritos">
                    Terminal Marítima Pajaritos (Minatitlán)
                  </option>
                </select>
              </div>
            </div>
          )}
        </AlmacenModal>
      )}

      {/* MODAL: AUDITORÍA DE DEVOLUCIONES */}
      {modalAuditoriaOpen && (
        <AlmacenModal
          open={modalAuditoriaOpen}
          title="Auditoría de Devoluciones & Retorno de Herramientas"
          subtitle="Inspección física y verificación de calibración NOM"
          onClose={() => setModalAuditoriaOpen(false)}
          footer={
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                width: '100%',
              }}
            >
              <button
                type="button"
                className="dashboard-btn-action dashboard-btn-secondary"
                onClick={() => setModalAuditoriaOpen(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="dashboard-btn-action dashboard-btn-primary"
                onClick={() => {
                  setModalAuditoriaOpen(false);
                  router.push('/almacen/asignaciones');
                }}
              >
                Ver Módulo Préstamos &amp; Devoluciones
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              Listado de herramientas sujetas a retorno para reingreso a inventario disponible tras
              servicio en frente:
            </p>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <strong>Multímetro Fluke 87V (SN: FLK-89210)</strong>
                <span
                  style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#d97706',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontWeight: 600,
                  }}
                >
                  Requiere Calibración
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Devuelto de CFE Tuxpan. Cumplió 12 meses de operación; enviar a laboratorio
                acreditado ISO 17025.
              </p>
            </div>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <strong>{'Torquímetro Snap-on 1/2" (SN: SNP-44120)'}</strong>
                <span
                  style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontWeight: 600,
                  }}
                >
                  Conforme / Apto
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Devuelto de PEMEX Refinería Olmeca. Inspección física superada sin daño en mecanismo
                de trinquete.
              </p>
            </div>
          </div>
        </AlmacenModal>
      )}
    </div>
  );
}

