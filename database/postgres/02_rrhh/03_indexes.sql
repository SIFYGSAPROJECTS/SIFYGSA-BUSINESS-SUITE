-- ============================================================================
-- database/postgres/02_rrhh/03_indexes.sql
-- Estrategia de Indexación para 10,000+ empleados (< 2ms en búsquedas)
-- ============================================================================

-- ── 1. Llaves únicas parciales en empleados activos (evita duplicados sin bloquear bajas históricas)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_emp_rfc_activo
  ON rrhh.empleados (UPPER(rfc))
  WHERE rfc IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_emp_curp_activo
  ON rrhh.empleados (UPPER(curp))
  WHERE curp IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_emp_nss_activo
  ON rrhh.empleados (regexp_replace(nss, '\D', '', 'g'))
  WHERE nss IS NOT NULL AND deleted_at IS NULL;

-- ── 2. Índices relacionales B-Tree (Joins de Directorio, Organigrama y Filtros)
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_departamento ON rrhh.empleados (id_departamento) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_sede         ON rrhh.empleados (id_sede)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_supervisor   ON rrhh.empleados (id_supervisor)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_estatus      ON rrhh.empleados (estatus)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_contrato_fin ON rrhh.empleados (fecha_fin_contrato)
  WHERE estatus = 'ACTIVO' AND fecha_fin_contrato IS NOT NULL;

-- Consultas específicas por nombre / apellidos (ej. buscar todos los "Alan" o apellido "Rodríguez")
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_nombre_pila      ON rrhh.empleados (LOWER(nombre_pila));
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_apellido_paterno ON rrhh.empleados (LOWER(apellido_paterno));
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_apellido_materno ON rrhh.empleados (LOWER(apellido_materno));

-- ── 3. Índices GIN con pg_trgm (Búsqueda rápida tipo Google en el Buscador del Directorio)
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_nombre_trgm
  ON rrhh.empleados USING gin (nombre_completo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_rrhh_emp_puesto_trgm
  ON rrhh.empleados USING gin (puesto_texto gin_trgm_ops);

-- ── 4. Índice funcional para módulo de Cumpleaños del Mes (sin full table scan)
CREATE INDEX IF NOT EXISTS idx_rrhh_emp_cumpleanos_mes_dia
  ON rrhh.empleados (EXTRACT(MONTH FROM fecha_nacimiento), EXTRACT(DAY FROM fecha_nacimiento))
  WHERE estatus = 'ACTIVO' AND fecha_nacimiento IS NOT NULL;

-- ── 5. Índices en tablas satélite (Historial, Nómina, Expediente, Vacaciones, SGI)
CREATE INDEX IF NOT EXISTS idx_rrhh_hm_empleado_fecha  ON rrhh.historial_movimientos (id_empleado, fecha_efecto DESC);
CREATE INDEX IF NOT EXISTS idx_rrhh_cb_empleado        ON rrhh.cuentas_bancarias (id_empleado);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rrhh_cb_principal ON rrhh.cuentas_bancarias (id_empleado)
  WHERE es_principal = TRUE AND activa = TRUE;

CREATE INDEX IF NOT EXISTS idx_rrhh_doc_empleado_carp  ON rrhh.documentos_expediente (id_empleado, carpeta_nombre);
CREATE INDEX IF NOT EXISTS idx_rrhh_doc_vencimiento    ON rrhh.documentos_expediente (fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rrhh_ext_departamento   ON rrhh.extensiones_telefonicas (id_departamento);
CREATE INDEX IF NOT EXISTS idx_rrhh_vac_empleado       ON rrhh.vacaciones_solicitudes (id_empleado, fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_rrhh_vac_estatus        ON rrhh.vacaciones_solicitudes (estatus);
CREATE INDEX IF NOT EXISTS idx_rrhh_sgi_codigo_estatus ON rrhh.formatos_sgi (codigo_formato, estatus);
CREATE INDEX IF NOT EXISTS idx_rrhh_sgi_datos_gin      ON rrhh.formatos_sgi USING gin (datos_formato);
CREATE INDEX IF NOT EXISTS idx_rrhh_agenda_fecha       ON rrhh.agenda_actividades (fecha, completada);
