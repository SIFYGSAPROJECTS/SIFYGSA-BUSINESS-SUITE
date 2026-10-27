'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { EventoAuditoria, MatrizPermisos, UsuarioPublico } from '@/config/types';
import type { IndicadoresGlobalesAdmin } from '../types';
import { ResumenAdmin } from './ResumenAdmin';
import { TablaUsuariosAdmin } from './TablaUsuariosAdmin';
import { ModalUsuarioAdmin } from './ModalUsuarioAdmin';
import { MatrizPermisosAdmin } from './MatrizPermisosAdmin';
import { BitacoraAuditoriaAdmin } from './BitacoraAuditoriaAdmin';

type VistaAdmin = 'resumen' | 'usuarios' | 'permisos' | 'auditoria';
const VISTAS_VALIDAS_ADMIN: readonly VistaAdmin[] = ['resumen', 'usuarios', 'permisos', 'auditoria'];

export interface PropiedadesPanelAdminCliente {
  indicadores: IndicadoresGlobalesAdmin;
  usuariosIniciales: UsuarioPublico[];
  matrizInicial: MatrizPermisos;
  eventosAuditoriaIniciales: EventoAuditoria[];
  totalAuditoriaInicial: number;
}

export const PanelAdminCliente: React.FC<PropiedadesPanelAdminCliente> = ({
  indicadores,
  usuariosIniciales,
  matrizInicial,
  eventosAuditoriaIniciales,
  totalAuditoriaInicial,
}) => {
  const searchParams = useSearchParams();
  const vistaParam = searchParams.get('vista') as VistaAdmin | null;
  const vistaUrl: VistaAdmin =
    vistaParam && VISTAS_VALIDAS_ADMIN.includes(vistaParam) ? vistaParam : 'resumen';

  const [seleccionManual, setSeleccionManual] = useState<{
    urlBase: string | null;
    vista: VistaAdmin;
  } | null>(null);
  const vistaActiva: VistaAdmin =
    seleccionManual && seleccionManual.urlBase === vistaParam ? seleccionManual.vista : vistaUrl;
  const setVistaActiva = (nuevaVista: VistaAdmin) =>
    setSeleccionManual({ urlBase: vistaParam, vista: nuevaVista });

  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>(usuariosIniciales);
  const [modoModal, setModoModal] = useState<'crear' | 'editar' | 'password' | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioPublico | null>(null);

  const recargarUsuarios = async () => {
    const res = await fetch('/api/admin/usuarios');
    const json = (await res.json()) as { exito: boolean; datos?: UsuarioPublico[] };
    if (json.exito && json.datos) setUsuarios(json.datos);
  };

  const pestanas: { id: VistaAdmin; etiqueta: string }[] = [
    { id: 'resumen', etiqueta: 'Indicadores & Accesos' },
    { id: 'usuarios', etiqueta: `Usuarios (${usuarios.length})` },
    { id: 'permisos', etiqueta: 'Matriz de Roles y Permisos' },
    { id: 'auditoria', etiqueta: 'Bitácora de Auditoría' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1.15rem 1.35rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900 }}>
            Panel de Administración General
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Control central de seguridad RBAC, usuarios con hash bcryptjs y bitácora de auditoría.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {pestanas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setVistaActiva(p.id)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: vistaActiva === p.id ? 'var(--primary)' : 'var(--surface-alt)',
                color: vistaActiva === p.id ? 'var(--on-primary)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {vistaActiva === 'resumen' && (
        <ResumenAdmin indicadores={indicadores} alCambiarVista={setVistaActiva} />
      )}

      {vistaActiva === 'usuarios' && (
        <TablaUsuariosAdmin
          usuarios={usuarios}
          alAbrirCrear={() => {
            setUsuarioSeleccionado(null);
            setModoModal('crear');
          }}
          alAbrirEditar={(u) => {
            setUsuarioSeleccionado(u);
            setModoModal('editar');
          }}
          alAbrirPassword={(u) => {
            setUsuarioSeleccionado(u);
            setModoModal('password');
          }}
          alAlternarEstado={async (u) => {
            await fetch(`/api/admin/usuarios/${u.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nombre: u.nombre,
                email: u.email,
                rol: u.rol,
                zona: u.zona,
                departamento: u.departamento,
                estado: u.estado === 'activo' ? 'inactivo' : 'activo',
                modulosPermitidos: u.modulosPermitidos,
              }),
            });
            await recargarUsuarios();
          }}
        />
      )}

      {vistaActiva === 'permisos' && (
        <MatrizPermisosAdmin
          matrizInicial={matrizInicial}
          alGuardarMatriz={async (nuevaMatriz) => {
            const res = await fetch('/api/admin/permisos', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matriz: nuevaMatriz }),
            });
            const json = (await res.json()) as { exito: boolean; error?: string };
            if (!json.exito) throw new Error(json.error ?? 'Error al actualizar permisos');
          }}
        />
      )}

      {vistaActiva === 'auditoria' && (
        <BitacoraAuditoriaAdmin
          eventosIniciales={eventosAuditoriaIniciales}
          totalInicial={totalAuditoriaInicial}
        />
      )}

      <ModalUsuarioAdmin
        key={`${modoModal}-${usuarioSeleccionado?.id ?? 'nuevo'}`}
        modo={modoModal}
        usuarioSeleccionado={usuarioSeleccionado}
        alCerrar={() => setModoModal(null)}
        alGuardarCreacion={async (datos) => {
          const res = await fetch('/api/admin/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
          });
          const json = (await res.json()) as { exito: boolean; error?: string };
          if (!json.exito) throw new Error(json.error ?? 'Error al crear usuario');
          await recargarUsuarios();
        }}
        alGuardarEdicion={async (id, datos) => {
          const res = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
          });
          const json = (await res.json()) as { exito: boolean; error?: string };
          if (!json.exito) throw new Error(json.error ?? 'Error al actualizar usuario');
          await recargarUsuarios();
        }}
        alGuardarPassword={async (id, nuevaPassword) => {
          const res = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevaPassword }),
          });
          const json = (await res.json()) as { exito: boolean; error?: string };
          if (!json.exito) throw new Error(json.error ?? 'Error al restablecer contraseña');
        }}
      />
    </div>
  );
};
