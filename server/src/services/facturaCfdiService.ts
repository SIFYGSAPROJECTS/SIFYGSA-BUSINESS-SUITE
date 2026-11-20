/**
 * ============================================================================
 * SIFYGSA ENTERPRISE ERP - SERVICIO DE RECEPCIÓN Y EXTRACCIÓN DE FACTURAS CFDI 4.0
 * Módulo de Backend (Node / Express / TypeScript)
 * ============================================================================
 */

export interface ConceptoExtraccion {
  partida: number;
  claveProdServ?: string;
  noIdentificacion?: string;
  descripcion: string;
  cantidad: number;
  claveUnidad?: string;
  unidad: string;
  valorUnitario: number;
  importe: number;
  ivaTrasladado: number;
}

export interface ExtraccionCfdiResultado {
  uuid: string;
  folio: string;
  serie?: string;
  fechaEmision: string;
  rfcEmisor: string;
  nombreEmisor: string;
  regimenFiscalEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  usoCfdi: string;
  moneda: 'MXN' | 'USD';
  tipoCambio: number;
  subtotal: number;
  iva: number;
  total: number;
  conceptos: ConceptoExtraccion[];
  noCertificadoSAT?: string;
  selloSAT?: string;
  cadenaOriginal?: string;
}

/**
 * Servicio para procesar y extraer metadatos estructurados de XMLs CFDI 4.0
 */
export class FacturaCfdiService {
  /**
   * Extrae los campos normativos del CFDI 4.0 mediante expresiones regulares / parser XML
   */
  public static extraerDatosXml(xmlString: string): ExtraccionCfdiResultado {
    // Validar encabezado CFDI
    if (!xmlString.includes('cfdi:Comprobante') && !xmlString.includes('<Comprobante')) {
      throw new Error('El archivo no contiene un comprobante fiscal CFDI válido.');
    }

    const versionMatch = xmlString.match(/Version="([^"]+)"/i);
    const version = versionMatch ? versionMatch[1] : '4.0';
    if (version !== '4.0' && version !== '3.3') {
      throw new Error(`Versión de CFDI no soportada: ${version}. Se requiere CFDI 4.0.`);
    }

    // UUID
    const uuidMatch = xmlString.match(/UUID="([a-f0-9\-]{36})"/i);
    const uuid = uuidMatch ? uuidMatch[1].toUpperCase() : '';
    if (!uuid) {
      throw new Error('No se localizó el UUID del Timbre Fiscal Digital del SAT.');
    }

