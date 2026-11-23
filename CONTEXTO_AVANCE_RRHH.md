# Contexto de Avance y Handoff — Módulo RRHH & Arquitectura BD (SIFYGSA)

> **Propósito:** Documento de traspaso completo para retomar el trabajo en la laptop de residencias sin perder contexto de los cambios, commits, scripts de base de datos ni pendientes.  
> **Última actualización:** 2026-11-23  
> **Autor / Responsable:** Moy García (Módulo de Recursos Humanos + Arquitectura BD)

---

## 1. Estado de Repositorios y Commits

| Repositorio | URL | Rama Activa | Último Commit de Código | Estado |
|---|---|---|---|---|
| **Standalone RRHH (Personal)** | `https://github.com/Moy-Garcia/sifygsa_rrhh` | `dev` *(NO `main`)* | `962565b` | Subido a `origin/dev`, `npm run build` OK (Vite + React 19) |
| **Suite Empresarial del Equipo** | `https://github.com/SIFYGSAPROJECTS/SIFYGSA-BUSINESS-SUITE` | `feat/rrhh-actualizacion` *(creada desde `dev`, NO `main`)* | `b9002e6` | Subido a `origin/feat/rrhh-actualizacion`, `npm run typecheck` y `next build` OK (61/61 rutas Next.js 16) |

- **Regla clave de integración en `SIFYGSA-BUSINESS-SUITE`:**
  - En `SIFYGSA-BUSINESS-SUITE`, la rama activa del equipo es **`dev`** (Next.js 16 + React 19 + App Router). La rama `main` es una versión anterior en Vite.
  - Todo el módulo de RRHH del equipo vive dentro de `src/modules/rrhh/suite/`, envuelto por `src/modules/rrhh/components/ContenedorRrhhCliente.tsx` y listado en `src/modules/registry.ts`.
  - **NO se tocó** la tipografía global del equipo (`src/app/layout.tsx` ni `src/modules/rrhh/suite/styles/tokens.css`), ni los módulos de otros compañeros (`almacen`, `compras`, `crm`, `requisiciones`, `admin`, `auth`).
  - *Nota para antes de abrir PR a `dev`:* revisar si conviene revertir cambios locales de prueba en `data/auditoria.json` y `data/usuarios.json` generados al probar el login local.

---

## 2. Resumen de Todo lo Realizado (Módulo RRHH)

### A. Estándar Oficial de Códigos y Departamentos
- **14 Departamentos Oficiales con siglas nemotécnicas** (reemplazando `DEP-001..DEP-014`):
  - `DIR` — Dirección *(Ing. Agustín Anastacio Martínez)*
  - `ADM` — Administración *(Lic. Viridiana Arenas Anastacio)*
  - `CAL` — Calidad *(Ing. Carlos Enrique Cossio Ruíz)*
  - `COM` — Compras *(Lic. Marlem Campos García)*
  - `HSE-MIN` — HSE Minatitlán *(Ing. Carlos Enrique Cossio Ruíz)*
  - `ALM` — Almacén *(Manuel Cordero — Mapachapa, Ver.)*
  - `INF` — Infraestructura *(Ing. Pablo Vázquez Culebro)*
  - `ING` — Ingeniería *(Ing. Miguel Ángel Guzmán Reyes)*
  - `MCP` — Medición y Control de Proyectos *(Ing. Víctor Manuel Anastacio Martínez)*
  - `HSE-COM` — HSE Comalcalco *(Ing. Rosa Ivette Trujillo Palma)*
  - `RH` — Recursos Humanos *(Lic. Valeria Méndez Albores; rama `RH-CAP` Capacitación)*
  - `SRV` — Servicios *(Ing. Emmanuel Mendoza Ramírez; Subgerente Erick Hernández Rueda)*
  - `VTA` — Ventas *(Ing. Manuel Martínez Ruíz; Gerentes Yesenia Rosas Rogel y Guillermo Sánchez Escobar; rama `VTA-SOL` Definición de Soluciones)*
  - `GSAPE` — GSAPE *(Ing. Samuel Martín Cruz Camera)*
