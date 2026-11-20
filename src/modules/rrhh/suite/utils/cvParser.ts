import {
  formatPhoneMask,
  formatCurpMask,
  formatRfcMask,
  formatNssMask,
  sanitizePersonName,
  sanitizeCleanText
} from './formShield';

export interface CvDetectedCertification {
  name: string;
  institution?: string;
  docType: string;
}

export interface CvImportDraft {
  fullName: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  position: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  curp: string;
  rfc: string;
  nss: string;
  postalCode: string;
  streetAddress: string;
  contractType?: string;
  grossSalary?: string;
  assignedProject?: string;
  laborCategory?: string;
  institutionalEmail?: string;
  landlinePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  shoeSize?: string;
  overallSize?: string;
  bankName?: string;
  clabe?: string;
  summaryNotes: string;
  certifications: CvDetectedCertification[];
  rawText: string;
  fileName?: string;
  fileDataUrl?: string;
  fileSize?: number;
  fileMimeType?: string;
  detectedFields: string[];
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });

/**
 * Extrae texto de un archivo PDF usando pdfjs-dist (carga dinámica).
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pagesText: string[] = [];
  const maxPages = Math.min(pdf.numPages, 8);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const str = item.str;
      const y = Array.isArray(item.transform) ? Math.round(item.transform[5]) : null;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = str;
      } else {
        currentLine += currentLine && str && !currentLine.endsWith(' ') && !str.startsWith(' ') ? ` ${str}` : str;
      }
      if (y !== null) lastY = y;
    }

    if (currentLine.trim()) lines.push(currentLine.trim());
    pagesText.push(lines.join('\n'));
  }

  return pagesText.join('\n\n').trim();
};

/**
 * Extrae texto de un archivo Word (.docx) descomprimiendo word/document.xml con API nativa del navegador.
 */
const extractTextFromDocx = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');

  let offset = 0;
  let xmlContent = '';

  while (offset + 30 < bytes.length) {
    // Firma de Local File Header ZIP: 0x04034b50
    if (view.getUint32(offset, true) !== 0x04034b50) {
      break;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLen;
    const entryName = decoder.decode(bytes.subarray(nameStart, nameEnd));
    const dataStart = nameEnd + extraLen;
    const dataEnd = dataStart + compressedSize;

    if (entryName === 'word/document.xml' && compressedSize > 0 && dataEnd <= bytes.length) {
      const entryData = bytes.subarray(dataStart, dataEnd);
      if (compressionMethod === 0) {
        xmlContent = decoder.decode(entryData);
      } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(entryData);
        writer.close();
        const decompressed = await new Response(ds.readable).arrayBuffer();
        xmlContent = decoder.decode(decompressed);
      }
      break;
    }

    if (compressedSize === 0 && (view.getUint16(offset + 6, true) & 0x08) !== 0) {
      // Si usa data descriptor, buscamos el siguiente header PK\x03\x04
      let nextIdx = dataStart;
      let found = false;
      while (nextIdx + 4 < bytes.length) {
        if (view.getUint32(nextIdx, true) === 0x04034b50) {
          offset = nextIdx;
          found = true;
          break;
        }
        nextIdx += 1;
      }
      if (!found) break;
    } else {
      offset = dataEnd;
    }
  }

  if (!xmlContent) return '';

  // Convertir párrafos XML de Word en líneas legibles
  return xmlContent
    .replace(/<w:tab[^>]*\/>/g, ' ')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'san', 'santa', 'da', 'do', 'mc', 'mac']);

export const splitSpanishFullName = (
  fullName: string
): { firstName: string; paternalSurname: string; maternalSurname: string } => {
  const cleaned = sanitizePersonName(fullName).value.trim();
  if (!cleaned) {
    return { firstName: '', paternalSurname: '', maternalSurname: '' };
  }

  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  // Agrupar partículas ("de la", "del", "de los") con la palabra siguiente
  const tokens: string[] = [];
  let i = 0;
  while (i < rawTokens.length) {
    let part = rawTokens[i];
    while (PARTICLES.has(part.toLowerCase()) && i + 1 < rawTokens.length) {
      i += 1;
      part = `${part} ${rawTokens[i]}`;
    }
    tokens.push(part);
    i += 1;
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], paternalSurname: '', maternalSurname: '' };
  }
  if (tokens.length === 2) {
    return { firstName: tokens[0], paternalSurname: tokens[1], maternalSurname: '' };
  }
  if (tokens.length === 3) {
    return { firstName: tokens[0], paternalSurname: tokens[1], maternalSurname: tokens[2] };
  }
  // 4+ bloques: últimos 2 son apellidos, resto son nombres de pila
  return {
    firstName: tokens.slice(0, tokens.length - 2).join(' '),
    paternalSurname: tokens[tokens.length - 2],
    maternalSurname: tokens[tokens.length - 1]
  };
};