    // Folio y Serie
    const serieMatch = xmlString.match(/Serie="([^"]+)"/i);
    const serie = serieMatch ? serieMatch[1] : '';
    const folioMatch = xmlString.match(/Folio="([^"]+)"/i);
    const rawFolio = folioMatch ? folioMatch[1] : '';
    const folio = serie && rawFolio && !rawFolio.startsWith(serie) ? `${serie}-${rawFolio}` : rawFolio || `FAC-${uuid.slice(-8)}`;

    // Fechas
    const fechaMatch = xmlString.match(/Fecha="([^"]+)"/i);
    const fechaEmision = fechaMatch ? fechaMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];

    // Emisor
    const emisorMatch = xmlString.match(/<cfdi:Emisor\s+([^>]+)>/i) || xmlString.match(/<Emisor\s+([^>]+)>/i);
    const emisorAttrs = emisorMatch ? emisorMatch[1] : '';
    const rfcEmisorMatch = emisorAttrs.match(/Rfc="([^"]+)"/i);
    const rfcEmisor = rfcEmisorMatch ? rfcEmisorMatch[1].toUpperCase() : '';
    const nombreEmisorMatch = emisorAttrs.match(/Nombre="([^"]+)"/i);
    const nombreEmisor = nombreEmisorMatch ? nombreEmisorMatch[1] : 'Proveedor Indefinido';
    const regimenEmisorMatch = emisorAttrs.match(/RegimenFiscal="([^"]+)"/i);
    const regimenFiscalEmisor = regimenEmisorMatch ? regimenEmisorMatch[1] : '601';

    // Receptor
    const receptorMatch = xmlString.match(/<cfdi:Receptor\s+([^>]+)>/i) || xmlString.match(/<Receptor\s+([^>]+)>/i);
    const receptorAttrs = receptorMatch ? receptorMatch[1] : '';
    const rfcReceptorMatch = receptorAttrs.match(/Rfc="([^"]+)"/i);
    const rfcReceptor = rfcReceptorMatch ? rfcReceptorMatch[1].toUpperCase() : '';
    const nombreReceptorMatch = receptorAttrs.match(/Nombre="([^"]+)"/i);
    const nombreReceptor = nombreReceptorMatch ? nombreReceptorMatch[1] : 'SIFYGSA Fire & Gas S.A. de C.V.';
    const usoCfdiMatch = receptorAttrs.match(/UsoCFDI="([^"]+)"/i);
    const usoCfdi = usoCfdiMatch ? usoCfdiMatch[1] : 'G03';

    // Importes y Moneda
    const monedaMatch = xmlString.match(/Moneda="([^"]+)"/i);
    const moneda: 'MXN' | 'USD' = monedaMatch && monedaMatch[1].toUpperCase().includes('USD') ? 'USD' : 'MXN';
    const tcMatch = xmlString.match(/TipoCambio="([^"]+)"/i);
    const tipoCambio = tcMatch ? parseFloat(tcMatch[1]) : 1.0;

    const subtotalMatch = xmlString.match(/SubTotal="([^"]+)"/i);
    const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1]) : 0;
    const totalMatch = xmlString.match(/Total="([^"]+)"/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;
    const iva = +(total - subtotal).toFixed(2);

    // Conceptos
    const conceptos: ConceptoExtraccion[] = [];
    const conceptoRegex = /<cfdi:Concepto\s+([^>]+)(?:\/>|>[\s\S]*?<\/cfdi:Concepto>)/gi;
    let match;
    let partidaIndex = 1;
    while ((match = conceptoRegex.exec(xmlString)) !== null) {
      const attrs = match[1];
      const descMatch = attrs.match(/Descripcion="([^"]+)"/i);
      const cantMatch = attrs.match(/Cantidad="([^"]+)"/i);
      const valMatch = attrs.match(/ValorUnitario="([^"]+)"/i);
      const impMatch = attrs.match(/Importe="([^"]+)"/i);
      const unidadMatch = attrs.match(/Unidad="([^"]+)"/i);
      const claveUnidadMatch = attrs.match(/ClaveUnidad="([^"]+)"/i);
      const claveProdMatch = attrs.match(/ClaveProdServ="([^"]+)"/i);

      conceptos.push({
        partida: partidaIndex++,
        claveProdServ: claveProdMatch ? claveProdMatch[1] : '76111500',
        descripcion: descMatch ? descMatch[1] : `Concepto ${partidaIndex}`,
        cantidad: cantMatch ? parseFloat(cantMatch[1]) : 1,
        unidad: unidadMatch ? unidadMatch[1] : 'Servicio',
        claveUnidad: claveUnidadMatch ? claveUnidadMatch[1] : 'E48',
        valorUnitario: valMatch ? parseFloat(valMatch[1]) : 0,
        importe: impMatch ? parseFloat(impMatch[1]) : 0,
        ivaTrasladado: +(impMatch ? parseFloat(impMatch[1]) * 0.16 : 0).toFixed(2),
      });
    }

    // Datos Timbre SAT
    const certSatMatch = xmlString.match(/NoCertificadoSAT="([^"]+)"/i);
    const noCertificadoSAT = certSatMatch ? certSatMatch[1] : '00001000000504465028';
    const selloSatMatch = xmlString.match(/SelloSAT="([^"]+)"/i);
    const selloSAT = selloSatMatch ? selloSatMatch[1] : '';

    return {
      uuid,
      folio,
      serie,
      fechaEmision,
      rfcEmisor,
      nombreEmisor,
      regimenFiscalEmisor,
      rfcReceptor,
      nombreReceptor,
      usoCfdi,
      moneda,
      tipoCambio,
      subtotal,
      iva,
      total,
      conceptos,
      noCertificadoSAT,
      selloSAT,
      cadenaOriginal: `||1.1|${uuid}|${fechaEmision}|${rfcEmisor}|${subtotal}|${total}||`,
    };
  }

  /**
   * Valida concordancia entre la orden de compra y el CFDI 4.0 extraído
   */
  public static validarContraOrden(
    factura: ExtraccionCfdiResultado,
    orden: { proveedorRfc: string; total: number; moneda: string }
  ): { valido: boolean; advertencias: string[] } {
    const advertencias: string[] = [];

    if (factura.rfcEmisor.toUpperCase() !== orden.proveedorRfc.toUpperCase()) {
      advertencias.push(
        `El RFC del emisor en el XML (${factura.rfcEmisor}) no coincide con el RFC del proveedor registrado en la orden (${orden.proveedorRfc}).`
      );
    }

    if (factura.total > orden.total + 1) {
      advertencias.push(
        `El importe total facturado ($${factura.total.toLocaleString()} ${factura.moneda}) excede el monto autorizado de la orden ($${orden.total.toLocaleString()} ${orden.moneda}).`
      );
    }

    return {
      valido: advertencias.length === 0,
      advertencias,
    };
  }
}

