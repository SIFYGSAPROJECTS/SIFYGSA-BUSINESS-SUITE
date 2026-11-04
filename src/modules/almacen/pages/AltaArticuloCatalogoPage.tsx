'use client';
import { useState, useRef, useEffect } from 'react';
import type { FormEvent, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlmacenModal as ModalUniversal } from '../components/ui/AlmacenModal';
// Estilos en almacen.css

// 4 Categorías oficiales del Sistema de Almacén SIFYGSA
interface CategoriaItem {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  tag: string;
  tagColor?: string;
}

const CATEGORIAS: CategoriaItem[] = [
  {
    id: '1',
    nombre: '1. Material consumible',
    icono: 'cable',
    descripcion: 'Cables, conectores, tornillería y material fungible de instalación.',
    tag: 'Consumo Directo',
  },
  {
    id: '2',
    nombre: '2. Herramienta retornable',
    icono: 'handyman',
    descripcion: 'Ponchadoras, taladros y herramientas sujetas a devolución.',
    tag: 'Préstamo',
  },
  {
    id: '3',
    nombre: '3. Equipo de medición',
    icono: 'speed',
    descripcion: 'Multímetros, calibradores de lazo, certificadores de fibra y cable.',
    tag: 'Calibración',
    tagColor: 'amber',
  },
  {
    id: '4',
    nombre: '4. Activo fijo y mobiliario',
    icono: 'domain',
    descripcion: 'Racks maestros, mobiliario de laboratorio y equipo permanente.',
    tag: 'Activo',
  },
];

const OPCIONES_CONTROL_OPERATIVO = [
  'Estándar: Serie individual habilitada (Sin calibración / mant.)',
  'Con Calibración Periódica Obligatoria',
  'Lote Único / Sin Serie Individual',
  'Control por Rollo / Bobina con Metraje Continuo',
];

const UNIDADES_BASE = ['Metro', 'Ft', 'Pieza', 'Bobina', 'Kilogramo', 'Litro'];
const UNIDADES_COMPRA = ['Ft', 'Metro', 'Bobina 1000ft', 'Carrete', 'Caja', 'Pieza'];
const UNIDADES_VENTAS = ['Ft', 'Metro', 'Pieza', 'Tramo', 'Bobina'];

const CLAVES_SAT = [
  '26121600 - Cables eléctricos y accesorios',
  '26121500 - Alambres y cables eléctricos',
  '39121400 - Dispositivos de conexión y terminación',
  '32151705 - Cable coaxial y de telecomunicaciones',
  '46181500 - Dispositivos de detección y seguridad',
];

const SUBSIDIARIAS = [
  'SIFYGSA',
  'SIFYGSA - División Telecomunicaciones',
  'SIFYGSA - Sede Monterrey',
  'SIFYGSA - Proyectos Especiales',
];

const DEPARTAMENTOS = [
  'Telecomunicaciones & Redes',
  'Operaciones & Mantenimiento Eléctrico',
  'Instrumentación y Automatización',
  'Sistemas Contra Incendio y Gas',
];

const DEFAULT_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAKOmFCH7yGPnO9_ago6uXcfe_fK4LrgmkOSV2dpASJawD726bcWghlyqEaxDtX2PMaHSHMDoI74CoaMuoLzeEP6-lifnHDvYd6PkCYJoSpE7sqsP7OqpwbOQq5HRSJZAvHfKK3Wf0Ma5MRrFOATdqBcdleypSb3F3eOJcBiHipMDK2ejVrmlCNsyMRSHCk3aDL3DHbU4Xv5F4-LhB07BWN_FR7KvlJM5wX7T6DiNxWWdSUjBDoB02oaT5etMGX5cVcSA';

