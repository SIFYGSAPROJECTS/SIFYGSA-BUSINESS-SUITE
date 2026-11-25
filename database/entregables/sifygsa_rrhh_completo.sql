-- ============================================================
-- database/entregables/sifygsa_rrhh_completo.sql
-- SIFYGSA Business Suite — Módulo Recursos Humanos (PostgreSQL)
-- Script Unificado Completo (3FN, sin datos derivados)
--
-- Uso completo desde psql:
--   psql -U postgres -v ON_ERROR_STOP=1 -f database/entregables/sifygsa_rrhh_completo.sql
--
-- Nota:
--   - Secciones 1 a 12: Creación de BD, schemas, dominios, 23 tablas,
--     índices sin acentos, triggers, 7 vistas, 3 procedimientos y roles.
--   - Sección 13: Datos iniciales idempotentes (28 sedes, 13 bancos,
--     14 departamentos + 2 ramas, 102 puestos y 188 colaboradores reales).
-- ============================================================

-- ── 1. USUARIOS Y ROLES DE BD ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sifygsa_admin') THEN
    CREATE USER sifygsa_admin WITH PASSWORD 'CAMBIAR_EN_PROD' CREATEDB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sifygsa_migrator') THEN
    CREATE ROLE sifygsa_migrator NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sifygsa_app') THEN
    CREATE ROLE sifygsa_app NOLOGIN;
  END IF;
END;
$$;

-- ── 2. BASE DE DATOS ─────────────────────────────────────────
-- (Si la BD ya existe, comentar CREATE DATABASE y dejar únicamente \c sifygsa_erp)
CREATE DATABASE sifygsa_erp
  WITH OWNER    = sifygsa_admin
       ENCODING = 'UTF8'
       TEMPLATE = template0;

\c sifygsa_erp

