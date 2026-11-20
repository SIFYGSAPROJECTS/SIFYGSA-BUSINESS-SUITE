-- ============================================================================
-- database/postgres/01_core/01_domains.sql
-- Dominios globales reutilizables por todos los módulos (RRHH, Finanzas, CRM)
-- Compatibles 100% con Prisma Client (cada dominio envuelve su tipo base exacto)
-- ============================================================================

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
