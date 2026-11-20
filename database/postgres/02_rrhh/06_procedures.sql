-- ============================================================================
-- database/postgres/02_rrhh/06_procedures.sql
-- Procedimientos Almacenados transaccionales del módulo Recursos Humanos
-- ============================================================================

-- ── 1. Alta Integral de Colaborador (Empleado + Cuenta de Nómina) ────────────
CREATE OR REPLACE PROCEDURE rrhh.sp_registrar_colaborador(
  IN  p_codigo_empresa    VARCHAR,
  IN  p_codigo_depto      VARCHAR,
  IN  p_nombre_pila       VARCHAR,
  IN  p_apellido_paterno  VARCHAR,
  IN  p_apellido_materno  VARCHAR,
  IN  p_puesto_texto      VARCHAR,
  IN  p_rfc               VARCHAR DEFAULT NULL,
  IN  p_curp              VARCHAR DEFAULT NULL,
  IN  p_nss               VARCHAR DEFAULT NULL,
  IN  p_correo_personal   VARCHAR DEFAULT NULL,
  IN  p_telefono_celular  VARCHAR DEFAULT NULL,
  IN  p_sueldo_mensual    NUMERIC DEFAULT NULL,
  IN  p_folio_supervisor  VARCHAR DEFAULT NULL,
  IN  p_banco_nombre      VARCHAR DEFAULT NULL,
  IN  p_clabe             VARCHAR DEFAULT NULL,
  IN  p_usuario           VARCHAR DEFAULT CURRENT_USER,
  OUT p_folio_generado    VARCHAR,
  OUT p_id_empleado_out   core.id_uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_empresa    core.id_uuid;
  v_id_depto      core.id_uuid;
  v_id_supervisor core.id_uuid;
  v_id_banco      core.id_uuid;
BEGIN
  -- Lock transaccional para garantizar integridad en altas simultáneas
  PERFORM pg_advisory_xact_lock(hashtext('rrhh_alta_colaborador'));
  PERFORM set_config('app.usuario_actual', COALESCE(p_usuario, CURRENT_USER), TRUE);
  PERFORM set_config('app.motivo_movimiento', 'Alta integral vía sp_registrar_colaborador', TRUE);

  SELECT id_empresa INTO v_id_empresa
    FROM core.empresas
   WHERE codigo = UPPER(TRIM(p_codigo_empresa))
   LIMIT 1;
  IF v_id_empresa IS NULL THEN
    RAISE EXCEPTION 'Empresa "%" no encontrada en core.empresas', p_codigo_empresa;
  END IF;

  SELECT id_departamento INTO v_id_depto
    FROM rrhh.departamentos
   WHERE codigo = UPPER(TRIM(p_codigo_depto))
   LIMIT 1;
  IF v_id_depto IS NULL THEN
    RAISE EXCEPTION 'Departamento "%" no encontrado en rrhh.departamentos', p_codigo_depto;
  END IF;

  IF p_folio_supervisor IS NOT NULL AND TRIM(p_folio_supervisor) <> '' THEN
    SELECT id_empleado INTO v_id_supervisor
      FROM rrhh.empleados
     WHERE folio = UPPER(TRIM(p_folio_supervisor))
       AND deleted_at IS NULL
     LIMIT 1;
  END IF;

  INSERT INTO rrhh.empleados (
    id_empresa, id_departamento, id_supervisor,
    nombre_pila, apellido_paterno, apellido_materno,
    puesto_texto, rfc, curp, nss,
    correo_personal, telefono_celular, sueldo_mensual_bruto
  ) VALUES (
    v_id_empresa, v_id_depto, v_id_supervisor,
    p_nombre_pila, COALESCE(p_apellido_paterno, ''), COALESCE(p_apellido_materno, ''),
    p_puesto_texto,
    NULLIF(UPPER(TRIM(COALESCE(p_rfc, ''))), '')::core.rfc_mx,
    NULLIF(UPPER(TRIM(COALESCE(p_curp, ''))), '')::core.curp_mx,
    NULLIF(TRIM(COALESCE(p_nss, '')), '')::rrhh.nss_mx,
    NULLIF(LOWER(TRIM(COALESCE(p_correo_personal, ''))), '')::core.correo_electronico,
    NULLIF(TRIM(COALESCE(p_telefono_celular, '')), '')::core.telefono_mx,
    p_sueldo_mensual::core.monto_mxn
  )
  RETURNING id_empleado, folio INTO p_id_empleado_out, p_folio_generado;

  -- Crear cuenta de Nómina si se proporcionó banco o CLABE
  IF COALESCE(TRIM(p_banco_nombre), '') <> '' OR COALESCE(TRIM(p_clabe), '') <> '' THEN
    SELECT id_banco INTO v_id_banco
      FROM rrhh.cat_bancos
     WHERE LOWER(nombre) = LOWER(TRIM(COALESCE(p_banco_nombre, '')))
     LIMIT 1;

    INSERT INTO rrhh.cuentas_bancarias (
      id_empleado, id_banco, banco_nombre, alias, clabe, es_principal
    ) VALUES (
      p_id_empleado_out,
      v_id_banco,
      COALESCE(NULLIF(TRIM(p_banco_nombre), ''), 'Pendiente'),
      'Nómina',
      NULLIF(regexp_replace(COALESCE(p_clabe, ''), '\D', '', 'g'), '')::core.clabe_mx,
      TRUE
    );
  END IF;
END;
$$;

-- ── 2. Transferencia de Departamento (conservando folio SFG-XXXX e historial inmutable)
CREATE OR REPLACE PROCEDURE rrhh.sp_cambiar_departamento(
  p_folio_empleado    VARCHAR,
  p_codigo_depto_nvo  VARCHAR,
  p_folio_supervisor  VARCHAR DEFAULT NULL,
  p_motivo            VARCHAR DEFAULT 'Reasignación organizacional',
  p_usuario           VARCHAR DEFAULT CURRENT_USER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_emp        core.id_uuid;
  v_id_depto_nvo  core.id_uuid;
  v_id_sup_nvo    core.id_uuid;
BEGIN
  SELECT id_empleado
    INTO v_id_emp
    FROM rrhh.empleados
   WHERE folio = UPPER(TRIM(p_folio_empleado))
     AND deleted_at IS NULL
   FOR UPDATE;

  IF v_id_emp IS NULL THEN
    RAISE EXCEPTION 'Colaborador "%" no encontrado', p_folio_empleado;
  END IF;

  SELECT id_departamento INTO v_id_depto_nvo
    FROM rrhh.departamentos
   WHERE codigo = UPPER(TRIM(p_codigo_depto_nvo))
     AND activo = TRUE;

  IF v_id_depto_nvo IS NULL THEN
    RAISE EXCEPTION 'Departamento destino "%" no válido o inactivo', p_codigo_depto_nvo;
  END IF;

  IF p_folio_supervisor IS NOT NULL AND TRIM(p_folio_supervisor) <> '' THEN
    SELECT id_empleado INTO v_id_sup_nvo
      FROM rrhh.empleados
     WHERE folio = UPPER(TRIM(p_folio_supervisor))
       AND deleted_at IS NULL;
  END IF;

  -- Inyectar contexto de auditoría para el trigger append-only (sin hacer UPDATE al historial)
  PERFORM set_config('app.usuario_actual', COALESCE(p_usuario, CURRENT_USER), TRUE);
  PERFORM set_config('app.motivo_movimiento', COALESCE(p_motivo, 'Reasignación organizacional'), TRUE);

  UPDATE rrhh.empleados
     SET id_departamento = v_id_depto_nvo,
         id_supervisor   = COALESCE(v_id_sup_nvo, id_supervisor)
   WHERE id_empleado = v_id_emp;
END;
$$;

-- ── 3. Baja de Colaborador (SGI-FR-RH-15) con reasignación de subordinados ───
CREATE OR REPLACE PROCEDURE rrhh.sp_aplicar_baja_colaborador(
  p_folio_empleado    VARCHAR,
  p_motivo_baja       VARCHAR,
  p_fecha_baja        DATE DEFAULT CURRENT_DATE,
  p_reasignar_equipo  BOOLEAN DEFAULT TRUE,
  p_emitido_por       VARCHAR DEFAULT CURRENT_USER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_emp      core.id_uuid;
  v_id_sup      core.id_uuid;
  v_id_depto    core.id_uuid;
  v_folio_sgi   rrhh.folio_documento;
BEGIN
  SELECT id_empleado, id_supervisor, id_departamento
    INTO v_id_emp, v_id_sup, v_id_depto
    FROM rrhh.empleados
   WHERE folio = UPPER(TRIM(p_folio_empleado))
     AND deleted_at IS NULL
   FOR UPDATE;

  IF v_id_emp IS NULL THEN
    RAISE EXCEPTION 'Colaborador "%" no encontrado', p_folio_empleado;
  END IF;

  PERFORM set_config('app.usuario_actual', COALESCE(p_emitido_por, CURRENT_USER), TRUE);
  PERFORM set_config('app.motivo_movimiento', COALESCE(p_motivo_baja, 'Baja SGI-FR-RH-15'), TRUE);

  -- Si tenía equipo a cargo, reasignar subordinados al jefe inmediato superior para no romper el organigrama
  IF p_reasignar_equipo THEN
    UPDATE rrhh.empleados
       SET id_supervisor = v_id_sup
     WHERE id_supervisor = v_id_emp
       AND estatus = 'ACTIVO'
       AND deleted_at IS NULL;
  END IF;

  -- Baja lógica (nunca se borra físicamente ni se recicla el folio SFG-XXXX)
  UPDATE rrhh.empleados
     SET estatus    = 'BAJA',
         fecha_baja = p_fecha_baja
   WHERE id_empleado = v_id_emp;

  -- Registrar Vale de No Adeudo SGI-FR-RH-15
  v_folio_sgi := ('SGI-RH15-' || TO_CHAR(p_fecha_baja, 'YYYYMMDD') || '-' || SUBSTRING(p_folio_empleado FROM '[0-9]+$'))::rrhh.folio_documento;

  INSERT INTO rrhh.formatos_sgi (
    folio_sgi, codigo_formato, id_empleado, id_departamento, estatus, datos_formato, emitido_por
  ) VALUES (
    v_folio_sgi,
    'SGI-FR-RH-15'::rrhh.folio_documento,
    v_id_emp,
    v_id_depto,
    'APROBADA'::rrhh.estatus_solicitud,
    jsonb_build_object(
      'motivo_baja', p_motivo_baja,
      'fecha_baja', p_fecha_baja,
      'equipo_reasignado', p_reasignar_equipo
    ),
    p_emitido_por
  )
  ON CONFLICT (folio_sgi) DO NOTHING;
END;
$$;
