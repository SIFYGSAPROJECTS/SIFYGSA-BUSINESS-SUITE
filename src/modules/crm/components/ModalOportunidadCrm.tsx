'use client';

import React, { useState } from 'react';
import { ZONAS_COMERCIALES, type ZonaComercial } from '@/config/types';
import { Button } from '@/components/ui/Button';
import { ModalUniversal } from '@/components/ui/ModalUniversal';
import {
  ETAPAS_OPORTUNIDAD,
  ETIQUETAS_ETAPAS,
  PROBABILIDAD_POR_ETAPA,
  VENDEDORES_DISPONIBLES,
  type EtapaOportunidad,
} from '../constants';
import type { EntradaCrearOportunidad } from '../types';

export interface PropiedadesModalOportunidadCrm {
  abierto: boolean;
  alCerrar: () => void;
  alGuardar: (datos: EntradaCrearOportunidad) => Promise<void>;
}

export const ModalOportunidadCrm: React.FC<PropiedadesModalOportunidadCrm> = ({
  abierto,
  alCerrar,
  alGuardar,
}) => {
  const [titulo, setTitulo] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [vendedor, setVendedor] = useState<string>(VENDEDORES_DISPONIBLES[0]);
  const [zona, setZona] = useState<ZonaComercial>('Istmo');
  const [etapa, setEtapa] = useState<EtapaOportunidad>('prospecto');
  const [montoEstimado, setMontoEstimado] = useState<number>(450000);
  const [fechaCierreEsperada, setFechaCierreEsperada] = useState('2026-12-15');
  const [etiquetasTexto, setEtiquetasTexto] = useState('SIL-3, Fire & Gas');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await alGuardar({
        titulo,
        clienteId: 'cli_001',
        clienteNombre,
        contactoNombre,
        contactoEmail,
        vendedor,
        zona,
        etapa,
        montoEstimado: Number(montoEstimado),
        moneda: 'MXN',
        probabilidad: PROBABILIDAD_POR_ETAPA[etapa],
        fechaCierreEsperada,
        periodo: fechaCierreEsperada.slice(0, 7),
        etiquetas: etiquetasTexto
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notas,
      });
      alCerrar();
    } finally {
      setCargando(false);
    }
  };

  const estiloCampo: React.CSSProperties = {
    width: '100%',
    padding: '0.48rem 0.65rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
  };

  return (
    <ModalUniversal abierto={abierto} alCerrar={alCerrar} titulo="Nueva Oportunidad Comercial">
      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Título del Proyecto / Oportunidad</label>
          <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} style={estiloCampo} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Empresa / Cliente</label>
            <input type="text" required value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} style={estiloCampo} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nombre del Contacto</label>
            <input type="text" required value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} style={estiloCampo} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Correo del Contacto</label>
            <input type="email" required value={contactoEmail} onChange={(e) => setContactoEmail(e.target.value)} style={estiloCampo} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Vendedor Asignado</label>
            <select value={vendedor} onChange={(e) => setVendedor(e.target.value)} style={estiloCampo}>
              {VENDEDORES_DISPONIBLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Zona</label>
            <select value={zona} onChange={(e) => setZona(e.target.value as ZonaComercial)} style={estiloCampo}>
              {ZONAS_COMERCIALES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Etapa Inicial</label>
            <select value={etapa} onChange={(e) => setEtapa(e.target.value as EtapaOportunidad)} style={estiloCampo}>
              {ETAPAS_OPORTUNIDAD.map((et) => <option key={et} value={et}>{ETIQUETAS_ETAPAS[et]}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Monto Estimado (MXN)</label>
            <input type="number" required min={0} value={montoEstimado} onChange={(e) => setMontoEstimado(Number(e.target.value))} style={estiloCampo} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Fecha Cierre Esperada</label>
            <input type="date" required value={fechaCierreEsperada} onChange={(e) => setFechaCierreEsperada(e.target.value)} style={estiloCampo} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Etiquetas (separadas por coma)</label>
            <input type="text" value={etiquetasTexto} onChange={(e) => setEtiquetasTexto(e.target.value)} style={estiloCampo} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Notas Comerciales</label>
          <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} style={estiloCampo} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" variante="primario" cargando={cargando}>Crear Oportunidad</Button>
        </div>
      </form>
    </ModalUniversal>
  );
};
