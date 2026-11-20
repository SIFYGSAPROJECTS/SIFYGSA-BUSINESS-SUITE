-- ============================================================================
-- database/postgres/00_bootstrap/01_extensions_and_schemas.sql
-- SIFYGSA ERP + CRM — Bootstrap de PostgreSQL (Extensiones, Roles y Schemas)
-- Escala objetivo: 10,000+ colaboradores | Arquitectura Modular Multi-Schema
-- ============================================================================

-- 1. Extensiones profesionales recomendadas para ERP en PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- UUIDs seguros (gen_random_uuid) y hashing
CREATE EXTENSION IF NOT EXISTS unaccent;   -- Búsquedas insensibles a acentos (ej. "Adrian" = "Adrián")
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Índices GIN trigramas para búsquedas LIKE/ILIKE < 2ms en 10k+ filas

-- 2. Schemas modulares (Modular Monolith -> Microservices Ready)
--    core     : Empresas, sedes, roles, usuarios y catálogos transversales
--    rrhh     : Recursos Humanos (Directorio, Organigrama, Expedientes, Vacaciones, SGI)
--    finanzas : (Reservado para módulo Finanzas / Nómina)
--    compras  : (Reservado para módulo Compras / Proveedores)
--    crm      : (Reservado para módulo Ventas / Clientes / Proyectos)
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS rrhh;
CREATE SCHEMA IF NOT EXISTS finanzas;
CREATE SCHEMA IF NOT EXISTS compras;
CREATE SCHEMA IF NOT EXISTS crm;

COMMENT ON SCHEMA core     IS 'Entidades transversales compartidas por toda la suite ERP/CRM SIFYGSA';
COMMENT ON SCHEMA rrhh     IS 'Módulo de Recursos Humanos: plantilla, organigrama, expedientes, vacaciones y SGI';
COMMENT ON SCHEMA finanzas IS 'Módulo de Finanzas y Dispersión de Nómina (reservado)';
COMMENT ON SCHEMA compras  IS 'Módulo de Compras, Almacén y Proveedores (reservado)';
COMMENT ON SCHEMA crm      IS 'Módulo Comercial, Clientes, Cotizaciones y Proyectos (reservado)';

-- 3. Configuración del search_path por defecto para esta sesión
SET search_path TO rrhh, core, public;
