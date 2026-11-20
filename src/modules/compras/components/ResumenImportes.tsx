'use client';

import React from 'react';

export interface ResumenImportesProps {
  subtotal: number;
  iva: number;
  retenciones?: number;
  total: number;
  moneda?: string;
  includedCount?: number;
  totalCount?: number;
  className?: string;
}

export const ResumenImportes: React.FC<ResumenImportesProps> = ({
  subtotal,
  iva,
  retenciones = 0,
  total,
  moneda = 'MXN',
  className = '',
}) => {
  const formatMoney = (n: number) =>
    '$' +
    n.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className={`oc-totals-grid ${className}`}>
      {/* Subtotal */}
      <div className="oc-total-box">
        <div className="oc-total-label">Subtotal</div>
        <div className="oc-total-amount">{formatMoney(subtotal)}</div>
      </div>

      {/* IVA 16% */}
      <div className="oc-total-box">
        <div className="oc-total-label">IVA 16%</div>
        <div className="oc-total-amount">{formatMoney(iva)}</div>
      </div>

      {/* Retenciones */}
      {retenciones > 0 && (
        <div className="oc-total-box" style={{ borderColor: '#fca5a5' }}>
          <div className="oc-total-label" style={{ color: '#dc2626' }}>Retenciones</div>
          <div className="oc-total-amount" style={{ color: '#dc2626' }}>-{formatMoney(retenciones)}</div>
        </div>
      )}

      {/* Total a pagar */}
      <div className="oc-total-box highlight">
        <div className="oc-total-label">Total a pagar ({moneda})</div>
        <div className="oc-total-amount">{formatMoney(total)}</div>
      </div>
    </div>
  );
};

export default ResumenImportes;
