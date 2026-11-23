// ============================================================================
// SIFYGSA BUSINESS SUITE ERP - COMPRAS & PROCURA TYPES
// Arquitectura Next.js 15 App Router + React 18 + TypeScript
// ============================================================================

export type TipoPersona = 'moral' | 'fisica' | 'extranjero';

export type EstatusProveedor = 'activo' | 'inactivo' | 'revision';

export type OpinionSat32D = 'positiva' | 'negativa' | 'revision';

export type MonedaDivisa = 'MXN' | 'USD' | 'EUR';

export interface CuentaBancariaProveedor {
  id: string;
  banco: string;
  cuenta: string;
  clabe: string; // 18 dígitos estandarizados
  titular: string;
  moneda: MonedaDivisa;
  esPrincipal: boolean;
  estatus?: 'activa' | 'bloqueada';
}

export interface FacturaHistorialProveedor {
  id: string;
  folio: string;
  uuidFiscal: string;
  ordenCompraFolio: string;
  fechaEmision: string;
  fechaVencimiento: string;
  condicionPago: 'contado' | 'credito_30' | 'credito_45' | 'credito_60';
  montoTotal: number;
  moneda: MonedaDivisa;
  estatus: 'abierta' | 'pagada' | 'vencida';
  comprobantePagoUrl?: string;
  comprobantePagoNombre?: string;
}

export interface Proveedor {
  id: string;
  rfc: string; // Inmutable tras creación
  razonSocial: string;
  nombreComercial: string;
  tipoPersona: TipoPersona;
  giro: string;
  contactoPrincipal: string;
  puestoContacto: string;
  telefono: string;
  email: string;
  direccion: {
    calle: string;
    colonia: string;
    cp: string;
    ciudad: string;
    estado: string;
  };
  estatus: EstatusProveedor;
  categoria: string;
  regimenFiscal: string;
  usoCfdi: string;
  formaPago: string;
  metodoPago: string;
  moneda: MonedaDivisa; // Moneda principal
  monedaPrincipal?: MonedaDivisa;
  monedasSecundarias?: MonedaDivisa[];
  diasCredito: number;
  limiteCredito: number;
  banco: string;
  clabe: string;
  cuenta: string;
  cuentasBancarias?: CuentaBancariaProveedor[];
  opinionSat32D: OpinionSat32D;
  fechaActualizacion32D: string;
  sitioWeb?: string;
  subsidiariaPrimaria?: string;
  emailNotificacionPago?: string;
  notas?: string;
  facturasHistorial?: FacturaHistorialProveedor[];
  archivosExpediente?: Array<{
    id: string;
    tipoDocumento: string;
    nombreArchivo: string;
    tamano?: number;
    tamanoKb?: number;
    tipo?: string;
    tipoMime?: string;
    fechaEmision?: string;
    ultimaModificacion?: string;
    validacion?: string;
    url?: string;
  }>;
}

// ----------------------------------------------------------------------------
// Órdenes de Compra y Partidas
// ----------------------------------------------------------------------------

export type TipoOrdenCompra = 'normal' | 'directa';

export type EstatusOrdenCompra =
  | 'pendiente_aprobacion'
  | 'aprobada_supervisor'
  | 'orden_completa_factura_abierta'
  | 'cerrada_factura_pagada'
  | 'cancelada'
  // Compatibilidad con vistas previas
  | 'abierta'
  | 'pendiente'
  | 'transito'
  | 'en_transito'
  | 'autorizada'
  | 'cerrada';

export type TasaFiscalPartida =
  | 'IVA_16'        // 16% IVA estándar
  | 'IVA_0'         // 0% IVA
  | 'RESICO_1_25'   // 16% IVA - 1.25% Retención ISR (Personas Físicas RESICO)
  | 'RET_IVA_4'     // 16% IVA - 4% Retención IVA (Transporte / Fletes)
  | 'RET_IVA_10_66' // 16% IVA - 10.66% Retención IVA + 10% ISR (Honorarios)
  | 'EXENTO';       // 0% IVA / Exento

export interface ItemOrdenCompra {
  id: string;
  partida: number;
  codigo: string; // SKU
  descripcion: string; // Heredada de almacén/catálogo
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  descuentoPorcentaje: number;
  tasaFiscal?: TasaFiscalPartida;
  subtotal: number;
  ivaMonto?: number;
  retencionIsrMonto?: number;
  retencionIvaMonto?: number;
  totalPartida?: number;
  topeReq?: string;
  protegida?: boolean;
}

export interface PartidaOrdenForm {
  id: string;
  c: string; // código SKU
  d: string; // descripción
  q: number; // cantidad
  p: number; // precio unitario (o estimado si es directa)
  n: string; // aclaración / nota de partida
  on: boolean; // incluida / omitida
  tasaFiscal?: TasaFiscalPartida;
  esEstimado?: boolean;
}

