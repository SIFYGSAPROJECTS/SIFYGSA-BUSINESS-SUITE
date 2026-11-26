'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { FormWizardFooter } from '../components/FormWizardFooter';
import { useAlmacen } from '../context/AlmacenContext';
import { PROYECTOS_UBICACIONES_CATALOG } from '../types';
import type { ValeSalidaSA, PartidaValeSalida, DevolucionAlmacen } from '../types';
import '../almacen.css';

export interface ResponsableProyecto {
  id: string;
  nombreCompleto: string;
  cargoArea: string;
  numeroEmpleado: string;
}

export const RESPONSABLES_DISPONIBLES: ResponsableProyecto[] = [
  {
    id: 'resp-1',
    nombreCompleto: 'Ing. Carlos Mendoza Estrada — Residente de Obra',
    cargoArea: 'Supervisión de Obra & Automatización',
    numeroEmpleado: 'EMP-SIF-0842',
  },
  {
    id: 'resp-2',
    nombreCompleto: 'Ing. Laura Palacios Gómez — Supervisora HSE',
    cargoArea: 'Seguridad Industrial, Higiene y Medio Ambiente (HSE)',
    numeroEmpleado: 'EMP-SIF-0914',
  },
  {
    id: 'resp-3',
    nombreCompleto: 'Ing. Fernando Ruiz — Supervisor de Frentes',
    cargoArea: 'Instalaciones Mecánicas & Instrumentación',
    numeroEmpleado: 'EMP-SIF-0412',
  },
];


const PASOS_VALE_SALIDA: StepItem[] = [
  {
    id: 1,
    title: 'Emisión & Solicitante',
    description: 'Folio, fecha, responsable y proyecto destino',
  },
  {
    id: 2,
    title: 'Materiales & Despacho',
    description: 'Selección de partidas e inventario disponible',
  },
];

