-- ============================================================================
-- database/postgres/02_rrhh/05_views.sql
-- Vistas de consulta optimizadas (Directorio, Organigrama Recursivo, KPIs)
-- ============================================================================

-- ── 1. Directorio Completo de Personal (consumida por el frontend/API) ───────
CREATE OR REPLACE VIEW rrhh.v_directorio_personal AS
SELECT
  e.id_empleado,
  e.folio,
  d.codigo                                 AS codigo_departamento,
  d.nombre                                 AS nombre_departamento,
  emp_org.nombre_corto                     AS empresa,
  COALESCE(s.nombre, e.ubicacion_texto)    AS sede,
  e.nombre_pila,
  e.apellido_paterno,
  e.apellido_materno,
  e.nombre_completo,
  e.iniciales,
  e.avatar_color,
  e.foto_url,
  e.puesto_texto                           AS puesto,
  e.categoria_laboral,
  tc.nombre                                AS tipo_contrato,
  e.sueldo_mensual_bruto,
  e.fecha_ingreso,
  e.fecha_fin_contrato,
  e.estatus,
  e.acreditacion_sil,
  e.acreditacion_tipo,
  e.rfc,
  e.curp,
  e.nss,
  e.tipo_sangre,
  e.talla_calzado_mex,
  e.talla_overol,
  e.correo_corporativo,
  e.correo_personal,
  e.telefono_celular,
  e.extension_oficina,
  sup.folio                                AS supervisor_folio,
  sup.nombre_completo                      AS supervisor_nombre,
  rrhh.fn_porcentaje_expediente(e.id_empleado) AS porcentaje_expediente,
  (SELECT COUNT(*) FROM rrhh.documentos_expediente doc WHERE doc.id_empleado = e.id_empleado) AS total_documentos
FROM rrhh.empleados e
JOIN core.empresas emp_org          ON emp_org.id_empresa = e.id_empresa
JOIN rrhh.departamentos d           ON d.id_departamento = e.id_departamento
LEFT JOIN core.sedes s              ON s.id_sede = e.id_sede
LEFT JOIN rrhh.cat_tipos_contrato tc ON tc.id_tipo_contrato = e.id_tipo_contrato
LEFT JOIN rrhh.empleados sup        ON sup.id_empleado = e.id_supervisor
WHERE e.deleted_at IS NULL;

-- ── 2. Organigrama Corporativo Recursivo (WITH RECURSIVE CTE) ────────────────
CREATE OR REPLACE VIEW rrhh.v_organigrama_corporativo AS
WITH RECURSIVE arbol AS (
  -- Raíz: Dirección General (sin supervisor)
  SELECT
    e.id_empleado,
    e.folio,
    e.nombre_completo,
    e.puesto_texto AS puesto,
    e.id_departamento,
    e.id_supervisor,
    e.foto_url,
    e.iniciales,
    e.avatar_color,
    COALESCE(s.nombre, e.ubicacion_texto) AS sede,
    0 AS nivel,
    ARRAY[e.folio::TEXT] AS ruta_folios,
    e.folio::TEXT AS ruta_texto
  FROM rrhh.empleados e
  LEFT JOIN core.sedes s ON s.id_sede = e.id_sede
  WHERE e.id_supervisor IS NULL
    AND e.estatus = 'ACTIVO'
    AND e.deleted_at IS NULL

  UNION ALL

  -- Ramas dependientes
  SELECT
    h.id_empleado,
    h.folio,
    h.nombre_completo,
    h.puesto_texto AS puesto,
    h.id_departamento,
    h.id_supervisor,
    h.foto_url,
    h.iniciales,
    h.avatar_color,
    COALESCE(s2.nombre, h.ubicacion_texto) AS sede,
    a.nivel + 1 AS nivel,
    a.ruta_folios || h.folio::TEXT,
    a.ruta_texto || ' > ' || h.folio::TEXT
  FROM rrhh.empleados h
  JOIN arbol a ON a.id_empleado = h.id_supervisor
  LEFT JOIN core.sedes s2 ON s2.id_sede = h.id_sede
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
  a.puesto,
  a.id_supervisor,
  a.foto_url,
  a.iniciales,
  a.avatar_color,
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
  e.nombre_completo,
  e.puesto_texto AS puesto,
  e.fecha_nacimiento,
  EXTRACT(DAY FROM e.fecha_nacimiento)::SMALLINT AS dia_cumpleanos,
  COALESCE(s.nombre, e.ubicacion_texto) AS sede
FROM rrhh.empleados e
JOIN rrhh.departamentos d ON d.id_departamento = e.id_departamento
LEFT JOIN core.sedes s    ON s.id_sede = e.id_sede
WHERE e.estatus = 'ACTIVO'
  AND e.deleted_at IS NULL
  AND e.fecha_nacimiento IS NOT NULL
  AND EXTRACT(MONTH FROM e.fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY EXTRACT(DAY FROM e.fecha_nacimiento), e.nombre_completo;

-- ── 4. Contratos Próximos a Vencer (próximos 30 días — KPI Menú Principal) ───
CREATE OR REPLACE VIEW rrhh.v_contratos_por_vencer AS
SELECT
  e.id_empleado,
  e.folio,
  d.codigo AS codigo_departamento,
  d.nombre AS nombre_departamento,
  e.nombre_completo,
  e.puesto_texto AS puesto,
  e.fecha_fin_contrato,
  (e.fecha_fin_contrato - CURRENT_DATE) AS dias_restantes,
  COALESCE(s.nombre, e.ubicacion_texto) AS sede
FROM rrhh.empleados e
JOIN rrhh.departamentos d ON d.id_departamento = e.id_departamento
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
  resp.nombre_completo AS responsable_nombre,
  COUNT(e.id_empleado) FILTER (WHERE e.estatus = 'ACTIVO' AND e.deleted_at IS NULL) AS empleados_activos,
  COUNT(e.id_empleado) FILTER (WHERE e.estatus <> 'ACTIVO' AND e.deleted_at IS NULL) AS empleados_inactivos,
  COALESCE(SUM(e.sueldo_mensual_bruto) FILTER (WHERE e.estatus = 'ACTIVO' AND e.deleted_at IS NULL), 0) AS nomina_mensual_bruta
FROM rrhh.departamentos d
LEFT JOIN core.sedes s        ON s.id_sede = d.id_sede
LEFT JOIN rrhh.empleados resp ON resp.id_empleado = d.id_responsable
LEFT JOIN rrhh.empleados e    ON e.id_departamento = d.id_departamento
GROUP BY d.id_departamento, d.codigo, d.nombre, s.nombre, resp.folio, resp.nombre_completo
ORDER BY d.codigo;
