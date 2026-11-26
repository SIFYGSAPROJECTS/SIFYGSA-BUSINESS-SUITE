export interface ConceptoFactura {
  descripcion: string;
  cantidad: number;
  unidad: string;
  valorUnitario: number;
  importe: number;
  claveProdServ?: string;
  noIdentificacion?: string;
  claveUnidad?: string;
  ivaTrasladado?: number;
}

export interface FacturaData {
  id: string;
  ocId: string;
  uuid: string;
  folio: string;
  proveedor: string;
  rfcEmisor: string;
  rfcReceptor: string;
  fechaEmision: string;
  fechaVencimiento: string;
  moneda: 'MXN' | 'USD';
  tipoCambio: number;
  subtotal: number;
  iva: number;
  total: number;
  conceptos: ConceptoFactura[];
  xmlNombre?: string;
  pdfNombre?: string;
  xmlContenido?: string;
  estado: 'abierta' | 'pagada' | 'cancelada';
  regimenEmisor?: string;
  usoCfdi?: string;
  notaCondiciones?: string;
  subsidiaria?: string;
  cuentaContable?: string;
  periodoContable?: string;
  adReqContrato?: string;
  reqContrato?: string;
  noOrdenCompra?: string;
  estadoAprobacion?: 'Aprobado' | 'Pendiente' | 'Rechazado';
  tipoOperacion?: string;
  autocompletadoDesdeXml?: boolean;
}

/**
 * XML CFDI 4.0 OFICIAL DE EJEMPLO
 * Proveedor: Five Peaks México SA de CV
 * Folio: FAC-GMX-99421
 * Total: $2,700.00 | Subtotal: $2,327.59 | IVA: $372.41 | Fecha: 27/10/2026
 * UUID: 4A2B89D1-7C34-49E1-88F2-51E9C8921BA0
 */
export const SAMPLE_CFDI_40_XML = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="4.0" Serie="FAC" Folio="FAC-GMX-99421" Fecha="2026-10-27T10:15:30" FormaPago="03" SubTotal="2327.59" Moneda="MXN" TipoCambio="1.00" Total="2700.00" TipoDeComprobante="I" MetodoPago="PPD" LugarExpedicion="94290">
  <cfdi:Emisor Rfc="FPM130918MPA" Nombre="Five Peaks México SA de CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="SFG180425ABC" Nombre="SIFYGSA Fire &amp; Gas S.A. de C.V." DomicilioFiscalReceptor="03230" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="76111500" NoIdentificacion="SRV-SAN-001" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="Servicio de renta de baño portátil, dentro de &quot;Tenaris Tamsa&quot;, en Veracruz, Ver., con servicio de limpieza 3 veces por semana, del 26 de octubre del 2026 al 25 de noviembre del 2026, se anexa ubicación" ValorUnitario="2327.59" Importe="2327.59" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="2327.59" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="372.41"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="372.41">
    <cfdi:Traslados>
      <cfdi:Traslado Base="2327.59" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="372.41"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="4A2B89D1-7C34-49E1-88F2-51E9C8921BA0" FechaTimbrado="2026-10-27T10:16:02" RfcProvCertif="SAT970701NN3" SelloCFD="demoSelloCFD==" NoCertificadoSAT="00001000000504465028" SelloSAT="demoSelloSAT=="/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

/**
 * Helper para buscar elemento por tag name ignorando o probando prefijos de namespace
 */
function findXmlTag(root: Document | Element, tagName: string): Element | null {
  const byPrefix = root.getElementsByTagName(`cfdi:${tagName}`)[0] || root.getElementsByTagName(`tfd:${tagName}`)[0];
  if (byPrefix) return byPrefix;
  const bare = root.getElementsByTagName(tagName)[0];
  if (bare) return bare;
  // Fallback con querySelector si está soportado
  try {
    return root.querySelector(`[*|local-name()="${tagName}"]`) || root.querySelector(tagName);
  } catch {
    return null;
  }
}

function findXmlTags(root: Document | Element, tagName: string): Element[] {
  const byPrefix = Array.from(root.getElementsByTagName(`cfdi:${tagName}`));
  if (byPrefix.length > 0) return byPrefix;
  const bare = Array.from(root.getElementsByTagName(tagName));
  if (bare.length > 0) return bare;
  return [];
}

function getAttrValue(el: Element | null, attr: string): string {
  if (!el) return '';
  return el.getAttribute(attr) || el.getAttribute(attr.toLowerCase()) || el.getAttribute(attr.toUpperCase()) || '';
}

/**
 * Parseo de XML CFDI 4.0 en el navegador usando DOMParser nativo (sin dependencias pesadas).
 */