- **Matrícula / Código Inmutable de Empleado (`SFG-0001`..`SFG-0192`):**
  - Se estandarizó a **`SFG-0001`** (independiente de departamento, sede o año para no romperse si se renombra un área o cambia de puesto).
  - La sigla del departamento (`[DIR]`, `[RH]`, `[SRV]`, etc.) se muestra como **distintivo visual relacional independiente** junto al folio.
  - Orden inicial de plantilla real (**192 colaboradores** en `data/sifygsa_db.json`):
    - `SFG-0001`: **Agustín Anastacio Martínez** (Director General)
    - `SFG-0002` a `SFG-0015`: Los 14 líderes oficiales del organigrama **VIPSALeaders** con sus reportes jerárquicos exactos.
    - `SFG-0016` a `SFG-0192`: Resto de la plantilla real con `firstName`, `paternalSurname`, `maternalSurname` separados y `supervisor` enlazado.
    - Generador automático (`getNextEmployeeFolio`): continúa en consecutivo (`SFG-0193`, `SFG-0194`...), escalando hasta 6 dígitos (`^SFG-[0-9]{4,6}$`).

### B. Mejoras UI/UX y Funcionalidades Implementadas
1. **Menú Principal (`RrhhDashboard.tsx`):**
   - Eliminados los paneles innecesarios (*Módulos y Accesos Rápidos* y *Fuerza Laboral por Departamento*).
   - Micro-resumen inteligente en tarjetas KPI cuando el conteo es `< 10` (`Eventuales`, `Cumpleaños Mes`, `Contratos por Vencer`) con clic directo al expediente; conteos `>= 10` quedan limpios con barra numérica.
   - *Directorio Rápido de Colaboradores* filtrado por defecto en **`Minatitlán, Ver.`** + buscador rápido en vivo.
   - *Agenda Semanal* con creador `+ Nueva Actividad` funcional y persistente.
2. **Registro del Personal (`EmployeeCreateView.tsx`):**
   - Wizard limpio de 6 etapas con **stepper circular conectado** (igualando el estándar visual del equipo); eliminados el toggle *Paso a Paso / Ver Todo*, el botón *Guardar Borrador* y textos de relleno.
   - Corregido el recorte de combos (`overflow: visible` en tarjetas).
   - Uniformes EPP simplificados únicamente a **Calzado (MEX)** y **Overol**.
   - Etapa 5 (**Nómina**): simplificada a una sola cuenta bajo la etiqueta limpia `Nómina`.
   - Etapa 6 (**Expediente Digital**): sistema de **Subcarpetas personalizables** (`Documentos`, `Certificaciones`, `Contratos y Anexos` + `+ Nueva Carpeta`).
3. **Directorio de Personal (`EmployeesCatalogView.tsx` — antes *Catálogo Personal*):**
   - Renombrado en toda la interfaz a **Directorio de Personal** (y *Alta de Empleado* → **Registro del Personal**).
   - **Botón unificado `Importar`** con 3 pestañas fluidas:
     - **Importar Excel (`.xlsx` / `.xls`) / CSV (`EmployeeBatchImportModal.tsx`):** lectura nativa con `xlsx`, separación automática de `Nombre` → `Nombre(s)`, `Ap. Paterno`, `Ap. Materno`, detección de `Nº de seguridad social` → `NSS`, resolución jerárquica de departamentos (`Dirección : Servicios` → `Servicios`), unión de `Ciudad` + `Estado/provincia`, actualización inteligente (*Smart Merge*) de datos faltantes en ya registrados, barra de columnas detectadas y filtro/buscador en vista previa.
     - **Captura Rápida en Lista**.
     - **Importar CV Individual (`CvImportModal.tsx` + `cvParser.ts`):** soporta `.pdf` (`pdfjs-dist`), `.docx`, `.xlsx`, `.txt`, imagen o texto pegado; 3 campos separados de nombre + selector **`+ Agregar otro campo`** del expediente; prellena `Registro del Personal` y adjunta el CV en la Etapa 6.
   - **Nueva 3.ª vista `Organigrama` (`OrgChartView.tsx`):** árbol corporativo interactivo conectado a los 192 colaboradores reales, con fotos cuando se cargan, badges `[DEP]` + `SFG-XXXX`, ramas expandibles/colapsables, presets (`Líderes` / `Todo`), filtro por área, buscador con resaltado automático y Zoom (`65%`–`125%`).
