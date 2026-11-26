'use client';

import React, { useState, useRef } from 'react';
import { ZONAS_COMERCIALES, type ZonaComercial } from '@/config/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ETAPAS_OPORTUNIDAD,
  ETIQUETAS_ETAPAS,
  VENDEDORES_DISPONIBLES,
  type EtapaOportunidad,
} from '../constants';
import type { EntradaCrearOportunidad, OportunidadCrm } from '../types';
import {
  exportarOportunidadesCsv,
  exportarOportunidadesExcel,
  parsearCsvOportunidades,
} from '../utils/exportador-crm';

export interface PropiedadesTablaOportunidadesCrm {
  oportunidades: OportunidadCrm[];
  puedeCrear: boolean;
  puedeExportar: boolean;
  alImportarMasivo: (filas: EntradaCrearOportunidad[]) => Promise<{ importadas: number; errores: string[] }>;
  alSeleccionarOportunidad?: (folio: string) => void;
}

export const TablaOportunidadesCrm: React.FC<PropiedadesTablaOportunidadesCrm> = ({
  oportunidades,
  puedeCrear,
  puedeExportar,
  alImportarMasivo,
  alSeleccionarOportunidad,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [etapa, setEtapa] = useState<EtapaOportunidad | 'todas'>('todas');
  const [vendedor, setVendedor] = useState<string>('todos');
  const [etiqueta, setEtiqueta] = useState<string>('');
  const [pagina, setPagina] = useState(1);
  const [mensajeImportacion, setMensajeImportacion] = useState<string | null>(null);
  const inputCsvRef = useRef<HTMLInputElement>(null);
  const porPagina = 6;

  const filtradas = oportunidades.filter((o) => {
    if (etapa !== 'todas' && o.etapa !== etapa) return false;
    if (vendedor !== 'todos' && o.vendedor !== vendedor) return false;
    if (etiqueta.trim() && !o.etiquetas.some((t) => t.toLowerCase().includes(etiqueta.toLowerCase()))) {
      return false;
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        o.folio.toLowerCase().includes(q) ||
        o.titulo.toLowerCase().includes(q) ||
        o.clienteNombre.toLowerCase().includes(q) ||
        o.contactoNombre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginadas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const manejarArchivoCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const texto = await archivo.text();
    const filas = parsearCsvOportunidades(texto);
    const res = await alImportarMasivo(filas);
    setMensajeImportacion(
      `Importadas: ${res.importadas}. ${res.errores.length > 0 ? `Errores: ${res.errores[0]}` : 'Sin errores de validación.'}`
    );
    e.target.value = '';
  };

  const estiloInput: React.CSSProperties = {
    padding: '0.45rem 0.7rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.15rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Búsqueda avanzada (folio, proyecto, cliente)..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            style={{ ...estiloInput, minWidth: '240px' }}
          />
          <select value={etapa} onChange={(e) => { setEtapa(e.target.value as EtapaOportunidad | 'todas'); setPagina(1); }} style={estiloInput}>
            <option value="todas">Todas las etapas</option>
            {ETAPAS_OPORTUNIDAD.map((et) => <option key={et} value={et}>{ETIQUETAS_ETAPAS[et]}</option>)}
          </select>
          <select value={vendedor} onChange={(e) => { setVendedor(e.target.value); setPagina(1); }} style={estiloInput}>
            <option value="todos">Todos los vendedores</option>
            {VENDEDORES_DISPONIBLES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <input
            type="text"
            placeholder="Filtrar etiqueta (ej. SIL-3)..."
            value={etiqueta}
            onChange={(e) => { setEtiqueta(e.target.value); setPagina(1); }}
            style={{ ...estiloInput, width: '165px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {puedeCrear && (
            <>
              <input ref={inputCsvRef} type="file" accept=".csv" onChange={manejarArchivoCsv} style={{ display: 'none' }} />
              <Button tamano="sm" variante="secundario" onClick={() => inputCsvRef.current?.click()}>
                ↑ Importar CSV
              </Button>
            </>
          )}
          {puedeExportar && (
            <>
              <Button tamano="sm" variante="secundario" onClick={() => exportarOportunidadesCsv(filtradas)}>
                ↓ CSV
              </Button>
              <Button tamano="sm" variante="secundario" onClick={() => void exportarOportunidadesExcel(filtradas)}>
                ↓ Excel (.xlsx)
              </Button>
            </>
          )}
        </div>
      </div>

      {mensajeImportacion && (
        <div style={{ marginBottom: '0.8rem', padding: '0.55rem 0.85rem', borderRadius: '6px', backgroundColor: 'var(--info-bg)', color: 'var(--info-text)', fontSize: '0.8rem' }}>
          {mensajeImportacion}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.6rem' }}>Folio / Proyecto</th>
              <th style={{ padding: '0.6rem' }}>Cliente / Contacto</th>
              <th style={{ padding: '0.6rem' }}>Vendedor / Zona</th>
              <th style={{ padding: '0.6rem' }}>Etapa</th>
              <th style={{ padding: '0.6rem' }}>Etiquetas</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Monto Estimado</th>
            </tr>
          </thead>
          <tbody>
            {paginadas.map((o) => (
              <tr
                key={o.id}
                onClick={() => alSeleccionarOportunidad?.(o.folio)}
                style={{
                  borderBottom: '1px solid var(--divider)',
                  cursor: alSeleccionarOportunidad ? 'pointer' : 'default',
                }}
                title={`Abrir detalle de ${o.folio}`}
              >
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline' }}>
                    {o.folio}
                  </span>
                  <div style={{ fontWeight: 700 }}>{o.titulo}</div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <div>{o.clienteNombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{o.contactoNombre}</div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <div>{o.vendedor}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Zona {o.zona}</div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <Badge variant={o.etapa === 'ganado' ? 'success' : o.etapa === 'perdido' ? 'danger' : 'brand'}>
                    {ETIQUETAS_ETAPAS[o.etapa]} ({o.probabilidad}%)
                  </Badge>
                </td>
                <td style={{ padding: '0.65rem 0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {o.etiquetas.map((t) => (
                      <span key={t} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '0.65rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>
                  ${o.montoEstimado.toLocaleString('es-MX')} {o.moneda}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Mostrando {paginadas.length} de {filtradas.length} oportunidades (Pág. {pagina}/{totalPaginas})
        </span>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          <Button tamano="sm" variante="secundario" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>← Anterior</Button>
          <Button tamano="sm" variante="secundario" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente →</Button>
        </div>
      </div>
    </div>
  );
};

export { ZONAS_COMERCIALES, type ZonaComercial };
