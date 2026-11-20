'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAlmacen } from '../context/AlmacenContext';
import { Stepper, type StepItem } from '@/components/ui/Stepper';

const TIPOS_SERVICIO_CATALOGO = [
  'Calibración y Metrología Acreditada NOM/ISO',
  'Fletes, Grúas y Maniobras de Transporte',
  'Consultoría e Ingeniería Especializada',
  'Arrendamiento de Maquinaria y Equipos',
  'Pólizas de Seguros y Fianzas Contractuales',
  'Mantenimiento Especializado en Sitio',
  'Pruebas Hidrostáticas y Ensayos No Destructivos',
];

const CENTROS_COSTOS = [
  'Operaciones : Fuego y Gas Industrial',
  'Dirección : Servicios y Adquisiciones',
  'Mantenimiento : Subestaciones CFE',
  'Proyectos Marinos : Plataformas PEMEX',
  'Automatización & SCADA',
  'Ingeniería & Telecomunicaciones',
];


const PASOS_SERVICIO: StepItem[] = [
  {
    id: 1,
    title: 'Identificación del Servicio',
    description: 'Código, nombre oficial y tipo de servicio',
  },
  {
    id: 2,
    title: 'Clasificación & Contable',
    description: 'Proveedor, centro de costos y presupuesto',
  },
  {
    id: 3,
    title: 'Fiscal (CFDI 4.0) & Justificación',
    description: 'Claves SAT, facturable y alcance técnico',
  },
];

