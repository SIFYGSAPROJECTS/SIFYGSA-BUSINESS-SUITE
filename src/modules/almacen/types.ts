// ============================================================================
// SIFYGSA BUSINESS SUITE ERP - ALMACÉN & CONTROL DE INVENTARIOS (SGA) TYPES
// Arquitectura Next.js 15 App Router + React 18 + TypeScript
// ============================================================================

export type UnidadMedidaArticulo =
  | 'Pieza'
  | 'Par'
  | 'Caja'
  | 'Paquete'
  | 'Metro'
  | 'Metro Cuadrado'
  | 'Metro Cúbico'
  | 'Litro'
  | 'Galón'
  | 'Kilogramo'
  | 'Bobina'
  | 'Bulto'
  | 'Kit'
  | 'Juego'
  | 'Servicio';

export type CategoriaArticulo =
  | 'Consumibles'
  | 'Herramientas'
  | 'Equipos de Medición'
  | 'Mobiliario y Activos'
  | 'EPP'
  | 'Tubería y Conexiones'
  | 'Instrumentación'
  | 'Servicios Especializados';

export type ClasificacionCustodia =
  | 'Consumible'
  | 'Herramienta Retornable (Activo)'
  | 'Equipo Sujeto a Calibración / Mantenimiento';

export type TipoArticuloCatalogo =
  | 'Material Consumible'
  | 'Herramienta Retornable'
  | 'Equipo de Medición'
  | 'Activo Fijo y Mobiliario';

// Compatibilidad con tipos anteriores
export type CustodiaArticulo =
  | 'Consumible'
  | 'Herramienta Retornable'
  | 'Equipo Sujeto a Calibración'
  | 'Activo Fijo';

export type EstadoArticulo =
  | 'Disponible'
  | 'En Proyecto'
  | 'Mantenimiento'
  | 'Stock Bajo'
  | 'Crítico';

export type EstatusArticulo = 'Activo' | 'Inactivo';

export interface Articulo {
  id: string;
  sku: string; // Obligatorio y único
  nombre: string;
  descripcionCorta?: string; // Única, capturada 1 vez y heredada a compras/ventas
  descripcion?: string;
  tipoArticulo?: TipoArticuloCatalogo;
  categoria: CategoriaArticulo;
  custodia: CustodiaArticulo;
  clasificacionCustodia?: ClasificacionCustodia;
  marca: string; // Obligatorio
  modelo: string; // Obligatorio
  unidadBase?: string;
  unidadMedida?: UnidadMedidaArticulo;
  unidadCompra?: string;
  unidadVentas?: string;
  subsidiaria?: string;
  departamento?: string;
  ubicacionSugerida?: string;
  controlOperativo?: string;
  unidadSat: string;
  claveSat: string; // Buscador integrado
  descripcionSat?: string;
  precioUnitario: number;
  precioReferenciaMXN?: number;
  requiereSerieUnica?: boolean; // Control de series únicas sin repetición
  seriesRegistradas?: string[];
  estatus?: EstatusArticulo; // 'Activo' | 'Inactivo'
  activo?: boolean; // Compatibilidad: true si estatus === 'Activo'
  enMantenimiento?: boolean; // Compatibilidad: true si stockMantenimiento > 0
  proyectoId?: string; // ID de proyecto asignado
  stockTotal: number;
  stockDisponible: number;
  stockProyecto: number;
  stockMantenimiento: number;
  stockMinimo: number;
  stockMaximo: number;
  almacenId: string;
  ubicacionNave: string;
  estado: EstadoArticulo;
  moneda: string;
  imagen: string;
  fechaRegistro: string;
  calibracionVencimiento?: string;
  normaCertificacion?: string;
  historialCalibraciones?: Array<{
    id: string;
    fechaCalibracion: string;
    fechaVencimiento: string;
    laboratorio: string;
    numeroCertificado: string;
    resultado: 'Aprobado' | 'Condicionado' | 'Rechazado';
  }>;
}

// ----------------------------------------------------------------------------
// Control de Mantenimiento de Artículos (Taller y Calibración)
// ----------------------------------------------------------------------------
export type TipoMantenimiento =
  | 'Preventivo'
  | 'Correctivo'
  | 'Calibración / Revisión';

export type EstadoMantenimiento =
  | 'Pendiente / En Diagnóstico'
  | 'En Proceso'
  | 'Completado / Listo para Reingreso'
  | 'Baja Definitiva / Irreparable';

