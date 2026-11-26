'use client';

import React, { useState } from 'react';
import type { PartidaOrdenForm } from '../data/orden-compra-catalog';
import {
  DEPARTAMENTOS_CATALOG,
  CLIENTES_TRABAJO_CATALOG,
  ACTIVITY_CODES_CATALOG,
} from '../data/orden-compra-catalog';

export interface PartidasListProps {
  items: PartidaOrdenForm[];
  tipoOrden?: 'normal' | 'directa';
  proveedorOrden: string;
  onToggleItem: (id: string, on: boolean) => void;
  onUpdateItem: (id: string, patch: Partial<PartidaOrdenForm>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  expandirTodas?: boolean;
  onAddItem?: () => void;
}

/**
 * Cálculo fiscal por partida siguiendo el estándar NetSuite:
 * - Importe = Cantidad × V. Unitario
 * - Tasa estándar IVA 16% (o 4% retención flete)
 * - Importe de Impuestos = Importe × Tasa (ej. 16% o 20% bruto)
 * - Imp. Bruto = Importe + Importe de Impuestos
 */
export const calcularTotalesPartida = (item: PartidaOrdenForm) => {
  const qty = Math.max(Number(item.q) || 0, 0);
  const precioUnitario = Math.max(Number(item.p) || 0, 0);
  const importe = qty * precioUnitario;

  let ivaTrasladado = 0;
  let retencionIva = 0;
  let retencionIsr = 0;

  switch (item.tasaFiscal) {
    case 'RET_IVA_4':
      // Estándar NetSuite en fletes (ej. 6,590.06 -> 1,318.01 impuestos y 7,644.47 bruto)
      ivaTrasladado = importe * 0.16;
      retencionIva = importe * 0.04;
      break;
    case 'RESICO_1_25':
      ivaTrasladado = importe * 0.16;
      retencionIsr = importe * 0.0125;
      break;
    case 'RET_IVA_10_66':
      ivaTrasladado = importe * 0.16;
      retencionIva = importe * 0.1066;
      retencionIsr = importe * 0.10;
      break;
    case 'IVA_0':
    case 'EXENTO':
      ivaTrasladado = 0;
      break;
    case 'IVA_16':
    default:
      ivaTrasladado = importe * 0.16;
      break;
  }

  // En NetSuite, para fletes con retención se refleja el cálculo desglosado
  const importeImpuestos =
    item.tasaFiscal === 'RET_IVA_4'
      ? importe * 0.2
      : ivaTrasladado + retencionIva + retencionIsr;

  const impBruto = importe + (item.tasaFiscal === 'RET_IVA_4' ? importe * 0.16 : ivaTrasladado);

  return {
    importe,
    ivaTrasladado,
    retencionIva,
    retencionIsr,
    importeImpuestos,
    impBruto,
  };
};

export const PartidasList: React.FC<PartidasListProps> = ({
  items,
  proveedorOrden,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onAddItem,
}) => {
  // Modo de visualización: 'tabla' (por defecto en desktop) o 'tarjetas' (en móviles o al togglear)
  const [modoVista, setModoVista] = useState<'tabla' | 'tarjetas'>('tabla');
  const [partidaExpandidaId, setPartidaExpandidaId] = useState<string | null>(null);

  const formatMoney = (n: number) =>
    n.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Totales de Artículos y Gastos (como en NetSuite)
  const totalImportesArticulos = items.reduce((sum, item) => {
    if (!item.on) return sum;
    const calc = calcularTotalesPartida(item);
    return sum + calc.importe;
  }, 0);

  const totalGastos = 0.0;

  // Manejo de cambios con recálculo automático y validaciones
  const handleCantidadChange = (id: string, val: string) => {
    const parsed = parseFloat(val);
    const safeVal = isNaN(parsed) ? 0 : parsed;
    onUpdateItem(id, { q: safeVal });
  };

  const handlePrecioChange = (id: string, val: string) => {
    const parsed = parseFloat(val);
    const safeVal = isNaN(parsed) ? 0 : parsed;
    onUpdateItem(id, { p: safeVal });
  };

  const handleImprimir = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* ── BARRA SUPERIOR DE TOTALES ESTILO NETSUITE ── */}
      <div className="ns-summary-bar rounded-t-md">
        <div className="flex items-center flex-wrap gap-2">
          <span className="ns-summary-item text-[#1e293b] dark:text-[#f1f5f9]">
            <strong>Artículos</strong>{' '}
            <span className="font-mono text-[var(--primary,#1D4ED8)] dark:text-blue-400">
              {formatMoney(totalImportesArticulos)}
            </span>
          </span>
          <span className="ns-summary-dot">•</span>
          <span className="ns-summary-item text-slate-600 dark:text-slate-300">
            <strong>Gastos</strong>{' '}
            <span className="font-mono">{formatMoney(totalGastos)}</span>
          </span>
          <span className="text-xs text-slate-500 ml-2">
            ({items.length} {items.length === 1 ? 'partida' : 'partidas'})
          </span>
        </div>

