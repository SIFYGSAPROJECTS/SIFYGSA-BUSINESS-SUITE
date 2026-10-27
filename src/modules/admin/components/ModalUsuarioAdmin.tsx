'use client';

import React, { useState } from 'react';
import {
  IDS_MODULOS,
  NOMBRES_ROLES,
  ROLES_USUARIO,
  ZONAS_COMERCIALES,
  type EstadoUsuario,
  type IdModulo,
  type RolUsuario,
  type UsuarioPublico,
  type ZonaComercial,
} from '@/config/types';
import { obtenerModulosPorDefectoRol } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { ModalUniversal } from '@/components/ui/ModalUniversal';
import { ETIQUETAS_MODULOS } from '../constants';

export interface PropiedadesModalUsuarioAdmin {
  modo: 'crear' | 'editar' | 'password' | null;
  usuarioSeleccionado: UsuarioPublico | null;
  alCerrar: () => void;
  alGuardarCreacion: (datos: {
    nombre: string;
    usuario: string;
    email: string;
    password: string;
    rol: RolUsuario;
    zona?: ZonaComercial;
    departamento?: string;
    modulosPermitidos: IdModulo[];
  }) => Promise<void>;
  alGuardarEdicion: (
    id: string,
    datos: {
      nombre: string;
      email: string;
      rol: RolUsuario;
      zona?: ZonaComercial;
      departamento?: string;
      estado: EstadoUsuario;
      modulosPermitidos: IdModulo[];
    }
  ) => Promise<void>;
  alGuardarPassword: (id: string, nuevaPassword: string) => Promise<void>;
}

export const ModalUsuarioAdmin: React.FC<PropiedadesModalUsuarioAdmin> = ({
  modo,
  usuarioSeleccionado,
  alCerrar,
  alGuardarCreacion,
  alGuardarEdicion,
  alGuardarPassword,
}) => {
  const [nombre, setNombre] = useState(usuarioSeleccionado?.nombre ?? '');
  const [usuario, setUsuario] = useState(usuarioSeleccionado?.usuario ?? '');
  const [email, setEmail] = useState(usuarioSeleccionado?.email ?? '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>(usuarioSeleccionado?.rol ?? 'vendedor');
  const [zona, setZona] = useState<ZonaComercial | ''>(usuarioSeleccionado?.zona ?? 'Istmo');
  const [estado, setEstado] = useState<EstadoUsuario>(usuarioSeleccionado?.estado ?? 'activo');
  const [modulos, setModulos] = useState<IdModulo[]>(
    usuarioSeleccionado?.modulosPermitidos ?? obtenerModulosPorDefectoRol('vendedor')
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!modo) return null;

  const alternarModulo = (idMod: IdModulo) => {
    setModulos((prev) =>
      prev.includes(idMod) ? prev.filter((m) => m !== idMod) : [...prev, idMod]
    );
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      if (modo === 'crear') {
        await alGuardarCreacion({
          nombre,
          usuario,
          email,
          password,
          rol,
          zona: zona || undefined,
          modulosPermitidos: modulos,
        });
      } else if (modo === 'editar' && usuarioSeleccionado) {
        await alGuardarEdicion(usuarioSeleccionado.id, {
          nombre,
          email,
          rol,
          zona: zona || undefined,
          estado,
          modulosPermitidos: modulos,
        });
      } else if (modo === 'password' && usuarioSeleccionado) {
        await alGuardarPassword(usuarioSeleccionado.id, password);
      }
      alCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setCargando(false);
    }
  };

  const estiloCampo: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.7rem',
    borderRadius: 'var(--radius-control)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
  };

  return (
    <ModalUniversal
      abierto={Boolean(modo)}
      alCerrar={alCerrar}
      titulo={
        modo === 'crear'
          ? 'Crear Nuevo Usuario'
          : modo === 'editar'
          ? `Editar Usuario: ${usuarioSeleccionado?.nombre ?? ''}`
          : `Restablecer Contraseña: @${usuarioSeleccionado?.usuario ?? ''}`
      }
    >
      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {error && (
          <div style={{ padding: '0.6rem', borderRadius: '6px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        {modo === 'password' ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              Nueva Contraseña (se almacenará con hash bcryptjs)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={estiloCampo}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Nombre Completo</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={estiloCampo} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Usuario (Login)</label>
                <input
                  type="text"
                  required
                  disabled={modo === 'editar'}
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  style={estiloCampo}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Correo Corporativo</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={estiloCampo} />
              </div>
              {modo === 'crear' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Contraseña Inicial</label>
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={estiloCampo} />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoUsuario)} style={estiloCampo}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Rol</label>
                <select
                  value={rol}
                  onChange={(e) => {
                    const nuevoRol = e.target.value as RolUsuario;
                    setRol(nuevoRol);
                    setModulos(obtenerModulosPorDefectoRol(nuevoRol));
                  }}
                  style={estiloCampo}
                >
                  {ROLES_USUARIO.map((r) => (
                    <option key={r} value={r}>{NOMBRES_ROLES[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.25rem' }}>Zona Comercial</label>
                <select value={zona} onChange={(e) => setZona(e.target.value as ZonaComercial)} style={estiloCampo}>
                  {ZONAS_COMERCIALES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>Módulos Permitidos</label>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {IDS_MODULOS.map((idMod) => (
                  <label key={idMod} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                    <input
                      type="checkbox"
                      checked={modulos.includes(idMod)}
                      onChange={() => alternarModulo(idMod)}
                    />
                    <span>{ETIQUETAS_MODULOS[idMod]}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
          <Button variante="secundario" onClick={alCerrar}>Cancelar</Button>
          <Button type="submit" variante="primario" cargando={cargando}>Guardar Cambios</Button>
        </div>
      </form>
    </ModalUniversal>
  );
};
