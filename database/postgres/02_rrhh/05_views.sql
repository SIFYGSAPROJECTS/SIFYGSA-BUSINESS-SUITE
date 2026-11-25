-- ============================================================================
-- database/postgres/02_rrhh/05_views.sql
-- Vistas de consulta optimizadas (todos los datos derivados se calculan aquí)
-- ============================================================================

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
