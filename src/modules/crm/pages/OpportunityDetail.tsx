import React, { useState } from 'react';
import { IconDownload, IconPlus } from '../../../components/ui/Icons';

interface OpportunityDetailProps {
  folio?: string;
  onBackToOpportunities: () => void;
  onGoToActivities: () => void;
  onOpenNewActivityModal: () => void;
}

export const OpportunityDetail: React.FC<OpportunityDetailProps> = ({
  folio = 'OPP-2024-041',
  onBackToOpportunities,
  onGoToActivities,
  onOpenNewActivityModal,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(3); // 1: Detección, 2: HTO, 3: Propuesta, 4: Seguimiento, 5: Cierre
  const [activeTab, setActiveTab] = useState<'resumen' | 'actividades' | 'documentos' | 'historial'>('resumen');

  const steps = [
    { id: 1, label: 'Detección' },
    { id: 2, label: 'HTO' },
    { id: 3, label: 'Propuesta' },
    { id: 4, label: 'Seguimiento' },
    { id: 5, label: 'Cierre' },
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
          <span className="crumb-active">{folio}</span>
        </div>

        <button
          type="button"
          className="btn-back-link"
          onClick={onBackToOpportunities}
        >
          ← Volver a Oportunidades
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="detail-header-card">
        <div className="detail-title-block">
          <div className="detail-company-row">
            <h1 className="detail-company-name">Pemex Refinación</h1>
            <span className="detail-status-pill in-review">En revisión</span>
          </div>
          <p className="detail-subtitle">
            <span className="bullet-orange">●</span> Detección de Gas H2S/CH4 — Complejo Procesador Tula
          </p>
        </div>

        <div className="detail-header-actions">
          <button
            type="button"
            className="btn-secondary-dark"
            onClick={() => alert('Edición de datos de oportunidad')}
          >
            ✏ Editar
          </button>
          <div className="pill-approval-pending">
            ● Aprobación: Pendiente
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
                  onClick={() => setCurrentStep(step.id)}
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
          onClick={() => {
            setActiveTab('actividades');
            onGoToActivities();
          }}
        >
          Actividades <span className="tab-counter-pill">3</span>
        </button>
        <button
          type="button"
          className={`detail-subtab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          Documentos <span className="tab-counter-pill">9</span>
        </button>
        <button
          type="button"
          className={`detail-subtab-btn ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
      </div>

      {/* Main Grid: Client Data + Opportunity Data */}
      <div className="detail-info-grid">
        {/* Card 1: Datos del Cliente */}
        <div className="info-portlet-card">
          <h3 className="info-card-title">DATOS DEL CLIENTE</h3>
          <div className="info-data-table">
            <div className="info-row">
              <span className="info-key">Empresa</span>
              <span className="info-value highlight-white">Pemex Refinación</span>
            </div>
            <div className="info-row">
              <span className="info-key">Contacto</span>
              <span className="info-value">Ing. Jorge Reyes</span>
            </div>
            <div className="info-row">
              <span className="info-key">Ingeniero de Ventas</span>
              <span className="info-value">Carlos Méndez</span>
            </div>
            <div className="info-row">
              <span className="info-key">Gerente responsable</span>
              <span className="info-value">Ana Torres</span>
            </div>
            <div className="info-row">
              <span className="info-key">Zona</span>
              <span className="info-value badge-zone">Istmo</span>
            </div>
          </div>
        </div>

        {/* Card 2: Datos de la Oportunidad */}
        <div className="info-portlet-card">
          <h3 className="info-card-title">DATOS DE LA OPORTUNIDAD</h3>
          <div className="info-data-table">
            <div className="info-row">
              <span className="info-key">Folio</span>
              <span className="info-value font-mono text-orange">{folio}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Tipo de sistema</span>
              <span className="info-value">Detección de Gas H2S/CH4</span>
            </div>
            <div className="info-row">
              <span className="info-key">Monto estimado</span>
              <span className="info-value font-mono amount-emphasis">$1,250,000 MXN</span>
            </div>
            <div className="info-row">
              <span className="info-key">Probabilidad</span>
              <div className="prob-wrapper">
                <span className="info-value font-mono">65%</span>
                <div className="prob-progress-bar">
                  <div className="prob-progress-fill" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
            <div className="info-row">
              <span className="info-key">Creada</span>
              <span className="info-value font-mono">28 feb 2024</span>
            </div>
            <div className="info-row">
              <span className="info-key">Cierre estimado</span>
              <span className="info-value font-mono">30 may 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="detail-description-card">
        <h3 className="info-card-title">DESCRIPCIÓN</h3>
        <p className="description-text">
          Instalación de sistema integral de detección de gas H2S y CH4 en unidades de proceso Tula II.
          Incluye 48 detectores fijos Honeywell XNX certificados ATEX, central de alarmas y sistema SCADA SIL-3.
        </p>
      </div>

      {/* Bottom Actions Bar */}
      <div className="detail-bottom-bar">
        <div className="bottom-links-group">
          <button
            type="button"
            className="btn-doc-action"
            onClick={() => alert('Descargando Ficha Técnica PDF SIL-3...')}
          >
            <IconDownload size={14} /> Descargar Ficha Técnica PDF
          </button>
          <button
            type="button"
            className="btn-doc-action"
            onClick={() => alert('Abriendo Cotización Asociada NetSuite...')}
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