4. **Ficha de Colaborador (`EmployeeDetailModal.tsx`):**
   - Rediseño ejecutivo completo: eliminados el recorte del nombre, el código de barras decorativo y la tarjeta negra pesada.
   - Cabecera azul degradada con foto/avatar, badge `[DEP]`, folio copiable, 3 pestañas (**Resumen General** en Bento Grid, **Expediente Digital** por subcarpetas y **Salud, EPP y Nómina**), copiado en 1 clic (`RFC`, `CURP`, `NSS`, `Correo`, `Teléfono`, `CLABE`) y barra de completitud en pie fijo.
5. **Sincronización JSON Provisional (`data/sifygsa_db.json`):**
   - En `sifygsa_rrhh`: plugin dev en `vite.config.ts` (`/api/local-db`).
   - En `SIFYGSA-BUSINESS-SUITE`: route handler Next.js en `src/app/api/local-db/route.ts`.
   - Limpieza automática en `formShield.ts` ante textos binarios corruptos y sincronización reactiva entre módulos (`bootstrapLocalJsonDb`, `useSyncedEmployees`, `useSyncedDepartments`).
6. **Tipografía:**
   - En `sifygsa_rrhh` (standalone): **IBM Plex Sans** + **IBM Plex Mono**.
   - En `SIFYGSA-BUSINESS-SUITE`: se respetó intacta la tipografía global del equipo (`Inter` / `JetBrains Mono` en `layout.tsx` y `tokens.css`).

---

## 3. Arquitectura de Base de Datos Creada (`database/`)

Diseñada para **10,000+ colaboradores** y crecimiento multi-módulo (**Persistencia Políglota: PostgreSQL Multi-Schema + Prisma ORM + MongoDB para Logs**), con **100% `core.id_uuid`** en PKs/FKs (anti-IDOR) y **0 `VARCHAR`/`SERIAL` sueltos** en tablas.

```text
database/
├── README.md                                        # Guía de despliegue (psql, mongosh, prisma)
├── sifygsa_schema.sql                               # Puntero maestro (\i database/postgres/run_all.sql)
├── postgres/
│   ├── run_all.sql                                  # Ejecuta los 10 pasos en orden con un solo psql
│   ├── 00_bootstrap/
│   │   └── 01_extensions_and_schemas.sql            # pgcrypto, unaccent, pg_trgm + schemas: core, rrhh, finanzas, compras, crm
│   ├── 01_core/
│   │   ├── 01_domains.sql                           # core.id_uuid, codigo_corto, clave_sistema, nombre_corto/entidad, razon_social, rfc_mx, curp_mx, clabe_mx, correo_electronico, telefono_mx, cp_mx, monto_mxn, pwd_hash, token_sha256...
│   │   └── 02_tables.sql                            # empresas, sedes, modulos, submodulos, roles, rol_permisos, usuarios, sesiones
│   ├── 02_rrhh/
│   │   ├── 01_domains.sql                           # folio_empleado (^SFG-[0-9]{4,6}$), folio_documento, codigo_departamento, nss_mx, num_tarjeta_mx, tipo_sangre, talla_calzado, talla_overol, estatus_empleado, estatus_csf, estatus_solicitud, tipo_movimiento, extension_tel...
│   │   ├── 02_tables.sql                            # control_folios, cat_bancos, cat_tipos_contrato, departamentos (ramas con id_depto_padre), cat_puestos, empleados (nombre separado + id_supervisor + soft-delete), historial_movimientos (append-only), cuentas_bancarias, carpetas_expediente, documentos_expediente, extensiones_telefonicas, vacaciones_solicitudes, formatos_sgi, dias_festivos, agenda_actividades
│   │   ├── 03_indexes.sql                           # Llaves únicas parciales (WHERE deleted_at IS NULL), B-Tree por nombre_pila/apellidos/supervisor, GIN pg_trgm, índice funcional de cumpleaños
│   │   ├── 04_functions_triggers.sql                # fn_siguiente_folio atómico, fn_sincronizar_folio_empleados, fn_validar_ciclo_organigrama, tgfn_normalizar_empleado, tgfn_auditar_movimiento_laboral (lee contexto set_config), fn_porcentaje_expediente, triggers updated_at
│   │   ├── 05_views.sql                             # v_directorio_personal, v_organigrama_corporativo (WITH RECURSIVE CTE), v_cumpleanos_mes, v_contratos_por_vencer, v_resumen_departamentos
│   │   ├── 06_procedures.sql                        # sp_registrar_colaborador, sp_cambiar_departamento, sp_aplicar_baja_colaborador (SGI-FR-RH-15 + reasignación de equipo)
│   │   └── 07_security_roles_and_immutability.sql   # Trigger append-only en historial_movimientos, REVOKE PUBLIC, roles sifygsa_migrator vs sifygsa_app (sin DROP/TRUNCATE/DELETE físico en tablas críticas) y plantilla RLS multi-empresa
│   └── seeds/
│       ├── 01_seed_core.sql                         # SIFYGSA, VIPSA, 6 sedes, módulos, submódulos y roles base
│       ├── 02_seed_rrhh_catalogs.sql                # 14 departamentos (DIR..GSAPE), ramas RH-CAP/VTA-SOL, bancos, contratos, extensiones y festivos LFT 2026
│       └── 03_seed_rrhh_employees.sql               # 192 empleados reales (SFG-0001..SFG-0192), 187 enlaces de supervisor, fechas de nacimiento desde CURP y responsables de área
├── nosql/
│   └── mongodb/
│       ├── 01_collections_validators.js             # audit_logs, system_events y document_access_logs con $jsonSchema
│       ├── 02_indexes.js                            # Índices compuestos + TTL automático de 180 días en system_events
│       └── seeds/01_seed_audit_logs.js              # Eventos iniciales de auditoría RRHH
└── prisma/
    ├── schema.prisma                                # PostgreSQL multiSchema (core, rrhh), 100% @db.Uuid y longitudes alineadas a cada dominio
    └── seed.ts                                      # Validador y lista ordenada de ejecución de scripts SQL
```

