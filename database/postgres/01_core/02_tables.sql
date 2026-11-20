-- ============================================================================
-- database/postgres/01_core/02_tables.sql
-- Tablas transversales de la suite ERP/CRM
-- 100% estandarizadas con core.id_uuid (anti-IDOR) y dominios core.*
-- ============================================================================

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
