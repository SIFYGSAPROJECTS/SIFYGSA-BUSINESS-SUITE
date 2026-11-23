'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RolUsuario, ZonaComercial } from '@/config/types';
import { FlujoKanbanCrm } from '../components/FlujoKanbanCrm';
import { LeadsCrm } from '../components/leadsCrm';
import { ComprasRequisicion } from '@/modules/compras/pages/ComprasRequisicion';
import type { StitchOpportunity } from '../components/stitchCrmData';
import type { OportunidadCrm } from '../types';
import '../crm.css';

interface HomeCRMProps {
  subItemId?: string;
  folioInicial?: string;
  oportunidadesExtra?: OportunidadCrm[];
  rolUsuario?: RolUsuario;
  zonaUsuario?: ZonaComercial;
  alAbrirDetalle?: (folio: string) => void;
  alVolverAOportunidades?: () => void;
}

export const HomeCRM: React.FC<HomeCRMProps> = ({
  subItemId,
  folioInicial,
  rolUsuario,
  zonaUsuario,
  alAbrirDetalle,
}) => {
  const router = useRouter();
  const [activeModuleMode, setActiveModuleMode] = useState<'pipeline' | 'leads'>(
    subItemId === 'crm-leads' || subItemId === 'crm-tableros' ? 'leads' : 'pipeline'
  );
  const [convertedOpps, setConvertedOpps] = useState<StitchOpportunity[]>([]);

  useEffect(() => {
    setActiveModuleMode(
      subItemId === 'crm-leads' || subItemId === 'crm-tableros' ? 'leads' : 'pipeline'
    );
  }, [subItemId]);

  const currentView =
    subItemId === 'crm-calendar'
      ? 'calendar'
      : subItemId === 'crm-clientes'
      ? 'contacts'
      : subItemId === 'crm-opportunities'
      ? 'list'
      : subItemId === 'crm-reportes'
      ? 'graph'
      : subItemId === 'crm-opportunity-detail'
      ? 'detail'
      : 'kanban';

  return (
    <div
      className="sifygsa-crm-container"
      style={{ padding: 0, gap: 0, width: '100%', minHeight: '100vh' }}
    >
      {subItemId === 'crm-nueva-requisicion' || subItemId === 'compras-nueva' ? (
        <ComprasRequisicion
          key="crm-nueva-requisicion"
          subItemId="compras-nueva"
          rolUsuario={rolUsuario}
          moduloOrigen="crm"
          alVolver={() => router.push('/crm?sub=crm-kanban')}
        />
      ) : activeModuleMode === 'leads' ? (
        <LeadsCrm
          rolUsuario={rolUsuario}
          zonaUsuario={zonaUsuario}
          onConvertLeadToOpportunity={(payload) => {
            const createdOpp: StitchOpportunity = {
              folio: payload.oppFolio,
              tagCode: (payload.client.slice(0, 3) || 'SFG').toUpperCase(),
              client: payload.client,
              title: payload.title,
              amount: payload.amount,
              amountFormatted: `$${payload.amount.toLocaleString('es-MX')}`,
              probability: 10,
              stage: 'Prospección inicial',
              stars: 3,
              tags: ['NFPA 72', `Zona ${payload.zone}`],
              statusText: `Convertida desde ${payload.leadFolio}`,
              statusType: 'ok',
              ownerInitials: payload.ownerInitials,
              ownerName: payload.ownerName,
              ownerAvatarClass: 'bg-primary-container text-on-primary',
              contactName: payload.contactName,
              contactRole: payload.client,
              email: payload.email,
              phone: payload.phone,
              expectedClose: '30 Nov 2026',
              warningBanner: payload.pendingManagerApproval
                ? 'Pendiente de aprobación del Gerente'
                : undefined,
              listBadge: 'CONVERTIDA',
              notes: `Oportunidad originada por conversión del lead ${payload.leadFolio} (${payload.zone}).`,
            };
            setConvertedOpps((prev) => [createdOpp, ...prev]);
          }}
          onNavigateToPipeline={(oppFolio) => {
            if (oppFolio) {
              router.push(
                `/crm?sub=crm-opportunity-detail&folio=${encodeURIComponent(
                  oppFolio
                )}`
              );
            } else {
              router.push('/crm?sub=crm-kanban');
            }
          }}
        />
      ) : (
        <FlujoKanbanCrm
          onSelectOpportunity={alAbrirDetalle}
          currentView={currentView}
          initialFolio={folioInicial}
          extraOpportunities={convertedOpps}
          onChangeView={(nextView) => {
            if (nextView === 'leads') {
              router.push('/crm?sub=crm-leads');
            }
          }}
        />
      )}
    </div>
  );
};
