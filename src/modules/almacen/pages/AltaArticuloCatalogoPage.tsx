'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAlmacen } from '../context/AlmacenContext';
import type { Articulo, ClasificacionCustodia, TipoArticuloCatalogo, UnidadMedidaArticulo } from '../types';
import AlmacenCombobox, { type AlmacenComboboxOption } from '../components/ui/AlmacenCombobox';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { FormWizardFooter } from '../components/FormWizardFooter';
import '../almacen.css';

interface TipoArticuloOpcion {
  id: TipoArticuloCatalogo;
  titulo: string;
  badge: string;
  icono: string;
  descripcion: string;
  custodia: ClasificacionCustodia;
}

const TIPOS_ARTICULO_OPCIONES: TipoArticuloOpcion[] = [
  {
    id: 'Material Consumible',
    titulo: '1. Material consumible',
    badge: 'Consumo Directo',
    icono: 'cable',
    descripcion: 'Cables, conectores, tornillería y material fungible de instalación.',
    custodia: 'Consumible',
  },
  {
    id: 'Herramienta Retornable',
    titulo: '2. Herramienta retornable',
    badge: 'Préstamo',
    icono: 'handyman',
    descripcion: 'Ponchadoras, taladros y herramientas sujetas a devolución.',
    custodia: 'Herramienta Retornable (Activo)',
  },
  {
    id: 'Equipo de Medición',
    titulo: '3. Equipo de medición',
    badge: 'Calibración',
    icono: 'speed',
    descripcion: 'Multímetros, calibradores de lazo, certificadores de fibra y cable.',
    custodia: 'Equipo Sujeto a Calibración / Mantenimiento',
  },
  {
    id: 'Activo Fijo y Mobiliario',
    titulo: '4. Activo fijo y mobiliario',
    badge: 'Activo',
    icono: 'domain',
    descripcion: 'Racks maestros, mobiliario de laboratorio y equipo permanente.',
    custodia: 'Herramienta Retornable (Activo)',
  },
];


const PASOS_ARTICULO: StepItem[] = [
  {
    id: 1,
    title: 'Identificación & Tipo',
    description: 'Tipo de artículo, SKU, nombre y unidades',
  },
  {
    id: 2,
    title: 'Clasificación & Almacén',
    description: 'Subsidiaria, departamento y parámetros de stock',
  },
  {
    id: 3,
    title: 'Fiscal (CFDI 4.0) & Documentos',
    description: 'Clave SAT, ficha técnica y fotografía',
  },
];

const CLAVES_SAT_OPTIONS: AlmacenComboboxOption[] = [
  { value: '26121600 - Cables eléctricos y accesorios', label: '26121600 - Cables eléctricos y accesorios', sublabel: 'Cables, conductores y accesorios de instalación' },
  { value: '26121500 - Alambres y cables eléctricos', label: '26121500 - Alambres y cables eléctricos', sublabel: 'Conductores monopolares y blindados' },
  { value: '39121400 - Dispositivos de conexión y terminación', label: '39121400 - Dispositivos de conexión y terminación', sublabel: 'Conectores, zapatas, terminales y empalmes' },
  { value: '32151705 - Cable coaxial y de telecomunicaciones', label: '32151705 - Cable coaxial y de telecomunicaciones', sublabel: 'Transmisión de datos, RF y fibra óptica' },
  { value: '41111900 - Detectores de llama y gas UV / IR', label: '41111900 - Detectores de llama y gas UV / IR', sublabel: 'Sensores ópticos e infrarrojos para seguridad' },
  { value: '41113600 - Medidores de gas y explosímetros', label: '41113600 - Medidores de gas y explosímetros', sublabel: 'Monitoreo ambiental de gases tóxicos y combustibles' },
  { value: '40141600 - Válvulas industriales y actuadores', label: '40141600 - Válvulas industriales y actuadores', sublabel: 'Control de flujo neumático y manual' },
  { value: '46171600 - Equipos de alarma y seguridad', label: '46171600 - Equipos de alarma y seguridad', sublabel: 'Sirenas, estrobos y pulsadores manuales' },
  { value: '23153100 - Herramientas manuales de instalador', label: '23153100 - Herramientas manuales de instalador', sublabel: 'Ponchadoras, pinzas pelacables y dados' },
  { value: '43211700 - Racks y gabinetes de comunicaciones', label: '43211700 - Racks y gabinetes de comunicaciones', sublabel: 'Gabinetes para pared y piso NEMA / IP' },
];

const CONTROL_OPERATIVO_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Estándar: Serie individual habilitada (Sin calibración / mant.)', label: 'Estándar: Serie individual habilitada (Sin calibración / mant.)', sublabel: 'Trazabilidad por número de serie individual' },
  { value: 'Con Calibración Periódica Obligatoria', label: 'Con Calibración Periódica Obligatoria', sublabel: 'Requiere certificado y fecha de vencimiento vigente' },
  { value: 'Lote Único / Sin Serie Individual', label: 'Lote Único / Sin Serie Individual', sublabel: 'Control por cantidad total y número de lote' },
  { value: 'Control por Rollo / Bobina con Metraje Continuo', label: 'Control por Rollo / Bobina con Metraje Continuo', sublabel: 'Seguimiento por bobina con registro de metros restantes' },
];

const UNIDADES_BASE_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Metro', label: 'Metro (m)', sublabel: 'Longitud métrica estándar' },
  { value: 'Ft', label: 'Pie (Ft)', sublabel: 'Longitud imperial' },
  { value: 'Pieza', label: 'Pieza (Pza)', sublabel: 'Unidad individual' },
  { value: 'Bobina', label: 'Bobina', sublabel: 'Carrete continuo' },
  { value: 'Tramo', label: 'Tramo', sublabel: 'Segmento cortado' },
  { value: 'Kilogramo', label: 'Kilogramo (kg)', sublabel: 'Masa / peso' },
  { value: 'Litro', label: 'Litro (L)', sublabel: 'Volumen líquido' },
  { value: 'Juego', label: 'Juego (Jgo)', sublabel: 'Conjunto de elementos' },
  { value: 'Caja', label: 'Caja', sublabel: 'Empaque de fábrica' },
];