export interface MantenimientoArticulo {
  id: string;
  folio: string; // ej. MNT-2026-0001
  articuloId: string;
  articuloSku: string;
  articuloNombre: string;
  cantidad: number;
  almacenId: string;
  tipoMantenimiento: TipoMantenimiento;
  estado: EstadoMantenimiento;
  fechaEnvio: string;
  fechaEstimadaRetorno: string;
  fechaRetornoReal?: string;
  responsableOProveedor: string; // Taller técnico o laboratorio externo
  costoMantenimiento?: number;
  diagnosticoFalla: string;
  observacionesResolucion?: string;
  usuarioRegistro: string;
}

// ----------------------------------------------------------------------------
// Catálogo Centralizado de Ubicaciones por Proyecto (No manual)
// ----------------------------------------------------------------------------
export interface ProyectoUbicacion {
  codigo: string; // ej. SFG-C307-LAG
  nombreProyecto: string; // ej. Laguna Verde CFE
  cliente: string;
  ubicacionPredeterminada: string;
  activo: boolean;
}

export const PROYECTOS_UBICACIONES_CATALOG: ProyectoUbicacion[] = [
  {
    codigo: 'Almacén Principal',
    nombreProyecto: 'Almacén Central y Bodega Matriz SIFYGSA',
    cliente: 'SIFYGSA Corporativo',
    ubicacionPredeterminada: 'Nave Central - Racks A/B',
    activo: true,
  },
  {
    codigo: 'SFG-C307-LAG',
    nombreProyecto: 'Rehabilitación y Detección de Fuego Laguna Verde',
    cliente: 'Comisión Federal de Electricidad (CFE)',
    ubicacionPredeterminada: 'Frente Laguna Verde - Contenedor 1',
    activo: true,
  },
  {
    codigo: 'SFG-C259-TAM',
    nombreProyecto: 'Mantenimiento Integral Contra Incendio Tenaris Tamsa',
    cliente: 'Tenaris Tamsa Veracruz',
    ubicacionPredeterminada: 'Bodega de Maniobras Tamsa',
    activo: true,
  },
  {
    codigo: 'SFG-C182-DOS',
    nombreProyecto: 'Instalación de Monitores y Diluvio Refinería Dos Bocas',
    cliente: 'PEMEX PTI',
    ubicacionPredeterminada: 'Patio Industrial Dos Bocas Nave 4',
    activo: true,
  },
  {
    codigo: 'SFG-C104-AKA',
    nombreProyecto: 'Sistemas de Detección Marina Plataforma Akal-C',
    cliente: 'PEMEX Exploración y Producción',
    ubicacionPredeterminada: 'Muelle Ciudad del Carmen / Marino',
    activo: true,
  },
];

// ----------------------------------------------------------------------------
// Recepción de Mercancías IR03 (Basada en Orden de Compra)
// ----------------------------------------------------------------------------

export interface PartidaRecepcionIR03 {
  id: string;
  sku: string;
  descripcion: string;
  cantidadSolicitadaPO: number; // Cantidad autorizada en PO
  cantidadFacturada: number;    // Cantidad amparada en factura
  cantidadRecibidaFisica: number; // Cantidad recibida en andén
  stockDisponibleAlmacenPrincipal: number; // Stock disponible actual
  unidad: string;
  ubicacionProyectoDestino: string; // Heredada de PO o modificada
  numerosSerie?: string[]; // Series si requiereSerieUnica
  observaciones: string;
  estadoPartida?: 'Completo' | 'Parcial' | 'Pendiente';
  evidenciaFoto?: string;
  // Campos heredados de compatibilidad
  cantidadPedida?: number;
  cantidadRecibida?: number;
  almacenDestino?: string;
  ubicacionNave?: string;
  numeroSerie?: string;
}

export interface RecepcionIR03Documento {
  id: string;
  folio: string; // ej. IR03-2026-0089
  ordenCompraFolio: string; // ej. PO-2026-0173
  contratoProyecto: string; // ej. SFG-C259-TAM
  proveedor: string;
  rfcProveedor?: string;
  remisionFactura?: string;
  fecha: string;
  almacenistaResponsable: string;
  ubicacionDestinoGeneral: string;
  partidas: PartidaRecepcionIR03[];
  estatus: 'Completa' | 'Parcial' | 'Eliminada';
  notasGenerales?: string;
  motivoEliminacion?: string;
  fechaEliminacion?: string;
  usuarioEliminacion?: string;
}

// ----------------------------------------------------------------------------
// Vales de Salida (SA) - 100% Propios de Almacén (Independientes de SO Ventas)
// ----------------------------------------------------------------------------

export interface PartidaValeSalida {
  id: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  custodia: ClasificacionCustodia;
  numerosSerie?: string[];
  ubicacionOrigen: string;
  notas?: string;
}

