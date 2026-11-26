# CHANGELOG — Mejoras Incrementales, Arquitectura Modular y Registro de Mejoras Visuales

## 1. Registro Detallado de Mejoras Visuales y de Interacción (Reversibles)

Siguiendo el principio de diseño empresarial del ERP, se conservó el 100% de la identidad visual original (paleta, tipografía, tokens, temas claro/oscuro, pantallas de Home, Ajustes, Login, CRM, Requisiciones y RRHH) y se aplicaron únicamente las siguientes mejoras incrementales:

1. **Eliminación de `"Detalle Oportunidad"` del submenú lateral de `"CRM & VENTAS"` y renombre de `"Requisición"`**
   - **Archivos**: `src/modules/registry.ts`, `src/components/layout/sidebar.tsx`, `src/components/layout/MainLayout.tsx`, `src/context/LanguageContext.tsx`.
   - **Por qué**: `"Detalle Oportunidad"` es una vista dependiente de un ID/folio y no una sección estática de primer nivel; el submenú de CRM queda con **Oportunidades**, **Actividades (Kanban & Gantt)** y **Reportes & Pipeline**, resaltando siempre **Oportunidades** cuando se consulta un detalle. Además, se renombró `"Requisición NetSuite"` a `"Requisición"`.
   - **Cómo revertir**: Restaurar la entrada `crm-opportunity-detail` en `REGISTRO_MODULOS.crm.subItems` dentro de `src/modules/registry.ts`.

2. **Mejora de la vista `OpportunityDetail.tsx` conservando su diseño (`crm.css`)**
   - **Archivos**: `src/modules/crm/pages/OpportunityDetail.tsx`, `src/modules/crm/pages/HomeCRM.tsx`, `src/modules/crm/components/KanbanCrm.tsx`, `src/modules/crm/components/TablaOportunidadesCrm.tsx`, `src/modules/crm/components/ContenedorCrmCliente.tsx`.
   - **Por qué**: Permitir abrir el detalle haciendo clic en cualquier oportunidad desde la lista de Oportunidades, desde el Kanban y desde el Pipeline; mostrar claramente en el encabezado la empresa, etapa actual y responsable asignado; agregar retroalimentación visual tipo banner/toast sin `window.alert`; y mostrar el historial de actividad legible en las pestañas `Resumen`, `Actividades`, `Documentos` e `Historial`.
   - **Cómo revertir**: Revertir `src/modules/crm/pages/OpportunityDetail.tsx` a su versión previa estática de una sola pestaña.

3. **Menú lateral de Requisiciones dinámico para todos los roles**
   - **Archivos**: `src/modules/registry.ts`, `src/components/layout/sidebar.tsx`, `src/components/layout/SidebarRH.tsx`.
   - **Por qué**: Todos los roles tienen acceso a Requisiciones; los roles básicos (`vendedor`, `rrhh`) ven únicamente **Nueva requisición** y **Mis requisiciones** (también integrado en el menú lateral de RRHH `SidebarRH.tsx`), mientras que los roles autorizados (`administrador`, `gerente`, `requisiciones`) ven además **Requisición** y **Revisión, Aprobación y Atención**.
   - **Cómo revertir**: Quitar el bloque `REQUISICIONES` en `src/components/layout/SidebarRH.tsx` y ajustar `accionRequerida` en `src/modules/registry.ts`.

4. **Formulario de Nueva Requisición con solicitante de sesión no editable y validación visible por campo**
   - **Archivos**: `src/modules/requisiciones/components/FormularioNuevaRequisicion.tsx`.
   - **Por qué**: Garantizar que el campo `Solicitante` se llene automáticamente con la sesión activa (`readOnly` / `disabled`), incluir `Área`, `Descripción general`, `Artículos (código, descripción, cantidad, unidad y monto unitario)`, `Monto estimado`, `Prioridad`, `Fecha requerida` y `Justificación`, mostrando errores de validación de Zod en línea debajo de cada campo.
   - **Cómo revertir**: Revertir `src/modules/requisiciones/components/FormularioNuevaRequisicion.tsx`.

5. **Tabla de Requisiciones con insignias consistentes, paginación, estado vacío y esqueletos de carga**
   - **Archivos**: `src/modules/requisiciones/components/BandejaRequisiciones.tsx`.
   - **Por qué**: Añadir estado vacío claro (`"Aún no tienes requisiciones"` con botón para crear una nueva), filas de esqueleto durante la recarga, paginación e insignias consistentes para los 7 estados (`solicitud`, `revision`, `aprobacion`, `atencion`, `cierre`, `rechazada`, `cancelada`).
   - **Cómo revertir**: Revertir `src/modules/requisiciones/components/BandejaRequisiciones.tsx`.

6. **Línea de tiempo de etapas y opción de cancelación en el modal de seguimiento de Requisiciones**
   - **Archivos**: `src/modules/requisiciones/components/ModalHistorialRequisicion.tsx`.
   - **Por qué**: Permitir al solicitante visualizar una línea de tiempo clara de las 5 etapas (`1. Solicitud` → `2. Revisión` → `3. Aprobación` → `4. Atención (OC)` → `5. Cerrada`) y cancelar su requisición mientras aún no haya sido aprobada (`solicitud` o `revision`).
   - **Cómo revertir**: Revertir `src/modules/requisiciones/components/ModalHistorialRequisicion.tsx`.

---

## 2. Resumen de Cambios de Arquitectura, Seguridad y Reglas de Negocio

- **Matriz de permisos (`src/config/types.ts`, `src/lib/permissions/matrix.ts`, `data/roles-permisos.json`)**:
  - Se agregó la acción `'ver_propias'` a `ACCIONES_PERMISO`.
  - Se otorgaron `'ver_propias'` y `'crear'` en el módulo `requisiciones` a todos los roles (`administrador`, `gerente`, `vendedor`, `rrhh`, `requisiciones`).
  - Se mantuvieron `'ver'` (ver todas), `'editar'`, `'aprobar'` y `'exportar'` restringidas exclusivamente a los roles autorizados (`administrador`, `gerente`, `requisiciones`).
- **Validación estricta en el servidor (`src/modules/requisiciones/services/requisiciones.service.ts`, `src/app/api/requisiciones/route.ts`, `src/app/api/requisiciones/[id]/route.ts`)**:
  - `listarRequisicionesParaUsuario(actor)` filtra en el servidor para que un rol básico solo reciba las requisiciones creadas por él mismo.
  - `crearNuevaRequisicion(entrada, actor)` toma siempre el solicitante de la sesión (`actor.nombre` y `actor.sub`), aplica un límite de `8` requisiciones por hora por usuario (`LIMITE_REQUISICIONES_POR_HORA`), detecta duplicados activos, inicia en estado `'solicitud'` y registra el evento en `data/auditoria.json` notificando a los roles revisores.
  - `avanzarEstadoRequisicion(id, entrada, actor)` permite al solicitante cancelar su propia requisición únicamente antes de ser aprobada (`solicitud` o `revision`) y restringe en servidor todas las demás transiciones (`revision`, `aprobacion`, `atencion`, `cierre`, `rechazada`) a los roles autorizados según nivel y monto.
