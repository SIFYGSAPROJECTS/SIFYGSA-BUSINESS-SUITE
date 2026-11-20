-- ============================================================================
-- database/postgres/02_rrhh/07_security_roles_and_immutability.sql
-- Defensa en Profundidad (Hardening PostgreSQL nivel empresarial)
--   1. Inmutabilidad Append-Only en rrhh.historial_movimientos
--   2. Hardening del schema PUBLIC (CIS PostgreSQL Benchmark)
--   3. Separación de roles por Mínimo Privilegio (Migrador vs App Prisma)
--   4. Plantilla lista para Row-Level Security (RLS) multi-empresa
-- ============================================================================

-- ── 1. Protección Append-Only: nadie puede alterar ni borrar el historial ────
CREATE OR REPLACE FUNCTION rrhh.tgfn_bloquear_modificacion_historial()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Violación de integridad: rrhh.historial_movimientos es inmutable (solo INSERT permitido). Operación bloqueada: %', TG_OP
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS tr_rrhh_historial_inmutable ON rrhh.historial_movimientos;
CREATE TRIGGER tr_rrhh_historial_inmutable
BEFORE UPDATE OR DELETE ON rrhh.historial_movimientos
FOR EACH ROW
EXECUTE FUNCTION rrhh.tgfn_bloquear_modificacion_historial();

-- ── 2. Hardening del rol PUBLIC (ningún usuario no autorizado crea objetos) ──
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA core, rrhh FROM PUBLIC;

-- ── 3. Roles de Mínimo Privilegio (NOLOGIN por defecto; asigna contraseña en PROD)
--    sifygsa_migrator : Solo para desplegar DDL/migraciones
--    sifygsa_app      : El rol que usa el backend Node.js / Prisma en producción
--                       (NO tiene DROP, NO tiene TRUNCATE, NO tiene DELETE en tablas críticas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sifygsa_migrator') THEN
    CREATE ROLE sifygsa_migrator NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sifygsa_app') THEN
    CREATE ROLE sifygsa_app NOLOGIN;
  END IF;
END;
$$;

-- Permisos del rol de aplicación (Prisma / API)
GRANT USAGE ON SCHEMA core, rrhh TO sifygsa_app;

-- Lectura y escritura controlada (SIN TRUNCATE, SIN REFERENCES, SIN TRIGGER)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core TO sifygsa_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA rrhh TO sifygsa_app;

-- Solo permitir DELETE en tablas operativas donde sí aplica (sesiones, permisos, carpetas, documentos, agenda)
GRANT DELETE ON core.sesiones, core.rol_permisos TO sifygsa_app;
GRANT DELETE ON rrhh.carpetas_expediente, rrhh.documentos_expediente, rrhh.agenda_actividades TO sifygsa_app;

-- Prohibición explícita de UPDATE/DELETE en historial_movimientos y DELETE físico en empleados/formatos SGI
REVOKE UPDATE, DELETE, TRUNCATE ON rrhh.historial_movimientos FROM sifygsa_app;
REVOKE DELETE, TRUNCATE ON rrhh.empleados, rrhh.formatos_sgi, rrhh.vacaciones_solicitudes FROM sifygsa_app;

-- Ejecución de funciones y procedimientos almacenados del módulo RRHH
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA rrhh TO sifygsa_app;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA rrhh TO sifygsa_app;

-- Privilegios por defecto para futuras tablas que agreguen tus compañeros
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE ON TABLES TO sifygsa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA rrhh GRANT SELECT, INSERT, UPDATE ON TABLES TO sifygsa_app;

-- ── 4. Plantilla lista para Row-Level Security (RLS) Multi-Empresa ───────────
-- Cuando activen operación simultánea estricta entre SIFYGSA y VIPSA en la misma API,
-- basta descomentar las líneas siguientes y enviar `SET LOCAL app.current_empresa_id = '<uuid>';`
-- en cada transacción de Prisma:
--
-- ALTER TABLE rrhh.empleados ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY pol_emp_aislamiento_empresa ON rrhh.empleados
--   USING (
--     current_setting('app.current_empresa_id', TRUE) IS NULL
--     OR id_empresa = current_setting('app.current_empresa_id', TRUE)::UUID
--   );
