-- ============================================================================
-- database/postgres/seeds/03_seed_rrhh_employees.sql
-- Seed real de 192 colaboradores SIFYGSA (generado desde data/sifygsa_db.json)
-- Incluye folios inmutables SFG-0001..SFG-0192, nombres separados y organigrama
-- ============================================================================

BEGIN;

-- 1. Inserción idempotente de colaboradores
INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0001', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Agustín', 'Anastacio', 'Martínez', 'Director General',
  'Dirección Corporativa', DATE '2021-03-15', 'ACTIVO', 'Certificación Vigente', 'success',
  'AAMA760706EI0', 'AAMA760706HVZNRG18', '67987627006', DATE '1976-07-06', 'agustin.anastacio@sifygsa.com.mx', '9221201243',
  'Centro Norte', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0002', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Manuel', 'Martínez', 'Ruíz', 'Director Comercial',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MARM810118BV1', 'MARM810118HVZRZN09', '67048100183', DATE '1981-01-18', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0003', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Emmanuel', 'Mendoza', 'Ramírez', 'Gerente de Servicios',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MERE821216FKA', 'MERE821216HVZNMM07', '67978252574', DATE '1982-12-16', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0004', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Miguel Ángel', 'Guzmán', 'Reyes', 'Gerente de Ingeniería',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GURM830725GG8', 'GURM830725HVZZYG00', '22048310878', DATE '1983-07-25', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0005', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Marlem', 'Campos', 'García', 'Gerente de Compras',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CAGM821115U6A', 'CAGM821115MVZMRR00', '67018222140', DATE '1982-11-15', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0006', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Carlos Enrique', 'Cossio', 'Ruíz', 'Gerente QHSE',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CORC880619JNA', 'CORC880619HVZSZR09', '67068814473', DATE '1988-06-19', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0007', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Pablo', 'Vázquez', 'Culebro', 'Gerente de Infraestructura',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VACP870818U17', 'VACP870818HVZZLB06', '67118701878', DATE '1987-08-18', NULL, NULL,
  'Acayucan, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0008', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Viridiana', 'Arenas', 'Anastacio', 'Gerente de Administración',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AEAV880424NN5', 'AEAV880424MVZRNR04', '67098815318', DATE '1988-04-24', NULL, NULL,
  'Acayucan, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0009', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Valeria', 'Méndez', 'Albores', 'Gerente de Recursos Humanos',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MEAV961029FB0', 'MEAV961029MVZNLL01', '13169645606', DATE '1996-10-29', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0010', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Rosa Ivette', 'Trujillo', 'Palma', 'Gerente HSE Comalcalco',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TUPR850715GG8', 'TUPR850715MTCRLS09', '83038519969', DATE '1985-07-15', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0011', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Víctor Manuel', 'Anastacio', 'Martínez', 'Gerente de MYCP',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AAMV820404A92', 'AAMV820404HVZNRC01', '67048202047', DATE '1982-04-04', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'MCP'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0012', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Samuel Martín', 'Cruz', 'Camera', 'Gerente de Soporte a Proyectos',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUCS6908205F9', 'CUCS690820HVZRMM01', '67896960605', DATE '1969-08-20', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'GSAPE'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0013', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Yesenia', 'Rosas', 'Rogel', 'Gerente Ventas Sur',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RORY830520DWA', 'RORY830520MVZSGS00', '67068303535', DATE '1983-05-20', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0014', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Guillermo', 'Sánchez', 'Escobar', 'Gerente Ventas Istmo',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAEG8603227SA', 'SAEG860322HOCNSL06', '67088601272', DATE '1986-03-22', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0015', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Erick', 'Hernández', 'Rueda', 'Sub-Gerente de Servicios',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HERE860806PZ9', 'HERE860806HVZRDR04', '67098617219', DATE '1986-08-06', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0016', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Adrián José', 'Rodríguez', 'Hernández', 'Supervisor de obra Sr',
  'Cuadrilla Frente CT1', DATE '2021-06-01', 'ACTIVO', 'Vigente SIL-3', 'success',
  'ROHA860109TD3', 'ROHA860109HVZDRD05', '67038516158', DATE '1986-01-09', 'adrianjose1986@hotmail.com', '9222141194',
  'SFG-C284-CT1', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0017', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alan Armando', 'Montiel', 'Rodríguez', 'Auxiliar de TI Trainee',
  'Tecnología & Redes', DATE '2023-08-01', 'ACTIVO', 'DC-3 Vigente', 'success',
  'MORA020920APA', 'MORA020920HVZNDLA0', '86170227424', DATE '2002-09-20', 'alan.montiel@sifygsa.com.mx', '9242429732',
  'SFG-ADM-INFRA', NULL, NULL, NULL, '#475569'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0018', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Aldo Carlos', 'Pérez', 'Sánchez', 'Ingeniero de servicios senior',
  'Cuadrilla Alfa SIL-3', DATE '2022-05-15', 'ACTIVO', 'Vigente SIL-3', 'success',
  'PESA9310073N2', 'PESA931007HVZRNL09', '67119316544', DATE '1993-10-07', 'aldo.perez@sifygsa.com.mx', '9211013573',
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0019', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alejandra', 'Arias', 'Rodríguez', 'Auxiliar administrativo Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AIRA960312B69', 'AIRA960312MTCRDL08', '66169612315', DATE '1996-03-12', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0020', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alejandra', 'Sujias', 'Ricardez', 'Auxiliar Administrativo Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SURA841202IB0', 'SURA841202MTCJCL03', '83088420902', DATE '1984-12-02', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0021', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alejandra', 'Sujías', 'Ricardez', 'Auxiliar Administrativo Ss',
  'Administración en Campo', DATE '2023-01-10', 'ACTIVO', 'DC-3 Vigente', 'success',
  NULL, NULL, NULL, NULL, 'alejandra.sujias@sifygsa.com.mx', '9331174872',
  'SFG-C245-MSA', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0022', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alessandra', 'González', 'Flores', 'Ingeniero de Definición de Soluciones Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOFA011022HY8', 'GOFA011022MVZNLLA6', '18160108777', DATE '2001-10-22', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0023', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alexander', 'Cruz', 'Pesado', 'Líder de proyecto Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUPA020220IX4', 'CUPA020220HVZRSLA8', '07160280769', DATE '2002-02-20', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0024', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Alfonso', 'Gutiérrez', 'Vázquez', 'Supervisor de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GUVA761026PF6', 'GUVA761026HTCTZL06', '83937608210', DATE '1976-10-26', NULL, NULL,
  'Comalcalco, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0025', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Álvaro', 'Fuentes', 'Zamudio', 'Supervisor de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'FUZA770219SY5', 'FUZA770219HTCNML01', '83977706593', DATE '1977-02-19', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0026', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Amado', 'Reyes', 'Peña', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'REPA770913AR5', 'REPA770913HOCYXM15', '67957757684', DATE '1977-09-13', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0027', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ana Belén', 'Alcudia', 'Córdova', 'Supervisor de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AUCA9411024V2', 'AUCA941102MTCLRN08', '08149430186', DATE '1994-11-02', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0028', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ángel Emmanuel', 'Medina', 'Lazaro', 'Técnico de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MELA0312311VA', 'MELA031231HVZDZNA4', '18190366916', DATE '2003-12-31', NULL, NULL,
  'minatitlan, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0029', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Antonio', 'Gómez', 'Cruz', 'Auxiliar de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOCA981009UQ3', 'GOCA981009HTCMRN03', '18139854907', DATE '1998-10-09', NULL, NULL,
  'Villahermosa, Tab.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0030', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Arantza', 'Lázaro', 'Loya', 'Auxiliar de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LALA981125ES0', 'LALA981125MVZZYR08', '05179821516', DATE '1998-11-25', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0031', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Arcadio', 'Torres', 'Domínguez', 'Ayudante general',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TODA710112Q90', 'TODA710112HVZRMR09', '67997101919', DATE '1971-01-12', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0032', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Arely', 'Santiago', 'Mayo', 'Intendencia',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAMA9104123Y1', 'SAMA910412MVZNYR00', '67129124524', DATE '1991-04-12', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0033', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Arem Estefanía', 'López', 'Sánchez', 'Ingeniero de Definición de Soluciones Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LOSA990928C26', 'LOSA990928MQRPNR00', '81169970977', DATE '1999-09-28', NULL, NULL,
  'Jáltipan, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0034', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Armando', 'Alfonso', 'Cruz', 'Ayudante general',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AOCA031111HRA', 'AOCA031111HVZLRRA5', '64180317527', DATE '2003-11-11', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0035', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Aurelio', 'Palacios', 'Xolo', 'Gerente de Compras',
  'Almacén & Procura', DATE '2022-08-10', 'ACTIVO', 'Certificación Vigente', 'success',
  'PAXA711015K48', 'PAXA711015HVZLLR01', '67897158175', DATE '1971-10-15', 'aurelio.palacios@sifygsa.com.mx', NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0036', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Basilio', 'Mendoza', 'Ramírez', 'Líder de proyecto Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MERB900105CT3', 'MERB900105HVZNMS05', '67109044270', DATE '1990-01-05', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0037', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Bryan Antonio', 'Vielma', 'Lazcarez', 'Auxiliar de almacén',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VILB0608306V0', 'VILB060830HVZLZRA2', '18230652218', DATE '2006-08-30', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0038', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Bryan Paul', 'Rodríguez', 'Santiago', 'Ayudante Eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'ROSB050412GE8', 'ROSB050412HVZDNRA8', '18210528289', DATE '2005-04-12', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0039', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Carlos Alberto', 'Hernández', 'Córdova', 'Supervisor de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HECC830605LA4', 'HECC830605HVZRRR00', '83028416333', DATE '1983-06-05', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0040', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Carlos Alberto', 'Reyes', 'Ramírez', 'Andamiero',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RERC840908CX0', 'RERC840908HVZYMR02', '67078402475', DATE '1984-09-08', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0041', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Carlos Alberto', 'Tun', 'Culebro', 'Generalista de Recursos Humanos',
  'Staff Central', DATE '2023-02-01', 'ACTIVO', 'DC-3 Acreditado', 'success',
  'TUCC9010144H8', 'TUCC901014HVZNLR08', '19159016625', DATE '1990-10-14', 'tunccarlos14@gmail.com', NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0042', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Carlos', 'Lázaro', 'Fidencio', 'Ingeniero de definición de soluciones',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LAFC810831NW8', 'LAFC810831HVZZDR08', '67968152537', DATE '1981-08-31', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0043', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'César', 'González', 'Fuentes', 'Técnico especialista jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOFC9608091W3', 'GOFC960809HTCNNS02', '66159650366', DATE '1996-08-09', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0044', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Cesar Iván', 'Izquierdo', 'Hernández', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'IUHC9211165X9', 'IUHC921116HVZZRS03', '67119230182', DATE '1992-11-16', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0045', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Christian del Carmen Pérez', 'de los', 'Santos', 'Cadista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PESC9407109H0', 'PESC940710HTCRNH04', '63169414354', DATE '1994-07-10', NULL, NULL,
  'Paraíso, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0046', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Citlali Astrid', 'Sánchez', 'Martínez', 'Ingeniero de TI Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAMC0004158H2', 'SAMC000415MVZNRTA4', '38180079675', DATE '2000-04-15', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0047', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Cristian Noel', 'Murillo', 'Rosado', 'Ayudante general',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MURC9902282WA', 'MURC990228HVZRSR06', '82169936281', DATE '1999-02-28', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0048', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'd¬', NULL, NULL, 'Por asignar',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0049', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Daisy', 'Ortíz', 'López', 'Ing. de Calidad Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'OILD8212031Q0', 'OILD821203MVZRPS07', '78038219362', DATE '1982-12-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'CAL'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0050', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Daniel', 'De León', 'López', 'Ingeniero de productos',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LELD810422TQA', 'LELD810422HVZNPN02', '78968172409', DATE '1981-04-22', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0051', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Daniel', 'Trujillo', 'Palma', 'Supervisor de HSE',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TUPD891014550', 'TUPD891014HTCRLN04', '03178955633', DATE '1989-10-14', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0052', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Daniela', 'Calderón', 'Domínguez', 'Nominista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CADD850624C94', 'CADD850624MVZLMN04', '67098510943', DATE '1985-06-24', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0053', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Darany Sinaí', 'González', 'Pascual', 'Técnico de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOPD970721ML7', 'GOPD970721MVZNSR02', '28169724797', DATE '1997-07-21', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0054', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Dariana', 'Rogel', 'Borja', 'Ingeniero de Definición de Soluciones Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'ROBD001019SS3', 'ROBD001019MVZGRRA5', '38190020503', DATE '2000-10-19', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0055', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Dendra Kein Betsaida Jiménez', 'De la', 'Cruz', 'Ingeniero de Ventas Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'JICD900612IQ5', 'JICD900612MTCMRN06', '05159076628', DATE '1990-06-12', NULL, NULL,
  'Paraíso, Tab.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0056', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Diana Itzel', 'Méndez', 'Martínez', 'Ingeniero de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MEMD9510272T9', 'MEMD951027MVZNRN01', '09169573285', DATE '1995-10-27', NULL, NULL,
  'Jáltipan, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0057', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Dionicio', 'Guzmán', 'Quevedo', 'Signatario de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GUQD860805MB4', 'GUQD860805HTCZVN00', '83058643442', DATE '1986-08-05', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0058', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Edgar', 'Martínez', 'Hilario', 'Coordonador de volumetrías',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MAHE8010268E4', 'MAHE801026HVZRLD05', '67048003742', DATE '1980-10-26', NULL, NULL,
  'Texistepec, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0059', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Eduardo Javier', 'Pérez', 'Torres', 'Supervisor de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PETE9210144C7', 'PETE921014HVZRRD07', '05169251005', DATE '1992-10-14', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0060', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Eduardo', 'Organista', 'Chigo', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'OACE870428SS0', 'OACE870428HVZRHD06', '65108720353', DATE '1987-04-28', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0061', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Eduardo', 'Vidaña', 'García', 'Técnico de Servicios',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VIGE920509NJ3', 'VIGE920509HVZDRD02', '67129239124', DATE '1992-05-09', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0062', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Elodia Nayeli', 'Flores', 'Juárez', 'Supervisor de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'FOJE941014EL9', 'FOJE941014MTCLRL07', '22169400557', DATE '1994-10-14', NULL, NULL,
  'Huimanguillo, Tab.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0063', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Erick Daniel', 'García', 'Olán', 'Eléctrico Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GAOE9311127M7', 'GAOE931112HTCRLR00', '81139317077', DATE '1993-11-12', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0064', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Esbehidy del Carmen', 'Medina', 'Lázaro', 'Comprador Trainee',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MELE000716TR3', 'MELE000716MVZDZSA7', '34160081138', DATE '2000-07-16', NULL, NULL,
  'San Pedro Martir, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0065', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Estefany Michelle De los', 'Santos', 'Pérez', 'Técnico de servicios Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAPE990608KT1', 'SAPE990608MVZNRS01', '51169924571', DATE '1999-06-08', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0066', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'EU', NULL, NULL, 'Por definir',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0067', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Evelin', 'Vargas', 'Ambrosio', 'Supervisor de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VAAE971010NR7', 'VAAE971010MPLRMV07', '30169772800', DATE '1997-10-10', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0068', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Fabián', 'Aguilar', 'Arias', 'Auxiliar Técnico Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AUAF890423LLA', 'AUAF890423HTCGRB05', '83148900042', DATE '1989-04-23', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0069', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Fortino', 'Osorio', 'Ricárdez', 'Ingeniero de servicios Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'OORF9611178W5', 'OORF961117HVZSCR09', '43169604865', DATE '1996-11-17', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0070', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Francisco Javier', 'Mayo', 'Reyes', 'Cadista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MARF000608N35', 'MARF000608HVZYYRA8', '61160087302', DATE '2000-06-08', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0071', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Freddy', 'Cruz', 'Antonio', 'Ingeniero de servicios Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUAF970509VA4', 'CUAF970509HVZRNR07', '24169756780', DATE '1997-05-09', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0072', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'g', NULL, NULL, 'Por asignar',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0073', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Gabriel', 'Pérez', 'Aguilar', 'Almacenista Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PEAG911103PW0', 'PEAG911103HVZRGB02', '67109131978', DATE '1991-11-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0074', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Giezell Daraly', 'Jimenez', 'Torres', 'Ingeniero de Medición Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'JITG990205G88', 'JITG990205MPLMRZ08', '05139922941', DATE '1999-02-05', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0075', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Giovanni Aldahir', 'Martínez', 'Sánchez', 'Lider de proyecto Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MASG991217UK9', 'MASG991217HVZRNV06', '02229983859', DATE '1999-12-17', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0076', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Guillermo', 'Lara', 'Menéndez', 'Encargado de mantenimiento SS',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LAMG8201263X1', 'LAMG820126HVZRNL06', '67068208601', DATE '1982-01-26', NULL, NULL,
  'Tierra Blanca, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0077', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Guiucepe Alberto', 'Villavicencio', 'López', 'Supervisor de Obra Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VILG950613HX4', 'VILG950613HVZLPC07', '67129511191', DATE '1995-06-13', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0078', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Hector de Jesús', 'Santiago', 'Sosa', 'Auxiliar Administrativo',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SASH000816SK9', 'SASH000816HVZNSCA4', '03200050163', DATE '2000-08-16', NULL, NULL,
  'MINATITLAN, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0079', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Hiram Lugardo', 'Daza', 'Martínez', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'DAMH770121QZ8', 'DAMH770121HVZZRR08', '67937750999', DATE '1977-01-21', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0080', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Humberto', 'Avalos', 'González', 'Almacenista Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AAGH851004KY8', 'AAGH851004HTCVNM08', '83058514817', DATE '1985-10-04', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0081', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Humberto', 'Ripoll', 'Hernández', 'Ingeniero de Ventas Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RIHH820823986', 'RIHH820823HVZPRM06', '67068222685', DATE '1982-08-23', NULL, NULL,
  'Corregidora, Querétaro', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0082', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Indra Fabiola', 'Anastacio', 'Lozada', 'Auxiliar contable Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AALI0103036J4', 'AALI010303MVZNZNA7', '02260116146', DATE '2001-03-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0083', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ing.', 'Carlos', 'Hernández', 'Técnico en Detección de Gas',
  'Operaciones F&G', DATE '2023-09-04', 'ACTIVO', 'DC-3 Acreditado', 'success',
  NULL, NULL, NULL, NULL, 'carlos.hernandez@sifygsa.com.mx', NULL,
  'Mapachapa, Ver.', NULL, NULL, NULL, '#374151'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MAP'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0084', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ing. Fernando', 'Alarcón', 'Paz', 'Supervisor de Mantenimiento & Redes',
  'Regional Centro', DATE '2023-01-15', 'ACTIVO', 'Certificación Vigente', 'success',
  NULL, NULL, NULL, NULL, 'fernando.alarcon@sifygsa.com.mx', NULL,
  'Xalapa, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'XAL'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0085', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ing. Roberto', 'Méndez', 'Cruz', 'Especialista en Automatización & Control',
  'Cuadrilla Bravo (Base Operativa)', DATE '2024-09-18', 'ACTIVO', 'Por Renovar', 'warning',
  NULL, NULL, NULL, NULL, 'roberto.mendez@sifygsa.com.mx', NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#2563EB'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'MCP'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0086', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ingrid Brigitte', 'Vidal', 'Vitales', 'Estimacionista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VIVI950910521', 'VIVI950910MTCDTN04', '05199558312', DATE '1995-09-10', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0087', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Irving José', 'Pineda', 'Hernández', 'Líder de contrato Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PIHI90112893A', 'PIHI901128HVZNRR06', '25149059690', DATE '1990-11-28', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0088', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Isaac', 'Ángeles', 'Caraveo', 'Técnico de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AECI020310KM6', 'AECI020310HHGNRSA6', '54170267774', DATE '2002-03-10', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0089', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Isaac', 'Martínez', 'Cruz', 'Ayudante Eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MACI020414QR8', 'MACI020414HVZRRSA1', '56170273611', DATE '2002-04-14', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0090', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Israel', 'Garrido', 'Reyes', 'Soldador Ss.',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GARI961121228', 'GARI961121HVZRYS05', '67139606742', DATE '1996-11-21', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0091', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Israel Joshua', 'Landero', 'Carrera', 'técnico de servicios',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LACI911019RU2', 'LACI911019HVZNRS08', '14169147833', DATE '1991-10-19', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0092', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Iván Javier', 'Gutiérrez', 'Balcázar', 'Auxiliar de RRHH Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GUBI000208E60', 'GUBI000208HVZTLVA9', '19180088866', DATE '2000-02-08', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0093', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jared Joel', 'Álvarez', 'Osorio', 'Ayudante eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AAOJ0709284K5', NULL, '08260790418', NULL, NULL, NULL,
  'Canticas, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0094', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jason', 'Ramírez', 'Luna', 'Técnico de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RALJ010628VD9', 'RALJ010628HVZMNSA9', '10150141975', DATE '2001-06-28', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0095', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jazmín Lizette', 'González', 'Martínez', 'Ingeniero de Definición de Soluciones Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOMJ980725Q80', 'GOMJ980725MVZNRZ07', '54169846463', DATE '1998-07-25', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0096', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jeannete Ivonne', 'Macías', 'Ovando', 'Comprador Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MAOJ8106037J9', 'MAOJ810603MVZCVN08', '67068106615', DATE '1981-06-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0097', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús Alberto', 'Ruíz', 'Martínez', 'Cadista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RUMJ981226DT9', 'RUMJ981226HVZZRS09', '42169891365', DATE '1998-12-26', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0098', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús Elías', 'Rivera', 'Jiménez', 'Ing. De Servicios',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RIJJ790213DN4', 'RIJJ790213HVZVMS06', '83037907603', DATE '1979-02-13', NULL, NULL,
  'Villahermosa, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0099', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús Enrique', 'Santos', 'Valera', 'Técnico de Servicios Jr.',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAVJ010309EU5', 'SAVJ010309HVZNLSA2', '49190122488', DATE '2001-03-09', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0100', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús Miguel', 'Esteva', 'Domínguez', 'Almacenista Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'EEDJ9305032N9', 'EEDJ930503HVZSMS04', '67129330089', DATE '1993-05-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0101', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús', 'Navarro', 'Pérez', 'Técnico especialista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'NAPJ951006K47', 'NAPJ951006HVZVRS03', '09169589364', DATE '1995-10-06', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0102', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús Rogelio', 'Hernández', 'Magaña', 'Almacenista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HEMJ901030MG1', 'HEMJ901030HTCRGS02', '02179075359', DATE '1990-10-30', NULL, NULL,
  'Jalpa de Méndez, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0103', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jesús Uriel', 'García', 'Nazario', 'Auxiliar de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GANJ030114A9A', 'GANJ030114HVZRZSA6', '11160370992', DATE '2003-01-14', NULL, NULL,
  'Jáltipan, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0104', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jonatan', 'Rodríguez', 'Martínez', 'Andamiero',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'ROMJ880628AM2', 'ROMJ880628HVZDRN08', '67078810941', DATE '1988-06-28', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0105', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jonathan', 'Cruz', 'Rogel', 'Líder de Proyecto Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CURJ910414DS8', 'CURJ910414HVZRGN06', '18149164107', DATE '1991-04-14', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0106', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jorge', 'Cruz', 'Salazar', 'Cadista Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUSJ9512237K5', 'CUSJ951223HVZRLR02', '05159549723', DATE '1995-12-23', NULL, NULL,
  'Jáltipan, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0107', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jorge Noé', 'Pérez', 'Zepahua', 'Técnico especialista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PEZJ881117B53', 'PEZJ881117HVZRPR07', '02168808067', DATE '1988-11-17', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0108', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Jorge Rafael', 'Contreras', 'Canto', 'Estimacionista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'COCJ8408059H1', 'COCJ840805HVZNNR08', '83128401292', DATE '1984-08-05', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0109', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Adrián', 'Velasco', 'Bartolo', 'Líder de proyecto Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VEBA990518N57', 'VEBA990518HVZLRD08', '84169907023', DATE '1999-05-18', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0110', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Alberto', 'López', 'Roldán', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LORA8601124K5', 'LORA860112HVZPLL07', '67068616985', DATE '1986-01-12', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0111', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Ángel', 'Castillejos', 'Cruz', 'Chofer',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CACX011101326', 'CACX011101HVZSRNA7', '52190147414', DATE '2001-11-01', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0112', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Antonio', 'González', 'Fuentes', 'Líder de ingeniería Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOFA920521B93', 'GOFA920521HTCNNN07', '19149229890', DATE '1992-05-21', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0113', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José', 'Arias', 'Córdova', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AICJ970927NU6', 'AICJ970927HTCRRS01', '68169702450', DATE '1997-09-27', NULL, NULL,
  'Centla, Tab.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0114', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Carlos', 'Rosas', 'Rogel', 'Jefe de Taller',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RORC870410MW5', 'RORC870410HVZSGR07', '67068731230', DATE '1987-04-10', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0115', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Eduardo', 'Pérez', 'Jiménez', 'Ayudante general',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PEJE970909HW0', 'PEJE970909HVZRMD00', '26179799114', DATE '1997-09-09', NULL, NULL,
  'Carrizal, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0116', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Eduardo', 'Tenorio', 'Villalobos', 'Supervisor de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TEVE9608133Z6', 'TEVE960813HVZNLD07', '03159644941', DATE '1996-08-13', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0117', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Leonardo', 'Márquez', 'Girón', 'Supervisor de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MAGL7505137Q6', 'MAGL750513HOCRRN04', '75957519160', DATE '1975-05-13', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0118', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'José Roberto', 'Collado', 'Jiménez', 'Ingeniero de Definición de Soluciones Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'COJR940911LS1', 'COJR940911HTCLMB05', '62169474178', DATE '1994-09-11', NULL, NULL,
  'Nacajuca, Tab.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0119', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Josué', 'Torres', 'Cadena', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TOCJ831013RY1', 'TOCJ831013HVZRDS03', '67058317057', DATE '1983-10-13', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0120', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Juan Carlos', 'Méndez', 'Pablo', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MEPJ890913AA4', 'MEPJ890913HTCNBN04', '83058900792', DATE '1989-09-13', NULL, NULL,
  'Huimanguillo, Tab.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0121', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Juan Carlos', 'Solano', 'Dector', 'Ingeniero de Ventas Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SODJ861018F29', 'SODJ861018HVZLCN08', '67098600801', DATE '1986-10-18', NULL, NULL,
  'Orizaba, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0122', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Juan Pablo', 'Casas', 'Mendoza', 'Supervisor de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CAMJ960706PH8', 'CAMJ960706HVZSNN00', '11169696140', DATE '1996-07-06', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0123', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Juan', 'Pérez', 'Castro', 'Técnico de servicios jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PECJ860521PI5', 'PECJ860521HVZRSN02', '67058607549', DATE '1986-05-21', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0124', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Karla Lizeth', 'Lozano', 'Alajara', 'Cadista Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LOAK991110487', 'LOAK991110MVZZLR07', '14139958483', DATE '1999-11-10', NULL, NULL,
  'MINATITLAN, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0125', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Kevin Alfredo', 'Álvarez', 'Santiago', 'Supervisor de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AASK980131P65', 'AASK980131HVZLNV07', '60169815655', DATE '1998-01-31', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0126', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Kevin Elián', 'Alejandro', 'Martínez', 'Supervisor de obra jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AEMK000410UL9', 'AEMK000410HTCLRVA5', '63150061255', DATE '2000-04-10', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0127', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Leonardo', 'Reyes', 'Luría', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RELL711214LY4', 'RELL711214HVZYRN04', '67887170701', DATE '1971-12-14', NULL, NULL,
  'Oteapan, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0128', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Leticia Andrea', 'Silva', 'Luna', 'Auxiliar contable Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SILL831130B83', 'SILL831130MVZLNT04', '67068308948', DATE '1983-11-30', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0129', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Lic. Mariana', 'Valdez', 'Soto', 'Analista de Capacitación & Anexos',
  'Rama Capacitación', DATE '2024-09-01', 'ACTIVO', 'Certificación Vigente', 'success',
  NULL, NULL, NULL, NULL, 'mariana.valdez@sifygsa.com.mx', NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DB2777'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0130', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Lilian Vanessa', 'Alcántara', 'Saviñón', 'Auxiliar administrativo Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AASL0205248X3', 'AASL020524MCHLVLA6', '49170245754', DATE '2002-05-24', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0131', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Lorena', 'Hernández', 'Vázquez', 'Auxiliar contable',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HEVL82082548A', 'HEVL820825MVZRZR04', '67048208234', DATE '1982-08-25', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0132', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Lorenzo Antonio', 'Rosas', 'Galindo', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'ROGL700604GAA', 'ROGL700604HVZSLR01', '67057003542', DATE '1970-06-04', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0133', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Adrian', 'Vazquez', 'Villagran', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VAVL880612EZ0', 'VAVL880612HVZZLS00', '03238838159', DATE '1988-06-12', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0134', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Alberto', 'Córdova', 'Martínez', 'Líder de Proyecto Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'COML881101FS2', 'COML881101HTCRRS07', '83138813072', DATE '1988-11-01', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0135', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Alberto', 'Pérez', 'Martínez', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PEML840416DH0', 'PEML840416HTCRRS08', '83018402111', DATE '1984-04-16', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0136', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Alberto Tosca', 'De La', 'O', 'Cadista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TOOL8505077A0', 'TOOL850507HTCSXS09', '83128500556', DATE '1985-05-07', NULL, NULL,
  'Jalpa de Méndez, Tab.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0137', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Antonio', 'Trinidad', 'Cruz', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TICL0411182X7', 'TICL041118HVZRRSA5', '25230413277', DATE '2004-11-18', NULL, NULL,
  'Ixhuatlán del Sureste, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0138', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis de Jesús', 'Salomón', 'Barrientos', 'Ayudante eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SABL021210338', 'SABL021210HVZLRSA7', '28160284536', DATE '2002-12-10', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0139', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Fernando', 'Vázquez', 'Torres', 'Estimacionista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'VATL940723TD6', 'VATL940723HTCZRS00', '19169404811', DATE '1994-07-23', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0140', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luis Pablo', 'Santiago', 'Morales', 'Cadista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAML980620128', 'SAML980620HVZNRS05', '43169868130', DATE '1998-06-20', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0141', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Luz Deneth', 'Morales', 'Vazquez', 'Auxiliar de RRHH Trainee',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MOVL0306122K9', 'MOVL030612MVZRZZA1', '68180378348', DATE '2003-06-12', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0142', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Manuel Jair', 'Jiménez', 'Ricardez', 'Técnico de servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'JIRM000702P38', 'JIRM000702HVZMCNA6', '61160049278', DATE '2000-07-02', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0143', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Marcos Kevin', 'Guillen', 'Martínez', 'Auxiliar de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GUMM991119DC8', 'GUMM991119HVZLRR09', '78169997877', DATE '1999-11-19', NULL, NULL,
  'Jáltipan, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0144', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'María Trinidad', 'González', 'Hernández', 'Intendencia',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOHT8510066Y6', 'GOHT851006MTCNRR03', '02198592822', DATE '1985-10-06', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0145', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Marlene Saraí', 'Alonso', 'Rodríguez', 'Ingeniero de Definición de Soluciones Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AORM930128B35', 'AORM930128MOCLDR05', '03169340670', DATE '1993-01-28', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0146', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Martín', 'Hernández', 'Zarrategui', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HEZM771111GB5', 'HEZM771111HVZRRR07', '67957791972', DATE '1977-11-11', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0147', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Marylib De La Paz Guadalupe', 'Aguilar', 'Pacheco', 'Ingeniero de servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AUPM980616623', 'AUPM980616MVZGCR09', '05189839961', DATE '1998-06-16', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0148', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Mayra Ixchel', 'González', 'Jara', 'Comprador Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOJM880503NN2', 'GOJM880503MVZNRY07', '05158899616', DATE '1988-05-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0149', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Miguel', 'Hernández', 'Camero', 'Técnico de Servicio Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HECM85100747A', 'HECM851007HTCRMG08', '02218532576', DATE '1985-10-07', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0150', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Miguel Jesús', 'Maldonado', 'Ruiz', 'Auxiliar de HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MARM020927IY0', 'MARM020927HVZLZGA5', '38170246888', DATE '2002-09-27', NULL, NULL,
  'Minatitlan, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0151', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Misael', 'Sánchez', 'González', 'Lider de contrato jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'SAGM8602124KA', 'SAGM860212HVZNNS02', '67088615082', DATE '1986-02-12', NULL, NULL,
  'Texistepec, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0152', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Mtra. Sofía', 'Morales', 'Ruiz', 'Coordinadora de Seguridad & Normatividad',
  'Cuadrilla Alfa (Almacén Principal)', DATE '2022-09-12', 'ACTIVO', 'Certificación Vigente', 'success',
  NULL, NULL, NULL, NULL, 'sofia.morales@sifygsa.com.mx', NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0153', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Natanael', 'Domínguez', 'Pérez', 'Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'DOPN860714D38', 'DOPN860714HVZMRT09', '67068635647', DATE '1986-07-14', NULL, NULL,
  'Oteapan, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0154', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Octavio', 'Bartolo', 'Antonio', 'Tubero Eléctrico Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'BAAO7201273C2', 'BAAO720127HVZRNC05', '67897255179', DATE '1972-01-27', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0155', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'ÔÉ2', NULL, NULL, 'Por definir',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'DIR'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0156', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Omar Jaziel', 'Martínez', 'Martínez', 'Técnico de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MAMX910205KZ2', 'MXMO910205HVZRRM09', '67079103684', DATE '1991-02-05', NULL, NULL,
  'COSOLEACAQUE, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0157', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Oscar', 'Alor', 'Prieto', 'Ayudante eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AOPO0305171F3', 'AOPO030517HVZLRSA7', '35210301335', DATE '2003-05-17', NULL, NULL,
  'MINATITLAN, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0158', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Oscar De Jesús', 'Tepox', 'Cocuyo', 'Encargado de Mantenimiento Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TECO9206064Z7', 'TECO920606HVZPCS02', '67089203680', DATE '1992-06-06', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0159', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Oscar Guillermo', 'Posada', 'Bolan', 'Técnico de Servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'POBO921122BW7', 'POBO921122HVZSLS01', '02169278476', DATE '1992-11-22', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0160', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Osvaldo Arath', 'Rafael', 'López', 'Auxiliar de RRHH trainee',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RALO030425T19', 'RALO030425HVZFPSA5', '49210352065', DATE '2003-04-25', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0161', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Pablo Alejandro', 'López', 'Hernández', 'Ayudante Eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LOHP0007134M9', 'LOHP000713HTCPRBA8', '04130066469', DATE '2000-07-13', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0162', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Pedro Josué', 'Benitez', 'Parada', 'Lider de contrato Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'BEPP8906258K2', 'BEPP890625HVZNRD06', '67118922144', DATE '1989-06-25', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0163', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Porfirio Alberto', 'Luna', 'Magaña', 'Supervisor HSE Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LUMP910124HW1', 'LUMP910124HTCNGR06', '83119105340', DATE '1991-01-24', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0164', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Rigoberto Javier', 'De la', 'cruz', 'Cadista Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'JACR000705MV8', 'JACR000705HTCVRGA6', '83150026256', DATE '2000-07-05', NULL, NULL,
  'Paraíso, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0165', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Roberto Carlos', 'Lara', 'Torres', 'Supervisor de obra sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'LATR80033088A', 'LATR800330HVZRRB06', '67018018100', DATE '1980-03-30', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0166', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Roberto Carlos', 'Méndez', 'Santiago', 'Ayudante Eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'MESR8404118U0', 'MESR840411HTCNNB07', '83058411451', DATE '1984-04-11', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0167', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Rodolfo', 'Zapata', NULL, 'Ayudante Eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'ZARO740326FP7', 'ZAXR740326HVZPXD00', '67927460906', DATE '1974-03-26', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0168', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Rómulo Enrique', 'Peña', 'Gilson', 'Vígilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PEGR7108243W6', 'PEGR710824HNEXLM02', '02187185372', DATE '1971-08-24', NULL, NULL,
  'Tabasco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0169', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Rusbel', 'Ramos', 'López', 'Ayudante eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'RARL750921DM5', NULL, '67957556151', NULL, NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#0891B2'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0170', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Ruth Abigail', 'Joachin', 'Prieto', 'Intendencia',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'JOPR840926J53', 'JOPR840926MVZCRT02', '67068419810', DATE '1984-09-26', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0171', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Rutilo Pérez', 'De la', 'Cruz', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PECR890905G20', 'PECR890905HTCRRT09', '83108926904', DATE '1989-09-05', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0172', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Salvador Alberto De la', 'Cruz', 'Alcudia', 'Encargado de Mantenimiento Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUAS031006PY2', 'CUAS031006HTCRLLA2', '26170351220', DATE '2003-10-06', NULL, NULL,
  'Tabasco, Tab.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0173', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Salvador Iván', 'Gómez', 'Guerrero', 'Logística',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GOGS780606IP9', 'GOGS780606HVZMRL03', '67067806215', DATE '1978-06-06', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0174', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Salvador', 'Patraca', 'Ramírez', 'Técnico de servicios Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PARS961223US9', 'PARS961223HVZTML07', '13169684654', DATE '1996-12-23', NULL, NULL,
  'CORDOBA, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ING'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0175', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Santiago', 'Fuentes', 'Cruz', 'Vigilante',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'FUCS710724RB9', 'FUCS710724HVZNRN00', '67897157870', DATE '1971-07-24', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0176', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Sebastián', 'Preciado', 'Alvarado', 'Ingeniero de Ventas Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'PEAS970602IN1', 'PEAS970602HVZRLB05', '29169767992', DATE '1997-06-02', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0177', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Sergio', 'Arias', 'Domínguez', 'ayudante eléctrico',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AIDS890506983', 'AIDS890506HTCRMR03', '83088948449', DATE '1989-05-06', NULL, NULL,
  'Paraíso, Tab.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0178', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Sergio', 'Arias', 'Montejo', 'Supervisor de obra Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AIMS760930B92', 'AIMS760930HTCRNR08', '83917617819', DATE '1976-09-30', NULL, NULL,
  'Comalcalco, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0179', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Sergio', 'Del Campo', 'Yzquierdo', 'Auxiliar Estimacionista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CAYS9406149C5', 'CAYS940614HTCMZR03', '10189448177', DATE '1994-06-14', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0180', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Sheyla Irais', 'Troncoso', 'Vidal', 'Auxiliar de RRHH Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'TOVS900806RA6', 'TOVS900806MVZRDH01', '67099011875', DATE '1990-08-06', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#DC2626'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'RH'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0181', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Uriel Eduardo', 'Gerónimo', 'Dionisio', 'Ingeniero de Diseño Jr.',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'GEDU9501176B5', 'GEDU950117HTCRNR02', '08169503623', DATE '1995-01-17', NULL, NULL,
  'Villahermosa, Tab.', NULL, NULL, NULL, '#059669'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0182', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Uriel Isaí', 'Cruz', 'Cancino', 'Laminador',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUCU001228631', 'CUCU001228HVZRNRA2', '23160048049', DATE '2000-12-28', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#BE185D'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0183', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Víctor Iván', 'Hernández', 'Castelan', 'Ingeniero de volumetrías Trainee',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'HECV940710T17', 'HECV940710HVZRSC01', '67139429178', DATE '1994-07-10', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0184', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Víctor Manuel', 'Alegría', 'Palacios', 'Ingeniero de volumetrías Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'AEPV780412JI5', 'AEPV780412HVZLLC01', '67067801810', DATE '1978-04-12', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'VTA'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0185', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Víctor Manuel', 'Zunun', 'Gómez', 'Líder de Contrato Sr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'ZUGV870605US1', 'ZUGV870605HVZNMC00', '67078735528', DATE '1987-06-05', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0186', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Victoria', 'Broca', 'Rabanales', 'Intendencia MSA',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'BORV840108I5A', 'BORV840108MTCRBC04', '02258429006', DATE '1984-01-08', NULL, NULL,
  'Comalcalco, Tab.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'COM'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0187', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Viridiana', 'Cárdenas', 'Hernández', 'Auxiliar administrativo Jr',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CAHV920207MF7', 'CAHV920207MVZRRR03', '19169202280', DATE '1992-02-07', NULL, NULL,
  'Cosoleacaque, Ver.', NULL, NULL, NULL, '#D97706'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0188', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Waldo Isidro De La', 'Cruz', 'Ruíz', 'Almacenista',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CURW800521ALA', 'CURW800521HVZRZL05', '48068014793', DATE '1980-05-21', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#0284C7'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'COM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0189', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Yesenia Yazbeth', 'Cruz', 'Salomón', 'Supervisor de HSE Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUSY9303255X8', 'CUSY930325MVZRLS08', '03149377511', DATE '1993-03-25', NULL, NULL,
  'Coatzacoalcos, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'HSE-MIN'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0190', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Zaidel', 'Cruz', 'Martínez', 'Encargado de Mantenimiento Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CUMZ8409039W4', 'CUMZ840903HVZRRD08', '32028447038', DATE '1984-09-03', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'INF'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0191', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Zimrry Tamar', 'Francisco', 'Reyes', 'Auxiliar contable Ss',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'FARZ011115PM4', 'FARZ011115MOCRYMA2', '44160147656', DATE '2001-11-15', NULL, NULL,
  'Soconusco, Ver.', NULL, NULL, NULL, '#1D4ED8'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'ADM'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

