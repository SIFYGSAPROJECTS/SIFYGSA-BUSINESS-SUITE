'use client';

import React, { useState } from 'react';
import {
  ACCIONES_PERMISO,
  IDS_MODULOS,
  NOMBRES_ROLES,
  ROLES_USUARIO,
  type AccionPermiso,
  type IdModulo,
  type MatrizPermisos,
  type RolUsuario,
} from '@/config/types';
import { Button } from '@/components/ui/Button';
import { ETIQUETAS_ACCIONES, ETIQUETAS_MODULOS } from '../constants';

export interface PropiedadesMatrizPermisosAdmin {
  matrizInicial: MatrizPermisos;
  alGuardarMatriz: (nuevaMatriz: MatrizPermisos) => Promise<void>;
}

export const MatrizPermisosAdmin: React.FC<PropiedadesMatrizPermisosAdmin> = ({
  matrizInicial,
  alGuardarMatriz,
}) => {
  const [rolActivo, setRolActivo] = useState<RolUsuario>('gerente');
  const [matriz, setMatriz] = useState<MatrizPermisos>(matrizInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const alternarAccion = (modulo: IdModulo, accion: AccionPermiso) => {
    if (rolActivo === 'administrador') return;
    setMatriz((prev) => {
      const actuales = prev[rolActivo][modulo] ?? [];
      const existe = actuales.includes(accion);
      const nuevas = existe
        ? actuales.filter((a) => a !== accion)
        : [...actuales, accion];
      return {
        ...prev,
        [rolActivo]: {
          ...prev[rolActivo],
          [modulo]: nuevas,
        },
      };
    });
  };

  const manejarGuardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await alGuardarMatriz(matriz);
      setMensaje('Matriz de permisos actualizada en data/roles-permisos.json');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
            Matriz Tipada de Permisos (`Rol → Módulo → Acciones`)
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Los cambios se persisten en `data/roles-permisos.json` y se validan en el servidor.
          </p>
        </div>

        <Button
          variante="primario"
          cargando={guardando}
          disabled={rolActivo === 'administrador'}
          onClick={() => void manejarGuardar()}
        >
          Guardar Permisos en JSON
        </Button>
      </div>

      {mensaje && (
        <div style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', borderRadius: '6px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', fontSize: '0.82rem', fontWeight: 600 }}>
          ✓ {mensaje}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {ROLES_USUARIO.map((rol) => (
          <button
            key={rol}
            type="button"
            onClick={() => setRolActivo(rol)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              backgroundColor: rolActivo === rol ? 'var(--primary)' : 'var(--surface-alt)',
              color: rolActivo === rol ? 'var(--on-primary)' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {NOMBRES_ROLES[rol]}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.65rem' }}>Módulo del Sistema</th>
              {ACCIONES_PERMISO.map((acc) => (
                <th key={acc} style={{ padding: '0.65rem', textAlign: 'center' }}>
                  {ETIQUETAS_ACCIONES[acc]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IDS_MODULOS.map((mod) => {
              const accionesActivas = matriz[rolActivo]?.[mod] ?? [];
              return (
                <tr key={mod} style={{ borderBottom: '1px solid var(--divider)' }}>
                  <td style={{ padding: '0.75rem 0.65rem', fontWeight: 700 }}>
                    {ETIQUETAS_MODULOS[mod]}
                  </td>
                  {ACCIONES_PERMISO.map((acc) => (
                    <td key={acc} style={{ padding: '0.75rem 0.65rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={rolActivo === 'administrador'}
                        checked={accionesActivas.includes(acc)}
                        onChange={() => alternarAccion(mod, acc)}
                        style={{ width: 16, height: 16, cursor: rolActivo === 'administrador' ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