export interface StickyNote {
  id: string;
  texto: string;
  autor: string;
  rolAutor?: string;
  dirigidaA?: string; // '@administracion' | '@comprador' | '@carlos.mendoza' etc.
  esPublica: boolean;
  fechaHora: string;
  color: 'amarilla' | 'azul' | 'verde' | 'rosa';
  enterado: boolean;
  enteradoPor?: string;
  fechaEnterado?: string;
}

export interface RecepcionRelacionadaPO {
  id: string;
  folioIR03: string;
  fechaRecepcion: string;
  cantidadRecibida: number;
  totalPartidas: number;
  estatus: 'Completa' | 'Parcial';
  almacenista: string;
}

export interface OrdenCompra {
  id: string;
  folio: string;
  tipoOrden?: TipoOrdenCompra; // 'normal' | 'directa'
  proveedorId: string;
  proveedorNombre: string;
  proveedorRfc: string;
  fechaEmision: string;
  fechaEntrega: string;
  solicitante: string;
  compradorId?: string;
  compradorNombre?: string;
  departamento: string;
  almacenDestino: string;
  proyectoId?: string;
  contratoProyecto?: string; // Formato estándar ej. SFG-C307-LAG
  subsidiaria?: string; // Por defecto 'SIFYGSA Fire & Gas S.A. de C.V.'
  estatus: EstatusOrdenCompra;
  moneda: MonedaDivisa;
  tipoCambio?: number;
  condicionPago: string;
  precioUnitarioEstimado?: boolean; // Para órdenes directas
  referenciaServicioExtraordinario?: string; // Ligar a qué POs o equipos corresponde
  subtotal: number;
  descuento: number;
  iva: number;
  retenciones?: number;
  total: number;
  notas?: string;
  items: ItemOrdenCompra[];

  // Trazabilidad de Facturación y Pagos
  tieneFactura?: boolean;
  facturaId?: string;
  facturaFolio?: string;
  facturaUuid?: string;
  facturasAdjuntas?: FacturaProveedor[]; // Soporta 1 o más facturas hasta cuadrar monto
  montoFacturadoTotal?: number;
  montoPendienteFacturar?: number;

  // Comprobante de Pago (Tesorería / Administración)
  comprobantePagoUrl?: string;
  comprobantePagoNombre?: string;
  comprobantePagoFecha?: string;
  comprobantePagoMonto?: number;
  comprobantePagoFolio?: string;

  // Recepciones físicas en Almacén
  recepcionesIR03?: RecepcionRelacionadaPO[];

  // Sticky Notes / Mensajería interna
  notasSticky?: StickyNote[];
}

export interface DocumentoAdjunto {
  id: string;
  nombre: string;
  tamano: number; // en bytes
  tipo: string;   // 'application/pdf' | 'text/xml' | 'image/jpeg' | etc.
  url?: string;
  fechaSubida: string;
  folioReferencia?: string;
}

export interface FacturaProveedor {
  id: string;
  folio: string;
  uuidFiscal: string;
  ordenCompraId: string;
  ordenCompraFolio: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorRfc: string;
  fechaEmision: string;
  fechaVencimiento: string;
  moneda: MonedaDivisa;
  tipoCambio?: number;
  subtotal: number;
  iva: number;
  retencionIsr?: number;
  retencionIva?: number;
  descuento?: number;
  total: number;
  estatus: 'abierta' | 'pagada' | 'cancelada';
  tipoOperacion?: string;
  usoCfdi?: string;
  cuentaGasto?: string;
  xmlArchivo?: string;
  pdfArchivo?: string;
  comprobantePagoArchivo?: string;
  documentoPrincipal?: DocumentoAdjunto;
  documentosAdjuntos?: DocumentoAdjunto[];
  observaciones?: string;
  items?: ItemOrdenCompra[];
}

// ----------------------------------------------------------------------------
// Bitácora de Auditoría Unificada
// ----------------------------------------------------------------------------

export interface RegistroAuditoria {
  id: string;
  fechaHora: string;
  usuario: string;
  modulo: 'compras' | 'almacen';
  folioDocumento: string;
  accion: 'creacion' | 'edicion' | 'inhabilitacion' | 'recepcion' | 'salida' | 'pago' | 'eliminacion' | 'nota';
  campoModificado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivo?: string;
}

// ----------------------------------------------------------------------------
// Extracción Mock/Simulada de Constancia de Situación Fiscal (CSF)
// ----------------------------------------------------------------------------

export interface CSFExtraccionData {
  rfc: string;
  razonSocial: string;
  tipoPersona: TipoPersona;
  regimenFiscal: string;
  codigoPostal: string;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  fechaEmisionDoc: string;
}
