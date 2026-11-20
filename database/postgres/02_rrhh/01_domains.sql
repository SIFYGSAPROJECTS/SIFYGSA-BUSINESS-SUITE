-- ============================================================================
-- database/postgres/02_rrhh/01_domains.sql
-- Dominios especializados del módulo Recursos Humanos (SIFYGSA)
-- ============================================================================

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

-- Identidad del colaborador
DO $$ BEGIN
  CREATE DOMAIN rrhh.apellido_dom AS VARCHAR(60);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.nombre_completo_dom AS VARCHAR(210);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.iniciales_dom AS VARCHAR(4)
    CONSTRAINT ck_rrhh_iniciales CHECK (VALUE ~ '^[A-ZÁÉÍÓÚÜÑ]{1,4}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NSS (IMSS): exactamente 11 dígitos numéricos
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

-- Código SPEI bancario (3 a 10 caracteres)
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

-- Talla de calzado MEX y overol EPP
DO $$ BEGIN
  CREATE DOMAIN rrhh.talla_calzado AS VARCHAR(10)
    CONSTRAINT ck_rrhh_talla_calzado CHECK (VALUE ~ '^[0-9]{2}(\.[05])?$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.talla_overol AS VARCHAR(6)
    CONSTRAINT ck_rrhh_talla_overol CHECK (
      VALUE IN ('XCH', 'CH', 'M', 'G', 'XG', '2XG', '3XG', '4XG')
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
  CREATE DOMAIN rrhh.acreditacion_tipo AS VARCHAR(15)
    CONSTRAINT ck_rrhh_acreditacion_tipo CHECK (
      VALUE IN ('success', 'warning', 'info')
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

-- Días de vacaciones y año de periodo
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

-- Metadatos de archivos digitales
DO $$ BEGIN
  CREATE DOMAIN rrhh.mime_type_dom AS VARCHAR(100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE DOMAIN rrhh.hora_texto_dom AS VARCHAR(20);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