INSERT INTO rrhh.empleados (
  folio, id_empresa, id_departamento, id_sede,
  nombre_pila, apellido_paterno, apellido_materno, puesto_texto,
  categoria_laboral, fecha_ingreso, estatus, acreditacion_sil, acreditacion_tipo,
  rfc, curp, nss, fecha_nacimiento, correo_corporativo, telefono_celular,
  ubicacion_texto, tipo_sangre, talla_calzado_mex, talla_overol, avatar_color
)
SELECT 'SFG-0192', emp.id_empresa, dep.id_departamento, sed.id_sede,
  'Zurisadai', 'Castañeda', 'Hernández', 'Auxiliar Administrativo Jr.',
  NULL, DATE '2026-11-20', 'ACTIVO', 'En Trámite', 'info',
  'CAHZ020814KI8', 'CAHZ020814MVZSRRA5', '54170235870', DATE '2002-08-14', NULL, NULL,
  'Minatitlán, Ver.', NULL, NULL, NULL, '#7C3AED'
FROM core.empresas emp
JOIN rrhh.departamentos dep ON dep.codigo = 'SRV'
LEFT JOIN core.sedes sed ON sed.codigo = 'MIN'
WHERE emp.codigo = 'SIFYGSA'
ON CONFLICT (folio) DO NOTHING;

