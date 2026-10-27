'use client';

import React, { useState } from 'react';
import { IconDownload, IconPlus } from '../../../components/ui/Icons';
import type { OportunidadCrm } from '../types';
import { INITIAL_OPPORTUNITIES } from './OpportunitiesList';

interface OpportunityDetailProps {
  folio?: string;
  oportunidadesExtra?: OportunidadCrm[];
  onBackToOpportunities: () => void;
  onGoToActivities: () => void;
  onOpenNewActivityModal: () => void;
}

interface RegistroHistorial {
  id: string;
  fecha: string;
  autor: string;
  rol: string;
  accion: string;
  detalle: string;
  etapa: string;
}

const MAPA_ETAPAS_PIPELINE: Record<string, 'Detección' | 'HTO' | 'Propuesta' | 'Seguimiento' | 'Cierre'> = {
  prospecto: 'Detección',
  calificacion: 'HTO',
  propuesta: 'Propuesta',
  negociacion: 'Seguimiento',
  ganado: 'Cierre',
  perdido: 'Seguimiento',
};

export const OpportunityDetail: React.FC<OpportunityDetailProps> = ({
  folio = 'OPP-2024-041',
  oportunidadesExtra = [],
  onBackToOpportunities,
  onGoToActivities,
  onOpenNewActivityModal,
}) => {
  const baseOpp = INITIAL_OPPORTUNITIES.find((o) => o.folio === folio);
  const extraOpp = oportunidadesExtra.find((o) => o.folio === folio || o.id === folio);

  const opp = baseOpp
    ? {
        folio: baseOpp.folio,
        title: `Detección de Gas H2S/CH4 — Zona ${baseOpp.zone}`,
        client: baseOpp.client,
        contact: baseOpp.contact,
        engineer: baseOpp.engineer,
        manager: 'Ana Torres',
        zone: baseOpp.zone,
        stage: baseOpp.stage,
        amount: baseOpp.amount,
        probability: baseOpp.stage === 'Cierre' ? 90 : baseOpp.stage === 'Propuesta' ? 65 : 45,
        createdAt: '28 feb 2024',
        closingDate: baseOpp.closingDate,
        approvalStatus: baseOpp.approvalStatus,
        description:
          'Instalación de sistema integral de detección de gas H2S y CH4 en unidades de proceso Tula II. Incluye 48 detectores fijos Honeywell XNX certificados ATEX, central de alarmas y sistema SCADA SIL-3.',
      }
    : extraOpp
    ? {
        folio: extraOpp.folio,
        title: extraOpp.titulo,
        client: extraOpp.clienteNombre,
        contact: extraOpp.contactoNombre,
        engineer: extraOpp.vendedor,
        manager: 'Ana Torres',
        zone: extraOpp.zona,
        stage: MAPA_ETAPAS_PIPELINE[extraOpp.etapa] ?? 'Propuesta',
        amount: `$${extraOpp.montoEstimado.toLocaleString('es-MX')}`,
        probability: extraOpp.probabilidad,
        createdAt: extraOpp.actualizadoEn.slice(0, 10),
        closingDate: extraOpp.fechaCierreEsperada,
        approvalStatus: (extraOpp.probabilidad >= 75 ? 'Aprobada' : 'Pendiente') as 'Pendiente' | 'Aprobada',
        description: `Proyecto industrial "${extraOpp.titulo}" para ${extraOpp.clienteNombre} (${extraOpp.etiquetas.join(', ')}). Seguimiento comercial y técnico en Zona ${extraOpp.zona}.`,
      }
    : {
        folio,
        title: 'Detección de Gas H2S/CH4 — Zona Istmo',
        client: 'Pemex Refinación',
        contact: 'Ing. Jorge Reyes',
        engineer: 'Carlos Méndez',
        manager: 'Ana Torres',
        zone: 'Istmo' as const,
        stage: 'Propuesta' as const,
        amount: '$1,250,000',
        probability: 65,
        createdAt: '28 feb 2024',
        closingDate: '30 may 2024',
        approvalStatus: 'Pendiente' as const,
        description:
          'Instalación de sistema integral de detección de gas H2S y CH4 en unidades de proceso Tula II. Incluye 48 detectores fijos Honeywell XNX certificados ATEX, central de alarmas y sistema SCADA SIL-3.',
      };

  const stageMap: Record<string, number> = {
    'Detección': 1,
    'HTO': 2,
    'Propuesta': 3,
    'Seguimiento': 4,
    'Cierre': 5,
  };

  const [currentStep, setCurrentStep] = useState<number>(stageMap[opp.stage] || 3);
  const [activeTab, setActiveTab] = useState<'resumen' | 'actividades' | 'documentos' | 'historial'>('resumen');
  const [avisoAccion, setAvisoAccion] = useState<string | null>(null);

  const steps = [
    { id: 1, label: 'Detección' },
    { id: 2, label: 'HTO' },
    { id: 3, label: 'Propuesta' },
    { id: 4, label: 'Seguimiento' },
    { id: 5, label: 'Cierre' },
  ];

  const etapaActualTexto = steps.find((s) => s.id === currentStep)?.label ?? opp.stage;

  const [historialActividad, setHistorialActividad] = useState<RegistroHistorial[]>([
    {
      id: 'hist-1',
      fecha: 'Hoy, 10:15 hrs',
      autor: opp.engineer,
      rol: 'Ingeniero de Ventas',
      accion: `Revisión de propuesta técnica y económica (${opp.folio})`,
      detalle: `Se actualizó el alcance técnico para ${opp.client} con validación de ingeniería SIL-3 y desglose de partidas.`,
      etapa: etapaActualTexto,
    },
    {
      id: 'hist-2',
      fecha: '14 abr 2024, 16:40 hrs',
      autor: opp.manager,
      rol: 'Gerente Comercial',
      accion: 'Validación de Hojas Técnicas de Operación (HTO)',
      detalle: `Revisión con ${opp.contact} sobre certificaciones ATEX/IECEx y matriz Causa y Efecto.`,
      etapa: 'HTO',
    },
    {
      id: 'hist-3',
      fecha: '02 mar 2024, 09:20 hrs',
      autor: 'Daniel Rosas',
      rol: 'Ingeniero de Campo SIL-3',
      accion: 'Levantamiento técnico en sitio completado',
      detalle: `Recorrido en planta de ${opp.client} (Zona ${opp.zone}) y entrega de reporte fotográfico de canalizaciones.`,
      etapa: 'Detección',
    },
    {
      id: 'hist-4',
      fecha: `${opp.createdAt}, 08:30 hrs`,
      autor: opp.engineer,
      rol: 'Ingeniero de Ventas',
      accion: 'Apertura y registro inicial de oportunidad',
      detalle: `Alta en pipeline comercial por monto estimado de ${opp.amount} MXN con cierre proyectado al ${opp.closingDate}.`,
      etapa: 'Detección',
    },
  ]);

  const mostrarFeedback = (mensaje: string) => {
    setAvisoAccion(mensaje);
    setTimeout(() => {
      setAvisoAccion((actual) => (actual === mensaje ? null : actual));
    }, 3500);
  };

  const cambiarEtapaStepper = (stepId: number, label: string) => {
    setCurrentStep(stepId);
    setHistorialActividad((prev) => [
      {
        id: `hist-${prev.length + 1}-${stepId}`,
        fecha: 'Hace un momento',
        autor: opp.engineer,
        rol: 'Ingeniero de Ventas',
        accion: `Cambio de etapa comercial a "${label}"`,
        detalle: `Etapa actualizada desde el detalle de la oportunidad ${opp.folio}.`,
        etapa: label,
      },
      ...prev,
    ]);
    mostrarFeedback(`Etapa actualizada a "${label}" y registrada en el historial.`);
  };

  const actividadesAsociadas = [
    {
      id: 'act-1',
      folio: 'SCRUM-12',
      titulo: 'Cotización de central SCADA Honeywell Safety Manager SIL-3',
      responsable: opp.engineer,
      fechaCompromiso: '18 Abr 2024',
      estado: 'En Curso (75%)',
    },
    {
      id: 'act-2',
      folio: 'HTO-08',
      titulo: 'Especificación HTO detectores puntuales de sulfhídrico H2S',
      responsable: 'Daniel Rosas',
      fechaCompromiso: '20 Abr 2024',
      estado: 'En Curso',
    },
    {
      id: 'act-3',
      folio: 'SCRUM-13',
      titulo: 'Memoria de cálculo de atenuación óptica sensores CH4 infrarrojo',
      responsable: opp.manager,
      fechaCompromiso: '16 Abr 2024',
      estado: 'En Revisión',
    },
  ];

  const documentosAsociados = [
    { folio: 'DOC-SIL3-01', nombre: 'HTO Detectores Honeywell XNX ATEX.pdf', tipo: 'Ficha Técnica', fecha: '12 Abr 2024' },
    { folio: 'DOC-SIL3-02', nombre: 'Propuesta Económica y Alcance F&G.pdf', tipo: 'Cotización', fecha: '14 Abr 2024' },
    { folio: 'DOC-SIL3-03', nombre: 'Matriz Causa y Efecto (C&E) Rev B.xlsx', tipo: 'Ingeniería', fecha: '15 Abr 2024' },
  ];

  return (
    <div className="crm-opportunity-detail-container">
      {/* Top Breadcrumb & Back */}
      <div className="detail-top-breadcrumb-row">
        <div className="detail-breadcrumb">
          <span className="crumb-root">SIFYGSUITE</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-item" onClick={onBackToOpportunities} style={{ cursor: 'pointer' }}>CRM</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-item" onClick={onBackToOpportunities} style={{ cursor: 'pointer' }}>Oportunidades</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-active">{opp.folio}</span>
        </div>

        <button
          type="button"
          className="btn-back-link"
          onClick={onBackToOpportunities}
        >
          ← Volver a Oportunidades
        </button>
      </div>

      {avisoAccion && (
        <div
          role="status"
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          ✓ {avisoAccion}
        </div>
      )}

      {/* Main Header Banner */}
      <div className="detail-header-card">
        <div className="detail-title-block">
          <div className="detail-company-row">
            <h1 className="detail-company-name">{opp.client}</h1>
            <span className="detail-status-pill in-review">Etapa: {etapaActualTexto}</span>
          </div>
          <p className="detail-subtitle">
            <span className="bullet-orange">●</span> {opp.title} · Responsable: <strong style={{ color: 'var(--text-primary)' }}>{opp.engineer}</strong>
          </p>
        </div>

        <div className="detail-header-actions">
          <button
            type="button"
            className="btn-secondary-dark"
            onClick={() => mostrarFeedback(`Modo de edición habilitado para el folio ${opp.folio}.`)}
          >
            ✏ Editar
          </button>
          <div className={`pill-approval-${opp.approvalStatus === 'Aprobada' ? 'approved' : 'pending'}`}>
            ● Aprobación: {opp.approvalStatus}
          </div>
        </div>
      </div>

      {/* 5-Step Commercial Stepper */}
      <div className="commercial-stepper-card">
        <div className="stepper-track-wrap">
          {steps.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`stepper-node-group ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => cambiarEtapaStepper(step.id, step.label)}
                  title={`Cambiar etapa a ${step.label}`}
                >
                  <div className="stepper-circle">
                    {isCompleted ? (
                      <span className="check-mark">✓</span>
                    ) : (
                      <span className="step-num">{step.id}</span>
                    )}
                  </div>
                  <span className="step-label-text">{step.label}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div className={`stepper-connector-line ${step.id < currentStep ? 'filled' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Detail Secondary Navigation Tabs */}
      <div className="detail-subtabs-bar">
        <button
          type="button"
          className={`detail-subtab-btn ${activeTab === 'resumen' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          Resumen
        </button>
        <button
          type="button"
          className={`detail-subtab-btn ${activeTab === 'actividades' ? 'active' : ''}`}
          onClick={() => setActiveTab('actividades')}
        >
          Actividades <span className="tab-counter-pill">{actividadesAsociadas.length}</span>
        </button>
        <button
          type="button"
          className={`detail-subtab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          Documentos <span className="tab-counter-pill">{documentosAsociados.length}</span>
        </button>
        <button
          type="button"
          className={`detail-subtab-btn ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial <span className="tab-counter-pill">{historialActividad.length}</span>
        </button>
      </div>

      {activeTab === 'resumen' && (
        <>
          {/* Main Grid: Client Data + Opportunity Data */}
          <div className="detail-info-grid">
            {/* Card 1: Datos del Cliente */}
            <div className="info-portlet-card">
              <h3 className="info-card-title">DATOS DEL CLIENTE</h3>
              <div className="info-data-table">
                <div className="info-row">
                  <span className="info-key">Empresa</span>
                  <span className="info-value highlight-white">{opp.client}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Contacto</span>
                  <span className="info-value">{opp.contact}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Ingeniero de Ventas</span>
                  <span className="info-value">{opp.engineer}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Gerente responsable</span>
                  <span className="info-value">{opp.manager}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Zona</span>
                  <span className={`badge-zone ${opp.zone.toLowerCase()}`}>{opp.zone}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Datos de la Oportunidad */}
            <div className="info-portlet-card">
              <h3 className="info-card-title">DATOS DE LA OPORTUNIDAD</h3>
              <div className="info-data-table">
                <div className="info-row">
                  <span className="info-key">Folio</span>
                  <span className="info-value font-mono text-orange">{opp.folio}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Etapa actual</span>
                  <span className="info-value">{etapaActualTexto}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Monto estimado</span>
                  <span className="info-value font-mono amount-emphasis">{opp.amount} MXN</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Probabilidad</span>
                  <div className="prob-wrapper">
                    <span className="info-value font-mono">{opp.probability}%</span>
                    <div className="prob-progress-bar">
                      <div className="prob-progress-fill" style={{ width: `${opp.probability}%` }} />
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-key">Creada</span>
                  <span className="info-value font-mono">{opp.createdAt}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Cierre estimado</span>
                  <span className="info-value font-mono">{opp.closingDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="detail-description-card">
            <h3 className="info-card-title">DESCRIPCIÓN</h3>
            <p className="description-text">{opp.description}</p>
          </div>

          {/* Historial de Actividad Reciente en Resumen */}
          <div className="detail-description-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 className="info-card-title" style={{ margin: 0 }}>HISTORIAL RECIENTE DE ACTIVIDAD</h3>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setActiveTab('historial')}
                style={{ fontSize: '0.75rem' }}
              >
                Ver historial completo ({historialActividad.length}) →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {historialActividad.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      {item.accion}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {item.detalle}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Responsable: <strong>{item.autor}</strong> ({item.rol}) · Etapa: {item.etapa}
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {item.fecha}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'actividades' && (
        <div className="detail-description-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="info-card-title" style={{ margin: 0 }}>ACTIVIDADES ASOCIADAS A {opp.folio}</h3>
            <button
              type="button"
              className="btn-secondary-dark"
              onClick={onGoToActivities}
            >
              Abrir Tablero Kanban &amp; Gantt →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {actividadesAsociadas.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span className="font-mono text-orange" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {act.folio}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {act.titulo}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Responsable: {act.responsable} · Compromiso: {act.fechaCompromiso}
                  </div>
                </div>
                <span className="detail-status-pill in-review">{act.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documentos' && (
        <div className="detail-description-card">
          <h3 className="info-card-title">DOCUMENTACIÓN TÉCNICA Y COMERCIAL ({opp.folio})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {documentosAsociados.map((doc) => (
              <div
                key={doc.folio}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span className="font-mono text-orange" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                    {doc.folio}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {doc.nombre}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {doc.tipo} · Actualizado: {doc.fecha}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-doc-action"
                  onClick={() => mostrarFeedback(`Descargando documento "${doc.nombre}"...`)}
                >
                  <IconDownload size={14} /> Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="detail-description-card">
          <h3 className="info-card-title">HISTORIAL DE ACTIVIDAD Y TRAZABILIDAD ({opp.folio})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {historialActividad.map((evento) => (
              <div
                key={evento.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid #FF6B00',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{evento.accion}</strong>
                    <span className="detail-status-pill in-review" style={{ fontSize: '0.68rem' }}>
                      {evento.etapa}
                    </span>
                  </div>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {evento.detalle}
                  </p>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Registrado por <strong>{evento.autor}</strong> ({evento.rol})
                  </div>
                </div>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {evento.fecha}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="detail-bottom-bar">
        <div className="bottom-links-group">
          <button
            type="button"
            className="btn-doc-action"
            onClick={() => mostrarFeedback(`Descargando Ficha Técnica PDF SIL-3 de ${opp.folio}...`)}
          >
            <IconDownload size={14} /> Descargar Ficha Técnica PDF
          </button>
          <button
            type="button"
            className="btn-doc-action"
            onClick={() => mostrarFeedback(`Cotización asociada a ${opp.folio} (${opp.amount} MXN) lista para revisión.`)}
          >
            📄 Ver Cotización Asociada
          </button>
        </div>

        <button
          type="button"
          className="btn-primary-orange-cta"
          onClick={onOpenNewActivityModal}
        >
          <IconPlus size={16} /> Registrar Nueva Actividad
        </button>
      </div>
    </div>
  );
};