const toTitleCaseName = (value: string): string => {
  const lowerWords = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
  return value
    .trim()
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && lowerWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

const HEADER_NOISE_REGEX =
  /^(curr[ií]culum(\s+vitae)?|c\.?v\.?|hoja\s+de\s+vida|resumen(\s+profesional)?|perfil(\s+profesional)?|datos\s+personales|informaci[oó]n\s+personal|contacto|experiencia(\s+laboral)?|educaci[oó]n|formaci[oó]n|habilidades|objetivo(\s+profesional)?|acerca\s+de\s+m[ií])$/i;

const inferLocationFromText = (text: string): string => {
  const lower = text.toLowerCase();
  if (/minatitl[aá]n|coatzacoalcos|cosoleacaque|nanchital|las\s+choapas/i.test(lower)) {
    return 'Minatitlán, Ver.';
  }
  if (/mapachapa/i.test(lower)) return 'Mapachapa, Ver.';
  if (/comalcalco|para[ií]so|villahermosa|tabasco|dos\s+bocas/i.test(lower)) {
    return 'Comalcalco, Tab.';
  }
  if (/xalapa|jalapa/i.test(lower)) return 'Xalapa, Ver.';
  if (/ciudad\s+del\s+carmen|cd\.?\s+del\s+carmen|campeche/i.test(lower)) {
    return 'Ciudad del Carmen, Camp.';
  }
  if (/m[eé]rida|yucat[aá]n/i.test(lower)) return 'Mérida, Yuc.';
  return '';
};

const inferDepartmentFromText = (text: string, location: string): string => {
  const lower = text.toLowerCase();
  if (/\b(hse|seguridad\s+industrial|seguridad\s+e\s+higiene|sspa|protecci[oó]n\s+civil|medio\s+ambiente|rig\s*pass)\b/i.test(lower)) {
    return location === 'Comalcalco, Tab.' ? 'HSE (Comalcalco)' : 'HSE (Minatitlán)';
  }
  if (/\b(recursos\s+humanos|rrhh|reclutamiento|n[oó]mina|capacitaci[oó]n|talento\s+humano)\b/i.test(lower)) {
    return 'Recursos Humanos';
  }
  if (/\b(compras|adquisiciones|proveedores|procura|abastecimiento)\b/i.test(lower)) {
    return 'Compras';
  }
  if (/\b(calidad|iso\s*9001|sgi|auditor[ií]a\s+de\s+calidad|control\s+de\s+calidad|qa\/qc)\b/i.test(lower)) {
    return 'Calidad';
  }
  if (/\b(almac[eé]n|inventario|log[ií]stica|bodega|entradas\s+y\s+salidas)\b/i.test(lower)) {
    return 'Almacén';
  }
  if (/\b(ventas|comercial|cotizaciones|definici[oó]n\s+de\s+soluciones|ejecutivo\s+de\s+cuenta)\b/i.test(lower)) {
    return 'Ventas';
  }
  if (/\b(ti|sistemas|soporte\s+t[eé]cnico|infraestructura|redes|desarrollador|programador|software)\b/i.test(lower)) {
    return 'Infraestructura';
  }
  if (/\b(medici[oó]n\s+y\s+control|control\s+de\s+proyectos|pmo|planeaci[oó]n\s+de\s+proyectos)\b/i.test(lower)) {
    return 'Medición y Control de Proyectos';
  }
  if (/\b(administraci[oó]n|contabilidad|contador|finanzas|facturaci[oó]n|tesorer[ií]a|auxiliar\s+administrativo)\b/i.test(lower)) {
    return 'Administración';
  }
  if (/\b(ingenier[ií]a|instrumentaci[oó]n|automatizaci[oó]n|fire\s*&?\s*gas|f&g|el[eé]ctric[oa]|mec[aá]nic[oa]|electr[oó]nic[oa]|mecatr[oó]nic[oa])\b/i.test(lower)) {
    return 'Ingeniería';
  }
  if (/\b(mantenimiento|servicio\s+t[eé]cnico|t[eé]cnico\s+de\s+campo|operador|servicios\s+industriales)\b/i.test(lower)) {
    return 'Servicios';
  }
  return '';
};

const extractPositionFromLines = (lines: string[], fullName: string): string => {
  // 1. Buscar etiqueta explícita
  for (const line of lines.slice(0, 35)) {
    const labelMatch = line.match(
      /^(?:puesto(?:\s+deseado|\s+actual)?|cargo|perfil(?:\s+profesional)?|t[ií]tulo|especialidad|profesi[oó]n)\s*[:\-]\s*(.+)$/i
    );
    if (labelMatch && labelMatch[1].trim().length >= 3 && labelMatch[1].trim().length <= 75) {
      return sanitizeCleanText(labelMatch[1].trim()).value;
    }
  }

  // 2. Buscar una línea corta justo debajo del nombre o con palabras clave de puesto/profesión
  const roleKeywords =
    /\b(ingenier[oa]|t[eé]cnic[oa]|auxiliar|asistente|coordinador[a]?|supervisor[a]?|analista|gerente|jefe|especialista|contador[a]?|licenciad[oa]|administrador[a]?|desarrollador[a]?|programador[a]?|operador[a]?|becari[oa]|almacenista|comprador[a]?|auditor[a]?|ejecutiv[oa]|inspector[a]?|soldador|electricista|instrumentista)\b/i;

  const lowerName = fullName.toLowerCase();
  for (const line of lines.slice(0, 18)) {
    const clean = line.trim();
    if (!clean || clean.length < 4 || clean.length > 72) continue;
    if (clean.toLowerCase() === lowerName) continue;
    if (/@|https?:|www\.|\d{7,}/i.test(clean)) continue;
    if (HEADER_NOISE_REGEX.test(clean)) continue;
    if (roleKeywords.test(clean)) {
      return sanitizeCleanText(clean.replace(/^[•\-–|·\s]+/, '').trim()).value;
    }
  }

  return '';
};

const extractFullNameFromLines = (lines: string[]): string => {
  // 1. Etiqueta explícita "Nombre:"
  for (const line of lines.slice(0, 25)) {
    const match = line.match(/^(?:nombre(?:\s+completo)?|candidato|postulante)\s*[:\-]\s*(.+)$/i);
    if (match && match[1]) {
      const candidate = sanitizePersonName(match[1]).value.trim();
      if (candidate.split(/\s+/).length >= 2 && candidate.length <= 65) {
        return toTitleCaseName(candidate);
      }
    }
  }

  // 2. Primera línea prominente que parezca un nombre propio (2 a 5 palabras alfabéticas)
  for (const line of lines.slice(0, 12)) {
    const clean = line.replace(/[•|·]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 5 || clean.length > 60) continue;
    if (HEADER_NOISE_REGEX.test(clean)) continue;
    if (/[@\d/:]|https?:|www\.|tel[eé]fono|correo|direcci[oó]n|domicilio|edad|fecha|ingenier[oa]|licenciad[oa]|t[eé]cnic[oa]/i.test(clean)) {
      continue;
    }
    const words = clean.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'-]+$/.test(w))) {
      return toTitleCaseName(clean);
    }
  }

  return '';
};

