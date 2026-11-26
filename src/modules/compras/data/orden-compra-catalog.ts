/**
 * Catálogos y datos de demostración para el Asistente de Alta de Orden de Compra
 * Basado en ODC P010926 (Five Peaks México SA de CV, Tenaris Tamsa - Veracruz)
 */

import type { TasaFiscalPartida } from '../types';

export interface ProveedorOption {
  v: string;
  rfc: string;
  pay: string;
  ct: string;
}

export interface ArticuloCatalogOption {
  v: string;
  p: number;
  c: string;
}

export const ARTICULOS_CATALOG: ArticuloCatalogOption[] = [
  { c: 'SRV-SAN-001', v: 'SRV-SAN-001 · Servicio de baño portátil para Tenaris Tamsa', p: 2700.0 },
  { c: 'SRV-EMB-001', v: 'SRV-EMB-001 · Flete y Servicio de Envío / Embarque Especializado', p: 850.0 },
  { c: 'DET-UVIR-01', v: 'DET-UVIR-01 · Detector Óptico de Flama UV/IR Industrial Det-Tronics', p: 34500.0 },
  { c: 'GAS-CAL-CH4', v: 'GAS-CAL-CH4 · Cilindro Gas Patrón Metano CH4 50% LEL', p: 4800.0 },
  { c: 'CAB-INS-16A', v: 'CAB-INS-16A · Cable Instrumentación Blindado Belden 300V', p: 48.0 },
  { c: 'VAL-ESF-316', v: 'VAL-ESF-316 · Válvula de Esfera Acero Inox 316 2 pulgadas Clase 600', p: 7650.0 },
  { c: 'EPP-ARN-DOR', v: 'EPP-ARN-DOR · Arnés de Seguridad Cuerpo Completo Contra Caídas', p: 1850.0 },
  { c: 'HER-PON-HID', v: 'HER-PON-HID · Ponchadora Hidráulica Terminales Eléctricas 16-300mm²', p: 9200.0 },
];

export interface PartidaOrdenForm {
  id: string;
  numArticulo?: number;
  c: string;
  d: string;
  q: number;
  p: number;
  n: string;
  on: boolean;
  unidad?: string;
  tasaFiscal?: TasaFiscalPartida;
  esEstimado?: boolean;
  maxCantidad?: number; // Para órdenes normales con tope

  // Campos adicionales requeridos según estándar NetSuite
  articuloNombre?: string;
  proveedorNombre?: string;
  proveedorRfc?: string;
  departamento?: string;
  disponible?: number | string;
  disponibleAlmacen?: number | string;
  disponibleAlterno?: number | string;
  disponibleTotal?: number | string;
  recibido?: number;
  facturado?: number;
  opciones?: string;
  cerrado?: boolean;
  fechaReciboPrevista?: string;
  clienteTrabajo?: string;
  activityCode?: string;
  refDetallesImpuestos?: string;
  importe?: number;
  importeImpuestos?: number;
  importeBruto?: number;
  detallesExpandidos?: boolean;
}

export const UBICACIONES_CATALOG: string[] = [
  'Almacén Principal (Sede CDMX)',
  'SFG-C307-LAG (Laguna Verde CFE)',
  'SFG-C259-TAM (Tenaris Tamsa - Veracruz)',
  'SFG-C182-DOS (Refinería Dos Bocas PEMEX)',
  'SFG-C104-AKA (Plataforma Akal-C Marino)',
];

export const SUBSIDIARIAS_CATALOG: string[] = [
  'SIFYGSA Fire & Gas S.A. de C.V.',
  'SIFYGSA Servicios Industriales S.A.',
];

export const COMPRADORES_CATALOG: string[] = [
  'Lic. Mariana Valdez (Compradora Senior)',
  'Lic. Jeannette Ivonne Macías Ovando (Compradora)',
  'Ing. Carlos Mendoza Estrada (Gerente de Adquisiciones)',
];

export const APROBADORES_CATALOG: string[] = [
  'Ing. Carlos Mendoza Estrada — Gerente de Adquisiciones',
  'Lic. Ana Torres — Dirección de Finanzas',
];

export const MONEDAS_CATALOG: string[] = [
  'MXN - Peso Mexicano',
  'USD - Dólar Estadounidense',
  'EUR - Euro',
];

