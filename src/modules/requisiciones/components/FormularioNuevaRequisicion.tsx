'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  AREAS_OPERATIVAS,
  PRESUPUESTO_MAXIMO_POR_AREA,
  PRIORIDADES_REQUISICION,
  determinarNivelAprobacion,
  type AreaOperativa,
  type PrioridadRequisicion,
} from '../constants';
import { esquemaCrearRequisicion } from '../schemas/requisicion.schema';
import type { EntradaCrearRequisicion } from '../types';

export interface PropiedadesFormularioNuevaRequisicion {
  nombreUsuarioActual: string;
  alGuardar: (datos: EntradaCrearRequisicion) => Promise<void>;
}

export const FormularioNuevaRequisicion: React.FC<PropiedadesFormularioNuevaRequisicion> = ({
  nombreUsuarioActual,
  alGuardar,
}) => {
  const [contrato, setContrato] = useState('PEMEX-MINA-SIL3-26');
  const [area, setArea] = useState<AreaOperativa>('Instrumentación & Fire/Gas');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadRequisicion>('alta');
  const [fechaRequerida, setFechaRequerida] = useState('2026-11-15');
  const [justificacion, setJustificacion] = useState('');
  const [partidas, setPartidas] = useState([
    {
      codigoArticulo: 'DET-GAS-IR-042',
      descripcion: 'Detector Óptico Infrarrojo de Gas CH4/H2S SIL-3',
      cantidad: 2,
      unidad: 'PZA',
      precioUnitario: 48250,
    },
  ]);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const subtotal = partidas.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const techoArea = PRESUPUESTO_MAXIMO_POR_AREA[area];
  const nivel = determinarNivelAprobacion(total);

  const agregarPartida = () => {
    setPartidas((prev) => [
      ...prev,
      { codigoArticulo: '', descripcion: '', cantidad: 1, unidad: 'PZA', precioUnitario: 1000 },
    ]);
  };

  const eliminarPartida = (idx: number) => {
    if (partidas.length <= 1) return;
    setPartidas((prev) => prev.filter((_, i) => i !== idx));
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroresCampo({});
    setErrorGeneral(null);

    const payload: EntradaCrearRequisicion = {
      contrato,
      solicitante: nombreUsuarioActual,
      area,
      descripcion,
      prioridad,
      justificacion,
      fechaRequerida,
      partidas,
    };

    const validacion = esquemaCrearRequisicion.safeParse(payload);
    if (!validacion.success) {
      const mapaErrores: Record<string, string> = {};
      for (const issue of validacion.error.issues) {
        const clave = issue.path.join('.') || 'general';
        if (!mapaErrores[clave]) {
          mapaErrores[clave] = issue.message;
        }
      }
      setErroresCampo(mapaErrores);
      setErrorGeneral('Revisa los campos marcados en rojo antes de emitir la requisición.');
      return;
    }

    setCargando(true);
    try {
      await alGuardar(validacion.data);
    } catch (err) {
      setErrorGeneral(
        err instanceof Error ? err.message : 'Error de validación en la requisición'
      );
    } finally {
      setCargando(false);
    }
  };

  const estiloCampo = (tieneError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '0.48rem 0.65rem',
    borderRadius: 'var(--radius-control)',
    border: `1px solid ${tieneError ? 'var(--danger)' : 'var(--border)'}`,
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
  });

  const estiloErrorTexto: React.CSSProperties = {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.73rem',
    color: 'var(--danger)',
    fontWeight: 600,
  };

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
            Nueva Requisición
          </h3>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Al emitir, queda en estado <strong>Solicitud</strong>, se registra en auditoría y notifica a los revisores autorizados.
          </p>
        </div>
        <span style={{ fontSize: '0.78rem', color: total > techoArea ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 700 }}>
          Techo Presupuestal {area}: ${techoArea.toLocaleString('es-MX')} MXN | {nivel.etiqueta}
        </span>
      </div>

      {errorGeneral && (
        <div
          role="alert"
          style={{
            padding: '0.65rem 0.9rem',
            borderRadius: '6px',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          {errorGeneral}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div>
          <label htmlFor="req-solicitante" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Solicitante (Sesión activa)
          </label>
          <input
            id="req-solicitante"
            type="text"
            value={nombreUsuarioActual}
            readOnly
            disabled
            aria-readonly="true"
            style={{
              ...estiloCampo(false),
              opacity: 0.85,
              cursor: 'not-allowed',
              fontWeight: 700,
            }}
            title="El solicitante se asigna automáticamente desde tu sesión activa"
          />
        </div>

        <div>
          <label htmlFor="req-area" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Área Solicitud *
          </label>
          <select
            id="req-area"
            value={area}
            onChange={(e) => setArea(e.target.value as AreaOperativa)}
            style={estiloCampo(Boolean(erroresCampo['area']))}
          >
            {AREAS_OPERATIVAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {erroresCampo['area'] && <span style={estiloErrorTexto}>{erroresCampo['area']}</span>}
        </div>

        <div>
          <label htmlFor="req-contrato" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Contrato / Centro de Costos *
          </label>
          <input
            id="req-contrato"
            type="text"
            value={contrato}
            onChange={(e) => setContrato(e.target.value)}
            style={estiloCampo(Boolean(erroresCampo['contrato']))}
            placeholder="Ej. PEMEX-MINA-SIL3-26"
          />
          {erroresCampo['contrato'] && <span style={estiloErrorTexto}>{erroresCampo['contrato']}</span>}
        </div>

        <div>
          <label htmlFor="req-prioridad" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Prioridad *
          </label>
          <select
            id="req-prioridad"
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value as PrioridadRequisicion)}
            style={estiloCampo(Boolean(erroresCampo['prioridad']))}
          >
            {PRIORIDADES_REQUISICION.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
          {erroresCampo['prioridad'] && <span style={estiloErrorTexto}>{erroresCampo['prioridad']}</span>}
        </div>

        <div>
          <label htmlFor="req-fecha" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Fecha Requerida *
          </label>
          <input
            id="req-fecha"
            type="date"
            value={fechaRequerida}
            onChange={(e) => setFechaRequerida(e.target.value)}
            style={estiloCampo(Boolean(erroresCampo['fechaRequerida']))}
          />
          {erroresCampo['fechaRequerida'] && (
            <span style={estiloErrorTexto}>{erroresCampo['fechaRequerida']}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
        <div>
          <label htmlFor="req-descripcion" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Descripción General de la Requisición *
          </label>
          <input
            id="req-descripcion"
            type="text"
            placeholder="Ej. Suministro de detectores portátiles y cilindros patrón..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={estiloCampo(Boolean(erroresCampo['descripcion']))}
          />
          {erroresCampo['descripcion'] && (
            <span style={estiloErrorTexto}>{erroresCampo['descripcion']}</span>
          )}
        </div>

        <div>
          <label htmlFor="req-justificacion" style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
            Justificación Operativa *
          </label>
          <input
            id="req-justificacion"
            type="text"
            placeholder="Describe la necesidad operativa o proyecto asociado..."
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            style={estiloCampo(Boolean(erroresCampo['justificacion']))}
          />
          {erroresCampo['justificacion'] && (
            <span style={estiloErrorTexto}>{erroresCampo['justificacion']}</span>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.84rem' }}>
            Artículos de la Requisición (Cantidad, Unidad y Monto Unitario)
          </strong>
          <Button tamano="sm" variante="secundario" onClick={agregarPartida}>
            + Agregar Artículo
          </Button>
        </div>

        {erroresCampo['partidas'] && (
          <div style={{ marginBottom: '0.45rem' }}>
            <span style={estiloErrorTexto}>{erroresCampo['partidas']}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {partidas.map((p, idx) => {
            const errCodigo = erroresCampo[`partidas.${idx}.codigoArticulo`];
            const errDesc = erroresCampo[`partidas.${idx}.descripcion`];
            const errCant = erroresCampo[`partidas.${idx}.cantidad`];
            const errUnidad = erroresCampo[`partidas.${idx}.unidad`];
            const errPrecio = erroresCampo[`partidas.${idx}.precioUnitario`];

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 95px 85px 135px auto', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Código (ej. DET-01)"
                    aria-label={`Código de artículo ${idx + 1}`}
                    value={p.codigoArticulo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPartidas((prev) => prev.map((it, i) => (i === idx ? { ...it, codigoArticulo: val } : it)));
                    }}
                    style={estiloCampo(Boolean(errCodigo))}
                  />
                  <input
                    type="text"
                    placeholder="Descripción del artículo"
                    aria-label={`Descripción de artículo ${idx + 1}`}
                    value={p.descripcion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPartidas((prev) => prev.map((it, i) => (i === idx ? { ...it, descripcion: val } : it)));
                    }}
                    style={estiloCampo(Boolean(errDesc))}
                  />
                  <input
                    type="number"
                    min={1}
                    aria-label={`Cantidad de artículo ${idx + 1}`}
                    value={p.cantidad}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPartidas((prev) => prev.map((it, i) => (i === idx ? { ...it, cantidad: val } : it)));
                    }}
                    style={estiloCampo(Boolean(errCant))}
                  />
                  <input
                    type="text"
                    placeholder="Unidad"
                    aria-label={`Unidad de artículo ${idx + 1}`}
                    value={p.unidad}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPartidas((prev) => prev.map((it, i) => (i === idx ? { ...it, unidad: val } : it)));
                    }}
                    style={estiloCampo(Boolean(errUnidad))}
                  />
                  <input
                    type="number"
                    min={1}
                    aria-label={`Precio unitario de artículo ${idx + 1}`}
                    value={p.precioUnitario}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPartidas((prev) => prev.map((it, i) => (i === idx ? { ...it, precioUnitario: val } : it)));
                    }}
                    style={estiloCampo(Boolean(errPrecio))}
                  />
                  <Button
                    tamano="sm"
                    variante="peligro"
                    onClick={() => eliminarPartida(idx)}
                    disabled={partidas.length <= 1}
                    title="Eliminar artículo"
                  >
                    ✕
                  </Button>
                </div>
                {(errCodigo || errDesc || errCant || errUnidad || errPrecio) && (
                  <span style={estiloErrorTexto}>
                    {errCodigo || errDesc || errCant || errUnidad || errPrecio}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
        <div style={{ fontSize: '0.88rem' }}>
          Monto Estimado — Subtotal: <strong>${subtotal.toLocaleString('es-MX')}</strong> | IVA (16%): <strong>${iva.toLocaleString('es-MX')}</strong> | Total: <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>${total.toLocaleString('es-MX')} MXN</strong>
        </div>
        <Button type="submit" variante="primario" cargando={cargando}>
          Emitir Solicitud de Requisición
        </Button>
      </div>
    </form>
  );
};
