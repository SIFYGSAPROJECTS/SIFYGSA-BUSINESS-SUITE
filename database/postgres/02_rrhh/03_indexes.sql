-- ============================================================================
-- database/postgres/02_rrhh/03_indexes.sql
-- Funciones IMMUTABLE de búsqueda sin acentos + Índices para 10,000+ filas
-- Permite buscar sin importar mayúsculas ni acentos (< 2ms) SIN guardar
-- columnas redundantes como nombre_completo en disco.
-- ============================================================================

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