-- 2. Enlace de jerarquía del Organigrama (id_supervisor)
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0002' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0003' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0004' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0005' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0006' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0007' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0008' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0009' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0010' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0011' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0012' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0013' AND s.folio = 'SFG-0002';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0014' AND s.folio = 'SFG-0002';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0015' AND s.folio = 'SFG-0003';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0016' AND s.folio = 'SFG-0109';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0017' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0018' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0019' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0020' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0021' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0022' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0023' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0024' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0025' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0026' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0027' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0028' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0029' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0030' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0031' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0032' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0033' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0034' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0035' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0036' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0037' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0038' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0039' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0040' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0041' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0042' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0043' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0044' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0045' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0046' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0047' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0049' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0050' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0051' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0052' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0053' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0054' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0055' AND s.folio = 'SFG-0013';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0056' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0057' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0058' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0059' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0060' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0061' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0062' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0063' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0064' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0065' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0067' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0068' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0069' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0070' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0071' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0073' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0074' AND s.folio = 'SFG-0001';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0075' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0076' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0077' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0078' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0079' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0080' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0081' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0082' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0083' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0084' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0085' AND s.folio = 'SFG-0011';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0086' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0087' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0088' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0089' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0090' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0091' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0092' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0093' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0094' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0095' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0096' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0097' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0098' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0099' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0100' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0101' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0102' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0103' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0104' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0105' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0106' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0107' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0108' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0109' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0110' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0111' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0112' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0113' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0114' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0115' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0116' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0117' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0118' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0119' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0120' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0121' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0122' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0123' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0124' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0125' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0126' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0127' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0128' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0129' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0130' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0131' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0132' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0133' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0134' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0135' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0136' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0137' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0138' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0139' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0140' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0141' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0142' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0143' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0144' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0145' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0146' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0147' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0148' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0149' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0150' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0151' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0152' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0153' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0154' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0156' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0157' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0158' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0159' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0160' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0161' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0162' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0163' AND s.folio = 'SFG-0010';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0164' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0165' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0166' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0167' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0168' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0169' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0170' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0171' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0172' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0173' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0174' AND s.folio = 'SFG-0004';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0175' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0176' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0177' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0178' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0179' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0180' AND s.folio = 'SFG-0009';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0181' AND s.folio = 'SFG-0013';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0182' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0183' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0184' AND s.folio = 'SFG-0014';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0185' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0186' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0187' AND s.folio = 'SFG-0015';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0188' AND s.folio = 'SFG-0005';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0189' AND s.folio = 'SFG-0006';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0190' AND s.folio = 'SFG-0007';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0191' AND s.folio = 'SFG-0008';
UPDATE rrhh.empleados e SET id_supervisor = s.id_empleado FROM rrhh.empleados s WHERE e.folio = 'SFG-0192' AND s.folio = 'SFG-0015';

-- 3. Asignar responsables oficiales (VIPSALeaders) a cada departamento
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'DIR'     AND e.folio = 'SFG-0001';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'VTA'     AND e.folio = 'SFG-0002';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'SRV'     AND e.folio = 'SFG-0003';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'ING'     AND e.folio = 'SFG-0004';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'COM'     AND e.folio = 'SFG-0005';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'HSE-MIN' AND e.folio = 'SFG-0006';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'CAL'     AND e.folio = 'SFG-0006';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'INF'     AND e.folio = 'SFG-0007';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'ADM'     AND e.folio = 'SFG-0008';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'RH'      AND e.folio = 'SFG-0009';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'HSE-COM' AND e.folio = 'SFG-0010';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'MCP'     AND e.folio = 'SFG-0011';
UPDATE rrhh.departamentos d SET id_responsable = e.id_empleado FROM rrhh.empleados e WHERE d.codigo = 'GSAPE'   AND e.folio = 'SFG-0012';

-- 4. Sincronizar contador de folios atómico al máximo cargado (SFG-0192 -> siguiente SFG-0193)
SELECT rrhh.fn_sincronizar_folio_empleados();

COMMIT;