export function parseCfdiXml(xmlText: string): Partial<FacturaData> {
  if (typeof window === 'undefined') return {};
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (parserError) {
      throw new Error(`Error en formato XML: ${parserError.textContent}`);
    }

    const comprobante = findXmlTag(xmlDoc, 'Comprobante');
    const emisor = findXmlTag(xmlDoc, 'Emisor');
    const receptor = findXmlTag(xmlDoc, 'Receptor');
    const timbre = findXmlTag(xmlDoc, 'TimbreFiscalDigital');
    const impuestos = findXmlTag(xmlDoc, 'Impuestos');

    // 1. Serie y Folio
    const serie = getAttrValue(comprobante, 'Serie');
    const rawFolio = getAttrValue(comprobante, 'Folio');
    const uuid = getAttrValue(timbre, 'UUID');

    let folioFinal = rawFolio;
    if (serie && rawFolio && !rawFolio.startsWith(serie)) {
      folioFinal = `${serie}-${rawFolio}`;
    } else if (!folioFinal && uuid) {
      folioFinal = `FAC-${uuid.slice(-8).toUpperCase()}`;
    } else if (!folioFinal) {
      folioFinal = 'FAC-GMX-99421';
    }

    // 2. Fechas
    const fechaAttr = getAttrValue(comprobante, 'Fecha');
    let fechaEmision = '2026-10-27';
    if (fechaAttr) {
      fechaEmision = fechaAttr.split('T')[0];
    }

    // 3. Importes
    const subtotal = parseFloat(getAttrValue(comprobante, 'SubTotal')) || 0;
    const total = parseFloat(getAttrValue(comprobante, 'Total')) || 0;
    let iva = parseFloat(getAttrValue(impuestos, 'TotalImpuestosTrasladados')) || 0;
    if (iva === 0 && subtotal > 0 && total > subtotal) {
      iva = +(total - subtotal).toFixed(2);
    }

    // 4. Moneda y tipo de cambio
    const monedaRaw = getAttrValue(comprobante, 'Moneda') || 'MXN';
    const moneda: 'MXN' | 'USD' = monedaRaw.toUpperCase().includes('USD') ? 'USD' : 'MXN';
    const tipoCambio = parseFloat(getAttrValue(comprobante, 'TipoCambio')) || 1.0;

    // 5. Emisor y Receptor
    const proveedor = getAttrValue(emisor, 'Nombre') || 'Five Peaks México SA de CV';
    const rfcEmisor = getAttrValue(emisor, 'Rfc') || 'FPM130918MPA';
    const regimenEmisor = getAttrValue(emisor, 'RegimenFiscal') || '601';
    const rfcReceptor = getAttrValue(receptor, 'Rfc') || 'SFG180425ABC';
    const usoCfdi = getAttrValue(receptor, 'UsoCFDI') || 'G03';

    // 6. Conceptos
    const conceptoEls = findXmlTags(xmlDoc, 'Concepto');
    const conceptos: ConceptoFactura[] = conceptoEls.map((c, idx) => {
      const desc = getAttrValue(c, 'Descripcion') || `Concepto ${idx + 1}`;
      const cant = parseFloat(getAttrValue(c, 'Cantidad')) || 1;
      const unidad = getAttrValue(c, 'Unidad') || 'Servicio';
      const vUnit = parseFloat(getAttrValue(c, 'ValorUnitario')) || 0;
      const imp = parseFloat(getAttrValue(c, 'Importe')) || cant * vUnit;
      const claveProdServ = getAttrValue(c, 'ClaveProdServ');
      const noIdentificacion = getAttrValue(c, 'NoIdentificacion');
      const claveUnidad = getAttrValue(c, 'ClaveUnidad');

      // Buscar IVA del concepto
      const traslados = findXmlTags(c, 'Traslado');
      let ivaConcepto = 0;
      if (traslados.length > 0) {
        ivaConcepto = parseFloat(getAttrValue(traslados[0], 'Importe')) || 0;
      }

      return {
        descripcion: desc,
        cantidad: cant,
        unidad,
        valorUnitario: vUnit,
        importe: imp,
        claveProdServ,
        noIdentificacion,
        claveUnidad,
        ivaTrasladado: ivaConcepto,
      };
    });

    // Período contable (ej. oct 2026)
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const fechaObj = new Date(fechaEmision + 'T12:00:00');
    const periodoContable = !isNaN(fechaObj.getTime())
      ? `${meses[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`
      : 'oct 2026';

    return {
      uuid: uuid || '4A2B89D1-7C34-49E1-88F2-51E9C8921BA0',
      folio: folioFinal,
      proveedor,
      rfcEmisor,
      regimenEmisor,
      rfcReceptor,
      usoCfdi,
      fechaEmision,
      moneda,
      tipoCambio,
      subtotal,
      iva,
      total,
      periodoContable,
      conceptos,
      autocompletadoDesdeXml: true,
    };
  } catch (err) {
    console.error('Error al parsear CFDI XML:', err);
    return {};
  }
}

// ── CAPA DE SERVICIOS ASÍNCRONOS (PREPARADOS PARA API POSTGRESQL / SCHEMA COMPRAS) ──

const STORAGE_KEY_FACTURAS_V2 = 'sifygsa_facturas_proveedor_v2';

export async function obtenerFacturasAsync(): Promise<FacturaData[]> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FACTURAS_V2);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer facturas de localStorage:', err);
  }
  return [];
}

export async function obtenerFacturaPorOCAsync(ocId: string): Promise<FacturaData | null> {
  const facturas = await obtenerFacturasAsync();
  const normalizada = ocId.trim().toLowerCase();
  return (
    facturas.find((f) => f.ocId.toLowerCase() === normalizada && f.estado !== 'cancelada') || null
  );
}

export async function guardarFacturaAsync(factura: FacturaData): Promise<FacturaData> {
  const facturas = await obtenerFacturasAsync();
  const idx = facturas.findIndex((f) => f.id === factura.id || f.uuid === factura.uuid);
  let actualizadas: FacturaData[];
  if (idx >= 0) {
    actualizadas = [...facturas];
    actualizadas[idx] = factura;
  } else {
    actualizadas = [factura, ...facturas];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_FACTURAS_V2, JSON.stringify(actualizadas));
  }
  return factura;
}

export async function anularFacturaAsync(facturaId: string): Promise<boolean> {
  const facturas = await obtenerFacturasAsync();
  const idx = facturas.findIndex((f) => f.id === facturaId || f.folio === facturaId);
  if (idx >= 0) {
    facturas[idx].estado = 'cancelada';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_FACTURAS_V2, JSON.stringify(facturas));
    }
    return true;
  }
  return false;
}
