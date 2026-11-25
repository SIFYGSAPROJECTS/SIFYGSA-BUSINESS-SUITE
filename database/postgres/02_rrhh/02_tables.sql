-- ============================================================================
-- database/postgres/02_rrhh/02_tables.sql
-- Tablas normalizadas (3FN) del módulo Recursos Humanos — SIFYGSA ERP
--
-- Principios aplicados:
--   1. Cero columnas derivadas o redundantes en tablas físicas:
--      - nombre_completo, iniciales y acreditacion_tipo se calculan en vistas.
--      - avatar_color pertenece solo a la capa UI (determinístico por folio).
--      - puesto, sede, banco, carpeta y empleado de extensión se referencian
--        únicamente por llave foránea (sin duplicar texto).
--   2. Orden exacto de columnas en rrhh.empleados alineado al flujo de Alta:
--      Etapa 1 (Datos Personales) -> Etapa 2 (Datos Laborales) ->
--      Etapa 3 (Contacto & Domicilio) -> Etapa 4 (Salud & Uniformes) ->
--      Etapa 5 (cuentas_bancarias) -> Etapa 6 (expediente digital + CSF).
--   3. Nulabilidad realista: obligatorios estrictos en NOT NULL; campos
--      requeridos en Alta Nueva pero ausentes en migraciones históricas del
--      Excel quedan NULL y se documentan como [OBLIGATORIO ALTA].
-- ============================================================================

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
