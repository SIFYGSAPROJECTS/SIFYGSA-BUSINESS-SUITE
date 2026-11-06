'use client';

import React, { useState } from 'react';
import {
  NOMBRES_ROLES,
  ROLES_USUARIO,
  type RolUsuario,
  type UsuarioPublico,
} from '@/config/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ETIQUETAS_MODULOS } from '../constants';

export interface PropiedadesTablaUsuariosAdmin {
  usuarios: UsuarioPublico[];
  alAbrirCrear: () => void;
  alAbrirEditar: (usuario: UsuarioPublico) => void;
  alAbrirPassword: (usuario: UsuarioPublico) => void;
  alAlternarEstado: (usuario: UsuarioPublico) => Promise<void>;
}

export const TablaUsuariosAdmin: React.FC<PropiedadesTablaUsuariosAdmin> = ({
  usuarios,
  alAbrirCrear,
  alAbrirEditar,
  alAbrirPassword,
  alAlternarEstado,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<RolUsuario | 'todos'>('todos');

  const filtrados = usuarios.filter((u) => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '1.2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              padding: '0.48rem 0.75rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-primary)',
              minWidth: '240px',
            }}
          />
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as RolUsuario | 'todos')}
            style={{
              padding: '0.48rem 0.75rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="todos">Todos los roles</option>
            {ROLES_USUARIO.map((r) => (
              <option key={r} value={r}>
                {NOMBRES_ROLES[r]}
              </option>
            ))}
          </select>
        </div>

        <Button variante="primario" onClick={alAbrirCrear}>
          + Nuevo Usuario
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.65rem' }}>Nombre / Usuario</th>
              <th style={{ padding: '0.65rem' }}>Rol / Zona</th>
              <th style={{ padding: '0.65rem' }}>Módulos Permitidos</th>
              <th style={{ padding: '0.65rem' }}>Estado</th>
              <th style={{ padding: '0.65rem' }}>Último Acceso</th>
              <th style={{ padding: '0.65rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '0.7rem 0.65rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.nombre}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    @{u.usuario} • {u.email}
                  </div>
                </td>
                <td style={{ padding: '0.7rem 0.65rem' }}>
                  <Badge variant="brand">{NOMBRES_ROLES[u.rol]}</Badge>
                  {u.zona && (
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      ({u.zona})
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.7rem 0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {u.modulosPermitidos.map((m) => (
                      <span
                        key={m}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {ETIQUETAS_MODULOS[m]}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '0.7rem 0.65rem' }}>
                  <Badge variant={u.estado === 'activo' ? 'success' : 'danger'} dot>
                    {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td style={{ padding: '0.7rem 0.65rem', fontSize: '0.77rem', color: 'var(--text-secondary)' }}>
                  {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-MX') : 'Sin ingresos'}
                </td>
                <td style={{ padding: '0.7rem 0.65rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <Button tamano="sm" variante="secundario" onClick={() => alAbrirEditar(u)}>
                      Editar
                    </Button>
                    <Button tamano="sm" variante="secundario" onClick={() => alAbrirPassword(u)}>
                      Contraseña
                    </Button>
                    <Button
                      tamano="sm"
                      variante={u.estado === 'activo' ? 'peligro' : 'exito'}
                      onClick={() => void alAlternarEstado(u)}
                    >
                      {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