const UNIDADES_COMPRA_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Ft', label: 'Pie (Ft)', sublabel: 'Compra por pies' },
  { value: 'Metro', label: 'Metro (m)', sublabel: 'Compra por metros' },
  { value: 'Bobina 1000ft', label: 'Bobina 1000ft', sublabel: 'Carrete de 305 metros' },
  { value: 'Carrete', label: 'Carrete', sublabel: 'Bobina industrial' },
  { value: 'Pieza', label: 'Pieza (Pza)', sublabel: 'Empaque por pieza' },
  { value: 'Caja', label: 'Caja', sublabel: 'Empaque maestro' },
  { value: 'Bulto', label: 'Bulto', sublabel: 'Embalaje protegido' },
  { value: 'Paquete', label: 'Paquete', sublabel: 'Conjunto empacado' },
];

const UNIDADES_VENTAS_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Ft', label: 'Pie (Ft)', sublabel: 'Salida / entrega en pies' },
  { value: 'Metro', label: 'Metro (m)', sublabel: 'Salida / entrega en metros' },
  { value: 'Pieza', label: 'Pieza (Pza)', sublabel: 'Entrega individual' },
  { value: 'Tramo', label: 'Tramo', sublabel: 'Longitud medida a obra' },
  { value: 'Kit', label: 'Kit', sublabel: 'Paquete para instalación' },
  { value: 'Juego', label: 'Juego', sublabel: 'Set de herramientas' },
  { value: 'Carrete', label: 'Carrete', sublabel: 'Bobina completa asignada' },
];

const SUBSIDIARIAS_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'SIFYGSA', label: 'SIFYGSA', sublabel: 'Matriz Corporativa CDMX' },
  { value: 'SIFYGSA - División Telecomunicaciones', label: 'SIFYGSA - División Telecomunicaciones', sublabel: 'Redes, Fibra y Cableado Estructurado' },
  { value: 'SIFYGSA - Sede Monterrey', label: 'SIFYGSA - Sede Monterrey', sublabel: 'Operaciones Zona Norte' },
  { value: 'SIFYGSA - Proyectos Especiales', label: 'SIFYGSA - Proyectos Especiales', sublabel: 'Instalaciones Industriales y Off-Shore' },
  { value: 'SIFYGSA - Instrumentación & Gas', label: 'SIFYGSA - Instrumentación & Gas', sublabel: 'Sistemas F&G y Detección de Fuego' },
];

const DEPARTAMENTOS_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Telecomunicaciones & Redes', label: 'Telecomunicaciones & Redes', sublabel: 'Infraestructura de voz, datos y seguridad' },
  { value: 'Operaciones & Mantenimiento Eléctrico', label: 'Operaciones & Mantenimiento Eléctrico', sublabel: 'Sistemas de fuerza, control y canalización' },
  { value: 'Instrumentación y Automatización', label: 'Instrumentación y Automatización', sublabel: 'Calibración de lazos y transmisores' },
  { value: 'Sistemas Contra Incendio y Gas', label: 'Sistemas Contra Incendio y Gas', sublabel: 'Detección, supresión y paneles F&G' },
  { value: 'Almacén & Logística Central', label: 'Almacén & Logística Central', sublabel: 'Custodia, entradas y salidas de almacén' },
  { value: 'Seguridad Industrial & Calidad', label: 'Seguridad Industrial & Calidad', sublabel: 'EPP, normatividad y auditoría técnica' },
];

const UBICACIONES_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Almacén Principal - Nave 2, Rack B-04', label: 'Almacén Principal - Nave 2, Rack B-04', sublabel: 'Zona B - Conductores y Cables', icon: 'location_on' },
  { value: 'Almacén Central - Nave 1, Estante A-01', label: 'Almacén Central - Nave 1, Estante A-01', sublabel: 'Zona A - Insumos Menores y Conectores', icon: 'location_on' },
  { value: 'Almacén Central - Nave 1, Estante A-02', label: 'Almacén Central - Nave 1, Estante A-02', sublabel: 'Zona A - Tornillería y Canalización', icon: 'location_on' },
  { value: 'Almacén Central - Nave 2, Zona Bobinas C-10', label: 'Almacén Central - Nave 2, Zona Bobinas C-10', sublabel: 'Zona C - Metraje Continuo', icon: 'location_on' },
  { value: 'Almacén Central - Nave 3, Jaula de Herramientas H-01', label: 'Almacén Central - Nave 3, Jaula de Herramientas H-01', sublabel: 'Zona H - Herramientas Sujetas a Custodia', icon: 'location_on' },
  { value: 'Taller de Calibración e Instrumentación - Banco 2', label: 'Taller de Calibración e Instrumentación - Banco 2', sublabel: 'Área Limpia - Equipos de Medición', icon: 'location_on' },
  { value: 'Almacén Monterrey - Nave M-1, Rack M-05', label: 'Almacén Monterrey - Nave M-1, Rack M-05', sublabel: 'Sede Norte - Existencias Generales', icon: 'location_on' },
];

const MARCAS_OPTIONS: AlmacenComboboxOption[] = [
  { value: 'Belden', label: 'Belden', sublabel: 'Cables y conectividad industrial' },
  { value: 'Det-Tronics', label: 'Det-Tronics', sublabel: 'Detectores de llama y gas' },
  { value: 'Calgaz', label: 'Calgaz', sublabel: 'Gases de calibración y prueba' },
  { value: 'Rosemount', label: 'Rosemount / Emerson', sublabel: 'Transmisores de presión y nivel' },
  { value: 'Honeywell Analytics', label: 'Honeywell Analytics', sublabel: 'Sistemas fijos de gas' },
  { value: 'Panduit', label: 'Panduit', sublabel: 'Racks, canaleta e identificación' },
  { value: 'Fluke', label: 'Fluke Corporation', sublabel: 'Instrumentos de calibración y medición' },
  { value: 'Appleton', label: 'Appleton / Emerson', sublabel: 'Conectores a prueba de explosión' },
];

