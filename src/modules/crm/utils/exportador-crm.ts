'use client';

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ETIQUETAS_ETAPAS, PROBABILIDAD_POR_ETAPA, type EtapaOportunidad } from '../constants';
import type { EntradaCrearOportunidad, MetricasReporteCrm, OportunidadCrm } from '../types';
import type { ZonaComercial } from '@/config/types';

export async function exportarOportunidadesExcel(oportunidades: OportunidadCrm[]): Promise<void> {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'SIFYGSA Enterprise ERP';
  const hoja = libro.addWorksheet('Oportunidades CRM');

  hoja.columns = [
    { header: 'Folio', key: 'folio', width: 16 },
    { header: 'Título / Proyecto', key: 'titulo', width: 38 },
    { header: 'Cliente', key: 'clienteNombre', width: 28 },
    { header: 'Contacto', key: 'contactoNombre', width: 22 },
    { header: 'Email', key: 'contactoEmail', width: 26 },
    { header: 'Vendedor', key: 'vendedor', width: 22 },
    { header: 'Zona', key: 'zona', width: 14 },
    { header: 'Etapa', key: 'etapa', width: 16 },
    { header: 'Monto Estimado (MXN)', key: 'montoEstimado', width: 20 },
    { header: 'Probabilidad (%)', key: 'probabilidad', width: 16 },
    { header: 'Cierre Esperado', key: 'fechaCierreEsperada', width: 16 },
    { header: 'Periodo', key: 'periodo', width: 12 },
    { header: 'Etiquetas', key: 'etiquetas', width: 24 },
  ];

  hoja.getRow(1).font = { bold: true };

  oportunidades.forEach((o) => {
    hoja.addRow({
      folio: o.folio,
      titulo: o.titulo,
      clienteNombre: o.clienteNombre,
      contactoNombre: o.contactoNombre,
      contactoEmail: o.contactoEmail,
      vendedor: o.vendedor,
      zona: o.zona,
      etapa: ETIQUETAS_ETAPAS[o.etapa],
      montoEstimado: o.montoEstimado,
      probabilidad: o.probabilidad,
      fechaCierreEsperada: o.fechaCierreEsperada,
      periodo: o.periodo,
      etiquetas: o.etiquetas.join(', '),
    });
  });

  const buffer = await libro.xlsx.writeBuffer();
  descargarArchivoBinario(
    buffer,
    `SIFYGSA_Oportunidades_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export function exportarOportunidadesCsv(oportunidades: OportunidadCrm[]): void {
  const encabezados = [
    'titulo',
    'clienteNombre',
    'contactoNombre',
    'contactoEmail',
    'vendedor',
    'zona',
    'etapa',
    'montoEstimado',
    'fechaCierreEsperada',
    'periodo',
    'etiquetas',
  ];

  const filas = oportunidades.map((o) =>
    [
      `"${o.titulo.replace(/"/g, '""')}"`,
      `"${o.clienteNombre.replace(/"/g, '""')}"`,
      `"${o.contactoNombre.replace(/"/g, '""')}"`,
      o.contactoEmail,
      `"${o.vendedor}"`,
      o.zona,
      o.etapa,
      o.montoEstimado,
      o.fechaCierreEsperada,
      o.periodo,
      `"${o.etiquetas.join('|')}"`,
    ].join(',')
  );

  const contenido = [encabezados.join(','), ...filas].join('\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  descargarBlob(blob, `SIFYGSA_CRM_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportarReporteCrmPdf(
  metricas: MetricasReporteCrm,
  oportunidades: OportunidadCrm[]
): void {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text('SIFYGSA ERP — Reporte Ejecutivo de CRM & Ventas', 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Generado: ${new Date().toLocaleString('es-MX')} | Pipeline Activo: $${metricas.valorPipelineActivo.toLocaleString('es-MX')} MXN | Conversión: ${metricas.tasaConversion}%`,
    14,
    23
  );

  autoTable(doc, {
    startY: 29,
    head: [['Folio', 'Proyecto / Oportunidad', 'Cliente', 'Vendedor', 'Zona', 'Etapa', 'Monto (MXN)', 'Cierre']],
    body: oportunidades.map((o) => [
      o.folio,
      o.titulo,
      o.clienteNombre,
      o.vendedor,
      o.zona,
      ETIQUETAS_ETAPAS[o.etapa],
      `$${o.montoEstimado.toLocaleString('es-MX')}`,
      o.fechaCierreEsperada,
    ]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  doc.save(`SIFYGSA_Reporte_CRM_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function parsearCsvOportunidades(textoCsv: string): EntradaCrearOportunidad[] {
  const lineas = textoCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length <= 1) return [];

  return lineas.slice(1).map((linea) => {
    const cols = linea
      .split(',')
      .map((c) => c.trim().replace(/^"|"$/g, ''));

    const etapaRaw = (cols[6] ?? 'prospecto').toLowerCase() as EtapaOportunidad;
    const etapa: EtapaOportunidad = [
      'prospecto',
      'contacto',
      'propuesta',
      'negociacion',
      'ganado',
      'perdido',
    ].includes(etapaRaw)
      ? etapaRaw
      : 'prospecto';

    const zonaRaw = (cols[5] ?? 'Istmo') as ZonaComercial;
    const zona: ZonaComercial = ['Norte', 'Bajío', 'Centro', 'Sur', 'Istmo', 'Península'].includes(zonaRaw)
      ? zonaRaw
      : 'Istmo';

    const monto = Number(cols[7] ?? '0');

    return {
      titulo: cols[0] || 'Oportunidad Importada',
      clienteId: 'cli_001',
      clienteNombre: cols[1] || 'Cliente Industrial',
      contactoNombre: cols[2] || 'Contacto Comercial',
      contactoEmail: cols[3] || 'contacto@empresa.com',
      vendedor: cols[4] || 'Diego Ramírez Vega',
      zona,
      etapa,
      montoEstimado: Number.isFinite(monto) && monto >= 0 ? monto : 0,
      moneda: 'MXN',
      probabilidad: PROBABILIDAD_POR_ETAPA[etapa],
      fechaCierreEsperada: cols[8] || '2026-12-15',
      periodo: cols[9] || '2026-10',
      etiquetas: cols[10] ? cols[10].split('|').filter(Boolean) : ['Importado'],
      notas: 'Importado mediante carga masiva CSV.',
    };
  });
}

function descargarArchivoBinario(buffer: ExcelJS.Buffer, nombre: string, mime: string): void {
  const blob = new Blob([buffer], { type: mime });
  descargarBlob(blob, nombre);
}

function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
