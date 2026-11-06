'use client';

import { ALMACENES } from '../data/mock-data';
import { AlmacenButton } from './ui/AlmacenButton';

interface FiltrosInventarioProps {
  almacenSeleccionado: string;
  onAlmacenChange: (almacen: string) => void;
  categoriaSeleccionada: string;
  onCategoriaChange: (categoria: string) => void;
  estadoSeleccionado: string;
  onEstadoChange: (estado: string) => void;
  onLimpiarFiltros: () => void;
  filtrosActivos: boolean;
}

export function FiltrosInventario({
  almacenSeleccionado,
  onAlmacenChange,
  categoriaSeleccionada,
  onCategoriaChange,
  estadoSeleccionado,
  onEstadoChange,
  onLimpiarFiltros,
  filtrosActivos,
}: FiltrosInventarioProps) {
  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-card)',
        backgroundColor: 'var(--surface-alt)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
            tune
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-label)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-primary)',
            }}
          >
            Filtros de Inventario y Flujo de Almacén
          </span>
          {filtrosActivos && (
            <span
              style={{
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--nav-active-bg)',
                color: 'var(--primary)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
              }}
            >
              Filtro Activo
            </span>
          )}
        </div>

        <AlmacenButton
          variant="secondary"
          size="sm"
          icon="filter_alt_off"
          onClick={onLimpiarFiltros}
          disabled={!filtrosActivos}
        >
          Limpiar Filtros
        </AlmacenButton>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {/* Filtro Almacén */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            htmlFor="filtro-almacen"
            style={{
              fontFamily: 'var(--font-family-label)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              warehouse
            </span>
            Almacén / Nave
          </label>
          <select
            id="filtro-almacen"
            className="sga-select"
            value={almacenSeleccionado}
            onChange={(e) => onAlmacenChange(e.target.value)}
          >
            <option value="todos">Todos los almacenes</option>
            {ALMACENES.map((alm) => (
              <option key={alm.id} value={alm.id}>
                {alm.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Categoría */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            htmlFor="filtro-categoria"
            style={{
              fontFamily: 'var(--font-family-label)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              category
            </span>
            Categoría de Insumo
          </label>
          <select
            id="filtro-categoria"
            className="sga-select"
            value={categoriaSeleccionada}
            onChange={(e) => onCategoriaChange(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            <option value="Consumibles">Consumibles para Proyectos</option>
            <option value="Herramientas">Herramientas Retornables</option>
            <option value="Equipos de Medición">Equipos Sujetos a Calibración NOM</option>
            <option value="Mobiliario y Activos">Activos Fijos y Mobiliario</option>
            <option value="EPP">EPP y Seguridad Industrial</option>
          </select>
        </div>

        {/* Filtro Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            htmlFor="filtro-estado"
            style={{
              fontFamily: 'var(--font-family-label)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              check_circle
            </span>
            Estado Operativo
          </label>
          <select
            id="filtro-estado"
            className="sga-select"
            value={estadoSeleccionado}
            onChange={(e) => onEstadoChange(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="Disponible">Disponible en Almacén</option>
            <option value="En Proyecto">Asignado a Frente / Proyecto</option>
            <option value="Mantenimiento">En Taller / Calibración NOM</option>
            <option value="Stock Bajo">Stock Bajo / Reorden</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default FiltrosInventario;