export const PROVEEDORES_OC_CATALOG: ProveedorOption[] = [
  {
    v: 'FIVE PEAKS MÉXICO SA DE CV',
    rfc: 'FPM130918MPA',
    pay: 'Crédito 30 días',
    ct: 'Lic. Sergio Salinas',
  },
  {
    v: 'YAK ADVENTURE S.A. DE C.V.',
    rfc: 'YAD140828TY2',
    pay: 'Crédito 30 días',
    ct: 'Lic. Roberto González',
  },
  {
    v: 'DET-TRONICS INTEGRACIÓN S.A.P.I. DE C.V.',
    rfc: 'DTI110419XX3',
    pay: 'Crédito 30 días',
    ct: 'Ing. Carlos Sandoval',
  },
  {
    v: 'BELDEN DE MÉXICO S.A. DE C.V.',
    rfc: 'BME920514KL8',
    pay: 'Crédito 45 días',
    ct: 'Ing. Alejandro Morales',
  },
  {
    v: 'MANGUERAS E INSTRUMENTACIÓN DEL NORTE S.A. DE C.V.',
    rfc: 'MIN090211QT9',
    pay: 'Crédito 30 días',
    ct: 'Ing. David Salinas',
  },
];

export const CONDICIONES_PAGO_CATALOG: string[] = [
  'Contado',
  'Crédito 15 días',
  'Crédito 30 días',
  'Crédito 45 días',
  'Crédito 60 días',
];

export const LUGARES_ENTREGA_CATALOG: string[] = [
  'Entrega DDP Sitio Obra (Frente Activo)',
  'Almacén Principal SIFYGSA (CDMX)',
  'Andén Planta Tenaris Tamsa (Veracruz)',
  'Muelle de Embarque Ciudad del Carmen',
];

export const USOS_CFDI_CATALOG: string[] = [
  'G01 - Adquisición de mercancías',
  'G03 - Gastos en general',
  'I04 - Equipo de transporte',
  'I08 - Otra maquinaria y equipo',
  'S01 - Sin efectos fiscales',
];

export const METODOS_PAGO_CATALOG: string[] = [
  'PPD - Pago en parcialidades o diferido',
  'PUE - Pago en una sola exhibición',
];

export const FORMAS_PAGO_CATALOG: string[] = [
  '03 - Transferencia electrónica de fondos',
  '99 - Por definir',
  '01 - Efectivo',
  '04 - Tarjeta de crédito',
];

export const DEPARTAMENTOS_CATALOG: string[] = [
  'Dirección : Compras',
  'Operaciones : Frentes de Obra',
  'Mantenimiento : Planta Industrial',
  'Administración & Finanzas',
  'Ingeniería & Proyectos',
  'Seguridad, Higiene & Calidad (HSE)',
];

export const CLIENTES_TRABAJO_CATALOG: string[] = [
  'SFG-C299-MFP Mission Foods Mexico S.R.L. de C.V. : SFG-C299-MFP',
  'SFG-C259-LVT Tenaris Tamsa : SFG-C259-LVT',
  'SFG-C157-RRN Rockwell Automation Toluca : SFG-C157-RRN',
  'SFG-C182-DOS Refinería Dos Bocas PEMEX : SFG-C182-DOS',
  'SFG-C307-LAG Central Nucleoeléctrica Laguna Verde : SFG-C307-LAG',
  'SFG-C191-PLC Terminal Marítima Carmen : SFG-C191-PLC',
];

export const ACTIVITY_CODES_CATALOG: string[] = [
  'Paquetería',
  'Flete Terrestre Dedicado',
  'Saneamiento y Mantenimiento',
  'Maniobras e Izaje en Sitio',
  'Suministro Directo de Materiales',
  'Calibración y Pruebas Técnicas',
  'Consumibles y Herramientas',
];

export const UNIDADES_MEDIDA_CATALOG: string[] = [
  'SERVICIO',
  'PZA',
  'METRO',
  'LOTE',
  'KG',
  'HORA',
  'JUEGO',
  'LITRO',
];

export const PARTIDAS_INICIALES_OC: PartidaOrdenForm[] = [
  {
    id: 'it-srv-san-01',
    c: 'SRV-SAN-001',
    d: 'Servicio de baño portátil para Tenaris Tamsa - Ref: SFG-C259-LVT-RQ-127/26',
    q: 1,
    p: 2700.0,
    n: 'Tope Requisición: 1.00 - Ampliación noviembre',
    on: true,
    tasaFiscal: 'IVA_16',
    maxCantidad: 1,
  },
  {
    id: 'it-srv-emb-02',
    c: 'SRV-EMB-001',
    d: 'Flete y Servicio de Envío / Embarque Especializado en sitio Tenaris Tamsa',
    q: 1,
    p: 850.0,
    n: 'Transporte foráneo con maniobra de descarga en puerta 4',
    on: true,
    tasaFiscal: 'RET_IVA_4', // Retención 4% fletes
    maxCantidad: 1,
  },
];