const DEFAULT_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKOmFCH7yGPnO9_ago6uXcfe_fK4LrgmkOSV2dpASJawD726bcWghlyqEaxDtX2PMaHSHMDoI74CoaMuoLzeEP6-lifnHDvYd6PkCYJoSpE7sqsP7OqpwbOQq5HRSJZAvHfKK3Wf0Ma5MRrFOATdqBcdleypSb3F3eOJcBiHipMDK2ejVrmlCNsyMRSHCk3aDL3DHbU4Xv5F4-LhB07BWN_FR7KvlJM5wX7T6DiNxWWdSUjBDoB02oaT5etMGX5cVcSA';

export default function AltaArticuloCatalogoPage() {
  const router = useRouter();
  const { articulos, registrarArticulo, mostrarToast } = useAlmacen();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Pasos (Stepper SIFYGSA)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Estados del Formulario (Sección 1: Información Primaria)
  const [codigoArticulo, setCodigoArticulo] = useState('9367');
  const [nombreArticulo, setNombreArticulo] = useState('Cable Belden 9367 Instrumentación');
  const [descArticulo, setDescArticulo] = useState('Cable multiconductor para instrumentos, Modelo: 9367, Marca: Belden');
  
  // Combobox estilizado para Tipo de Artículo
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoArticuloOpcion>(TIPOS_ARTICULO_OPCIONES[0]);
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false);
  const [tipoSearchQuery, setTipoSearchQuery] = useState('');

  // Marca y Control Operativo
  const [marcaFabricante, setMarcaFabricante] = useState('Belden');
  const [controlOperativo, setControlOperativo] = useState('Estándar: Serie individual habilitada (Sin calibración / mant.)');

  // Unidades de Medida
  const [unidadBase, setUnidadBase] = useState('Metro');
  const [unidadCompra, setUnidadCompra] = useState('Ft');
  const [unidadVentas, setUnidadVentas] = useState('Ft');

  // SAT CFDI 4.0
  const [satClave, setSatClave] = useState('26121600 - Cables eléctricos y accesorios');

  // Sección 2: Clasificación Organizacional & Contable
  const [subsidiaria, setSubsidiaria] = useState('SIFYGSA');
  const [departamento, setDepartamento] = useState('Telecomunicaciones & Redes');
  const [ubicacionSugerida, setUbicacionSugerida] = useState('Almacén Principal - Nave 2, Rack B-04');

  // Sección 3: Imagen y Documentación
  const [imagenUrl, setImagenUrl] = useState(DEFAULT_IMAGE);
  const [imagenTitulo, setImagenTitulo] = useState('Cable Belden 9367');
  const [imagenSubtitulo, setImagenSubtitulo] = useState('Carrete 1000ft (Gris Industrial)');
  const [isDragging, setIsDragging] = useState(false);
  const [modalAmpliarOpen, setModalAmpliarOpen] = useState(false);

  // Estados de validación (touched)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Estados de retroalimentación
  const [borradorGuardado, setBorradorGuardado] = useState(false);
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);

  // Validación de código duplicado
  const codigoExiste = useMemo(() => {
    if (!codigoArticulo.trim()) return false;
    return articulos.some((a) => a.sku.trim().toLowerCase() === codigoArticulo.trim().toLowerCase());
  }, [codigoArticulo, articulos]);

  // Validaciones de formulario
  const errores = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!codigoArticulo.trim()) {
      errs.codigoArticulo = 'El código del artículo es obligatorio.';
    } else if (codigoExiste) {
      errs.codigoArticulo = `El código SKU #${codigoArticulo} ya existe en el catálogo.`;
    }

    if (!nombreArticulo.trim()) {
      errs.nombreArticulo = 'El nombre del artículo es obligatorio.';
    } else if (nombreArticulo.trim().length < 3) {
      errs.nombreArticulo = 'Debe tener al menos 3 caracteres.';
    }

    if (!descArticulo.trim()) {
      errs.descArticulo = 'La descripción técnica es obligatoria.';
    }

    if (!marcaFabricante.trim()) {
      errs.marcaFabricante = 'La marca o fabricante es obligatorio.';
    }

    if (!unidadBase.trim()) {
      errs.unidadBase = 'Seleccione una unidad base.';
    }

    if (!unidadCompra.trim()) {
      errs.unidadCompra = 'Seleccione una unidad de compra.';
    }

    if (!unidadVentas.trim()) {
      errs.unidadVentas = 'Seleccione una unidad de ventas.';
    }

    if (!satClave.trim()) {
      errs.satClave = 'La clave SAT CFDI 4.0 es obligatoria.';
    }

    if (!subsidiaria.trim()) {
      errs.subsidiaria = 'La subsidiaria es obligatoria.';
    }

    if (!departamento.trim()) {
      errs.departamento = 'El departamento es obligatorio.';
    }

    if (!ubicacionSugerida.trim()) {
      errs.ubicacionSugerida = 'La ubicación sugerida es obligatoria.';
    }

    return errs;
  }, [codigoArticulo, codigoExiste, nombreArticulo, descArticulo, marcaFabricante, unidadBase, unidadCompra, unidadVentas, satClave, subsidiaria, departamento, ubicacionSugerida]);

  const isFormValid = useMemo(() => Object.keys(errores).length === 0, [errores]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Manejo de carga de archivos de imagen
  const procesarArchivoImagen = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('El archivo excede el tamaño máximo permitido de 10 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImagenUrl(event.target.result);
        setImagenTitulo(file.name.replace(/\.[^/.]+$/, ''));
        setImagenSubtitulo(`Archivo ${(file.size / 1024).toFixed(1)} KB cargado`);
        mostrarToast('Fotografía cargada correctamente.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivoImagen(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      procesarArchivoImagen(file);
    }
  };

  const handleEliminarImagen = () => {
    setImagenUrl('');
    setImagenTitulo('Sin fotografía asignada');
    setImagenSubtitulo('Haga clic en Seleccionar Fotografía para añadir una');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Guardado de Borrador
  const handleGuardarBorrador = () => {
    setBorradorGuardado(true);
    mostrarToast('Borrador guardado localmente de forma segura.', 'info');
    setTimeout(() => {
      setBorradorGuardado(false);
    }, 2500);
  };

  // Envío final del Formulario

  const validarPaso1 = (): boolean => {
    setTouched((prev) => ({
      ...prev,
      codigoArticulo: true,
      nombreArticulo: true,
      descArticulo: true,
      marcaFabricante: true,
      unidadBase: true,
      unidadCompra: true,
      unidadVentas: true,
    }));

    if (!codigoArticulo.trim()) {
      mostrarToast('El código del artículo es obligatorio.', 'error');
      return false;
    }
    if (codigoExiste) {
      mostrarToast(`El código SKU #${codigoArticulo} ya existe en el catálogo.`, 'error');
      return false;
    }
    if (!nombreArticulo.trim()) {
      mostrarToast('El nombre del artículo es obligatorio.', 'error');
      return false;
    }
    if (nombreArticulo.trim().length < 3) {
      mostrarToast('El nombre debe tener al menos 3 caracteres.', 'error');
      return false;
    }
    if (!descArticulo.trim()) {
      mostrarToast('La descripción técnica es obligatoria.', 'error');
      return false;
    }
    if (!marcaFabricante.trim()) {
      mostrarToast('La marca o fabricante es obligatoria.', 'error');
      return false;
    }
    if (!unidadBase.trim() || !unidadCompra.trim() || !unidadVentas.trim()) {
      mostrarToast('Complete las unidades de medida (Base, Compra y Ventas).', 'error');
      return false;
    }
    return true;
  };

  const validarPaso2 = (): boolean => {
    setTouched((prev) => ({
      ...prev,
      subsidiaria: true,
      departamento: true,
      ubicacionSugerida: true,
    }));

    if (!subsidiaria.trim()) {
      mostrarToast('La subsidiaria es obligatoria.', 'error');
      return false;
    }
    if (!departamento.trim()) {
      mostrarToast('El departamento es obligatorio.', 'error');
      return false;
    }
    if (!ubicacionSugerida.trim()) {
      mostrarToast('La ubicación sugerida en almacén es obligatoria.', 'error');
      return false;
    }
    return true;
  };

  const validarPaso3 = (): boolean => {
    setTouched((prev) => ({
      ...prev,
      satClave: true,
    }));

    if (!satClave.trim()) {
      mostrarToast('La clave SAT CFDI 4.0 es obligatoria.', 'error');
      return false;
    }
    return true;
  };

  const obtenerEstadoValidacionPaso = (paso: number) => {
    const faltantes: string[] = [];
    const idsFaltantes: string[] = [];
    if (paso === 1) {
      if (!codigoArticulo.trim()) {
        faltantes.push('Código de Artículo (SKU)');
        idsFaltantes.push('codigoArticulo');
      }
      if (codigoExiste) {
        faltantes.push('Código SKU no duplicado');
        idsFaltantes.push('codigoArticulo');
      }
      if (!nombreArticulo.trim() || nombreArticulo.trim().length < 3) {
        faltantes.push('Nombre del Artículo (mínimo 3 caracteres)');
        idsFaltantes.push('nombreArticulo');
      }
      if (!descArticulo.trim()) {
        faltantes.push('Descripción Técnica');
        idsFaltantes.push('descArticulo');
      }
      if (!marcaFabricante.trim()) {
        faltantes.push('Marca o Fabricante');
        idsFaltantes.push('marcaFabricante');
      }
      if (!unidadBase.trim() || !unidadCompra.trim() || !unidadVentas.trim()) {
        faltantes.push('Unidades de Medida (Base, Compra, Ventas)');
        idsFaltantes.push('unidadBase');
      }
    } else if (paso === 2) {
      if (!subsidiaria.trim()) {
        faltantes.push('Subsidiaria');
        idsFaltantes.push('subsidiaria');
      }
      if (!departamento.trim()) {
        faltantes.push('Departamento');
        idsFaltantes.push('departamento');
      }
      if (!ubicacionSugerida.trim()) {
        faltantes.push('Ubicación Sugerida');
        idsFaltantes.push('ubicacionSugerida');
      }
    } else if (paso === 3) {
      if (!satClave.trim()) {
        faltantes.push('Clave SAT CFDI 4.0');
        idsFaltantes.push('satClave');
      }
    }
    return { valido: faltantes.length === 0, camposFaltantes: faltantes, idsFaltantes };
  };

  const estadoPasoActual = useMemo(() => {
    return obtenerEstadoValidacionPaso(currentStep);
  }, [
    currentStep,
    codigoArticulo,
    codigoExiste,
    nombreArticulo,
    descArticulo,
    marcaFabricante,
    unidadBase,
    unidadCompra,
    unidadVentas,
    subsidiaria,
    departamento,
    ubicacionSugerida,
    satClave,
  ]);

  const handleIntentoAvanzarInvalido = () => {
    if (currentStep === 1) validarPaso1();
    else if (currentStep === 2) validarPaso2();
    else if (currentStep === 3) validarPaso3();
    mostrarToast(`Faltan ${estadoPasoActual.camposFaltantes.length} campos obligatorios para continuar.`, 'error');
    const primerId = estadoPasoActual.idsFaltantes[0];
    if (primerId) {
      const el = document.getElementById(primerId) || document.querySelector(`[name="${primerId}"]`);
      if (el) {
        (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLElement).focus();
      }
    }
  };

  const handleContinuar = () => {
    if (!estadoPasoActual.valido) {
      handleIntentoAvanzarInvalido();
      return;
    }
    if (currentStep === 1) {
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAtras = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNum: number) => {
    if (stepNum === currentStep) return;
    if (stepNum < currentStep || completedSteps.includes(stepNum)) {
      setCurrentStep(stepNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!estadoPasoActual.valido) {
      handleIntentoAvanzarInvalido();
      return;
    }
    setCurrentStep(stepNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCrearArticulo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validarPaso1()) {
      setCurrentStep(1);
      return;
    }
    if (!validarPaso2()) {
      setCurrentStep(2);
      return;
    }
    if (!validarPaso3()) {
      setCurrentStep(3);
      return;
    }

    // Marcar todos los campos como tocados
    setTouched({
      codigoArticulo: true,
      nombreArticulo: true,
      descArticulo: true,
      marcaFabricante: true,
      unidadBase: true,
      unidadCompra: true,
      unidadVentas: true,
      satClave: true,
      subsidiaria: true,
      departamento: true,
      ubicacionSugerida: true,
    });

    if (!isFormValid) {
      const primerError = Object.values(errores)[0];
      mostrarToast(primerError || 'Por favor revise los campos obligatorios del formulario.', 'error');
      return;
    }

    const satObj = CLAVES_SAT_OPTIONS.find((s) => s.value === satClave) || CLAVES_SAT_OPTIONS[0];

    const nuevo: Articulo = {
      id: `art-${Date.now()}`,
      sku: codigoArticulo.trim().toUpperCase(),
      nombre: nombreArticulo.trim(),
      descripcionCorta: nombreArticulo.trim(),
      descripcion: descArticulo.trim(),
      tipoArticulo: tipoSeleccionado.id,
      categoria:
        tipoSeleccionado.id === 'Equipo de Medición'
          ? 'Equipos de Medición'
          : tipoSeleccionado.id === 'Herramienta Retornable'
          ? 'Herramientas'
          : tipoSeleccionado.id === 'Activo Fijo y Mobiliario'
          ? 'Mobiliario y Activos'
          : 'Consumibles',
      custodia:
        tipoSeleccionado.id === 'Equipo de Medición'
          ? 'Equipo Sujeto a Calibración'
          : tipoSeleccionado.id === 'Herramienta Retornable'
          ? 'Herramienta Retornable'
          : tipoSeleccionado.id === 'Activo Fijo y Mobiliario'
          ? 'Activo Fijo'
          : 'Consumible',
      clasificacionCustodia: tipoSeleccionado.custodia,
      marca: marcaFabricante.trim(),
      modelo: 'STD-2026',
      unidadBase: unidadBase,
      unidadMedida: (unidadBase as UnidadMedidaArticulo) || 'Pieza',
      unidadCompra: unidadCompra,
      unidadVentas: unidadVentas,
      subsidiaria: subsidiaria,
      departamento: departamento,
      ubicacionSugerida: ubicacionSugerida,
      controlOperativo: controlOperativo,
      unidadSat: 'H87',
      claveSat: satObj.value.split(' - ')[0] || '26121600',
      descripcionSat: satObj.label,
      precioUnitario: 1500,
      precioReferenciaMXN: 1500,
      requiereSerieUnica: controlOperativo.toLowerCase().includes('serie') || tipoSeleccionado.id === 'Equipo de Medición',
      seriesRegistradas: [],
      estatus: 'Activo',
      stockTotal: 0,
      stockDisponible: 0,
      stockProyecto: 0,
      stockMantenimiento: 0,
      stockMinimo: 5,
      stockMaximo: 50,
      almacenId: 'principal',
      ubicacionNave: ubicacionSugerida,
      estado: 'Disponible',
      moneda: 'MXN',
      imagen: imagenUrl || DEFAULT_IMAGE,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    registrarArticulo(nuevo);
    setModalConfirmacionOpen(true);
    mostrarToast(`Artículo #${codigoArticulo} registrado exitosamente en el Catálogo de SIFYGSA.`, 'success');
  };

  // Filtrado de tipos de artículo en combobox
  const tiposFiltrados = useMemo(() => {
    if (!tipoSearchQuery.trim()) return TIPOS_ARTICULO_OPCIONES;
    const q = tipoSearchQuery.toLowerCase();
    return TIPOS_ARTICULO_OPCIONES.filter(
      (t) => t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q) || t.badge.toLowerCase().includes(q)
    );
  }, [tipoSearchQuery]);

  return (
    <div className="alta-articulo-container">
      {/* ====================================================================
          MIGAS DE PAN, TÍTULO Y METADATOS
         ==================================================================== */}
      <div className="alta-articulo-header">
        <div>
          <nav aria-label="Migas de pan" className="alta-articulo-breadcrumbs">
            <button
              type="button"
              onClick={() => router.push('/almacen')}
              className="alta-articulo-breadcrumb-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Almacén
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => router.push('/almacen/articulos')}
              className="alta-articulo-breadcrumb-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Artículos
            </button>
            <span>/</span>
            <span className="alta-articulo-breadcrumb-current">Nuevo Artículo</span>
          </nav>
          
          <h1 className="alta-articulo-title">
            Alta de Artículo al Catálogo
          </h1>
          <p className="alta-articulo-subtitle">
            Definición técnica y parámetros maestros para control de existencias y trazabilidad.
          </p>
        </div>

        {/* Acciones y Badges del Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => router.push('/almacen/articulos')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
            title="Volver a Artículos"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            <span>Volver a Artículos</span>
          </button>
        </div>
      </div>


      {/* ── STEPPER CORPORATIVO SIFYGSA ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Stepper
          steps={PASOS_ARTICULO}
          currentStep={currentStep}
          completedSteps={completedSteps}
          isCurrentStepValid={estadoPasoActual.valido}
          onStepClick={(stepNum) => {
            if (stepNum > currentStep && !estadoPasoActual.valido) {
              handleIntentoAvanzarInvalido();
              return;
            }
            handleStepClick(stepNum);
          }}
        />
      </div>

      {/* ====================================================================
          FORMULARIO EN CASCADA
         ==================================================================== */}
      <form onSubmit={handleCrearArticulo} className="space-y-6" id="formAltaArticulo" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* ====================================================================
            SECCIÓN 1: INFORMACIÓN PRIMARIA, TIPO DE ARTÍCULO & UNIDADES
           ==================================================================== */}
        {currentStep === 1 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">1</span>
              <h2 className="alta-articulo-card-title">
                Información Primaria, Tipo de Artículo &amp; Unidades
              </h2>
            </div>
            <span className="alta-articulo-card-header-tag primary">
              Datos Principales
            </span>
          </div>

          <div className="alta-articulo-card-body">
            {/* Códigos y Nombre */}
            <div className="alta-articulo-grid-2">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="codigoArticulo">
                  <span>
                    CÓDIGO DEL ARTÍCULO <span className="alta-articulo-req">*</span>
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500 }}>
                    SKU Único Corporativo
                  </span>
                </label>
                <div className="alta-articulo-input-wrapper">
                  <input
                    id="codigoArticulo"
                    type="text"
                    required
                    value={codigoArticulo}
                    onChange={(e) => setCodigoArticulo(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('codigoArticulo')}
                    placeholder="Ej. 9367"
                    className={`alta-articulo-input ${touched.codigoArticulo && errores.codigoArticulo ? 'is-invalid' : ''}`}
                    style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700, paddingRight: '2.5rem' }}
                  />
                  {codigoArticulo.trim() && !codigoExiste && (
                    <span
                      className="material-symbols-outlined"
                      title="Validación correcta"
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--success)',
                        fontSize: '20px',
                        pointerEvents: 'none',
                      }}
                    >
                      check_circle
                    </span>
                  )}
                  {codigoExiste && (
                    <span
                      className="material-symbols-outlined"
                      title="Código duplicado"
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--danger)',
                        fontSize: '20px',
                        pointerEvents: 'none',
                      }}
                    >
                      error
                    </span>
                  )}
                </div>
                {touched.codigoArticulo && errores.codigoArticulo && (
                  <span className="alta-articulo-field-error">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                    {errores.codigoArticulo}
                  </span>
                )}
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label" htmlFor="nombreArticulo">
                  <span>
                    NOMBRE DEL ARTÍCULO <span className="alta-articulo-req">*</span>
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500 }}>
                    Nombre Comercial / Técnico
                  </span>
                </label>
                <input
                  id="nombreArticulo"
                  type="text"
                  required
                  value={nombreArticulo}
                  onChange={(e) => setNombreArticulo(e.target.value)}
                  onBlur={() => handleBlur('nombreArticulo')}
                  placeholder="Ej. Cable Belden 9367 Instrumentación"
                  className={`alta-articulo-input ${touched.nombreArticulo && errores.nombreArticulo ? 'is-invalid' : ''}`}
                />
                {touched.nombreArticulo && errores.nombreArticulo && (
                  <span className="alta-articulo-field-error">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                    {errores.nombreArticulo}
                  </span>
                )}
              </div>
            </div>

            {/* Descripción Detallada */}
            <div className="alta-articulo-field">
              <label className="alta-articulo-label" htmlFor="descArticulo">
                <span>
                  DESCRIPCIÓN DETALLADA <span className="alta-articulo-req">*</span>
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500 }}>
                  Especificaciones, calibre, pares y modelo
                </span>
              </label>
              <input
                id="descArticulo"
                type="text"
                required
                value={descArticulo}
                onChange={(e) => setDescArticulo(e.target.value)}
                onBlur={() => handleBlur('descArticulo')}
                placeholder="Cable multiconductor para instrumentos, Modelo: 9367, Marca: Belden"
                className={`alta-articulo-input ${touched.descArticulo && errores.descArticulo ? 'is-invalid' : ''}`}
              />
              {touched.descArticulo && errores.descArticulo && (
                <span className="alta-articulo-field-error">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                  {errores.descArticulo}
                </span>
              )}
            </div>

            {/* Tipo de Artículo (Combobox desplegable enriquecido e interactivo) */}
            <div className="alta-articulo-field" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.125rem' }}>
                <label className="alta-articulo-label" style={{ marginBottom: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>TIPO DE ARTÍCULO</span>
                    <span className="alta-articulo-req">*</span>
                    <span className="alta-articulo-card-header-tag primary" style={{ fontSize: '0.625rem' }}>
                      4 Categorías
                    </span>
                  </span>
                </label>
                <span style={{ fontFamily: 'var(--font-family-label)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Determina kárdex y política de custodia
                </span>
              </div>

              <div style={{ position: 'relative', width: '100%' }}>
                <button
                  type="button"
                  aria-expanded={tipoDropdownOpen}
                  onClick={() => setTipoDropdownOpen(!tipoDropdownOpen)}
                  className="alta-articulo-combobox-trigger"
                >
                  <div className="alta-articulo-combobox-left">
                    <span className="material-symbols-outlined alta-articulo-combobox-icon">
                      {tipoSeleccionado.icono}
                    </span>
                    <span className="alta-articulo-combobox-text">
                      {tipoSeleccionado.titulo}
                    </span>
                  </div>

                  <div className="alta-articulo-combobox-right">
                    <span className="alta-articulo-combobox-tag">
                      {tipoSeleccionado.badge}
                    </span>
                    <div style={{ width: '1px', height: '1rem', backgroundColor: 'var(--border)' }} />
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>
                      {tipoDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {/* Menú desplegable con buscador para Tipo de Artículo */}
                {tipoDropdownOpen && (
                  <div className="alta-articulo-combobox-menu">
                    <div className="alta-articulo-combobox-search-box">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
                        search
                      </span>
                      <input
                        type="text"
                        value={tipoSearchQuery}
                        onChange={(e) => setTipoSearchQuery(e.target.value)}
                        placeholder="Buscar categoría de artículo..."
                        className="alta-articulo-combobox-search-input"
                        autoFocus
                      />
                      {tipoSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTipoSearchQuery('')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                        </button>
                      )}
                    </div>

                    <div className="alta-articulo-combobox-menu-scroll" role="listbox">
                      {tiposFiltrados.length > 0 ? (
                        tiposFiltrados.map((opc) => {
                          const esActivo = opc.id === tipoSeleccionado.id;
                          return (
                            <button
                              key={opc.id}
                              type="button"
                              onClick={() => {
                                setTipoSeleccionado(opc);
                                setTipoDropdownOpen(false);
                                setTipoSearchQuery('');
                              }}
                              className={`alta-articulo-combobox-option ${esActivo ? 'selected' : ''}`}
                            >
                              <div className="alta-articulo-option-content">
                                <span className="material-symbols-outlined alta-articulo-combobox-icon">
                                  {opc.icono}
                                </span>
                                <div className="alta-articulo-option-details">
                                  <span className="alta-articulo-option-title">{opc.titulo}</span>
                                  <span className="alta-articulo-option-desc">{opc.descripcion}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="alta-articulo-combobox-tag">
                                  {opc.badge}
                                </span>
                                {esActivo && (
                                  <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '18px' }}>
                                    check
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="alta-articulo-combobox-empty">
                          No se encontraron categorías
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Marca / Fabricante & Control Operativo */}
            <div className="alta-articulo-grid-2">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    MARCA / FABRICANTE <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={marcaFabricante}
                  onChange={(val) => {
                    setMarcaFabricante(val);
                    handleBlur('marcaFabricante');
                  }}
                  options={MARCAS_OPTIONS}
                  allowCustom
                  placeholder="Ej. Belden, Det-Tronics..."
                  searchPlaceholder="Buscar fabricante o escribir uno nuevo..."
                  error={touched.marcaFabricante ? errores.marcaFabricante : undefined}
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    CONTROL OPERATIVO, SERIE Y CALIBRACIÓN <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={controlOperativo}
                  onChange={(val) => setControlOperativo(val)}
                  options={CONTROL_OPERATIVO_OPTIONS}
                  placeholder="Seleccionar política operativa..."
                  searchPlaceholder="Filtrar política operativa..."
                />
              </div>
            </div>

            {/* Fila de Unidades: UNIDAD BASE, COMPRA, VENTAS */}
            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    UNIDAD BASE <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={unidadBase}
                  onChange={(val) => {
                    setUnidadBase(val);
                    handleBlur('unidadBase');
                  }}
                  options={UNIDADES_BASE_OPTIONS}
                  placeholder="Seleccionar unidad base..."
                  searchPlaceholder="Buscar unidad base..."
                  error={touched.unidadBase ? errores.unidadBase : undefined}
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    UNIDAD DE COMPRA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={unidadCompra}
                  onChange={(val) => {
                    setUnidadCompra(val);
                    handleBlur('unidadCompra');
                  }}
                  options={UNIDADES_COMPRA_OPTIONS}
                  placeholder="Seleccionar unidad compra..."
                  searchPlaceholder="Buscar unidad de compra..."
                  error={touched.unidadCompra ? errores.unidadCompra : undefined}
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    UNIDAD DE VENTAS <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={unidadVentas}
                  onChange={(val) => {
                    setUnidadVentas(val);
                    handleBlur('unidadVentas');
                  }}
                  options={UNIDADES_VENTAS_OPTIONS}
                  placeholder="Seleccionar unidad ventas..."
                  searchPlaceholder="Buscar unidad de ventas..."
                  error={touched.unidadVentas ? errores.unidadVentas : undefined}
                />
              </div>
            </div>

            {/* SAT CFDI 4.0 */}
            <div className="alta-articulo-field">
              <label className="alta-articulo-label">
                <span>
                  CFDI 4.0 : SAT CLAVE PROD SERVICIO <span className="alta-articulo-req">*</span>
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500 }}>
                  Catálogo Oficial SAT México
                </span>
              </label>
              <AlmacenCombobox
                value={satClave}
                onChange={(val) => {
                  setSatClave(val);
                  handleBlur('satClave');
                }}
                options={CLAVES_SAT_OPTIONS}
                placeholder="Buscar clave o descripción SAT..."
                searchPlaceholder="Escriba código o texto (ej. cables, válvulas)..."
                error={touched.satClave ? errores.satClave : undefined}
              />
            </div>
          </div>
        </div>
        )}

        {/* ====================================================================
            SECCIÓN 2: CLASIFICACIÓN ORGANIZACIONAL & CONTABLE
           ==================================================================== */}
        {currentStep === 2 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">2</span>
              <h2 className="alta-articulo-card-title">
                Clasificación Organizacional &amp; Contable
              </h2>
            </div>
            <span className="alta-articulo-card-header-tag">
              Organización &amp; Centro de Costos
            </span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-grid-3">
              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    SUBSIDIARIA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={subsidiaria}
                  onChange={(val) => {
                    setSubsidiaria(val);
                    handleBlur('subsidiaria');
                  }}
                  options={SUBSIDIARIAS_OPTIONS}
                  placeholder="Seleccionar subsidiaria..."
                  searchPlaceholder="Buscar empresa o división..."
                  error={touched.subsidiaria ? errores.subsidiaria : undefined}
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    DEPARTAMENTO <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={departamento}
                  onChange={(val) => {
                    setDepartamento(val);
                    handleBlur('departamento');
                  }}
                  options={DEPARTAMENTOS_OPTIONS}
                  placeholder="Seleccionar departamento..."
                  searchPlaceholder="Buscar área o departamento..."
                  error={touched.departamento ? errores.departamento : undefined}
                />
              </div>

              <div className="alta-articulo-field">
                <label className="alta-articulo-label">
                  <span>
                    UBICACIÓN SUGERIDA <span className="alta-articulo-req">*</span>
                  </span>
                </label>
                <AlmacenCombobox
                  value={ubicacionSugerida}
                  onChange={(val) => {
                    setUbicacionSugerida(val);
                    handleBlur('ubicacionSugerida');
                  }}
                  options={UBICACIONES_OPTIONS}
                  allowCustom
                  placeholder="Ej. Almacén Principal - Nave 2, Rack B-04"
                  searchPlaceholder="Buscar ubicación física o escribir una nueva..."
                  leadingIcon="location_on"
                  error={touched.ubicacionSugerida ? errores.ubicacionSugerida : undefined}
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ====================================================================
            SECCIÓN 3: IMAGEN Y DOCUMENTACIÓN DEL ARTÍCULO
           ==================================================================== */}
        {currentStep === 3 && (
        <div className="alta-articulo-card">
          <div className="alta-articulo-card-header">
            <div className="alta-articulo-card-header-left">
              <span className="alta-articulo-step-badge">3</span>
              <h2 className="alta-articulo-card-title">
                Imagen y Documentación del Artículo
              </h2>
            </div>
            <span className="alta-articulo-card-header-tag">
              Carga Multimedia
            </span>
          </div>

          <div className="alta-articulo-card-body">
            <div className="alta-articulo-media-grid">
              
              {/* Zona Drag & Drop */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`alta-articulo-dropzone ${isDragging ? 'dragging' : ''}`}
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
                  onChange={handleFileChange}
                  className="hidden"
                  id="articuloImageUpload"
                  style={{ display: 'none' }}
                />

                <label
                  htmlFor="articuloImageUpload"
                  onClick={(e) => e.stopPropagation()}
                  className="alta-articulo-browse-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                    add_photo_alternate
                  </span>
                  <span>Seleccionar Fotografía</span>
                </label>
              </div>

              {/* Preview con la imagen del producto */}
              <div className="alta-articulo-preview-box">
                <div className="alta-articulo-preview-inner">
                  <span className="alta-articulo-preview-tag">
                    FOTO PRINCIPAL
                  </span>
                  
                  <div className="alta-articulo-preview-img-container">
                    {imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagenUrl}
                        alt={imagenTitulo}
                        className="alta-articulo-preview-img"
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '36px', marginBottom: '0.25rem' }}>
                          image_not_supported
                        </span>
                        <span style={{ fontSize: '0.6875rem' }}>Sin imagen asignada</span>
                      </div>
                    )}
                  </div>

                  <div className="alta-articulo-preview-caption">
                    <span className="alta-articulo-preview-title">
                      {nombreArticulo || imagenTitulo}
                    </span>
                    <span className="alta-articulo-preview-sub">
                      {imagenSubtitulo}
                    </span>
                  </div>
                </div>

                <div className="alta-articulo-preview-actions">
                  <button
                    type="button"
                    onClick={() => setModalAmpliarOpen(true)}
                    className="alta-articulo-btn-preview"
                    disabled={!imagenUrl}
                    style={{ opacity: !imagenUrl ? 0.5 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      zoom_in
                    </span>
                    <span>Ampliar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEliminarImagen}
                    className="alta-articulo-btn-delete"
                    disabled={!imagenUrl}
                    style={{ opacity: !imagenUrl ? 0.5 : 1 }}
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
        )}

      </form>

      {/* ====================================================================
          BARRA INFERIOR FIJA DE ACCIONES REUTILIZABLE (NORMATIVO SIFYGSA)
         ==================================================================== */}
      <FormWizardFooter
        currentStep={currentStep}
        totalSteps={3}
        isValid={estadoPasoActual.valido}
        missingFields={estadoPasoActual.camposFaltantes}
        onContinue={currentStep < 3 ? handleContinuar : () => handleCrearArticulo()}
        onPrevious={handleAtras}
        onSaveDraft={handleGuardarBorrador}
        isSavingDraft={borradorGuardado}
        onCancel={() => router.push('/almacen/articulos')}
        continueText="Continuar"
        finalText="Guardar en Catálogo Maestro"
        continueIcon="arrow_forward"
        finalIcon="check_circle"
        onInvalidClick={handleIntentoAvanzarInvalido}
        helperText="Completa los campos obligatorios (*) para continuar"
        cancelText="Cancelar"
        showCancel={true}
        isLastStep={currentStep === 3}
      />

      {/* ====================================================================
          MODAL PARA AMPLIAR IMAGEN
         ==================================================================== */}
      {modalAmpliarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="alta-articulo-modal-backdrop"
          onClick={() => setModalAmpliarOpen(false)}
        >
          <div
            className="alta-articulo-modal-card"
            style={{ maxWidth: '38rem', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>visibility</span>
                {nombreArticulo || 'Vista Ampliada'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAmpliarOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{
              margin: '1.25rem 0',
              padding: '1.5rem',
              borderRadius: 'var(--radius-card)',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenUrl || DEFAULT_IMAGE}
                alt={nombreArticulo}
                style={{
                  maxHeight: '340px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-control)',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
                }}
              />
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-family-mono)' }}>
              SKU #{codigoArticulo} • {marcaFabricante} • {tipoSeleccionado.titulo} • {ubicacionSugerida}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE CONFIRMACIÓN DE CREACIÓN EXITOSA
         ==================================================================== */}
      {modalConfirmacionOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="alta-articulo-modal-backdrop"
        >
          <div
            className="alta-articulo-modal-card"
            style={{ maxWidth: '30rem', padding: '2rem', textAlign: 'center' }}
          >
            <div style={{
              width: '3.75rem',
              height: '3.75rem',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--success)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>check_circle</span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              ¡Artículo Registrado Exitosamente!
            </h3>
            
            <p style={{
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--primary)',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
            }}>
              SKU #{codigoArticulo} — {nombreArticulo}
            </p>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Ha sido incorporado al Catálogo de SIFYGSA y vinculado al centro de costos de {departamento} en {subsidiaria}.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setModalConfirmacionOpen(false);
                  setCodigoArticulo(String(Number(codigoArticulo) + 1 || Date.now().toString().slice(-4)));
                  setNombreArticulo('');
                  setDescArticulo('');
                  setTouched({});
                }}
                className="alta-articulo-btn-cancel"
                style={{ padding: '0.625rem 1.25rem' }}
              >
                + Alta de Otro Artículo
              </button>
              <button
                type="button"
                onClick={() => router.push('/almacen/articulos')}
                className="alta-articulo-btn-submit"
                style={{ padding: '0.625rem 1.25rem' }}
              >
                Volver a Artículos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