export interface ValeSalidaSA {
  id: string;
  folio: string; // ej. SA-2026-0142
  contratoProyectoDestino: string; // ej. SFG-C307-LAG
  solicitudMaterialFolio?: string; // Folio de solicitud interna
  fechaSalida: string;
  responsableRecibe: string;
  cargoArea: string;
  numeroEmpleado: string;
  almacenistaDespacho: string;
  partidas: PartidaValeSalida[];
  firmadoFisico: boolean;
  estatus: 'Despachado' | 'En Tránsito' | 'Devuelto Parcial' | 'Cerrado';
  observaciones?: string;
}

// ----------------------------------------------------------------------------
// Devolución a Almacén Principal (Retorno de Obra)
// ----------------------------------------------------------------------------

export interface ItemDevolucionRetorno {
  id: string;
  sku: string;
  descripcion: string;
  cantidadDevuelta: number;
  unidad: string;
  tipoItem: 'sobrante_consumible' | 'herramienta_retornable' | 'equipo_medicion';
  numerosSerie?: string[];
  estadoFisico: 'Excelente' | 'Buen Estado' | 'Requiere Mantenimiento' | 'Calibración Vencida';
  nuevoDestino: 'Almacén Principal' | 'En Mantenimiento / Calibración' | 'Merma';
  notas: string;
}

export interface DevolucionAlmacen {
  id: string;
  folio: string; // ej. DEV-2026-0045
  valeSalidaOrigenFolio?: string;
  contratoProyectoOrigen: string;
  fechaDevolucion: string;
  responsableEntrega: string;
  almacenistaReceptor: string;
  items: ItemDevolucionRetorno[];
  motivoDevolucion: string;
  estatus: 'Completada' | 'En Revisión Técnica';
}

// ----------------------------------------------------------------------------
// Monitor de Calibración y Mantenimiento
// ----------------------------------------------------------------------------

export interface MonitorCalibracionItem {
  id: string;
  sku: string;
  nombreEquipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  ubicacionActual: string; // 'Almacén Principal' o 'SFG-C307-LAG'
  custodiaResponsable?: string;
  fechaUltimaCalibracion: string;
  fechaVencimientoCalibracion: string;
  diasParaVencimiento: number;
  estatusCalibracion: 'Vigente' | 'Próximo a Vencer' | 'Vencido';
  bloqueadoParaSalida: boolean; // Si está vencido no se puede prestar a nuevo proyecto
  certificadoPdfUrl?: string;
}

// ----------------------------------------------------------------------------
// Compatibilidad y Tipos Heredados
// ----------------------------------------------------------------------------

export type TipoMovimientoAlmacen =
  | 'Entrada IR03'
  | 'Salida a Proyecto'
  | 'Devolución'
  | 'Ajuste'
  | 'Envío a Calibración';

export type EstadoMovimiento =
  | 'Completado'
  | 'En Tránsito'
  | 'En Verificación'
  | 'Pendiente';

export interface MovimientoAlmacen {
  id: string;
  folio: string;
  tipo: TipoMovimientoAlmacen;
  fecha: string;
  articuloSku: string;
  articuloNombre: string;
  cantidad: number;
  almacen: string;
  ubicacion: string;
  referenciaDoc: string;
  responsable: string;
  frenteTrabajo?: string;
  estado: EstadoMovimiento;
}

export interface PartidaPO51 {
  numero: number;
  articulo: string;
  sku: string;
  descripcion: string;
  departamento: string;
  cantidad: number;
  valorUnitario: number;
  importeNeto: number;
  importeBruto: number;
  fechaPrevista: string;
  clienteTrabajo: string;
  facturable: boolean;
}

export interface OrdenCompraPO51 {
  folio: string;
  contratoAsociado: string;
  requisicion: string;
  proveedor: string;
  rfcProveedor: string;
  fechaEmision: string;
  fechaEntregaEstimada: string;
  subsidiaria: string;
  moneda: string;
  tipoCambio: number;
  estadoAprobacion: string;
  aprobador: string;
  recibidoPor: string;
  subtotal: number;
  iva: number;
  total: number;
  notas: string;
  partidas: PartidaPO51[];
}

export interface AlmacenInfo {
  id: string;
  nombre: string;
  codigo: string;
  naves: string[];
}

export interface AsignacionProyecto {
  id: string;
  folio: string;
  equipoNombre: string;
  sku: string;
  frenteTrabajo: string;
  solicitante: string;
  fechaPrestamo: string;
  fechaRetornoPrevista: string;
  estado: 'En Frente' | 'Por Vencer' | 'Retornado';
  calibracionVigente: boolean;
}

export interface ResponsableProyecto {
  id: string;
  nombreCompleto: string;
  cargoArea: string;
  numeroEmpleado: string;
}

export interface DatosAlmacenBd {
  almacenes: AlmacenInfo[];
  articulos: Articulo[];
  movimientos: MovimientoAlmacen[];
  ordenCompraPO51: OrdenCompraPO51;
}