        {/* Selector de Vista: Tabla NetSuite vs Tarjetas */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded border border-slate-300 dark:border-slate-700 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setModoVista('tabla')}
              className={`px-2.5 py-1 font-semibold flex items-center gap-1 transition cursor-pointer ${
                modoVista === 'tabla'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
              title="Vista en tabla horizontal estilo NetSuite"
            >
              <span className="material-symbols-outlined text-[14px]">table_chart</span>
              <span className="hidden sm:inline">Tabla NetSuite</span>
            </button>
            <button
              type="button"
              onClick={() => setModoVista('tarjetas')}
              className={`px-2.5 py-1 font-semibold flex items-center gap-1 transition cursor-pointer ${
                modoVista === 'tarjetas'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
              title="Vista en tarjetas agrupadas por secciones"
            >
              <span className="material-symbols-outlined text-[14px]">view_agenda</span>
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
          </div>

          {onAddItem && (
            <button
              type="button"
              onClick={onAddItem}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>+ Partida</span>
            </button>
          )}
        </div>
      </div>

      {/* ── CONDICIONAL: VISTA TABLA HORIZONTAL CON COLUMNA STICKY ── */}
      {modoVista === 'tabla' ? (
        <div className="ns-table-container">
          <table className="ns-table">
            <thead>
              <tr>
                {/* 1. ARTÍCULO (Columna Fija Sticky a la izquierda) */}
                <th className="ns-sticky-col" style={{ width: 220 }}>
                  ARTÍCULO
                </th>
                {/* 2. NOMBRE DEL PROVEEDOR */}
                <th style={{ minWidth: 200 }}>NOMBRE DEL PROVEEDOR</th>
                {/* 3. DESCRIPCIÓN */}
                <th style={{ minWidth: 320 }}>DESCRIPCIÓN</th>
                {/* 4. DEPARTAMENTO */}
                <th style={{ minWidth: 180 }}>DEPARTAMENTO</th>
                {/* 5. DISPONIBLE */}
                <th style={{ minWidth: 100, textAlign: 'center' }}>DISPONIBLE</th>
                {/* 6. DISPONIBLE (ALTERNO) */}
                <th style={{ minWidth: 130, textAlign: 'center' }}>DISPONIBLE (ALTERNO)</th>
                {/* 7. RECIBIDO (Solo lectura) */}
                <th style={{ minWidth: 90, textAlign: 'center' }}>RECIBIDO</th>
                {/* 8. FACTURADO (Solo lectura) */}
                <th style={{ minWidth: 90, textAlign: 'center' }}>FACTURADO</th>
                {/* 9. CANTIDAD */}
                <th style={{ minWidth: 90, textAlign: 'center' }}>CANTIDAD</th>
                {/* 10. V. UNITARIO */}
                <th style={{ minWidth: 120, textAlign: 'right' }}>V. UNITARIO</th>
                {/* 11. IMPORTE (cantidad × V. unitario) */}
                <th style={{ minWidth: 120, textAlign: 'right' }}>IMPORTE</th>
                {/* 12. OPCIONES */}
                <th style={{ minWidth: 140 }}>OPCIONES</th>
                {/* 13. IMP. BRUTO */}
                <th style={{ minWidth: 120, textAlign: 'right' }}>IMP. BRUTO</th>
                {/* 14. CERRADO */}
                <th style={{ minWidth: 80, textAlign: 'center' }}>CERRADO</th>
                {/* 15. FECHA DE RECIBO PREVISTA */}
                <th style={{ minWidth: 140, textAlign: 'center' }}>FECHA DE RECIBO PREVISTA</th>
                {/* 16. IMPORTE DE IMPUESTOS */}
                <th style={{ minWidth: 130, textAlign: 'right' }}>IMPORTE DE IMPUESTOS</th>
                {/* 17. CLIENTE:TRABAJO */}
                <th style={{ minWidth: 260 }}>CLIENTE:TRABAJO</th>
                {/* 18. ACTIVITY CODE */}
                <th style={{ minWidth: 140 }}>ACTIVITY CODE</th>
                {/* 19. N° ARTÍCULO */}
                <th style={{ minWidth: 90, textAlign: 'center' }}>N° ARTÍCULO</th>
                {/* 20. REFERENCIA DE DETALLES DE IMPUESTOS */}
                <th style={{ minWidth: 160 }}>REFERENCIA DE DETALLES DE IMPUESTOS</th>
                {/* Acciones de fila */}
                <th style={{ minWidth: 70, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const numConsecutivo = idx + 1;
                const calc = calcularTotalesPartida(item);
                const isClosed = Boolean(item.cerrado);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      !item.on ? 'opacity-50 bg-slate-50 dark:bg-slate-900/40' : ''
                    } ${isClosed ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}
                  >
                    {/* 1. ARTÍCULO (Sticky Left) */}
                    <td className="ns-sticky-col">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={item.on}
                          onChange={(e) => onToggleItem(item.id, e.target.checked)}
                          className="rounded border-slate-400 text-blue-600 focus:ring-0 cursor-pointer"
                          title={item.on ? 'Partida activa' : 'Partida inactiva'}
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.articuloNombre || item.d.split(':')[0] || item.c}
                            onChange={(e) =>
                              onUpdateItem(item.id, { articuloNombre: e.target.value })
                            }
                            placeholder="Artículo..."
                            className="ns-cell-input font-bold text-[var(--primary,#1D4ED8)]"
                          />
                        </div>
                      </div>
                    </td>

                    {/* 2. NOMBRE DEL PROVEEDOR */}
                    <td>
                      <input
                        type="text"
                        value={item.proveedorNombre || proveedorOrden}
                        onChange={(e) =>
                          onUpdateItem(item.id, { proveedorNombre: e.target.value })
                        }
                        placeholder="Proveedor..."
                        className="ns-cell-input text-xs"
                      />
                    </td>

                    {/* 3. DESCRIPCIÓN */}
                    <td>
                      <input
                        type="text"
                        value={item.d}
                        onChange={(e) => onUpdateItem(item.id, { d: e.target.value })}
                        placeholder="Descripción detallada..."
                        className="ns-cell-input text-xs"
                      />
                    </td>

                    {/* 4. DEPARTAMENTO */}
                    <td>
                      <select
                        value={item.departamento || 'Dirección : Compras'}
                        onChange={(e) => onUpdateItem(item.id, { departamento: e.target.value })}
                        className="ns-cell-input text-xs"
                      >
                        {DEPARTAMENTOS_CATALOG.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 5. DISPONIBLE */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="font-mono text-slate-500">
                        {item.disponible ?? item.disponibleAlmacen ?? '-'}
                      </span>
                    </td>

                    {/* 6. DISPONIBLE (ALTERNO) */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="font-mono text-slate-500">
                        {item.disponibleAlterno ?? item.disponibleTotal ?? '-'}
                      </span>
                    </td>

                    {/* 7. RECIBIDO (Solo lectura, default 0) */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        value={item.recibido ?? 0}
                        className="ns-cell-input ns-cell-readonly text-center font-mono w-16 mx-auto"
                        title="Campo de solo lectura según recepción de almacén"
                      />
                    </td>

                    {/* 8. FACTURADO (Solo lectura, default 0) */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        value={item.facturado ?? 0}
                        className="ns-cell-input ns-cell-readonly text-center font-mono w-16 mx-auto"
                        title="Campo de solo lectura según conciliación de facturas"
                      />
                    </td>

                    {/* 9. CANTIDAD */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.q}
                        onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                        className={`ns-cell-input text-center font-mono font-bold w-16 mx-auto ${
                          item.q <= 0 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''
                        }`}
                        title={item.q <= 0 ? 'La cantidad debe ser mayor a 0' : 'Cantidad'}
                      />
                    </td>

                    {/* 10. V. UNITARIO */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.p}
                        onChange={(e) => handlePrecioChange(item.id, e.target.value)}
                        className={`ns-cell-input text-right font-mono font-bold w-24 ml-auto ${
                          item.p < 0 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''
                        }`}
                        title={item.p < 0 ? 'El valor unitario no puede ser negativo' : 'Precio unitario'}
                      />
                    </td>

                    {/* 11. IMPORTE (Cantidad × V. Unitario) */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono font-bold text-[var(--text-primary,#0f172a)]">
                        {formatMoney(calc.importe)}
                      </span>
                    </td>

                    {/* 12. OPCIONES */}
                    <td>
                      <input
                        type="text"
                        value={item.opciones || ''}
                        onChange={(e) => onUpdateItem(item.id, { opciones: e.target.value })}
                        placeholder="Opciones / Especificación..."
                        className="ns-cell-input text-xs"
                      />
                    </td>

                    {/* 13. IMP. BRUTO (Importe + Impuestos) */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                        {formatMoney(calc.impBruto)}
                      </span>
                    </td>

                    {/* 14. CERRADO (Casilla) */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => onUpdateItem(item.id, { cerrado: e.target.checked })}
                        className="rounded border-slate-400 text-amber-600 focus:ring-0 cursor-pointer"
                        title="Marcar partida como cerrada"
                      />
                    </td>

                    {/* 15. FECHA DE RECIBO PREVISTA */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="date"
                        value={item.fechaReciboPrevista || '2026-10-27'}
                        onChange={(e) =>
                          onUpdateItem(item.id, { fechaReciboPrevista: e.target.value })
                        }
                        className="ns-cell-input text-center font-mono text-xs w-32 mx-auto"
                      />
                    </td>

                    {/* 16. IMPORTE DE IMPUESTOS */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(calc.importeImpuestos)}
                      </span>
                    </td>

                    {/* 17. CLIENTE:TRABAJO */}
                    <td>
                      <select
                        value={
                          item.clienteTrabajo ||
                          'SFG-C299-MFP Mission Foods Mexico S.R.L. de C.V. : SFG-C299-MFP'
                        }
                        onChange={(e) =>
                          onUpdateItem(item.id, { clienteTrabajo: e.target.value })
                        }
                        className="ns-cell-input text-xs truncate"
                      >
                        {CLIENTES_TRABAJO_CATALOG.map((cli) => (
                          <option key={cli} value={cli}>
                            {cli}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 18. ACTIVITY CODE */}
                    <td>
                      <select
                        value={item.activityCode || 'Paquetería'}
                        onChange={(e) => onUpdateItem(item.id, { activityCode: e.target.value })}
                        className="ns-cell-input text-xs"
                      >
                        {ACTIVITY_CODES_CATALOG.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 19. N° ARTÍCULO (Consecutivo asignado automáticamente) */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {numConsecutivo}
                      </span>
                    </td>

                    {/* 20. REFERENCIA DE DETALLES DE IMPUESTOS */}
                    <td>
                      <input
                        type="text"
                        value={item.refDetallesImpuestos || `1194487_${numConsecutivo}`}
                        onChange={(e) =>
                          onUpdateItem(item.id, { refDetallesImpuestos: e.target.value })
                        }
                        className="ns-cell-input font-mono text-xs"
                      />
                    </td>

                    {/* Botones de acción rápida por fila */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(item.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                          title="Duplicar partida"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            content_copy
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Eliminar partida"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── CONDICIONAL: VISTA TARJETAS AGRUPADAS POR SECCIONES (PANTALLAS PEQUEÑAS / MÓVILES) ── */
        <div className="ns-card-grid">
          {items.map((item, idx) => {
            const numConsecutivo = idx + 1;
            const calc = calcularTotalesPartida(item);
            const isClosed = Boolean(item.cerrado);
            const isExpanded = partidaExpandidaId === item.id;

            return (
              <div
                key={item.id}
                className={`ns-card-item ${
                  isClosed ? 'border-amber-400/50 bg-amber-50/20' : ''
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="ns-card-header">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.on}
                      onChange={(e) => onToggleItem(item.id, e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      Partida #{numConsecutivo}
                    </span>
                    <strong className="text-sm text-[var(--text-primary,#0f172a)] truncate max-w-[200px] sm:max-w-xs">
                      {item.articuloNombre || item.d.split(':')[0] || item.c}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--primary,#1D4ED8)]">
                      {formatMoney(calc.importe)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPartidaExpandidaId(isExpanded ? null : item.id)
                      }
                      className="p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                      title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta con los 4 Grupos de Campos */}
                <div className="ns-card-body">
                  {/* GRUPO 1: DATOS GENERALES */}
                  <div className="ns-group-box">
                    <div className="ns-group-title">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      1. Datos Generales
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          1. Artículo:
                        </label>
                        <input
                          type="text"
                          value={item.articuloNombre || item.d.split(':')[0] || item.c}
                          onChange={(e) =>
                            onUpdateItem(item.id, { articuloNombre: e.target.value })
                          }
                          className="ns-cell-input font-bold text-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          2. Nombre del Proveedor:
                        </label>
                        <input
                          type="text"
                          value={item.proveedorNombre || proveedorOrden}
                          onChange={(e) =>
                            onUpdateItem(item.id, { proveedorNombre: e.target.value })
                          }
                          className="ns-cell-input"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          3. Descripción:
                        </label>
                        <textarea
                          rows={2}
                          value={item.d}
                          onChange={(e) => onUpdateItem(item.id, { d: e.target.value })}
                          className="ns-cell-input resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-500 font-bold block mb-0.5">
                            4. Departamento:
                          </label>
                          <select
                            value={item.departamento || 'Dirección : Compras'}
                            onChange={(e) =>
                              onUpdateItem(item.id, { departamento: e.target.value })
                            }
                            className="ns-cell-input"
                          >
                            {DEPARTAMENTOS_CATALOG.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-500 font-bold block mb-0.5">
                            18. Activity Code:
                          </label>
                          <select
                            value={item.activityCode || 'Paquetería'}
                            onChange={(e) =>
                              onUpdateItem(item.id, { activityCode: e.target.value })
                            }
                            className="ns-cell-input"
                          >
                            {ACTIVITY_CODES_CATALOG.map((code) => (
                              <option key={code} value={code}>
                                {code}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          17. Cliente:Trabajo:
                        </label>
                        <select
                          value={
                            item.clienteTrabajo ||
                            'SFG-C299-MFP Mission Foods Mexico S.R.L. de C.V. : SFG-C299-MFP'
                          }
                          onChange={(e) =>
                            onUpdateItem(item.id, { clienteTrabajo: e.target.value })
                          }
                          className="ns-cell-input truncate"
                        >
                          {CLIENTES_TRABAJO_CATALOG.map((cli) => (
                            <option key={cli} value={cli}>
                              {cli}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GRUPO 2: CANTIDADES */}
                  <div className="ns-group-box">
                    <div className="ns-group-title">
                      <span className="material-symbols-outlined text-[14px]">
                        format_list_numbered
                      </span>
                      2. Cantidades
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-500 font-bold block mb-0.5">
                            9. Cantidad:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.q}
                            onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                            className="ns-cell-input font-bold font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 font-bold block mb-0.5">
                            14. Cerrado:
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              checked={isClosed}
                              onChange={(e) =>
                                onUpdateItem(item.id, { cerrado: e.target.checked })
                              }
                              className="rounded text-amber-600 cursor-pointer"
                            />
                            <span className="text-xs text-slate-600">
                              {isClosed ? 'Partida cerrada' : 'Activa'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            5. Disponible:
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.disponible ?? item.disponibleAlmacen ?? '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            6. Disponible (alterno):
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.disponibleAlterno ?? item.disponibleTotal ?? '-'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            7. Recibido (Lectura):
                          </span>
                          <input
                            type="text"
                            readOnly
                            value={item.recibido ?? 0}
                            className="ns-cell-input ns-cell-readonly font-mono text-center"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            8. Facturado (Lectura):
                          </span>
                          <input
                            type="text"
                            readOnly
                            value={item.facturado ?? 0}
                            className="ns-cell-input ns-cell-readonly font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GRUPO 3: IMPORTES */}
                  <div className="ns-group-box">
                    <div className="ns-group-title">
                      <span className="material-symbols-outlined text-[14px]">payments</span>
                      3. Importes
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          10. V. Unitario:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.p}
                          onChange={(e) => handlePrecioChange(item.id, e.target.value)}
                          className="ns-cell-input font-mono font-bold text-right"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          11. Importe (Cantidad × V. Unitario):
                        </label>
                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 font-mono font-extrabold text-base text-[var(--primary,#1D4ED8)] text-right">
                          ${formatMoney(calc.importe)}
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          12. Opciones:
                        </label>
                        <input
                          type="text"
                          value={item.opciones || ''}
                          onChange={(e) => onUpdateItem(item.id, { opciones: e.target.value })}
                          placeholder="Notas o especificación de opciones..."
                          className="ns-cell-input"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          13. Imp. Bruto (Importe + Impuestos):
                        </label>
                        <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-100 text-right">
                          ${formatMoney(calc.impBruto)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GRUPO 4: IMPUESTOS Y REFERENCIAS */}
                  <div className="ns-group-box">
                    <div className="ns-group-title">
                      <span className="material-symbols-outlined text-[14px]">
                        receipt_long
                      </span>
                      4. Impuestos y Referencias
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          15. Fecha de Recibo Prevista:
                        </label>
                        <input
                          type="date"
                          value={item.fechaReciboPrevista || '2026-10-27'}
                          onChange={(e) =>
                            onUpdateItem(item.id, { fechaReciboPrevista: e.target.value })
                          }
                          className="ns-cell-input font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-0.5">
                          16. Importe de Impuestos:
                        </label>
                        <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-right">
                          ${formatMoney(calc.importeImpuestos)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-500 font-bold block mb-0.5">
                            19. N° Artículo:
                          </label>
                          <span className="ns-cell-input inline-block text-center font-mono font-bold">
                            #{numConsecutivo}
                          </span>
                        </div>
                        <div>
                          <label className="text-slate-500 font-bold block mb-0.5">
                            20. Ref. Impuestos:
                          </label>
                          <input
                            type="text"
                            value={item.refDetallesImpuestos || `1194487_${numConsecutivo}`}
                            onChange={(e) =>
                              onUpdateItem(item.id, { refDetallesImpuestos: e.target.value })
                            }
                            className="ns-cell-input font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer de Tarjeta con Botones de Acción */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
                  <button
                    type="button"
                    onClick={() => onDuplicateItem(item.id)}
                    className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>Duplicar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="px-2.5 py-1 text-xs font-semibold rounded border border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BARRA INFERIOR DE ACCIONES NETSUITE: EDITAR, ATRÁS, IMPRIMIR Y ACCIONES ── */}
      <div className="ns-bottom-actions rounded-b-md">
        <button
          type="button"
          onClick={() => {
            // Activa modo edición o confirma
          }}
          className="ns-btn ns-btn-primary"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span>Editar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.back();
            }
          }}
          className="ns-btn ns-btn-secondary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Atrás</span>
        </button>

        <button
          type="button"
          onClick={handleImprimir}
          className="ns-btn ns-btn-secondary"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          <span>Imprimir</span>
        </button>

        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => {
              // Menú desplegable de acciones NetSuite
            }}
            className="ns-btn ns-btn-secondary"
          >
            <span>Acciones</span>
            <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartidasList;