export default function SalidaArticuloPage() {
  const { articulos, articulosActivos, valesSalida, devoluciones, crearValeSalidaSA, registrarDevolucion, mostrarToast } = useAlmacen();

  const router = useRouter();
  const searchParams = useSearchParams();
  const esOrigenServicios = searchParams?.get('origen') === 'servicios';
  const rutaPadre = esOrigenServicios ? '/almacen/servicios' : '/almacen/articulos';
  const etiquetaPadre = esOrigenServicios ? 'Servicios' : 'Artículos';

  // Estados de Pasos (Stepper SIFYGSA)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Pestaña activa: Vales de Salida vs Devolución a Almacén Principal
  const [tabActiva, setTabActiva] = useState<'salida' | 'devolucion' | 'historial'>('salida');

  // Datos del Vale de Salida (SA-2026-XXXX) 100% propio de Almacén
  const [folioSalida, setFolioSalida] = useState(`SA-2026-${String(valesSalida.length + 48).padStart(4, '0')}`);
  const [solicitudMaterial, setSolicitudMaterial] = useState('SM-2026-104');
  const [proyectoDestino, setProyectoDestino] = useState(PROYECTOS_UBICACIONES_CATALOG[1].codigo);
  const [fechaSalida] = useState(new Date().toISOString().slice(0, 10));
  const [responsableId, setResponsableId] = useState(RESPONSABLES_DISPONIBLES[0].id);
  const [almacenistaDespacho] = useState('Mateo Gómez (Jefe de Almacén)');
  const [observacionesSalida, setObservacionesSalida] = useState('Despacho de herramientas y consumibles para frente activo.');

  // Partidas de Salida dinámicas
  const [partidasSalida, setPartidasSalida] = useState<PartidaValeSalida[]>([
    {
      id: 'ps-1',
      sku: 'DET-UVIR-FLAME-01',
      descripcion: 'Detector Óptico de Flama UV/IR Multispectrum Det-Tronics',
      cantidad: 2,
      unidad: 'Pieza',
      custodia: 'Equipo Sujeto a Calibración / Mantenimiento',
      numerosSerie: ['SN-X3301-881', 'SN-X3301-882'],
      ubicacionOrigen: 'Almacén Principal (Sede CDMX)',
      notas: 'Calibración vigente. Sujeto a retorno al concluir la etapa.',
    },
    {
      id: 'ps-2',
      sku: 'TUB-COND-1-ALUM',
      descripcion: 'Tubo Conduit Aluminio 1 pulgada Cédula 40 x 3m',
      cantidad: 15,
      unidad: 'Tramo',
      custodia: 'Consumible',
      ubicacionOrigen: 'Almacén Principal (Sede CDMX)',
      notas: 'Para canalización en cuarto de control.',
    },
  ]);

  // Selector para agregar nueva partida
  const [articuloSeleccionadoSku, setArticuloSeleccionadoSku] = useState(articulosActivos[0]?.sku || '');
  const [cantidadAgregar, setCantidadAgregar] = useState(1);

  const getStockDisponible = (sku: string) => {
    const art = articulos.find((a) => a.sku.toLowerCase() === sku.toLowerCase());
    return art ? art.stockDisponible : 0;
  };

  const validarPaso1 = (): boolean => {
    if (!folioSalida.trim()) {
      mostrarToast('El folio del vale es obligatorio.', 'error');
      return false;
    }
    if (!responsableId.trim()) {
      mostrarToast('Debe seleccionar al responsable del frente de obra.', 'error');
      return false;
    }
    if (!proyectoDestino.trim()) {
      mostrarToast('Debe seleccionar el proyecto de destino.', 'error');
      return false;
    }
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (partidasSalida.length === 0) {
      mostrarToast('Debes agregar al menos una partida de material o equipo al vale.', 'error');
      return false;
    }
    for (const p of partidasSalida) {
      const disp = getStockDisponible(p.sku);
      if (p.cantidad <= 0) {
        mostrarToast(`La cantidad de la partida ${p.sku} debe ser mayor a 0.`, 'error');
        return false;
      }
      if (p.cantidad > disp) {
        mostrarToast(`Stock insuficiente para ${p.sku}: Solicitado (${p.cantidad}) > Disponible (${disp}).`, 'error');
        return false;
      }
    }
    return true;
  };

  const estadoPasoActual = useMemo(() => {
    const faltantes: string[] = [];
    if (currentStep === 1) {
      if (!folioSalida.trim()) faltantes.push('Folio del Vale de Salida');
      if (!responsableId.trim()) faltantes.push('Responsable del Frente de Obra');
      if (!proyectoDestino.trim()) faltantes.push('Proyecto de Destino');
    } else if (currentStep === 2) {
      if (partidasSalida.length === 0) {
        faltantes.push('Al menos una partida de material o equipo');
      }
      for (const p of partidasSalida) {
        const art = articulos.find((a) => a.sku.toLowerCase() === p.sku.toLowerCase());
        const disp = art ? art.stockDisponible : 0;
        if (p.cantidad <= 0 || p.cantidad > disp) {
          faltantes.push(`Cantidad válida de partida ${p.sku}`);
        }
      }
    }
    return { valido: faltantes.length === 0, camposFaltantes: faltantes };
  }, [currentStep, folioSalida, responsableId, proyectoDestino, partidasSalida, articulos]);

  const handleIntentoAvanzarInvalido = () => {
    if (currentStep === 1) validarPaso1();
    else if (currentStep === 2) validarPaso2();
    mostrarToast(`Faltan ${estadoPasoActual.camposFaltantes.length} campos obligatorios para continuar.`, 'error');
  };

  const handleContinuar = () => {
    if (!estadoPasoActual.valido) {
      handleIntentoAvanzarInvalido();
      return;
    }
    if (currentStep === 1) {
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      setCurrentStep(2);
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
    if (!estadoPasoActual.valido) {
      handleIntentoAvanzarInvalido();
      return;
    }
    setCurrentStep(stepNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const handleAgregarPartida = () => {
    const art = articulos.find((a) => a.sku.toLowerCase() === articuloSeleccionadoSku.toLowerCase());
    if (!art) {
      mostrarToast('Selecciona un artículo válido del catálogo.', 'error');
      return;
    }
    if (art.noDisponiblePorMantenimiento) {
      mostrarToast(`Artículo bloqueado: ${art.sku} está marcado como "No disponible" por mantenimiento correctivo.`, 'error');
      return;
    }
    if (cantidadAgregar <= 0) {
      mostrarToast('La cantidad debe ser mayor a 0.', 'warning');
      return;
    }
    if (cantidadAgregar > art.stockDisponible) {
      mostrarToast(`Stock insuficiente. Solo hay ${art.stockDisponible} uds disponibles de ${art.sku}.`, 'error');
      return;
    }

    // Verificar si ya existe en la lista
    const existe = partidasSalida.find((p) => p.sku.toLowerCase() === art.sku.toLowerCase());
    if (existe) {
      const nuevaCantidad = existe.cantidad + cantidadAgregar;
      if (nuevaCantidad > art.stockDisponible) {
        mostrarToast(`La cantidad acumulada (${nuevaCantidad}) supera las existencias disponibles (${art.stockDisponible}).`, 'error');
        return;
      }
      setPartidasSalida((prev) =>
        prev.map((p) => (p.sku.toLowerCase() === art.sku.toLowerCase() ? { ...p, cantidad: nuevaCantidad } : p))
      );
    } else {
      const nuevaPartida: PartidaValeSalida = {
        id: `ps-${Date.now()}`,
        sku: art.sku,
        descripcion: art.descripcionCorta || art.nombre,
        cantidad: cantidadAgregar,
        unidad: art.unidadMedida || 'Pieza',
        custodia: art.clasificacionCustodia || 'Consumible',
        ubicacionOrigen: 'Almacén Principal (Sede CDMX)',
        notas: 'Despacho registrado en andén.',
      };
      setPartidasSalida((prev) => [...prev, nuevaPartida]);
    }

    setCantidadAgregar(1);
    mostrarToast(`Partida ${art.sku} agregada al vale.`, 'success');
  };

  const handleEliminarPartida = (id: string) => {
    setPartidasSalida((prev) => prev.filter((p) => p.id !== id));
  };

  const [modalImpresionOpen, setModalImpresionOpen] = useState(false);
  const [valeEmitidoActual, setValeEmitidoActual] = useState<ValeSalidaSA | null>(null);

  const handleDescargarEImprimir = () => {
    window.print();
    setModalImpresionOpen(false);
    mostrarToast(`✓ Vale ${valeEmitidoActual?.folio || folioSalida} emitido y descargado con éxito.`, 'success');
    setTimeout(() => {
      router.push(rutaPadre);
    }, 500);
  };

  const handleFinalizarYRegresar = () => {
    setModalImpresionOpen(false);
    mostrarToast(`✓ Salida ${valeEmitidoActual?.folio || folioSalida} finalizada con éxito.`, 'success');
    router.push(rutaPadre);
  };

  // Estados de Devolución a Almacén Principal (Retorno de Obra)
  const [folioDevolucion] = useState(`DEV-2026-${String(devoluciones.length + 46).padStart(4, '0')}`);
  const [devProyectoOrigen, setDevProyectoOrigen] = useState(PROYECTOS_UBICACIONES_CATALOG[1].codigo);
  const [devResponsableEntrega, setDevResponsableEntrega] = useState(RESPONSABLES_DISPONIBLES[0].nombreCompleto);
  const [devMotivo, setDevMotivo] = useState('Reingreso de material sobrante y retorno de herramienta al concluir fase.');
  const [itemsDevolucion] = useState([
    {
      id: 'd-1',
      sku: 'TUB-COND-1-ALUM',
      descripcion: 'Tubo Conduit Aluminio 1 pulgada Cédula 40',
      cantidadDevuelta: 3,
      unidad: 'Tramo',
      tipoItem: 'sobrante_consumible' as const,
      estadoFisico: 'Excelente' as const,
      nuevoDestino: 'Almacén Principal' as const,
      notas: 'Tramos completos limpios reintegrados al stock disponible.',
    },
    {
      id: 'd-2',
      sku: 'DET-UVIR-FLAME-01',
      descripcion: 'Detector Óptico de Flama UV/IR Multispectrum Det-Tronics',
      cantidadDevuelta: 1,
      unidad: 'Pieza',
      tipoItem: 'herramienta_retornable' as const,
      estadoFisico: 'Requiere Mantenimiento' as const,
      nuevoDestino: 'En Mantenimiento / Calibración' as const,
      numerosSerie: ['SN-X3301-881'],
      notas: 'Se envía a taller técnico para verificación de sensor.',
    },
  ]);

  const responsableActivo = useMemo(() => {
    return RESPONSABLES_DISPONIBLES.find((r) => r.id === responsableId) || RESPONSABLES_DISPONIBLES[0];
  }, [responsableId]);

  // Guardar Vale de Salida con estricta validación de stock
  const handleGuardarValeSalida = () => {
    if (!validarPaso2()) return;

    const nuevoVale: ValeSalidaSA = {
      id: `sa-${Date.now()}`,
      folio: folioSalida,
      contratoProyectoDestino: proyectoDestino,
      solicitudMaterialFolio: solicitudMaterial,
      fechaSalida,
      responsableRecibe: responsableActivo.nombreCompleto,
      cargoArea: responsableActivo.cargoArea,
      numeroEmpleado: responsableActivo.numeroEmpleado,
      almacenistaDespacho,
      partidas: partidasSalida,
      firmadoFisico: true,
      estatus: 'Despachado',
      observaciones: observacionesSalida,
    };

    crearValeSalidaSA(nuevoVale);
    setValeEmitidoActual(nuevoVale);
    setModalImpresionOpen(true);
    setPartidasSalida([]);
    setFolioSalida(`SA-2026-${String(valesSalida.length + 49).padStart(4, '0')}`);
  };

  // Guardar Devolución (Retorno de Obra)
  const handleGuardarDevolucion = () => {
    const nuevaDev: DevolucionAlmacen = {
      id: `dev-${Date.now()}`,
      folio: folioDevolucion,
      contratoProyectoOrigen: devProyectoOrigen,
      fechaDevolucion: new Date().toISOString().slice(0, 10),
      responsableEntrega: devResponsableEntrega,
      almacenistaReceptor: almacenistaDespacho,
      items: itemsDevolucion,
      motivoDevolucion: devMotivo,
      estatus: 'Completada',
    };

    registrarDevolucion(nuevaDev);
    mostrarToast(
      `¡Devolución ${folioDevolucion} registrada! Materiales reintegrados al Almacén Principal y taller.`,
      'success'
    );
    setTabActiva('historial');
  };

  return (
    <div className="almacen-module-container" style={{ minHeight: '100vh', background: 'var(--bg-almacen)' }}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 140px' }}>
        {/* Migas de pan y Botón Volver */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => router.push('/almacen')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              Almacén
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => router.push(rutaPadre)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              {etiquetaPadre}
            </button>
            <span>/</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {esOrigenServicios ? 'Salida de servicio (SA)' : 'Salida de inventario (SA)'}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => router.push(rutaPadre)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
            title={`Volver a ${etiquetaPadre}`}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Volver a {etiquetaPadre}</span>
          </button>
        </div>

        {/* Cabecera Principal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            padding: '20px 24px',
            background: 'var(--card-bg, #ffffff)',
            borderRadius: 16,
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  color: '#ffffff',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>output</span>
              </span>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Vales de Salida (SA) & Retorno de Obra
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Módulo 100% de Almacén, independiente de Órdenes de Venta (SO). Control de custodia y reingreso de sobrantes.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Pestaña */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--surface-alt)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setTabActiva('salida')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: tabActiva === 'salida' ? 'var(--card)' : 'transparent',
                color: tabActiva === 'salida' ? 'var(--brand-600, #1d4ed8)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: tabActiva === 'salida' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Nuevo Vale de Salida (SA)
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('devolucion')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: tabActiva === 'devolucion' ? 'var(--card)' : 'transparent',
                color: tabActiva === 'devolucion' ? 'var(--success)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: tabActiva === 'devolucion' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Devolución / Retorno de Obra
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('historial')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: tabActiva === 'historial' ? 'var(--card)' : 'transparent',
                color: tabActiva === 'historial' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: tabActiva === 'historial' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Historial de Vales
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: NUEVO VALE DE SALIDA (SA) */}
        {tabActiva === 'salida' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ── STEPPER CORPORATIVO SIFYGSA ── */}
            <Stepper
              steps={PASOS_VALE_SALIDA}
              currentStep={currentStep}
              completedSteps={completedSteps}
              isCurrentStepValid={estadoPasoActual.valido}
              onStepClick={(step) => {
                if (step > currentStep && !estadoPasoActual.valido) {
                  handleIntentoAvanzarInvalido();
                  return;
                }
                handleStepClick(step);
              }}
            />
            {/* Paso 1: Datos Maestros */}
            {currentStep === 1 && (
              <div
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: 16,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  padding: 24,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Datos de Emisión del Vale de Salida
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Folio de Salida Institucional:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={folioSalida}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--primary)',
                        background: 'var(--brand-tonal-bg)',
                        fontWeight: 800,
                        color: 'var(--brand-tonal-text)',
                        fontSize: '0.92rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Proyecto / Contrato Destino:
                    </label>
                    <select
                      value={proyectoDestino}
                      onChange={(e) => setProyectoDestino(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    >
                      {PROYECTOS_UBICACIONES_CATALOG.filter((p) => p.codigo !== 'Almacén Principal').map((p) => (
                        <option key={p.codigo} value={p.codigo}>
                          {p.codigo} - {p.nombreProyecto}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Responsable que Recibe en Obra:
                    </label>
                    <select
                      value={responsableId}
                      onChange={(e) => setResponsableId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    >
                      {RESPONSABLES_DISPONIBLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombreCompleto} ({r.numeroEmpleado})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Solicitud de Material (SM):
                    </label>
                    <input
                      type="text"
                      value={solicitudMaterial}
                      onChange={(e) => setSolicitudMaterial(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Partidas Despachadas */}
            {currentStep === 2 && (
              <div
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: 16,
                  border: '1px solid var(--border-color, #e2e8f0)',
                  padding: 24,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Materiales, Equipos y Herramientas Despachadas
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Verifica que las partidas cuenten con stock disponible suficiente antes de emitir el vale.
                    </p>
                  </div>
                </div>

                {/* Selector Rápido para Añadir Partidas al Vale */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 12,
                    padding: '14px 16px',
                    background: 'var(--surface-alt)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Seleccionar Artículo del Catálogo:
                    </label>
                    <select
                      value={articuloSeleccionadoSku}
                      onChange={(e) => setArticuloSeleccionadoSku(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                      }}
                    >
                      {articulosActivos.map((a) => (
                        <option key={a.sku} value={a.sku} disabled={Boolean(a.noDisponiblePorMantenimiento)}>
                          {a.sku} - {a.descripcionCorta || a.nombre}{' '}
                          {a.noDisponiblePorMantenimiento
                            ? '(No disponible - En mantenimiento)'
                            : `(Disp: ${a.stockDisponible} uds)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: 120 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Cantidad:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={cantidadAgregar}
                      onChange={(e) => setCantidadAgregar(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregarPartida}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#1d4ed8',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    <span>Agregar Partida</span>
                  </button>
                </div>

                {partidasSalida.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No hay partidas agregadas al vale. Utiliza el selector superior para agregar insumos o herramientas.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-alt)', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>SKU &amp; Descripción</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Stock Disponible</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cantidad a Salir</th>
                        <th style={{ padding: '10px 12px' }}>Clasificación Custodia</th>
                        <th style={{ padding: '10px 12px' }}>Series Asignadas</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidasSalida.map((p) => {
                        const disponible = getStockDisponible(p.sku);
                        const excedeStock = p.cantidad > disponible;

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--divider)', background: excedeStock ? 'rgba(239, 68, 68, 0.15)' : 'transparent' }}>
                            <td style={{ padding: '12px' }}>
                              <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{p.sku}</strong>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.descripcion}</div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: disponible === 0 ? '#dc2626' : '#16a34a' }}>
                              {disponible} {p.unidad}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={1}
                                value={p.cantidad}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setPartidasSalida((prev) =>
                                    prev.map((item) => (item.id === p.id ? { ...item, cantidad: val } : item))
                                  );
                                }}
                                style={{
                                  width: 75,
                                  padding: '6px 8px',
                                  textAlign: 'center',
                                  borderRadius: 6,
                                  border: `1.5px solid ${excedeStock ? '#dc2626' : 'var(--primary)'}`,
                                  fontWeight: 800,
                                  color: excedeStock ? '#dc2626' : 'var(--text-primary)',
                                  background: excedeStock ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface)',
                                }}
                              />
                              {excedeStock && (
                                <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: 2 }}>
                                  ¡Excede stock!
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  background:
                                    p.custodia === 'Consumible'
                                      ? 'var(--surface-alt)'
                                      : p.custodia.includes('Calibración')
                                        ? 'var(--warning-bg)'
                                        : 'var(--brand-tonal-bg)',
                                  color:
                                    p.custodia === 'Consumible'
                                      ? 'var(--text-secondary)'
                                      : p.custodia.includes('Calibración')
                                        ? 'var(--warning-text)'
                                        : 'var(--brand-tonal-text)',
                                }}
                              >
                                {p.custodia}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {p.numerosSerie?.join(', ') || 'N/A'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleEliminarPartida(p.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  padding: 4,
                                  borderRadius: 4,
                                }}
                                title="Eliminar partida del vale"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Observaciones de Despacho */}
                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Observaciones de Despacho:
                  </label>
                  <textarea
                    rows={3}
                    value={observacionesSalida}
                    onChange={(e) => setObservacionesSalida(e.target.value)}
                    placeholder="Detalles adicionales sobre el despacho de herramientas o consumibles para frente activo..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.86rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── BARRA DE NAVEGACIÓN INFERIOR FIJA REUTILIZABLE (NORMATIVO SIFYGSA) ── */}
            <FormWizardFooter
              currentStep={currentStep}
              totalSteps={2}
              isValid={estadoPasoActual.valido}
              missingFields={estadoPasoActual.camposFaltantes}
              onContinue={currentStep === 1 ? handleContinuar : handleGuardarValeSalida}
              onPrevious={handleAtras}
              onCancel={() => router.push(rutaPadre)}
              continueText="Continuar"
              finalText="Emitir Vale de Salida (SA)"
              continueIcon="arrow_forward"
              finalIcon="verified"
              onInvalidClick={handleIntentoAvanzarInvalido}
              helperText="Completa los campos obligatorios (*) para continuar"
              cancelText="Cancelar"
              showCancel={true}
              isLastStep={currentStep === 2}
            />
          </div>
        )}

        {/* PESTAÑA 2: DEVOLUCIÓN A ALMACÉN PRINCIPAL (RETORNO DE OBRA) */}
        {tabActiva === 'devolucion' && (
          <div
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: 16,
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Reingreso de Material Sobrante & Retorno de Herramientas
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Restituye material sobrante al stock disponible del Almacén Principal o envía equipos retornables a Mantenimiento/Calibración.
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '1rem',
                  padding: '4px 12px',
                  borderRadius: 8,
                  background: 'var(--success-bg)',
                  color: 'var(--success-text)',
                  border: '1px solid var(--success)',
                }}
              >
                {folioDevolucion}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Proyecto Origen del Retorno:
                </label>
                <select
                  value={devProyectoOrigen}
                  onChange={(e) => setDevProyectoOrigen(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                  }}
                >
                  {PROYECTOS_UBICACIONES_CATALOG.filter((p) => p.codigo !== 'Almacén Principal').map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} - {p.nombreProyecto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Responsable que Entrega:
                </label>
                <input
                  type="text"
                  value={devResponsableEntrega}
                  onChange={(e) => setDevResponsableEntrega(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Motivo de Retorno / Fin de Obra:
                </label>
                <input
                  type="text"
                  value={devMotivo}
                  onChange={(e) => setDevMotivo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
              Partidas a Reintegrar
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {itemsDevolucion.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr',
                    gap: 12,
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.sku}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.descripcion}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cant:</span>{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{item.cantidadDevuelta} {item.unidad}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Estado Físico:</span>
                    <div style={{ fontWeight: 700, color: item.estadoFisico === 'Excelente' ? '#16a34a' : '#d97706' }}>
                      {item.estadoFisico}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Reintegrar a:</span>
                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: item.nuevoDestino === 'Almacén Principal' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: item.nuevoDestino === 'Almacén Principal' ? 'var(--success-text)' : 'var(--warning-text)',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'inline-block',
                      }}
                    >
                      {item.nuevoDestino}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGuardarDevolucion}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined">assignment_return</span>
              Confirmar Retorno de Obra y Actualizar Kárdex
            </button>
          </div>
        )}

        {/* PESTAÑA 3: HISTORIAL DE VALES Y MOVIMIENTOS */}
        {tabActiva === 'historial' && (
          <div
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: 16,
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              Historial de Vales de Salida (SA) Registrados
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {valesSalida.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: '0.96rem', color: 'var(--primary)' }}>{v.folio}</strong>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        Hacia: {v.contratoProyectoDestino}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontWeight: 800,
                          background: 'var(--success-bg)',
                          color: 'var(--success-text)',
                        }}
                      >
                        ✓ {v.estatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      Fecha: {v.fechaSalida} • Recibe: {v.responsableRecibe} ({v.numeroEmpleado}) • Despacha: {v.almacenistaDespacho}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalImpresionOpen(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                    Ver Formato PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Formato Imprimible PDF */}
      {modalImpresionOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              color: 'var(--text-primary)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              maxWidth: 680,
              width: '100%',
              padding: 32,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>
                  SIFYGSA FIRE &amp; GAS S.A. DE C.V.
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  VALE OFICIAL DE SALIDA DE MATERIALES Y EQUIPOS (ALMACÉN SGA)
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{valeEmitidoActual?.folio || folioSalida}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fecha: {valeEmitidoActual?.fechaSalida || fechaSalida}</div>
                </div>
                <button
                  type="button"
                  onClick={handleFinalizarYRegresar}
                  title="Cerrar y volver"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.82rem', marginBottom: 16, background: 'var(--surface-alt)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div><strong>Proyecto Destino:</strong> {valeEmitidoActual?.contratoProyectoDestino || proyectoDestino}</div>
              <div><strong>Solicitud Material:</strong> {valeEmitidoActual?.solicitudMaterialFolio || solicitudMaterial}</div>
              <div><strong>Recibe:</strong> {valeEmitidoActual?.responsableRecibe || responsableActivo.nombreCompleto}</div>
              <div><strong>Almacenista:</strong> {valeEmitidoActual?.almacenistaDespacho || almacenistaDespacho}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Descripción</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Cant</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Series</th>
                </tr>
              </thead>
              <tbody>
                {(valeEmitidoActual?.partidas && valeEmitidoActual.partidas.length > 0 ? valeEmitidoActual.partidas : partidasSalida).map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{p.sku}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{p.descripcion}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800 }}>{p.cantidad} {p.unidad}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.numerosSerie?.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
              <div>
                <div style={{ height: 40 }}></div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Entregó: {valeEmitidoActual?.almacenistaDespacho || almacenistaDespacho}
                </div>
              </div>
              <div>
                <div style={{ height: 40, color: '#16a34a', fontWeight: 800, fontSize: '0.85rem' }}>
                  [ FIRMA FÍSICA EN RECEPCIÓN ]
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recibió: {valeEmitidoActual?.responsableRecibe || responsableActivo.nombreCompleto}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={handleFinalizarYRegresar}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                Finalizar y Volver a {etiquetaPadre}
              </button>
              <button
                type="button"
                onClick={handleDescargarEImprimir}
                style={{
                  flex: 1.2,
                  padding: '12px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: '0.88rem',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Descargar / Imprimir Vale (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
