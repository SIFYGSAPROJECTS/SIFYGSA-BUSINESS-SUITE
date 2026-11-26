# Módulo CRM & Ventas (`src/modules/crm`)

## ¿Qué hace?
Gestiona el ciclo comercial e industrial conservando la identidad visual de SIFYGSA:
- **Submenú lateral limpio (generado desde `src/modules/registry.ts`)**:
  1. **Oportunidades** (`/crm?sub=crm-opportunities`)
  2. **Actividades (Kanban & Gantt)** (`/crm?sub=crm-kanban`)
  3. **Reportes & Pipeline** (`/crm?sub=crm-avanzado`)
- **Vista dinámica de Detalle de Oportunidad (`pages/OpportunityDetail.tsx`)**:
  - Se abre dinámicamente al hacer clic en cualquier oportunidad desde la lista de **Oportunidades**, desde el **Kanban** o desde el **Pipeline** (`/crm?sub=crm-opportunity-detail&folio=...` o `/crm/oportunidades/[id]`).
  - Mantiene activa la sección **Oportunidades** en el menú lateral y redirige automáticamente a **Oportunidades** si se intenta abrir la ruta de detalle sin un folio/ID válido.
  - Incluye encabezado con nombre del cliente, etapa interactiva y responsable asignado, botón visible `← Volver a Oportunidades` e historial cronológico de actividad legible.
- **Pipeline Kanban (`@dnd-kit`), Clientes, Agenda y Exportación Excel/PDF**:
  - Tablero arrastrar y soltar por etapas, directorio de clientes con interacciones, agenda de actividades e importación/exportación CSV, Excel (`exceljs`) y PDF (`jspdf`).

## ¿Cómo se modifica?
- **Etapas y probabilidades**: `constants/index.ts`.
- **Esquemas y validaciones**: `schemas/crm.schema.ts`.
- **Repositorio de datos**: `repository/crm.repository.ts` (`IRepositorioCrm`).
- **Lógica de negocio y métricas**: `services/crm.service.ts`.
