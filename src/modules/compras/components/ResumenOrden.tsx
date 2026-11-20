'use client';

import React from 'react';
import { ResumenImportes } from './ResumenImportes';

interface ResumenOrdenProps {
  folioOC: string;
  ubicacion: string;
  proveedor: string;
  condicionPago: string;
  partidasIncluidasCount: number;
  totalPartidasCount: number;
  aprobador: string;
  subtotal: number;
  iva: number;
  total: number;
  usoCfdi?: string;
  metodoPago?: string;
  exigirFactura?: boolean;
  facturaInfo?: string;
  onGoToStep: (step: number) => void;
}

export const ResumenOrden: React.FC<ResumenOrdenProps> = ({
  folioOC,
  ubicacion,
  proveedor,
  condicionPago,
  partidasIncluidasCount,
  totalPartidasCount,
  aprobador,
  subtotal,
  iva,
  total,
  usoCfdi,
  metodoPago,
  exigirFactura,
  facturaInfo,
  onGoToStep,
}) => {
  const summaryRows = [
    {
      label: 'Orden',
      value: folioOC || 'SFG-C259-LVT-OC-127/26',
      step: 1,
    },
    {
      label: 'Ubicación',
      value: ubicacion || '—',
      step: 1,
    },
    {
      label: 'Proveedor',
      value: proveedor || '—',
      step: 2,
    },
    {
      label: 'Condiciones de pago',
      value: condicionPago || '—',
      step: 2,
    },
    {
      label: 'Partidas incluidas',
      value: `${partidasIncluidasCount} de ${totalPartidasCount}`,
      step: 3,
    },
    {
      label: 'Aprobador',
      value: aprobador || '—',
      step: 4,
    },
    {
      label: 'Uso de CFDI',
      value: usoCfdi || 'G03 - Gastos en general',
      step: 4,
    },
    {
      label: 'Método de pago SAT',
      value: metodoPago || 'PUE - Pago en una sola exhibición',
      step: 4,
    },
    {
      label: 'Facturación CFDI 4.0',
      value: facturaInfo || 'Pendiente de recepción (Post-emisión)',
      step: 4,
    },
    {
      label: 'Control de Factura',
      value: exigirFactura ? 'Exigir factura adjunta antes de cerrar' : 'Opcional',
      step: 4,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="oc-summary-stack">
        {summaryRows.map((row, idx) => (
          <div key={idx} className="oc-summary-row">
            <span className="oc-summary-key">{row.label}</span>
            <div className="oc-summary-val-wrap">
              <span className="oc-summary-val">{row.value}</span>
              <button
                type="button"
                onClick={() => onGoToStep(row.step)}
                className="oc-summary-edit-btn"
                title={`Ir a la etapa ${row.step}`}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <ResumenImportes subtotal={subtotal} iva={iva} total={total} />
    </div>
  );
};

