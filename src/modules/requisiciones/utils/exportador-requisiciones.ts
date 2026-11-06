'use client';

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ETIQUETAS_ESTADO_REQUISICION } from '../constants';
import type { Requisicion } from '../types';

export async function exportarRequisicionesExcel(requisiciones: Requisicion[]): Promise<void> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Requisiciones');

  hoja.columns = [
    { header: 'Folio', key: 'folio', width: 18 },
    { header: 'Contrato', key: 'contrato', width: 22 },
    { header: 'Solicitante', key: 'solicitante', width: 24 },
    { header: 'Área', key: 'area', width: 26 },
    { header: 'Prioridad', key: 'prioridad', width: 12 },
    { header: 'Estado', key: 'estado', width: 22 },
    { header: 'Subtotal (MXN)', key: 'subtotal', width: 16 },
    { header: 'IVA (MXN)', key: 'iva', width: 14 },
    { header: 'Total (MXN)', key: 'total', width: 16 },
    { header: 'Fecha Requerida', key: 'fechaRequerida', width: 16 },
  ];

  hoja.getRow(1).font = { bold: true };

  requisiciones.forEach((r) => {
    hoja.addRow({
      folio: r.folio,
      contrato: r.contrato,
      solicitante: r.solicitante,
      area: r.area,
      prioridad: r.prioridad.toUpperCase(),
      estado: ETIQUETAS_ESTADO_REQUISICION[r.estado],
      subtotal: r.subtotal,
      iva: r.iva,
      total: r.total,
      fechaRequerida: r.fechaRequerida,
    });
  });

  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SIFYGSA_Requisiciones_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarRequisicionesPdf(requisiciones: Requisicion[]): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(15);
  doc.text('SIFYGSA ERP — Reporte de Requisiciones y Control Presupuestal', 14, 16);
  doc.setFontSize(9.5);
  doc.text(`Fecha de corte: ${new Date().toLocaleString('es-MX')}`, 14, 22);

  autoTable(doc, {
    startY: 27,
    head: [['Folio', 'Contrato', 'Solicitante', 'Área', 'Prioridad', 'Estado', 'Total (MXN)', 'Fecha Req.']],
    body: requisiciones.map((r) => [
      r.folio,
      r.contrato,
      r.solicitante,
      r.area,
      r.prioridad.toUpperCase(),
      ETIQUETAS_ESTADO_REQUISICION[r.estado],
      `$${r.total.toLocaleString('es-MX')}`,
      r.fechaRequerida,
    ]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  doc.save(`SIFYGSA_Requisiciones_${new Date().toISOString().slice(0, 10)}.pdf`);
}
