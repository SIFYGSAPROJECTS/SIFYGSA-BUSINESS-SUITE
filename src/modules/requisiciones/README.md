# Módulo de Requisiciones (`src/modules/requisiciones`)

## ¿Qué hace?
Gestiona el ciclo completo de procura e instrumentación industrial abierto a cualquier usuario autenticado para solicitar y dar seguimiento a sus propias requisiciones, reservando la revisión, aprobación, atención y cierre a los roles autorizados:

- **Flujo de etapas tipadas**:
  `solicitud` → `revision` → `aprobacion` (multinivel según rol y monto) → `atencion` → `cierre`, además de los estados terminales `rechazada` y `cancelada`.
- **Requisiciones abiertas a cualquier rol**:
  Cualquier persona con sesión activa puede crear una nueva requisición y consultar sus propias requisiciones (`ver_propias`, `crear`).
- **Cancelación por el solicitante**:
  El solicitante puede cancelar su propia requisición únicamente mientras se encuentre en `solicitud` o `revision` (antes de ser aprobada).
- **Aprobación por niveles de monto**:
  - **Nivel 1 — Compras** (hasta `$50,000 MXN`): `requisiciones`, `gerente` o `administrador`.
  - **Nivel 2 — Gerencia** (`$50,001 a $250,000 MXN`): `gerente` o `administrador`.
  - **Nivel 3 — Dirección General** (`> $250,000 MXN`): `administrador`.
- **Protección contra abuso y validación en servidor (`services/requisiciones.service.ts`)**:
  - El solicitante siempre se toma de la sesión firmada (`actor.nombre` / `actor.sub`), nunca del cuerpo de la petición.
  - Límite de hasta `8` requisiciones por usuario por hora (`LIMITE_REQUISICIONES_POR_HORA`).
  - Detección automática de requisiciones activas duplicadas y códigos de artículo repetidos.
  - Validación de techo presupuestal por área con Zod (`esquemaCrearRequisicion`).

## Tabla de Permisos por Rol en Requisiciones

| Rol | Acciones en Matriz (`lib/permissions`) | Opciones visibles en el Menú Lateral | Alcance en Servidor |
| :--- | :--- | :--- | :--- |
| **Administrador** (`administrador`) | `ver_propias`, `ver`, `crear`, `editar`, `eliminar`, `aprobar`, `exportar` | Nueva requisición, Mis requisiciones, Requisición, Revisión/Aprobación/Atención | Ve todas, aprueba Nivel 1/2/3, atiende, cierra y exporta. |
| **Gerente Comercial** (`gerente`) | `ver_propias`, `ver`, `crear`, `aprobar`, `exportar` | Nueva requisición, Mis requisiciones, Requisición, Revisión/Aprobación/Atención | Ve todas, revisa, aprueba hasta Nivel 2 (`$250,000 MXN`) y exporta. |
| **Compras y Requisiciones** (`requisiciones`) | `ver_propias`, `ver`, `crear`, `editar`, `aprobar`, `exportar` | Nueva requisición, Mis requisiciones, Requisición, Revisión/Aprobación/Atención | Ve todas, revisa, aprueba Nivel 1 (`$50,000 MXN`), atiende OC, cierra y exporta. |
| **Ejecutivo de Ventas** (`vendedor`) | `ver_propias`, `crear` | Nueva requisición, Mis requisiciones | Solo crea requisiciones, consulta las propias y cancela antes de aprobación. |
| **Recursos Humanos** (`rrhh`) | `ver_propias`, `crear` | Nueva requisición, Mis requisiciones | Solo crea requisiciones, consulta las propias y cancela antes de aprobación. |

## ¿Cómo se modifica?
- **Techos presupuestales, estados y niveles de monto**: `constants/index.ts`.
- **Reglas de validación con Zod**: `schemas/requisicion.schema.ts`.
- **Repositorio de datos**: `repository/requisiciones.repository.ts` (`IRepositorioRequisiciones`).
- **Reglas de negocio, permisos en servidor y anti-abuso**: `services/requisiciones.service.ts`.
