'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { obtenerOrdenesCompra } from '../data/mock-data';
import { useCompras } from '../context/ComprasContext';
import { NuevaOrdenCompraPage } from './NuevaOrdenCompraPage';
import type { EstatusOrdenCompra } from '../types';

export type EstatusOrdenDetalle =
  | EstatusOrdenCompra
  | 'anulada_reversada'
  | 'autorizada_emitida'
  | 'en_proceso';

/**
 * Muestra y permite editar una Orden de Compra existente utilizando
 * el mismo formato de asistente de 5 pasos de NuevaOrdenCompraPage.
 */
export const DetalleOrdenCompraPage: React.FC = () => {
  const searchParams = useSearchParams();
  const params = useParams();

  const ocParam = (
    searchParams?.get('oc') ||
    searchParams?.get('folio') ||
    searchParams?.get('id') ||
    (params?.id as string) ||
    ''
  ).trim();

  const { ordenes: ordenesContext } = useCompras();

  const ordenExistente = useMemo(() => {
    const ordenes =
      ordenesContext && ordenesContext.length > 0
        ? ordenesContext
        : obtenerOrdenesCompra();
    if (!ocParam) {
      return ordenes.find((o) => o.folio === 'PO-2026-0173') || ordenes[0] || null;
    }
    return (
      ordenes.find(
        (o) =>
          o.folio.toLowerCase() === ocParam.toLowerCase() ||
          o.id.toLowerCase() === ocParam.toLowerCase()
      ) || null
    );
  }, [ordenesContext, ocParam]);

  if (!ordenExistente) {
    return (
      <div className="oc-wizard-container">
        <div className="oc-card text-center py-12 space-y-4">
          <span className="material-symbols-outlined text-4xl text-slate-400">
            search_off
          </span>
          <h2 className="text-lg font-bold text-on-surface">
            Orden de compra no encontrada ({ocParam})
          </h2>
          <Link
            href="/compras/ordenes"
            className="cp-btn cp-btn-primary inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver a Órdenes de Compra
          </Link>
        </div>
      </div>
    );
  }

  return <NuevaOrdenCompraPage key={ordenExistente.id} ordenExistente={ordenExistente} />;
};

export default DetalleOrdenCompraPage;