const extractCertifications = (lines: string[]): CvDetectedCertification[] => {
  const results: CvDetectedCertification[] = [];
  const seen = new Set<string>();
  const certRegex =
    /\b(dc-?3|rig\s*pass|stps|primeros\s+auxilios|trabajos?\s+en\s+alturas?|espacios?\s+confinados?|iso\s*\d{4,5}|nfpa|autocad|solidworks|sap|excel\s+avanzado|seguridad\s+industrial|manejo\s+defensivo|combate\s+contra\s+incendios?|bloqueo\s+y\s+etiquetado|loto|h2s|certificaci[oó]n\s+en\s+.{3,45}|curso\s+(?:de|en)\s+.{3,45}|diplomado\s+(?:de|en)\s+.{3,45})\b/i;

  for (const line of lines) {
    const clean = line.replace(/^[•\-–*·\s]+/, '').trim();
    if (!clean || clean.length < 4 || clean.length > 110) continue;
    if (!certRegex.test(clean)) continue;
    // Evitar párrafos largos de experiencia
    if (clean.split(/\s+/).length > 14) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const isDc3 = /dc-?3|stps|rig\s*pass|alturas|confinados|incendio|h2s|loto/i.test(clean);
    results.push({
      name: sanitizeCleanText(clean).value,
      institution: /stps/i.test(clean) ? 'STPS' : /pemex/i.test(clean) ? 'PEMEX' : '',
      docType: isDc3 ? 'Certificación Técnica / DC-3' : 'Curso / Constancia de Capacitación'
    });

    if (results.length >= 6) break;
  }

  return results;
};