---

## 4. Puntos Pendientes a Continuar en Residencias (`SIFYGSA-BUSINESS-SUITE`)

- [ ] **1. Revisar visibilidad de submódulos de RRHH en el menú lateral (`Sidebar`):**
  - Al correr `npm run dev` en `SIFYGSA-BUSINESS-SUITE`, faltaron algunos submódulos de RRHH en el menú lateral. Revisar `src/components/layout/Sidebar.tsx`, `src/lib/permissions.ts`, `src/config/types.ts` y `src/modules/registry.ts` para asegurar que aparezcan todos (`Menú Principal`, `Registro del Personal`, `Directorio de Personal`, `Vacaciones`, `Formatos SGI`, `Departamentos`, `Extensiones Telefónicas`, `Cumpleaños`, `Días Festivos`).
- [ ] **2. Revisar la BD en general (`database/`):**
  - Validar y probar la ejecución completa contra PostgreSQL + MongoDB + `npx prisma generate --schema=database/prisma/schema.prisma`.
- [ ] **3. Crear una cuenta para cada Gerente de departamento (`VIPSALeaders`):**
  - Dar de alta cuentas reales con correo/contraseña y rol correspondiente para cada gerencia (`Dirección General`, `Dirección Comercial`, `Servicios`, `Ingeniería`, `Compras`, `QHSE`, `Infraestructura`, `Administración`, `Recursos Humanos`, `HSE Comalcalco`, `MYCP`, `Soporte a Proyectos`, `Ventas Sur`, `Ventas Istmo`).
- [ ] **4. Mejorar la pantalla de Login (`src/app/(auth)/login/page.tsx`):**
  - Quitar la lista/botones visibles de acceso rápido por departamento para que sea un login corporativo limpio donde cada gerente o empleado ingrese exclusivamente con su **correo y contraseña**.
- [ ] **5. Control de acceso estricto por rol/módulo (RBAC):**
  - Garantizar que cada usuario entre únicamente a los módulos que le corresponden (ej. Gerente de RRHH accede solo a **Recursos Humanos** y **no** puede entrar a **Ventas/CRM** ni **Almacén**, ni verlos habilitados sin permiso).
- [ ] **6. Unificar en `database/` los demás módulos del equipo:**
  - Integrar los esquemas de **Compras** (`server/src/sql/schema_compras.sql`, `schema_facturacion.sql`), **Almacén**, **CRM/Ventas**, **Requisiciones** y **Finanzas** sobre la estructura multi-schema (`database/postgres/03_...`, `04_...`, `05_...`) y mapearlos en `database/prisma/schema.prisma` enlazando sus FKs contra `core.*` y `rrhh.empleados(id_empleado)`.
