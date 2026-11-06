'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlmacenButton as Button } from '../components/ui/AlmacenButton';
import { AlmacenBadge as Badge } from '../components/ui/AlmacenBadge';
import { AlmacenModal as ModalUniversal } from '../components/ui/AlmacenModal';
import { MOCK_ARTICULOS } from '../data/mock-data';

interface Asignacion {
  id: string;
  folio: string;
  equipoNombre: string;
  sku: string;
  frenteTrabajo: string;
  solicitante: string;
  fechaPrestamo: string;
  fechaRetornoPrevista: string;
  estado: 'En Frente' | 'Por Vencer' | 'Retornado';
  calibracionVigente: boolean;
}

export default function AsignacionesProyectosPage() {
  const router = useRouter();
  const [frenteFiltro, setFrenteFiltro] = useState('todos');
  const [modalChecklistOpen, setModalChecklistOpen] = useState(false);
  const [modalNuevaAsignacion, setModalNuevaAsignacion] = useState(false);
  const [asignacionExito, setAsignacionExito] = useState(false);

  // Formulario nueva asignación
  const [selectedSku, setSelectedSku] = useState(MOCK_ARTICULOS[2]?.sku || '');
  const [nuevoFrente, setNuevoFrente] = useState('PEMEX Refinería Dos Bocas (Olmeca)');
  const [nuevoIngeniero, setNuevoIngeniero] = useState('Ing. Carlos Mendoza (Residente Obra)');
  const [diasPrestamo, setDiasPrestamo] = useState(15);

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([
    {
      id: 'asg-1',
      folio: 'ASG-2024-0041',
      equipoNombre: 'Multímetro Industrial TRMS Fluke 87V',
      sku: 'FLUKE-87V-IND',
      frenteTrabajo: 'PEMEX Refinería Dos Bocas (Olmeca)',
      solicitante: 'Ing. Carlos Mendoza',
      fechaPrestamo: '2024-10-15',
      fechaRetornoPrevista: '2024-11-05',
      estado: 'En Frente',
      calibracionVigente: true,
    },
    {
      id: 'asg-2',
      folio: 'ASG-2024-0038',
      equipoNombre: 'Torquímetro de Click 1/2" Snap-on Calibrado',
      sku: 'TORQ-SNAP-ON-12',
      frenteTrabajo: 'Plataforma Marina Akal-C (Sonda Campeche)',
      solicitante: 'Téc. Fernando Ruiz',
      fechaPrestamo: '2024-10-10',
      fechaRetornoPrevista: '2024-10-28',
      estado: 'Por Vencer',
      calibracionVigente: true,
    },
    {
      id: 'asg-3',
      folio: 'ASG-2024-0032',
      equipoNombre: 'Arnés Anticaídas Petzl Avao Bod Fast',
      sku: 'HARN-PETZL-AVAO',
      frenteTrabajo: 'CFE Central Ciclo Combinado Tuxpan',
      solicitante: 'Ing. Laura Salgado',
      fechaPrestamo: '2024-09-20',
      fechaRetornoPrevista: '2024-10-20',
      estado: 'Retornado',
      calibracionVigente: true,
    },
  ]);

  const filtradas = asignaciones.filter((a) => {
    return frenteFiltro === 'todos' || a.frenteTrabajo.includes(frenteFiltro);
  });

  const handleCrearAsignacion = (e: React.FormEvent) => {
    e.preventDefault();
    const art = MOCK_ARTICULOS.find((x) => x.sku === selectedSku);
    const newAsg: Asignacion = {
      id: `asg-${Date.now()}`,
      folio: `ASG-2024-00${asignaciones.length + 42}`,
      equipoNombre: art ? art.nombre : selectedSku,
      sku: selectedSku,
      frenteTrabajo: nuevoFrente,
      solicitante: nuevoIngeniero,
      fechaPrestamo: new Date().toISOString().slice(0, 10),
      fechaRetornoPrevista: new Date(Date.now() + diasPrestamo * 86400000).toISOString().slice(0, 10),
      estado: 'En Frente',
      calibracionVigente: true,
    };
    setAsignaciones([newAsg, ...asignaciones]);
    setAsignacionExito(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
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
              Control de Custodia & Asignaciones a Proyectos
            </h1>
            <Badge variant="select">{asignaciones.length} Registros Activos</Badge>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Trazabilidad 100% de herramientas y equipos críticos en frentes petroleros y plantas de energía
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon="arrow_back" onClick={() => router.push('/almacen')}>
            Volver a Almacén
          </Button>

          <Button
            variant="secondary"
            icon="checklist"
            onClick={() => setModalChecklistOpen(true)}
          >
            Checklist de Retorno
          </Button>

          <Button
            variant="primary"
            icon="assignment"
            onClick={() => {
              setAsignacionExito(false);
              setModalNuevaAsignacion(true);
            }}
          >
            + Nueva Asignación a Frente
          </Button>
        </div>
      </div>

      {/* FILTROS Y TABLA */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filtrar por Frente:</span>
            <select
              className="sga-select"
              value={frenteFiltro}
              onChange={(e) => setFrenteFiltro(e.target.value)}
              style={{ width: '240px' }}
            >
              <option value="todos">Todos los frentes</option>
              <option value="Dos Bocas">PEMEX Refinería Dos Bocas</option>
              <option value="Akal-C">Plataforma Marina Akal-C</option>
              <option value="Tuxpan">CFE Central Ciclo Combinado Tuxpan</option>
            </select>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Mostrando <strong>{filtradas.length}</strong> asignaciones
          </span>
        </div>

        <div className="sga-table-wrapper">
          <table className="sga-table">
            <thead>
              <tr>
                <th>Folio Vale</th>
                <th>Equipo / Herramienta</th>
                <th>Código SKU</th>
                <th>Frente de Trabajo</th>
                <th>Ingeniero / Residente</th>
                <th>Fecha Salida</th>
                <th>Retorno Previsto</th>
                <th style={{ textAlign: 'center' }}>Calibración</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((asg) => (
                <tr key={asg.id}>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    {asg.folio}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asg.equipoNombre}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem' }}>{asg.sku}</td>
                  <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{asg.frenteTrabajo}</td>
                  <td style={{ fontSize: '0.75rem' }}>{asg.solicitante}</td>
                  <td style={{ fontSize: '0.75rem' }}>{asg.fechaPrestamo}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-family-mono)' }}>{asg.fechaRetornoPrevista}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant="success" size="sm" icon="verified">
                      Vigente
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge
                      variant={asg.estado === 'Retornado' ? 'neutral' : asg.estado === 'Por Vencer' ? 'warning' : 'select'}
                      size="sm"
                    >
                      {asg.estado}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NUEVA ASIGNACIÓN */}
      <ModalUniversal
        open={modalNuevaAsignacion}
        title="Nueva Asignación de Equipo a Frente de Trabajo"
        subtitle="Emisión de vale de resguardo y registro de salida"
        onClose={() => setModalNuevaAsignacion(false)}
        footer={
          asignacionExito ? (
            <Button variant="primary" onClick={() => setModalNuevaAsignacion(false)}>
              Aceptar y Cerrar
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setModalNuevaAsignacion(false)}>
                Cancelar
              </Button>
              <Button variant="primary" icon="check_circle" onClick={handleCrearAsignacion}>
                Emitir Vale de Asignación
              </Button>
            </>
          )
        }
      >
        {asignacionExito ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)' }}>
              task_alt
            </span>
            <h3 style={{ margin: '0.5rem 0' }}>Vale de Asignación Generado</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              El equipo ha sido asignado a <strong>{nuevoFrente}</strong> bajo custodia de <strong>{nuevoIngeniero}</strong>.
            </p>
          </div>
        ) : (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="sga-field-label">
                <span className="material-symbols-outlined sga-field-label-icon">handyman</span>
                <span>Equipo / Herramienta a Prestar:</span>
              </label>
              <select
                className="sga-select"
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              >
                {MOCK_ARTICULOS.filter((x) => x.custodia !== 'Consumible').map((art) => (
                  <option key={art.id} value={art.sku}>
                    {art.sku} — {art.nombre} (Disponibles: {art.stockDisponible})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sga-field-label">
                <span className="material-symbols-outlined sga-field-label-icon">pin_drop</span>
                <span>Frente de Trabajo Destino:</span>
              </label>
              <select
                className="sga-select"
                value={nuevoFrente}
                onChange={(e) => setNuevoFrente(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              >
                <option value="PEMEX Refinería Dos Bocas (Olmeca)">PEMEX Refinería Dos Bocas (Olmeca)</option>
                <option value="Plataforma Marina Akal-C (Sonda Campeche)">Plataforma Marina Akal-C (Sonda Campeche)</option>
                <option value="CFE Central Ciclo Combinado Tuxpan">CFE Central Ciclo Combinado Tuxpan</option>
                <option value="Terminal Marítima Pajaritos">Terminal Marítima Pajaritos</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="sga-field-label">
                  <span className="material-symbols-outlined sga-field-label-icon">engineering</span>
                  <span>Ingeniero Residente:</span>
                </label>
                <input
                  type="text"
                  className="sga-input"
                  value={nuevoIngeniero}
                  onChange={(e) => setNuevoIngeniero(e.target.value)}
                  style={{ marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label className="sga-field-label">
                  <span className="material-symbols-outlined sga-field-label-icon">date_range</span>
                  <span>Días de Préstamo Estimados:</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="sga-input"
                  value={diasPrestamo}
                  onChange={(e) => setDiasPrestamo(Number(e.target.value))}
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
            </div>
          </form>
        )}
      </ModalUniversal>

      {/* MODAL: CHECKLIST DE RETORNO */}
      <ModalUniversal
        open={modalChecklistOpen}
        title="Checklist de Inspección Física al Retorno"
        subtitle="Protocolo obligatorio antes de reingresar herramientas al stock disponible"
        onClose={() => setModalChecklistOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setModalChecklistOpen(false)}>
            Completar Checklist
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            <span>1. Integridad estructural y libre de golpes mecánicos o fracturas.</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            <span>2. Sellos y hologramas de calibración NOM / ISO intactos y legibles.</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            <span>3. Puntas de prueba, cables y accesorios completos en estuche original.</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            <span>4. Prueba de encendido y verificación de cero eléctrico / mecánico superada.</span>
          </label>
        </div>
      </ModalUniversal>
    </div>
  );
}

