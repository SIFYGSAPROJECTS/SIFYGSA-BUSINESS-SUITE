import React, { useState } from 'react';
import { IconFilter, IconDownload, IconPlus } from '../../../components/ui/Icons';

export interface OpportunityItem {
  folio: string;
  client: string;
  contact: string;
  engineer: string;
  zone: 'Istmo' | 'Sur';
  stage: 'Propuesta' | 'HTO' | 'Seguimiento' | 'Cierre';
  amount: string;
  closingDate: string;
  approvalStatus: 'Pendiente' | 'Aprobada';
}

interface OpportunitiesListProps {
  onSelectOpportunity: (folio: string) => void;
  onNewOpportunity?: () => void;
}

export const OpportunitiesList: React.FC<OpportunitiesListProps> = ({
  onSelectOpportunity,
  onNewOpportunity,
}) => {
  const [stageFilter, setStageFilter] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const opportunities: OpportunityItem[] = [
    {
      folio: 'OPP-2024-041',
      client: 'Pemex Refinación',
      contact: 'Ing. Jorge Reyes',
      engineer: 'Carlos Méndez',
      zone: 'Istmo',
      stage: 'Propuesta',
      amount: '$1,250,000',
      closingDate: '30 may 2024',
      approvalStatus: 'Pendiente',
    },
    {
      folio: 'OPP-2024-039',
      client: 'BBVA México',
      contact: 'Ing. Eduardo Mares',
      engineer: 'Laura Vega',
      zone: 'Istmo',
      stage: 'Cierre',
      amount: '$1,120,000',
      closingDate: '18 may 2024',
      approvalStatus: 'Aprobada',
    },
    {
      folio: 'OPP-2024-033',
      client: 'Stellantis México',
      contact: 'Lic. Martha Soto',
      engineer: 'Carlos Méndez',
      zone: 'Istmo',
      stage: 'HTO',
      amount: '$2,780,000',
      closingDate: '21 ago 2024',
      approvalStatus: 'Pendiente',
    },
    {
      folio: 'OPP-2024-042',
      client: 'IMSS - Hospital General',
      contact: 'Lic. Fabiola Hernández',
      engineer: 'Laura Vega',
      zone: 'Sur',
      stage: 'Seguimiento',
      amount: '$345,000',
      closingDate: '15 abr 2024',
      approvalStatus: 'Aprobada',
    },
    {
      folio: 'OPP-2024-043',
      client: 'DHL México',
      contact: 'Lic. Roberto Kim',
      engineer: 'Pedro Ruiz',
      zone: 'Sur',
      stage: 'Propuesta',
      amount: '$450,000',
      closingDate: '30 jun 2024',
      approvalStatus: 'Pendiente',
    },
    {
      folio: 'OPP-2024-035',
      client: 'Fibra Uno',
      contact: 'Arq. Diana Castro',
      engineer: 'Pedro Ruiz',
      zone: 'Istmo',
      stage: 'Cierre',
      amount: '$88,500',
      closingDate: '28 feb 2024',
      approvalStatus: 'Aprobada',
    },
  ];

  const filteredOpportunities = opportunities.filter((item) => {
    if (stageFilter !== 'Todas' && item.stage !== stageFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.folio.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.engineer.toLowerCase().includes(q) ||
        item.zone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stageCounts = {
    Todas: opportunities.length,
    Propuesta: opportunities.filter((o) => o.stage === 'Propuesta').length,
    HTO: opportunities.filter((o) => o.stage === 'HTO').length,
    Seguimiento: opportunities.filter((o) => o.stage === 'Seguimiento').length,
    Cierre: opportunities.filter((o) => o.stage === 'Cierre').length,
  };

  return (
    <div className="crm-opportunities-module-container">
      {/* Top Header */}
      <div className="crm-opp-top-header">
        <div>
          <div className="detail-breadcrumb" style={{ marginBottom: '0.35rem' }}>
            <span className="crumb-root">SIFYGSUITE</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-item">CRM</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-active">Oportunidades de Venta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <h1 className="crm-opp-main-title">Gestión de Oportunidades de Venta</h1>
            <span className="zone-indicator-badge">Zona Istmo &amp; Sur</span>
          </div>
        </div>

        <div className="crm-opp-top-actions">
          <button type="button" className="btn-utility-ghost">
            <IconFilter size={15} /> Filtros Avanzados
          </button>
          <button type="button" className="btn-utility-ghost" onClick={() => alert('Exportando Cartera CSV / Excel...')}>
            <IconDownload size={15} /> Exportar Reporte
          </button>
          <button
            type="button"
            className="btn-primary-orange-cta"
            onClick={onNewOpportunity || (() => alert('Crear Nueva Oportunidad Comercial'))}
          >
            <IconPlus size={16} /> Nueva Oportunidad
          </button>
        </div>
      </div>

      {/* Main Cartera Card */}
      <div className="cartera-card-container">
        {/* Card Header with Badges & Search */}
        <div className="cartera-top-info-row">
          <div className="cartera-title-stats">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 className="cartera-title">Cartera de Oportunidades</h2>
              <span className="cartera-pill-active">8 Activas</span>
              <span className="cartera-pill-total">Total Cartera: $8,043,500 MXN</span>
            </div>
            <p className="cartera-subtitle">
              Monitoreo continuo de etapas comerciales, aprobaciones técnicas y pronóstico de cierre en zonas operativas.
            </p>
          </div>

          <div className="cartera-search-box">
            <input
              type="text"
              placeholder="Filtrar folio, cliente, zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cartera-search-input"
            />
            <button type="button" className="cartera-filter-submit-btn">
              🔍 Filtrar
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="stage-filter-pills-row">
          {(['Todas', 'Propuesta', 'HTO', 'Seguimiento', 'Cierre'] as const).map((stage) => {
            const count = stageCounts[stage];
            const isActive = stageFilter === stage;
            return (
              <button
                key={stage}
                type="button"
                className={`stage-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => setStageFilter(stage)}
              >
                <span>{stage}</span>
                <span className="pill-count-num">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="cartera-table-wrapper">
          <table className="cartera-data-table">
            <thead>
              <tr>
                <th>FOLIO</th>
                <th>CLIENTE</th>
                <th>INGENIERO</th>
                <th>ZONA</th>
                <th>ETAPA</th>
                <th style={{ textAlign: 'right' }}>MONTO EST.</th>
                <th style={{ textAlign: 'center' }}>CIERRE EST.</th>
                <th style={{ textAlign: 'center' }}>APROBACIÓN</th>
                <th style={{ textAlign: 'center' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.map((row) => (
                <tr
                  key={row.folio}
                  onClick={() => onSelectOpportunity(row.folio)}
                  className="table-clickable-row"
                >
                  <td className="font-mono text-orange font-bold">{row.folio}</td>
                  <td>
                    <div className="client-cell-stack">
                      <span className="client-name">{row.client}</span>
                      <span className="client-contact">{row.contact}</span>
                    </div>
                  </td>
                  <td>{row.engineer}</td>
                  <td>
                    <span className="zone-tag-mini">{row.zone}</span>
                  </td>
                  <td>
                    <span className={`stage-badge-tag ${row.stage.toLowerCase()}`}>
                      ● {row.stage}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-mono font-bold amount-cell">
                    {row.amount}
                  </td>
                  <td style={{ textAlign: 'center' }} className="font-mono text-muted-cell">
                    {row.closingDate}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`approval-pill ${row.approvalStatus === 'Aprobada' ? 'approved' : 'pending'}`}>
                      {row.approvalStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-row-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOpportunity(row.folio);
                      }}
                      title="Ver Detalle de la Oportunidad"
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="cartera-pagination-footer">
          <span className="pagination-info">
            Mostrando {filteredOpportunities.length} de {opportunities.length} oportunidades
          </span>
          <div className="pagination-buttons">
            <span className="page-indicator">Página 1 de 1</span>
            <button type="button" className="btn-page-nav" disabled>Anterior</button>
            <button type="button" className="btn-page-nav active-page">1</button>
            <button type="button" className="btn-page-nav" disabled>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
};
