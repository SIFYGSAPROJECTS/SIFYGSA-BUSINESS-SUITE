'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlmacenButton as Button } from '../components/ui/AlmacenButton';
import { AlmacenBadge as Badge } from '../components/ui/AlmacenBadge';
import { AlmacenModal as ModalUniversal } from '../components/ui/AlmacenModal';
import { ALMACENES } from '../data/mock-data';

interface PartidaRecepcion {
  id: string;
  sku: string;
  nombre: string;
  cantidadPactada: number;
  cantidadRecibida: number;
  unidad: string;
  ubicacionNave: string;
  numeroSerie: string;
  observaciones: string;
  fotoAdjunta?: string;
}

export default function RecepcionMercanciaIR03Page() {
  const router = useRouter();

  // Cabecera de Entrada
  const [folio] = useState('IR03-2024-0089');
  const [ordenCompra, setOrdenCompra] = useState('PO51');
  const [proveedor] = useState('Grupo Mexicano de Seguros S.A. de C.V.');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [almacenDestino, setAlmacenDestino] = useState('principal');
  const [remisionFactura, setRemisionFactura] = useState('FAC-GMX-99421');
  const [notasGenerales, setNotasGenerales] = useState('Recepción física en andén norte conforme a especificación técnica de OC PO51.');

  // Partidas Dinámicas
  const [partidas, setPartidas] = useState<PartidaRecepcion[]>([
    {
      id: 'p-1',
      sku: 'COD-FZ-RESP-CIVIL',
      nombre: 'Fianza de responsabilidad civil amparo contrato 4162918010',
      cantidadPactada: 1,
      cantidadRecibida: 1,
      unidad: 'Servicio',
      ubicacionNave: 'Archivo Fiscal Bóveda A',
      numeroSerie: 'POL-GMX-88912',
      observaciones: 'Póliza original endosada entregada a contabilidad.',
    },
    {
      id: 'p-2',
      sku: 'DET-UVIR-FLAME-01',
      nombre: 'Detector Óptico de Flama UV/IR Multispectrum Det-Tronics',
      cantidadPactada: 10,
      cantidadRecibida: 8, // Parcial a propósito para demostrar cálculo de faltantes
      unidad: 'Pieza',
      ubicacionNave: 'Rack A-02, Nivel 1',
      numeroSerie: 'SN-X3301-881..888',
      observaciones: 'Pendiente entrega de 2 piezas por embarque foráneo.',
    },
    {
      id: 'p-3',
      sku: 'GAS-CAL-CH4-50',
      nombre: 'Cilindro Gas Patrón Metano CH4 50% LEL (34L Calgaz)',
      cantidadPactada: 15,
      cantidadRecibida: 15,
      unidad: 'Cilindro',
      ubicacionNave: 'Gabinete Criogénico G-1',
      numeroSerie: 'LOT-CAL-2024-11B',
      observaciones: 'Con certificado de trazabilidad NIST vigente.',
    },
  ]);

  // Modal de Confirmación
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [recepcionExitosa, setRecepcionExitosa] = useState(false);
  const [modalFotoPartidaId, setModalFotoPartidaId] = useState<string | null>(null);

  // Manejar cambio de cantidad recibida en tiempo real
  const handleCantidadChange = (id: string, val: number) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidadRecibida: Math.max(0, val) } : item)),
    );
  };

  const handleUbicacionChange = (id: string, val: string) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ubicacionNave: val } : item)),
    );
  };

  const handleSerieChange = (id: string, val: string) => {
    setPartidas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, numeroSerie: val } : item)),
    );
  };

  // Cálculo de totales
  const totalPactado = partidas.reduce((acc, curr) => acc + curr.cantidadPactada, 0);
  const totalRecibido = partidas.reduce((acc, curr) => acc + curr.cantidadRecibida, 0);
  const totalFaltante = Math.max(0, totalPactado - totalRecibido);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER DE RECEPCIÓN */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              Nueva Recepción de Artículo
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '1.125rem',
                fontWeight: 800,
                color: 'var(--primary)',
                backgroundColor: 'var(--badge-select-bg)',
                padding: '0.125rem 0.625rem',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--primary-light)',
              }}
            >
              {folio}
            </span>
            <Badge variant="warning">En Andén de Descarga</Badge>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Registro físico contra Orden de Compra y cotejo inmediato en kárdex
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon="arrow_back"
            onClick={() => router.push('/almacen')}
          >
            Regresar al Dashboard
          </Button>

          <Button
            variant="primary"
            icon="task_alt"
            onClick={() => {
              setRecepcionExitosa(false);
              setModalConfirmOpen(true);
            }}
          >
            Confirmar Entrada al Kárdex
          </Button>
        </div>
      </div>

      {/* CABECERA GENERAL DE ENTRADA (DATOS MAESTROS) */}
      <div
        style={{
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Folio OC */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            No. Orden de Compra <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div style={{ marginTop: '0.25rem' }}>
            <input
              type="text"
              className="sga-input"
              value={ordenCompra}
              onChange={(e) => setOrdenCompra(e.target.value)}
              style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700, color: 'var(--primary)', width: '100%' }}
            />
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Proveedor Asignado <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            className="sga-input"
            value={proveedor}
            readOnly
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        {/* Fecha de Entrada */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Fecha de Recepción <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="date"
            className="sga-input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        {/* Almacén Destino */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Almacén de Ingreso <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            className="sga-select"
            value={almacenDestino}
            onChange={(e) => setAlmacenDestino(e.target.value)}
            style={{ marginTop: '0.25rem' }}
          >
            {ALMACENES.map((alm) => (
              <option key={alm.id} value={alm.id}>
                {alm.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Folio Factura / Remisión */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Factura / Remisión de Entrega
          </label>
          <input
            type="text"
            className="sga-input"
            value={remisionFactura}
            onChange={(e) => setRemisionFactura(e.target.value)}
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        {/* Subsidiaria */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Subsidiaria Legal
          </label>
          <input
            type="text"
            className="sga-input"
            value="SIFYGSA Fire & Gas S.A. de C.V."
            readOnly
            style={{ marginTop: '0.25rem' }}
          />
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: TABLA DINÁMICA DE PARTIDAS CON CÁLCULO DE FALTANTES EN TIEMPO REAL */}
      <div
        style={{
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cotejo de Partidas & Validación en Andén
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Calcula automáticamente si el proveedor entregó la orden completa o si quedan saldos pendientes
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Total Pactado: <strong>{totalPactado} uds</strong>
            </span>
            <span>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
              Total Recibido: <strong>{totalRecibido} uds</strong>
            </span>
            {totalFaltante > 0 && (
              <>
                <span>•</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--danger-text)',
                    fontWeight: 700,
                    backgroundColor: 'var(--danger-bg)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  Faltan: {totalFaltante} unidades
                </span>
              </>
            )}
          </div>
        </div>

        <div className="sga-table-wrapper">
          <table className="sga-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>N°</th>
                <th>Código SKU</th>
                <th style={{ minWidth: '220px' }}>Descripción de la Partida</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Pactado</th>
                <th style={{ textAlign: 'center', width: '110px' }}>Recibido</th>
                <th style={{ textAlign: 'center', minWidth: '150px' }}>Cálculo de Faltante</th>
                <th>Ubicación en Nave</th>
                <th>No. de Serie / Lote</th>
                <th style={{ textAlign: 'center' }}>Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((item, index) => {
                const faltante = item.cantidadPactada - item.cantidadRecibida;
                const isCompleto = faltante === 0;
                const isParcial = faltante > 0;
                const isExcedente = faltante < 0;

                return (
                  <tr key={item.id}>
                    {/* Número */}
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-family-mono)', color: 'var(--text-muted)' }}>
                      {index + 1}
                    </td>

                    {/* SKU */}
                    <td style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700, fontSize: '0.75rem' }}>
                      {item.sku}
                    </td>

                    {/* Nombre y descripción */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nombre}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        Unidad: {item.unidad}
                      </div>
                    </td>

                    {/* Cantidad Pactada */}
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-family-label)', fontWeight: 700 }}>
                      {item.cantidadPactada}
                    </td>

                    {/* Cantidad Recibida Input interactivo */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        className="sga-input"
                        value={item.cantidadRecibida}
                        onChange={(e) => handleCantidadChange(item.id, Number(e.target.value))}
                        style={{
                          width: '80px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          padding: '0.25rem 0.5rem',
                          borderColor: isParcial ? 'var(--warning)' : 'var(--field-border)',
                        }}
                      />
                    </td>

                    {/* CÁLCULO EN TIEMPO REAL */}
                    <td style={{ textAlign: 'center' }}>
                      {isCompleto && (
                        <Badge variant="success" icon="check_circle">
                          Completo (100%)
                        </Badge>
                      )}
                      {isParcial && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--warning-bg)',
                            color: 'var(--warning-text)',
                            fontFamily: 'var(--font-family-label)',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            border: '1px solid var(--warning-text)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            error
                          </span>
                          Faltan {faltante} uds
                        </span>
                      )}
                      {isExcedente && (
                        <Badge variant="info">
                          Excedente +{Math.abs(faltante)}
                        </Badge>
                      )}
                    </td>

                    {/* Ubicación en Nave */}
                    <td>
                      <input
                        type="text"
                        className="sga-input"
                        value={item.ubicacionNave}
                        onChange={(e) => handleUbicacionChange(item.id, e.target.value)}
                        placeholder="Ej. Rack B-01"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      />
                    </td>

                    {/* Serie */}
                    <td>
                      <input
                        type="text"
                        className="sga-input"
                        value={item.numeroSerie}
                        onChange={(e) => handleSerieChange(item.id, e.target.value)}
                        placeholder="Números de Serie / Lote"
                        style={{ fontSize: '0.75rem', fontFamily: 'var(--font-family-mono)', padding: '0.25rem 0.5rem' }}
                      />
                    </td>

                    {/* Evidencia Foto */}
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon="add_a_photo"
                        onClick={() => setModalFotoPartidaId(item.id)}
                        title="Adjuntar evidencia de entrega física"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        {item.fotoAdjunta ? '1 Foto' : 'Adjuntar'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* NOTAS Y RESUMEN INFERIOR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Observaciones de Inspección en Andén:
            </label>
            <textarea
              className="sga-textarea"
              rows={2}
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
              placeholder="Detalles sobre estado de empaque, sellos de seguridad, remisión de paquetería..."
              style={{ marginTop: '0.25rem' }}
            />
          </div>
        </div>
      </div>

      {/* MODAL: SUBIR EVIDENCIA FOTOGRÁFICA */}
      {modalFotoPartidaId && (
        <ModalUniversal
          open={Boolean(modalFotoPartidaId)}
          title="Adjuntar Evidencia Fotográfica en Andén"
          subtitle="Registro de condición física al momento de la entrega"
          onClose={() => setModalFotoPartidaId(null)}
          footer={
            <Button
              variant="primary"
              onClick={() => {
                setPartidas((prev) =>
                  prev.map((p) =>
                    p.id === modalFotoPartidaId
                      ? {
                          ...p,
                          fotoAdjunta:
                            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=60',
                        }
                      : p,
                  ),
                );
                setModalFotoPartidaId(null);
              }}
            >
              Guardar Foto
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '2rem 1rem',
                backgroundColor: 'var(--surface-alt)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)' }}>
                cloud_upload
              </span>
              <p style={{ margin: '0.5rem 0 0.25rem 0', fontWeight: 600, fontSize: '0.875rem' }}>
                Arrastra aquí la foto de la remisión o del lote recibido
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Formatos soportados: JPG, PNG, WebP (Máx. 10MB)
              </span>
            </div>
          </div>
        </ModalUniversal>
      )}

      {/* MODAL: CONFIRMAR ENTRADA AL KÁRDEX */}
      <ModalUniversal
        open={modalConfirmOpen}
        title="Confirmar Entrada de Mercancía en Kárdex"
        subtitle={`Folio de Operación: ${folio}`}
        onClose={() => setModalConfirmOpen(false)}
        footer={
          recepcionExitosa ? (
            <Button
              variant="primary"
              onClick={() => {
                setModalConfirmOpen(false);
                router.push('/almacen');
              }}
            >
              Finalizar y Regresar al Dashboard
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setModalConfirmOpen(false)}>
                Revisar Partidas
              </Button>
              <Button
                variant="primary"
                icon="check_circle"
                onClick={() => setRecepcionExitosa(true)}
              >
                Confirmar e Ingresar a Inventario
              </Button>
            </>
          )
        }
      >
        {recepcionExitosa ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)' }}>
              task_alt
            </span>
            <h3 style={{ margin: '0.75rem 0 0.25rem 0', fontSize: '1.25rem' }}>
              ¡Entrada Registrada en Kárdex con Éxito!
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Se ingresaron <strong>{totalRecibido} unidades</strong> al Almacén Principal.
            </p>
            {totalFaltante > 0 && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--warning-bg)',
                  color: 'var(--warning-text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Alerta: Queda un saldo pendiente de {totalFaltante} unidades de la orden {ordenCompra}. Se notificó a Adquisiciones para seguimiento.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              ¿Deseas confirmar la recepción de los siguientes insumos en el almacén?
            </p>
            <div
              style={{
                padding: '0.875rem',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Proveedor:</span>
                <strong>{proveedor}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Orden de Compra:</span>
                <strong style={{ fontFamily: 'var(--font-family-mono)' }}>{ordenCompra}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total de Partidas Cotejadas:</span>
                <strong>{partidas.length} partidas</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Unidades Recibidas:</span>
                <strong style={{ color: 'var(--success)' }}>{totalRecibido} uds</strong>
              </div>
              {totalFaltante > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>Saldos Faltantes:</span>
                  <strong>{totalFaltante} uds pendientes</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalUniversal>
    </div>
  );
}

