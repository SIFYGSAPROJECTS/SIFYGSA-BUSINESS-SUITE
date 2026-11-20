-- ============================================================================
-- database/postgres/run_all.sql
-- Script maestro de despliegue completo en PostgreSQL (psql)
-- Uso:
--   createdb sifygsa_erp
--   psql -d sifygsa_erp -v ON_ERROR_STOP=1 -f database/postgres/run_all.sql
-- ============================================================================

\echo '==> [1/9] Bootstrap: Extensiones y Schemas...'
\i database/postgres/00_bootstrap/01_extensions_and_schemas.sql

\echo '==> [2/9] Core: Dominios globales...'
\i database/postgres/01_core/01_domains.sql

\echo '==> [3/9] Core: Tablas transversales (Empresas, Sedes, RBAC, Usuarios)...'
\i database/postgres/01_core/02_tables.sql

\echo '==> [4/9] RRHH: Dominios especializados...'
\i database/postgres/02_rrhh/01_domains.sql

\echo '==> [5/9] RRHH: Tablas normalizadas...'
\i database/postgres/02_rrhh/02_tables.sql

\echo '==> [6/9] RRHH: Índices (B-Tree, GIN pg_trgm, parciales)...'
\i database/postgres/02_rrhh/03_indexes.sql

\echo '==> [7/9] RRHH: Funciones y Triggers...'
\i database/postgres/02_rrhh/04_functions_triggers.sql

\echo '==> [8/10] RRHH: Vistas y Procedimientos Almacenados...'
\i database/postgres/02_rrhh/05_views.sql
\i database/postgres/02_rrhh/06_procedures.sql

\echo '==> [9/10] Seguridad: Roles de mínimo privilegio e inmutabilidad Append-Only...'
\i database/postgres/02_rrhh/07_security_roles_and_immutability.sql

\echo '==> [10/10] Seeds iniciales (Core, Catálogos RRHH y Plantilla 192 Colaboradores)...'
\i database/postgres/seeds/01_seed_core.sql
\i database/postgres/seeds/02_seed_rrhh_catalogs.sql
\i database/postgres/seeds/03_seed_rrhh_employees.sql

\echo '==> Despliegue PostgreSQL SIFYGSA ERP completado exitosamente.'