-- ── 3. EXTENSIONES Y SCHEMAS ─────────────────────────────────
-- core          : Entidades transversales (empresas, sedes, RBAC, usuarios, sesiones)
-- rrhh          : Módulo de Recursos Humanos (plantilla, organigrama, expediente, SGI)
-- almacen       : (Reservado para módulo Almacén)
-- compras       : (Reservado para módulo Compras / Proveedores)
-- requisiciones : (Reservado para módulo Requisiciones)
-- crm           : (Reservado para módulo Comercial / Clientes)
-- finanzas      : (Reservado para módulo Finanzas / Nómina)
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- UUIDs seguros (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS unaccent;   -- Búsquedas insensibles a acentos
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- Índices GIN trigramas (< 2ms en 10k+ filas)

CREATE SCHEMA IF NOT EXISTS core          AUTHORIZATION sifygsa_admin;
CREATE SCHEMA IF NOT EXISTS rrhh          AUTHORIZATION sifygsa_admin;
CREATE SCHEMA IF NOT EXISTS almacen       AUTHORIZATION sifygsa_admin;
CREATE SCHEMA IF NOT EXISTS compras       AUTHORIZATION sifygsa_admin;
CREATE SCHEMA IF NOT EXISTS requisiciones AUTHORIZATION sifygsa_admin;
CREATE SCHEMA IF NOT EXISTS crm           AUTHORIZATION sifygsa_admin;
CREATE SCHEMA IF NOT EXISTS finanzas      AUTHORIZATION sifygsa_admin;

COMMENT ON SCHEMA core          IS 'Entidades transversales compartidas por toda la suite ERP/CRM SIFYGSA';
COMMENT ON SCHEMA rrhh          IS 'Módulo de Recursos Humanos: plantilla, organigrama, expedientes, vacaciones y SGI';
COMMENT ON SCHEMA almacen       IS 'Módulo de Almacén, inventarios y resguardos EPP (reservado)';
COMMENT ON SCHEMA compras       IS 'Módulo de Compras y Proveedores (reservado)';
COMMENT ON SCHEMA requisiciones IS 'Módulo de Requisiciones internas y aprobaciones (reservado)';
COMMENT ON SCHEMA crm           IS 'Módulo Comercial, Clientes, Cotizaciones y Proyectos (reservado)';
COMMENT ON SCHEMA finanzas      IS 'Módulo de Finanzas y Dispersión de Nómina (reservado)';

ALTER USER sifygsa_admin SET search_path TO rrhh, core, public;
SET search_path TO rrhh, core, public;

-- ════════════════════════════════════════════════════════════
-- 4. DOMINIOS — schema core
-- ════════════════════════════════════════════════════════════

-- ── Identificadores y claves ─────────────────────────────────────────────────
-- Dominio universal de llave primaria/foránea (anti-enumeración OWASP IDOR)
DO $$ BEGIN
  CREATE DOMAIN core.id_uuid AS UUID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.codigo_corto AS VARCHAR(20)
    CONSTRAINT ck_core_codigo_corto CHECK (VALUE ~ '^[A-Z0-9][A-Z0-9_-]{1,19}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.clave_sistema AS VARCHAR(40)
    CONSTRAINT ck_core_clave_sistema CHECK (VALUE ~ '^[A-Za-z0-9][A-Za-z0-9._-]{1,39}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Textos semánticos estandarizados ─────────────────────────────────────────
DO $$ BEGIN
  CREATE DOMAIN core.nombre_corto AS VARCHAR(80)
    CONSTRAINT ck_core_nombre_corto CHECK (LENGTH(TRIM(VALUE)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.nombre_entidad AS VARCHAR(120)
    CONSTRAINT ck_core_nombre_entidad CHECK (LENGTH(TRIM(VALUE)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.razon_social AS VARCHAR(180)
    CONSTRAINT ck_core_razon_social CHECK (LENGTH(TRIM(VALUE)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.descripcion AS VARCHAR(255);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.color_hex AS VARCHAR(20)
    CONSTRAINT ck_core_color_hex CHECK (VALUE ~ '^#[0-9A-Fa-f]{3,8}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Contacto y Domicilio (Estándar México) ───────────────────────────────────
DO $$ BEGIN
  CREATE DOMAIN core.correo_electronico AS VARCHAR(150)
    CONSTRAINT ck_core_correo CHECK (
      VALUE ~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.telefono_mx AS VARCHAR(15)
    CONSTRAINT ck_core_telefono_mx CHECK (
      regexp_replace(VALUE, '\D', '', 'g') ~ '^[0-9]{10}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.num_domicilio AS VARCHAR(20)
    CONSTRAINT ck_core_num_domicilio CHECK (VALUE ~ '^[A-Za-z0-9/\-\s.#]{1,20}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.codigo_postal_mx AS CHAR(5)
    CONSTRAINT ck_core_cp_mx CHECK (VALUE ~ '^[0-9]{5}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Identificadores Fiscales y Bancarios (México) ────────────────────────────
DO $$ BEGIN
  CREATE DOMAIN core.rfc_mx AS VARCHAR(13)
    CONSTRAINT ck_core_rfc_mx CHECK (
      VALUE ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.curp_mx AS CHAR(18)
    CONSTRAINT ck_core_curp_mx CHECK (
      VALUE ~ '^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9][0-9]$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.clabe_mx AS CHAR(18)
    CONSTRAINT ck_core_clabe_mx CHECK (VALUE ~ '^[0-9]{18}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Financieros / Numéricos ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE DOMAIN core.monto_mxn AS NUMERIC(12,2)
    CONSTRAINT ck_core_monto_mxn CHECK (VALUE >= 0.00);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.porcentaje AS NUMERIC(5,2)
    CONSTRAINT ck_core_porcentaje CHECK (VALUE >= 0.00 AND VALUE <= 100.00);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.nivel_jerarquico AS SMALLINT
    CONSTRAINT ck_core_nivel CHECK (VALUE BETWEEN 1 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Acceso y Seguridad ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE DOMAIN core.username_dom AS VARCHAR(40)
    CONSTRAINT ck_core_username CHECK (VALUE ~ '^[A-Za-z0-9._-]{3,40}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.pwd_hash AS VARCHAR(255)
    CONSTRAINT ck_core_pwd_hash CHECK (LENGTH(VALUE) >= 20);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.token_sha256 AS CHAR(64)
    CONSTRAINT ck_core_token_sha256 CHECK (VALUE ~ '^[A-Fa-f0-9]{64}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.url_ruta AS VARCHAR(150)
    CONSTRAINT ck_core_url_ruta CHECK (VALUE ~ '^/[A-Za-z0-9/_-]*$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN core.ip_addr AS VARCHAR(45);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════
-- 5. DOMINIOS — schema rrhh
-- ════════════════════════════════════════════════════════════

-- Folio corporativo inmutable: SFG-0001 .. SFG-999999 (soporta 10,000+ a 999,999 históricos)
DO $$ BEGIN
  CREATE DOMAIN rrhh.folio_empleado AS VARCHAR(12)
    CONSTRAINT ck_rrhh_folio_empleado CHECK (VALUE ~ '^SFG-[0-9]{4,6}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Folios de documentos/solicitudes (Vacaciones, Formatos SGI)
DO $$ BEGIN
  CREATE DOMAIN rrhh.folio_documento AS VARCHAR(30)
    CONSTRAINT ck_rrhh_folio_documento CHECK (VALUE ~ '^[A-Z0-9][A-Z0-9_-]{2,29}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sigla nemotécnica de departamento: DIR, ADM, RH, HSE-MIN, HSE-COM, GSAPE...
DO $$ BEGIN
  CREATE DOMAIN rrhh.codigo_departamento AS VARCHAR(15)
    CONSTRAINT ck_rrhh_codigo_depto CHECK (VALUE ~ '^[A-Z]{2,8}(-[A-Z0-9]{2,6})?$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Apellidos separados del colaborador (nombre_completo e iniciales se derivan en vistas)
DO $$ BEGIN
  CREATE DOMAIN rrhh.apellido_dom AS VARCHAR(60);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NSS (IMSS): exactamente 11 dígitos numéricos (admite entrada con o sin guiones)
DO $$ BEGIN
  CREATE DOMAIN rrhh.nss_mx AS VARCHAR(15)
    CONSTRAINT ck_rrhh_nss_mx CHECK (
      regexp_replace(VALUE, '\D', '', 'g') ~ '^[0-9]{11}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Número de tarjeta bancaria (16 dígitos)
DO $$ BEGIN
  CREATE DOMAIN rrhh.num_tarjeta_mx AS VARCHAR(19)
    CONSTRAINT ck_rrhh_num_tarjeta CHECK (
      regexp_replace(VALUE, '\D', '', 'g') ~ '^[0-9]{16}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Código SPEI bancario (3 a 10 dígitos)
DO $$ BEGIN
  CREATE DOMAIN rrhh.codigo_spei AS VARCHAR(10)
    CONSTRAINT ck_rrhh_codigo_spei CHECK (VALUE ~ '^[0-9]{3,10}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo sanguíneo oficial
DO $$ BEGIN
  CREATE DOMAIN rrhh.tipo_sangre AS VARCHAR(4)
    CONSTRAINT ck_rrhh_tipo_sangre CHECK (
      VALUE IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Talla de calzado MEX (ej. '27', '27.5') o 'No aplica'
DO $$ BEGIN
  CREATE DOMAIN rrhh.talla_calzado AS VARCHAR(15)
    CONSTRAINT ck_rrhh_talla_calzado CHECK (
      VALUE ~ '^[0-9]{2}(\.[05])?$' OR VALUE = 'No aplica'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Talla de overol EPP (catálogo estándar 'Talla 36 (CH)'..'Talla 48 (4XG)', 'XCH'..'4XG', 'No aplica' o medida libre limpia)
DO $$ BEGIN
  CREATE DOMAIN rrhh.talla_overol AS VARCHAR(35)
    CONSTRAINT ck_rrhh_talla_overol CHECK (
      LENGTH(TRIM(VALUE)) > 0
      AND VALUE ~ '^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ()\s./-]{1,35}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Catálogos cerrados / estatus laborales
DO $$ BEGIN
  CREATE DOMAIN rrhh.estatus_empleado AS VARCHAR(20)
    CONSTRAINT ck_rrhh_estatus_emp CHECK (
      VALUE IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'BAJA')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.estatus_csf AS VARCHAR(20)
    CONSTRAINT ck_rrhh_estatus_csf CHECK (
      VALUE IN ('VIGENTE', 'PENDIENTE', 'EN_REVISION', 'VENCIDA')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.estatus_solicitud AS VARCHAR(20)
    CONSTRAINT ck_rrhh_estatus_sol CHECK (
      VALUE IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'EN_PROCESO')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.tipo_movimiento AS VARCHAR(35)
    CONSTRAINT ck_rrhh_tipo_movimiento CHECK (
      VALUE IN (
        'ALTA', 'CAMBIO_DEPARTAMENTO', 'CAMBIO_PUESTO',
        'CAMBIO_SUELDO', 'CAMBIO_SUPERVISOR', 'BAJA', 'REINGRESO'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.tipo_festivo AS VARCHAR(30)
    CONSTRAINT ck_rrhh_tipo_festivo CHECK (
      VALUE IN ('OFICIAL_LFT', 'CORPORATIVO', 'CONMEMORATIVO')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extensión telefónica interna (2 a 6 dígitos)
DO $$ BEGIN
  CREATE DOMAIN rrhh.extension_tel AS VARCHAR(6)
    CONSTRAINT ck_rrhh_extension CHECK (VALUE ~ '^[0-9]{2,6}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Días hábiles de vacaciones solicitados y año de periodo
DO $$ BEGIN
  CREATE DOMAIN rrhh.dias_vacaciones AS SMALLINT
    CONSTRAINT ck_rrhh_dias_vacaciones CHECK (VALUE BETWEEN 1 AND 60);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.anio_laboral AS SMALLINT
    CONSTRAINT ck_rrhh_anio_laboral CHECK (VALUE BETWEEN 2000 AND 2100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Metadatos de archivos digitales y agenda
DO $$ BEGIN
  CREATE DOMAIN rrhh.mime_type_dom AS VARCHAR(100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.hora_texto_dom AS VARCHAR(20);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════
-- 6. TABLAS — schema core (8 tablas transversales)
-- ════════════════════════════════════════════════════════════

-- ── 1. Empresas / Subsidiarias (SIFYGSA, VIPSA, etc.) ────────────────────────
CREATE TABLE IF NOT EXISTS core.empresas (
  id_empresa      core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          core.codigo_corto NOT NULL UNIQUE,
  nombre_corto    core.nombre_corto NOT NULL UNIQUE,
  razon_social    core.razon_social NOT NULL,
  rfc             core.rfc_mx NULL UNIQUE,
  logo_url        TEXT NULL,
  es_principal    BOOLEAN NOT NULL DEFAULT FALSE,
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Sedes / Bases Operativas (Minatitlán, Comalcalco, Mapachapa...) ───────
CREATE TABLE IF NOT EXISTS core.sedes (
  id_sede         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa      core.id_uuid NOT NULL,
  codigo          core.codigo_corto NOT NULL UNIQUE,
  nombre          core.nombre_entidad NOT NULL UNIQUE, -- Ej. 'Minatitlán, Ver.'
  ciudad          core.nombre_corto NOT NULL,
  estado          core.nombre_corto NOT NULL,
  direccion       core.descripcion NULL,
  cp              core.codigo_postal_mx NULL,
  es_matriz       BOOLEAN NOT NULL DEFAULT FALSE,
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sedes_empresa FOREIGN KEY (id_empresa)
    REFERENCES core.empresas(id_empresa)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_core_sedes_empresa ON core.sedes(id_empresa);

-- ── 3. Control de Acceso Basado en Roles (RBAC) ──────────────────────────────
CREATE TABLE IF NOT EXISTS core.modulos (
  id_modulo       core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          core.codigo_corto NOT NULL UNIQUE,
  nombre          core.nombre_corto NOT NULL,
  descripcion     core.descripcion NULL,
  orden           SMALLINT NOT NULL DEFAULT 0,
  activo          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS core.submodulos (
  id_submodulo    core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_modulo       core.id_uuid NOT NULL,
  codigo          core.clave_sistema NOT NULL UNIQUE,
  nombre          core.nombre_corto NOT NULL,
  ruta_url        core.url_ruta NOT NULL UNIQUE,
  descripcion     core.descripcion NULL,
  orden           SMALLINT NOT NULL DEFAULT 0,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_submodulos_modulo FOREIGN KEY (id_modulo)
    REFERENCES core.modulos(id_modulo)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_core_submodulos_modulo ON core.submodulos(id_modulo);

CREATE TABLE IF NOT EXISTS core.roles (
  id_rol          core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          core.clave_sistema NOT NULL UNIQUE,
  nombre          core.nombre_corto NOT NULL,
  descripcion     core.descripcion NULL,
  nivel_acceso    core.nivel_jerarquico NOT NULL DEFAULT 1,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.rol_permisos (
  id_rol          core.id_uuid NOT NULL,
  id_submodulo    core.id_uuid NOT NULL,
  puede_ver       BOOLEAN NOT NULL DEFAULT FALSE,
  puede_crear     BOOLEAN NOT NULL DEFAULT FALSE,
  puede_editar    BOOLEAN NOT NULL DEFAULT FALSE,
  puede_eliminar  BOOLEAN NOT NULL DEFAULT FALSE,
  puede_exportar  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_rol, id_submodulo),
  CONSTRAINT fk_rp_rol FOREIGN KEY (id_rol)
    REFERENCES core.roles(id_rol)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_rp_submodulo FOREIGN KEY (id_submodulo)
    REFERENCES core.submodulos(id_submodulo)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- ── 4. Usuarios del Sistema y Sesiones ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.usuarios (
  id_usuario      core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rol          core.id_uuid NOT NULL,
  id_empleado     core.id_uuid NULL UNIQUE,
  username        core.username_dom NOT NULL UNIQUE,
  correo          core.correo_electronico NOT NULL UNIQUE,
  password_hash   core.pwd_hash NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso   TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol)
    REFERENCES core.roles(id_rol)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_core_usuarios_rol ON core.usuarios(id_rol);

CREATE TABLE IF NOT EXISTS core.sesiones (
  id_sesion       core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario      core.id_uuid NOT NULL,
  token_hash      core.token_sha256 NOT NULL UNIQUE,
  ip_origen       core.ip_addr NULL,
  user_agent      core.descripcion NULL,
  expira_en       TIMESTAMPTZ NOT NULL,
  revocada        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (id_usuario)
    REFERENCES core.usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_sesiones_usuario ON core.sesiones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_core_sesiones_expira  ON core.sesiones(expira_en) WHERE revocada = FALSE;

-- ════════════════════════════════════════════════════════════
-- 7. TABLAS — schema rrhh (15 tablas en 3FN sin datos derivados)
-- ════════════════════════════════════════════════════════════

-- ── 1. Control Atómico de Folios (evita colisiones bajo alta concurrencia) ───
CREATE TABLE IF NOT EXISTS rrhh.control_folios (
  entidad         core.clave_sistema PRIMARY KEY, -- 'EMPLEADO', 'VACACION', 'SGI'
  prefijo         core.codigo_corto NOT NULL,     -- 'SFG', 'VAC', 'SGI'
  ultimo_numero   INTEGER NOT NULL DEFAULT 0 CHECK (ultimo_numero >= 0),
  longitud_min    SMALLINT NOT NULL DEFAULT 4 CHECK (longitud_min BETWEEN 3 AND 8),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Catálogos Base de RRHH (Bancos, Tipos de Contrato) ────────────────────
CREATE TABLE IF NOT EXISTS rrhh.cat_bancos (
  id_banco        core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_spei     rrhh.codigo_spei NULL UNIQUE,
  nombre          core.nombre_corto NOT NULL UNIQUE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rrhh.cat_tipos_contrato (
  id_tipo_contrato  core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo            core.codigo_corto NOT NULL UNIQUE,
  nombre            core.nombre_corto NOT NULL UNIQUE,
  requiere_vigencia BOOLEAN NOT NULL DEFAULT FALSE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── 3. Departamentos y Ramas Organizacionales (DIR..GSAPE + subramas) ────────
CREATE TABLE IF NOT EXISTS rrhh.departamentos (
  id_departamento core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa      core.id_uuid NOT NULL,
  id_sede         core.id_uuid NULL,
  id_depto_padre  core.id_uuid NULL, -- Ej. Capacitación -> Recursos Humanos
  codigo          rrhh.codigo_departamento NOT NULL UNIQUE,
  nombre          core.nombre_entidad NOT NULL,
  descripcion     core.descripcion NULL,
  id_responsable  core.id_uuid NULL, -- FK diferida hacia rrhh.empleados(id_empleado)
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_depto_empresa FOREIGN KEY (id_empresa)
    REFERENCES core.empresas(id_empresa)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_depto_sede FOREIGN KEY (id_sede)
    REFERENCES core.sedes(id_sede)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_depto_padre FOREIGN KEY (id_depto_padre)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 4. Catálogo Normalizado de Puestos (evita repetir texto en empleados) ────
CREATE TABLE IF NOT EXISTS rrhh.cat_puestos (
  id_puesto        core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_departamento  core.id_uuid NULL,
  nombre           core.nombre_entidad NOT NULL UNIQUE,
  categoria        core.nombre_corto NULL,
  nivel_jerarquico core.nivel_jerarquico NOT NULL DEFAULT 5,
  sueldo_base_min  core.monto_mxn NULL,
  sueldo_base_max  core.monto_mxn NULL,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_puesto_depto FOREIGN KEY (id_departamento)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_puesto_rango_sueldo CHECK (
    sueldo_base_min IS NULL OR sueldo_base_max IS NULL OR sueldo_base_max >= sueldo_base_min
  )
);

-- ── 5. Empleados (Núcleo del ERP — Ordenado por Etapas 1..4 + CSF) ───────────
CREATE TABLE IF NOT EXISTS rrhh.empleados (
  id_empleado           core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── ETAPA 1: Datos Personales & Identificación Oficial ─────────────────────
  folio                 rrhh.folio_empleado NOT NULL UNIQUE,          -- [OBLIGATORIO] Autogenerado SFG-XXXX (inmutable)
  nombre_pila           core.nombre_corto NOT NULL,                   -- [OBLIGATORIO]
  apellido_paterno      rrhh.apellido_dom NOT NULL DEFAULT '',        -- [OBLIGATORIO ALTA]
  apellido_materno      rrhh.apellido_dom NOT NULL DEFAULT '',        -- [OPCIONAL]
  rfc                   core.rfc_mx NULL,                             -- [OBLIGATORIO ALTA] Único parcial en activos
  curp                  core.curp_mx NULL,                            -- [OBLIGATORIO ALTA] Único parcial en activos
  nss                   rrhh.nss_mx NULL,                             -- [OBLIGATORIO ALTA] Único parcial en activos
  fecha_nacimiento      DATE NULL,                                    -- [OPCIONAL] Auto-completada desde CURP si viene NULL
  foto_url              TEXT NULL,                                    -- [OPCIONAL] Requerida para 100% de expediente
  notas_contratacion    TEXT NULL,                                    -- [OPCIONAL]

  -- ── ETAPA 2: Datos Laborales & Adscripción Organizacional ──────────────────
  id_empresa            core.id_uuid NOT NULL,                        -- [OBLIGATORIO] FK core.empresas
  id_departamento       core.id_uuid NOT NULL,                        -- [OBLIGATORIO] FK rrhh.departamentos
  id_sede               core.id_uuid NULL,                            -- [OPCIONAL]    FK core.sedes (base/localidad normalizada)
  id_puesto             core.id_uuid NOT NULL,                        -- [OBLIGATORIO] FK rrhh.cat_puestos
  categoria_laboral     core.nombre_corto NULL,                       -- [OBLIGATORIO ALTA] Ej. Ingeniería, Administrativo...
  id_supervisor         core.id_uuid NULL,                            -- [OPCIONAL]    Auto-FK para Organigrama Corporativo
  id_tipo_contrato      core.id_uuid NULL,                            -- [OBLIGATORIO ALTA] FK rrhh.cat_tipos_contrato
  sueldo_mensual_bruto  core.monto_mxn NULL,                          -- [OBLIGATORIO ALTA]
  proyecto_asignado     core.nombre_entidad NULL,                     -- [OPCIONAL]
  fecha_ingreso         DATE NOT NULL DEFAULT CURRENT_DATE,           -- [OBLIGATORIO]
  fecha_fin_contrato    DATE NULL,                                    -- [OPCIONAL] Solo contratos con vigencia
  fecha_baja            DATE NULL,                                    -- [OPCIONAL] Solo al aplicar baja
  estatus               rrhh.estatus_empleado NOT NULL DEFAULT 'ACTIVO', -- [OBLIGATORIO]
  acreditacion_sil      core.nombre_corto NOT NULL DEFAULT 'En Trámite', -- [OPERATIVO] Estado SIL-3 / DC-3

  -- ── ETAPA 3: Contacto, Domicilio Estructurado & Emergencia ─────────────────
  telefono_celular      core.telefono_mx NULL,                        -- [OBLIGATORIO ALTA]
  telefono_fijo         core.telefono_mx NULL,                        -- [OPCIONAL]
  correo_personal       core.correo_electronico NULL,                 -- [OBLIGATORIO ALTA]
  correo_corporativo    core.correo_electronico NULL,                 -- [OPCIONAL]
  extension_oficina     rrhh.extension_tel NULL,                      -- [OPCIONAL]
  calle                 core.nombre_entidad NULL,                     -- [OBLIGATORIO ALTA]
  numero_exterior       core.num_domicilio NULL,                      -- [OBLIGATORIO ALTA]
  numero_interior       core.num_domicilio NULL,                      -- [OPCIONAL]
  codigo_postal         core.codigo_postal_mx NULL,                   -- [OBLIGATORIO ALTA]
  colonia               core.nombre_entidad NULL,                     -- [OBLIGATORIO ALTA]
  municipio             core.nombre_corto NULL,                       -- [OBLIGATORIO ALTA]
  estado_domicilio      core.nombre_corto NULL,                       -- [OBLIGATORIO ALTA]
  emergencia_nombre     core.nombre_entidad NULL,                     -- [OBLIGATORIO ALTA]
  emergencia_parentesco core.nombre_corto NULL,                       -- [OPCIONAL]
  emergencia_telefono   core.telefono_mx NULL,                        -- [OBLIGATORIO ALTA]

  -- ── ETAPA 4: Salud & Uniformes EPP ─────────────────────────────────────────
  tipo_sangre           rrhh.tipo_sangre NULL,                        -- [OBLIGATORIO ALTA]
  talla_calzado_mex     rrhh.talla_calzado NULL,                      -- [OPCIONAL]
  talla_overol          rrhh.talla_overol NULL,                       -- [OPCIONAL]
  discapacidad          core.descripcion NULL,                        -- [OPCIONAL]
  padecimientos         TEXT NULL,                                    -- [OPCIONAL]
  alergias              TEXT NULL,                                    -- [OPCIONAL]

  -- ── ETAPA 6 (Control Fiscal Rápido) & Auditoría ────────────────────────────
  estatus_csf           rrhh.estatus_csf NOT NULL DEFAULT 'PENDIENTE',-- [OPERATIVO] Vigencia Constancia Fiscal SAT
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ NULL,

  CONSTRAINT fk_emp_empresa FOREIGN KEY (id_empresa)
    REFERENCES core.empresas(id_empresa)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_emp_departamento FOREIGN KEY (id_departamento)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_emp_sede FOREIGN KEY (id_sede)
    REFERENCES core.sedes(id_sede)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_emp_puesto FOREIGN KEY (id_puesto)
    REFERENCES rrhh.cat_puestos(id_puesto)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_emp_contrato FOREIGN KEY (id_tipo_contrato)
    REFERENCES rrhh.cat_tipos_contrato(id_tipo_contrato)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_emp_supervisor FOREIGN KEY (id_supervisor)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_emp_no_autosupervisor CHECK (id_supervisor IS NULL OR id_supervisor <> id_empleado),
  CONSTRAINT ck_emp_fechas_baja CHECK (fecha_baja IS NULL OR fecha_baja >= fecha_ingreso),
  CONSTRAINT ck_emp_fechas_contrato CHECK (fecha_fin_contrato IS NULL OR fecha_fin_contrato >= fecha_ingreso)
);

-- Enlaces diferidos que referencian rrhh.empleados
DO $$ BEGIN
  ALTER TABLE rrhh.departamentos
    ADD CONSTRAINT fk_depto_responsable FOREIGN KEY (id_responsable)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE core.usuarios
    ADD CONSTRAINT fk_usuarios_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. Historial de Movimientos Laborales (Append-Only / Inmutable) ──────────
CREATE TABLE IF NOT EXISTS rrhh.historial_movimientos (
  id_movimiento        core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NOT NULL,
  tipo_movimiento      rrhh.tipo_movimiento NOT NULL,
  id_depto_anterior    core.id_uuid NULL,
  id_depto_nuevo       core.id_uuid NULL,
  id_puesto_anterior   core.id_uuid NULL,
  id_puesto_nuevo      core.id_uuid NULL,
  sueldo_anterior      core.monto_mxn NULL,
  sueldo_nuevo         core.monto_mxn NULL,
  motivo               core.descripcion NULL,
  realizado_por        core.nombre_corto NOT NULL DEFAULT CURRENT_USER,
  fecha_efecto         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_hm_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_hm_depto_ant FOREIGN KEY (id_depto_anterior)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_hm_depto_nvo FOREIGN KEY (id_depto_nuevo)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_hm_puesto_ant FOREIGN KEY (id_puesto_anterior)
    REFERENCES rrhh.cat_puestos(id_puesto)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_hm_puesto_nvo FOREIGN KEY (id_puesto_nuevo)
    REFERENCES rrhh.cat_puestos(id_puesto)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 7. ETAPA 5: Nómina / Cuentas Bancarias (100% normalizado vía id_banco) ──
CREATE TABLE IF NOT EXISTS rrhh.cuentas_bancarias (
  id_cuenta            core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NOT NULL,
  id_banco             core.id_uuid NOT NULL,                         -- [OBLIGATORIO] FK rrhh.cat_bancos (sin banco_nombre redundante)
  alias                core.nombre_corto NOT NULL DEFAULT 'Nómina',   -- [OPCIONAL]
  clabe                core.clabe_mx NULL,                            -- [OBLIGATORIO ALTA] 18 dígitos
  numero_tarjeta       rrhh.num_tarjeta_mx NULL,                      -- [OPCIONAL] 16 dígitos
  es_principal         BOOLEAN NOT NULL DEFAULT TRUE,
  activa               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_cb_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cb_banco FOREIGN KEY (id_banco)
    REFERENCES rrhh.cat_bancos(id_banco)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_cb_dato_pago CHECK (clabe IS NOT NULL OR numero_tarjeta IS NOT NULL)
);

-- ── 8. ETAPA 6: Expediente Digital por Subcarpetas (normalizado vía id_carpeta)
CREATE TABLE IF NOT EXISTS rrhh.carpetas_expediente (
  id_carpeta           core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NULL, -- NULL = carpeta estándar global del sistema
  nombre               core.nombre_corto NOT NULL,
  es_sistema           BOOLEAN NOT NULL DEFAULT FALSE,
  orden                SMALLINT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ce_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rrhh.documentos_expediente (
  id_documento         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NOT NULL,
  id_carpeta           core.id_uuid NOT NULL,                         -- [OBLIGATORIO] FK rrhh.carpetas_expediente (sin carpeta_nombre redundante)
  categoria            core.nombre_corto NOT NULL,                    -- Ej. 'Constancia Fiscal (SAT)', 'Certificación Técnica / DC-3'
  titulo               core.razon_social NOT NULL,
  emisor               core.nombre_entidad NULL,
  fecha_emision        DATE NULL,
  fecha_vencimiento    DATE NULL,
  nombre_archivo       core.descripcion NULL,
  mime_type            rrhh.mime_type_dom NULL,
  tamano_bytes         INTEGER NULL CHECK (tamano_bytes IS NULL OR tamano_bytes >= 0),
  storage_url          TEXT NULL,
  enlace_externo       TEXT NULL,
  verificado           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_doc_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_doc_carpeta FOREIGN KEY (id_carpeta)
    REFERENCES rrhh.carpetas_expediente(id_carpeta)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_doc_fechas CHECK (
    fecha_emision IS NULL OR fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_emision
  )
);

-- ── 9. Directorio de Extensiones Telefónicas (normalizado vía FK empleado) ───
CREATE TABLE IF NOT EXISTS rrhh.extensiones_telefonicas (
  id_extension         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension            rrhh.extension_tel NOT NULL UNIQUE,
  etiqueta_area        core.nombre_entidad NOT NULL,                  -- Describe el área o sala (ej. 'Dirección General', 'Almacén Mapachapa')
  id_departamento      core.id_uuid NOT NULL,
  id_sede              core.id_uuid NULL,
  id_empleado_asignado core.id_uuid NULL,                             -- [OPCIONAL] FK rrhh.empleados (sin asignado_texto redundante)
  es_principal_depto   BOOLEAN NOT NULL DEFAULT FALSE,
  activa               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ext_depto FOREIGN KEY (id_departamento)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ext_sede FOREIGN KEY (id_sede)
    REFERENCES core.sedes(id_sede)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_ext_empleado FOREIGN KEY (id_empleado_asignado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 10. Vacaciones (Formato SGI-FR-RH-07 / LFT México) ───────────────────────
CREATE TABLE IF NOT EXISTS rrhh.vacaciones_solicitudes (
  id_solicitud         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_solicitud      rrhh.folio_documento NOT NULL UNIQUE,
  id_empleado          core.id_uuid NOT NULL,
  id_aprobador         core.id_uuid NULL,
  fecha_inicio         DATE NOT NULL,
  fecha_fin            DATE NOT NULL,
  dias_solicitados     rrhh.dias_vacaciones NOT NULL,                 -- Días hábiles efectivos (descuenta domingos y festivos LFT)
  periodo_anual        rrhh.anio_laboral NOT NULL,
  estatus              rrhh.estatus_solicitud NOT NULL DEFAULT 'PENDIENTE',
  comentarios          TEXT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_vac_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vac_aprobador FOREIGN KEY (id_aprobador)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_vac_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT ck_vac_dias_rango CHECK (dias_solicitados <= (fecha_fin - fecha_inicio + 1))
);

-- ── 11. Formatos SGI (Requisiciones, Capacitaciones, Vales de No Adeudo) ─────
CREATE TABLE IF NOT EXISTS rrhh.formatos_sgi (
  id_formato           core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_sgi            rrhh.folio_documento NOT NULL UNIQUE,
  codigo_formato       rrhh.folio_documento NOT NULL,
  id_empleado          core.id_uuid NULL,
  id_departamento      core.id_uuid NULL,
  estatus              rrhh.estatus_solicitud NOT NULL DEFAULT 'PENDIENTE',
  datos_formato        JSONB NOT NULL DEFAULT '{}'::jsonb,
  emitido_por          core.nombre_entidad NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sgi_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_sgi_depto FOREIGN KEY (id_departamento)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 12. Días Festivos y Agenda Operativa Semanal RRHH ────────────────────────
CREATE TABLE IF NOT EXISTS rrhh.dias_festivos (
  id_festivo              core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha                   DATE NOT NULL UNIQUE,
  nombre                  core.nombre_entidad NOT NULL,
  tipo                    rrhh.tipo_festivo NOT NULL DEFAULT 'OFICIAL_LFT',
  es_descanso_obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
  descripcion             core.descripcion NULL
);

CREATE TABLE IF NOT EXISTS rrhh.agenda_actividades (
  id_actividad         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha                DATE NOT NULL,
  hora_texto           rrhh.hora_texto_dom NULL,
  titulo               core.razon_social NOT NULL,
  categoria            core.nombre_corto NOT NULL DEFAULT 'Operativo',
  id_responsable       core.id_uuid NULL,
  completada           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ag_responsable FOREIGN KEY (id_responsable)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ════════════════════════════════════════════════════════════
-- 8. FUNCIONES DE BÚSQUEDA E ÍNDICES — schema rrhh / core
-- ════════════════════════════════════════════════════════════

-- ── 0. Helpers IMMUTABLE para índices funcionales sin acentos ni mayúsculas ──
CREATE OR REPLACE FUNCTION rrhh.fn_normalizar_busqueda(p_texto TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT LOWER(TRIM(regexp_replace(public.unaccent(COALESCE(p_texto, '')), '\s+', ' ', 'g')));
$$;

CREATE OR REPLACE FUNCTION rrhh.fn_nombre_completo(
  p_nombre TEXT,
  p_paterno TEXT,
  p_materno TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT TRIM(CONCAT_WS(' ', NULLIF(TRIM(COALESCE(p_nombre, '')), ''), NULLIF(TRIM(COALESCE(p_paterno, '')), ''), NULLIF(TRIM(COALESCE(p_materno, '')), '')));
$$;

-- ── 1. Llaves únicas parciales en empleados activos (no bloquean bajas históricas)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_emp_rfc_activo
  ON rrhh.empleados (UPPER(rfc))
  WHERE rfc IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_emp_curp_activo
  ON rrhh.empleados (UPPER(curp))
  WHERE curp IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_emp_nss_activo
  ON rrhh.empleados (regexp_replace(nss, '\D', '', 'g'))
  WHERE nss IS NOT NULL AND deleted_at IS NULL;

-- Unicidad insensible a mayúsculas y acentos en catálogos clave (evita "Minatitlan" vs "Minatitlán")
CREATE UNIQUE INDEX IF NOT EXISTS uq_core_sedes_nombre_norm
  ON core.sedes (rrhh.fn_normalizar_busqueda(nombre));

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_puestos_nombre_norm
  ON rrhh.cat_puestos (rrhh.fn_normalizar_busqueda(nombre));

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_bancos_nombre_norm
  ON rrhh.cat_bancos (rrhh.fn_normalizar_busqueda(nombre));

-- ── 2. Índices relacionales B-Tree (Joins de Directorio, Organigrama y Filtros)
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_departamento ON rrhh.empleados (id_departamento) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_puesto       ON rrhh.empleados (id_puesto)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_sede         ON rrhh.empleados (id_sede)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_supervisor   ON rrhh.empleados (id_supervisor)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_estatus      ON rrhh.empleados (estatus)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_contrato_fin ON rrhh.empleados (fecha_fin_contrato)
  WHERE estatus = 'ACTIVO' AND fecha_fin_contrato IS NOT NULL;

-- Consultas exactas por nombre / apellidos sin acentos ni mayúsculas
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_nombre_pila      ON rrhh.empleados (rrhh.fn_normalizar_busqueda(nombre_pila));
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_apellido_paterno ON rrhh.empleados (rrhh.fn_normalizar_busqueda(apellido_paterno));
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_apellido_materno ON rrhh.empleados (rrhh.fn_normalizar_busqueda(apellido_materno));

-- ── 3. Índices GIN pg_trgm sobre texto normalizado (búsqueda sin acentos < 2ms)
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_nombre_trgm
  ON rrhh.empleados
  USING gin (rrhh.fn_normalizar_busqueda(rrhh.fn_nombre_completo(nombre_pila, apellido_paterno, apellido_materno)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_rrhh_puesto_nombre_trgm
  ON rrhh.cat_puestos
  USING gin (rrhh.fn_normalizar_busqueda(nombre) gin_trgm_ops);

-- ── 4. Índice funcional para módulo de Cumpleaños del Mes ────────────────────
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_cumpleanos_mes_dia
  ON rrhh.empleados (EXTRACT(MONTH FROM fecha_nacimiento), EXTRACT(DAY FROM fecha_nacimiento))
  WHERE estatus = 'ACTIVO' AND fecha_nacimiento IS NOT NULL;

-- ── 5. Índices en tablas satélite (Historial, Nómina, Expediente, Vacaciones, SGI)
CREATE INDEX IF NOT EXISTS idx_rrhh_hm_empleado_fecha  ON rrhh.historial_movimientos (id_empleado, fecha_efecto DESC);
CREATE INDEX IF NOT EXISTS idx_rrhh_cb_empleado        ON rrhh.cuentas_bancarias (id_empleado);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_cb_principal ON rrhh.cuentas_bancarias (id_empleado)
  WHERE es_principal = TRUE AND activa = TRUE;

CREATE INDEX IF NOT EXISTS idx_rrhh_doc_empleado_carp  ON rrhh.documentos_expediente (id_empleado, id_carpeta);
CREATE INDEX IF NOT EXISTS idx_rrhh_doc_vencimiento    ON rrhh.documentos_expediente (fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_carpeta_sistema
  ON rrhh.carpetas_expediente (LOWER(nombre))
  WHERE id_empleado IS NULL;

CREATE INDEX IF NOT EXISTS idx_rrhh_ext_departamento   ON rrhh.extensiones_telefonicas (id_departamento);
CREATE INDEX IF NOT EXISTS idx_rrhh_ext_empleado       ON rrhh.extensiones_telefonicas (id_empleado_asignado)
  WHERE id_empleado_asignado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_vac_empleado       ON rrhh.vacaciones_solicitudes (id_empleado, fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_rrhh_vac_estatus        ON rrhh.vacaciones_solicitudes (estatus);
CREATE INDEX IF NOT EXISTS idx_rrhh_sgi_codigo_estatus ON rrhh.formatos_sgi (codigo_formato, estatus);
CREATE INDEX IF NOT EXISTS idx_rrhh_sgi_datos_gin      ON rrhh.formatos_sgi USING gin (datos_formato);
CREATE INDEX IF NOT EXISTS idx_rrhh_agenda_fecha       ON rrhh.agenda_actividades (fecha, completada);

-- ════════════════════════════════════════════════════════════
-- 9. FUNCIONES DE NEGOCIO Y TRIGGERS — schema rrhh
-- ════════════════════════════════════════════════════════════

-- ── 1. Función genérica de timestamp updated_at ──────────────────────────────
CREATE OR REPLACE FUNCTION rrhh.tgfn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ── 2. Generador atómico de folios inmutables SFG-0001 .. SFG-999999 ─────────
CREATE OR REPLACE FUNCTION rrhh.fn_siguiente_folio(p_entidad VARCHAR DEFAULT 'EMPLEADO')
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefijo  VARCHAR(10);
  v_numero   INTEGER;
  v_long_min SMALLINT;
BEGIN
  -- Bloqueo a nivel de fila (evita folios duplicados en alta concurrencia)
  UPDATE rrhh.control_folios
     SET ultimo_numero = ultimo_numero + 1,
         updated_at    = NOW()
   WHERE entidad = p_entidad
   RETURNING prefijo, ultimo_numero, longitud_min
        INTO v_prefijo, v_numero, v_long_min;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entidad de folio "%" no inicializada en rrhh.control_folios', p_entidad;
  END IF;

  -- Escala automáticamente de 4 dígitos (SFG-9999) a 5-6 dígitos (SFG-10000) sin truncar
  RETURN v_prefijo || '-' || LPAD(v_numero::TEXT, GREATEST(v_long_min, LENGTH(v_numero::TEXT)), '0');
END;
$$;

-- ── 3. Sincronizar contador después de cargas masivas / seeds ────────────────
CREATE OR REPLACE FUNCTION rrhh.fn_sincronizar_folio_empleados()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(folio FROM '[0-9]+$') AS INTEGER)),
    0
  )
  INTO v_max
  FROM rrhh.empleados;

  INSERT INTO rrhh.control_folios (entidad, prefijo, ultimo_numero, longitud_min)
  VALUES ('EMPLEADO', 'SFG', v_max, 4)
  ON CONFLICT (entidad) DO UPDATE
    SET ultimo_numero = GREATEST(rrhh.control_folios.ultimo_numero, EXCLUDED.ultimo_numero),
        updated_at    = NOW();

  RETURN v_max;
END;
$$;

-- ── 4. Validación anti-ciclos en el Organigrama (evita A -> B -> A) ──────────
CREATE OR REPLACE FUNCTION rrhh.fn_validar_ciclo_organigrama(
  p_id_empleado   core.id_uuid,
  p_id_supervisor core.id_uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_hay_ciclo BOOLEAN := FALSE;
BEGIN
  IF p_id_supervisor IS NULL THEN
    RETURN TRUE;
  END IF;

  IF p_id_empleado = p_id_supervisor THEN
    RETURN FALSE;
  END IF;

  WITH RECURSIVE cadena_superior AS (
    SELECT e.id_empleado, e.id_supervisor, 1 AS nivel
      FROM rrhh.empleados e
     WHERE e.id_empleado = p_id_supervisor
    UNION ALL
    SELECT sup.id_empleado, sup.id_supervisor, cs.nivel + 1
      FROM rrhh.empleados sup
      JOIN cadena_superior cs ON sup.id_empleado = cs.id_supervisor
     WHERE cs.id_supervisor IS NOT NULL
       AND cs.nivel < 25
  )
  SELECT EXISTS (
    SELECT 1 FROM cadena_superior WHERE id_supervisor = p_id_empleado
  ) INTO v_hay_ciclo;

  RETURN NOT v_hay_ciclo;
END;
$$;

-- ── 5. Helper: extraer fecha de nacimiento desde CURP válida (regla RENAPO) ──
CREATE OR REPLACE FUNCTION rrhh.fn_fecha_nacimiento_desde_curp(p_curp TEXT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean TEXT := UPPER(TRIM(COALESCE(p_curp, '')));
  v_yy    INTEGER;
  v_mm    INTEGER;
  v_dd    INTEGER;
  v_siglo CHAR(1);
  v_anio  INTEGER;
BEGIN
  IF v_clean !~ '^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9][0-9]$' THEN
    RETURN NULL;
  END IF;

  v_yy    := SUBSTRING(v_clean FROM 5 FOR 2)::INTEGER;
  v_mm    := SUBSTRING(v_clean FROM 7 FOR 2)::INTEGER;
  v_dd    := SUBSTRING(v_clean FROM 9 FOR 2)::INTEGER;
  v_siglo := SUBSTRING(v_clean FROM 17 FOR 1);
  v_anio  := CASE WHEN v_siglo ~ '^[0-9]$' THEN 1900 + v_yy ELSE 2000 + v_yy END;

  RETURN make_date(v_anio, v_mm, v_dd);
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- ── 6. Trigger de normalización previa en rrhh.empleados ─────────────────────
CREATE OR REPLACE FUNCTION rrhh.tgfn_normalizar_empleado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Asignar folio corporativo SFG-XXXX automáticamente si viene nulo
  IF NEW.folio IS NULL OR TRIM(NEW.folio) = '' THEN
    NEW.folio := rrhh.fn_siguiente_folio('EMPLEADO')::rrhh.folio_empleado;
  END IF;

  -- Limpiar espacios redundantes en nombres separados
  NEW.nombre_pila      := TRIM(regexp_replace(COALESCE(NEW.nombre_pila, ''), '\s+', ' ', 'g'));
  NEW.apellido_paterno := TRIM(regexp_replace(COALESCE(NEW.apellido_paterno, ''), '\s+', ' ', 'g'));
  NEW.apellido_materno := TRIM(regexp_replace(COALESCE(NEW.apellido_materno, ''), '\s+', ' ', 'g'));

  -- Estandarizar fiscales y correos
  IF NEW.rfc IS NOT NULL THEN
    NEW.rfc := UPPER(TRIM(NEW.rfc))::core.rfc_mx;
  END IF;

  IF NEW.curp IS NOT NULL THEN
    NEW.curp := UPPER(TRIM(NEW.curp))::core.curp_mx;
    IF NEW.fecha_nacimiento IS NULL THEN
      NEW.fecha_nacimiento := rrhh.fn_fecha_nacimiento_desde_curp(NEW.curp);
    END IF;
  END IF;

  IF NEW.nss IS NOT NULL THEN
    NEW.nss := regexp_replace(NEW.nss, '\D', '', 'g')::rrhh.nss_mx;
  END IF;

  IF NEW.correo_corporativo IS NOT NULL THEN
    NEW.correo_corporativo := LOWER(TRIM(NEW.correo_corporativo))::core.correo_electronico;
  END IF;

  IF NEW.correo_personal IS NOT NULL THEN
    NEW.correo_personal := LOWER(TRIM(NEW.correo_personal))::core.correo_electronico;
  END IF;

  -- Evitar ciclos en el organigrama
  IF NEW.id_supervisor IS NOT NULL AND NOT rrhh.fn_validar_ciclo_organigrama(NEW.id_empleado, NEW.id_supervisor) THEN
    RAISE EXCEPTION 'Asignación rechazada: genera un ciclo jerárquico en el organigrama para %', NEW.folio;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_rrhh_empleados_normalizar ON rrhh.empleados;
CREATE TRIGGER tr_rrhh_empleados_normalizar
BEFORE INSERT OR UPDATE ON rrhh.empleados
FOR EACH ROW
EXECUTE FUNCTION rrhh.tgfn_normalizar_empleado();

-- ── 7. Trigger automático de trazabilidad laboral (append-only) ──────────────
CREATE OR REPLACE FUNCTION rrhh.tgfn_auditar_movimiento_laboral()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario core.nombre_corto;
  v_motivo  core.descripcion;
BEGIN
  v_usuario := COALESCE(
    NULLIF(TRIM(current_setting('app.usuario_actual', TRUE)), ''),
    CURRENT_USER
  )::core.nombre_corto;

  v_motivo := NULLIF(TRIM(current_setting('app.motivo_movimiento', TRUE)), '')::core.descripcion;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO rrhh.historial_movimientos (
      id_empleado, tipo_movimiento, id_depto_nuevo, id_puesto_nuevo, sueldo_nuevo,
      motivo, realizado_por, fecha_efecto
    ) VALUES (
      NEW.id_empleado, 'ALTA', NEW.id_departamento, NEW.id_puesto, NEW.sueldo_mensual_bruto,
      COALESCE(v_motivo, 'Alta inicial en Directorio de Personal'), v_usuario, NEW.fecha_ingreso
    );
    RETURN NEW;
  END IF;

  IF NEW.id_departamento IS DISTINCT FROM OLD.id_departamento THEN
    INSERT INTO rrhh.historial_movimientos (
      id_empleado, tipo_movimiento, id_depto_anterior, id_depto_nuevo, motivo, realizado_por
    ) VALUES (
      NEW.id_empleado, 'CAMBIO_DEPARTAMENTO', OLD.id_departamento, NEW.id_departamento,
      COALESCE(v_motivo, 'Transferencia organizacional (folio inmutable conservado)'), v_usuario
    );
  END IF;

  IF NEW.id_puesto IS DISTINCT FROM OLD.id_puesto THEN
    INSERT INTO rrhh.historial_movimientos (
      id_empleado, tipo_movimiento, id_puesto_anterior, id_puesto_nuevo, motivo, realizado_por
    ) VALUES (
      NEW.id_empleado, 'CAMBIO_PUESTO', OLD.id_puesto, NEW.id_puesto,
      COALESCE(v_motivo, 'Actualización de puesto'), v_usuario
    );
  END IF;

  IF NEW.sueldo_mensual_bruto IS DISTINCT FROM OLD.sueldo_mensual_bruto THEN
    INSERT INTO rrhh.historial_movimientos (
      id_empleado, tipo_movimiento, sueldo_anterior, sueldo_nuevo, motivo, realizado_por
    ) VALUES (
      NEW.id_empleado, 'CAMBIO_SUELDO', OLD.sueldo_mensual_bruto, NEW.sueldo_mensual_bruto,
      COALESCE(v_motivo, 'Ajuste salarial'), v_usuario
    );
  END IF;

  IF NEW.estatus IS DISTINCT FROM OLD.estatus AND NEW.estatus IN ('BAJA', 'INACTIVO') THEN
    INSERT INTO rrhh.historial_movimientos (
      id_empleado, tipo_movimiento, id_depto_anterior, id_puesto_anterior,
      motivo, realizado_por, fecha_efecto
    ) VALUES (
      NEW.id_empleado, 'BAJA', OLD.id_departamento, OLD.id_puesto,
      COALESCE(v_motivo, 'Cambio de estatus a ' || NEW.estatus), v_usuario, COALESCE(NEW.fecha_baja, CURRENT_DATE)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_rrhh_empleados_movimientos ON rrhh.empleados;
CREATE TRIGGER tr_rrhh_empleados_movimientos
AFTER INSERT OR UPDATE OF id_departamento, id_puesto, sueldo_mensual_bruto, estatus
ON rrhh.empleados
FOR EACH ROW
EXECUTE FUNCTION rrhh.tgfn_auditar_movimiento_laboral();

-- ── 8. Cálculo de porcentaje de completitud de expediente (0–100%, 15 requisitos)
-- Evalúa únicamente el Expediente Base obligatorio (13 campos) + Fotografía + CSF SAT.
-- Campos opcionales (cursos/DC-3, uniformes EPP, alergias, tarjeta 16d, jefe) no penalizan.
CREATE OR REPLACE FUNCTION rrhh.fn_porcentaje_expediente(p_id_empleado core.id_uuid)
RETURNS SMALLINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_emp         rrhh.empleados%ROWTYPE;
  v_puesto_nom  TEXT;
  v_puntos      SMALLINT := 0;
  v_total       CONSTANT SMALLINT := 15;
  v_has_nomina  BOOLEAN := FALSE;
  v_has_csf     BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_emp FROM rrhh.empleados WHERE id_empleado = p_id_empleado;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT p.nombre INTO v_puesto_nom
    FROM rrhh.cat_puestos p
   WHERE p.id_puesto = v_emp.id_puesto;

  -- Identidad laboral y fotografía (5)
  IF LENGTH(TRIM(COALESCE(v_emp.nombre_pila, ''))) >= 2 THEN v_puntos := v_puntos + 1; END IF;
  IF v_puesto_nom IS NOT NULL AND v_puesto_nom NOT IN ('Por definir', 'Por asignar') THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.id_departamento IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.id_sede IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF LENGTH(TRIM(COALESCE(v_emp.foto_url, ''))) > 0 THEN v_puntos := v_puntos + 1; END IF;

  -- Contacto, domicilio y emergencia (4)
  IF COALESCE(v_emp.correo_corporativo, v_emp.correo_personal) IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF COALESCE(v_emp.telefono_celular, v_emp.telefono_fijo) IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF LENGTH(TRIM(COALESCE(v_emp.calle, ''))) >= 2
     AND (
       LENGTH(TRIM(COALESCE(v_emp.colonia, ''))) > 0
       OR LENGTH(TRIM(COALESCE(v_emp.municipio, ''))) > 0
       OR v_emp.codigo_postal IS NOT NULL
     ) THEN
    v_puntos := v_puntos + 1;
  END IF;
  IF LENGTH(TRIM(COALESCE(v_emp.emergencia_nombre, ''))) >= 3
     AND v_emp.emergencia_telefono IS NOT NULL THEN
    v_puntos := v_puntos + 1;
  END IF;

  -- Fiscales y seguro social (3)
  IF v_emp.rfc IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.curp IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.nss IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;

  -- Salud básica (1)
  IF v_emp.tipo_sangre IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;

  -- Nómina: Banco (FK) + CLABE de 18 dígitos (1)
  SELECT EXISTS (
    SELECT 1
    FROM rrhh.cuentas_bancarias cb
    WHERE cb.id_empleado = p_id_empleado
      AND cb.activa = TRUE
      AND cb.id_banco IS NOT NULL
      AND cb.clabe IS NOT NULL
  ) INTO v_has_nomina;
  IF v_has_nomina THEN v_puntos := v_puntos + 1; END IF;

  -- Constancia de Situación Fiscal SAT (1)
  IF v_emp.estatus_csf = 'VIGENTE' THEN
    v_has_csf := TRUE;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM rrhh.documentos_expediente d
      WHERE d.id_empleado = p_id_empleado
        AND LOWER(d.categoria) LIKE '%constancia%'
        AND LOWER(d.categoria) LIKE '%fiscal%'
    ) INTO v_has_csf;
  END IF;
  IF v_has_csf THEN v_puntos := v_puntos + 1; END IF;

  RETURN ROUND((v_puntos::NUMERIC / v_total::NUMERIC) * 100)::SMALLINT;
END;
$$;

-- ── 9. Triggers updated_at en tablas principales ─────────────────────────────
DROP TRIGGER IF EXISTS tr_rrhh_deptos_updated ON rrhh.departamentos;
CREATE TRIGGER tr_rrhh_deptos_updated
BEFORE UPDATE ON rrhh.departamentos
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_emp_updated ON rrhh.empleados;
CREATE TRIGGER tr_rrhh_emp_updated
BEFORE UPDATE ON rrhh.empleados
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_cb_updated ON rrhh.cuentas_bancarias;
CREATE TRIGGER tr_rrhh_cb_updated
BEFORE UPDATE ON rrhh.cuentas_bancarias
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_doc_updated ON rrhh.documentos_expediente;
CREATE TRIGGER tr_rrhh_doc_updated
BEFORE UPDATE ON rrhh.documentos_expediente
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_vac_updated ON rrhh.vacaciones_solicitudes;
CREATE TRIGGER tr_rrhh_vac_updated
BEFORE UPDATE ON rrhh.vacaciones_solicitudes
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_ext_updated ON rrhh.extensiones_telefonicas;
CREATE TRIGGER tr_rrhh_ext_updated
BEFORE UPDATE ON rrhh.extensiones_telefonicas
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_sgi_updated ON rrhh.formatos_sgi;
CREATE TRIGGER tr_rrhh_sgi_updated
BEFORE UPDATE ON rrhh.formatos_sgi
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

DROP TRIGGER IF EXISTS tr_rrhh_agenda_updated ON rrhh.agenda_actividades;
CREATE TRIGGER tr_rrhh_agenda_updated
BEFORE UPDATE ON rrhh.agenda_actividades
FOR EACH ROW EXECUTE FUNCTION rrhh.tgfn_set_updated_at();

-- ════════════════════════════════════════════════════════════
-- 10. VISTAS — schema core & schema rrhh
-- ════════════════════════════════════════════════════════════

-- ── Vista de permisos completos por usuario (para middleware Next.js / RBAC) ─
CREATE OR REPLACE VIEW core.v_permisos_usuario AS
SELECT
  u.id_usuario,
  u.username,
  u.correo,
  u.id_empleado,
  r.codigo        AS cod_rol,
  r.nombre        AS nombre_rol,
  r.nivel_acceso,
  m.codigo        AS cod_modulo,
  m.nombre        AS nombre_modulo,
  sm.codigo       AS cod_submodulo,
  sm.nombre       AS nombre_submodulo,
  sm.ruta_url,
  rp.puede_ver,
  rp.puede_crear,
  rp.puede_editar,
  rp.puede_eliminar,
  rp.puede_exportar
FROM core.usuarios u
JOIN core.roles r         ON r.id_rol = u.id_rol
JOIN core.rol_permisos rp ON rp.id_rol = r.id_rol
JOIN core.submodulos sm   ON sm.id_submodulo = rp.id_submodulo
JOIN core.modulos m       ON m.id_modulo = sm.id_modulo
WHERE u.activo = TRUE
  AND r.activo = TRUE
  AND sm.activo = TRUE
  AND m.activo = TRUE;

-- ── 1. Directorio Completo de Personal (consumida por el frontend/API) ───────
CREATE OR REPLACE VIEW rrhh.v_directorio_personal AS
SELECT
  e.id_empleado,
  e.folio,
  d.codigo                                 AS codigo_departamento,
  d.nombre                                 AS nombre_departamento,
  emp_org.nombre_corto                     AS empresa,
  s.nombre                                 AS sede,
  e.nombre_pila,
  e.apellido_paterno,
  e.apellido_materno,
  -- Derivados calculados al vuelo (cero espacio extra en rrhh.empleados)
  rrhh.fn_nombre_completo(e.nombre_pila, e.apellido_paterno, e.apellido_materno) AS nombre_completo,
  UPPER(
    COALESCE(NULLIF(LEFT(e.nombre_pila, 1), ''), 'S') ||
    COALESCE(NULLIF(LEFT(e.apellido_paterno, 1), ''), NULLIF(SUBSTRING(e.nombre_pila FROM 2 FOR 1), ''), 'F')
  )                                        AS iniciales,
  e.foto_url,
  p.nombre                                 AS puesto,
  COALESCE(e.categoria_laboral, p.categoria) AS categoria_laboral,
  tc.nombre                                AS tipo_contrato,
  e.sueldo_mensual_bruto,
  e.proyecto_asignado,
  e.fecha_ingreso,
  e.fecha_fin_contrato,
  e.estatus,
  e.acreditacion_sil,
  CASE
    WHEN LOWER(e.acreditacion_sil) LIKE '%vigente%'
      OR LOWER(e.acreditacion_sil) LIKE '%acreditado%' THEN 'success'
    WHEN LOWER(e.acreditacion_sil) LIKE '%renovar%'
      OR LOWER(e.acreditacion_sil) LIKE '%vencid%' THEN 'warning'
    ELSE 'info'
  END                                      AS acreditacion_tipo,
  e.rfc,
  e.curp,
  e.nss,
  e.fecha_nacimiento,
  e.tipo_sangre,
  e.talla_calzado_mex,
  e.talla_overol,
  e.correo_corporativo,
  e.correo_personal,
  e.telefono_celular,
  e.telefono_fijo,
  e.extension_oficina,
  e.estatus_csf,
  sup.folio                                AS supervisor_folio,
  rrhh.fn_nombre_completo(sup.nombre_pila, sup.apellido_paterno, sup.apellido_materno) AS supervisor_nombre,
  rrhh.fn_porcentaje_expediente(e.id_empleado) AS porcentaje_expediente,
  (SELECT COUNT(*) FROM rrhh.documentos_expediente doc WHERE doc.id_empleado = e.id_empleado) AS total_documentos
FROM rrhh.empleados e
JOIN core.empresas emp_org           ON emp_org.id_empresa = e.id_empresa
JOIN rrhh.departamentos d            ON d.id_departamento = e.id_departamento
JOIN rrhh.cat_puestos p              ON p.id_puesto = e.id_puesto
LEFT JOIN core.sedes s               ON s.id_sede = e.id_sede
LEFT JOIN rrhh.cat_tipos_contrato tc ON tc.id_tipo_contrato = e.id_tipo_contrato
LEFT JOIN rrhh.empleados sup         ON sup.id_empleado = e.id_supervisor
WHERE e.deleted_at IS NULL;

-- ── 2. Organigrama Corporativo Recursivo (WITH RECURSIVE CTE) ────────────────
CREATE OR REPLACE VIEW rrhh.v_organigrama_corporativo AS
WITH RECURSIVE arbol AS (
  -- Raíz: Dirección General (sin supervisor)
  SELECT
    e.id_empleado,
    e.folio,
    rrhh.fn_nombre_completo(e.nombre_pila, e.apellido_paterno, e.apellido_materno) AS nombre_completo,
    UPPER(
      COALESCE(NULLIF(LEFT(e.nombre_pila, 1), ''), 'S') ||
      COALESCE(NULLIF(LEFT(e.apellido_paterno, 1), ''), NULLIF(SUBSTRING(e.nombre_pila FROM 2 FOR 1), ''), 'F')
    ) AS iniciales,
    p.nombre AS puesto,
    e.id_departamento,
    e.id_supervisor,
    e.foto_url,
    s.nombre AS sede,
    0 AS nivel,
    ARRAY[e.folio::TEXT] AS ruta_folios,
    e.folio::TEXT AS ruta_texto
  FROM rrhh.empleados e
  JOIN rrhh.cat_puestos p ON p.id_puesto = e.id_puesto
  LEFT JOIN core.sedes s  ON s.id_sede = e.id_sede
  WHERE e.id_supervisor IS NULL
    AND e.estatus = 'ACTIVO'
    AND e.deleted_at IS NULL

  UNION ALL

  -- Ramas dependientes
  SELECT
    h.id_empleado,
    h.folio,
    rrhh.fn_nombre_completo(h.nombre_pila, h.apellido_paterno, h.apellido_materno) AS nombre_completo,
    UPPER(
      COALESCE(NULLIF(LEFT(h.nombre_pila, 1), ''), 'S') ||
      COALESCE(NULLIF(LEFT(h.apellido_paterno, 1), ''), NULLIF(SUBSTRING(h.nombre_pila FROM 2 FOR 1), ''), 'F')
    ) AS iniciales,
    p2.nombre AS puesto,
    h.id_departamento,
    h.id_supervisor,
    h.foto_url,
    s2.nombre AS sede,
    a.nivel + 1 AS nivel,
    a.ruta_folios || h.folio::TEXT,
    a.ruta_texto || ' > ' || h.folio::TEXT
  FROM rrhh.empleados h
  JOIN arbol a             ON a.id_empleado = h.id_supervisor
  JOIN rrhh.cat_puestos p2 ON p2.id_puesto = h.id_puesto
  LEFT JOIN core.sedes s2  ON s2.id_sede = h.id_sede
  WHERE h.estatus = 'ACTIVO'
    AND h.deleted_at IS NULL
    AND NOT (h.folio::TEXT = ANY(a.ruta_folios))
    AND a.nivel < 12
)
SELECT
  a.id_empleado,
  a.folio,
  d.codigo AS codigo_departamento,
  d.nombre AS nombre_departamento,
  a.nombre_completo,
  a.iniciales,
  a.puesto,
  a.id_supervisor,
  a.foto_url,
  a.sede,
  a.nivel,
  a.ruta_texto,
  (SELECT COUNT(*) FROM rrhh.empleados sub
    WHERE sub.id_supervisor = a.id_empleado
      AND sub.estatus = 'ACTIVO'
      AND sub.deleted_at IS NULL) AS subordinados_directos
FROM arbol a
JOIN rrhh.departamentos d ON d.id_departamento = a.id_departamento
ORDER BY a.nivel, a.folio;

-- ── 3. Cumpleañeros del Mes Actual (KPI Menú Principal) ──────────────────────
CREATE OR REPLACE VIEW rrhh.v_cumpleanos_mes AS
SELECT
  e.id_empleado,
  e.folio,
  d.codigo AS codigo_departamento,
  d.nombre AS nombre_departamento,
  rrhh.fn_nombre_completo(e.nombre_pila, e.apellido_paterno, e.apellido_materno) AS nombre_completo,
  p.nombre AS puesto,
  e.fecha_nacimiento,
  EXTRACT(DAY FROM e.fecha_nacimiento)::SMALLINT AS dia_cumpleanos,
  s.nombre AS sede
FROM rrhh.empleados e
JOIN rrhh.departamentos d ON d.id_departamento = e.id_departamento
JOIN rrhh.cat_puestos p   ON p.id_puesto = e.id_puesto
LEFT JOIN core.sedes s    ON s.id_sede = e.id_sede
WHERE e.estatus = 'ACTIVO'
  AND e.deleted_at IS NULL
  AND e.fecha_nacimiento IS NOT NULL
  AND EXTRACT(MONTH FROM e.fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY EXTRACT(DAY FROM e.fecha_nacimiento), nombre_completo;

-- ── 4. Contratos Próximos a Vencer (próximos 30 días — KPI Menú Principal) ───
CREATE OR REPLACE VIEW rrhh.v_contratos_por_vencer AS
SELECT
  e.id_empleado,
  e.folio,
  d.codigo AS codigo_departamento,
  d.nombre AS nombre_departamento,
  rrhh.fn_nombre_completo(e.nombre_pila, e.apellido_paterno, e.apellido_materno) AS nombre_completo,
  p.nombre AS puesto,
  e.fecha_fin_contrato,
  (e.fecha_fin_contrato - CURRENT_DATE) AS dias_restantes,
  s.nombre AS sede
FROM rrhh.empleados e
JOIN rrhh.departamentos d ON d.id_departamento = e.id_departamento
JOIN rrhh.cat_puestos p   ON p.id_puesto = e.id_puesto
LEFT JOIN core.sedes s    ON s.id_sede = e.id_sede
WHERE e.estatus = 'ACTIVO'
  AND e.deleted_at IS NULL
  AND e.fecha_fin_contrato IS NOT NULL
  AND e.fecha_fin_contrato BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
ORDER BY e.fecha_fin_contrato ASC;

-- ── 5. Resumen Ejecutivo por Departamento (Fuerza Laboral Real) ──────────────
CREATE OR REPLACE VIEW rrhh.v_resumen_departamentos AS
SELECT
  d.id_departamento,
  d.codigo,
  d.nombre,
  s.nombre AS sede,
  resp.folio AS responsable_folio,
  rrhh.fn_nombre_completo(resp.nombre_pila, resp.apellido_paterno, resp.apellido_materno) AS responsable_nombre,
  COUNT(e.id_empleado) FILTER (WHERE e.estatus = 'ACTIVO' AND e.deleted_at IS NULL) AS empleados_activos,
  COUNT(e.id_empleado) FILTER (WHERE e.estatus <> 'ACTIVO' AND e.deleted_at IS NULL) AS empleados_inactivos,
  COALESCE(SUM(e.sueldo_mensual_bruto) FILTER (WHERE e.estatus = 'ACTIVO' AND e.deleted_at IS NULL), 0) AS nomina_mensual_bruta
FROM rrhh.departamentos d
LEFT JOIN core.sedes s        ON s.id_sede = d.id_sede
LEFT JOIN rrhh.empleados resp ON resp.id_empleado = d.id_responsable
LEFT JOIN rrhh.empleados e    ON e.id_departamento = d.id_departamento
GROUP BY d.id_departamento, d.codigo, d.nombre, s.nombre, resp.folio, resp.nombre_pila, resp.apellido_paterno, resp.apellido_materno
ORDER BY d.codigo;

-- ── 6. Directorio de Extensiones Telefónicas (resuelve responsable por FK) ───
CREATE OR REPLACE VIEW rrhh.v_extensiones_directorio AS
SELECT
  ext.id_extension,
  ext.extension,
  ext.etiqueta_area,
  d.codigo AS codigo_departamento,
  d.nombre AS nombre_departamento,
  s.nombre AS sede,
  emp.folio AS empleado_folio,
  rrhh.fn_nombre_completo(emp.nombre_pila, emp.apellido_paterno, emp.apellido_materno) AS empleado_asignado,
  ext.es_principal_depto,
  ext.activa
FROM rrhh.extensiones_telefonicas ext
JOIN rrhh.departamentos d ON d.id_departamento = ext.id_departamento
LEFT JOIN core.sedes s    ON s.id_sede = ext.id_sede
LEFT JOIN rrhh.empleados emp ON emp.id_empleado = ext.id_empleado_asignado
ORDER BY ext.extension;

-- ════════════════════════════════════════════════════════════
-- 11. PROCEDIMIENTOS ALMACENADOS — schema rrhh
-- ════════════════════════════════════════════════════════════

-- ── 1. Alta Integral de Colaborador (Empleado + Puesto + Cuenta de Nómina) ───
CREATE OR REPLACE PROCEDURE rrhh.sp_registrar_colaborador(
  IN  p_codigo_empresa    VARCHAR,
  IN  p_codigo_depto      VARCHAR,
  IN  p_nombre_pila       VARCHAR,
  IN  p_apellido_paterno  VARCHAR,
  IN  p_apellido_materno  VARCHAR,
  IN  p_puesto_nombre     VARCHAR,
  IN  p_codigo_sede       VARCHAR DEFAULT NULL,
  IN  p_rfc               VARCHAR DEFAULT NULL,
  IN  p_curp              VARCHAR DEFAULT NULL,
  IN  p_nss               VARCHAR DEFAULT NULL,
  IN  p_correo_personal   VARCHAR DEFAULT NULL,
  IN  p_telefono_celular  VARCHAR DEFAULT NULL,
  IN  p_sueldo_mensual    NUMERIC DEFAULT NULL,
  IN  p_folio_supervisor  VARCHAR DEFAULT NULL,
  IN  p_banco_nombre      VARCHAR DEFAULT NULL,
  IN  p_clabe             VARCHAR DEFAULT NULL,
  IN  p_usuario           VARCHAR DEFAULT CURRENT_USER,
  OUT p_folio_generado    VARCHAR,
  OUT p_id_empleado_out   core.id_uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_empresa    core.id_uuid;
  v_id_depto      core.id_uuid;
  v_id_sede       core.id_uuid;
  v_id_puesto     core.id_uuid;
  v_id_supervisor core.id_uuid;
  v_id_banco      core.id_uuid;
  v_puesto_limpio core.nombre_entidad;
  v_banco_limpio  core.nombre_corto;
BEGIN
  -- Lock transaccional para garantizar integridad en altas simultáneas
  PERFORM pg_advisory_xact_lock(hashtext('rrhh_alta_colaborador'));
  PERFORM set_config('app.usuario_actual', COALESCE(p_usuario, CURRENT_USER), TRUE);
  PERFORM set_config('app.motivo_movimiento', 'Alta integral vía sp_registrar_colaborador', TRUE);

  SELECT id_empresa INTO v_id_empresa
    FROM core.empresas
   WHERE codigo = UPPER(TRIM(p_codigo_empresa))
   LIMIT 1;
  IF v_id_empresa IS NULL THEN
    RAISE EXCEPTION 'Empresa "%" no encontrada en core.empresas', p_codigo_empresa;
  END IF;

  SELECT id_departamento INTO v_id_depto
    FROM rrhh.departamentos
   WHERE codigo = UPPER(TRIM(p_codigo_depto))
   LIMIT 1;
  IF v_id_depto IS NULL THEN
    RAISE EXCEPTION 'Departamento "%" no encontrado en rrhh.departamentos', p_codigo_depto;
  END IF;

  IF p_codigo_sede IS NOT NULL AND TRIM(p_codigo_sede) <> '' THEN
    SELECT id_sede INTO v_id_sede
      FROM core.sedes
     WHERE codigo = UPPER(TRIM(p_codigo_sede))
        OR rrhh.fn_normalizar_busqueda(nombre) = rrhh.fn_normalizar_busqueda(p_codigo_sede)
     LIMIT 1;
  END IF;

  -- Resolver o registrar puesto en catálogo normalizado rrhh.cat_puestos
  v_puesto_limpio := COALESCE(NULLIF(TRIM(p_puesto_nombre), ''), 'Por definir')::core.nombre_entidad;
  SELECT id_puesto INTO v_id_puesto
    FROM rrhh.cat_puestos
   WHERE rrhh.fn_normalizar_busqueda(nombre) = rrhh.fn_normalizar_busqueda(v_puesto_limpio)
   LIMIT 1;

  IF v_id_puesto IS NULL THEN
    INSERT INTO rrhh.cat_puestos (id_departamento, nombre)
    VALUES (v_id_depto, v_puesto_limpio)
    RETURNING id_puesto INTO v_id_puesto;
  END IF;

  IF p_folio_supervisor IS NOT NULL AND TRIM(p_folio_supervisor) <> '' THEN
    SELECT id_empleado INTO v_id_supervisor
      FROM rrhh.empleados
     WHERE folio = UPPER(TRIM(p_folio_supervisor))
       AND deleted_at IS NULL
     LIMIT 1;
  END IF;

  INSERT INTO rrhh.empleados (
    id_empresa, id_departamento, id_sede, id_puesto, id_supervisor,
    nombre_pila, apellido_paterno, apellido_materno,
    rfc, curp, nss,
    correo_personal, telefono_celular, sueldo_mensual_bruto
  ) VALUES (
    v_id_empresa, v_id_depto, v_id_sede, v_id_puesto, v_id_supervisor,
    p_nombre_pila, COALESCE(p_apellido_paterno, ''), COALESCE(p_apellido_materno, ''),
    NULLIF(UPPER(TRIM(COALESCE(p_rfc, ''))), '')::core.rfc_mx,
    NULLIF(UPPER(TRIM(COALESCE(p_curp, ''))), '')::core.curp_mx,
    NULLIF(TRIM(COALESCE(p_nss, '')), '')::rrhh.nss_mx,
    NULLIF(LOWER(TRIM(COALESCE(p_correo_personal, ''))), '')::core.correo_electronico,
    NULLIF(TRIM(COALESCE(p_telefono_celular, '')), '')::core.telefono_mx,
    p_sueldo_mensual::core.monto_mxn
  )
  RETURNING id_empleado, folio INTO p_id_empleado_out, p_folio_generado;

  -- Crear cuenta de Nómina normalizada vía FK id_banco si se proporcionó CLABE
  IF COALESCE(TRIM(p_clabe), '') <> '' THEN
    v_banco_limpio := COALESCE(NULLIF(TRIM(p_banco_nombre), ''), 'BBVA México')::core.nombre_corto;
    SELECT id_banco INTO v_id_banco
      FROM rrhh.cat_bancos
     WHERE rrhh.fn_normalizar_busqueda(nombre) = rrhh.fn_normalizar_busqueda(v_banco_limpio)
     LIMIT 1;

    IF v_id_banco IS NULL THEN
      INSERT INTO rrhh.cat_bancos (nombre)
      VALUES (v_banco_limpio)
      RETURNING id_banco INTO v_id_banco;
    END IF;

    INSERT INTO rrhh.cuentas_bancarias (
      id_empleado, id_banco, alias, clabe, es_principal
    ) VALUES (
      p_id_empleado_out,
      v_id_banco,
      'Nómina',
      NULLIF(regexp_replace(COALESCE(p_clabe, ''), '\D', '', 'g'), '')::core.clabe_mx,
      TRUE
    );
  END IF;
END;
$$;

-- ── 2. Transferencia de Departamento (conservando folio SFG-XXXX e historial inmutable)
CREATE OR REPLACE PROCEDURE rrhh.sp_cambiar_departamento(
  p_folio_empleado    VARCHAR,
  p_codigo_depto_nvo  VARCHAR,
  p_folio_supervisor  VARCHAR DEFAULT NULL,
  p_motivo            VARCHAR DEFAULT 'Reasignación organizacional',
  p_usuario           VARCHAR DEFAULT CURRENT_USER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_emp        core.id_uuid;
  v_id_depto_nvo  core.id_uuid;
  v_id_sup_nvo    core.id_uuid;
BEGIN
  SELECT id_empleado
    INTO v_id_emp
    FROM rrhh.empleados
   WHERE folio = UPPER(TRIM(p_folio_empleado))
     AND deleted_at IS NULL
   FOR UPDATE;

  IF v_id_emp IS NULL THEN
    RAISE EXCEPTION 'Colaborador "%" no encontrado', p_folio_empleado;
  END IF;

  SELECT id_departamento INTO v_id_depto_nvo
    FROM rrhh.departamentos
   WHERE codigo = UPPER(TRIM(p_codigo_depto_nvo))
     AND activo = TRUE;

  IF v_id_depto_nvo IS NULL THEN
    RAISE EXCEPTION 'Departamento destino "%" no válido o inactivo', p_codigo_depto_nvo;
  END IF;

  IF p_folio_supervisor IS NOT NULL AND TRIM(p_folio_supervisor) <> '' THEN
    SELECT id_empleado INTO v_id_sup_nvo
      FROM rrhh.empleados
     WHERE folio = UPPER(TRIM(p_folio_supervisor))
       AND deleted_at IS NULL;
  END IF;

  -- Inyectar contexto de auditoría para el trigger append-only (sin hacer UPDATE al historial)
  PERFORM set_config('app.usuario_actual', COALESCE(p_usuario, CURRENT_USER), TRUE);
  PERFORM set_config('app.motivo_movimiento', COALESCE(p_motivo, 'Reasignación organizacional'), TRUE);

  UPDATE rrhh.empleados
     SET id_departamento = v_id_depto_nvo,
         id_supervisor   = COALESCE(v_id_sup_nvo, id_supervisor)
   WHERE id_empleado = v_id_emp;
END;
$$;

-- ── 3. Baja de Colaborador (SGI-FR-RH-15) con reasignación de subordinados ───
CREATE OR REPLACE PROCEDURE rrhh.sp_aplicar_baja_colaborador(
  p_folio_empleado    VARCHAR,
  p_motivo_baja       VARCHAR,
  p_fecha_baja        DATE DEFAULT CURRENT_DATE,
  p_reasignar_equipo  BOOLEAN DEFAULT TRUE,
  p_emitido_por       VARCHAR DEFAULT CURRENT_USER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_emp      core.id_uuid;
  v_id_sup      core.id_uuid;
  v_id_depto    core.id_uuid;
  v_folio_sgi   rrhh.folio_documento;
BEGIN
  SELECT id_empleado, id_supervisor, id_departamento
    INTO v_id_emp, v_id_sup, v_id_depto
    FROM rrhh.empleados
   WHERE folio = UPPER(TRIM(p_folio_empleado))
     AND deleted_at IS NULL
   FOR UPDATE;

  IF v_id_emp IS NULL THEN
    RAISE EXCEPTION 'Colaborador "%" no encontrado', p_folio_empleado;
  END IF;

  PERFORM set_config('app.usuario_actual', COALESCE(p_emitido_por, CURRENT_USER), TRUE);
  PERFORM set_config('app.motivo_movimiento', COALESCE(p_motivo_baja, 'Baja SGI-FR-RH-15'), TRUE);

  -- Si tenía equipo a cargo, reasignar subordinados al jefe inmediato superior para no romper el organigrama
  IF p_reasignar_equipo THEN
    UPDATE rrhh.empleados
       SET id_supervisor = v_id_sup
     WHERE id_supervisor = v_id_emp
       AND estatus = 'ACTIVO'
       AND deleted_at IS NULL;
  END IF;

  -- Baja lógica (nunca se borra físicamente ni se recicla el folio SFG-XXXX)
  UPDATE rrhh.empleados
     SET estatus    = 'BAJA',
         fecha_baja = p_fecha_baja
   WHERE id_empleado = v_id_emp;

  -- Registrar Vale de No Adeudo SGI-FR-RH-15
  v_folio_sgi := ('SGI-RH15-' || TO_CHAR(p_fecha_baja, 'YYYYMMDD') || '-' || SUBSTRING(p_folio_empleado FROM '[0-9]+$'))::rrhh.folio_documento;

  INSERT INTO rrhh.formatos_sgi (
    folio_sgi, codigo_formato, id_empleado, id_departamento, estatus, datos_formato, emitido_por
  ) VALUES (
    v_folio_sgi,
    'SGI-FR-RH-15'::rrhh.folio_documento,
    v_id_emp,
    v_id_depto,
    'APROBADA'::rrhh.estatus_solicitud,
    jsonb_build_object(
      'motivo_baja', p_motivo_baja,
      'fecha_baja', p_fecha_baja,
      'equipo_reasignado', p_reasignar_equipo
    ),
    p_emitido_por
  )
  ON CONFLICT (folio_sgi) DO NOTHING;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 12. SEGURIDAD, INMUTABILIDAD Y PERMISOS
-- ════════════════════════════════════════════════════════════

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

-- Privilegios completos del propietario administrativo (sifygsa_admin)
GRANT USAGE, CREATE ON SCHEMA core, rrhh TO sifygsa_admin;
GRANT ALL PRIVILEGES ON ALL TABLES     IN SCHEMA core, rrhh TO sifygsa_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES  IN SCHEMA core, rrhh TO sifygsa_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS  IN SCHEMA core, rrhh TO sifygsa_admin;
GRANT ALL PRIVILEGES ON ALL PROCEDURES IN SCHEMA core, rrhh TO sifygsa_admin;

-- ════════════════════════════════════════════════════════════
-- 13. DATOS INICIALES (SEEDS IDEMPOTENTES)
--     13.1 Core: Empresas, 28 Sedes normalizadas, Módulos y Roles
--     13.2 Catálogos RRHH: 13 Bancos, 5 Contratos, 14 Deptos + 2 Ramas,
--          102 Puestos unificados, 14 Extensiones y Festivos LFT 2026
--     13.3 Plantilla Real: 188 Colaboradores activos, Organigrama y Líderes
-- ════════════════════════════════════════════════════════════

-- ── 13.1 Seed Core ───────────────────────────────────────────
-- 1. Empresas / Subsidiarias
INSERT INTO core.empresas (codigo, nombre_corto, razon_social, es_principal)
VALUES
  ('SIFYGSA', 'SIFYGSA', 'Soluciones Integrales en Fire & Gas S.A. de C.V.', TRUE),
  ('VIPSA',   'VIPSA',   'VIPSA Ingeniería y Servicios Industriales S.A. de C.V.', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Sedes y Localidades Operativas Normalizadas (28 registros únicos sin variantes de acento/mayúsculas)
INSERT INTO core.sedes (id_empresa, codigo, nombre, ciudad, estado, es_matriz)
SELECT e.id_empresa, v.codigo, v.nombre, v.ciudad, v.estado, v.es_matriz
FROM core.empresas e
CROSS JOIN (
  VALUES
    -- Bases operativas principales
    ('MIN', 'Minatitlán, Ver.',              'Minatitlán',              'Veracruz',  TRUE),
    ('MAP', 'Mapachapa, Ver.',               'Mapachapa',               'Veracruz',  FALSE),
    ('COM', 'Comalcalco, Tab.',              'Comalcalco',              'Tabasco',   FALSE),
    ('COA', 'Coatzacoalcos, Ver.',           'Coatzacoalcos',           'Veracruz',  FALSE),
    ('COS', 'Cosoleacaque, Ver.',            'Cosoleacaque',            'Veracruz',  FALSE),
    ('XAL', 'Xalapa, Ver.',                  'Xalapa',                  'Veracruz',  FALSE),
    ('CDC', 'Ciudad del Carmen, Camp.',      'Ciudad del Carmen',       'Campeche',  FALSE),
    ('MER', 'Mérida, Yuc.',                  'Mérida',                  'Yucatán',   FALSE),
    -- Localidades adicionales de la plantilla activa
    ('ACA', 'Acayucan, Ver.',                'Acayucan',                'Veracruz',  FALSE),
    ('CAN', 'Canticas, Ver.',                'Canticas',                'Veracruz',  FALSE),
    ('CAR', 'Carrizal, Ver.',                'Carrizal',                'Veracruz',  FALSE),
    ('CEN', 'Centla, Tab.',                  'Centla',                  'Tabasco',   FALSE),
    ('CNO', 'Centro Norte',                  'Minatitlán',              'Veracruz',  FALSE),
    ('COR', 'Córdoba, Ver.',                 'Córdoba',                 'Veracruz',  FALSE),
    ('QRO', 'Corregidora, Querétaro',        'Corregidora',             'Querétaro', FALSE),
    ('HUI', 'Huimanguillo, Tab.',            'Huimanguillo',            'Tabasco',   FALSE),
    ('IXH', 'Ixhuatlán del Sureste, Ver.',   'Ixhuatlán del Sureste',   'Veracruz',  FALSE),
    ('JDM', 'Jalpa de Méndez, Tab.',         'Jalpa de Méndez',         'Tabasco',   FALSE),
    ('JAL', 'Jáltipan, Ver.',                'Jáltipan',                'Veracruz',  FALSE),
    ('NAC', 'Nacajuca, Tab.',                'Nacajuca',                'Tabasco',   FALSE),
    ('ORI', 'Orizaba, Ver.',                 'Orizaba',                 'Veracruz',  FALSE),
    ('OTE', 'Oteapan, Ver.',                 'Oteapan',                 'Veracruz',  FALSE),
    ('PAR', 'Paraíso, Tab.',                 'Paraíso',                 'Tabasco',   FALSE),
    ('SPM', 'San Pedro Mártir, Ver.',        'San Pedro Mártir',        'Veracruz',  FALSE),
    ('SOC', 'Soconusco, Ver.',               'Soconusco',               'Veracruz',  FALSE),
    ('TEX', 'Texistepec, Ver.',              'Texistepec',              'Veracruz',  FALSE),
    ('TBL', 'Tierra Blanca, Ver.',           'Tierra Blanca',           'Veracruz',  FALSE),
    ('VHA', 'Villahermosa, Tab.',            'Villahermosa',            'Tabasco',   FALSE)
) AS v(codigo, nombre, ciudad, estado, es_matriz)
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO NOTHING;

-- 3. Módulos de la Suite SIFYGSA ERP / CRM
INSERT INTO core.modulos (codigo, nombre, descripcion, orden)
VALUES
  ('DASH', 'Inicio',           'Panel ejecutivo consolidado', 1),
  ('RRHH', 'Recursos Humanos', 'Plantilla, organigrama, expedientes, vacaciones y SGI', 2),
  ('ALM',  'Almacén',          'Inventarios, entradas, salidas y resguardos EPP', 3),
  ('COM',  'Compras',          'Órdenes de compra, cotizaciones y proveedores', 4),
  ('REQ',  'Requisiciones',    'Solicitudes internas y flujos de aprobación', 5),
  ('CRM',  'CRM Comercial',    'Clientes, oportunidades y seguimiento de proyectos', 6),
  ('FIN',  'Finanzas',         'Tabulador, nómina, fondos y partidas', 7),
  ('ADM',  'Administración',   'Roles, permisos, usuarios y configuración global', 8)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Submódulos de Recursos Humanos
INSERT INTO core.submodulos (id_modulo, codigo, nombre, ruta_url, orden)
SELECT m.id_modulo, v.codigo, v.nombre, v.ruta_url, v.orden
FROM core.modulos m
CROSS JOIN (
  VALUES
    ('rrhh-panel',         'Menú Principal',          '/rrhh/dashboard',        1),
    ('rrhh-alta',          'Registro del Personal',   '/rrhh/empleados/nuevo',  2),
    ('rrhh-catalogos',     'Directorio de Personal',  '/rrhh/empleados',        3),
    ('rrhh-vacaciones',    'Vacaciones',              '/rrhh/vacaciones',       4),
    ('rrhh-formatos',      'Formatos SGI',            '/rrhh/formatos',         5),
    ('rrhh-departamentos', 'Departamentos',           '/rrhh/departamentos',    6),
    ('rrhh-extensiones',   'Extensiones Telefónicas', '/rrhh/extensiones',      7),
    ('rrhh-cumpleanos',    'Cumpleaños',              '/rrhh/cumpleanos',       8),
    ('rrhh-festivos',      'Días Festivos',           '/rrhh/festivos',         9)
) AS v(codigo, nombre, ruta_url, orden)
WHERE m.codigo = 'RRHH'
ON CONFLICT (codigo) DO NOTHING;

-- 5. Roles corporativos base
INSERT INTO core.roles (codigo, nombre, descripcion, nivel_acceso)
VALUES
  ('super_admin',  'Administrador del Sistema', 'Control total multi-módulo', 10),
  ('direccion',    'Dirección General',         'Consulta ejecutiva y aprobaciones', 9),
  ('gerente_rrhh', 'Gerencia de RRHH',          'Control completo del módulo de Recursos Humanos', 8),
  ('analista_rrhh','Analista de RRHH',          'Altas, ediciones, importaciones y formatos SGI', 6),
  ('consulta',     'Solo Consulta',             'Lectura del directorio y organigrama', 2)
ON CONFLICT (codigo) DO NOTHING;

-- 6. Matriz inicial de permisos RBAC sobre submódulos RRHH
INSERT INTO core.rol_permisos (id_rol, id_submodulo, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar)
SELECT
  r.id_rol,
  s.id_submodulo,
  TRUE AS puede_ver,
  (r.codigo IN ('super_admin', 'gerente_rrhh', 'analista_rrhh')) AS puede_crear,
  (r.codigo IN ('super_admin', 'gerente_rrhh', 'analista_rrhh')) AS puede_editar,
  (r.codigo = 'super_admin') AS puede_eliminar,
  (r.codigo IN ('super_admin', 'direccion', 'gerente_rrhh', 'analista_rrhh')) AS puede_exportar
FROM core.roles r
CROSS JOIN core.submodulos s
WHERE r.codigo IN ('super_admin', 'direccion', 'gerente_rrhh', 'analista_rrhh')
ON CONFLICT (id_rol, id_submodulo) DO NOTHING;

-- Rol 'consulta': solo lectura en Directorio, Departamentos, Extensiones, Cumpleaños y Festivos
INSERT INTO core.rol_permisos (id_rol, id_submodulo, puede_ver, puede_crear, puede_editar, puede_eliminar, puede_exportar)
SELECT r.id_rol, s.id_submodulo, TRUE, FALSE, FALSE, FALSE, FALSE
FROM core.roles r
JOIN core.submodulos s ON s.codigo IN (
  'rrhh-panel', 'rrhh-catalogos', 'rrhh-departamentos',
  'rrhh-extensiones', 'rrhh-cumpleanos', 'rrhh-festivos'
)
WHERE r.codigo = 'consulta'
ON CONFLICT (id_rol, id_submodulo) DO NOTHING;

-- ── 13.2 Seed Catálogos RRHH ─────────────────────────────────
-- 1. Inicializar control atómico de folios
INSERT INTO rrhh.control_folios (entidad, prefijo, ultimo_numero, longitud_min)
VALUES
  ('EMPLEADO', 'SFG', 0, 4),
  ('VACACION', 'VAC', 0, 4),
  ('SGI',      'SGI', 0, 4)
ON CONFLICT (entidad) DO NOTHING;

-- 2. Bancos de México (13 instituciones con código SPEI — alineado a formShield.ts)
INSERT INTO rrhh.cat_bancos (codigo_spei, nombre)
VALUES
  ('012', 'BBVA México'),
  ('072', 'Banorte'),
  ('014', 'Santander México'),
  ('002', 'Citibanamex'),
  ('021', 'HSBC México'),
  ('044', 'Scotiabank'),
  ('127', 'Banco Azteca'),
  ('137', 'BanCoppel'),
  ('036', 'Inbursa'),
  ('062', 'Afirme'),
  ('058', 'BanRegio'),
  ('638', 'Nu México'),
  ('159', 'Hey Banco')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Tipos de Contrato (LFT México)
INSERT INTO rrhh.cat_tipos_contrato (codigo, nombre, requiere_vigencia)
VALUES
  ('INDET',  'Tiempo Indeterminado', FALSE),
  ('DET',    'Tiempo Determinado',   TRUE),
  ('OBRA',   'Por Obra Determinada', TRUE),
  ('PRUEBA', 'Periodo de Prueba',    TRUE),
  ('CAPAC',  'Capacitación Inicial', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Carpetas estándar del Expediente Digital
INSERT INTO rrhh.carpetas_expediente (id_empleado, nombre, es_sistema, orden)
SELECT NULL, v.nombre, TRUE, v.orden
FROM (
  VALUES
    ('Documentos',         1),
    ('Certificaciones',    2),
    ('Contratos y Anexos', 3)
) AS v(nombre, orden)
WHERE NOT EXISTS (
  SELECT 1 FROM rrhh.carpetas_expediente c
   WHERE c.id_empleado IS NULL AND LOWER(c.nombre) = LOWER(v.nombre)
);

-- 5. Los 14 Departamentos Oficiales de SIFYGSA (con siglas DIR..GSAPE)
INSERT INTO rrhh.departamentos (id_empresa, id_sede, codigo, nombre, descripcion)
SELECT
  e.id_empresa,
  s.id_sede,
  v.codigo::rrhh.codigo_departamento,
  v.nombre,
  v.descripcion
FROM core.empresas e
CROSS JOIN (
  VALUES
    ('DIR',     'MIN', 'Dirección',                       'Dirección general y gestión estratégica corporativa'),
    ('ADM',     'MIN', 'Administración',                  'Gestión administrativa, tesorería y contabilidad'),
    ('CAL',     'MIN', 'Calidad',                         'Aseguramiento y control de calidad ISO / SIL-3'),
    ('COM',     'MIN', 'Compras',                         'Adquisición de suministros, equipos e importaciones F&G'),
    ('HSE-MIN', 'MIN', 'HSE',                             'Seguridad industrial, salud ocupacional y medio ambiente (Sede Minatitlán)'),
    ('ALM',     'MAP', 'Almacén',                         'Control de inventarios, resguardos y entrega de EPP'),
    ('INF',     'MIN', 'Infraestructura',                 'Mantenimiento de bases operativas y redes de telecomunicación'),
    ('ING',     'MIN', 'Ingeniería',                      'Diseño e integración de sistemas de detección de gas y fuego SIL-3'),
    ('MCP',     'MIN', 'Medición y Control de Proyectos', 'Seguimiento de proyectos, licitaciones, estimaciones y control operativo'),
    ('HSE-COM', 'COM', 'HSE',                             'Seguridad industrial, salud ocupacional y medio ambiente (Sede Comalcalco)'),
    ('RH',      'MIN', 'Recursos Humanos',                'Gestión de talento, nómina, acreditaciones y rama de Capacitación (DC-3 / STPS)'),
    ('SRV',     'COM', 'Servicios',                       'Mantenimiento en campo, calibración y puestas en marcha'),
    ('VTA',     'MIN', 'Ventas',                          'Comercialización de soluciones F&G y rama de Definición de Soluciones'),
    ('GSAPE',   'MIN', 'GSAPE',                           'Grupo de Soporte y Análisis de Proyectos Especiales F&G')
) AS v(codigo, sede_cod, nombre, descripcion)
LEFT JOIN core.sedes s ON s.codigo = v.sede_cod
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO UPDATE
  SET nombre      = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion,
      id_sede     = EXCLUDED.id_sede;

-- Ramas especializadas (sub-departamentos con id_depto_padre)
INSERT INTO rrhh.departamentos (id_empresa, id_sede, id_depto_padre, codigo, nombre, descripcion)
SELECT
  e.id_empresa,
  p.id_sede,
  p.id_departamento,
  v.codigo::rrhh.codigo_departamento,
  v.nombre,
  v.descripcion
FROM core.empresas e
CROSS JOIN (
  VALUES
    ('RH-CAP',  'RH',  'Capacitación',            'Rama de Recursos Humanos enfocada en cursos, DC-3 y STPS'),
    ('VTA-SOL', 'VTA', 'Definición de Soluciones','Rama de Ventas enfocada en ingeniería comercial y propuestas F&G')
) AS v(codigo, padre_cod, nombre, descripcion)
JOIN rrhh.departamentos p ON p.codigo = v.padre_cod
WHERE e.codigo = 'SIFYGSA'
ON CONFLICT (codigo) DO NOTHING;

-- 6. Catálogo Oficial de Puestos Unificados (102 puestos sin variantes de acento/mayúsculas)
INSERT INTO rrhh.cat_puestos (nombre, id_departamento, nivel_jerarquico)
SELECT
  v.nombre,
  d.id_departamento,
  v.nivel::core.nivel_jerarquico
FROM (
  VALUES
    ('Almacenista', 'SRV', 7),
    ('Almacenista Jr', 'SRV', 7),
    ('Analista de Capacitación & Anexos', 'RH', 6),
    ('Andamiero', 'ING', 7),
    ('Auxiliar Administrativo', 'ING', 7),
    ('Auxiliar administrativo Jr', 'INF', 7),
    ('Auxiliar Administrativo Jr.', 'SRV', 7),
    ('Auxiliar administrativo Sr', 'HSE-COM', 7),
    ('Auxiliar Administrativo Ss', 'SRV', 7),
    ('Auxiliar contable', 'ADM', 7),
    ('Auxiliar contable Jr', 'ADM', 7),
    ('Auxiliar contable Ss', 'ADM', 7),
    ('Auxiliar de almacén', 'COM', 7),
    ('Auxiliar de HSE Jr', 'HSE-COM', 7),
    ('Auxiliar de HSE Ss', 'HSE-MIN', 7),
    ('Auxiliar de RRHH Ss', 'RH', 7),
    ('Auxiliar de RRHH Trainee', 'RH', 7),
    ('Auxiliar de TI Trainee', 'INF', 7),
    ('Auxiliar Estimacionista', 'SRV', 7),
    ('Auxiliar Técnico Ss', 'SRV', 7),
    ('Ayudante Eléctrico', 'SRV', 7),
    ('Ayudante general', 'ING', 7),
    ('Cadista', 'SRV', 7),
    ('Cadista Jr', 'SRV', 7),
    ('Cadista Ss', 'SRV', 7),
    ('Chofer', 'SRV', 7),
    ('Comprador Jr', 'COM', 6),
    ('Comprador Trainee', 'COM', 6),
    ('Coordinadora de Seguridad & Normatividad', 'HSE-MIN', 4),
    ('Coordonador de volumetrías', 'VTA', 7),
    ('Director Comercial', 'VTA', 2),
    ('Director General', 'DIR', 1),
    ('Eléctrico Jr', 'SRV', 7),
    ('Eléctrico Sr', 'SRV', 7),
    ('Encargado de Mantenimiento Jr', 'INF', 5),
    ('Encargado de Mantenimiento SS', 'INF', 5),
    ('Especialista en Automatización & Control', 'MCP', 6),
    ('Estimacionista', 'SRV', 7),
    ('Estimacionista Ss', 'SRV', 7),
    ('Generalista de Recursos Humanos', 'RH', 7),
    ('Gerente de Administración', 'ADM', 3),
    ('Gerente de Compras', 'COM', 3),
    ('Gerente de Infraestructura', 'INF', 3),
    ('Gerente de Ingeniería', 'ING', 3),
    ('Gerente de MYCP', 'MCP', 3),
    ('Gerente de Recursos Humanos', 'RH', 3),
    ('Gerente de Servicios', 'SRV', 3),
    ('Gerente de Soporte a Proyectos', 'GSAPE', 3),
    ('Gerente HSE Comalcalco', 'HSE-COM', 3),
    ('Gerente QHSE', 'HSE-MIN', 3),
    ('Gerente Ventas Istmo', 'VTA', 3),
    ('Gerente Ventas Sur', 'VTA', 3),
    ('Ing. de Calidad Ss', 'CAL', 7),
    ('Ing. De Servicios', 'SRV', 7),
    ('Ingeniero de definición de soluciones', 'VTA', 6),
    ('Ingeniero de Definición de Soluciones Jr', 'VTA', 6),
    ('Ingeniero de Definición de Soluciones Ss', 'VTA', 6),
    ('Ingeniero de Diseño Jr.', 'VTA', 6),
    ('Ingeniero de Medición Jr', 'DIR', 6),
    ('Ingeniero de productos', 'VTA', 6),
    ('Ingeniero de Servicios Jr', 'ING', 6),
    ('Ingeniero de servicios senior', 'ING', 6),
    ('Ingeniero de servicios Ss', 'ING', 6),
    ('Ingeniero de TI Ss', 'INF', 6),
    ('Ingeniero de Ventas Jr', 'VTA', 6),
    ('Ingeniero de Ventas Sr', 'VTA', 6),
    ('Ingeniero de Ventas Ss', 'VTA', 6),
    ('Ingeniero de volumetrías Ss', 'VTA', 6),
    ('Ingeniero de volumetrías Trainee', 'VTA', 6),
    ('Intendencia', 'INF', 7),
    ('Intendencia MSA', 'INF', 7),
    ('Jefe de Taller', 'SRV', 4),
    ('Laminador', 'SRV', 7),
    ('Líder de Contrato Jr', 'ING', 5),
    ('Líder de Contrato Sr', 'SRV', 5),
    ('Líder de ingeniería Ss', 'ING', 5),
    ('Líder de Proyecto Jr', 'SRV', 5),
    ('Líder de Proyecto Sr', 'SRV', 5),
    ('Líder de proyecto Ss', 'SRV', 5),
    ('Logística', 'COM', 7),
    ('Nominista', 'ADM', 7),
    ('Por definir', NULL, 7),
    ('Signatario de HSE Jr', 'HSE-COM', 7),
    ('Soldador Ss.', 'SRV', 7),
    ('Sub-Gerente de Servicios', 'SRV', 4),
    ('Supervisor de HSE', 'HSE-COM', 5),
    ('Supervisor de HSE Jr', 'HSE-COM', 5),
    ('Supervisor de HSE Ss', 'HSE-COM', 5),
    ('Supervisor de Mantenimiento & Redes', 'INF', 5),
    ('Supervisor de obra jr', 'SRV', 5),
    ('Supervisor de Obra Sr', 'SRV', 5),
    ('Supervisor HSE Jr', 'HSE-COM', 5),
    ('Técnico de Servicio Jr', 'ING', 7),
    ('Técnico de Servicios', 'ING', 7),
    ('Técnico de Servicios Jr', 'ING', 7),
    ('Técnico de Servicios Jr.', 'SRV', 7),
    ('Técnico de servicios Sr', 'ING', 7),
    ('Técnico en Detección de Gas', 'HSE-MIN', 7),
    ('Técnico especialista jr', 'SRV', 6),
    ('Técnico especialista Ss', 'SRV', 6),
    ('Tubero Eléctrico Sr', 'SRV', 7),
    ('Vigilante', 'INF', 7)
) AS v(nombre, depto_cod, nivel)
LEFT JOIN rrhh.departamentos d ON d.codigo = v.depto_cod
ON CONFLICT (nombre) DO NOTHING;

-- 7. Directorio base de Extensiones Telefónicas (id_empleado_asignado se vincula en 03_seed_rrhh_employees.sql)
INSERT INTO rrhh.extensiones_telefonicas (extension, etiqueta_area, id_departamento, id_sede, es_principal_depto)
SELECT
  v.ext::rrhh.extension_tel,
  v.etiqueta,
  d.id_departamento,
  s.id_sede,
  v.es_principal
FROM (
  VALUES
    ('101', 'Dirección General',        'DIR',     'MIN', TRUE),
    ('102', 'Dirección Comercial',      'VTA',     'MIN', FALSE),
    ('103', 'Ventas Istmo',             'VTA',     'MIN', TRUE),
    ('104', 'Ventas Sur',               'VTA',     'MIN', FALSE),
    ('105', 'Administración',           'ADM',     'MIN', TRUE),
    ('107', 'Gerencia de Compras',      'COM',     'MIN', TRUE),
    ('111', 'Infraestructura',          'INF',     'MIN', TRUE),
    ('112', 'Recursos Humanos',         'RH',      'MIN', TRUE),
    ('114', 'Almacén Mapachapa',        'ALM',     'MAP', TRUE),
    ('115', 'Ingeniería',               'ING',     'MIN', TRUE),
    ('116', 'Servicios',                'SRV',     'MIN', TRUE),
    ('117', 'HSE Minatitlán',           'HSE-MIN', 'MIN', TRUE),
    ('118', 'Subgerencia de Servicios', 'SRV',     'MIN', FALSE),
    ('119', 'HSE Comalcalco',           'HSE-COM', 'COM', TRUE)
) AS v(ext, etiqueta, depto_cod, sede_cod, es_principal)
JOIN rrhh.departamentos d ON d.codigo = v.depto_cod
LEFT JOIN core.sedes s    ON s.codigo = v.sede_cod
ON CONFLICT (extension) DO NOTHING;

-- 8. Días Festivos Oficiales México (LFT 2026)
INSERT INTO rrhh.dias_festivos (fecha, nombre, tipo, es_descanso_obligatorio)
VALUES
  ('2026-01-01', 'Año Nuevo',                            'OFICIAL_LFT', TRUE),
  ('2026-02-02', 'Día de la Constitución Mexicana',      'OFICIAL_LFT', TRUE),
  ('2026-03-16', 'Natalicio de Benito Juárez',           'OFICIAL_LFT', TRUE),
  ('2026-05-01', 'Día del Trabajo',                      'OFICIAL_LFT', TRUE),
  ('2026-09-16', 'Día de la Independencia de México',    'OFICIAL_LFT', TRUE),
  ('2026-11-16', 'Revolución Mexicana',                  'OFICIAL_LFT', TRUE),
  ('2026-12-25', 'Navidad',                              'OFICIAL_LFT', TRUE)
ON CONFLICT (fecha) DO NOTHING;

-- ── 13.3 Seed Plantilla Real de Colaboradores (188 activos) ──
BEGIN;

-- 1. Inserción idempotente de colaboradores (orden Etapa 1 -> Etapa 2 -> Etapa 3)
INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0001', 'Agustín', 'Anastacio', 'Martínez',
  'AAMA760706EI0', 'AAMA760706HVZNRG18', '67987627006', DATE '1976-07-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Dirección Corporativa',
  DATE '2021-03-15', 'ACTIVO', 'Certificación Vigente',
  '9221201243', '9222241996', 'agustin.anastacio@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Director General'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CNO'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0002', 'Manuel', 'Martínez', 'Ruíz',
  'MARM810118BV1', 'MARM810118HVZRZN09', '67048100183', DATE '1981-01-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Director Comercial'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0003', 'Emmanuel', 'Mendoza', 'Ramírez',
  'MERE821216FKA', 'MERE821216HVZNMM07', '67978252574', DATE '1982-12-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0004', 'Miguel Ángel', 'Guzmán', 'Reyes',
  'GURM830725GG8', 'GURM830725HVZZYG00', '22048310878', DATE '1983-07-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Ingeniería'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0005', 'Marlem', 'Campos', 'García',
  'CAGM821115U6A', 'CAGM821115MVZMRR00', '67018222140', DATE '1982-11-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Compras'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0006', 'Carlos Enrique', 'Cossio', 'Ruíz',
  'CORC880619JNA', 'CORC880619HVZSZR09', '67068814473', DATE '1988-06-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente QHSE'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0007', 'Pablo', 'Vázquez', 'Culebro',
  'VACP870818U17', 'VACP870818HVZZLB06', '67118701878', DATE '1987-08-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Infraestructura'
LEFT JOIN core.sedes sed    ON sed.codigo = 'ACA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0008', 'Viridiana', 'Arenas', 'Anastacio',
  'AEAV880424NN5', 'AEAV880424MVZRNR04', '67098815318', DATE '1988-04-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Administración'
LEFT JOIN core.sedes sed    ON sed.codigo = 'ACA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0009', 'Valeria', 'Méndez', 'Albores',
  'MEAV961029FB0', 'MEAV961029MVZNLL01', '13169645606', DATE '1996-10-29',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Recursos Humanos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0010', 'Rosa Ivette', 'Trujillo', 'Palma',
  'TUPR850715GG8', 'TUPR850715MTCRLS09', '83038519969', DATE '1985-07-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente HSE Comalcalco'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0011', 'Víctor Manuel', 'Anastacio', 'Martínez',
  'AAMV820404A92', 'AAMV820404HVZNRC01', '67048202047', DATE '1982-04-04',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'MCP'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de MYCP'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0012', 'Samuel Martín', 'Cruz', 'Camera',
  'CUCS6908205F9', 'CUCS690820HVZRMM01', '67896960605', DATE '1969-08-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'GSAPE'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Soporte a Proyectos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0013', 'Yesenia', 'Rosas', 'Rogel',
  'RORY830520DWA', 'RORY830520MVZSGS00', '67068303535', DATE '1983-05-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente Ventas Sur'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0014', 'Guillermo', 'Sánchez', 'Escobar',
  'SAEG8603227SA', 'SAEG860322HOCNSL06', '67088601272', DATE '1986-03-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente Ventas Istmo'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0015', 'Erick', 'Hernández', 'Rueda',
  'HERE860806PZ9', 'HERE860806HVZRDR04', '67098617219', DATE '1986-08-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Sub-Gerente de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0016', 'Adrián José', 'Rodríguez', 'Hernández',
  'ROHA860109TD3', 'ROHA860109HVZDRD05', '67038516158', DATE '1986-01-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Frente CT1',
  DATE '2021-06-01', 'ACTIVO', 'Vigente SIL-3',
  '9222141194', '9222241996', 'adrianjose1986@hotmail.com'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0017', 'Alan Armando', 'Montiel', 'Rodríguez',
  'MORA020920APA', 'MORA020920HVZNDLA0', '86170227424', DATE '2002-09-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Tecnología & Redes',
  DATE '2023-08-01', 'ACTIVO', 'DC-3 Vigente',
  '9242429732', '9222241996', 'alan.montiel@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de TI Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0018', 'Aldo Carlos', 'Pérez', 'Sánchez',
  'PESA9310073N2', 'PESA931007HVZRNL09', '67119316544', DATE '1993-10-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Alfa SIL-3',
  DATE '2022-05-15', 'ACTIVO', 'Vigente SIL-3',
  '9211013573', '9222241996', 'aldo.perez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de servicios senior'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0019', 'Alejandra', 'Arias', 'Rodríguez',
  'AIRA960312B69', 'AIRA960312MTCRDL08', '66169612315', DATE '1996-03-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar administrativo Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0020', 'Alejandra', 'Sujias', 'Ricardez',
  'SURA841202IB0', 'SURA841202MTCJCL03', '83088420902', DATE '1984-12-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0021', 'Alejandra', 'Sujías', 'Ricardez',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Administración en Campo',
  DATE '2023-01-10', 'ACTIVO', 'DC-3 Vigente',
  '9331174872', '9222241996', 'alejandra.sujias@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0022', 'Alessandra', 'González', 'Flores',
  'GOFA011022HY8', 'GOFA011022MVZNLLA6', '18160108777', DATE '2001-10-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0023', 'Alexander', 'Cruz', 'Pesado',
  'CUPA020220IX4', 'CUPA020220HVZRSLA8', '07160280769', DATE '2002-02-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0024', 'Alfonso', 'Gutiérrez', 'Vázquez',
  'GUVA761026PF6', 'GUVA761026HTCTZL06', '83937608210', DATE '1976-10-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0025', 'Álvaro', 'Fuentes', 'Zamudio',
  'FUZA770219SY5', 'FUZA770219HTCNML01', '83977706593', DATE '1977-02-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0026', 'Amado', 'Reyes', 'Peña',
  'REPA770913AR5', 'REPA770913HOCYXM15', '67957757684', DATE '1977-09-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0027', 'Ana Belén', 'Alcudia', 'Córdova',
  'AUCA9411024V2', 'AUCA941102MTCLRN08', '08149430186', DATE '1994-11-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0028', 'Ángel Emmanuel', 'Medina', 'Lazaro',
  'MELA0312311VA', 'MELA031231HVZDZNA4', '18190366916', DATE '2003-12-31',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0029', 'Antonio', 'Gómez', 'Cruz',
  'GOCA981009UQ3', 'GOCA981009HTCMRN03', '18139854907', DATE '1998-10-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'VHA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0030', 'Arantza', 'Lázaro', 'Loya',
  'LALA981125ES0', 'LALA981125MVZZYR08', '05179821516', DATE '1998-11-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0031', 'Arcadio', 'Torres', 'Domínguez',
  'TODA710112Q90', 'TODA710112HVZRMR09', '67997101919', DATE '1971-01-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0032', 'Arely', 'Santiago', 'Mayo',
  'SAMA9104123Y1', 'SAMA910412MVZNYR00', '67129124524', DATE '1991-04-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0033', 'Arem Estefanía', 'López', 'Sánchez',
  'LOSA990928C26', 'LOSA990928MQRPNR00', '81169970977', DATE '1999-09-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0034', 'Armando', 'Alfonso', 'Cruz',
  'AOCA031111HRA', 'AOCA031111HVZLRRA5', '64180317527', DATE '2003-11-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0035', 'Aurelio', 'Palacios', 'Xolo',
  'PAXA711015K48', 'PAXA711015HVZLLR01', '67897158175', DATE '1971-10-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Almacén & Procura',
  DATE '2022-08-10', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'aurelio.palacios@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Gerente de Compras'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0036', 'Basilio', 'Mendoza', 'Ramírez',
  'MERB900105CT3', 'MERB900105HVZNMS05', '67109044270', DATE '1990-01-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de proyecto Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0037', 'Bryan Antonio', 'Vielma', 'Lazcarez',
  'VILB0608306V0', 'VILB060830HVZLZRA2', '18230652218', DATE '2006-08-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de almacén'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0038', 'Bryan Paul', 'Rodríguez', 'Santiago',
  'ROSB050412GE8', 'ROSB050412HVZDNRA8', '18210528289', DATE '2005-04-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0039', 'Carlos Alberto', 'Hernández', 'Córdova',
  'HECC830605LA4', 'HECC830605HVZRRR00', '83028416333', DATE '1983-06-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0040', 'Carlos Alberto', 'Reyes', 'Ramírez',
  'RERC840908CX0', 'RERC840908HVZYMR02', '67078402475', DATE '1984-09-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Andamiero'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0041', 'Carlos Alberto', 'Tun', 'Culebro',
  'TUCC9010144H8', 'TUCC901014HVZNLR08', '19159016625', DATE '1990-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Staff Central',
  DATE '2023-02-01', 'ACTIVO', 'DC-3 Acreditado',
  NULL, NULL, 'tunccarlos14@gmail.com'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Generalista de Recursos Humanos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0042', 'Carlos', 'Lázaro', 'Fidencio',
  'LAFC810831NW8', 'LAFC810831HVZZDR08', '67968152537', DATE '1981-08-31',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de definición de soluciones'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0043', 'César', 'González', 'Fuentes',
  'GOFC9608091W3', 'GOFC960809HTCNNS02', '66159650366', DATE '1996-08-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico especialista jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0044', 'Cesar Iván', 'Izquierdo', 'Hernández',
  'IUHC9211165X9', 'IUHC921116HVZZRS03', '67119230182', DATE '1992-11-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0045', 'Christian del Carmen Pérez', 'de los', 'Santos',
  'PESC9407109H0', 'PESC940710HTCRNH04', '63169414354', DATE '1994-07-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0046', 'Citlali Astrid', 'Sánchez', 'Martínez',
  'SAMC0004158H2', 'SAMC000415MVZNRTA4', '38180079675', DATE '2000-04-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de TI Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0047', 'Cristian Noel', 'Murillo', 'Rosado',
  'MURC9902282WA', 'MURC990228HVZRSR06', '82169936281', DATE '1999-02-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0049', 'Daisy', 'Ortíz', 'López',
  'OILD8212031Q0', 'OILD821203MVZRPS07', '78038219362', DATE '1982-12-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'CAL'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ing. de Calidad Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0050', 'Daniel', 'De León', 'López',
  'LELD810422TQA', 'LELD810422HVZNPN02', '78968172409', DATE '1981-04-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de productos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0051', 'Daniel', 'Trujillo', 'Palma',
  'TUPD891014550', 'TUPD891014HTCRLN04', '03178955633', DATE '1989-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0052', 'Daniela', 'Calderón', 'Domínguez',
  'CADD850624C94', 'CADD850624MVZLMN04', '67098510943', DATE '1985-06-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Nominista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0053', 'Darany Sinaí', 'González', 'Pascual',
  'GOPD970721ML7', 'GOPD970721MVZNSR02', '28169724797', DATE '1997-07-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0054', 'Dariana', 'Rogel', 'Borja',
  'ROBD001019SS3', 'ROBD001019MVZGRRA5', '38190020503', DATE '2000-10-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0055', 'Dendra Kein Betsaida Jiménez', 'De la', 'Cruz',
  'JICD900612IQ5', 'JICD900612MTCMRN06', '05159076628', DATE '1990-06-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0056', 'Diana Itzel', 'Méndez', 'Martínez',
  'MEMD9510272T9', 'MEMD951027MVZNRN01', '09169573285', DATE '1995-10-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0057', 'Dionicio', 'Guzmán', 'Quevedo',
  'GUQD860805MB4', 'GUQD860805HTCZVN00', '83058643442', DATE '1986-08-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Signatario de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0058', 'Edgar', 'Martínez', 'Hilario',
  'MAHE8010268E4', 'MAHE801026HVZRLD05', '67048003742', DATE '1980-10-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Coordonador de volumetrías'
LEFT JOIN core.sedes sed    ON sed.codigo = 'TEX'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0059', 'Eduardo Javier', 'Pérez', 'Torres',
  'PETE9210144C7', 'PETE921014HVZRRD07', '05169251005', DATE '1992-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0060', 'Eduardo', 'Organista', 'Chigo',
  'OACE870428SS0', 'OACE870428HVZRHD06', '65108720353', DATE '1987-04-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0061', 'Eduardo', 'Vidaña', 'García',
  'VIGE920509NJ3', 'VIGE920509HVZDRD02', '67129239124', DATE '1992-05-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0062', 'Elodia Nayeli', 'Flores', 'Juárez',
  'FOJE941014EL9', 'FOJE941014MTCLRL07', '22169400557', DATE '1994-10-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'HUI'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0063', 'Erick Daniel', 'García', 'Olán',
  'GAOE9311127M7', 'GAOE931112HTCRLR00', '81139317077', DATE '1993-11-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0064', 'Esbehidy del Carmen', 'Medina', 'Lázaro',
  'MELE000716TR3', 'MELE000716MVZDZSA7', '34160081138', DATE '2000-07-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Comprador Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'SPM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0065', 'Estefany Michelle De los', 'Santos', 'Pérez',
  'SAPE990608KT1', 'SAPE990608MVZNRS01', '51169924571', DATE '1999-06-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de servicios Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0067', 'Evelin', 'Vargas', 'Ambrosio',
  'VAAE971010NR7', 'VAAE971010MPLRMV07', '30169772800', DATE '1997-10-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0068', 'Fabián', 'Aguilar', 'Arias',
  'AUAF890423LLA', 'AUAF890423HTCGRB05', '83148900042', DATE '1989-04-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Técnico Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0069', 'Fortino', 'Osorio', 'Ricárdez',
  'OORF9611178W5', 'OORF961117HVZSCR09', '43169604865', DATE '1996-11-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de servicios Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0070', 'Francisco Javier', 'Mayo', 'Reyes',
  'MARF000608N35', 'MARF000608HVZYYRA8', '61160087302', DATE '2000-06-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0071', 'Freddy', 'Cruz', 'Antonio',
  'CUAF970509VA4', 'CUAF970509HVZRNR07', '24169756780', DATE '1997-05-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de servicios Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0073', 'Gabriel', 'Pérez', 'Aguilar',
  'PEAG911103PW0', 'PEAG911103HVZRGB02', '67109131978', DATE '1991-11-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0074', 'Giezell Daraly', 'Jimenez', 'Torres',
  'JITG990205G88', 'JITG990205MPLMRZ08', '05139922941', DATE '1999-02-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Medición Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0075', 'Giovanni Aldahir', 'Martínez', 'Sánchez',
  'MASG991217UK9', 'MASG991217HVZRNV06', '02229983859', DATE '1999-12-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0076', 'Guillermo', 'Lara', 'Menéndez',
  'LAMG8201263X1', 'LAMG820126HVZRNL06', '67068208601', DATE '1982-01-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento SS'
LEFT JOIN core.sedes sed    ON sed.codigo = 'TBL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0077', 'Guiucepe Alberto', 'Villavicencio', 'López',
  'VILG950613HX4', 'VILG950613HVZLPC07', '67129511191', DATE '1995-06-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0078', 'Hector de Jesús', 'Santiago', 'Sosa',
  'SASH000816SK9', 'SASH000816HVZNSCA4', '03200050163', DATE '2000-08-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0079', 'Hiram Lugardo', 'Daza', 'Martínez',
  'DAMH770121QZ8', 'DAMH770121HVZZRR08', '67937750999', DATE '1977-01-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0080', 'Humberto', 'Avalos', 'González',
  'AAGH851004KY8', 'AAGH851004HTCVNM08', '83058514817', DATE '1985-10-04',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0081', 'Humberto', 'Ripoll', 'Hernández',
  'RIHH820823986', 'RIHH820823HVZPRM06', '67068222685', DATE '1982-08-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'QRO'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0082', 'Indra Fabiola', 'Anastacio', 'Lozada',
  'AALI0103036J4', 'AALI010303MVZNZNA7', '02260116146', DATE '2001-03-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0083', 'Carlos', 'Hernández', NULL,
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Operaciones F&G',
  DATE '2023-09-04', 'ACTIVO', 'DC-3 Acreditado',
  NULL, NULL, 'carlos.hernandez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico en Detección de Gas'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MAP'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0084', 'Fernando', 'Alarcón', 'Paz',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Regional Centro',
  DATE '2023-01-15', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'fernando.alarcon@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Mantenimiento & Redes'
LEFT JOIN core.sedes sed    ON sed.codigo = 'XAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0085', 'Roberto', 'Méndez', 'Cruz',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Bravo (Base Operativa)',
  DATE '2024-09-18', 'ACTIVO', 'Por Renovar',
  NULL, NULL, 'roberto.mendez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'MCP'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Especialista en Automatización & Control'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0086', 'Ingrid Brigitte', 'Vidal', 'Vitales',
  'VIVI950910521', 'VIVI950910MTCDTN04', '05199558312', DATE '1995-09-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Estimacionista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0087', 'Irving José', 'Pineda', 'Hernández',
  'PIHI90112893A', 'PIHI901128HVZNRR06', '25149059690', DATE '1990-11-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0088', 'Isaac', 'Ángeles', 'Caraveo',
  'AECI020310KM6', 'AECI020310HHGNRSA6', '54170267774', DATE '2002-03-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0089', 'Isaac', 'Martínez', 'Cruz',
  'MACI020414QR8', 'MACI020414HVZRRSA1', '56170273611', DATE '2002-04-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0090', 'Israel', 'Garrido', 'Reyes',
  'GARI961121228', 'GARI961121HVZRYS05', '67139606742', DATE '1996-11-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Soldador Ss.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0091', 'Israel Joshua', 'Landero', 'Carrera',
  'LACI911019RU2', 'LACI911019HVZNRS08', '14169147833', DATE '1991-10-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0092', 'Iván Javier', 'Gutiérrez', 'Balcázar',
  'GUBI000208E60', 'GUBI000208HVZTLVA9', '19180088866', DATE '2000-02-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
) -- CURP origen "AAOJ070928HTCLSRAO" omitida por formato inválido (corregir en captura)
SELECT
  'SFG-0093', 'Jared Joel', 'Álvarez', 'Osorio',
  'AAOJ0709284K5', NULL, '08260790418', NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CAN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0094', 'Jason', 'Ramírez', 'Luna',
  'RALJ010628VD9', 'RALJ010628HVZMNSA9', '10150141975', DATE '2001-06-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0095', 'Jazmín Lizette', 'González', 'Martínez',
  'GOMJ980725Q80', 'GOMJ980725MVZNRZ07', '54169846463', DATE '1998-07-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0096', 'Jeannete Ivonne', 'Macías', 'Ovando',
  'MAOJ8106037J9', 'MAOJ810603MVZCVN08', '67068106615', DATE '1981-06-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Comprador Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0097', 'Jesús Alberto', 'Ruíz', 'Martínez',
  'RUMJ981226DT9', 'RUMJ981226HVZZRS09', '42169891365', DATE '1998-12-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0098', 'Jesús Elías', 'Rivera', 'Jiménez',
  'RIJJ790213DN4', 'RIJJ790213HVZVMS06', '83037907603', DATE '1979-02-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ing. De Servicios'
LEFT JOIN core.sedes sed    ON sed.codigo = 'VHA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0099', 'Jesús Enrique', 'Santos', 'Valera',
  'SAVJ010309EU5', 'SAVJ010309HVZNLSA2', '49190122488', DATE '2001-03-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0100', 'Jesús Miguel', 'Esteva', 'Domínguez',
  'EEDJ9305032N9', 'EEDJ930503HVZSMS04', '67129330089', DATE '1993-05-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0101', 'Jesús', 'Navarro', 'Pérez',
  'NAPJ951006K47', 'NAPJ951006HVZVRS03', '09169589364', DATE '1995-10-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico especialista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0102', 'Jesús Rogelio', 'Hernández', 'Magaña',
  'HEMJ901030MG1', 'HEMJ901030HTCRGS02', '02179075359', DATE '1990-10-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JDM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0103', 'Jesús Uriel', 'García', 'Nazario',
  'GANJ030114A9A', 'GANJ030114HVZRZSA6', '11160370992', DATE '2003-01-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0104', 'Jonatan', 'Rodríguez', 'Martínez',
  'ROMJ880628AM2', 'ROMJ880628HVZDRN08', '67078810941', DATE '1988-06-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Andamiero'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0105', 'Jonathan', 'Cruz', 'Rogel',
  'CURJ910414DS8', 'CURJ910414HVZRGN06', '18149164107', DATE '1991-04-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0106', 'Jorge', 'Cruz', 'Salazar',
  'CUSJ9512237K5', 'CUSJ951223HVZRLR02', '05159549723', DATE '1995-12-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0107', 'Jorge Noé', 'Pérez', 'Zepahua',
  'PEZJ881117B53', 'PEZJ881117HVZRPR07', '02168808067', DATE '1988-11-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico especialista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0108', 'Jorge Rafael', 'Contreras', 'Canto',
  'COCJ8408059H1', 'COCJ840805HVZNNR08', '83128401292', DATE '1984-08-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Estimacionista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0109', 'José Adrián', 'Velasco', 'Bartolo',
  'VEBA990518N57', 'VEBA990518HVZLRD08', '84169907023', DATE '1999-05-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0110', 'José Alberto', 'López', 'Roldán',
  'LORA8601124K5', 'LORA860112HVZPLL07', '67068616985', DATE '1986-01-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0111', 'José Ángel', 'Castillejos', 'Cruz',
  'CACX011101326', 'CACX011101HVZSRNA7', '52190147414', DATE '2001-11-01',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Chofer'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0112', 'José Antonio', 'González', 'Fuentes',
  'GOFA920521B93', 'GOFA920521HTCNNN07', '19149229890', DATE '1992-05-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de ingeniería Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0113', 'José', 'Arias', 'Córdova',
  'AICJ970927NU6', 'AICJ970927HTCRRS01', '68169702450', DATE '1997-09-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CEN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0114', 'José Carlos', 'Rosas', 'Rogel',
  'RORC870410MW5', 'RORC870410HVZSGR07', '67068731230', DATE '1987-04-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Jefe de Taller'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0115', 'José Eduardo', 'Pérez', 'Jiménez',
  'PEJE970909HW0', 'PEJE970909HVZRMD00', '26179799114', DATE '1997-09-09',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante general'
LEFT JOIN core.sedes sed    ON sed.codigo = 'CAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0116', 'José Eduardo', 'Tenorio', 'Villalobos',
  'TEVE9608133Z6', 'TEVE960813HVZNLD07', '03159644941', DATE '1996-08-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0117', 'José Leonardo', 'Márquez', 'Girón',
  'MAGL7505137Q6', 'MAGL750513HOCRRN04', '75957519160', DATE '1975-05-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0118', 'José Roberto', 'Collado', 'Jiménez',
  'COJR940911LS1', 'COJR940911HTCLMB05', '62169474178', DATE '1994-09-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'NAC'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0119', 'Josué', 'Torres', 'Cadena',
  'TOCJ831013RY1', 'TOCJ831013HVZRDS03', '67058317057', DATE '1983-10-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0120', 'Juan Carlos', 'Méndez', 'Pablo',
  'MEPJ890913AA4', 'MEPJ890913HTCNBN04', '83058900792', DATE '1989-09-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'HUI'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0121', 'Juan Carlos', 'Solano', 'Dector',
  'SODJ861018F29', 'SODJ861018HVZLCN08', '67098600801', DATE '1986-10-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'ORI'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0122', 'Juan Pablo', 'Casas', 'Mendoza',
  'CAMJ960706PH8', 'CAMJ960706HVZSNN00', '11169696140', DATE '1996-07-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0123', 'Juan', 'Pérez', 'Castro',
  'PECJ860521PI5', 'PECJ860521HVZRSN02', '67058607549', DATE '1986-05-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0124', 'Karla Lizeth', 'Lozano', 'Alajara',
  'LOAK991110487', 'LOAK991110MVZZLR07', '14139958483', DATE '1999-11-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0125', 'Kevin Alfredo', 'Álvarez', 'Santiago',
  'AASK980131P65', 'AASK980131HVZLNV07', '60169815655', DATE '1998-01-31',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0126', 'Kevin Elián', 'Alejandro', 'Martínez',
  'AEMK000410UL9', 'AEMK000410HTCLRVA5', '63150061255', DATE '2000-04-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de obra jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0127', 'Leonardo', 'Reyes', 'Luría',
  'RELL711214LY4', 'RELL711214HVZYRN04', '67887170701', DATE '1971-12-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'OTE'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0128', 'Leticia Andrea', 'Silva', 'Luna',
  'SILL831130B83', 'SILL831130MVZLNT04', '67068308948', DATE '1983-11-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0129', 'Mariana', 'Valdez', 'Soto',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Rama Capacitación',
  DATE '2024-09-01', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'mariana.valdez@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Analista de Capacitación & Anexos'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0130', 'Lilian Vanessa', 'Alcántara', 'Saviñón',
  'AASL0205248X3', 'AASL020524MCHLVLA6', '49170245754', DATE '2002-05-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar administrativo Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0131', 'Lorena', 'Hernández', 'Vázquez',
  'HEVL82082548A', 'HEVL820825MVZRZR04', '67048208234', DATE '1982-08-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0132', 'Lorenzo Antonio', 'Rosas', 'Galindo',
  'ROGL700604GAA', 'ROGL700604HVZSLR01', '67057003542', DATE '1970-06-04',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0133', 'Luis Adrian', 'Vazquez', 'Villagran',
  'VAVL880612EZ0', 'VAVL880612HVZZLS00', '03238838159', DATE '1988-06-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0134', 'Luis Alberto', 'Córdova', 'Martínez',
  'COML881101FS2', 'COML881101HTCRRS07', '83138813072', DATE '1988-11-01',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Proyecto Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0135', 'Luis Alberto', 'Pérez', 'Martínez',
  'PEML840416DH0', 'PEML840416HTCRRS08', '83018402111', DATE '1984-04-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0136', 'Luis Alberto Tosca', 'De La', 'O',
  'TOOL8505077A0', 'TOOL850507HTCSXS09', '83128500556', DATE '1985-05-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JDM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0137', 'Luis Antonio', 'Trinidad', 'Cruz',
  'TICL0411182X7', 'TICL041118HVZRRSA5', '25230413277', DATE '2004-11-18',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'IXH'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0138', 'Luis de Jesús', 'Salomón', 'Barrientos',
  'SABL021210338', 'SABL021210HVZLRSA7', '28160284536', DATE '2002-12-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0139', 'Luis Fernando', 'Vázquez', 'Torres',
  'VATL940723TD6', 'VATL940723HTCZRS00', '19169404811', DATE '1994-07-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Estimacionista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0140', 'Luis Pablo', 'Santiago', 'Morales',
  'SAML980620128', 'SAML980620HVZNRS05', '43169868130', DATE '1998-06-20',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0141', 'Luz Deneth', 'Morales', 'Vazquez',
  'MOVL0306122K9', 'MOVL030612MVZRZZA1', '68180378348', DATE '2003-06-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0142', 'Manuel Jair', 'Jiménez', 'Ricardez',
  'JIRM000702P38', 'JIRM000702HVZMCNA6', '61160049278', DATE '2000-07-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0143', 'Marcos Kevin', 'Guillen', 'Martínez',
  'GUMM991119DC8', 'GUMM991119HVZLRR09', '78169997877', DATE '1999-11-19',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'JAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0144', 'María Trinidad', 'González', 'Hernández',
  'GOHT8510066Y6', 'GOHT851006MTCNRR03', '02198592822', DATE '1985-10-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0145', 'Marlene Saraí', 'Alonso', 'Rodríguez',
  'AORM930128B35', 'AORM930128MOCLDR05', '03169340670', DATE '1993-01-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Definición de Soluciones Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0146', 'Martín', 'Hernández', 'Zarrategui',
  'HEZM771111GB5', 'HEZM771111HVZRRR07', '67957791972', DATE '1977-11-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0147', 'Marylib De La Paz Guadalupe', 'Aguilar', 'Pacheco',
  'AUPM980616623', 'AUPM980616MVZGCR09', '05189839961', DATE '1998-06-16',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0148', 'Mayra Ixchel', 'González', 'Jara',
  'GOJM880503NN2', 'GOJM880503MVZNRY07', '05158899616', DATE '1988-05-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Comprador Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0149', 'Miguel', 'Hernández', 'Camero',
  'HECM85100747A', 'HECM851007HTCRMG08', '02218532576', DATE '1985-10-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicio Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0150', 'Miguel Jesús', 'Maldonado', 'Ruiz',
  'MARM020927IY0', 'MARM020927HVZLZGA5', '38170246888', DATE '2002-09-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0151', 'Misael', 'Sánchez', 'González',
  'SAGM8602124KA', 'SAGM860212HVZNNS02', '67088615082', DATE '1986-02-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'TEX'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0152', 'Sofía', 'Morales', 'Ruiz',
  NULL, NULL, NULL, NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, 'Cuadrilla Alfa (Almacén Principal)',
  DATE '2022-09-12', 'ACTIVO', 'Certificación Vigente',
  NULL, NULL, 'sofia.morales@sifygsa.com.mx'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Coordinadora de Seguridad & Normatividad'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0153', 'Natanael', 'Domínguez', 'Pérez',
  'DOPN860714D38', 'DOPN860714HVZMRT09', '67068635647', DATE '1986-07-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'OTE'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0154', 'Octavio', 'Bartolo', 'Antonio',
  'BAAO7201273C2', 'BAAO720127HVZRNC05', '67897255179', DATE '1972-01-27',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Tubero Eléctrico Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0156', 'Omar Jaziel', 'Martínez', 'Martínez',
  'MAMX910205KZ2', 'MXMO910205HVZRRM09', '67079103684', DATE '1991-02-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0157', 'Oscar', 'Alor', 'Prieto',
  'AOPO0305171F3', 'AOPO030517HVZLRSA7', '35210301335', DATE '2003-05-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0158', 'Oscar De Jesús', 'Tepox', 'Cocuyo',
  'TECO9206064Z7', 'TECO920606HVZPCS02', '67089203680', DATE '1992-06-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0159', 'Oscar Guillermo', 'Posada', 'Bolan',
  'POBO921122BW7', 'POBO921122HVZSLS01', '02169278476', DATE '1992-11-22',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0160', 'Osvaldo Arath', 'Rafael', 'López',
  'RALO030425T19', 'RALO030425HVZFPSA5', '49210352065', DATE '2003-04-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0161', 'Pablo Alejandro', 'López', 'Hernández',
  'LOHP0007134M9', 'LOHP000713HTCPRBA8', '04130066469', DATE '2000-07-13',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0162', 'Pedro Josué', 'Benitez', 'Parada',
  'BEPP8906258K2', 'BEPP890625HVZNRD06', '67118922144', DATE '1989-06-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0163', 'Porfirio Alberto', 'Luna', 'Magaña',
  'LUMP910124HW1', 'LUMP910124HTCNGR06', '83119105340', DATE '1991-01-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor HSE Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0164', 'Rigoberto Javier', 'De la', 'cruz',
  'JACR000705MV8', 'JACR000705HTCVRGA6', '83150026256', DATE '2000-07-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Cadista Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0165', 'Roberto Carlos', 'Lara', 'Torres',
  'LATR80033088A', 'LATR800330HVZRRB06', '67018018100', DATE '1980-03-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0166', 'Roberto Carlos', 'Méndez', 'Santiago',
  'MESR8404118U0', 'MESR840411HTCNNB07', '83058411451', DATE '1984-04-11',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0167', 'Rodolfo', 'Zapata', NULL,
  'ZARO740326FP7', 'ZAXR740326HVZPXD00', '67927460906', DATE '1974-03-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0168', 'Rómulo Enrique', 'Peña', 'Gilson',
  'PEGR7108243W6', 'PEGR710824HNEXLM02', '02187185372', DATE '1971-08-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
) -- CURP origen "RARL750921HVZMPS1O" omitida por formato inválido (corregir en captura)
SELECT
  'SFG-0169', 'Rusbel', 'Ramos', 'López',
  'RARL750921DM5', NULL, '67957556151', NULL,
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0170', 'Ruth Abigail', 'Joachin', 'Prieto',
  'JOPR840926J53', 'JOPR840926MVZCRT02', '67068419810', DATE '1984-09-26',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0171', 'Rutilo Pérez', 'De la', 'Cruz',
  'PECR890905G20', 'PECR890905HTCRRT09', '83108926904', DATE '1989-09-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0172', 'Salvador Alberto De la', 'Cruz', 'Alcudia',
  'CUAS031006PY2', 'CUAS031006HTCRLLA2', '26170351220', DATE '2003-10-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0173', 'Salvador Iván', 'Gómez', 'Guerrero',
  'GOGS780606IP9', 'GOGS780606HVZMRL03', '67067806215', DATE '1978-06-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Logística'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0174', 'Salvador', 'Patraca', 'Ramírez',
  'PARS961223US9', 'PARS961223HVZTML07', '13169684654', DATE '1996-12-23',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Técnico de Servicios Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0175', 'Santiago', 'Fuentes', 'Cruz',
  'FUCS710724RB9', 'FUCS710724HVZNRN00', '67897157870', DATE '1971-07-24',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Vigilante'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0176', 'Sebastián', 'Preciado', 'Alvarado',
  'PEAS970602IN1', 'PEAS970602HVZRLB05', '29169767992', DATE '1997-06-02',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Ventas Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0177', 'Sergio', 'Arias', 'Domínguez',
  'AIDS890506983', 'AIDS890506HTCRMR03', '83088948449', DATE '1989-05-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ayudante Eléctrico'
LEFT JOIN core.sedes sed    ON sed.codigo = 'PAR'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0178', 'Sergio', 'Arias', 'Montejo',
  'AIMS760930B92', 'AIMS760930HTCRNR08', '83917617819', DATE '1976-09-30',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de Obra Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0179', 'Sergio', 'Del Campo', 'Yzquierdo',
  'CAYS9406149C5', 'CAYS940614HTCMZR03', '10189448177', DATE '1994-06-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Estimacionista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0180', 'Sheyla Irais', 'Troncoso', 'Vidal',
  'TOVS900806RA6', 'TOVS900806MVZRDH01', '67099011875', DATE '1990-08-06',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar de RRHH Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0181', 'Uriel Eduardo', 'Gerónimo', 'Dionisio',
  'GEDU9501176B5', 'GEDU950117HTCRNR02', '08169503623', DATE '1995-01-17',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de Diseño Jr.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'VHA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0182', 'Uriel Isaí', 'Cruz', 'Cancino',
  'CUCU001228631', 'CUCU001228HVZRNRA2', '23160048049', DATE '2000-12-28',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Laminador'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0183', 'Víctor Iván', 'Hernández', 'Castelan',
  'HECV940710T17', 'HECV940710HVZRSC01', '67139429178', DATE '1994-07-10',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de volumetrías Trainee'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0184', 'Víctor Manuel', 'Alegría', 'Palacios',
  'AEPV780412JI5', 'AEPV780412HVZLLC01', '67067801810', DATE '1978-04-12',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Ingeniero de volumetrías Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0185', 'Víctor Manuel', 'Zunun', 'Gómez',
  'ZUGV870605US1', 'ZUGV870605HVZNMC00', '67078735528', DATE '1987-06-05',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Líder de Contrato Sr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0186', 'Victoria', 'Broca', 'Rabanales',
  'BORV840108I5A', 'BORV840108MTCRBC04', '02258429006', DATE '1984-01-08',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Intendencia MSA'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0187', 'Viridiana', 'Cárdenas', 'Hernández',
  'CAHV920207MF7', 'CAHV920207MVZRRR03', '19169202280', DATE '1992-02-07',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar administrativo Jr'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COS'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0188', 'Waldo Isidro De La', 'Cruz', 'Ruíz',
  'CURW800521ALA', 'CURW800521HVZRZL05', '48068014793', DATE '1980-05-21',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Almacenista'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0189', 'Yesenia Yazbeth', 'Cruz', 'Salomón',
  'CUSY9303255X8', 'CUSY930325MVZRLS08', '03149377511', DATE '1993-03-25',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Supervisor de HSE Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'COA'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0190', 'Zaidel', 'Cruz', 'Martínez',
  'CUMZ8409039W4', 'CUMZ840903HVZRRD08', '32028447038', DATE '1984-09-03',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Encargado de Mantenimiento SS'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0191', 'Zimrry Tamar', 'Francisco', 'Reyes',
  'FARZ011115PM4', 'FARZ011115MOCRYMA2', '44160147656', DATE '2001-11-15',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar contable Ss'
LEFT JOIN core.sedes sed    ON sed.codigo = 'SOC'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, nombre_pila, apellido_paterno, apellido_materno,
  rfc, curp, nss, fecha_nacimiento,
  id_empresa, id_departamento, id_sede, id_puesto, categoria_laboral,
  fecha_ingreso, estatus, acreditacion_sil,
  telefono_celular, telefono_fijo, correo_corporativo
)
SELECT
  'SFG-0192', 'Zurisadai', 'Castañeda', 'Hernández',
  'CAHZ020814KI8', 'CAHZ020814MVZSRRA5', '54170235870', DATE '2002-08-14',
  emp.id_empresa, dep.id_departamento, sed.id_sede, pue.id_puesto, NULL,
  DATE '2026-11-20', 'ACTIVO', 'En Trámite',
  NULL, NULL, NULL
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
JOIN rrhh.cat_puestos pue   ON pue.nombre = 'Auxiliar Administrativo Jr.'
LEFT JOIN core.sedes sed    ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

-- 2. Enlace de jerarquía del Organigrama Corporativo (id_supervisor)
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0002' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0003' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0004' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0005' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0006' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0007' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0008' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0009' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0010' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0011' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0012' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0013' AND s.folio = 'SFG-0002';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0014' AND s.folio = 'SFG-0002';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0015' AND s.folio = 'SFG-0003';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0016' AND s.folio = 'SFG-0109';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0017' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0018' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0019' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0020' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0021' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0022' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0023' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0024' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0025' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0026' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0027' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0028' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0029' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0030' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0031' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0032' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0033' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0034' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0035' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0036' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0037' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0038' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0039' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0040' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0041' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0042' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0043' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0044' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0045' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0046' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0047' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0049' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0050' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0051' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0052' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0053' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0054' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0055' AND s.folio = 'SFG-0013';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0056' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0057' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0058' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0059' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0060' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0061' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0062' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0063' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0064' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0065' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0067' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0068' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0069' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0070' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0071' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0073' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0074' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0075' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0076' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0077' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0078' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0079' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0080' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0081' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0082' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0083' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0084' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0085' AND s.folio = 'SFG-0011';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0086' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0087' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0088' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0089' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0090' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0091' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0092' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0093' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0094' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0095' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0096' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0097' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0098' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0099' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0100' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0101' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0102' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0103' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0104' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0105' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0106' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0107' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0108' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0109' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0110' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0111' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0112' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0113' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0114' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0115' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0116' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0117' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0118' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0119' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0120' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0121' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0122' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0123' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0124' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0125' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0126' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0127' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0128' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0129' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0130' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0131' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0132' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0133' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0134' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0135' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0136' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0137' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0138' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0139' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0140' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0141' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0142' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0143' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0144' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0145' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0146' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0147' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0148' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0149' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0150' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0151' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0152' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0153' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0154' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0156' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0157' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0158' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0159' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0160' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0161' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0162' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0163' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0164' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0165' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0166' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0167' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0168' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0169' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0170' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0171' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0172' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0173' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0174' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0175' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0176' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0177' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0178' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0179' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0180' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0181' AND s.folio = 'SFG-0013';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0182' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0183' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0184' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0185' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0186' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0187' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0188' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0189' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0190' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0191' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0192' AND s.folio = 'SFG-0015';

-- 3. Asignar responsables oficiales (VIPSALeaders) a cada departamento
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'DIR'     AND e.folio = 'SFG-0001';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'VTA'     AND e.folio = 'SFG-0002';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'SRV'     AND e.folio = 'SFG-0003';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'ING'     AND e.folio = 'SFG-0004';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'COM'     AND e.folio = 'SFG-0005';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'HSE-MIN' AND e.folio = 'SFG-0006';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'CAL'     AND e.folio = 'SFG-0006';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'INF'     AND e.folio = 'SFG-0007';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'ADM'     AND e.folio = 'SFG-0008';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'RH'      AND e.folio = 'SFG-0009';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'HSE-COM' AND e.folio = 'SFG-0010';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'MCP'     AND e.folio = 'SFG-0011';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'GSAPE'   AND e.folio = 'SFG-0012';

-- 4. Enlazar Extensiones Telefónicas a su colaborador asignado por FK (sin texto redundante)
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '101' AND e.folio = 'SFG-0001';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '102' AND e.folio = 'SFG-0002';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '103' AND e.folio = 'SFG-0014';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '104' AND e.folio = 'SFG-0013';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '105' AND e.folio = 'SFG-0008';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '107' AND e.folio = 'SFG-0005';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '111' AND e.folio = 'SFG-0007';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '112' AND e.folio = 'SFG-0009';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '115' AND e.folio = 'SFG-0004';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '116' AND e.folio = 'SFG-0003';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '117' AND e.folio = 'SFG-0006';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '118' AND e.folio = 'SFG-0015';
UPDATE rrhh.extensiones_telefonicas x SET id_empleado_asignado = e.id_empleado FROM rrhh.empleados e WHERE x.extension = '119' AND e.folio = 'SFG-0010';

-- 5. Sincronizar contador de folios atómico al máximo cargado (SFG-0192 -> siguiente SFG-0193)
SELECT rrhh.fn_sincronizar_folio_empleados();

COMMIT;
