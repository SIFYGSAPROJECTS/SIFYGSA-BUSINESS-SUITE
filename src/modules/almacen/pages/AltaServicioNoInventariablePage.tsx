'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlmacenButton as Button } from '../components/ui/AlmacenButton';
import { AlmacenModal as ModalUniversal } from '../components/ui/AlmacenModal';

export default function AltaServicioNoInventariablePage() {
  const router = useRouter();

  // Estados del Formulario
  const [codigo, setCodigo] = useState('SRV-CALIB-NOM-01');
  const [nombre, setNombre] = useState('Servicio de Calibración Acreditada ISO/IEC 17025 en Laboratorio');
  const [tipoServicio, setTipoServicio] = useState('Calibración y Metrología');
  const [proveedor, setProveedor] = useState('Laboratorio Metrológico del Golfo S.A. de C.V.');
  const [contrato, setContrato] = useState('SFG-C157-RRN-SRV-2024');
  const [claveSat, setClaveSat] = useState('81141500 - Servicios de pruebas y calibración');
  const [unidadSat, setUnidadSat] = useState('E48 - Unidad de servicio');
  const [centroCostos, setCentroCostos] = useState('Operaciones : Fuego y Gas Industrial');
  const [facturable, setFacturable] = useState(true);
  const [importeEstimado, setImporteEstimado] = useState(24500);
  const [moneda, setMoneda] = useState('MXN');
  const [descripcion, setDescripcion] = useState(
    'Calibración y emisión de dictamen de trazabilidad certificado por entidad mexicana de acreditación para detectores de flama y multímetros de cuadrilla PEMEX.',
  );

  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1
            className="font-headline-lg"
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Alta de Servicio / Artículo no Inventariable
          </h1>
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-family-label)',
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
            }}
          >
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>SGA Almacén</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              chevron_right
            </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Servicios No Inventariables</span>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button variant="secondary" icon="arrow_back" onClick={() => router.push('/almacen')}>
            Cancelar
          </Button>
          <Button variant="primary" icon="save" onClick={handleSubmit}>
            Guardar Servicio
          </Button>
        </div>
      </div>

      {/* AVISO INFORMATIVO TÉCNICO */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--info-bg)',
          border: '1px solid var(--info-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--info-icon)', fontSize: '24px' }}>
          info
        </span>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
          <strong>Módulo de Gastos y Servicios Operativos:</strong> Este registro no afecta existencias físicas de kárdex
          ni demanda conteo en andén. Se vincula directamente a pólizas, órdenes de compra PO51 y centros de costos de frentes.
        </div>
      </div>

      {/* FORMULARIO PRINCIPAL */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* SECCIÓN 1: IDENTIFICACIÓN DEL SERVICIO */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-card)',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
              badge
            </span>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>1. Identificación del Servicio / Gasto</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Código de Servicio <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="sga-input"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700, marginTop: '0.25rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Tipo de Servicio <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                className="sga-select"
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              >
                <option value="Calibración y Metrología">Calibración y Metrología Acreditada NOM/ISO</option>
                <option value="Fletes y Maniobras">Fletes, Grúas y Maniobras de Transporte</option>
                <option value="Consultoría Técnica">Consultoría e Ingeniería Especializada</option>
                <option value="Arrendamiento">Arrendamiento de Maquinaria y Equipos</option>
                <option value="Seguros y Fianzas">Pólizas de Seguros y Fianzas Contractuales</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Nombre Oficial del Servicio <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="sga-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{ marginTop: '0.25rem' }}
                required
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: PROVEEDOR Y FACTURACIÓN */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-card)',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
              account_balance
            </span>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>2. Adjudicación y Parámetros Contables</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Proveedor Contratado
              </label>
              <input
                type="text"
                className="sga-input"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Contrato / Requisición Asociada
              </label>
              <input
                type="text"
                className="sga-input"
                value={contrato}
                onChange={(e) => setContrato(e.target.value)}
                style={{ fontFamily: 'var(--font-family-mono)', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Centro de Costos Operativo
              </label>
              <select
                className="sga-select"
                value={centroCostos}
                onChange={(e) => setCentroCostos(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              >
                <option value="Operaciones : Fuego y Gas Industrial">Operaciones : Fuego y Gas Industrial</option>
                <option value="Dirección : Servicios">Dirección : Servicios y Adquisiciones</option>
                <option value="Mantenimiento : Subestaciones CFE">Mantenimiento : Subestaciones CFE</option>
                <option value="Proyectos Marinos : Plataformas PEMEX">Proyectos Marinos : Plataformas PEMEX</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Importe Estimado (Sin IVA)
              </label>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                <select
                  className="sga-select"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  style={{ width: '80px' }}
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  type="number"
                  className="sga-input"
                  value={importeEstimado}
                  onChange={(e) => setImporteEstimado(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: CLAVES FISCALES SAT CFDI 4.0 */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-card)',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
              receipt_long
            </span>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>3. Cumplimiento Fiscal SAT (CFDI 4.0)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Clave de Servicio SAT
              </label>
              <input
                type="text"
                className="sga-input"
                value={claveSat}
                onChange={(e) => setClaveSat(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Clave Unidad SAT
              </label>
              <input
                type="text"
                className="sga-input"
                value={unidadSat}
                onChange={(e) => setUnidadSat(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <input
                type="checkbox"
                id="check-facturable"
                checked={facturable}
                onChange={(e) => setFacturable(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="check-facturable" style={{ fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                Servicio Facturable / Repercutible al Cliente Final
              </label>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Alcance y Justificación Técnica del Servicio:
            </label>
            <textarea
              className="sga-textarea"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{ marginTop: '0.25rem' }}
            />
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => router.push('/almacen')}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" icon="check_circle">
            Registrar Servicio
          </Button>
        </div>
      </form>

      {/* MODAL DE ÉXITO */}
      <ModalUniversal
        open={modalOpen}
        title="Servicio Registrado en SGA Web"
        subtitle={`Código: ${codigo}`}
        onClose={() => {
          setModalOpen(false);
          router.push('/almacen');
        }}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setModalOpen(false);
              router.push('/almacen');
            }}
          >
            Aceptar y Regresar
          </Button>
        }
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--success)' }}>
            verified
          </span>
          <h3 style={{ margin: '0.5rem 0 0.25rem 0' }}>Alta Concluida con Éxito</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            El servicio ha sido incorporado al catálogo administrativo y asignado al centro de costos{' '}
            <strong>{centroCostos}</strong> para imputación de órdenes de compra.
          </p>
        </div>
      </ModalUniversal>
    </div>
  );
}