export default function AltaArticuloCatalogoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Estados Sección 1: Información Primaria, Tipo de Artículo & Unidades
  const [codigoArticulo, setCodigoArticulo] = useState('9367');
  const [nombreArticulo, setNombreArticulo] = useState('Cable Belden 9367 Instrumentación');
  const [descArticulo, setDescArticulo] = useState(
    'Cable multiconductor para instrumentos, Modelo: 9367, Marca: Belden',
  );
  const [tipoSeleccionado, setTipoSeleccionado] = useState<CategoriaItem>(CATEGORIAS[0]);
  const [comboboxAbierto, setComboboxAbierto] = useState(false);
  const [marcaFabricante, setMarcaFabricante] = useState('Belden');
  const [controlOperativo, setControlOperativo] = useState(OPCIONES_CONTROL_OPERATIVO[0]);
  const [unidadBase, setUnidadBase] = useState('Metro');
  const [unidadCompra, setUnidadCompra] = useState('Ft');
  const [unidadVentas, setUnidadVentas] = useState('Ft');
  const [claveSat, setClaveSat] = useState(CLAVES_SAT[0]);

  // Estados Sección 2: Clasificación Organizacional & Contable
  const [subsidiaria, setSubsidiaria] = useState(SUBSIDIARIAS[0]);
  const [departamento, setDepartamento] = useState(DEPARTAMENTOS[0]);
  const [ubicacionSugerida, setUbicacionSugerida] = useState(
    'Almacén Principal - Nave 2, Rack B-04',
  );

  // Estados Sección 3: Imagen y Multimedia
  const [imagenUrl, setImagenUrl] = useState(DEFAULT_IMAGE_URL);
  const [captionSub, setCaptionSub] = useState('Carrete 1000ft (Gris Industrial)');
  const [isDragging, setIsDragging] = useState(false);

  // Estados de Interacción, Guardado y Modales
  const [modalExitoOpen, setModalExitoOpen] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [borradorGuardado, setBorradorGuardado] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Cerrar combobox al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setComboboxAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generador de folio alternativo
  const handleGenerarFolio = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCodigoArticulo(String(randomNum));
  };

  // Guardar Borrador
  const handleGuardarBorrador = () => {
    setBorradorGuardado(true);
    setToastMsg(`Borrador del artículo #${codigoArticulo} guardado en memoria.`);
    setTimeout(() => {
      setBorradorGuardado(false);
    }, 2500);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  // Submit Final
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setToastMsg(`Artículo #${codigoArticulo} registrado exitosamente en el Catálogo Maestro de SIFYGSA.`);
    setModalExitoOpen(true);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Manejo de Archivo Fotográfico
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImagenUrl(e.target.result);
        setCaptionSub(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleEliminarImagen = () => {
    setImagenUrl('');
    setCaptionSub('Sin fotografía cargada');
  };

  return (
    <div className="alta-articulo-container">
      {/* Toast Flotante */}
      {toastMsg && (
        <div className="alta-articulo-toast" role="status">
          <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '20px' }}>
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER: Migas de Pan, Título y Folio Sugerido */}
      <div className="alta-articulo-header">
        <div>
          <nav aria-label="Migas de pan" className="alta-articulo-breadcrumbs">
            <button
              type="button"
              className="alta-articulo-breadcrumb-link"
              onClick={() => router.push('/almacen')}
            >
              Almacén
            </button>
            <span>/</span>
            <span className="alta-articulo-breadcrumb-current">Nuevo Artículo</span>
          </nav>
          <h1 className="alta-articulo-title">Alta de Artículo en Catálogo</h1>
          <p className="alta-articulo-subtitle">
            Definición técnica y parámetros maestros para control de existencias y trazabilidad.
          </p>
        </div>

        {/* Badge Folio Sugerido y Estado Borrador */}
        <div className="alta-articulo-folio-badge">
          <div className="alta-articulo-folio-info">
            <span className="alta-articulo-folio-label">Folio Sugerido</span>
            <span className="alta-articulo-folio-value">SKU #{codigoArticulo}</span>
          </div>
          <div className="alta-articulo-divider-v" />
          <span className="alta-articulo-status-pill">
            <span className="alta-articulo-pulse-blue" />
            Borrador
          </span>
        </div>
      </div>

      {/* FORMULARIO EN CASCADA CON 3 SECCIONES */}
      <form id="formAltaArticulo" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SECCIÓN 1: INFORMACIÓN PRIMARIA, TIPO DE ARTÍCULO & UNIDADES */}
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">1</span>
              <h2 className="alta-articulo-card-title">Información Primaria, Tipo de Artículo &amp; Unidades</h2>
            </div>
            <span className="alta-articulo-card-header-tag primary">Datos Principales</span>
          </div>

          <div className="alta-articulo-card-body">
            {/* Códigos y Nombre */}
            <div className="alta-articulo-grid-2">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="codigoArticulo">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">qr_code_2</span>
                    CÓDIGO DEL ARTÍCULO <span className="alta-articulo-req">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerarFolio}
                    title="Autogenerar código"
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      autorenew
                    </span>
                    Generar
                  </button>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <input
                    id="codigoArticulo"
                    type="text"
                    className="alta-articulo-input"
                    value={codigoArticulo}
                    onChange={(e) => setCodigoArticulo(e.target.value)}
                    style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700 }}
                    required
                  />
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--success)',
                      fontSize: '20px',
                    }}
                    title="Validación correcta"
                  >
                    check_circle
                  </span>
                </div>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="nombreArticulo">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">inventory_2</span>
                    NOMBRE DEL ARTÍCULO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  id="nombreArticulo"
                  type="text"
                  className="alta-articulo-input"
                  value={nombreArticulo}
                  onChange={(e) => setNombreArticulo(e.target.value)}
                  style={{ fontWeight: 500 }}
                  required
                />
              </div>
            </div>

            {/* Descripción Detallada */}
            <div className="alta-articulo-field">
              <label className="alta-articulo-label" htmlFor="descArticulo">
                <span className="alta-articulo-label-text">
                  <span className="material-symbols-outlined alta-articulo-label-icon">description</span>
                  DESCRIPCIÓN DETALLADA <span className="alta-articulo-req">*</span>
                </span>
              </label>
              <input
                id="descArticulo"
                type="text"
                className="alta-articulo-input"
                value={descArticulo}
                onChange={(e) => setDescArticulo(e.target.value)}
                style={{ fontWeight: 500 }}
                required
              />
            </div>

            {/* Tipo de Artículo (Combobox desplegable estilizado) */}
            <div className="alta-articulo-field" ref={comboboxRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="alta-articulo-label">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined alta-articulo-label-icon">category</span>
                    <span>TIPO DE ARTÍCULO <span className="alta-articulo-req">*</span></span>
                    <span
                      style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--nav-active-bg)',
                        border: '1px solid var(--primary)',
                        fontSize: '0.625rem',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-family-label)',
                        fontWeight: 600,
                      }}
                    >
                      4 Categorías
                    </span>
                  </span>
                </label>
                <span
                  style={{
                    fontFamily: 'var(--font-family-label)',
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Determina kárdex y política de custodia
                </span>
              </div>

              <div style={{ position: 'relative', width: '100%', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  id="btnComboboxTipo"
                  aria-expanded={comboboxAbierto}
                  className="alta-articulo-combobox-trigger"
                  onClick={() => setComboboxAbierto(!comboboxAbierto)}
                >
                  <div className="alta-articulo-combobox-left">
                    <span className="material-symbols-outlined alta-articulo-combobox-icon">
                      {tipoSeleccionado.icono}
                    </span>
                    <span className="alta-articulo-combobox-text">{tipoSeleccionado.nombre}</span>
                  </div>
                  <div className="alta-articulo-combobox-right">
                    <span className="alta-articulo-combobox-tag">{tipoSeleccionado.tag}</span>
                    <div style={{ width: '1px', height: '1rem', backgroundColor: 'var(--border)' }} />
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '20px',
                        color: 'var(--text-muted)',
                        transform: comboboxAbierto ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Menú desplegable */}
                {comboboxAbierto && (
                  <div className="alta-articulo-combobox-menu" role="listbox">
                    <div className="alta-articulo-combobox-menu-scroll">
                      {CATEGORIAS.map((cat) => {
                        const isSelected = cat.id === tipoSeleccionado.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className={`alta-articulo-combobox-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setTipoSeleccionado(cat);
                              setComboboxAbierto(false);
                            }}
                          >
                            <div className="alta-articulo-option-content">
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--primary)', fontSize: '20px', flexShrink: 0 }}
                              >
                                {cat.icono}
                              </span>
                              <div className="alta-articulo-option-details">
                                <span className="alta-articulo-option-title">{cat.nombre}</span>
                                <span className="alta-articulo-option-desc">{cat.descripcion}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  fontFamily: 'var(--font-family-label)',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  backgroundColor:
                                    cat.tagColor === 'amber'
                                      ? 'var(--warning-bg)'
                                      : 'var(--surface-alt)',
                                  color: cat.tagColor === 'amber' ? 'var(--warning-text)' : 'var(--text-secondary)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {cat.tag}
                              </span>
                              {isSelected && (
                                <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '18px' }}>
                                  check
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Marca / Fabricante & Control Operativo */}
            <div className="alta-articulo-grid-2">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="marcaFabricante">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">factory</span>
                    MARCA / FABRICANTE <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <input
                  id="marcaFabricante"
                  type="text"
                  className="alta-articulo-input"
                  value={marcaFabricante}
                  onChange={(e) => setMarcaFabricante(e.target.value)}
                  style={{ fontWeight: 500 }}
                  required
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="controlOperativo">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">verified_user</span>
                    CONTROL OPERATIVO, SERIE Y CALIBRACIÓN <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <select
                    id="controlOperativo"
                    className="alta-articulo-select"
                    value={controlOperativo}
                    onChange={(e) => setControlOperativo(e.target.value)}
                  >
                    {OPCIONES_CONTROL_OPERATIVO.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
                </div>
              </div>
            </div>

            {/* Fila de Unidades: UNIDAD BASE, COMPRA, VENTAS */}
            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="unidadBase">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">straighten</span>
                    UNIDAD BASE <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <select
                    id="unidadBase"
                    className="alta-articulo-select"
                    value={unidadBase}
                    onChange={(e) => setUnidadBase(e.target.value)}
                  >
                    {UNIDADES_BASE.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
                </div>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="unidadCompra">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">shopping_cart</span>
                    UNIDAD DE COMPRA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <select
                    id="unidadCompra"
                    className="alta-articulo-select"
                    value={unidadCompra}
                    onChange={(e) => setUnidadCompra(e.target.value)}
                  >
                    {UNIDADES_COMPRA.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
                </div>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="unidadVentas">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">point_of_sale</span>
                    UNIDAD DE VENTAS <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <select
                    id="unidadVentas"
                    className="alta-articulo-select"
                    value={unidadVentas}
                    onChange={(e) => setUnidadVentas(e.target.value)}
                  >
                    {UNIDADES_VENTAS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
                </div>
              </div>
            </div>

            {/* SAT CFDI 4.0 */}
            <div className="alta-articulo-field">
              <label className="alta-articulo-label" htmlFor="claveSat">
                <span className="alta-articulo-label-text">
                  <span className="material-symbols-outlined alta-articulo-label-icon">receipt_long</span>
                  CFDI 4.0 : SAT CLAVE PROD SERVICIO <span className="alta-articulo-req">*</span>
                </span>
              </label>
              <div className="alta-articulo-input-wrapper">
                <select
                  id="claveSat"
                  className="alta-articulo-select"
                  value={claveSat}
                  onChange={(e) => setClaveSat(e.target.value)}
                >
                  {CLAVES_SAT.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CLASIFICACIÓN ORGANIZACIONAL & CONTABLE */}
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">2</span>
              <h2 className="alta-articulo-card-title">Clasificación Organizacional &amp; Contable</h2>
            </div>
            <span className="alta-articulo-card-header-tag">Organización &amp; Centro de Costos</span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="subsidiaria">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">corporate_fare</span>
                    SUBSIDIARIA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <select
                    id="subsidiaria"
                    className="alta-articulo-select"
                    value={subsidiaria}
                    onChange={(e) => setSubsidiaria(e.target.value)}
                  >
                    {SUBSIDIARIAS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
                </div>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="departamento">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">domain</span>
                    DEPARTAMENTO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <select
                    id="departamento"
                    className="alta-articulo-select"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                  >
                    {DEPARTAMENTOS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined alta-articulo-select-icon">arrow_drop_down</span>
                </div>
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="ubicacionSugerida">
                  <span className="alta-articulo-label-text">
                    <span className="material-symbols-outlined alta-articulo-label-icon">warehouse</span>
                    UBICACIÓN SUGERIDA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <input
                    id="ubicacionSugerida"
                    type="text"
                    className="alta-articulo-input"
                    value={ubicacionSugerida}
                    onChange={(e) => setUbicacionSugerida(e.target.value)}
                    style={{ paddingRight: '2.25rem', fontWeight: 500 }}
                    required
                  />
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--primary)',
                      fontSize: '18px',
                      pointerEvents: 'none',
                    }}
                  >
                    location_on
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: IMAGEN Y DOCUMENTACIÓN DEL ARTÍCULO */}
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">3</span>
              <h2 className="alta-articulo-card-title">Imagen y Documentación del Artículo</h2>
            </div>
            <span className="alta-articulo-card-header-tag">Carga Multimedia</span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-media-grid">
              {/* Zona Drag & Drop */}
              <div
                className={`alta-articulo-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="alta-articulo-dropzone-icon-box">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                    cloud_upload
                  </span>
                </div>
                <span className="alta-articulo-dropzone-title">
                  Arrastra la fotografía del artículo o haz clic para examinar
                </span>
                <p className="alta-articulo-dropzone-subtitle">
                  Formatos compatibles: PNG, JPG, WEBP hasta 10 MB. Fondo transparente o industrial neutro.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="alta-articulo-browse-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                    add_photo_alternate
                  </span>
                  <span>Seleccionar Fotografía</span>
                </button>
              </div>

              {/* Preview con la imagen del producto */}
              <div className="alta-articulo-preview-box">
                <div className="alta-articulo-preview-inner">
                  <span className="alta-articulo-preview-tag">FOTO PRINCIPAL</span>
                  <div className="alta-articulo-preview-img-container">
                    {imagenUrl ? (
                      <img
                        src={imagenUrl}
                        alt={nombreArticulo}
                        className="alta-articulo-preview-img"
                      />
                    ) : (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '48px', color: 'var(--text-muted)' }}
                      >
                        image_not_supported
                      </span>
                    )}
                  </div>
                  <div className="alta-articulo-preview-caption">
                    <span className="alta-articulo-preview-title" title={nombreArticulo}>
                      {nombreArticulo || 'Sin Nombre'}
                    </span>
                    <span className="alta-articulo-preview-sub" title={captionSub}>
                      {captionSub}
                    </span>
                  </div>
                </div>

                <div className="alta-articulo-preview-actions">
                  <button
                    type="button"
                    className="alta-articulo-btn-preview"
                    onClick={() => setZoomModalOpen(true)}
                    disabled={!imagenUrl}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      zoom_in
                    </span>
                    <span>Ampliar</span>
                  </button>
                  <button
                    type="button"
                    className="alta-articulo-btn-delete"
                    onClick={handleEliminarImagen}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      delete
                    </span>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* BARRA INFERIOR FIJA DE ACCIONES */}
      <div className="alta-articulo-bottom-bar" id="bottomActionBar">
        <div className="alta-articulo-bottom-inner">
          {/* Indicador guardado automático */}
          <div className="alta-articulo-autosave-indicator">
            <span className="alta-articulo-pulse-blue" />
            <span style={{ fontWeight: 500 }}>
              {borradorGuardado
                ? 'Borrador actualizado hace unos instantes'
                : 'Guardado automático en borrador (hace unos segundos)'}
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="alta-articulo-bottom-actions">
            <button
              type="button"
              className="alta-articulo-btn-cancel"
              onClick={() => router.push('/almacen')}
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btnGuardarBorrador"
              className="alta-articulo-btn-draft"
              onClick={handleGuardarBorrador}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: borradorGuardado ? 'var(--success)' : 'var(--text-muted)' }}
              >
                {borradorGuardado ? 'check_circle' : 'save'}
              </span>
              <span style={{ color: borradorGuardado ? 'var(--success)' : 'inherit' }}>
                {borradorGuardado ? 'Borrador Guardado' : 'Guardar Borrador'}
              </span>
            </button>
            <button
              type="submit"
              form="formAltaArticulo"
              id="btnCrearArticulo"
              className="alta-articulo-btn-submit"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add_box
              </span>
              <span>+ Crear Artículo en Catálogo Maestro</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ÉXITO TRAS CREACIÓN */}
      <ModalUniversal
        open={modalExitoOpen}
        title="Artículo Incorporado al Catálogo Maestro"
        subtitle={`SKU: #${codigoArticulo}`}
        onClose={() => {
          setModalExitoOpen(false);
          router.push('/almacen');
        }}
        footer={
          <button
            type="button"
            className="alta-articulo-btn-submit"
            onClick={() => {
              setModalExitoOpen(false);
              router.push('/almacen');
            }}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Ir al Almacén
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '42px', color: 'var(--success)' }}>
              task_alt
            </span>
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            Alta Concluida con Éxito
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 auto', maxWidth: '380px' }}>
            El artículo <strong>{nombreArticulo}</strong> ha sido dado de alta en la ingeniería de catálogo con régimen de custodia{' '}
            <strong>{tipoSeleccionado.nombre}</strong> y ubicación sugerida en <strong>{ubicacionSugerida}</strong>.
          </p>
        </div>
      </ModalUniversal>

      {/* MODAL PARA AMPLIAR FOTOGRAFÍA */}
      {zoomModalOpen && (
        <ModalUniversal
          open={zoomModalOpen}
          title={`Fotografía Técnica - SKU #${codigoArticulo}`}
          subtitle={nombreArticulo}
          onClose={() => setZoomModalOpen(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <div
              style={{
                width: '100%',
                maxHeight: '420px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                padding: '1.5rem',
              }}
            >
              <img
                src={imagenUrl}
                alt={nombreArticulo}
                style={{ maxHeight: '380px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {nombreArticulo}
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {captionSub} • {marcaFabricante}
              </p>
            </div>
          </div>
        </ModalUniversal>
      )}
    </div>
  );
}

