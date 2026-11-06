'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RolUsuario } from '@/config/types';
import { tienePermiso } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { obtenerAlertasPendientesPorRol } from '../utils/alertas-requisiciones';
import type { Requisicion } from '../types';
import { AlertasRequisicionesRol } from './AlertasRequisicionesRol';
import { BandejaRequisiciones } from './BandejaRequisiciones';
import { FormularioNuevaRequisicion } from './FormularioNuevaRequisicion';
import { ModalHistorialRequisicion } from './ModalHistorialRequisicion';

type VistaRequisiciones = 'mis_requisiciones' | 'todas' | 'formulario' | 'aprobaciones';

export interface PropiedadesVistaModuloRequisiciones {
  requisicionesIniciales: Requisicion[];
  rolUsuario: RolUsuario;
  nombreUsuario: string;
  idUsuario?: string;
}

export const VistaModuloRequisiciones: React.FC<PropiedadesVistaModuloRequisiciones> = ({
  requisicionesIniciales,
  rolUsuario,
  nombreUsuario,
  idUsuario,
}) => {
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub');
  const puedeVerTodas = tienePermiso(rolUsuario, 'requisiciones', 'ver');
  const puedeCrear = tienePermiso(rolUsuario, 'requisiciones', 'crear');
  const puedeAprobar =
    tienePermiso(rolUsuario, 'requisiciones', 'aprobar') ||
    tienePermiso(rolUsuario, 'requisiciones', 'editar');
  const puedeExportar = tienePermiso(rolUsuario, 'requisiciones', 'exportar');

  const vistaDesdeSub: VistaRequisiciones =
    subParam === 'compras-nueva'
      ? 'formulario'
      : subParam === 'compras-mis-requisiciones'
      ? 'mis_requisiciones'
      : subParam === 'compras-aprobaciones' && puedeAprobar
      ? 'aprobaciones'
      : puedeVerTodas
      ? 'todas'
      : 'mis_requisiciones';

  const [seleccionManual, setSeleccionManual] = useState<{
    subBase: string | null;
    vista: VistaRequisiciones;
  } | null>(null);
  const vista: VistaRequisiciones =
    seleccionManual && seleccionManual.subBase === subParam
      ? seleccionManual.vista
      : vistaDesdeSub;
  const setVista = (nuevaVista: VistaRequisiciones) =>
    setSeleccionManual({ subBase: subParam, vista: nuevaVista });

  const [requisiciones, setRequisiciones] = useState<Requisicion[]>(requisicionesIniciales);
  const [seleccionada, setSeleccionada] = useState<Requisicion | null>(null);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const notificarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => {
      setMensajeExito((actual) => (actual === msg ? null : actual));
    }, 4500);
  };

  const recargar = async () => {
    setCargandoLista(true);
    try {
      const res = await fetch('/api/requisiciones');
      const json = (await res.json()) as { exito: boolean; datos?: Requisicion[] };
      if (json.exito && json.datos) {
        setRequisiciones(json.datos);
      }
    } finally {
      setCargandoLista(false);
    }
  };

  const esMia = (r: Requisicion) =>
    (idUsuario && r.solicitanteId === idUsuario) ||
    r.solicitante.trim().toLowerCase() === nombreUsuario.trim().toLowerCase();

  const misRequisiciones = requisiciones.filter(esMia);
  const alertasRol = obtenerAlertasPendientesPorRol(requisiciones, rolUsuario);

  const listaVisible =
    vista === 'mis_requisiciones' || !puedeVerTodas ? misRequisiciones : requisiciones;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '1.1rem 1.3rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
            {puedeVerTodas
              ? 'Módulo de Requisiciones y Control Presupuestal'
              : 'Mis Requisiciones y Solicitudes'}
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {puedeVerTodas
              ? 'Flujo empresarial: Solicitud → Revisión → Aprobación por Nivel/Monto → Atención → Cierre.'
              : `Solicitante en sesión: ${nombreUsuario}. Crea requisiciones y da seguimiento puntual a tus solicitudes.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <Button
            tamano="sm"
            variante={vista === 'mis_requisiciones' ? 'primario' : 'secundario'}
            onClick={() => setVista('mis_requisiciones')}
          >
            Mis Requisiciones ({misRequisiciones.length})
          </Button>
          {puedeCrear && (
            <Button
              tamano="sm"
              variante={vista === 'formulario' ? 'primario' : 'secundario'}
              onClick={() => setVista('formulario')}
            >
              + Nueva Requisición
            </Button>
          )}
          {puedeVerTodas && (
            <Button
              tamano="sm"
              variante={vista === 'todas' ? 'primario' : 'secundario'}
              onClick={() => setVista('todas')}
            >
              Todas ({requisiciones.length})
            </Button>
          )}
          {puedeAprobar && (
            <Button
              tamano="sm"
              variante={vista === 'aprobaciones' ? 'primario' : 'secundario'}
              onClick={() => setVista('aprobaciones')}
            >
              Revisión y Aprobación ({alertasRol.length})
            </Button>
          )}
        </div>
      </div>

      {mensajeExito && (
        <div
          role="status"
          style={{
            padding: '0.7rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            fontSize: '0.83rem',
            fontWeight: 700,
          }}
        >
          ✓ {mensajeExito}
        </div>
      )}

      {puedeAprobar && (
        <AlertasRequisicionesRol
          alertas={alertasRol}
          rolUsuario={rolUsuario}
          alSeleccionarRequisicion={(id) => {
            const encontrada = requisiciones.find((r) => r.id === id);
            if (encontrada) setSeleccionada(encontrada);
          }}
        />
      )}

      {vista === 'formulario' && puedeCrear ? (
        <FormularioNuevaRequisicion
          nombreUsuarioActual={nombreUsuario}
          alGuardar={async (datos) => {
            const res = await fetch('/api/requisiciones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(datos),
            });
            const json = (await res.json()) as {
              exito: boolean;
              datos?: Requisicion;
              error?: string;
            };
            if (!json.exito) throw new Error(json.error ?? 'Error al guardar requisición');
            await recargar();
            setVista('mis_requisiciones');
            notificarExito(
              `Requisición ${json.datos?.folio ?? ''} creada en estado "Solicitud". Se registró en auditoría y se notificó a los revisores autorizados.`
            );
          }}
        />
      ) : (
        <BandejaRequisiciones
          requisiciones={listaVisible}
          puedeExportar={puedeExportar}
          cargando={cargandoLista}
          soloPropias={vista === 'mis_requisiciones' || !puedeVerTodas}
          nombreUsuarioActual={nombreUsuario}
          idUsuarioActual={idUsuario}
          alVerDetalle={(req) => setSeleccionada(req)}
          alIrANueva={puedeCrear ? () => setVista('formulario') : undefined}
        />
      )}

      <ModalHistorialRequisicion
        requisicion={seleccionada}
        puedeAprobar={puedeAprobar}
        esSolicitante={seleccionada ? esMia(seleccionada) : false}
        alCerrar={() => setSeleccionada(null)}
        alTransicionar={async (id, nuevoEstado, comentario) => {
          const res = await fetch(`/api/requisiciones/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado, comentario }),
          });
          const json = (await res.json()) as {
            exito: boolean;
            datos?: Requisicion;
            error?: string;
          };
          if (!json.exito) throw new Error(json.error ?? 'No se pudo cambiar el estado');
          await recargar();
          notificarExito(
            `Estado de la requisición ${json.datos?.folio ?? ''} actualizado correctamente.`
          );
        }}
      />
    </div>
  );
};
