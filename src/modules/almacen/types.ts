export type CategoriaArticulo =
  | 'Consumibles'
  | 'Herramientas'
  | 'Equipos de Medición'
  | 'Mobiliario y Activos'
  | 'EPP';

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

export interface Articulo {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaArticulo;
  custodia: CustodiaArticulo;
  marca: string;
  modelo: string;
  unidadBase: string;
  unidadSat: string;
  claveSat: string;
  stockTotal: number;
  stockDisponible: number;
  stockProyecto: number;
  stockMantenimiento: number;
  stockMinimo: number;
  stockMaximo: number;
  almacenId: string;
  ubicacionNave: string;
  estado: EstadoArticulo;
  precioUnitario: number;
  moneda: string;
  imagen: string;
  fechaRegistro: string;
  calibracionVencimiento?: string;
  normaCertificacion?: string;
}

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

export interface PartidaRecepcionIR03 {
  id: string;
  sku: string;
  descripcion: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  unidad: string;
  almacenDestino: string;
  ubicacionNave: string;
  numeroSerie: string;
  estadoPartida: 'Completo' | 'Parcial' | 'Pendiente';
  observaciones: string;
  evidenciaFoto?: string;
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

