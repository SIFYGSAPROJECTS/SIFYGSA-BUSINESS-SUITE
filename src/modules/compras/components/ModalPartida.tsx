'use client';

import React, { useState } from 'react';
import { Combobox } from './Combobox';
import { ARTICULOS_CATALOG, type ArticuloCatalogOption, type PartidaOrdenForm } from '../data/orden-compra-catalog';

interface ModalPartidaProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: PartidaOrdenForm) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ModalPartida: React.FC<ModalPartidaProps> = ({
  isOpen,
  onClose,
  onAdd,
  onShowToast,
}) => {
  const [selectedArticuloText, setSelectedArticuloText] = useState('');
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloCatalogOption | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState<number | ''>('');

  if (!isOpen) return null;

  const catalogOptions = ARTICULOS_CATALOG.map((cat: ArticuloCatalogOption) => ({
    label: cat.v,
    value: cat.c,
    sublabel: `$${cat.p.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    payload: cat,
  }));

  const handleSelectArticulo = (label: string, option?: any) => {
    setSelectedArticuloText(label);
    const cat = option?.payload || ARTICULOS_CATALOG.find((x: ArticuloCatalogOption) => x.v === label);
    if (cat) {
      setSelectedArticulo(cat);
      setPrecioUnitario(cat.p);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticuloText.trim()) {
      onShowToast('Elige un artículo del catálogo.', 'error');
      return;
    }

    const cat = selectedArticulo || ARTICULOS_CATALOG.find((x: ArticuloCatalogOption) => x.v === selectedArticuloText);
    if (!cat) {
      onShowToast('Elige un artículo válido del catálogo.', 'error');
      return;
    }

    const price = typeof precioUnitario === 'number' ? precioUnitario : cat.p;
    const descParts = cat.v.split(' · ');
    const desc = descParts.length > 1 ? descParts.slice(1).join(' · ') : cat.v;

    const newItem: PartidaOrdenForm = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      c: cat.c,
      d: desc,
      q: Math.max(1, cantidad),
      p: Math.max(0, price),
      n: '',
      on: true,
    };

    onAdd(newItem);
    onShowToast('Partida agregada a la orden.', 'success');
    // Reset state
    setSelectedArticuloText('');
    setSelectedArticulo(null);
    setCantidad(1);
    setPrecioUnitario('');
    onClose();
  };

  return (
    <div className="oc-modal-backdrop" onClick={onClose}>
      <div
        className="oc-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="oc-modal-header">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1D4ED8] text-[22px]">
              post_add
            </span>
            <h3 className="font-headline-sm font-bold text-on-surface">
              Añadir partida
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-on-surface rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Combobox de Catálogo */}
          <div className="oc-field-group">
            <label className="oc-label font-semibold">
              Artículo / Servicio *
            </label>
            <Combobox
              value={selectedArticuloText}
              onChange={handleSelectArticulo}
              options={catalogOptions}
              placeholder="Busca por código o descripción..."
              autoFocus
            />
            <span className="oc-field-hint">
              Selecciona un concepto del catálogo para precargar clave y precio unitario.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cantidad */}
            <div className="oc-field-group">
              <label className="oc-label font-semibold">Cantidad</label>
              <div className="oc-input-wrapper">
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="oc-input"
                />
              </div>
            </div>

            {/* Valor unitario */}
            <div className="oc-field-group">
              <label className="oc-label font-semibold">
                Valor unitario (MXN)
              </label>
              <div className="oc-input-wrapper">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioUnitario}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setPrecioUnitario(val);
                  }}
                  placeholder="0.00"
                  className="oc-input"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="oc-modal-actions pt-2">
            <button
              type="button"
              onClick={onClose}
              className="oc-btn-ghost px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="oc-btn-primary px-5 py-2"
            >
              Agregar partida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

