-- ============================================================================
-- database/postgres/02_rrhh/04_functions_triggers.sql
-- Funciones y Triggers empresariales del módulo Recursos Humanos
-- ============================================================================

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

-- ── 5. Trigger de normalización previa en rrhh.empleados ─────────────────────
CREATE OR REPLACE FUNCTION rrhh.tgfn_normalizar_empleado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_p1 TEXT;
  v_p2 TEXT;
BEGIN
  -- Asignar folio corporativo SFG-XXXX automáticamente si viene nulo
  IF NEW.folio IS NULL OR TRIM(NEW.folio) = '' THEN
    NEW.folio := rrhh.fn_siguiente_folio('EMPLEADO')::rrhh.folio_empleado;
  END IF;

  -- Limpiar y componer nombre completo + iniciales
  NEW.nombre_pila      := TRIM(regexp_replace(COALESCE(NEW.nombre_pila, ''), '\s+', ' ', 'g'));
  NEW.apellido_paterno := TRIM(regexp_replace(COALESCE(NEW.apellido_paterno, ''), '\s+', ' ', 'g'));
  NEW.apellido_materno := TRIM(regexp_replace(COALESCE(NEW.apellido_materno, ''), '\s+', ' ', 'g'));

  NEW.nombre_completo := TRIM(
    CONCAT_WS(' ',
      NULLIF(NEW.nombre_pila, ''),
      NULLIF(NEW.apellido_paterno, ''),
      NULLIF(NEW.apellido_materno, '')
    )
  );

  v_p1 := COALESCE(NULLIF(LEFT(NEW.nombre_pila, 1), ''), 'S');
  v_p2 := COALESCE(NULLIF(LEFT(NEW.apellido_paterno, 1), ''), NULLIF(SUBSTRING(NEW.nombre_pila FROM 2 FOR 1), ''), 'F');
  NEW.iniciales := UPPER(v_p1 || v_p2);

  -- Estandarizar fiscales y correos
  IF NEW.rfc IS NOT NULL THEN
    NEW.rfc := UPPER(TRIM(NEW.rfc))::core.rfc_mx;
  END IF;

  IF NEW.curp IS NOT NULL THEN
    NEW.curp := UPPER(TRIM(NEW.curp))::core.curp_mx;
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

-- ── 6. Trigger automático de trazabilidad laboral (append-only, lee contexto de sesión)
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
      id_empleado, tipo_movimiento, id_depto_nuevo, puesto_nuevo, sueldo_nuevo,
      motivo, realizado_por, fecha_efecto
    ) VALUES (
      NEW.id_empleado, 'ALTA', NEW.id_departamento, NEW.puesto_texto, NEW.sueldo_mensual_bruto,
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

  IF NEW.puesto_texto IS DISTINCT FROM OLD.puesto_texto THEN
    INSERT INTO rrhh.historial_movimientos (
      id_empleado, tipo_movimiento, puesto_anterior, puesto_nuevo, motivo, realizado_por
    ) VALUES (
      NEW.id_empleado, 'CAMBIO_PUESTO', OLD.puesto_texto, NEW.puesto_texto,
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
      id_empleado, tipo_movimiento, id_depto_anterior, puesto_anterior,
      motivo, realizado_por, fecha_efecto
    ) VALUES (
      NEW.id_empleado, 'BAJA', OLD.id_departamento, OLD.puesto_texto,
      COALESCE(v_motivo, 'Cambio de estatus a ' || NEW.estatus), v_usuario, COALESCE(NEW.fecha_baja, CURRENT_DATE)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_rrhh_empleados_movimientos ON rrhh.empleados;
CREATE TRIGGER tr_rrhh_empleados_movimientos
AFTER INSERT OR UPDATE OF id_departamento, puesto_texto, sueldo_mensual_bruto, estatus
ON rrhh.empleados
FOR EACH ROW
EXECUTE FUNCTION rrhh.tgfn_auditar_movimiento_laboral();

-- ── 7. Cálculo de porcentaje de completitud de expediente (0–100%, 15 requisitos) ─
-- Evalúa únicamente el Expediente Base obligatorio (13 campos) + Fotografía + CSF SAT.
-- Campos opcionales (cursos/DC-3, uniformes EPP, alergias, tarjeta 16d, jefe) no penalizan.
CREATE OR REPLACE FUNCTION rrhh.fn_porcentaje_expediente(p_id_empleado core.id_uuid)
RETURNS SMALLINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_emp    rrhh.empleados%ROWTYPE;
  v_puntos SMALLINT := 0;
  v_total  CONSTANT SMALLINT := 15;
  v_has_nomina BOOLEAN := FALSE;
  v_has_csf    BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_emp FROM rrhh.empleados WHERE id_empleado = p_id_empleado;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Identidad laboral y fotografía (5)
  IF LENGTH(TRIM(COALESCE(v_emp.nombre_pila, ''))) >= 2 THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.puesto_texto IS NOT NULL AND v_emp.puesto_texto <> 'Por definir' THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.id_departamento IS NOT NULL THEN v_puntos := v_puntos + 1; END IF;
  IF v_emp.id_sede IS NOT NULL OR LENGTH(TRIM(COALESCE(v_emp.ubicacion_texto, ''))) > 0 THEN v_puntos := v_puntos + 1; END IF;
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

  -- Nómina: Banco + CLABE de 18 dígitos (1)
  SELECT EXISTS (
    SELECT 1
    FROM rrhh.cuentas_bancarias cb
    WHERE cb.id_empleado = p_id_empleado
      AND cb.activa = TRUE
      AND LENGTH(TRIM(COALESCE(cb.banco_nombre, ''))) >= 2
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

-- ── 8. Triggers updated_at en tablas principales ─────────────────────────────
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
