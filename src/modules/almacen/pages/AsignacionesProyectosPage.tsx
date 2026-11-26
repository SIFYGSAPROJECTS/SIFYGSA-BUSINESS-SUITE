'use client';

import { useState, useMemo } from 'react';
import { useAlmacen } from '../context/AlmacenContext';
import '../almacen.css';

export default function AsignacionesProyectosPage() {
  const { monitorCalibracion, bitacora } = useAlmacen();

  const [tabActiva, setTabActiva] = useState<'calibracion' | 'bitacora'>('calibracion');
  const [filtroEstatusCalib, setFiltroEstatusCalib] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Equipos filtrados por estatus de calibración
  const itemsFiltrados = useMemo(() => {
    return monitorCalibracion.filter((item) => {
      const matchStatus =
        filtroEstatusCalib === 'todos' || item.estatusCalibracion === filtroEstatusCalib;
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        item.nombreEquipo.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.numeroSerie.toLowerCase().includes(q) ||
        item.marca.toLowerCase().includes(q);

      return matchStatus && matchBusqueda;
    });
  }, [monitorCalibracion, filtroEstatusCalib, busqueda]);

  // Contadores para KPIs de calibración
  const stats = useMemo(() => {
    const total = monitorCalibracion.length;
    const vigentes = monitorCalibracion.filter((i) => i.estatusCalibracion === 'Vigente').length;
    const proximos = monitorCalibracion.filter((i) => i.estatusCalibracion === 'Próximo a Vencer').length;
    const vencidos = monitorCalibracion.filter((i) => i.estatusCalibracion === 'Vencido').length;
    return { total, vigentes, proximos, vencidos };
  }, [monitorCalibracion]);

  return (
    <div className="almacen-module-container" style={{ minHeight: '100vh', background: 'var(--bg-almacen)' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Cabecera Principal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            padding: '20px 24px',
            background: 'var(--card-bg, #ffffff)',
            borderRadius: 16,
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified</span>
              </span>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Monitor de Calibración, Custodia & Bitácora de Auditoría
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Control de vigencia metrológica, bloqueo de salida a obra por vencimiento y registro estricto de auditoría.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Pestaña */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--surface-alt)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setTabActiva('calibracion')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: tabActiva === 'calibracion' ? 'var(--card)' : 'transparent',
                color: tabActiva === 'calibracion' ? 'var(--warning)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: tabActiva === 'calibracion' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Monitor de Calibración ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('bitacora')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: tabActiva === 'bitacora' ? 'var(--card)' : 'transparent',
                color: tabActiva === 'bitacora' ? 'var(--brand-600, #1d4ed8)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: tabActiva === 'bitacora' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Bitácora de Auditoría ({bitacora.length})
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: MONITOR DE CALIBRACIÓN */}
        {tabActiva === 'calibracion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPIs de Calibración */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Total Equipos Sujetos a Calibración
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                  {stats.total}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En catálogo y frentes</span>
              </div>

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase' }}>
                  Certificación Vigente
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', marginTop: 4 }}>
                  {stats.vigentes}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Habilitados para despacho a obra</span>
              </div>

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase' }}>
                  Próximos a Vencer (&lt;30 días)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--warning)', marginTop: 4 }}>
                  {stats.proximos}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Programar envío a laboratorio</span>
              </div>

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase' }}>
                  Vencidos (Salida Bloqueada)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--danger)', marginTop: 4 }}>
                  {stats.vencidos}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Bloqueados para salida a nuevos frentes</span>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: 'var(--card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="Buscar por equipo, SKU, serie o marca..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  minWidth: 280,
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                {['todos', 'Vigente', 'Próximo a Vencer', 'Vencido'].map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setFiltroEstatusCalib(est)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: filtroEstatusCalib === est ? 'var(--primary)' : 'var(--surface-alt)',
                      color: filtroEstatusCalib === est ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {est === 'todos' ? 'Todos los Estados' : est}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla del Monitor de Calibración */}
            <div
              style={{
                background: 'var(--card-bg, #ffffff)',
                borderRadius: 16,
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px' }}>Equipo & Modelo</th>
                    <th style={{ padding: '12px 10px' }}>Número de Serie</th>
                    <th style={{ padding: '12px 10px' }}>Ubicación Actual</th>
                    <th style={{ padding: '12px 10px' }}>Última Calibración</th>
                    <th style={{ padding: '12px 10px' }}>Fecha Vencimiento</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Días Restantes</th>
                    <th style={{ padding: '12px 10px' }}>Estatus & Candado</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--divider)',
                        background: item.bloqueadoParaSalida ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 10px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.nombreEquipo}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          SKU: {item.sku} • {item.marca} {item.modelo}
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                        {item.numeroSerie}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--surface-alt)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {item.ubicacionActual}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                        {item.fechaUltimaCalibracion}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.fechaVencimientoCalibracion}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 800 }}>
                        <span style={{ color: item.diasParaVencimiento <= 0 ? 'var(--danger)' : item.diasParaVencimiento <= 30 ? 'var(--warning)' : 'var(--success)' }}>
                          {item.diasParaVencimiento <= 0 ? 'Vencida' : `${item.diasParaVencimiento} días`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {item.bloqueadoParaSalida ? (
                          <div
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: 'var(--danger-bg)',
                              color: 'var(--danger-text)',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
                            SALIDA BLOQUEADA
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: item.estatusCalibracion === 'Vigente' ? 'var(--success-bg)' : 'var(--warning-bg)',
                              color: item.estatusCalibracion === 'Vigente' ? 'var(--success-text)' : 'var(--warning-text)',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                            {item.estatusCalibracion}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: BITÁCORA DE AUDITORÍA */}
        {tabActiva === 'bitacora' && (
          <div
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: 16,
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Bitácora de Auditoría del Sistema (System Log Inmutable)
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Registro cronológico de creación, edición, inhabilitación, recepciones, salidas y notas con valor anterior y nuevo.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Fecha y Hora</th>
                    <th style={{ padding: '10px 12px' }}>Usuario</th>
                    <th style={{ padding: '10px 12px' }}>Folio / Documento</th>
                    <th style={{ padding: '10px 12px' }}>Acción</th>
                    <th style={{ padding: '10px 12px' }}>Campo Modificado</th>
                    <th style={{ padding: '10px 12px' }}>Valor Anterior</th>
                    <th style={{ padding: '10px 12px' }}>Valor Nuevo</th>
                    <th style={{ padding: '10px 12px' }}>Motivo / Justificación</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacora.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {b.fechaHora}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {b.usuario}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                        {b.folioDocumento}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background:
                              b.accion === 'creacion'
                                ? 'var(--success-bg)'
                                : b.accion === 'eliminacion' || b.accion === 'inhabilitacion'
                                ? 'var(--danger-bg)'
                                : 'var(--brand-tonal-bg)',
                            color:
                              b.accion === 'creacion'
                                ? 'var(--success-text)'
                                : b.accion === 'eliminacion' || b.accion === 'inhabilitacion'
                                ? 'var(--danger-text)'
                                : 'var(--brand-tonal-text)',
                          }}
                        >
                          {b.accion}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {b.campoModificado || '-'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {b.valorAnterior || '-'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {b.valorNuevo || '-'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {b.motivo || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