/**
 * Analiza texto libre de un CV y devuelve los datos estructurados para prellenar Registro del Personal.
 */
export const parseCvText = (
  rawText: string,
  fileMeta?: { fileName?: string; fileDataUrl?: string; fileSize?: number; fileMimeType?: string }
): CvImportDraft => {
  const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = normalizedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Correo electrónico
  const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // Teléfono mexicano (10 dígitos, con o sin +52 / 52)
  let phone = '';
  const phoneMatches = normalizedText.match(/(?:\+?52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?){2,4}\d{2,4}/g) || [];
  for (const candidate of phoneMatches) {
    let digits = candidate.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) digits = digits.slice(2);
    if (digits.length === 13 && digits.startsWith('521')) digits = digits.slice(3);
    if (digits.length === 10 && !/^0+$/.test(digits)) {
      phone = formatPhoneMask(digits).formatted;
      break;
    }
  }

  // CURP
  const curpMatch = normalizedText
    .toUpperCase()
    .match(/\b[A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d\b/);
  const curp = curpMatch ? formatCurpMask(curpMatch[0]).value : '';

  // RFC (evitando que coincida con los primeros 13 chars de la CURP si no viene explícito)
  let rfc = '';
  const rfcLabelMatch = normalizedText
    .toUpperCase()
    .match(/R\.?F\.?C\.?\s*[:\-]?\s*([A-ZÑ&]{3,4}\d{6}[A-Z\d]{3})/);
  if (rfcLabelMatch) {
    rfc = formatRfcMask(rfcLabelMatch[1]).value;
  } else {
    const rfcAny = normalizedText.toUpperCase().match(/\b[A-ZÑ&]{4}\d{6}[A-Z\d]{3}\b/);
    if (rfcAny && (!curp || !curp.startsWith(rfcAny[0]))) {
      rfc = formatRfcMask(rfcAny[0]).value;
    }
  }

  // NSS (11 dígitos junto a NSS / IMSS / Seguro Social / Nº de seguridad social)
  const nssMatch = normalizedText.match(
    /(?:N\.?S\.?S\.?|IMSS|N[º°O.]?\s*(?:DE\s+)?SEGURIDAD\s+SOCIAL|SEGURO\s+SOCIAL)\s*[:\-#]?\s*(\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{4}[\s-]?\d)/i
  );
  const nss = nssMatch ? formatNssMask(nssMatch[1]).formatted : '';

  // Código Postal
  const cpMatch = normalizedText.match(/(?:C\.?\s*P\.?|C[ÓO]DIGO\s+POSTAL)\s*[:\-#]?\s*(\d{5})\b/i);
  const postalCode = cpMatch ? cpMatch[1] : '';

  // Domicilio / Calle
  let streetAddress = '';
  for (const line of lines.slice(0, 35)) {
    const addrMatch = line.match(/^(?:direcci[oó]n|domicilio|ubicaci[oó]n)\s*[:\-]\s*(.+)$/i);
    if (addrMatch && addrMatch[1].trim().length >= 5) {
      streetAddress = sanitizeCleanText(addrMatch[1].trim()).value.slice(0, 90);
      break;
    }
  }

  // Tipo de sangre (si aparece en ficha / Excel)
  const bloodMatch = normalizedText.match(
    /(?:tipo\s+de\s+sangre|grupo\s+sangu[ií]neo|sangre)\s*[:\-]?\s*(AB|A|B|O)\s*([+-]|positivo|negativo)/i
  );
  const bloodType = bloodMatch
    ? `${bloodMatch[1].toUpperCase()}${bloodMatch[2].toLowerCase().startsWith('p') || bloodMatch[2] === '+' ? '+' : '-'}`
    : '';

  // CLABE Interbancaria (18 dígitos junto a CLABE)
  const clabeMatch = normalizedText.match(/CLABE\s*[:\-#]?\s*(\d[\d\s-]{17,22})/i);
  const clabeDigits = clabeMatch ? clabeMatch[1].replace(/\D/g, '') : '';
  const clabe = clabeDigits.length === 18 ? clabeDigits : '';

  const fullName = extractFullNameFromLines(lines);
  const { firstName, paternalSurname, maternalSurname } = splitSpanishFullName(fullName);
  const position = extractPositionFromLines(lines, fullName);
  const location = inferLocationFromText(normalizedText);
  const department = inferDepartmentFromText(normalizedText, location);
  const certifications = extractCertifications(lines);

  const detectedFields: string[] = [];
  if (fullName) detectedFields.push('Nombre');
  if (position) detectedFields.push('Puesto');
  if (department) detectedFields.push('Departamento sugerido');
  if (location) detectedFields.push('Sede');
  if (email) detectedFields.push('Correo');
  if (phone) detectedFields.push('Teléfono');
  if (curp) detectedFields.push('CURP');
  if (rfc) detectedFields.push('RFC');
  if (nss) detectedFields.push('NSS');
  if (postalCode) detectedFields.push('Código Postal');
  if (streetAddress) detectedFields.push('Domicilio');
  if (bloodType) detectedFields.push('Tipo de Sangre');
  if (clabe) detectedFields.push('CLABE');
  if (certifications.length > 0) detectedFields.push(`${certifications.length} curso(s)`);

  return {
    fullName,
    firstName,
    paternalSurname,
    maternalSurname,
    position,
    department,
    location,
    email,
    phone,
    curp,
    rfc,
    nss,
    postalCode,
    streetAddress,
    bloodType,
    clabe,
    summaryNotes: fileMeta?.fileName ? `Datos prellenados desde CV (${fileMeta.fileName}).` : 'Datos prellenados desde CV.',
    certifications,
    rawText: normalizedText,
    fileName: fileMeta?.fileName,
    fileDataUrl: fileMeta?.fileDataUrl,
    fileSize: fileMeta?.fileSize,
    fileMimeType: fileMeta?.fileMimeType,
    detectedFields
  };
};

/**
 * Extrae texto legible de un archivo Excel (.xlsx / .xls) preservando pares Etiqueta: Valor
 * y detectando automáticamente hojas tabulares (Fila 1 encabezados, Fila 2+ datos).
 */
const extractTextFromExcel = async (file: File): Promise<string> => {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames.slice(0, 2)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
      .map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '').trim()) : []))
      .filter((row) => row.some(Boolean));

    if (rows.length >= 2) {
      const firstRow = rows[0];
      const looksLikeHeaderRow = firstRow.some((cell) =>
        /^(nombre|nombres|nombre completo|colaborador|empleado|curp|rfc|nss|n[º°o.]?\s*(de\s*)?seguridad\s*social|correo|puesto|departamento|tel[eé]fono)/i.test(
          cell
        )
      );

      if (looksLikeHeaderRow) {
        // Hoja tabular: emparejar encabezados de fila 1 con la primera fila de datos (fila 2)
        const dataRow = rows[1];
        firstRow.forEach((header, idx) => {
          const val = (dataRow[idx] || '').trim();
          if (header && val) {
            lines.push(`${header}: ${val}`);
          }
        });
        break;
      }
    }

    for (const row of rows) {
      const cells = row.filter(Boolean);
      if (cells.length === 0) continue;
      if (cells.length === 2 && cells[0].length <= 35 && !cells[0].endsWith(':')) {
        lines.push(`${cells[0]}: ${cells[1]}`);
      } else {
        lines.push(cells.join(' '));
      }
    }
  }

  return lines.join('\n').trim();
};

/**
 * Procesa un archivo CV (PDF, DOCX, XLSX/XLS, TXT o imagen) y devuelve el borrador listo para Registro del Personal.
 */
export const parseCvFile = async (file: File): Promise<CvImportDraft> => {
  const lowerName = file.name.toLowerCase();
  const fileDataUrl = await readFileAsDataUrl(file);
  let extractedText = '';

  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    extractedText = await extractTextFromPdf(file);
  } else if (
    lowerName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    extractedText = await extractTextFromDocx(file);
  } else if (
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  ) {
    extractedText = await extractTextFromExcel(file);
  } else if (
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.csv') ||
    file.type.startsWith('text/')
  ) {
    extractedText = await file.text();
  } else if (file.type.startsWith('image/')) {
    // Imagen: se adjunta al expediente y el usuario puede completar o pegar el texto
    extractedText = '';
  } else {
    throw new Error('Formato no soportado. Usa un archivo PDF, Word (.docx), Excel (.xlsx), texto (.txt) o imagen.');
  }

  return parseCvText(extractedText, {
    fileName: file.name,
    fileDataUrl,
    fileSize: file.size,
    fileMimeType: file.type || 'application/octet-stream'
  });
};