export default function AltaServicioNoInventariablePage() {
  const router = useRouter();
  const { mostrarToast } = useAlmacen();


  // Estados de Pasos (Stepper SIFYGSA)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const validarPaso1 = (): boolean => {
    if (!codigo.trim()) {
      mostrarToast('El código de servicio es obligatorio.', 'error');
      return false;
    }
    if (!nombre.trim()) {
      mostrarToast('El nombre oficial del servicio es obligatorio.', 'error');
      return false;
    }
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (!proveedor.trim()) {
      mostrarToast('El proveedor sugerido es obligatorio.', 'error');
      return false;
    }
    if (!centroCostos.trim()) {
      mostrarToast('El centro de costos es obligatorio.', 'error');
      return false;
    }
    return true;
  };

  const validarPaso3 = (): boolean => {
    if (!descripcion.trim()) {
      mostrarToast('El alcance y justificación técnica son obligatorios.', 'error');
      return false;
    }
    return true;
  };

  const handleContinuar = () => {
    if (currentStep === 1) {
      if (!validarPaso1()) return;
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!validarPaso2()) return;
      setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAtras = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNum: number) => {
    if (stepNum === currentStep) return;
    if (stepNum < currentStep || completedSteps.includes(stepNum)) {
      setCurrentStep(stepNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentStep === 1 && !validarPaso1()) return;
    if (currentStep === 2 && !validarPaso2()) return;
    setCurrentStep(stepNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Estados del Formulario (Sección 1: Identificación)
  const [codigo, setCodigo] = useState('SRV-CALIB-NOM-01');
  const [nombre, setNombre] = useState('Servicio de Calibración Acreditada ISO/IEC 17025 en Laboratorio');
  const [tipoServicio, setTipoServicio] = useState(TIPOS_SERVICIO_CATALOGO[0]);

  // Sección 2: Adjudicación y Parámetros Contables
  const [proveedor, setProveedor] = useState('Laboratorio Metrológico del Golfo S.A. de C.V.');
  const [contrato, setContrato] = useState('SFG-C157-RRN-SRV-2024');
  const [centroCostos, setCentroCostos] = useState(CENTROS_COSTOS[0]);
  const [importeEstimado, setImporteEstimado] = useState(24500);
  const [moneda, setMoneda] = useState('MXN');

  // Sección 3: Cumplimiento Fiscal y Justificación
  const [claveSat, setClaveSat] = useState('81141500 - Servicios de pruebas y calibración');
  const [unidadSat, setUnidadSat] = useState('E48 - Unidad de servicio');
  const [facturable, setFacturable] = useState(true);
  const [descripcion, setDescripcion] = useState(
    'Calibración y emisión de dictamen de trazabilidad certificado por entidad mexicana de acreditación para detectores de flama y multímetros de cuadrilla PEMEX.',
  );

  // Estados de retroalimentación
  const [modalOpen, setModalOpen] = useState(false);
  const [borradorGuardado, setBorradorGuardado] = useState(false);

  const handleGuardarBorrador = () => {
    setBorradorGuardado(true);
    mostrarToast('Borrador de servicio guardado localmente de forma segura.', 'info');
    setTimeout(() => {
      setBorradorGuardado(false);
    }, 2500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validarPaso1()) { setCurrentStep(1); return; }
    if (!validarPaso2()) { setCurrentStep(2); return; }
    if (!validarPaso3()) { setCurrentStep(3); return; }

    setCompletedSteps([1, 2, 3]);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen selection:bg-[#1D4ED8] selection:text-white pb-36 transition-colors" style={{ background: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full pt-6 max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Migas de Pan, Título y Metadatos */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <nav aria-label="Migas de pan" className="flex items-center gap-2 mb-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <button
                type="button"
                onClick={() => router.push('/almacen')}
                className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
              >
                Almacén
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => router.push('/almacen/servicios')}
                className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
              >
                Servicios
              </button>
              <span>/</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Alta de Servicio No Inventariable</span>
            </nav>
            <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Alta de Servicio / Artículo no Inventariable
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Registro de servicios, fletes, calibraciones y gastos directos vinculados a frentes de obra y proyectos.
            </p>
          </div>

          {/* Badge a la derecha: Folio Sugerido y Estado Borrador */}
          <div className="flex items-center gap-3 self-start md:self-auto px-4 py-2.5 rounded-xl shadow-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Folio Sugerido
              </span>
              <span className="text-lg font-bold text-emerald-500 font-mono">
                SRV #{codigo || 'SRV-001'}
              </span>
            </div>
            <div className="h-8 w-px" style={{ background: 'var(--divider)' }} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border, var(--border))' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Borrador Activo
            </span>
          </div>
        </div>


        {/* ── STEPPER CORPORATIVO SIFYGSA ── */}
        <div className="mb-6">
          <Stepper
            steps={PASOS_SERVICIO}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Formulario en Cascada */}
        <form onSubmit={handleSubmit} id="formAltaServicio" className="space-y-6">
          
          {/* ====================================================================
              SECCIÓN 1: IDENTIFICACIÓN DEL SERVICIO / GASTO
             ==================================================================== */}
          {currentStep === 1 && (
          <div className="rounded-xl shadow-xs overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-3.5 flex items-center justify-between" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  1
                </span>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  1. Identificación del Servicio / Gasto
                </h2>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--border)' }}>
                Datos Principales
              </span>
            </div>

            <div className="p-6 space-y-5" style={{ background: 'var(--card)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Código de Servicio */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="codigoServicio" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    CÓDIGO DE SERVICIO <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="codigoServicio"
                      type="text"
                      required
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      placeholder="Ej. SRV-CALIB-NOM-01"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl font-mono text-sm font-bold transition-all outline-none shadow-xs"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    />
                    {codigo.trim() && (
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-[20px]" title="Código válido">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>

                {/* Tipo de Servicio */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tipoServicioSelect" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    TIPO DE SERVICIO <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="tipoServicioSelect"
                      value={tipoServicio}
                      onChange={(e) => setTipoServicio(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-sm cursor-pointer font-medium outline-none shadow-xs"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    >
                      {TIPOS_SERVICIO_CATALOGO.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]" style={{ color: 'var(--text-muted)' }}>
                      arrow_drop_down
                    </span>
                  </div>
                </div>
              </div>

              {/* Nombre Oficial del Servicio */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombreServicio" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  NOMBRE OFICIAL DEL SERVICIO <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nombreServicio"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Servicio de Calibración Acreditada ISO/IEC 17025 en Laboratorio"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all outline-none shadow-xs"
                  style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                />
              </div>
            </div>
          </div>
          )}

          {/* ====================================================================
              SECCIÓN 2: ADJUDICACIÓN Y PARÁMETROS CONTABLES
             ==================================================================== */}
          {currentStep === 2 && (
          <div className="rounded-xl shadow-xs overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-3.5 flex items-center justify-between" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  2
                </span>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  2. Adjudicación y Parámetros Contables
                </h2>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--border)' }}>
                Organización &amp; Centro de Costos
              </span>
            </div>

            <div className="p-6 space-y-5" style={{ background: 'var(--card)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Proveedor Contratado */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="proveedorServicio" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    PROVEEDOR CONTRATADO
                  </label>
                  <input
                    id="proveedorServicio"
                    type="text"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    placeholder="Razón Social o Proveedor..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all outline-none shadow-xs"
                    style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                  />
                </div>

                {/* Contrato / Requisición Asociada */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contratoServicio" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    CONTRATO / REQUISICIÓN ASOCIADA
                  </label>
                  <input
                    id="contratoServicio"
                    type="text"
                    value={contrato}
                    onChange={(e) => setContrato(e.target.value)}
                    placeholder="Ej. SFG-C157-RRN-SRV-2024"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all outline-none shadow-xs"
                    style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                  />
                </div>

                {/* Centro de Costos Operativo */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="centroCostosSelect" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    CENTRO DE COSTOS OPERATIVO
                  </label>
                  <div className="relative">
                    <select
                      id="centroCostosSelect"
                      value={centroCostos}
                      onChange={(e) => setCentroCostos(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl text-sm cursor-pointer font-medium outline-none shadow-xs"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    >
                      {CENTROS_COSTOS.map((cc) => (
                        <option key={cc} value={cc}>
                          {cc}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[18px]" style={{ color: 'var(--text-muted)' }}>
                      arrow_drop_down
                    </span>
                  </div>
                </div>

                {/* Importe Estimado */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="importeEstimadoInput" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    IMPORTE ESTIMADO (SIN IVA)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-24 shrink-0">
                      <select
                        value={moneda}
                        onChange={(e) => setMoneda(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 pr-7 rounded-xl font-mono text-sm font-bold cursor-pointer outline-none shadow-xs"
                        style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                      >
                        <option value="MXN">MXN</option>
                        <option value="USD">USD</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[16px]" style={{ color: 'var(--text-muted)' }}>
                        arrow_drop_down
                      </span>
                    </div>
                    <input
                      id="importeEstimadoInput"
                      type="number"
                      step="any"
                      value={importeEstimado}
                      onChange={(e) => setImporteEstimado(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all outline-none shadow-xs"
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ====================================================================
              SECCIÓN 3: CUMPLIMIENTO FISCAL SAT (CFDI 4.0) & JUSTIFICACIÓN
             ==================================================================== */}
          {currentStep === 3 && (
          <div className="rounded-xl shadow-xs overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-3.5 flex items-center justify-between" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  3
                </span>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  3. Cumplimiento Fiscal SAT (CFDI 4.0) &amp; Justificación
                </h2>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--border)' }}>
                SAT &amp; Alcance
              </span>
            </div>

            <div className="p-6 space-y-6" style={{ background: 'var(--card)' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                {/* Clave SAT */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="claveSatServicio" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    CLAVE DE SERVICIO SAT
                  </label>
                  <input
                    id="claveSatServicio"
                    type="text"
                    value={claveSat}
                    onChange={(e) => setClaveSat(e.target.value)}
                    placeholder="81141500 - Servicios de pruebas..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all outline-none shadow-xs"
                    style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                  />
                </div>

                {/* Clave Unidad SAT */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unidadSatServicio" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    CLAVE UNIDAD SAT
                  </label>
                  <input
                    id="unidadSatServicio"
                    type="text"
                    value={unidadSat}
                    onChange={(e) => setUnidadSat(e.target.value)}
                    placeholder="E48 - Unidad de servicio"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all outline-none shadow-xs"
                    style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                  />
                </div>

                {/* Checkbox Facturable */}
                <div className="flex items-center gap-3 p-3 rounded-xl h-[46px]" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    id="check-facturable"
                    checked={facturable}
                    onChange={(e) => setFacturable(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="check-facturable" className="text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--text-primary)' }}>
                    Servicio Facturable / Repercutible a Cliente
                  </label>
                </div>
              </div>

              {/* ── ALCANCE Y JUSTIFICACIÓN TÉCNICA DEL SERVICIO ── */}
              <div className="col-span-full w-full flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid var(--divider)' }}>
                <label
                  htmlFor="descripcionServicio"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--primary)' }}>
                    description
                  </span>
                  <span>Alcance y Justificación Técnica del Servicio</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="descripcionServicio"
                  rows={4}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalla las especificaciones técnicas, alcances, entregables y justificación del servicio..."
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none resize-y min-h-[120px] leading-relaxed shadow-xs block"
                  style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}
                />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Este texto se heredará directamente en las Órdenes de Compra y cotizaciones de proyectos.
                </span>
              </div>
            </div>
          </div>
          )}

        </form>
      </main>

      {/* ====================================================================
          BARRA INFERIOR FIJA DE ACCIONES (STICKY BOTTOM BAR)
         ==================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 py-3.5 z-40 px-4 md:px-8 transition-all duration-200" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 25px rgba(0,0,0,0.15)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Indicador guardado automático */}
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-center sm:justify-start" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium truncate">Guardado automático en borrador (hace unos segundos)</span>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => router.push('/almacen')}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAtras}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                <span>Atrás</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGuardarBorrador}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
              style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {borradorGuardado ? (
                <>
                  <span className="material-symbols-outlined text-[17px] text-emerald-500">check</span>
                  <span className="text-emerald-500">¡Guardado!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[17px] text-emerald-500">save</span>
                  <span>Guardar Borrador</span>
                </>
              )}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleContinuar}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                style={{ background: 'var(--primary)' }}
              >
                <span>Continuar</span>
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="submit"
                form="formAltaServicio"
                className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                style={{ background: 'var(--primary)' }}
              >
                <span className="material-symbols-outlined text-[17px]">check_circle</span>
                <span>+ Registrar Servicio</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL DE CONFIRMACIÓN DE REGISTRO EXITOSO
         ==================================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--border)' }}>
                <span className="material-symbols-outlined text-[36px]">verified</span>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Servicio Registrado con Éxito
              </h3>
              <p className="text-xs font-mono font-semibold mb-3 text-emerald-500">
                Código: {codigo}
              </p>
              <p className="text-xs leading-relaxed max-w-sm mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
                El servicio ha sido incorporado al catálogo administrativo de SIFYGSA y vinculado al centro de costos <strong>{centroCostos}</strong> para imputación directa en órdenes de compra.
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    router.push('/almacen');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)' }}
                >
                  Aceptar y Regresar al Almacén
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
