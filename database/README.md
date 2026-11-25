# Arquitectura de Base de Datos — SIFYGSA ERP + CRM

Diseño modular **Multi-Schema (PostgreSQL en 3FN) + Prisma ORM + NoSQL (MongoDB)** pensado para escalar a **10,000+ colaboradores**, sin columnas derivadas ni texto redundante, y listo para trabajar en paralelo en Git con los demás módulos del equipo (`almacen`, `compras`, `requisiciones`, `crm`, `finanzas`).

---

## Principios de Normalización (3FN sin datos derivados)

- **Cero almacenamiento de datos derivados o de UI:**
  - `nombre_completo`, `iniciales` y `acreditacion_tipo` se calculan al vuelo en las vistas (`rrhh.v_directorio_personal`, `rrhh.v_organigrama_corporativo`).
  - `avatar_color` vive únicamente en frontend (determinístico por folio).
- **Cero texto duplicado en catálogos:**
  - `puesto` → solo FK `id_puesto` hacia `rrhh.cat_puestos` (102 puestos unificados).
  - `sede` → solo FK `id_sede` hacia `core.sedes` (28 sedes/localidades normalizadas).
  - `banco`, `carpeta` y `empleado` en extensiones → únicamente por FK (`id_banco`, `id_carpeta`, `id_empleado_asignado`).
  - `historial_movimientos` guarda FKs `id_depto_*` e `id_puesto_*` en lugar de repetir cadenas largas.
- **Unicidad insensible a acentos y mayúsculas:** índices únicos funcionales (`rrhh.fn_normalizar_busqueda`) sobre `core.sedes`, `rrhh.cat_puestos` y `rrhh.cat_bancos`, más índices `GIN pg_trgm` sin acentos sobre nombre completo y puesto.
- **Columnas ordenadas por etapa de captura:** `rrhh.empleados` sigue el orden exacto de *Registro del Personal* (Etapa 1 Datos Personales → Etapa 2 Datos Laborales → Etapa 3 Contacto/Domicilio → Etapa 4 Salud/Uniformes EPP → Etapa 5 `cuentas_bancarias` → Etapa 6 `documentos_expediente` + `estatus_csf`).

---

## Estructura de carpetas

```text
database/
├── README.md
├── sifygsa_schema.sql                          # Punto de entrada (\i database/postgres/run_all.sql)
├── entregables/
│   ├── sifygsa_rrhh_completo.sql               # Script SQL unificado completo (BD, schemas, dominios, 23 tablas, triggers, vistas, SPs, permisos y seeds)
│   └── sifygsa_rrhh_uml.drawio                 # Diagrama UML / ER nativo en Draw.io (2 pestañas: RRHH enfocado + Suite Core+RRHH)
├── postgres/
│   ├── run_all.sql                             # Script maestro ejecutable con psql (13 pasos)
│   ├── 00_bootstrap/
│   │   └── 01_extensions_and_schemas.sql       # pgcrypto, unaccent, pg_trgm + schemas (core, rrhh, finanzas, compras, crm)
│   ├── 01_core/
│   │   ├── 01_domains.sql                      # Dominios globales: correo, teléfono MX, CP, RFC, CURP, CLABE, montos
│   │   └── 02_tables.sql                       # Empresas, sedes, módulos, submódulos, roles, permisos, usuarios, sesiones
│   ├── 02_rrhh/
│   │   ├── 01_domains.sql                      # folio_empleado (^SFG-[0-9]{4,6}$), codigo_departamento, nss_mx, tallas EPP...
│   │   ├── 02_tables.sql                       # 15 tablas normalizadas (3FN sin columnas derivadas)
│   │   ├── 03_indexes.sql                      # Helpers IMMUTABLE sin acentos + B-Tree, GIN pg_trgm y únicos parciales
│   │   ├── 04_functions_triggers.sql           # Folio atómico, fecha nac. desde CURP, anti-ciclos, historial, completitud 15/15
│   │   ├── 05_views.sql                        # 6 vistas: Directorio, Organigrama CTE, Cumpleaños, Contratos, Deptos, Extensiones
│   │   ├── 06_procedures.sql                   # SP alta integral (auto-resuelve puesto/banco), transferencia, baja SGI-FR-RH-15
│   │   └── 07_security_roles_and_immutability.sql # Roles de mínimo privilegio (sifygsa_app), trigger append-only y plantilla RLS
│   └── seeds/
│       ├── 01_seed_core.sql                    # SIFYGSA, VIPSA, 28 sedes normalizadas, 8 módulos, 9 submódulos RRHH y 5 roles RBAC
│       ├── 02_seed_rrhh_catalogs.sql           # 13 bancos SPEI, 5 contratos, 14 deptos + 2 ramas, 102 puestos, 14 extensiones, festivos
│       └── 03_seed_rrhh_employees.sql          # 188 colaboradores reales normalizados (SFG-0001..SFG-0192), organigrama y responsables
├── nosql/
│   └── mongodb/
│       ├── 01_collections_validators.js        # audit_logs, system_events y document_access_logs con $jsonSchema
│       ├── 02_indexes.js                       # Índices compuestos + TTL automático (180 días en system_events)
│       └── seeds/
│           └── 01_seed_audit_logs.js           # Eventos iniciales de Bitácora Gerencial
└── prisma/
    ├── schema.prisma                           # ORM PostgreSQL multiSchema mapeado 1 a 1 a core y rrhh (3FN)
    └── seed.ts                                 # Validador / runner de orden de los 13 scripts SQL
```

---

## Cómo ejecutarlo paso a paso

### 1. PostgreSQL (Todo en un comando)
```bash
createdb sifygsa_erp
psql -d sifygsa_erp -v ON_ERROR_STOP=1 -f database/postgres/run_all.sql
```

### 2. Verificación rápida en `psql`
```sql
-- Consultar líderes del Organigrama usando la vista recursiva (CTE)
SELECT nivel, folio, codigo_departamento, nombre_completo, puesto, subordinados_directos
FROM rrhh.v_organigrama_corporativo
WHERE nivel <= 2;

-- Búsqueda insensible a mayúsculas y acentos (usa índice GIN pg_trgm sin duplicar nombre_completo)
SELECT folio, codigo_departamento, nombre_completo, puesto, sede
FROM rrhh.v_directorio_personal
WHERE rrhh.fn_normalizar_busqueda(nombre_completo) LIKE '%' || rrhh.fn_normalizar_busqueda('agustin martinez') || '%';

-- Probar cambio de departamento conservando folio inmutable + historial automático
CALL rrhh.sp_cambiar_departamento('SFG-0016', 'ING', 'SFG-0004', 'Promoción interna', 'valeria.mendez');
```

### 3. MongoDB (Bitácora y Logs NoSQL)
```bash
mongosh "mongodb://localhost:27017/sifygsa_logs" database/nosql/mongodb/01_collections_validators.js
mongosh "mongodb://localhost:27017/sifygsa_logs" database/nosql/mongodb/02_indexes.js
mongosh "mongodb://localhost:27017/sifygsa_logs" database/nosql/mongodb/seeds/01_seed_audit_logs.js
```

### 4. Prisma (Backend Node / TypeScript)
```bash
# Definir DATABASE_URL="postgresql://usuario:password@localhost:5432/sifygsa_erp" en .env
npx prisma generate --schema=database/prisma/schema.prisma
```
