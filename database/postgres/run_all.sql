-- ============================================================================
-- database/postgres/run_all.sql
-- Script maestro de despliegue completo en PostgreSQL (psql)
-- Uso:
--   createdb sifygsa_erp
--   psql -d sifygsa_erp -v ON_ERROR_STOP=1 -f database/postgres/run_all.sql
-- ============================================================================

\echo '==> [01/13] Bootstrap: Extensiones (pgcrypto, unaccent, pg_trgm) y Schemas...'
\i database/postgres/00_bootstrap/01_extensions_and_schemas.sql

\echo '==> [02/13] Core: Dominios globales...'
\i database/postgres/01_core/01_domains.sql

\echo '==> [03/13] Core: Tablas transversales (Empresas, Sedes, RBAC, Usuarios)...'
\i database/postgres/01_core/02_tables.sql

\echo '==> [04/13] RRHH: Dominios especializados...'
\i database/postgres/02_rrhh/01_domains.sql

\echo '==> [05/13] RRHH: Tablas normalizadas (3FN sin columnas derivadas)...'
\i database/postgres/02_rrhh/02_tables.sql

\echo '==> [06/13] RRHH: Funciones de búsqueda e Índices (B-Tree, GIN pg_trgm, parciales)...'
\i database/postgres/02_rrhh/03_indexes.sql

\echo '==> [07/13] RRHH: Funciones de negocio y Triggers...'
\i database/postgres/02_rrhh/04_functions_triggers.sql

\echo '==> [08/13] RRHH: Vistas calculadas (Directorio, Organigrama CTE, KPIs)...'
\i database/postgres/02_rrhh/05_views.sql

\echo '==> [09/13] RRHH: Procedimientos Almacenados transaccionales...'
\i database/postgres/02_rrhh/06_procedures.sql

\echo '==> [10/13] Seguridad: Roles de mínimo privilegio e inmutabilidad Append-Only...'
\i database/postgres/02_rrhh/07_security_roles_and_immutability.sql

\echo '==> [11/13] Seed Core: Empresas, 28 Sedes normalizadas, Módulos y Roles...'
\i database/postgres/seeds/01_seed_core.sql

\echo '==> [12/13] Seed RRHH: Catálogos (Bancos, Contratos, Deptos, Puestos, Extensiones)...'
\i database/postgres/seeds/02_seed_rrhh_catalogs.sql

\echo '==> [13/13] Seed RRHH: Plantilla real normalizada, Organigrama y Responsables...'
\i database/postgres/seeds/03_seed_rrhh_employees.sql

\echo '==> Despliegue PostgreSQL SIFYGSA ERP completado exitosamente.'
