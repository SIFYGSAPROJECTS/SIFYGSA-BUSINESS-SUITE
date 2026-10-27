'use client';

import React from 'react';
import Link from 'next/link';
import type { IndicadoresGlobalesAdmin } from '../types';
import { REGISTRO_MODULOS } from '@/modules/registry';

export interface PropiedadesResumenAdmin {
  indicadores: IndicadoresGlobalesAdmin;
  alCambiarVista: (vista: 'resumen' | 'usuarios' | 'permisos' | 'auditoria') => void;
}

export const ResumenAdmin: React.FC<PropiedadesResumenAdmin> = ({
  indicadores,
  alCambiarVista,
}) => {
  const formatearMoneda = (monto: number) =>
    monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

  const tarjetas = [
    {
      titulo: 'Usuarios Activos',
      valor: `${indicadores.usuariosActivos} / ${indicadores.usuariosTotales}`,
      subtitulo: 'Cuentas habilitadas con RBAC',
      acento: 'var(--primary)',
      accion: () => alCambiarVista('usuarios'),
    },
    {
      titulo: 'Pipeline Comercial CRM',
      valor: formatearMoneda(indicadores.valorPipelineCrm),
      subtitulo: `${indicadores.oportunidadesActivas} oportunidades activas`,
      acento: 'var(--info)',
      ruta: '/crm',
    },
    {
      titulo: 'Requisiciones Pendientes',
      valor: String(indicadores.requisicionesPendientes),
      subtitulo: `Volumen: ${formatearMoneda(indicadores.montoRequisicionesMes)}`,
      acento: 'var(--warning)',
      ruta: '/requisiciones',
    },
    {
      titulo: 'Plantilla RRHH Activa',
      valor: String(indicadores.empleadosActivos),
      subtitulo: `${indicadores.solicitudesRrhhPendientes} solicitudes por aprobar`,
      acento: 'var(--success)',
      ruta: '/rrhh',
    },
    {
      titulo: 'Eventos de Auditoría',
      valor: String(indicadores.eventosAuditoriaHoy),
      subtitulo: 'Trazabilidad de seguridad activa',
      acento: 'var(--brand-700)',
      accion: () => alCambiarVista('auditoria'),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        {tarjetas.map((t) => (
          <div
            key={t.titulo}
            onClick={t.accion}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderTop: `3px solid ${t.acento}`,
              borderRadius: 'var(--radius-card)',
              padding: '1.1rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: t.accion ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {t.titulo}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.45rem 0' }}>
              {t.valor}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>{t.subtitulo}</span>
              {t.ruta && (
                <Link href={t.ruta} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                  Ir →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1.25rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 800 }}>
          Accesos Rápidos a Módulos Registrados (`modules/registry.ts`)
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {REGISTRO_MODULOS.map((mod) => (
            <Link
              key={mod.id}
              href={mod.ruta}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{mod.nombre}</strong>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {mod.ruta}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {mod.descripcion}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
