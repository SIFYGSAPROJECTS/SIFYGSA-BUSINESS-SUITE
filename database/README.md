# Arquitectura de Base de Datos — SIFYGSA ERP + CRM

Diseño modular **Multi-Schema (PostgreSQL) + Prisma ORM + NoSQL (MongoDB)** pensado para escalar cómodamente a **10,000+ colaboradores** y facilitar el trabajo paralelo en Git con los demás módulos del equipo (`finanzas`, `compras`, `crm`).

---

## Estructura de carpetas

```text
database/
├── README.md
├── postgres/
│   ├── run_all.sql                             # Script maestro ejecutable con psql
│   ├── 00_bootstrap/
│   │   └── 01_extensions_and_schemas.sql       # pgcrypto, unaccent, pg_trgm + schemas (core, rrhh, finanzas, compras, crm)
│   ├── 01_core/
│   │   ├── 01_domains.sql                      # Dominios globales: correo, teléfono MX, CP, RFC, CURP, CLABE, montos
│   │   └── 02_tables.sql                       # Empresas, sedes, módulos, submódulos, roles, permisos, usuarios, sesiones
│   ├── 02_rrhh/
│   │   ├── 01_domains.sql                      # folio_empleado (^SFG-[0-9]{4,6}$), codigo_departamento, nss_mx, tipo_sangre...
│   │   ├── 02_tables.sql                       # Departamentos (ramas), puestos, empleados, historial, nómina, expediente, SGI
│   │   ├── 03_indexes.sql                      # B-Tree, GIN pg_trgm (búsqueda rápida), llaves únicas parciales, cumpleaños
│   │   ├── 04_functions_triggers.sql           # Folio atómico SFG-XXXX, anti-ciclos organigrama, historial automático
│   │   ├── 05_views.sql                        # Directorio, Organigrama recursivo (WITH RECURSIVE), KPIs del Menú Principal
│   │   ├── 06_procedures.sql                   # SP alta integral, transferencia de depto, baja SGI con reasignación
│   │   └── 07_security_roles_and_immutability.sql # Roles de mínimo privilegio (sifygsa_app), trigger append-only y plantilla RLS
│   └── seeds/
│       ├── 01_seed_core.sql                    # SIFYGSA, VIPSA, 6 sedes, módulos y roles
│       ├── 02_seed_rrhh_catalogs.sql           # 14 departamentos (DIR..GSAPE), ramas, bancos, contratos, extensiones, festivos
│       └── 03_seed_rrhh_employees.sql          # 192 colaboradores reales (SFG-0001..SFG-0192) con organigrama enlazado
├── nosql/
│   └── mongodb/
│       ├── 01_collections_validators.js        # audit_logs, system_events y document_access_logs con $jsonSchema
│       ├── 02_indexes.js                       # Índices compuestos + TTL automático (180 días en system_events)
│       └── seeds/
│           └── 01_seed_audit_logs.js           # Eventos iniciales de Bitácora Gerencial
└── prisma/
    ├── schema.prisma                           # ORM PostgreSQL multiSchema mapeado 1 a 1 a core y rrhh
    └── seed.ts                                 # Validador / runner de orden de scripts SQL
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
-- Consultar los 15 líderes del Organigrama usando la vista recursiva (CTE)
SELECT nivel, folio, codigo_departamento, nombre_completo, puesto, subordinados_directos
FROM rrhh.v_organigrama_corporativo
WHERE nivel <= 2;

-- Buscar todos los colaboradores que se llamen "Alan" (consulta exacta por nombre_pila)
SELECT folio, codigo_departamento, nombre_pila, apellido_paterno, apellido_materno, puesto
FROM rrhh.v_directorio_personal
WHERE LOWER(nombre_pila) LIKE '%alan%';

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

---

## Cómo integrar módulos de otros compañeros en Git
Cuando tus compañeros integren **Finanzas**, **Compras** o **CRM**:
1. Cada equipo crea su carpeta aislada en `database/postgres/03_finanzas/`, `04_compras/` o `05_crm/`.
2. Sus tablas referencian `core.empresas`, `core.sedes`, `core.usuarios` y `rrhh.empleados(id_empleado)` sin modificar los archivos de `02_rrhh/`.
3. Agregan su schema al arreglo `schemas = ["core", "rrhh", "finanzas", ...]` de `database/prisma/schema.prisma` y registran sus scripts en `database/postgres/run_all.sql`.
