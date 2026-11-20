-- ============================================================================
-- database/postgres/02_rrhh/02_tables.sql
-- Tablas normalizadas de Recursos Humanos
-- 100% tipadas con core.id_uuid (anti-IDOR) y dominios core.* / rrhh.*
-- ============================================================================

-- ── 1. Control Atómico de Folios (evita race conditions bajo alta concurrencia)
CREATE TABLE IF NOT EXISTS rrhh.control_folios (
  entidad         core.clave_sistema PRIMARY KEY, -- 'EMPLEADO', 'VACACION', 'SGI'
  prefijo         core.codigo_corto NOT NULL,     -- 'SFG', 'VAC', 'SGI'
  ultimo_numero   INTEGER NOT NULL DEFAULT 0 CHECK (ultimo_numero >= 0),
  longitud_min    SMALLINT NOT NULL DEFAULT 4 CHECK (longitud_min BETWEEN 3 AND 8),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Catálogos de RRHH (Bancos, Tipos de Contrato) ─────────────────────────
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

-- ── 3. Departamentos (Soporta siglas DIR..GSAPE, sedes y ramas hijas) ────────
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

-- ── 4. Empleados (Núcleo del ERP — Nombre separado + Organigrama + Soft Delete)
CREATE TABLE IF NOT EXISTS rrhh.empleados (
  id_empleado           core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio                 rrhh.folio_empleado NOT NULL UNIQUE, -- SFG-0001 (inmutable)
  id_empresa            core.id_uuid NOT NULL,
  id_departamento       core.id_uuid NOT NULL,
  id_puesto             core.id_uuid NULL,
  id_sede               core.id_uuid NULL,
  id_tipo_contrato      core.id_uuid NULL,
  id_supervisor         core.id_uuid NULL, -- Auto-relación para el Organigrama Corporativo

  -- Identidad separada (consultas exactas por nombre / apellidos)
  nombre_pila           core.nombre_corto NOT NULL,
  apellido_paterno      rrhh.apellido_dom NOT NULL DEFAULT '',
  apellido_materno      rrhh.apellido_dom NOT NULL DEFAULT '',
  nombre_completo       rrhh.nombre_completo_dom NOT NULL, -- Calculado por trigger
  iniciales             rrhh.iniciales_dom NOT NULL DEFAULT 'SF',
  avatar_color          core.color_hex NOT NULL DEFAULT '#1D4ED8',
  foto_url              TEXT NULL,

  -- Laboral y puesto
  puesto_texto          core.nombre_entidad NOT NULL DEFAULT 'Por definir',
  categoria_laboral     core.nombre_corto NULL,
  proyecto_asignado     core.nombre_entidad NULL,
  sueldo_mensual_bruto  core.monto_mxn NULL,
  fecha_ingreso         DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin_contrato    DATE NULL,
  fecha_baja            DATE NULL,
  estatus               rrhh.estatus_empleado NOT NULL DEFAULT 'ACTIVO',
  acreditacion_sil      core.nombre_corto NOT NULL DEFAULT 'En Trámite',
  acreditacion_tipo     rrhh.acreditacion_tipo NOT NULL DEFAULT 'info',

  -- Identificación oficial (únicos cuando existen y no están eliminados)
  rfc                   core.rfc_mx NULL,
  curp                  core.curp_mx NULL,
  nss                   rrhh.nss_mx NULL,
  fecha_nacimiento      DATE NULL,

  -- Contacto
  correo_corporativo    core.correo_electronico NULL,
  correo_personal       core.correo_electronico NULL,
  telefono_celular      core.telefono_mx NULL,
  telefono_fijo         core.telefono_mx NULL,
  extension_oficina     rrhh.extension_tel NULL,

  -- Domicilio estructurado
  calle                 core.nombre_entidad NULL,
  numero_exterior       core.num_domicilio NULL,
  numero_interior       core.num_domicilio NULL,
  colonia               core.nombre_entidad NULL,
  codigo_postal         core.codigo_postal_mx NULL,
  municipio             core.nombre_corto NULL,
  estado_domicilio      core.nombre_corto NULL,
  ubicacion_texto       core.nombre_entidad NULL,

  -- Contacto de emergencia
  emergencia_nombre     core.nombre_entidad NULL,
  emergencia_parentesco core.nombre_corto NULL,
  emergencia_telefono   core.telefono_mx NULL,

  -- Salud y EPP (Calzado MEX + Overol)
  tipo_sangre           rrhh.tipo_sangre NULL,
  talla_calzado_mex     rrhh.talla_calzado NULL,
  talla_overol          rrhh.talla_overol NULL,
  discapacidad          core.descripcion NULL,
  padecimientos         TEXT NULL,
  alergias              TEXT NULL,

  -- Estatus fiscal rápido y notas
  estatus_csf           rrhh.estatus_csf NOT NULL DEFAULT 'PENDIENTE',
  notas_contratacion    TEXT NULL,

  -- Auditoría y borrado lógico
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ NULL,

  CONSTRAINT fk_emp_empresa FOREIGN KEY (id_empresa)
    REFERENCES core.empresas(id_empresa)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_emp_departamento FOREIGN KEY (id_departamento)
    REFERENCES rrhh.departamentos(id_departamento)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_emp_puesto FOREIGN KEY (id_puesto)
    REFERENCES rrhh.cat_puestos(id_puesto)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_emp_sede FOREIGN KEY (id_sede)
    REFERENCES core.sedes(id_sede)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_emp_contrato FOREIGN KEY (id_tipo_contrato)
    REFERENCES rrhh.cat_tipos_contrato(id_tipo_contrato)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_emp_supervisor FOREIGN KEY (id_supervisor)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_emp_no_autosupervisor CHECK (id_supervisor IS NULL OR id_supervisor <> id_empleado),
  CONSTRAINT ck_emp_fechas_baja CHECK (fecha_baja IS NULL OR fecha_baja >= fecha_ingreso)
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

-- ── 5. Historial de Movimientos Laborales (Append-Only / Inmutable) ──────────
CREATE TABLE IF NOT EXISTS rrhh.historial_movimientos (
  id_movimiento        core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NOT NULL,
  tipo_movimiento      rrhh.tipo_movimiento NOT NULL,
  id_depto_anterior    core.id_uuid NULL,
  id_depto_nuevo       core.id_uuid NULL,
  puesto_anterior      core.nombre_entidad NULL,
  puesto_nuevo         core.nombre_entidad NULL,
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
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 6. Nómina / Cuenta Bancaria del Colaborador ──────────────────────────────
CREATE TABLE IF NOT EXISTS rrhh.cuentas_bancarias (
  id_cuenta            core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NOT NULL,
  id_banco             core.id_uuid NULL,
  banco_nombre         core.nombre_corto NOT NULL,
  alias                core.nombre_corto NOT NULL DEFAULT 'Nómina',
  clabe                core.clabe_mx NULL,
  numero_tarjeta       rrhh.num_tarjeta_mx NULL,
  es_principal         BOOLEAN NOT NULL DEFAULT TRUE,
  activa               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_cb_empleado FOREIGN KEY (id_empleado)
    REFERENCES rrhh.empleados(id_empleado)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cb_banco FOREIGN KEY (id_banco)
    REFERENCES rrhh.cat_bancos(id_banco)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 7. Expediente Digital por Subcarpetas (Documentos, Certificaciones, CV...)
CREATE TABLE IF NOT EXISTS rrhh.carpetas_expediente (
  id_carpeta           core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empleado          core.id_uuid NULL, -- NULL = carpeta estándar global
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
  id_carpeta           core.id_uuid NULL,
  carpeta_nombre       core.nombre_corto NOT NULL DEFAULT 'Documentos',
  categoria            core.nombre_corto NOT NULL,
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
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ── 8. Directorio de Extensiones Telefónicas ─────────────────────────────────
CREATE TABLE IF NOT EXISTS rrhh.extensiones_telefonicas (
  id_extension         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension            rrhh.extension_tel NOT NULL UNIQUE,
  etiqueta_area        core.nombre_entidad NOT NULL,
  id_departamento      core.id_uuid NOT NULL,
  id_sede              core.id_uuid NULL,
  id_empleado_asignado core.id_uuid NULL,
  asignado_texto       core.nombre_entidad NULL,
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

-- ── 9. Vacaciones (Formato SGI-FR-RH-07 / LFT México) ────────────────────────
CREATE TABLE IF NOT EXISTS rrhh.vacaciones_solicitudes (
  id_solicitud         core.id_uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_solicitud      rrhh.folio_documento NOT NULL UNIQUE,
  id_empleado          core.id_uuid NOT NULL,
  id_aprobador         core.id_uuid NULL,
  fecha_inicio         DATE NOT NULL,
  fecha_fin            DATE NOT NULL,
  dias_solicitados     rrhh.dias_vacaciones NOT NULL,
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
  CONSTRAINT ck_vac_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- ── 10. Formatos SGI (Requisiciones, Capacitaciones, Vales de No Adeudo) ─────
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

-- ── 11. Días Festivos y Agenda Operativa Semanal RRHH ────────────────────────
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
